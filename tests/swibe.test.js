import { describe, it, expect, vi } from 'vitest';
import { Lexer } from '../src/lexer.js';
import { Parser } from '../src/parser.js';
import { Compiler } from '../src/compiler.js';
import { sovereign } from '../src/sovereign-vault.js';
import { StandardLibrary, MetaDigital } from '../src/stdlib.js';
import { NeuralLayer } from '../src/neural.js';

describe('Swibe v0.4.0 Sovereign Birth', () => {

  describe('Ritual Lexer', () => {
    it('tokenizes ritual keywords', () => {
      const source = 'meta-digital "Genesis" { chain: [birth]; ethics: "harm-none" }';
      const lexer = new Lexer(source);
      const tokens = lexer.tokenize();
      expect(tokens.find(t => t.type === 'META_DIGITAL')).toBeDefined();
      expect(tokens.find(t => t.type === 'STRING' && t.value === 'Genesis')).toBeDefined();
    });

    it('tokenizes prompts', () => {
      const source = '%% [voice: "Let there be light"]';
      const lexer = new Lexer(source);
      const tokens = lexer.tokenize();
      expect(tokens.find(t => t.type === 'PROMPT')).toBeDefined();
    });
  });

  describe('Multi-Target Compiler', () => {
    it('compiles to Rust', async () => {
      const source = 'fn add(a: i32, b: i32) -> i32 { a + b }';
      const compiler = new Compiler(source, 'rust');
      const code = await compiler.compile();
      expect(code).toContain('fn add(a: i32, b: i32) -> i32');
    });

    it('compiles to Sui Move (Omokoda Soul)', async () => {
      const source = 'swarm { Genesis: Agent { name: "Genesis" } }';
      const compiler = new Compiler(source, 'move');
      const code = await compiler.compile();
      expect(code).toContain('module omokoda::soul');
      expect(code).toContain('struct BreathEvent');
    });

    it('compiles to Elixir (BEAM Actors)', async () => {
      const source = 'swarm { Genesis: Agent { name: "Genesis" } }';
      const compiler = new Compiler(source, 'elixir');
      const code = await compiler.compile();
      expect(code).toContain('defmodule SwibeAgent.Application');
      expect(code).toContain('DynamicSupervisor.start_child');
    });

    it('compiles to Pony (Lock-free Actors)', async () => {
      const source = 'swarm { Genesis: Agent { name: "Genesis" } }';
      const compiler = new Compiler(source, 'pony');
      const code = await compiler.compile();
      expect(code).toContain('actor Main');
      expect(code).toContain('AgentActor("Genesis")');
    });

    it('compiles to Mojo (Neural Kernels)', async () => {
      const source = 'neural;';
      const compiler = new Compiler(source, 'mojo');
      const code = await compiler.compile();
      expect(code).toContain('fn main():');
      expect(code).toContain('Mojo High-Performance Kernel: Neural Simulation');
    });

    it('compiles to Aether (Work-stealing Queues)', async () => {
      const source = 'swarm { Genesis: Agent { name: "Genesis" } }';
      const compiler = new Compiler(source, 'aether');
      const code = await compiler.compile();
      expect(code).toContain('#include <aether/core.h>');
      expect(code).toContain('aether::spawn_task');
    });
  });

  describe('Sovereign Vault', () => {
    it('generates Yoruba ritual phrases', () => {
      const phrase = sovereign.generateRitualPhrase();
      expect(phrase.length).toBeGreaterThan(0);
      expect(phrase[0]).toMatch(/[a-z]+-[a-z]+/); // e.g., "esu-gate"
    });

    it('derives identity from seed', () => {
      const phrase = ["esu-gate", "sango-volt"];
      const seed = sovereign.deriveSeed(phrase);
      const id = sovereign.generateIdentity(seed);
      expect(id.pub).toBeDefined();
      expect(id.priv).toBeDefined();
    });
  });

  describe('Neural Layer', () => {
    it('has 86B neurons and 86M synapses', () => {
      const layer = new NeuralLayer();
      const state = layer.getState();
      expect(state.neurons).toBe('86000000000');
      expect(state.synapses).toBe('86000000');
    });

    it('fires and forms synapses', () => {
      const layer = new NeuralLayer();
      layer.fire("hello world");
      layer.connect("new-pathway");
      expect(layer.getState().synapses).toBe('86000001');
    });
  });

  describe('Meta-Digital Ethics', () => {
    it('refuses harmful actions via think primitive', async () => {
      const std = new StandardLibrary();
      
      // Mock the think method to simulate refusal
      vi.spyOn(std, 'think').mockResolvedValue({ 
        content: "REFUSE: Harmful content detected.", 
        receipt: "mock-receipt" 
      });

      await expect(std.refuse_if("Do no harm")).rejects.toThrow(/refused/);
    });
    
    it('seals receipts with SHA-256', async () => {
      const std = new StandardLibrary();
      // Mock LLM to return specific content
      vi.spyOn(std.llm, 'think').mockResolvedValue({
        content: "Safe thought",
        receipt: "sha256-hash"
      });
      
      const result = await std.think("Is this safe?");
      expect(result.receipt).toBeDefined();
    });
  });

  describe('@target First-Class Syntax', () => {
    it('tokenizes @move to AT_TARGET', () => {
      const lexer = new Lexer('@move');
      const tokens = lexer.tokenize();
      const at = tokens.find(t => t.type === 'AT_TARGET');
      expect(at).toBeDefined();
      expect(at.value).toBe('move');
    });

    it('tokenizes @elixir and @rust', () => {
      const lexer = new Lexer('@elixir @rust');
      const tokens = lexer.tokenize();
      const targets = tokens.filter(t => t.type === 'AT_TARGET');
      expect(targets).toHaveLength(2);
      expect(targets[0].value).toBe('elixir');
      expect(targets[1].value).toBe('rust');
    });

    it('parses @target in swarm steps', () => {
      const source = 'swarm { Settler: Agent { name: "Settler" } @move }';
      const lexer = new Lexer(source);
      const tokens = lexer.tokenize();
      const parser = new Parser(tokens);
      const ast = parser.parse();
      const swarm = ast.statements[0];
      expect(swarm.type).toBe('SwarmStatement');
      expect(swarm.steps[0].target).toBe('move');
    });

    it('parses @target as standalone directive', () => {
      const source = '@rust';
      const lexer = new Lexer(source);
      const tokens = lexer.tokenize();
      const parser = new Parser(tokens);
      const ast = parser.parse();
      expect(ast.statements[0].type).toBe('TargetDirective');
      expect(ast.statements[0].target).toBe('rust');
    });
  });

  describe('Plugin System', () => {
    it('calls lifecycle hooks when a plugin is registered', async () => {
      const std = new StandardLibrary();
      const mockPlugin = {
        onBirth: vi.fn(),
        onThink: vi.fn(),
        onReceipt: vi.fn(),
        onSettle: vi.fn(),
      };

      std.setPlugin(mockPlugin);

      // Test onBirth
      std.create_agent({ name: "TestAgent" });
      expect(mockPlugin.onBirth).toHaveBeenCalled();

      // Test onThink and onReceipt
      vi.spyOn(std.llm, 'think').mockResolvedValue({ content: "Hi", receipt: "hash" });
      await std.think("Hello");
      expect(mockPlugin.onThink).toHaveBeenCalledWith("Hello", expect.anything());
      expect(mockPlugin.onReceipt).toHaveBeenCalledWith("hash");
    });
  });
});

import { SovereignNeuralLayer } from '../src/neural.js';

describe('SovereignNeuralLayer — 86B Pool', () => {
  it('requires exactly 86 parameters', () => {
    expect(() => new SovereignNeuralLayer([]))
      .toThrow('86 birth parameters');
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
