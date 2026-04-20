import { describe, it, expect, vi } from 'vitest';
import { Compiler } from '../src/compiler.js';
import { StandardLibrary } from '../src/stdlib.js';
import { PermissionGate, PermissionMode } from '../src/permissions.js';

describe('Swibe v3.3.1 Security Hardening', () => {
  it('enforces strict layer ordering with policy', async () => {
    const src = `
      think "Cognition first"
      secure { strict: true }
    `;
    const compiler = new Compiler(src, 'javascript');
    await expect(compiler.compile()).rejects.toThrow(/Layer 0/);
  });

  it('calculates Merkle root for receipt chain', async () => {
    const std = new StandardLibrary();
    // Mock the LLM to avoid hanging on network calls
    const originalThink = std.llm.think;
    std.llm.think = vi.fn()
      .mockResolvedValueOnce({ content: 'Thought 1 response', receipt: '0x1' })
      .mockResolvedValueOnce({ content: 'Thought 2 response', receipt: '0x2' });

    // Simulate some thoughts
    await std.think("Thought 1");
    await std.think("Thought 2");

    const receipts = std.getReceiptChain();
    expect(receipts.length).toBe(2);
    expect(std._merkleRoot).toBeDefined();
    expect(std._merkleRoot.length).toBe(64);

    // Restore
    std.llm.think = originalThink;
  });

  it('handles simulate permission mode', async () => {
    const gate = new PermissionGate({ bash: PermissionMode.SIMULATE });
    const result = await gate.check('bash', { command: 'rm -rf /' });
    
    expect(result.granted).toBe(true);
    expect(result.simulated).toBe(true);
    expect(result.reason).toContain('dry-run');
  });

  it('produces sovereign readiness report', async () => {
    const src = `
      ethics { harm_none: true }
      secure { execution: "strict-vm" }
      permission { think: "auto" }
      fn main() { think "test" }
    `;
    const compiler = new Compiler(src, 'javascript');
    await compiler.compile();
    const report = compiler.getSovereignReadinessReport();
    
    expect(report.riskScore).toBeLessThan(50);
    expect(report.status).toBe('SOVEREIGN');
    expect(report.missingFeatures.ethics).toBe(false);
  });

  it('applies quarantine mode on iteration N+1 after violation', async () => {
    const std = new StandardLibrary();
    
    // Manually trigger a violation
    std._violations.push({ type: 'ethics', detail: 'test' });
    
    // Check loop security
    const upgraded = await std.checkLoopSecurity();
    expect(upgraded).toBe(true);
    expect(std._securityPolicy.execution).toBe('quarantine');
  });

  it('injects security policy into think options', async () => {
    const std = new StandardLibrary();
    std._securityPolicy.llm_routing = 'ethics_only';
    
    const originalThink = std.llm.think;
    std.llm.think = vi.fn().mockResolvedValue({ content: 'safe response', receipt: '0x1' });
    
    await std.think("risky prompt");
    
    // Verify safety prefix was added
    expect(std.llm.think).toHaveBeenCalledWith(expect.stringContaining('[SAFETY MODE: ENFORCED]'));
    
    std.llm.think = originalThink;
  });
});
