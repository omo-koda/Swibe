/**
 * Swibe Permission System
 * Granular, context-aware permissions for sovereign agents.
 *
 * Unlike policy-based systems that impose external rules,
 * Swibe permissions are rooted in the agent's own Terms of Conscience.
 * The sovereign vault's ethics threshold modulates permission strictness.
 *
 * Modes:
 *   "auto"   — Approved if ethics threshold allows and action is in whitelist
 *   "ask"    — Always prompt the operator for confirmation
 *   "plan"   — Approve once per plan/session, then auto for the rest
 *   "refuse" — Never allow, regardless of context
 */

import crypto from 'node:crypto';

// ────────────────────────────────────────────────────────────
// Permission Levels
// ────────────────────────────────────────────────────────────

const PermissionMode = Object.freeze({
  AUTO:   'auto',
  ASK:    'ask',
  PLAN:   'plan',
  REFUSE: 'refuse',
});

// ────────────────────────────────────────────────────────────
// Default Permission Matrix
// ────────────────────────────────────────────────────────────

const DEFAULT_PERMISSIONS = {
  think:       PermissionMode.AUTO,
  chain:       PermissionMode.AUTO,
  plan:        PermissionMode.AUTO,
  retrieve:    PermissionMode.AUTO,
  remember:    PermissionMode.AUTO,
  observe:     PermissionMode.AUTO,
  evolve:      PermissionMode.ASK,
  birth:       PermissionMode.ASK,
  mint:        PermissionMode.ASK,
  seal:        PermissionMode.ASK,
  receipt:     PermissionMode.AUTO,
  heartbeat:   PermissionMode.AUTO,
  call_tool:   PermissionMode.ASK,
  mcp:         PermissionMode.ASK,
  bash:        PermissionMode.ASK,
  file_write:  PermissionMode.ASK,
  file_edit:   PermissionMode.ASK,
  net:         PermissionMode.ASK,
  swarm:       PermissionMode.PLAN,
  team:        PermissionMode.PLAN,
};

// ────────────────────────────────────────────────────────────
// Permission Gate
// ────────────────────────────────────────────────────────────

class PermissionGate {
  /**
   * @param {object} [overrides] — Map of action → PermissionMode
   * @param {number} [ethicsThreshold] — 0-1 float from SovereignNeuralLayer
   * @param {function} [promptFn] — Async function to ask operator for confirmation
   */
  constructor(overrides = {}, ethicsThreshold = 0.5, promptFn = null) {
    this.matrix = { ...DEFAULT_PERMISSIONS, ...overrides };
    this.ethicsThreshold = ethicsThreshold;
    this.promptFn = promptFn || PermissionGate._defaultPrompt;
    this.sessionApprovals = new Set();
    this.auditLog = [];
  }

  /**
   * Check if an action is permitted.
   * @param {string} action — The primitive or tool name
   * @param {object} [context] — Additional context (target, amount, etc.)
   * @returns {Promise<{granted: boolean, reason: string}>}
   */
  async check(action, context = {}) {
    const mode = this.matrix[action] || PermissionMode.ASK;
    const entry = { action, mode, context, timestamp: Date.now() };

    // Refuse is absolute
    if (mode === PermissionMode.REFUSE) {
      entry.granted = false;
      entry.reason = 'Action permanently refused by permission matrix';
      this.auditLog.push(entry);
      return { granted: false, reason: entry.reason };
    }

    // Auto: check ethics threshold
    if (mode === PermissionMode.AUTO) {
      const granted = this._ethicsCheck(action, context);
      entry.granted = granted;
      entry.reason = granted
        ? 'Auto-approved (ethics threshold passed)'
        : `Auto-denied (ethics threshold ${this.ethicsThreshold.toFixed(3)} too high for ${action})`;
      this.auditLog.push(entry);
      return { granted, reason: entry.reason };
    }

    // Plan: approve once per session
    if (mode === PermissionMode.PLAN) {
      if (this.sessionApprovals.has(action)) {
        entry.granted = true;
        entry.reason = 'Plan-mode: previously approved this session';
        this.auditLog.push(entry);
        return { granted: true, reason: entry.reason };
      }
      // Fall through to ask
    }

    // Ask the operator
    const approved = await this.promptFn(action, context);
    if (approved && mode === PermissionMode.PLAN) {
      this.sessionApprovals.add(action);
    }
    entry.granted = approved;
    entry.reason = approved ? 'Operator approved' : 'Operator denied';
    this.auditLog.push(entry);
    return { granted: approved, reason: entry.reason };
  }

  /**
   * Ethics-based auto-approval check.
   * High ethics threshold (cautious agent) blocks more auto-approvals.
   * Low threshold (bold agent) allows more.
   */
  _ethicsCheck(action, _context) {
    // Safe actions always pass
    const alwaysSafe = ['think', 'chain', 'plan', 'retrieve', 'remember', 'observe', 'heartbeat', 'receipt'];
    if (alwaysSafe.includes(action)) return true;

    // Risky actions need low ethics threshold (bold agent) to auto-pass
    const riskyActions = ['bash', 'file_write', 'net', 'evolve', 'birth', 'mint'];
    if (riskyActions.includes(action)) {
      return this.ethicsThreshold < 0.3;
    }

    return true;
  }

  /**
   * Set or update a permission for an action.
   */
  setPermission(action, mode) {
    if (!Object.values(PermissionMode).includes(mode)) {
      throw new Error(`Invalid permission mode: ${mode}`);
    }
    this.matrix[action] = mode;
  }

  /**
   * Reset session approvals (e.g., when entering a new plan).
   */
  resetSession() {
    this.sessionApprovals.clear();
  }

  /**
   * Get audit trail, optionally filtered.
   */
  getAuditLog(filter = {}) {
    let log = this.auditLog;
    if (filter.action) log = log.filter(e => e.action === filter.action);
    if (filter.granted !== undefined) log = log.filter(e => e.granted === filter.granted);
    return log;
  }

  /**
   * Generate a signed audit receipt for the permission log.
   */
  sealAuditLog() {
    const payload = JSON.stringify(this.auditLog);
    const hash = crypto.createHash('sha256').update(payload).digest('hex');
    return {
      entries: this.auditLog.length,
      hash,
      sealed_at: new Date().toISOString(),
    };
  }

  static _defaultPrompt(action, context) {
    // In non-interactive environments, deny by default
    console.log(`[PERMISSION] Action "${action}" requires approval. Context:`, context);
    console.log('[PERMISSION] Auto-denying (non-interactive mode). Use promptFn for interactive.');
    return false;
  }
}

// ────────────────────────────────────────────────────────────
// AST Integration — Parse permission blocks from Swibe source
// ────────────────────────────────────────────────────────────

/**
 * Build a PermissionGate from a parsed ethics+permissions AST.
 * Used by the compiler to extract permission declarations.
 *
 * @param {object} ethicsNode — EthicsStatement AST node
 * @param {object} [permNode] — PermissionStatement AST node
 * @param {number} [ethicsThreshold] — From SovereignNeuralLayer
 */
function gateFromAST(ethicsNode, permNode, ethicsThreshold = 0.5) {
  const overrides = {};

  if (permNode && permNode.rules) {
    for (const rule of permNode.rules) {
      const action = rule.action || rule.rule;
      const mode = typeof rule.value === 'string'
        ? rule.value
        : (rule.value?.value || PermissionMode.ASK);
      overrides[action] = mode;
    }
  }

  return new PermissionGate(overrides, ethicsThreshold);
}

export { PermissionGate, PermissionMode, DEFAULT_PERMISSIONS, gateFromAST };
