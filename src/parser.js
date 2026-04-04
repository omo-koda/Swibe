/**
 * Swibe Language Parser
 * Builds AST from tokens
 */

import { TokenType } from './lexer.js';

class ASTNode {
  constructor(type, props = {}) {
    Object.assign(this, props);
    this.type = type;
  }
}

class Parser {
  constructor(tokens) {
    this.tokens = tokens;
    this.pos = 0;
    this.errors = [];
  }

  current() {
    if (this.pos >= this.tokens.length) return this.tokens[this.tokens.length - 1];
    return this.tokens[this.pos];
  }

  peek(offset = 1) {
    if (this.pos + offset >= this.tokens.length) return this.tokens[this.tokens.length - 1];
    return this.tokens[this.pos + offset];
  }

  advance() {
    this.pos++;
  }

  isAtEnd() {
    return this.current().type === TokenType.EOF;
  }

  previous() {
    return this.tokens[this.pos - 1] || this.tokens[0];
  }

  synchronize() {
    this.advance();
    const syncTokens = [
      TokenType.FN, TokenType.SKILL,
      TokenType.STRUCT, TokenType.ENUM,
      TokenType.APP, TokenType.SWARM
    ];
    while (!this.isAtEnd()) {
      if (this.previous().type === TokenType.SEMICOLON) return;
      if (syncTokens.includes(this.current().type)) return;
      this.advance();
    }
  }

  expect(type) {
    const current = this.current();
    if (current.type !== type) {
      // Special case: keywords as valid IDENTIFIER
      const allowed = [
        TokenType.PRINTLN, TokenType.RAG, TokenType.AI, TokenType.EMBED, 
        TokenType.GOAL, TokenType.ROLE, TokenType.AGENT, TokenType.MINT,
        TokenType.RECEIPT, TokenType.SEAL, TokenType.WALRUS
      ];
      if (type === TokenType.IDENTIFIER && allowed.includes(current.type)) {
        this.advance();
        return current;
      }
      throw new Error(
        `Expected ${type}, got ${current.type} at ${current.line}:${current.column}`
      );
    }
    this.advance();
    return current;
  }

  match(...types) {
    if (types.includes(this.current().type)) {
      const token = this.current();
      this.advance();
      return token;
    }
    return null;
  }

  parse() {
    const statements = [];
    while (this.current().type !== TokenType.EOF) {
      try {
        const stmt = this.parseStatement();
        if (stmt !== null) statements.push(stmt);
      } catch (error) {
        this.errors.push(error.message);
        this.synchronize();
      }
    }
    return new ASTNode('Program', { statements });
  }

  parseStatement() {
    const token = this.current();

    // Function declaration
    if (token.type === TokenType.FN) {
      return this.parseFunctionDecl();
    }

    // Struct declaration
    if (token.type === TokenType.STRUCT) {
      return this.parseStructDecl();
    }

    // Enum declaration
    if (token.type === TokenType.ENUM) {
      return this.parseEnumDecl();
    }

    // If statement
    if (token.type === TokenType.IF) {
      return this.parseIfStatement();
    }

    // Match statement
    if (token.type === TokenType.MATCH) {
      return this.parseMatchStatement();
    }

    // Swarm statement
    if (token.type === TokenType.SWARM) {
      return this.parseSwarmStatement();
    }

    // Neural statement
    if (token.type === TokenType.NEURAL) {
      this.advance();
      this.match(TokenType.SEMICOLON);
      return new ASTNode('NeuralLayer', {});
    }

    // App declaration
    if (token.type === TokenType.APP) {
      return this.parseAppDecl();
    }

    // Meta-digital declaration
    if (token.type === TokenType.META_DIGITAL) {
      return this.parseMetaDigital();
    }

    // Skill declaration
    if (token.type === TokenType.SKILL) {
      return this.parseSkillDecl();
    }

    // Secure block
    if (token.type === TokenType.SECURE) {
      return this.parseSecureBlock();
    }

    // Chain statement
    if (token.type === TokenType.CHAIN) {
      return this.parseChainStatement();
    }

    // Plan statement
    if (token.type === TokenType.PLAN) {
      return this.parsePlanStatement();
    }

    // Loop until goal
    if (token.type === TokenType.LOOP) {
      return this.parseLoopUntil();
    }

    // Target directive (@target)
    if (token.type === TokenType.AT_TARGET) {
      this.advance();
      let body = null;
      if (this.current().type === TokenType.LBRACE) {
        body = this.parseBlock();
      }
      return new ASTNode('TargetDirective', { target: token.value, body });
    }

    // New statements for sovereign blockchain integration
    if (token.type === TokenType.MINT) {
      this.advance();
      const args = this.parseExpression();
      this.match(TokenType.SEMICOLON);
      return new ASTNode('MintStatement', { args });
    }

    if (token.type === TokenType.RECEIPT) {
      this.advance();
      const args = this.parseExpression();
      this.match(TokenType.SEMICOLON);
      return new ASTNode('ReceiptStatement', { args });
    }

    if (token.type === TokenType.SEAL) {
      this.advance();
      this.match(TokenType.SEMICOLON);
      return new ASTNode('SealStatement', {});
    }

    if (token.type === TokenType.WALRUS) {
      this.advance();
      const args = this.parseExpression();
      this.match(TokenType.SEMICOLON);
      return new ASTNode('WalrusStatement', { args });
    }

    // Call tool statement
    if (token.type === TokenType.CALL_TOOL) {
      return this.parseCallToolStatement();
    }

    // Think statement (keyword syntax: think "prompt" { config })
    // Falls through to expression parser if followed by ( for backward compat
    if (token.type === TokenType.THINK && this.peek().type !== TokenType.LPAREN) {
      return this.parseThinkStatement();
    }

    // Return statement
    if (token.type === TokenType.RETURN) {
      this.advance();
      const value = this.parseExpression();
      this.match(TokenType.SEMICOLON);
      return new ASTNode('Return', { value });
    }

    // Break statement
    if (token.type === TokenType.BREAK) {
      this.advance();
      this.match(TokenType.SEMICOLON);
      return new ASTNode('Break', {});
    }

    // Variable declaration
    if (token.type === TokenType.LET || token.type === TokenType.CONST) {
      return this.parseVariableDecl();
    }

    // Top-level assignment (implicit let)
    if (token.type === TokenType.IDENTIFIER && this.peek().type === TokenType.ASSIGN) {
      const name = this.expect(TokenType.IDENTIFIER).value;
      this.expect(TokenType.ASSIGN);
      const value = this.parseExpression();
      this.match(TokenType.SEMICOLON);
      return new ASTNode('VariableDecl', { name, value, isMut: true });
    }

    // Expression statement
    const expr = this.parseExpression();
    this.match(TokenType.SEMICOLON);
    return expr;
  }

  parseFunctionDecl() {
    this.expect(TokenType.FN);
    const name = this.expect(TokenType.IDENTIFIER).value;

    // Type parameters (generics)
    let typeParams = [];
    if (this.current().type === TokenType.LT) {
      this.advance();
      typeParams = this.parseTypeParamList();
      this.expect(TokenType.GT);
    }

    // Parameters
    this.expect(TokenType.LPAREN);
    const params = this.parseParamList();
    this.expect(TokenType.RPAREN);

    // Return type
    let returnType = null;
    if (this.current().type === TokenType.ARROW) {
      this.advance();
      returnType = this.parseType();
    }

    // Body
    const body = this.parseBlock(true);

    return new ASTNode('FunctionDecl', {
      name,
      params,
      returnType,
      body,
      typeParams,
    });
  }

  parseThinkStatement() {
    this.advance(); // consume THINK token
    const prompt = this.parseExpression();
    const config = {};
    if (this.current().type === TokenType.LBRACE) {
      this.advance(); // consume {
      while (this.current().type !== TokenType.RBRACE && !this.isAtEnd()) {
        const key = this.expect(TokenType.IDENTIFIER).value;
        this.expect(TokenType.COLON);
        const val = this.parseExpression();
        config[key] = val;
        if (this.current().type === TokenType.COMMA) this.advance();
      }
      this.expect(TokenType.RBRACE);
    }
    this.match(TokenType.SEMICOLON);
    return new ASTNode('ThinkStatement', { prompt, config });
  }

  parseParamList() {
    const params = [];
    while (this.current().type !== TokenType.RPAREN) {
      const name = this.expect(TokenType.IDENTIFIER).value;
      let type = null;
      if (this.current().type === TokenType.COLON) {
        this.advance();
        type = this.parseType();
      }
      params.push({ name, type });

      if (this.current().type !== TokenType.RPAREN) {
        this.expect(TokenType.COMMA);
      }
    }
    return params;
  }

  parseTypeParamList() {
    const params = [];
    while (this.current().type !== TokenType.GT) {
      const name = this.expect(TokenType.IDENTIFIER).value;
      params.push(name);
      if (this.current().type !== TokenType.GT) {
        this.expect(TokenType.COMMA);
      }
    }
    return params;
  }

  parseType() {
    let type = this.expect(TokenType.IDENTIFIER).value;

    // Generic types (e.g., Option<i32>)
    if (this.current().type === TokenType.LT) {
      this.advance();
      const innerType = this.parseType();
      this.expect(TokenType.GT);
      type = { generic: type, inner: innerType };
    }

    // Array types
    if (this.current().type === TokenType.LBRACKET) {
      this.advance();
      this.expect(TokenType.RBRACKET);
      type = { array: type };
    }

    return type;
  }

  parseStructDecl() {
    this.expect(TokenType.STRUCT);
    const name = this.expect(TokenType.IDENTIFIER).value;
    this.expect(TokenType.LBRACE);

    const fields = [];
    while (this.current().type !== TokenType.RBRACE) {
      const fieldName = this.expect(TokenType.IDENTIFIER).value;
      this.expect(TokenType.COLON);
      const fieldType = this.parseType();
      fields.push({ name: fieldName, type: fieldType });

      if (this.current().type !== TokenType.RBRACE) {
        this.expect(TokenType.COMMA);
      }
    }

    this.expect(TokenType.RBRACE);

    return new ASTNode('StructDecl', { name, fields });
  }

  parseEnumDecl() {
    this.expect(TokenType.ENUM);
    const name = this.expect(TokenType.IDENTIFIER).value;
    this.expect(TokenType.LBRACE);

    const variants = [];
    while (this.current().type !== TokenType.RBRACE) {
      variants.push(this.expect(TokenType.IDENTIFIER).value);
      if (this.current().type !== TokenType.RBRACE) {
        this.expect(TokenType.COMMA);
      }
    }

    this.expect(TokenType.RBRACE);

    return new ASTNode('EnumDecl', { name, variants });
  }

  parseIfStatement() {
    this.expect(TokenType.IF);
    const condition = this.parseExpression();
    const thenBranch = this.parseBlock();

    let elseBranch = null;
    if (this.current().type === TokenType.ELSE) {
      this.advance();
      elseBranch = this.parseBlock();
    }

    return new ASTNode('If', { condition, thenBranch, elseBranch });
  }

  parseMatchStatement() {
    this.expect(TokenType.MATCH);
    const expr = this.parseExpression();
    this.expect(TokenType.LBRACE);

    const arms = [];
    while (this.current().type !== TokenType.RBRACE) {
      const pattern = this.parsePattern();
      this.expect(TokenType.FAT_ARROW);
      const body = this.parseExpression();
      arms.push({ pattern, body });

      if (this.current().type !== TokenType.RBRACE) {
        this.expect(TokenType.COMMA);
      }
    }

    this.expect(TokenType.RBRACE);

    return new ASTNode('Match', { expr, arms });
  }

  parseSwarmStatement() {
    this.expect(TokenType.SWARM);
    this.expect(TokenType.LBRACE);

    const steps = [];
    while (this.current().type !== TokenType.RBRACE) {
      let target = null;

      // Handle @target shorthand before agent name: @elixir Agent Name { ... }
      if (this.current().type === TokenType.AT_TARGET) {
        target = this.current().value;
        this.advance();
      }

      const name = this.expect(TokenType.IDENTIFIER).value;
      this.expect(TokenType.COLON);
      
      let role;
      if (this.current().type === TokenType.IDENTIFIER && this.current().value === 'Agent') {
        this.advance();
        this.expect(TokenType.LBRACE);
        const fields = {};
        while (this.current().type !== TokenType.RBRACE) {
          const fieldName = this.expect(TokenType.IDENTIFIER).value;
          this.expect(TokenType.COLON);
          fields[fieldName] = this.parseExpression();
          if (this.current().type === TokenType.COMMA) this.advance();
        }
        this.expect(TokenType.RBRACE);
        role = new ASTNode('AgentDefinition', { fields });
      } else {
        role = this.parseExpression();
      }
      
      // Also support trailing @target syntax
      if (!target && this.current().type === TokenType.AT_TARGET) {
        target = this.current().value;
        this.advance();
      }

      steps.push({ name, role, target });

      if (this.current().type === TokenType.FAT_ARROW) {
        this.advance();
      } else if (this.current().type === TokenType.COMMA) {
        this.advance();
      } else if (this.current().type !== TokenType.RBRACE) {
        throw new Error(`Expected => or , in swarm at ${this.current().line}:${this.current().column}`);
      }
    }

    this.expect(TokenType.RBRACE);
    return new ASTNode('SwarmStatement', { steps });
  }

  parseAppDecl() {
    this.expect(TokenType.APP);
    this.expect(TokenType.LBRACE);

    const config = {};
    while (this.current().type !== TokenType.RBRACE) {
      const fieldName = this.expect(TokenType.IDENTIFIER).value;
      this.expect(TokenType.COLON);
      config[fieldName] = this.parseExpression();

      if (this.current().type === TokenType.COMMA) {
        this.advance();
      }
    }

    this.expect(TokenType.RBRACE);
    return new ASTNode('AppDecl', { config });
  }

  parseMetaDigital() {
    this.expect(TokenType.META_DIGITAL);
    const name = this.expect(TokenType.STRING).value;
    this.expect(TokenType.LBRACE);

    const config = {};
    while (this.current().type !== TokenType.RBRACE) {
      const fieldName = this.expect(TokenType.IDENTIFIER).value;
      this.expect(TokenType.COLON);
      
      let value;
      if (fieldName === 'chain') {
        value = [];
        while (true) {
          value.push(this.expect(TokenType.IDENTIFIER).value);
          if (this.current().type === TokenType.COMMA) {
            this.advance();
          } else {
            break;
          }
        }
      } else {
        value = this.parseExpression();
      }

      config[fieldName] = value;
      if (this.current().type === TokenType.SEMICOLON) {
        this.advance();
      } else if (this.current().type === TokenType.COMMA) {
        this.advance();
      }
    }

    this.expect(TokenType.RBRACE);
    return new ASTNode('MetaDigital', { name, config });
  }

  parseSkillDecl() {
    this.expect(TokenType.SKILL);
    const name = this.expect(TokenType.IDENTIFIER).value;
    this.expect(TokenType.LBRACE);

    const body = [];
    while (this.current().type !== TokenType.RBRACE) {
      if (this.current().type === TokenType.CALL_TOOL) {
        body.push(this.parseCallToolStatement());
      } else if (this.current().type === TokenType.LOOP) {
        body.push(this.parseLoopUntil());
      } else if (this.current().type === TokenType.SECURE) {
        body.push(this.parseSecureBlock());
      } else {
        const field = this.expect(TokenType.IDENTIFIER).value;
        this.expect(TokenType.COLON);
        const value = this.parseExpression();
        body.push(new ASTNode('SkillProperty', { name: field, value }));
      }
      if (this.current().type === TokenType.COMMA) this.advance();
    }

    this.expect(TokenType.RBRACE);
    return new ASTNode('SkillDecl', { name, body });
  }

  parseSecureBlock() {
    this.expect(TokenType.SECURE);
    const body = this.parseBlock();
    return new ASTNode('SecureBlock', { body });
  }

  parseLoopUntil() {
    this.expect(TokenType.LOOP);
    const untilStr = this.expect(TokenType.STRING).value;
    const body = this.parseBlock();
    return new ASTNode('LoopStatement', { until: untilStr, body });
  }

  parseChainStatement() {
    this.expect(TokenType.CHAIN);
    let name = null;
    if (this.current().type === TokenType.STRING) {
      name = this.expect(TokenType.STRING).value;
    }
    this.expect(TokenType.LBRACE);
    const steps = [];
    while (this.current().type !== TokenType.RBRACE && !this.isAtEnd()) {
      const step = this.parseChainStep();
      steps.push(step);
      if (this.current().type === TokenType.ARROW) {
        this.advance();
      } else if (this.current().type !== TokenType.RBRACE) {
        throw new Error(`Expected '→' or '}' in chain, got ${this.current().type}`);
      }
    }
    this.expect(TokenType.RBRACE);
    return new ASTNode('ChainStatement', { name, steps });
  }

  parseChainStep() {
    const token = this.current();
    if (token.type === TokenType.THINK) {
      this.advance();
      const prompt = this.parseExpression();
      return new ASTNode('ThinkStatement', { prompt });
    } else if (token.type === TokenType.IDENTIFIER && token.value === 'invoke') {
      this.advance();
      const tool = this.parseExpression();
      return new ASTNode('InvokeStatement', { tool });
    } else if (token.type === TokenType.IDENTIFIER && token.value === 'retrieve') {
      this.advance();
      const vault = this.parseExpression();
      return new ASTNode('RetrieveStatement', { vault });
    } else if (token.type === TokenType.RECEIPT) {
      this.advance();
      return new ASTNode('ReceiptStatement', {});
    }
    throw new Error(`Unexpected step in chain: ${token.type}`);
  }

  parsePlanStatement() {
    this.expect(TokenType.PLAN);
    let goal = null;
    if (this.current().type === TokenType.STRING) {
      goal = this.expect(TokenType.STRING).value;
    }
    const body = this.parseBlock();
    return new ASTNode('PlanStatement', { goal, body });
  }

  parseCallToolStatement() {
    this.expect(TokenType.CALL_TOOL);
    const name = this.expect(TokenType.STRING).value;
    const args = this.parseExpression(); // Expecting a DictLiteral or other expression
    return new ASTNode('CallToolStatement', { name, args });
  }

  parsePattern() {
    if (this.current().type === TokenType.IDENTIFIER) {
      const name = this.expect(TokenType.IDENTIFIER).value;

      // Some(x) pattern
      if (this.current().type === TokenType.LPAREN) {
        this.advance();
        const inner = this.parsePattern();
        this.expect(TokenType.RPAREN);
        return new ASTNode('ConstructorPattern', {
          constructor: name,
          args: [inner],
        });
      }

      return new ASTNode('IdentifierPattern', { name });
    }

    throw new Error(`Unexpected pattern: ${this.current().type}`);
  }

  parseVariableDecl() {
    const isMut = this.match(TokenType.MUT);
    this.expect(TokenType.LET);
    const name = this.expect(TokenType.IDENTIFIER).value;

    let type = null;
    if (this.current().type === TokenType.COLON) {
      this.advance();
      type = this.parseType();
    }

    this.expect(TokenType.ASSIGN);
    const value = this.parseExpression();
    this.match(TokenType.SEMICOLON);

    return new ASTNode('VariableDecl', { name, type, value, isMut });
  }

  parseBlock(isFunctionBody = false) {
    this.expect(TokenType.LBRACE);
    const statements = [];

    while (this.current().type !== TokenType.RBRACE && !this.isAtEnd()) {
      try {
        const stmt = this.parseStatement();
        if (stmt !== null) statements.push(stmt);
      } catch (error) {
        this.errors.push(error.message);
        this.synchronize();
        if (this.current().type === TokenType.RBRACE || this.isAtEnd()) break;
      }
    }

    this.expect(TokenType.RBRACE);

    // If this is a function body and the last statement is an expression, wrap it in Return
    if (isFunctionBody && statements.length > 0) {
      const last = statements[statements.length - 1];
      const expressionTypes = ['BinaryOp', 'Number', 'String', 'Boolean', 'Nil', 'Identifier', 'FunctionCall', 'Call', 'MethodCall', 'FieldAccess', 'ArrayLiteral', 'DictLiteral', 'Index'];
      if (expressionTypes.includes(last.type)) {
        // Don't wrap print calls in return
        if (!(last.type === 'FunctionCall' && last.name === 'print')) {
          statements[statements.length - 1] = new ASTNode('Return', { value: last });
        }
      }
    }

    return new ASTNode('Block', { statements });
  }

  parseExpression() {
    return this.parsePipeline();
  }

  parsePipeline() {
    let left = this.parseLogicalOr();

    while (this.current().type === TokenType.PIPE) {
      this.advance();
      const right = this.parseLogicalOr();
      left = new ASTNode('Pipeline', { left, right });
    }

    return left;
  }

  parseLogicalOr() {
    let left = this.parseLogicalAnd();

    while (this.current().type === TokenType.OR) {
      this.advance();
      const right = this.parseLogicalAnd();
      left = new ASTNode('BinaryOp', { op: '||', left, right });
    }

    return left;
  }

  parseLogicalAnd() {
    let left = this.parseEquality();

    while (this.current().type === TokenType.AND) {
      this.advance();
      const right = this.parseEquality();
      left = new ASTNode('BinaryOp', { op: '&&', left, right });
    }

    return left;
  }

  parseEquality() {
    let left = this.parseRelational();

    while (this.current().type === TokenType.EQ || this.current().type === TokenType.NE) {
      const op = this.current().value;
      this.advance();
      const right = this.parseRelational();
      left = new ASTNode('BinaryOp', { op, left, right });
    }

    return left;
  }

  parseRelational() {
    let left = this.parseAdditive();

    while (
      this.current().type === TokenType.LT ||
      this.current().type === TokenType.LE ||
      this.current().type === TokenType.GT ||
      this.current().type === TokenType.GE
    ) {
      const op = this.current().value;
      this.advance();
      const right = this.parseAdditive();
      left = new ASTNode('BinaryOp', { op, left, right });
    }

    return left;
  }

  parseAdditive() {
    let left = this.parseMultiplicative();

    while (this.current().type === TokenType.PLUS || this.current().type === TokenType.MINUS) {
      const op = this.current().value;
      this.advance();
      const right = this.parseMultiplicative();
      left = new ASTNode('BinaryOp', { op, left, right });
    }

    return left;
  }

  parseMultiplicative() {
    let left = this.parseUnary();

    while (
      this.current().type === TokenType.STAR ||
      this.current().type === TokenType.SLASH ||
      this.current().type === TokenType.PERCENT
    ) {
      const op = this.current().value;
      this.advance();
      const right = this.parseUnary();
      left = new ASTNode('BinaryOp', { op, left, right });
    }

    return left;
  }

  parseUnary() {
    if (this.current().type === TokenType.NOT) {
      this.advance();
      const expr = this.parseUnary();
      return new ASTNode('UnaryOp', { op: '!', expr });
    }

    if (this.current().type === TokenType.MINUS) {
      this.advance();
      const expr = this.parseUnary();
      return new ASTNode('UnaryOp', { op: '-', expr });
    }

    if (this.current().type === TokenType.AMPERSAND) {
      this.advance();
      const expr = this.parseUnary();
      return new ASTNode('UnaryOp', { op: '&', expr });
    }

    return this.parsePostfix();
  }

  parsePostfix() {
    let expr = this.parsePrimary();

    while (true) {
      if (this.current().type === TokenType.DOT) {
        this.advance();
        const field = this.expect(TokenType.IDENTIFIER).value;

        if (this.current().type === TokenType.LPAREN) {
          // Method call
          this.advance();
          const args = this.parseArgumentList();
          this.expect(TokenType.RPAREN);
          expr = new ASTNode('MethodCall', { object: expr, method: field, args });
        } else {
          // Field access
          expr = new ASTNode('FieldAccess', { object: expr, field });
        }
      } else if (this.current().type === TokenType.LBRACKET) {
        this.advance();
        const index = this.parseExpression();
        this.expect(TokenType.RBRACKET);
        expr = new ASTNode('Index', { object: expr, index });
      } else if (this.current().type === TokenType.LPAREN) {
        // Call
        this.advance();
        const args = this.parseArgumentList();
        this.expect(TokenType.RPAREN);
        
        if (expr.type === 'Identifier') {
          expr = new ASTNode('FunctionCall', { name: expr.name, args });
        } else {
          expr = new ASTNode('Call', { callee: expr, args });
        }
      } else {
        break;
      }
    }

    return expr;
  }

  parseArgumentList() {
    const args = [];
    while (this.current().type !== TokenType.RPAREN) {
      args.push(this.parseExpression());
      if (this.current().type !== TokenType.RPAREN) {
        this.expect(TokenType.COMMA);
      }
    }
    return args;
  }

  parsePrimary() {
    const token = this.current();

    // Literals
    if (token.type === TokenType.NUMBER) {
      this.advance();
      return new ASTNode('Number', { value: parseFloat(token.value) });
    }

    if (token.type === TokenType.STRING) {
      this.advance();
      return new ASTNode('String', { value: token.value });
    }

    if (token.type === TokenType.TRUE) {
      this.advance();
      return new ASTNode('Boolean', { value: true });
    }

    if (token.type === TokenType.FALSE) {
      this.advance();
      return new ASTNode('Boolean', { value: false });
    }

    if (token.type === TokenType.NIL || token.type === TokenType.NONE) {
      this.advance();
      return new ASTNode('Nil', {});
    }

    // Prompt
    if (token.type === TokenType.PROMPT) {
      this.advance();
      return new ASTNode('Prompt', { text: token.value });
    }

    // Voice
    if (token.type === TokenType.VOICE) {
      this.advance();
      return new ASTNode('Voice', { text: token.value });
    }

    // call_tool expression is used both as statement and value expression
    if (token.type === TokenType.CALL_TOOL) {
      return this.parseCallToolStatement();
    }

    // Identifier or AI keywords as identifiers (includes THINK for think(...) call syntax)
    if (token.type === TokenType.IDENTIFIER ||
        token.type === TokenType.PRINTLN ||
        token.type === TokenType.RAG ||
        token.type === TokenType.AI ||
        token.type === TokenType.EMBED ||
        token.type === TokenType.THINK ||
        token.type === TokenType.SEAL ||
        token.type === TokenType.MINT ||
        token.type === TokenType.RECEIPT ||
        token.type === TokenType.WALRUS) {
      this.advance();
      return new ASTNode('Identifier', { name: token.value });
    }

    // Array literal
    if (token.type === TokenType.LBRACKET) {
      this.advance();
      const elements = [];
      while (this.current().type !== TokenType.RBRACKET) {
        elements.push(this.parseExpression());
        if (this.current().type !== TokenType.RBRACKET) {
          this.expect(TokenType.COMMA);
        }
      }
      this.expect(TokenType.RBRACKET);
      return new ASTNode('ArrayLiteral', { elements });
    }

    // Grouped expression or tuple
    if (token.type === TokenType.LPAREN) {
      this.advance();
      const expr = this.parseExpression();
      this.expect(TokenType.RPAREN);
      return expr;
    }

    // Anonymous Dictionary Literal
    if (token.type === TokenType.LBRACE) {
      this.advance();
      const fields = {};
      while (this.current().type !== TokenType.RBRACE) {
        const fieldName = this.expect(TokenType.IDENTIFIER).value;
        this.expect(TokenType.COLON);
        fields[fieldName] = this.parseExpression();
        if (this.current().type === TokenType.COMMA) this.advance();
      }
      this.expect(TokenType.RBRACE);
      return new ASTNode('DictLiteral', { fields });
    }

    // Struct literal (named)
    if (token.type === TokenType.IDENTIFIER) {
      const name = token.value;
      if (this.peek().type === TokenType.LBRACE) {
        this.advance();
        this.advance();
        const fields = {};
        while (this.current().type !== TokenType.RBRACE) {
          const fieldName = this.expect(TokenType.IDENTIFIER).value;
          this.expect(TokenType.COLON);
          fields[fieldName] = this.parseExpression();
          if (this.current().type !== TokenType.RBRACE) {
            this.expect(TokenType.COMMA);
          }
        }
        this.expect(TokenType.RBRACE);
        return new ASTNode('StructLiteral', { name, fields });
      }
    }

    if (token.type === TokenType.CALL_TOOL) {
      return this.parseCallToolStatement();
    }

    throw new Error(`Unexpected token: ${token.type} at ${token.line}:${token.column}`);
  }
}

export { Parser, ASTNode };
