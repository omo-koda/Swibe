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
}
