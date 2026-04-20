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

  visitEthicsStatement(_node) {
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
    // File edits are sensitive — require both ethics and permissions
    if (!this._hasEthics) {
      this.violations.push({
        type: 'edit_without_ethics',
        message: 'File edit requires ethics {} declaration',
        node: node,
      });
    }
    if (!this._hasPermissions) {
      this.violations.push({
        type: 'edit_without_permissions',
        message: 'File edit requires a permission {} block (high-risk primitive)',
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

  visitSessionStatement(_node) {
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

  visitAnalyticsStatement(_node) {
    // Analytics is safe — just tracking
    this._hasAnalytics = true;
  }

  visitCoordinateStatement(_node) {
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
    if (this._hasSecure && this._secureExecution !== 'strict-vm') {
      this.violations.push({
        type: 'witness_insecure_execution',
        message: 'Witness used with secure block but execution is not "strict-vm". High risk.',
        node: node,
        severity: 'warning'
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
    if (this._hasSecure && this._secureExecution !== 'strict-vm') {
      this.violations.push({
        type: 'pilot_insecure_execution',
        message: 'Pilot used with secure block but execution is not "strict-vm". High risk.',
        node: node,
        severity: 'warning'
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

  visitSecureBlock(node) {
    this._hasSecure = true;
    this._secureExecution = node.policies?.execution;
    // Validate that secure policy fields are recognized
    const validPolicies = ['execution', 'network', 'filesystem', 'memory', 'receipts', 'audit', 'llm_routing', 'receipt_sealing', 'strict'];
    if (node.policies) {
      for (const key of Object.keys(node.policies)) {
        if (!validPolicies.includes(key)) {
          this.violations.push({
            type: 'unknown_secure_policy',
            message: `Unknown secure policy field: "${key}". Valid: ${validPolicies.join(', ')}`,
            node,
          });
        }
      }
    }
  }

  visitFilesystemBlock(node) {
    this._hasFilesystem = true;
    if (!this._hasEthics) {
      this.violations.push({
        type: 'filesystem_without_ethics',
        message: 'Filesystem policy declaration requires an ethics {} block',
        node: node,
      });
    }
  }

  visitGestaltStatement(_node) {
    // Gestalt (parallel execution) is safe but note its presence
  }

  // Phase 7: ToC Tokenomics validators

  visitTokenStatement(node) {
    // Token definition requires ethics — it's economic infrastructure
    if (!this._hasEthics) {
      this.violations.push({
        type: 'token_without_ethics',
        message: 'Token definition requires ethics {} declaration',
        node: node,
      });
    }
  }

  visitWalletStatement(node) {
    // Wallet creation requires ethics and permissions
    if (!this._hasEthics) {
      this.violations.push({
        type: 'wallet_without_ethics',
        message: 'Wallet creation requires ethics {} declaration',
        node: node,
      });
    }
  }

  visitStakeStatement(node) {
    // Staking is economic — requires ethics
    if (!this._hasEthics) {
      this.violations.push({
        type: 'stake_without_ethics',
        message: 'Staking requires ethics {} declaration',
        node: node,
      });
    }
  }

  visitSlashStatement(node) {
    // Slashing is punitive — requires both ethics and permissions
    if (!this._hasEthics) {
      this.violations.push({
        type: 'slash_without_ethics',
        message: 'Slashing requires ethics {} declaration',
        node: node,
      });
    }
    if (!this._hasPermissions) {
      this.violations.push({
        type: 'slash_without_permissions',
        message: 'Slashing requires a permission {} block',
        node: node,
      });
    }
  }

  visitMintStatement(node) {
    // Mint is high-risk — requires both ethics and permissions
    if (!this._hasEthics) {
      this.violations.push({
        type: 'mint_without_ethics',
        message: 'Mint requires ethics {} declaration',
        node: node,
      });
    }
    if (!this._hasPermissions) {
      this.violations.push({
        type: 'mint_without_permissions',
        message: 'Mint requires a permission {} block (high-risk primitive)',
        node: node,
      });
    }
  }

  visitConvertStatement(node) {
    // Conversion is economic — requires ethics
    if (!this._hasEthics) {
      this.violations.push({
        type: 'convert_without_ethics',
        message: 'Token conversion requires ethics {} declaration',
        node: node,
      });
    }
  }

  visitRoyaltyStatement(node) {
    // Royalty is economic — requires ethics
    if (!this._hasEthics) {
      this.violations.push({
        type: 'royalty_without_ethics',
        message: 'Royalty configuration requires ethics {} declaration',
        node: node,
      });
    }
  }

  visitEscrowStatement(node) {
    // Escrow is financial — requires ethics and permissions
    if (!this._hasEthics) {
      this.violations.push({
        type: 'escrow_without_ethics',
        message: 'Escrow requires ethics {} declaration',
        node: node,
      });
    }
    if (!this._hasPermissions) {
      this.violations.push({
        type: 'escrow_without_permissions',
        message: 'Escrow requires a permission {} block',
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
    const safeActions = ['think', 'chain', 'plan', 'retrieve', 'remember', 'observe', 'heartbeat', 'receipt', 'session', 'gestalt'];
    if (safeActions.includes(action)) return 'auto';
    return 'ask';
  }
}

// ────────────────────────────────────────────────────────────
// Layered Architecture Validator
// ────────────────────────────────────────────────────────────
//
// Layer 0 – Ethics & Identity: ethics, secure, neural, wallet, token
// Layer 1 – Core Agent:        think, remember, budget, permission, skill
// Layer 2 – Coordination:      swarm, team, coordinate, gestalt
// Layer 3 – Execution:         pilot, witness, mcp, edit, bridge, viewport
//
// Lower layers should be declared before higher ones.
// Out-of-order declarations produce warnings (not hard errors).
// ────────────────────────────────────────────────────────────

const LAYER_MAP = {
  // Layer 0 – Ethics & Identity
  EthicsStatement: 0,
  SecureBlock: 0,
  FilesystemBlock: 0,
  NeuralLayer: 0,
  WalletStatement: 0,
  TokenStatement: 0,
  // Layer 1 – Core Agent
  ThinkStatement: 1,
  RememberStatement: 1,
  BudgetStatement: 1,
  PermissionStatement: 1,
  SkillDecl: 1,
  ChainStatement: 1,
  PlanStatement: 1,
  // Layer 2 – Coordination
  SwarmStatement: 2,
  TeamStatement: 2,
  CoordinateStatement: 2,
  GestaltStatement: 2,
  // Layer 3 – Execution
  PilotStatement: 3,
  WitnessStatement: 3,
  MCPStatement: 3,
  EditStatement: 3,
  BridgeStatement: 3,
  ViewportStatement: 3,
};

const LAYER_NAMES = ['Ethics & Identity', 'Core Agent', 'Coordination', 'Execution'];

export class LayerValidator extends ASTVisitor {
  constructor(options = {}) {
    super();
    this.warnings = [];
    this.strict = options.strict || false;
    this.targetLanguage = options.targetLanguage || 'javascript';
    this._highestLayer = -1;
    this._highestLayerNode = null;
    this._order = [];
  }

  visitSecureBlock(node) {
    if (node.policies && (node.policies.strict === true || node.policies.strict === 'true')) {
      this.strict = true;
    }
    return this.visitDefault(node);
  }

  visitMintStatement(node) {
    if (this.targetLanguage !== 'move' && this.targetLanguage !== 'javascript' && this.targetLanguage !== 'all') {
      this.warnings.push({
        type: 'unsupported_primitive',
        message: `Primitive "mint" is primarily supported on "move" or "javascript" targets. Current target: "${this.targetLanguage}".`,
        node,
        severity: 'warning'
      });
    }
    return this.visitDefault(node);
  }

  visitWalrusStatement(node) {
    if (this.targetLanguage !== 'move' && this.targetLanguage !== 'javascript' && this.targetLanguage !== 'all') {
      this.warnings.push({
        type: 'unsupported_primitive',
        message: `Primitive "walrus" is primarily supported on "move" or "javascript" targets. Current target: "${this.targetLanguage}".`,
        node,
        severity: 'warning'
      });
    }
    return this.visitDefault(node);
  }

  visit(node) {
    if (!node) return;
    const layer = LAYER_MAP[node.type];
    if (layer !== undefined) {
      if (layer < this._highestLayer) {
        this.warnings.push({
          type: 'layer_order',
          message: `Layer ${layer} (${LAYER_NAMES[layer]}: ${node.type}) declared after Layer ${this._highestLayer} (${LAYER_NAMES[this._highestLayer]}). Declare Layer 0 before Layer 1, Layer 1 before Layer 2, etc.`,
          node,
          declaredLayer: layer,
          afterLayer: this._highestLayer,
        });
      }
      if (layer > this._highestLayer) {
        this._highestLayer = layer;
        this._highestLayerNode = node;
      }
      this._order.push({ type: node.type, layer });
    }
    return super.visit(node);
  }

  getLayerReport() {
    return {
      order: this._order,
      warnings: this.warnings,
      valid: this.warnings.length === 0,
    };
  }
}

export { LAYER_MAP, LAYER_NAMES };
