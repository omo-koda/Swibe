/**
 * Swibe ToC Conversion Engine — Phase 7: Burn Conversions
 * Àṣẹ → Dopamine (one-way, 1:10000)
 * Dopamine → Synapse (one-way, 10:1)
 * Synapse → Dopamine (emergency, 1:5, 50% tax, 24h cooldown)
 */

import { EventEmitter } from 'events';
import { TOKEN_TYPE } from './token.js';

const CONVERSION_RULES = {
  ase_to_dopamine: {
    from: TOKEN_TYPE.ASE,
    to: TOKEN_TYPE.TOC_D,
    ratio: 10_000,
    direction: 'one_way',
    agentOnly: true,
    tax: 0,
    cooldownMs: 0,
  },
  dopamine_to_synapse: {
    from: TOKEN_TYPE.TOC_D,
    to: TOKEN_TYPE.TOC_S,
    ratio: 0.1,
    direction: 'one_way',
    agentOnly: true,
    tax: 0,
    cooldownMs: 0,
  },
  synapse_to_dopamine: {
    from: TOKEN_TYPE.TOC_S,
    to: TOKEN_TYPE.TOC_D,
    ratio: 5,
    direction: 'one_way',
    agentOnly: true,
    tax: 0.5,
    cooldownMs: 86_400_000,
    purpose: 'emergency_fuel',
  },
};

export class ConversionEngine extends EventEmitter {
  constructor(walletRegistry) {
    super();
    this.registry = walletRegistry;
    this.rules = { ...CONVERSION_RULES };
    this.history = [];
  }

  convert(agentId, ruleKey, amount) {
    const rule = this.rules[ruleKey];
    if (!rule) throw new Error(`Unknown conversion: ${ruleKey}`);

    const wallet = this.registry.get(agentId);
    if (!wallet) throw new Error(`No wallet for ${agentId}`);

    if (rule.agentOnly && wallet.ownerType !== 'agent') {
      throw new Error(`Only agents can perform ${ruleKey} conversion`);
    }

    if (rule.cooldownMs > 0 && !wallet.canAct(ruleKey)) {
      throw new Error(`Conversion ${ruleKey} on cooldown`);
    }

    const fromBalance = wallet.balance(rule.from);
    if (fromBalance < amount) {
      throw new Error(`Insufficient ${rule.from}: have ${fromBalance}, need ${amount}`);
    }

    wallet.spend(rule.from, amount);

    let outputAmount = Math.floor(amount * rule.ratio);
    let taxAmount = 0;

    if (rule.tax > 0) {
      taxAmount = Math.floor(outputAmount * rule.tax);
      outputAmount -= taxAmount;
      this.emit('tax', { agentId, ruleKey, taxAmount, token: rule.to });
    }

    wallet.receive(rule.to, outputAmount);

    if (rule.cooldownMs > 0) {
      wallet.setCooldown(ruleKey, rule.cooldownMs);
    }

    const record = {
      agentId,
      rule: ruleKey,
      from: rule.from,
      to: rule.to,
      inputAmount: amount,
      outputAmount,
      taxBurned: taxAmount,
      timestamp: Date.now(),
    };
    this.history.push(record);
    this.emit('conversion', record);

    return record;
  }

  aseToDopamine(agentId, aseAmount) {
    return this.convert(agentId, 'ase_to_dopamine', aseAmount);
  }

  dopamineToSynapse(agentId, dopamineAmount) {
    return this.convert(agentId, 'dopamine_to_synapse', dopamineAmount);
  }

  synapseToDopamine(agentId, synapseAmount) {
    return this.convert(agentId, 'synapse_to_dopamine', synapseAmount);
  }

  getHistory(agentId = null, limit = 50) {
    const filtered = agentId
      ? this.history.filter(h => h.agentId === agentId)
      : this.history;
    return filtered.slice(-limit);
  }
}
