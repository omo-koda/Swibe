/**
 * Technosis Sovereign Conductor
 *
 * Orchestrates the born agent's full cognition loop:
 *   identity (vault) → neural routing → think/speak/call → soul receipt
 *
 * This is the wire between SovereignAgent, SovereignNeuralLayer,
 * LLMIntegration, and the adapter layer (seemplify, oso, ...).
 */

import crypto from 'node:crypto';
import { sovereign } from './sovereign-vault.js';
import { SovereignNeuralLayer } from './neural.js';
import { LLMIntegration } from './llm-integration.js';

// Ordered by routing preference; neural prefrontal weights select among these
const MODEL_ROSTER = ['ollama', 'claude', 'mock'];

export class TechnosisConductor {
  /**
   * @param {{ identity, neuralParams, seed }} agentData - from sovereign.createAgentAtBirth()
   */
  constructor(agentData) {
    this.identity = agentData.identity;
    this.neural = new SovereignNeuralLayer(agentData.neuralParams);
    this.seed = agentData.seed;
    this.llm = new LLMIntegration();
    this.adapters = {};
    this._log = [];
  }

  // -- Adapter registry --

  loadAdapter(name, impl) {
    this.adapters[name] = impl;
  }

  // -- Core primitives --

  /**
   * think: route prompt to best model via prefrontal weights, return content + signed receipt
   */
  async think(prompt, _opts = {}) {
    const routing = await this.neural.route(prompt, MODEL_ROSTER);
    const best = routing[0]?.model ?? 'claude';

    const prev = this.llm.provider;
    this.llm.provider = best === 'ollama' ? 'ollama' : 'claude';
    const { content, receipt } = await this.llm.think(prompt);
    this.llm.provider = prev;

    const sig = sovereign.sign(receipt, this.identity.priv);
    this._log.push({ type: 'think', prompt, receipt, sig, model: best });
    return content;
  }

  /**
   * speak: emit to stdout and log
   */
  speak(message) {
    process.stdout.write(`[SPEAK] ${message}\n`);
    this._log.push({ type: 'speak', message });
    return message;
  }

  /**
   * call: dispatch to named adapter method
   */
  async call(adapterName, method, ...args) {
    const adapter = this.adapters[adapterName];
    if (!adapter) throw new Error(`Conductor: adapter '${adapterName}' not loaded`);
    if (typeof adapter[method] !== 'function') {
      throw new Error(`Conductor: '${adapterName}.${method}' is not a function`);
    }
    const result = await adapter[method](...args);
    this._log.push({ type: 'call', adapterName, method, args, result });
    return result;
  }

  // -- Main loop (mirrors universal_swibe_core.swibe) --

  /**
   * Run the sovereign think→speak→dispatch loop.
   * @param {string} goal  - Initial thought seed
   * @param {number} maxCycles
   */
  async run(goal, maxCycles = 10) {
    for (let i = 0; i < maxCycles; i++) {
      const thought = await this.think(goal);
      this.speak(thought);
      await this._dispatch(thought);
    }
    return this.soulReceipt();
  }

  /**
   * Keyword dispatch — matches the if-chain in universal_swibe_core.swibe
   */
  async _dispatch(thought) {
    const t = thought.toLowerCase();
    if (t.includes('pilot') && this.adapters.seemplify) {
      const result = await this.call('seemplify', 'submit_pilot', 'DeFi Daily', 'trends', 'casual');
      this.speak(result);
    }
    if (t.includes('mint') && this.adapters.seemplify) {
      const result = await this.call('seemplify', 'mint_impact', 2.0, 'pilot aired');
      this.speak(result);
    }
    if (t.includes('sabbath') && this.adapters.oso) {
      const result = await this.call('oso', 'check_sabbath');
      this.speak(`Is it Sabbath? ${result}`);
    }
  }

  // -- Soul receipt --

  /**
   * Returns a signed summary of everything the agent did this session.
   */
  soulReceipt() {
    const payload = JSON.stringify(this._log);
    const hash = crypto.createHash('sha256').update(payload).digest('hex');
    const sig = sovereign.sign(hash, this.identity.priv);
    return {
      fingerprint: this.neural.fingerprint.slice(0, 16),
      ethicsThreshold: this.neural.ethicsThreshold,
      cycles: this._log.length,
      hash,
      sig,
    };
  }
}
