import { describe, it, expect } from 'vitest';
import { Lexer } from '../src/lexer.js';
import { Parser } from '../src/parser.js';
import { Compiler } from '../src/compiler.js';
import { StandardLibrary, MetaDigital } from '../src/stdlib.js';
import { NeuralLayer } from '../src/neural.js';
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
        think("Who am I?", { model: "ollama:llama3", max_tokens: 100 });
      }
    `;
    const compiler = new Compiler(source, 'javascript');
    const code = await compiler.compile();
    expect(code).toContain('think');
    expect(code).toContain('Who am I?');
  });

  it('should support meta-digital chaining with refuse_if', async () => {
    const source = `
      meta-digital "DangerousTask" {
        need: "Something risky",
        refuse_if: true,
        chain: SafeSkill, RiskySkill
      }
    `;
    const compiler = new Compiler(source, 'javascript');
    const code = await compiler.compile();
    expect(code).toContain('MetaDigital');
    expect(code).toContain('DangerousTask');
  });

  it('should initialize the Neural Layer correctly', async () => {
    const layer = new NeuralLayer();
    expect(layer.neurons).toBe(86_000_000_000n);
    const state = layer.actions();
    expect(state.pathway).toBeDefined();
    expect(state.synapses).toBeDefined();
  });

  it('should generate valid Ed25519 keys from sovereign vault', () => {
    const phrase = sovereign.generateRitualPhrase(256);
    const seed = sovereign.deriveSeed(phrase);
    const identity = sovereign.generateIdentity(seed);
    expect(identity.pub).toBeDefined();
    expect(identity.priv).toBeDefined();
    // DER-encoded Ed25519: public (SPKI) = 44 bytes = 88 hex, private (PKCS8) = 48 bytes = 96 hex
    expect(identity.pub.length).toBe(88);
    expect(identity.priv.length).toBe(96);
  });
});

describe('SovereignNeuralLayer', () => {
  it('requires exactly 86 parameters', () => {
    expect(() => new SovereignNeuralLayer([])).toThrow('86 birth parameters');
  });

  it('creates 8 cortical regions', () => {
    const a = SovereignNeuralLayer.random();
    expect(a.cortex.prefrontal.length).toBe(12);
    expect(a.cortex.hippocampus.length).toBe(18);
    expect(a.cortex.amygdala.length).toBe(8);
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

  it('reports 86B neuron pool', () => {
    const a = SovereignNeuralLayer.random();
    expect(a.neuronPool).toBe(86_000_000_000n);
  });
});
