/**
 * Swibe ToC Staking/Slashing — Phase 7
 * Agents stake Synapse to offer services, slashed on fraud
 * Creators stake Àṣẹ to register agents, slashed on bad agents
 */

import { EventEmitter } from 'events';
import { TOKEN_TYPE } from './token.js';

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
}
