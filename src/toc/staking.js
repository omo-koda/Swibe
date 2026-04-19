/**
 * Swibe ToC Staking/Slashing — Phase 7+
 * Agents stake Synapse to offer services, slashed on fraud
 * Creators stake Àṣẹ to register agents, slashed on bad agents
 *
 * Hardening:
 * - Agents must stake 10% of Synapse to run `pilot` or `mint`
 * - Slashing on ethics violations or budget overruns
 */

import { EventEmitter } from 'events';
import { TOKEN_TYPE } from './token.js';

// Minimum stake (as fraction of current Synapse balance) to use gated primitives
const GATED_STAKE_FRACTION = 0.10;
const GATED_PRIMITIVES = ['pilot', 'mint'];

export class StakingEngine extends EventEmitter {
  constructor(walletRegistry) {
    super();
    this.registry = walletRegistry;
    this.stakes = new Map();
    this.slashHistory = [];
  }

  stake(holderId, token, amount, purpose = 'service') {
    const wallet = this.registry.get(holderId);
    if (!wallet) throw new Error(`No wallet for ${holderId}`);

    wallet.lock(token, amount, purpose);

    const key = `${holderId}:${token}:${purpose}`;
    const prev = this.stakes.get(key) || { amount: 0, since: Date.now() };
    this.stakes.set(key, { amount: prev.amount + amount, since: prev.since });

    this.emit('stake', { holderId, token, amount, purpose });
    return { holderId, token, amount, purpose, total: prev.amount + amount };
  }

  unstake(holderId, token, purpose = 'service') {
    const wallet = this.registry.get(holderId);
    if (!wallet) throw new Error(`No wallet for ${holderId}`);

    const key = `${holderId}:${token}:${purpose}`;
    const stakeInfo = this.stakes.get(key);
    if (!stakeInfo || stakeInfo.amount === 0) {
      throw new Error(`No stake found for ${key}`);
    }

    const amount = wallet.unlock(token, purpose);
    this.stakes.set(key, { amount: 0, since: null });

    this.emit('unstake', { holderId, token, amount, purpose });
    return { holderId, token, amount, purpose };
  }

  slash(holderId, token, percentage, reason, purpose = 'service') {
    const key = `${holderId}:${token}:${purpose}`;
    const stakeInfo = this.stakes.get(key);
    if (!stakeInfo || stakeInfo.amount === 0) {
      throw new Error(`No stake to slash for ${key}`);
    }

    const slashAmount = Math.floor(stakeInfo.amount * (percentage / 100));
    stakeInfo.amount -= slashAmount;
    this.stakes.set(key, stakeInfo);

    const record = {
      holderId,
      token,
      slashAmount,
      percentage,
      reason,
      remaining: stakeInfo.amount,
      timestamp: Date.now(),
    };
    this.slashHistory.push(record);
    this.emit('slash', record);

    return record;
  }

  getStake(holderId, token, purpose = 'service') {
    const key = `${holderId}:${token}:${purpose}`;
    return this.stakes.get(key) || { amount: 0, since: null };
  }

  getAllStakes(holderId) {
    const result = [];
    for (const [key, info] of this.stakes) {
      if (key.startsWith(`${holderId}:`)) {
        const [, token, purpose] = key.split(':');
        result.push({ token, purpose, ...info });
      }
    }
    return result;
  }

  getSlashHistory(holderId = null) {
    return holderId
      ? this.slashHistory.filter(s => s.holderId === holderId)
      : this.slashHistory;
  }

  totalStaked(token) {
    let total = 0;
    for (const [key, info] of this.stakes) {
      if (key.includes(`:${token}:`)) total += info.amount;
    }
    return total;
  }

  /**
   * Check if an agent has sufficient stake to use a gated primitive.
   * Agents must stake 10% of their Synapse balance for pilot/mint.
   * @param {string} agentId
   * @param {string} primitive — 'pilot', 'mint', etc.
   * @returns {{ allowed: boolean, required: number, staked: number, reason: string }}
   */
  requireStake(agentId, primitive) {
    if (!GATED_PRIMITIVES.includes(primitive)) {
      return { allowed: true, required: 0, staked: 0, reason: 'Not a gated primitive' };
    }

    const wallet = this.registry.get(agentId);
    if (!wallet) return { allowed: false, required: 0, staked: 0, reason: `No wallet for ${agentId}` };

    const synapseBalance = wallet.balance(TOKEN_TYPE.TOC_S);
    const required = Math.ceil(synapseBalance * GATED_STAKE_FRACTION);
    const currentStake = this.getStake(agentId, TOKEN_TYPE.TOC_S, primitive);

    if (currentStake.amount >= required && required > 0) {
      return { allowed: true, required, staked: currentStake.amount, reason: 'Stake sufficient' };
    }

    return {
      allowed: false,
      required,
      staked: currentStake.amount,
      reason: `Insufficient stake for ${primitive}: need ${required} TOC-S (10% of ${synapseBalance}), have ${currentStake.amount} staked`,
    };
  }

  /**
   * Slash Dopamine for ethics or budget violation.
   * @param {string} agentId
   * @param {'ethics'|'budget'} violationType
   * @param {string} detail — description of the violation
   * @returns {object} slash record
   */
  slashForViolation(agentId, violationType, detail = '') {
    const percentages = { ethics: 25, budget: 10 };
    const pct = percentages[violationType] || 10;

    // Slash from Dopamine balance directly (no stake required)
    const wallet = this.registry.get(agentId);
    if (!wallet) throw new Error(`No wallet for ${agentId}`);

    const dopBalance = wallet.balance(TOKEN_TYPE.TOC_D);
    const slashAmount = Math.floor(dopBalance * (pct / 100));

    if (slashAmount > 0) {
      wallet.spend(TOKEN_TYPE.TOC_D, slashAmount, `slash_${violationType}`);
    }

    const record = {
      holderId: agentId,
      token: TOKEN_TYPE.TOC_D,
      slashAmount,
      percentage: pct,
      reason: `${violationType}: ${detail}`,
      remaining: dopBalance - slashAmount,
      timestamp: Date.now(),
    };
    this.slashHistory.push(record);
    this.emit('slash', record);
    return record;
  }
}

export { GATED_PRIMITIVES, GATED_STAKE_FRACTION };
