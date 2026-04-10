import { describe, it, expect } from 'vitest';
import { Lexer } from '../src/lexer.js';
import { Parser } from '../src/parser.js';
import { Compiler } from '../src/compiler.js';
import { StandardLibrary, MetaDigital } from '../src/stdlib.js';
import { NeuralLayer } from '../src/neural.js';
import fs from 'node:fs';
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

describe('Swibe v0.5.0 Extensions', () => {
  it('think compiles to real LLM call', async () => {
    const source = `fn test() {
      think "Who am I?" { model: "ollama:llama3" };
    }`;
    const compiler = new Compiler(source, 'javascript');
    const code = await compiler.compile();
    expect(code).toContain('await std.think');
    expect(code).toContain('Who am I?');
  });

  it('meta-digital compiles correctly', async () => {
    const source = `
      meta-digital "Task" {
        refuse_if: true,
        chain: SafeSkill
      }
    `;
    const compiler = new Compiler(source, 'javascript');
    const code = await compiler.compile();
    expect(code).toContain('MetaDigital');
    expect(code).toContain('Task');
  });

  it('NeuralLayer has 86B neurons', () => {
    const layer = new NeuralLayer();
    const state = layer.getState();
    expect(state.neurons).toBe('86000000000');
    expect(state.synapses).toBe('86000000');
  });

  it('NeuralLayer fires and forms synapses', () => {
    const layer = new NeuralLayer();
    layer.fire('hello');
    layer.connect('new-pathway');
    expect(layer.getState().synapses).toBe('86000001');
  });

  it('Ed25519 generates valid keypair', () => {
    const identity = sovereign.generateIdentity(Buffer.alloc(64));
    expect(identity.pub).toBeDefined();
    expect(identity.priv).toBeDefined();
    expect(identity.pub.length).toBeGreaterThan(0);
  });

  it('SovereignNeuralLayer requires 86 params', () => {
    expect(() => new SovereignNeuralLayer([])).toThrow('86 birth parameters');
  });

  it('SovereignNeuralLayer cortical regions', () => {
    const a = SovereignNeuralLayer.random();
    expect(a.cortex.prefrontal.length).toBe(12);
    expect(a.cortex.amygdala.length).toBe(8);
  });

  it('SovereignNeuralLayer unique fingerprints', () => {
    const a = SovereignNeuralLayer.random();
    const b = SovereignNeuralLayer.random();
    expect(a.fingerprint).not.toBe(b.fingerprint);
  });

  it('SovereignNeuralLayer 86B neuron pool', () => {
    const a = SovereignNeuralLayer.random();
    expect(a.neuronPool).toBe(86_000_000_000n);
  });
});

describe('Swibe v2.0 Primitives', () => {

  it('budget compiles correctly', async () => {
    const src = `fn main() {
      budget { tokens: 1000; time: "10s" }
    }`;
    const c = new Compiler(src, 'javascript');
    const code = await c.compile();
    expect(code).toContain('maxTokens: 1000');
    expect(code).toContain('BUDGET');
  });

  it('remember compiles correctly', async () => {
    const src = `fn main() {
      remember { "session-key" }
    }`;
    const c = new Compiler(src, 'javascript');
    const code = await c.compile();
    expect(code).toContain('std.remember');
    expect(code).toContain('session-key');
  });

  it('observe compiles correctly', async () => {
    const src = `fn main() {
      observe { "think.complete" }
    }`;
    const c = new Compiler(src, 'javascript');
    const code = await c.compile();
    expect(code).toContain('std.observe');
  });

  it('evolve compiles correctly', async () => {
    const src = `fn main() {
      evolve { soul: "Ọbàtálá" }
    }`;
    const c = new Compiler(src, 'javascript');
    const code = await c.compile();
    expect(code).toContain('std.evolve');
    expect(code).toContain('Ọbàtálá');
  });

  it('ethics compiles correctly', async () => {
    const src = `fn main() {
      ethics { harm-none; audit-trail }
    }`;
    const c = new Compiler(src, 'javascript');
    const code = await c.compile();
    expect(code).toContain('std.ethics');
  });

  it('budget runtime enforces token limit', async () => {
    const { StandardLibrary } = await import('../src/stdlib.js');
    const std = new StandardLibrary();
    std._budget = {
      maxTokens: 1,
      maxMs: 60000,
      startTime: Date.now(),
      usedTokens: 999
    };
    const result = await std.think('This should be budget exceeded');
    expect(result.content).toContain('BUDGET');
  });

  it('should parse and compile swarm.scale statement', async () => {
    const source = `
      swarm.scale {
        agents: 3,
        circuit_breaker: {
          failure_threshold: 2,
          recovery_timeout: 15000
        }
      }
    `;
    const compiler = new Compiler(source, 'javascript');
    const code = await compiler.compile();
    expect(code).toContain('swarmScale');
    expect(code).toContain('agents: 3');
    expect(code).toContain('failure_threshold: 2');
  });

  it('should parse and compile share statement', async () => {
    const source = `
      share {
        namespace: "test_config",
        data: {
          key: "value",
          count: 42
        }
      }
    `;
    const compiler = new Compiler(source, 'javascript');
    const code = await compiler.compile();
    expect(code).toContain('writeSharedState');
    expect(code).toContain('test_config');
    expect(code).toContain('key: "value"');
  });

  it('should handle swarm.scale with circuit breaker in stdlib', async () => {
    const std = new StandardLibrary();
    std.workerThreads = {
      Worker: class MockWorker {
        constructor() {
          this.listeners = {};
          setTimeout(() => this.listeners.message?.({ agentId: 0, status: 'running' }), 10);
        }
        on(event, callback) {
          this.listeners[event] = callback;
        }
      }
    };

    const result = await std.swarmScale({
      agents: 1,
      circuit_breaker: { failure_threshold: 3, recovery_timeout: 30000 }
    });
    expect(result.success).toBe(true);
    expect(result.agents).toBe(1);
  });

  it('should handle shared state read/write in stdlib', async () => {
    const std = new StandardLibrary();

    const testData = { key: 'value', count: 42 };
    const namespace = 'test_namespace';
    const filePath = `shared_state/${namespace}.json`;

    // Clean up before test
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
    }

    // Write shared state
    const writeResult = await std.writeSharedState({
      namespace,
      data: testData
    });
    expect(writeResult.success).toBe(true);

    // Read shared state
    const readResult = await std.readSharedState({ namespace });
    expect(readResult).toEqual(testData);

    // Clean up after test
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
    }
  });

});

describe('Swibe v2.0 Phase D — Plugins', () => {
  it('birth compiles correctly', async () => {
    const src = `fn main() {
      birth { telephony: "telnyx" }
    }`;
    const c = new Compiler(src, 'javascript');
    const code = await c.compile();
    expect(code).toContain('std.birth');
    expect(code).toContain('telnyx');
  });

  it('plugin registry registers plugins', async () => {
    const { PluginRegistry } = await import('../src/plugin-registry.js');
    const registry = new PluginRegistry();
    const mockPlugin = {
      name: 'test',
      onBirth: async () => ({ born: true })
    };
    registry.register('test', mockPlugin);
    expect(registry.list()).toContain('test');
  });

  it('plugin registry fires hooks', async () => {
    const { PluginRegistry } = await import('../src/plugin-registry.js');
    const registry = new PluginRegistry();
    let fired = false;
    registry.register('test', {
      onBirth: async () => { fired = true; }
    });
    await registry.fire('onBirth', {});
    expect(fired).toBe(true);
  });

  it('telephony plugin mock mode works', async () => {
    const { default: telephony } = await import('../src/plugins/telephony.js');
    const result = await telephony.onBirth({});
    expect(result).toBeDefined();
    expect(result.mock).toBe(true);
  });
});

describe('Swibe OpenClaw Integration', () => {
  it('compiles to openclaw target', async () => {
    const src = `fn main() {
      think "hello openclaw"
      ethics { harm-none }
    }`;
    const c = new Compiler(src, 'openclaw');
    const result = await c.compile();
    expect(result.files).toBeDefined();
    expect(result.files['SKILL.md']).toBeDefined();
    expect(result.files['agent.js']).toBeDefined();
    expect(result.files['SOUL.md']).toBeDefined();
  });

  it('SKILL.md contains capabilities', async () => {
    const src = `fn main() {
      think "test"
      swarm { think "worker" }
      ethics { harm-none }
    }`;
    const c = new Compiler(src, 'openclaw');
    const result = await c.compile();
    expect(result.files['SKILL.md']).toContain('think');
    expect(result.files['SKILL.md']).toContain('swarm');
    expect(result.files['SKILL.md']).toContain('ethics');
  });

  it('SOUL.md contains identity', async () => {
    const src = `fn main() { think "soul" }`;
    const c = new Compiler(src, 'openclaw');
    const result = await c.compile();
    expect(result.files['SOUL.md']).toContain('BIPỌ̀N39');
    expect(result.files['SOUL.md']).toContain('Ed25519');
    expect(result.files['SOUL.md']).toContain('Sabbath');
  });

  it('agent.js contains gateway code', async () => {
    const src = `fn main() { think "gateway" }`;
    const c = new Compiler(src, 'openclaw');
    const result = await c.compile();
    expect(result.files['agent.js']).toContain('18789');
    expect(result.files['agent.js']).toContain('WebSocketServer');
  });

  it('heartbeat compiles correctly', async () => {
    const src = `fn main() {
      heartbeat { every: 60s; check: "updates?" }
    }`;
    const c = new Compiler(src, 'javascript');
    const code = await c.compile();
    expect(code).toContain('std.heartbeat');
  });

  it('heartbeat runtime starts', async () => {
    const { StandardLibrary } = await import('../src/stdlib.js');
    const std = new StandardLibrary();
    const result = await std.heartbeat({
      every: 999999,
      check: 'test check'
    });
    expect(result.started).toBe(true);
  });
});

describe('Swibe v3.1 — Hermetic Ethics', () => {
  it('hermetic mode compiles correctly', async () => {
    const src = `fn main() {
      ethics { mode: "hermetic"; harm-none }
    }`;
    const c = new Compiler(src, 'javascript');
    const code = await c.compile();
    expect(code).toContain('std.ethics');
    expect(code).toContain('hermetic');
  });

  it('hermetic mode activates in runtime', async () => {
    const { StandardLibrary } = await import('../src/stdlib.js');
    const std = new StandardLibrary();
    const result = await std.ethics([
      { rule: 'mode', value: 'hermetic' },
      { rule: 'harm-none', value: true }
    ]);
    expect(result.mode).toBe('hermetic');
    expect(std._hermeticMentalism).toBe(true);
    expect(std._hermeticPolarity).toBe(true);
    expect(std._hermeticVibration).toBe(true);
    expect(std._hermeticGender.active).toBe(true);
  });

  it('vibration TTL blocks then releases', async () => {
    const { StandardLibrary } = await import('../src/stdlib.js');
    const std = new StandardLibrary();
    std._hermeticVibration = true;
    std._refusalTTL = new Map();
    std._setVibrationTTL('test-action', 100);
    expect(std._checkVibrationTTL('test-action')).toBe(true);
    await new Promise(r => setTimeout(r, 150));
    expect(std._checkVibrationTTL('test-action')).toBe(false);
  });

  it('gender blocks without consensus token', async () => {
    const { StandardLibrary } = await import('../src/stdlib.js');
    const std = new StandardLibrary();
    std._hermeticGender = {
      active: true,
      requiresConsensus: ['mint']
    };
    delete process.env.SWIBE_CONSENSUS_TOKEN;
    const allowed = await std.checkConsensus('mint');
    expect(allowed).toBe(false);
  });

  it('gender allows with consensus token', async () => {
    const { StandardLibrary } = await import('../src/stdlib.js');
    const std = new StandardLibrary();
    std._hermeticGender = {
      active: true,
      requiresConsensus: ['mint']
    };
    process.env.SWIBE_CONSENSUS_TOKEN = 'test-token';
    const allowed = await std.checkConsensus('mint');
    expect(allowed).toBe(true);
    delete process.env.SWIBE_CONSENSUS_TOKEN;
  });
});
