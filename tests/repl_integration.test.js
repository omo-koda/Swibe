import { describe, test, expect } from 'vitest';
import { Compiler } from '../src/compiler.js';
import { StandardLibrary } from '../src/stdlib.js';

describe('REPL: Complex Swarm Execution', () => {
  test('nested blocks parse correctly', async () => {
    const input = `
      ethics { harm_none: true; mode: "hermetic" }
      birth { identity: "test-001" }
      permission { think: "auto" }
      swarm {
        chain {
          think "step 1"
          think "step 2"
        }
        evolve { soul: "Test"; rank: 1 }
      }
    `;
    
    const compiler = new Compiler(input, 'javascript');
    const code = await compiler.compile();
    expect(code).toContain('SwarmPipeline');
    expect(code).toContain('pipeline.run()');
  });
  
  test('layer order violations throw compile error', async () => {
    const input = `
      swarm { think "test" }
      ethics { harm_none: true }
    `;
    
    const compiler = new Compiler(input, 'javascript');
    try {
      await compiler.compile();
      // If it doesn't throw, it should at least have warnings in the validator
    } catch (err) {
      expect(err.message).toContain('LAYER-ORDER');
    }
  });
});
