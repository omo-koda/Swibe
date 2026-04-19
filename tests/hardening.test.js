/**
 * Swibe Hardening Tests — Security, Permissions, Token Economy, Layer Architecture
 */

import { describe, it, expect } from 'vitest';
import { Lexer, TokenType } from '../src/lexer.js';
import { Parser } from '../src/parser.js';
import { EthicsValidator, LayerValidator, LAYER_MAP, LAYER_NAMES } from '../src/visitor.js';
import { PermissionGate, PermissionMode, HIGH_RISK_PRIMITIVES } from '../src/permissions.js';
import { TokenLedger, TOKEN_TYPE } from '../src/toc/token.js';
import { StakingEngine, GATED_PRIMITIVES, GATED_STAKE_FRACTION } from '../src/toc/staking.js';
import { EscrowEngine } from '../src/toc/escrow.js';
import { WalletRegistry } from '../src/toc/wallet.js';

function parseSource(src) {
  const lexer = new Lexer(src);
  const tokens = lexer.tokenize();
  const parser = new Parser(tokens);
  return parser.parse();
}

// ─────────────────────────────────────────────────
// 1. Formal Security Layer
// ─────────────────────────────────────────────────

describe('Formal Security Layer', () => {
  it('parses secure block with policy fields', () => {
    const ast = parseSource(`
      secure {
        execution: "strict-vm";
        network: "refuse";
        filesystem: "read-only";
        memory: "encrypted";
        receipts: "mandatory";
        audit: "on"
      }
    `);
    const secureNode = ast.statements[0];
    expect(secureNode.type).toBe('SecureBlock');
    expect(secureNode.policies.execution).toBe('strict-vm');
    expect(secureNode.policies.network).toBe('refuse');
    expect(secureNode.policies.filesystem).toBe('read-only');
    expect(secureNode.policies.memory).toBe('encrypted');
    expect(secureNode.policies.receipts).toBe('mandatory');
    expect(secureNode.policies.audit).toBe('on');
  });

  it('EthicsValidator flags unknown secure policy fields', () => {
    const ast = parseSource(`
      secure {
        execution: "strict-vm";
        bogus_field: "bad"
      }
    `);
    const validator = new EthicsValidator();
    for (const stmt of ast.statements) validator.visit(stmt);
    const unknownViolation = validator.violations.find(v => v.type === 'unknown_secure_policy');
    expect(unknownViolation).toBeDefined();
    expect(unknownViolation.message).toContain('bogus_field');
  });

  it('EthicsValidator accepts valid secure policy fields', () => {
    const ast = parseSource(`
      secure {
        execution: "strict-vm";
        network: "refuse";
        audit: "on"
      }
    `);
    const validator = new EthicsValidator();
    for (const stmt of ast.statements) validator.visit(stmt);
    const unknownViolation = validator.violations.find(v => v.type === 'unknown_secure_policy');
    expect(unknownViolation).toBeUndefined();
  });
});

// ─────────────────────────────────────────────────
// 2. Strengthened Permission System
// ─────────────────────────────────────────────────

describe('Strengthened Permission System', () => {
  it('PermissionMode includes monitor and quarantine', () => {
    expect(PermissionMode.MONITOR).toBe('monitor');
    expect(PermissionMode.QUARANTINE).toBe('quarantine');
  });

  it('monitor mode allows action with monitored flag', async () => {
    const gate = new PermissionGate({ bash: 'monitor' });
    const result = await gate.check('bash');
    expect(result.granted).toBe(true);
    expect(result.monitored).toBe(true);
    expect(result.reason).toContain('Monitor-mode');
  });

  it('quarantine mode allows action with quarantined flag', async () => {
    const gate = new PermissionGate({ pilot: 'quarantine' });
    const result = await gate.check('pilot');
    expect(result.granted).toBe(true);
    expect(result.quarantined).toBe(true);
    expect(result.reason).toContain('Quarantine-mode');
  });

  it('HIGH_RISK_PRIMITIVES list is frozen and non-empty', () => {
    expect(HIGH_RISK_PRIMITIVES.length).toBeGreaterThan(0);
    expect(HIGH_RISK_PRIMITIVES).toContain('mcp');
    expect(HIGH_RISK_PRIMITIVES).toContain('pilot');
    expect(HIGH_RISK_PRIMITIVES).toContain('edit');
    expect(HIGH_RISK_PRIMITIVES).toContain('mint');
    expect(() => { HIGH_RISK_PRIMITIVES.push('x'); }).toThrow();
  });

  it('EthicsValidator flags mint without permissions', () => {
    const ast = parseSource(`
      ethics { harm_none: true }
      mint;
    `);
    const validator = new EthicsValidator();
    for (const stmt of ast.statements) validator.visit(stmt);
    const v = validator.violations.find(v => v.type === 'mint_without_permissions');
    expect(v).toBeDefined();
  });

  it('EthicsValidator flags edit without permissions', () => {
    const ast = parseSource(`
      ethics { harm_none: true }
      edit "file.txt" { replace: "a"; with: "b" }
    `);
    const validator = new EthicsValidator();
    for (const stmt of ast.statements) validator.visit(stmt);
    const v = validator.violations.find(v => v.type === 'edit_without_permissions');
    expect(v).toBeDefined();
  });

  it('monitor and quarantine logged in audit trail', async () => {
    const gate = new PermissionGate({ net: 'monitor', bash: 'quarantine' });
    await gate.check('net');
    await gate.check('bash');
    const log = gate.getAuditLog();
    expect(log.length).toBe(2);
    expect(log[0].monitored).toBe(true);
    expect(log[1].quarantined).toBe(true);
  });
});

// ─────────────────────────────────────────────────
// 3. Hardened Three-Token Economy
// ─────────────────────────────────────────────────

describe('Hardened Three-Token Economy', () => {
  let registry;

  async function setupAgent(id = 'agent_test') {
    registry = new WalletRegistry();
    await registry.createAgent(id);
    return registry;
  }

  it('GATED_PRIMITIVES requires staking for pilot and mint', () => {
    expect(GATED_PRIMITIVES).toContain('pilot');
    expect(GATED_PRIMITIVES).toContain('mint');
    expect(GATED_STAKE_FRACTION).toBe(0.10);
  });

  it('requireStake rejects unstaked agent for pilot', async () => {
    await setupAgent('agent_1');
    const staking = new StakingEngine(registry);
    const result = staking.requireStake('agent_1', 'pilot');
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('Insufficient stake');
  });

  it('requireStake allows staked agent for pilot', async () => {
    await setupAgent('agent_2');
    const staking = new StakingEngine(registry);
    const wallet = registry.get('agent_2');
    const synapseBalance = wallet.balance(TOKEN_TYPE.TOC_S);
    const requiredStake = Math.ceil(synapseBalance * 0.10);

    // Stake the required amount
    staking.stake('agent_2', TOKEN_TYPE.TOC_S, requiredStake, 'pilot');
    const result = staking.requireStake('agent_2', 'pilot');
    expect(result.allowed).toBe(true);
  });

  it('requireStake allows non-gated primitives without stake', async () => {
    await setupAgent('agent_3');
    const staking = new StakingEngine(registry);
    const result = staking.requireStake('agent_3', 'think');
    expect(result.allowed).toBe(true);
    expect(result.reason).toBe('Not a gated primitive');
  });

  it('slashForViolation slashes 25% Dopamine on ethics violation', async () => {
    await setupAgent('agent_4');
    const staking = new StakingEngine(registry);
    const wallet = registry.get('agent_4');
    const dopBefore = wallet.balance(TOKEN_TYPE.TOC_D);
    const record = staking.slashForViolation('agent_4', 'ethics', 'harm detected');
    expect(record.percentage).toBe(25);
    expect(record.slashAmount).toBe(Math.floor(dopBefore * 0.25));
    expect(record.reason).toContain('ethics');
    const dopAfter = wallet.balance(TOKEN_TYPE.TOC_D);
    expect(dopAfter).toBe(dopBefore - record.slashAmount);
  });

  it('slashForViolation slashes 10% Dopamine on budget violation', async () => {
    await setupAgent('agent_5');
    const staking = new StakingEngine(registry);
    const wallet = registry.get('agent_5');
    const dopBefore = wallet.balance(TOKEN_TYPE.TOC_D);
    const record = staking.slashForViolation('agent_5', 'budget', 'exceeded token limit');
    expect(record.percentage).toBe(10);
    expect(record.slashAmount).toBe(Math.floor(dopBefore * 0.10));
    expect(record.reason).toContain('budget');
  });

  it('escrow expires after timeout and auto-refunds', async () => {
    registry = new WalletRegistry();
    // Create human wallet manually
    const humanWallet = registry.createHuman('human_1');
    // Give human some ASE
    humanWallet.ledger.mint('human_1', 'ase', 100, 'vm_birth');
    await registry.createAgent('agent_6');

    const escrow = new EscrowEngine(registry);
    // Create escrow with very short timeout (1ms)
    const job = escrow.create('human_1', 'agent_6', 10, 'test job', 1);
    expect(job.status).toBe('locked');
    expect(job.expiresAt).toBeDefined();

    // Wait for expiry and run expireStale
    const expired = escrow.expireStale(Date.now() + 100);
    expect(expired.length).toBe(1);
    expect(expired[0].status).toBe('expired');
  });

  it('Dopamine burn generates audit receipt hash', () => {
    const ledger = new TokenLedger();
    ledger.mint('agent_x', TOKEN_TYPE.TOC_D, 1000, 'vm_birth');
    const tx = ledger.burn('agent_x', TOKEN_TYPE.TOC_D, 100, 'action_cost');
    expect(tx).toBeDefined();
    expect(tx.receiptHash).toBeDefined();
    expect(tx.receiptHash).toMatch(/^burn_/);
  });

  it('non-Dopamine burns do not get receipt hash', () => {
    const ledger = new TokenLedger();
    ledger.mint('agent_y', TOKEN_TYPE.TOC_S, 1000, 'vm_birth');
    const tx = ledger.burn('agent_y', TOKEN_TYPE.TOC_S, 100, 'transfer');
    expect(tx.receiptHash).toBeUndefined();
  });
});

// ─────────────────────────────────────────────────
// 4. Layered Architecture
// ─────────────────────────────────────────────────

describe('Layered Architecture', () => {
  it('LAYER_MAP classifies primitives into 4 layers', () => {
    expect(LAYER_MAP.EthicsStatement).toBe(0);
    expect(LAYER_MAP.SecureBlock).toBe(0);
    expect(LAYER_MAP.ThinkStatement).toBe(1);
    expect(LAYER_MAP.PermissionStatement).toBe(1);
    expect(LAYER_MAP.SwarmStatement).toBe(2);
    expect(LAYER_MAP.CoordinateStatement).toBe(2);
    expect(LAYER_MAP.PilotStatement).toBe(3);
    expect(LAYER_MAP.MCPStatement).toBe(3);
  });

  it('LAYER_NAMES has 4 entries', () => {
    expect(LAYER_NAMES).toEqual(['Ethics & Identity', 'Core Agent', 'Coordination', 'Execution']);
  });

  it('warns when Layer 1 appears before Layer 0', () => {
    const ast = parseSource(`
      think "do something" { loop: false }
      ethics { harm_none: true }
    `);
    const validator = new LayerValidator();
    for (const stmt of ast.statements) validator.visit(stmt);
    const report = validator.getLayerReport();
    expect(report.valid).toBe(false);
    expect(report.warnings.length).toBeGreaterThan(0);
    expect(report.warnings[0].declaredLayer).toBe(0);
    expect(report.warnings[0].afterLayer).toBe(1);
  });

  it('accepts correct layer ordering', () => {
    const ast = parseSource(`
      ethics { harm_none: true }
      secure { execution: "strict-vm" }
      permission { think: "auto" }
    `);
    const validator = new LayerValidator();
    for (const stmt of ast.statements) validator.visit(stmt);
    const report = validator.getLayerReport();
    expect(report.valid).toBe(true);
    expect(report.warnings.length).toBe(0);
  });

  it('warns when Layer 3 primitive appears before Layer 2', () => {
    const ast = parseSource(`
      ethics { harm_none: true }
      permission { think: "auto" }
      pilot { mode: "browser" }
      swarm { worker: "do things" }
    `);
    const validator = new LayerValidator();
    for (const stmt of ast.statements) validator.visit(stmt);
    const report = validator.getLayerReport();
    expect(report.valid).toBe(false);
    expect(report.warnings[0].message).toContain('Layer 2');
  });

  it('getLayerReport tracks declaration order', () => {
    const ast = parseSource(`
      ethics { harm_none: true }
      permission { think: "auto" }
    `);
    const validator = new LayerValidator();
    for (const stmt of ast.statements) validator.visit(stmt);
    const report = validator.getLayerReport();
    expect(report.order.length).toBe(2);
    expect(report.order[0]).toEqual({ type: 'EthicsStatement', layer: 0 });
    expect(report.order[1]).toEqual({ type: 'PermissionStatement', layer: 1 });
  });
});
