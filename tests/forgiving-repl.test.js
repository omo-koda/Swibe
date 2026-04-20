import { describe, it, expect } from 'vitest';
import { matchIntent, injectDefaults, correctTypos } from '../src/intent-parser.js';

describe('Forgiving REPL — Intent Parser', () => {
  it('should match "what can you do" as self-intro intent', () => {
    const result = matchIntent('what can you do');
    expect(result.matched).toBe(true);
    expect(result.intent).toBe('self-intro');
    expect(result.code).toContain('think');
    expect(result.code).toContain('capabilities');
  });

  it('should match "who are you?" with question mark', () => {
    const result = matchIntent('who are you?');
    expect(result.matched).toBe(true);
    expect(result.intent).toBe('self-intro');
  });

  it('should match "create a security audit swarm" as create-swarm', () => {
    const result = matchIntent('create a security audit swarm');
    expect(result.matched).toBe(true);
    expect(result.intent).toBe('create-swarm');
    expect(result.code).toContain('swarm {');
    expect(result.code).toContain('security audit');
  });

  it('should match "launch swarm" with no description', () => {
    const result = matchIntent('launch swarm');
    expect(result.matched).toBe(true);
    expect(result.intent).toBe('create-swarm');
    expect(result.code).toContain('swarm {');
  });

  it('should match "analyze the codebase" as analyze-code', () => {
    const result = matchIntent('analyze the codebase');
    expect(result.matched).toBe(true);
    expect(result.intent).toBe('analyze-code');
    expect(result.code).toContain('think');
    expect(result.code).toContain('loop: true');
  });

  it('should match "security audit" as analyze-code', () => {
    const result = matchIntent('security audit');
    expect(result.matched).toBe(true);
    expect(result.intent).toBe('analyze-code');
  });

  it('should match "show my token balance" as show-balance', () => {
    const result = matchIntent('show my token balance');
    expect(result.matched).toBe(true);
    expect(result.intent).toBe('show-balance');
    expect(result.code).toContain('wallet');
    expect(result.code).toContain('toc_s');
  });

  it('should match "think about the meaning of life" as think', () => {
    const result = matchIntent('think about the meaning of life');
    expect(result.matched).toBe(true);
    expect(result.intent).toBe('think');
    expect(result.code).toBe('think "the meaning of life"');
  });

  it('should match "create a chain" as create-chain', () => {
    const result = matchIntent('create a chain');
    expect(result.matched).toBe(true);
    expect(result.intent).toBe('create-chain');
    expect(result.code).toContain('chain {');
  });

  it('should return matched:false for valid Swibe syntax', () => {
    const result = matchIntent('think "hello world"');
    expect(result.matched).toBe(false);
  });

  it('should return matched:false for empty input', () => {
    const result = matchIntent('');
    expect(result.matched).toBe(false);
  });
});

describe('Forgiving REPL — Default Injection', () => {
  it('should inject ethics and permission when missing', () => {
    const code = 'think "hello"';
    const result = injectDefaults(code);
    expect(result).toContain('ethics { harm_none: true');
    expect(result).toContain('permission { think: "auto" }');
    expect(result).toContain('think "hello"');
  });

  it('should not duplicate ethics if already present', () => {
    const code = 'ethics { harm_none: true }\nthink "hello"';
    const result = injectDefaults(code);
    const ethicsCount = (result.match(/ethics\s*\{/g) || []).length;
    expect(ethicsCount).toBe(1);
  });

  it('should not duplicate permission if already present', () => {
    const code = 'permission { think: "auto" }\nthink "hello"';
    const result = injectDefaults(code);
    const permCount = (result.match(/permission\s*\{/g) || []).length;
    expect(permCount).toBe(1);
  });
});

describe('Forgiving REPL — Typo Correction', () => {
  it('should correct "thnk" to "think"', () => {
    const { corrected, corrections } = correctTypos('thnk "hello"');
    expect(corrected).toBe('think "hello"');
    expect(corrections).toContain('thnk → think');
  });

  it('should correct "swram" to "swarm"', () => {
    const { corrected } = correctTypos('swram { thnk "task" }');
    expect(corrected).toBe('swarm { think "task" }');
  });

  it('should correct "ehtics" to "ethics"', () => {
    const { corrected } = correctTypos('ehtics { harm_none: true }');
    expect(corrected).toBe('ethics { harm_none: true }');
  });

  it('should correct multiple typos at once', () => {
    const { corrected, corrections } = correctTypos('ehtics { harm_none: true }\npermision { thnk: "auto" }');
    expect(corrected).toContain('ethics');
    expect(corrected).toContain('permission');
    expect(corrected).toContain('think');
    expect(corrections.length).toBe(3);
  });

  it('should not alter correct input', () => {
    const { corrected, corrections } = correctTypos('think "hello world"');
    expect(corrected).toBe('think "hello world"');
    expect(corrections.length).toBe(0);
  });
});
