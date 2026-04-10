/**
 * Swibe Type Inferencer
 * Infers types from AST for compiler hardening
 */

export class TypeInferencer {
  constructor(ast) {
    this.ast = ast;
    this.env = new Map();
    this.errors = [];
  }

  infer() {
    if (this.ast && this.ast.statements) {
      for (const stmt of this.ast.statements) {
        this._inferStatement(stmt);
      }
    }
    return {
      types: Object.fromEntries(this.env),
      errors: this.errors
    };
  }

  _inferStatement(node) {
    if (!node) return;
    switch (node.type) {
      case 'FunctionDecl':
        this.env.set(node.name, 'function');
        if (node.body && node.body.statements) {
          for (const s of node.body.statements) {
            this._inferStatement(s);
          }
        }
        break;
      case 'ThinkStatement':
        this.env.set('think_result', 'Receipt');
        break;
      case 'SwarmStatement':
        this.env.set('swarm_result', 'SwarmResult[]');
        break;
      case 'BirthStatement':
        this.env.set('agent', 'SovereignAgent');
        break;
      case 'BudgetStatement':
        this.env.set('budget', 'Budget');
        break;
      case 'RememberStatement':
        this.env.set('memory', 'MemoryEntry');
        break;
      case 'EvolveStatement':
        this.env.set('soul', 'Soul');
        break;
      case 'EthicsStatement':
        this.env.set('ethics', 'EthicsResult');
        break;
      case 'HeartbeatStatement':
        this.env.set('heartbeat', 'HeartbeatHandle');
        break;
      case 'VariableDecl': {
        const t = this._inferExpression(node.value);
        this.env.set(node.name, t);
        break;
      }
    }
  }

  _inferExpression(node) {
    if (!node) return 'unknown';
    switch (node.type) {
      case 'String': return 'string';
      case 'Number': return 'number';
      case 'Boolean': return 'bool';
      case 'Identifier':
        return this.env.get(node.name) || 'unknown';
      case 'BinaryOp':
        return 'number';
      default:
        return 'unknown';
    }
  }
}
