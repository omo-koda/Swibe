/**
 * Swibe ToC Token Definitions — Phase 7: Tokenomics
 * Three-token economy: Àṣẹ (human), Dopamine/ToC-D (agent internal), Synapse/ToC-S (agent commerce)
 */

export const TOKEN_TYPE = {
  ASE: 'ase',
  TOC_D: 'toc_d',
  TOC_S: 'toc_s',
};

export const TOKEN_CONFIG = {
  [TOKEN_TYPE.ASE]: {
    name: 'Àṣẹ',
    symbol: 'ASE',
    description: 'External sacred fuel — human entry token',
    holders: 'humans_and_creators',
    dailyMint: 1440,
    fixedSupply: true,
    transferable: true,
    burnRate: 0.05,
  },
  [TOKEN_TYPE.TOC_D]: {
    name: 'Dopamine',
    symbol: 'TOC-D',
    description: 'Internal life-force — agent motivation and action fuel',
    holders: 'agents_only',
    birthEndowment: 86_000_000_000,
    transferable: false,
    dailyDecay: 0.01,
    earnedFrom: ['task_rewards', 'ase_conversion'],
    burnedFor: ['actions', 'synapse_conversion'],
  },
  [TOKEN_TYPE.TOC_S]: {
    name: 'Synapse',
    symbol: 'TOC-S',
    description: 'Inter-agent commerce — agent-to-agent speech',
    holders: 'agents_only',
    birthEndowment: 86_000_000,
    transferable: true,
    earnedFrom: ['dopamine_conversion', 'service_payment'],
    burnedFor: ['service_payment', 'staking', 'emergency_dopamine'],
  },
};

export class TokenLedger {
  constructor() {
    this.balances = new Map();
    this.totalSupply = {
      [TOKEN_TYPE.ASE]: 0,
      [TOKEN_TYPE.TOC_D]: 0,
      [TOKEN_TYPE.TOC_S]: 0,
    };
    this.burnedTotal = {
      [TOKEN_TYPE.ASE]: 0,
      [TOKEN_TYPE.TOC_D]: 0,
      [TOKEN_TYPE.TOC_S]: 0,
    };
    this.transactions = [];
  }

  _key(holder, token) {
    return `${holder}:${token}`;
  }

  balance(holder, token) {
    return this.balances.get(this._key(holder, token)) || 0;
  }

  mint(holder, token, amount) {
    if (amount <= 0) throw new Error('Mint amount must be positive');
    const key = this._key(holder, token);
    const prev = this.balances.get(key) || 0;
    this.balances.set(key, prev + amount);
    this.totalSupply[token] += amount;
    this.transactions.push({ type: 'mint', holder, token, amount, timestamp: Date.now() });
  }

  burn(holder, token, amount) {
    const key = this._key(holder, token);
    const prev = this.balances.get(key) || 0;
    if (prev < amount) throw new Error(`Insufficient ${token}: have ${prev}, need ${amount}`);
    this.balances.set(key, prev - amount);
    this.totalSupply[token] -= amount;
    this.burnedTotal[token] += amount;
    this.transactions.push({ type: 'burn', holder, token, amount, timestamp: Date.now() });
  }

  transfer(from, to, token, amount) {
    const config = TOKEN_CONFIG[token];
    if (!config.transferable) throw new Error(`${token} is non-transferable`);
    this.burn(from, token, amount);
    this.mint(to, token, amount);
    this.transactions.push({ type: 'transfer', from, to, token, amount, timestamp: Date.now() });
  }

  getSupply() {
    return { ...this.totalSupply };
  }

  getBurned() {
    return { ...this.burnedTotal };
  }

  getHistory(holder, limit = 50) {
    return this.transactions
      .filter(t => t.holder === holder || t.from === holder || t.to === holder)
      .slice(-limit);
  }
}
