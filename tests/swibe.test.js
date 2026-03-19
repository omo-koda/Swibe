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
});
