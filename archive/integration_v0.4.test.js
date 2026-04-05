
import { describe, it, expect } from 'vitest';
import { Lexer } from '../src/lexer.js';
import { Parser } from '../src/parser.js';
import { Compiler } from '../src/compiler.js';
import { StandardLibrary, MetaDigital, NeuralLayer } from '../src/stdlib.js';
import { sovereign } from '../src/sovereign-vault.js';
import SovereignNeuralLayer from '../src/neural.js';

describe('Swibe v0.4.0 Core', () => {
  it('should parse and compile a sovereign birth ritual', async () => {
    const source = `
      fn main() {
        let phrase = bipon39_entropyToMnemonic(crypto.randomBytes(32), 256);
        println("Born: " + phrase);
      }
    `;
    const compiler = new Compiler(source, 'javascript');
    const code = await compiler.compile();
    expect(code).toContain('bipon39_entropyToMnemonic');
    expect(code).toContain('crypto.randomBytes');
  });

  it('should handle the "think" primitive with receipts', async () => {
    const source = `
      fn reason() {
        think "Who am I?" { model: "ollama:llama3", max_tokens: 100 };
      }
    `;
    const compiler = new Compiler(source, 'javascript');
    const code = await compiler.compile();
    expect(code).toContain('await think("Who am I?", {model: "ollama:llama3", max_tokens: 100, })');
  });

  it('should support meta-digital chaining with refuse_if', async () => {
    const source = `
      meta-digital "DangerousTask" {
        need: "Something risky",
        refuse_if: true,
        chain: [SafeSkill, RiskySkill]
      }
    `;
    const compiler = new Compiler(source, 'javascript');
    const code = await compiler.compile();
    expect(code).toContain('new MetaDigital');
    expect(code).toContain('refuse_if: true');
  });

  it('should initialize the Neural Layer correctly', async () => {
    const layer = new NeuralLayer();
    const state = await layer.actions();
    expect(state.neurons).toBe(86_000_000_000);
    expect(state.synapses).toBe(86_000_000);
  });

  it('should generate valid Ed25519 keys from sovereign vault', () => {
    const phrase = sovereign.generateRitualPhrase(256);
    const seed = sovereign.deriveSeed(phrase);
    const identity = sovereign.generateIdentity(seed);
    expect(identity.pub).toBeDefined();
    expect(identity.priv).toBeDefined();
    // Ed25519 keys are 32 bytes (64 hex chars) or 64 bytes (128 hex chars) depending on representation
    // tweetnacl secret key is 64 bytes (private + public), public is 32 bytes
    expect(identity.pub.length).toBe(64); 
    expect(identity.priv.length).toBe(128);
  });

  describe('SovereignNeuralLayer', () => {
    it('requires exactly 86 parameters', () => {
      expect(() => new SovereignNeuralLayer([]))
        .toThrow('86 birth parameters');
    });

    it('creates cortical regions correctly', () => {
      const agent = SovereignNeuralLayer.random();
      expect(agent.cortex.prefrontal.length).toBe(12);
      expect(agent.cortex.hippocampus.length).toBe(18);
      expect(agent.cortex.amygdala.length).toBe(8);
      expect(agent.cortex.temporal.length).toBe(16);
      expect(agent.cortex.occipital.length).toBe(12);
      expect(agent.cortex.cerebellum.length).toBe(10);
      expect(agent.cortex.brainstem.length).toBe(4);
      expect(agent.cortex.parietal.length).toBe(6);
    });

    it('routes models by prefrontal weights', async () => {
      const agent = SovereignNeuralLayer.random();
      const models = ['claude', 'llama', 'mistral'];
      const routing = await agent.route('test', models);
      expect(routing.length).toBe(3);
      expect(routing[0].weight).toBeGreaterThanOrEqual(
        routing[1].weight
      );
    });

    it('produces unique fingerprints', () => {
      const a = SovereignNeuralLayer.random();
      const b = SovereignNeuralLayer.random();
      expect(a.fingerprint).not.toBe(b.fingerprint);
    });

    it('measures divergence between agents', () => {
      const a = SovereignNeuralLayer.random();
      const b = SovereignNeuralLayer.random();
      const d = SovereignNeuralLayer.divergence(a, b);
      expect(d).toBeGreaterThan(0);
      expect(d).toBeLessThanOrEqual(1);
    });

    it('reports neuron pool as 86 billion', () => {
      const agent = SovereignNeuralLayer.random();
      expect(agent.neuronPool).toBe(86_000_000_000n);
    });
  });
});
