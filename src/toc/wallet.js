/**
 * Swibe ToC Wallet — Phase 7: Agent Wallets with Neural Birth Endowment
 * Every agent born receives 86B Dopamine + 86M Synapse (neural layer mapping)
 */

import { EventEmitter } from 'events';
import { TOKEN_TYPE, TOKEN_CONFIG, TokenLedger } from './token.js';

const BIRTH_ENDOWMENT = {
  [TOKEN_TYPE.TOC_D]: 86_000_000_000,
  [TOKEN_TYPE.TOC_S]: 86_000_000,
};

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

  birth() {
    if (this.ownerType !== 'agent') {
      throw new Error('Only agents receive birth endowment');
    }
    this.ledger.mint(this.ownerId, TOKEN_TYPE.TOC_D, BIRTH_ENDOWMENT[TOKEN_TYPE.TOC_D]);
    this.ledger.mint(this.ownerId, TOKEN_TYPE.TOC_S, BIRTH_ENDOWMENT[TOKEN_TYPE.TOC_S]);
    this.emit('birth', {
      ownerId: this.ownerId,
      dopamine: BIRTH_ENDOWMENT[TOKEN_TYPE.TOC_D],
      synapse: BIRTH_ENDOWMENT[TOKEN_TYPE.TOC_S],
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

  receive(token, amount) {
    this.ledger.mint(this.ownerId, token, amount);
    this.emit('receive', { token, amount });
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

  createAgent(agentId) {
    if (this.wallets.has(agentId)) {
      throw new Error(`Wallet already exists for ${agentId}`);
    }
    const wallet = new Wallet(agentId, 'agent', this.ledger);
    wallet.birth();
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
