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

  /**
   * Resolve the permission mode for a given action.
   * Falls back to 'ask' if no explicit rule.
   */
  resolvePermission(action) {
    if (this._permissionMatrix[action]) return this._permissionMatrix[action];
    const safeActions = ['think', 'chain', 'plan', 'retrieve', 'remember', 'observe', 'heartbeat', 'receipt'];
    if (safeActions.includes(action)) return 'auto';
    return 'ask';
  }
}
