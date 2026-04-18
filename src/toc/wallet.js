/**
 * Swibe ToC Wallet — Phase 7: Agent Wallets with Neural Birth Endowment
 * Every agent born receives 86B Dopamine + 86M Synapse (neural layer mapping)
 *
 * Birth endowment is triggered by OSOVM op_agent_birth (0x3e).
 * The VM locks 10 Àṣẹ from the creator and emits the endowment signal.
 * Swibe applies the signal — agents never mint their own tokens.
 */

import { EventEmitter } from 'events';
import { TOKEN_TYPE, TOKEN_CONFIG, TokenLedger } from './token.js';

const BIRTH_ENDOWMENT = {
  [TOKEN_TYPE.TOC_D]: 86_000_000_000,
  [TOKEN_TYPE.TOC_S]: 86_000_000,
};

/** Fixed Àṣẹ cost per agent birth — enforced at OSOVM, referenced here */
export const AGENT_BIRTH_FEE_ASE = 10;

export class Wallet extends EventEmitter {
  constructor(ownerId, ownerType = 'agent', ledger = null) {
    super();
    this.ownerId = ownerId;
    this.ownerType = ownerType;
    this.ledger = ledger || new TokenLedger();
    this.created = Date.now();
    this.lastDecay = Date.now();
    this.locked = {};
    this.cooldowns = {};
  }

  /**
   * Apply birth endowment from OSOVM signal.
   * Called when OSOVM op_agent_birth (0x3e) succeeds — VM locked 10 Àṣẹ,
   * now Swibe mints the neural endowment. Agent never self-mints.
   * @param {object} vmSignal - Optional signal from OSOVM with endowment amounts
   */
  birth(vmSignal = null) {
    if (this.ownerType !== 'agent') {
      throw new Error('Only agents receive birth endowment');
    }
    const dopamine = vmSignal?.dopamine_endowment || BIRTH_ENDOWMENT[TOKEN_TYPE.TOC_D];
    const synapse = vmSignal?.synapse_endowment || BIRTH_ENDOWMENT[TOKEN_TYPE.TOC_S];
    // Mint from VM signal — these are the only tokens minted at birth, ever
    this.ledger.mint(this.ownerId, TOKEN_TYPE.TOC_D, dopamine, 'vm_birth');
    this.ledger.mint(this.ownerId, TOKEN_TYPE.TOC_S, synapse, 'vm_birth');
    this.emit('birth', {
      ownerId: this.ownerId,
      dopamine,
      synapse,
      source: 'osovm_agent_birth',
      aseLocked: AGENT_BIRTH_FEE_ASE,
    });
    return this;
  }

  balance(token) {
    return this.ledger.balance(this.ownerId, token);
  }

  balances() {
    return {
      ase: this.ledger.balance(this.ownerId, TOKEN_TYPE.ASE),
      toc_d: this.ledger.balance(this.ownerId, TOKEN_TYPE.TOC_D),
      toc_s: this.ledger.balance(this.ownerId, TOKEN_TYPE.TOC_S),
    };
  }

  receive(token, amount, source = 'internal') {
    this.ledger.mint(this.ownerId, token, amount, source);
    this.emit('receive', { token, amount, source });
  }

  receiveFromVM(dopamineAmount) {
    this.ledger.mint(this.ownerId, TOKEN_TYPE.TOC_D, dopamineAmount, 'vm_conversion');
    this.emit('vm_conversion', { dopamine: dopamineAmount });
  }

  spend(token, amount) {
    this.ledger.burn(this.ownerId, token, amount);
    this.emit('spend', { token, amount });
  }

  transfer(to, token, amount) {
    this.ledger.transfer(this.ownerId, to, token, amount);
    this.emit('transfer', { to, token, amount });
  }

  lock(token, amount, reason = 'stake') {
    const bal = this.balance(token);
    if (bal < amount) throw new Error(`Cannot lock ${amount} ${token}: balance is ${bal}`);
    const key = `${token}:${reason}`;
    this.locked[key] = (this.locked[key] || 0) + amount;
    this.ledger.burn(this.ownerId, token, amount);
    this.emit('lock', { token, amount, reason });
  }

  unlock(token, reason = 'stake') {
    const key = `${token}:${reason}`;
    const amount = this.locked[key] || 0;
    if (amount === 0) throw new Error(`Nothing locked for ${key}`);
    this.locked[key] = 0;
    this.ledger.mint(this.ownerId, token, amount);
    this.emit('unlock', { token, amount, reason });
    return amount;
  }

  lockedAmount(token, reason = 'stake') {
    return this.locked[`${token}:${reason}`] || 0;
  }

  applyDecay() {
    const now = Date.now();
    const dayMs = 86_400_000;
    const elapsed = now - this.lastDecay;
    if (elapsed < dayMs) return 0;

    const days = Math.floor(elapsed / dayMs);
    const bal = this.balance(TOKEN_TYPE.TOC_D);
    const decayRate = TOKEN_CONFIG[TOKEN_TYPE.TOC_D].dailyDecay;
    const decayAmount = Math.floor(bal * decayRate * days);

    if (decayAmount > 0) {
      this.ledger.burn(this.ownerId, TOKEN_TYPE.TOC_D, decayAmount);
      this.emit('decay', { amount: decayAmount, days });
    }

    this.lastDecay = now;
    return decayAmount;
  }

  setCooldown(action, durationMs) {
    this.cooldowns[action] = Date.now() + durationMs;
  }

  canAct(action) {
    const cd = this.cooldowns[action];
    if (!cd) return true;
    return Date.now() >= cd;
  }

  history(limit = 50) {
    return this.ledger.getHistory(this.ownerId, limit);
  }
}

export class WalletRegistry {
  constructor() {
    this.ledger = new TokenLedger();
    this.wallets = new Map();
  }

  createAgent(agentId, vmSignal = null) {
    if (this.wallets.has(agentId)) {
      throw new Error(`Wallet already exists for ${agentId}`);
    }
    const wallet = new Wallet(agentId, 'agent', this.ledger);
    wallet.birth(vmSignal);
    this.wallets.set(agentId, wallet);
    return wallet;
  }

  createHuman(userId) {
    if (this.wallets.has(userId)) {
      throw new Error(`Wallet already exists for ${userId}`);
    }
    const wallet = new Wallet(userId, 'human', this.ledger);
    this.wallets.set(userId, wallet);
    return wallet;
  }

  get(id) {
    return this.wallets.get(id) || null;
  }

  getSupply() {
    return this.ledger.getSupply();
  }

  getBurned() {
    return this.ledger.getBurned();
  }
}
