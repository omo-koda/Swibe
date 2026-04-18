/**
 * Swibe AST Visitor Pattern
 * Enables clean traversal and analysis of AST nodes
 */

export class ASTVisitor {
  visit(node) {
    if (!node) return;
    const method = `visit${node.type}`;
    if (typeof this[method] === 'function') {
      return this[method](node);
    }
    return this.visitDefault(node);
  }

  visitDefault(node) {
    for (const key of Object.keys(node)) {
      if (key === 'type') continue;
      const child = node[key];
      if (Array.isArray(child)) {
        child.forEach(c => {
          if (c && typeof c === 'object') this.visit(c);
        });
      } else if (child && typeof child === 'object') {
        this.visit(child);
      }
    }
  }
}

export class ThinkCollector extends ASTVisitor {
  constructor() {
    super();
    this.thinks = [];
  }

  visitThinkStatement(node) {
    this.thinks.push(node);
    this.visitDefault(node);
  }
}

export class EthicsValidator extends ASTVisitor {
  constructor() {
    super();
    this.violations = [];
    this._hasEthics = false;
    this._hasPermissions = false;
    this._permissionMatrix = {};
  }

  visitThinkStatement(node) {
    if (!this._hasEthics) {
      this.violations.push({
        type: 'missing_ethics',
        node: node
      });
    }
  }

  visitEthicsStatement(node) {
    this._hasEthics = true;
  }

  visitPermissionStatement(node) {
    this._hasPermissions = true;
    for (const rule of (node.rules || [])) {
      const mode = typeof rule.value === 'string'
        ? rule.value
        : rule.value?.value;
      this._permissionMatrix[rule.action] = mode;
    }
  }

  visitMCPStatement(node) {
    // MCP requires explicit permission declaration
    if (!this._hasPermissions) {
      this.violations.push({
        type: 'mcp_without_permissions',
        message: 'MCP connections require a permission {} block',
        node: node,
      });
    }
  }

  visitEditStatement(node) {
    // File edits are sensitive — warn if no ethics block
    if (!this._hasEthics) {
      this.violations.push({
        type: 'edit_without_ethics',
        message: 'File edit requires ethics {} declaration',
        node: node,
      });
    }
  }

  visitBridgeStatement(node) {
    // Bridge requires permissions — it opens external connections
    if (!this._hasPermissions) {
      this.violations.push({
        type: 'bridge_without_permissions',
        message: 'IDE bridge requires a permission {} block',
        node: node,
      });
    }
  }

  visitSessionStatement(node) {
    // Sessions are safe operations — no violation needed
    // But track that sessions are in use for downstream analysis
    this._hasSessions = true;
  }

  visitPolicyStatement(node) {
    // Policy is an org-level control — requires ethics block
    if (!this._hasEthics) {
      this.violations.push({
        type: 'policy_without_ethics',
        message: 'Policy enforcement requires an ethics {} declaration',
        node: node,
      });
    }
    this._hasPolicy = true;
  }

  visitAnalyticsStatement(node) {
    // Analytics is safe — just tracking
    this._hasAnalytics = true;
  }

  visitCoordinateStatement(node) {
    // Coordinate requires a team to be defined
    // (soft check — team might be defined elsewhere)
  }

  visitWitnessStatement(node) {
    // Witness (multimodal perception) requires permissions — accesses external data
    if (!this._hasPermissions) {
      this.violations.push({
        type: 'witness_without_permissions',
        message: 'Witness perception requires a permission {} block',
        node: node,
      });
    }
  }

  visitPilotStatement(node) {
    // Pilot (computer control) requires both ethics and permissions
    if (!this._hasEthics) {
      this.violations.push({
        type: 'pilot_without_ethics',
        message: 'Pilot computer control requires ethics {} declaration',
        node: node,
      });
    }
    if (!this._hasPermissions) {
      this.violations.push({
        type: 'pilot_without_permissions',
        message: 'Pilot computer control requires a permission {} block',
        node: node,
      });
    }
  }

  visitViewportStatement(node) {
    // Viewport (screen capture) requires permissions
    if (!this._hasPermissions) {
      this.violations.push({
        type: 'viewport_without_permissions',
        message: 'Viewport screen access requires a permission {} block',
        node: node,
      });
    }
  }

  visitGestaltStatement(node) {
    // Gestalt (parallel execution) is safe but note its presence
  }

  /**
   * Resolve the permission mode for a given action.
   * Falls back to 'ask' if no explicit rule.
   */
  resolvePermission(action) {
    if (this._permissionMatrix[action]) return this._permissionMatrix[action];
    const safeActions = ['think', 'chain', 'plan', 'retrieve', 'remember', 'observe', 'heartbeat', 'receipt', 'session', 'gestalt'];
    if (safeActions.includes(action)) return 'auto';
    return 'ask';
  }
}
