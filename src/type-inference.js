/**
 * Type Inference Engine
 * Bidirectional type inference with constraint solving
 */

class TypeInference {
  constructor() {
    this.primitives = {
      'i32': { kind: 'primitive', bits: 32 },
      'i64': { kind: 'primitive', bits: 64 },
      'f32': { kind: 'primitive', bits: 32 },
      'f64': { kind: 'primitive', bits: 64 },
      'str': { kind: 'primitive' },
      'bool': { kind: 'primitive' },
      'null': { kind: 'primitive' }
    };
    this.constraints = [];
    this.bindings = new Map();
    this.nextTypeVar = 0;
  }

  /**
   * Generate fresh type variable
   */
  freshVar() {
    return `'T${this.nextTypeVar++}`;
  }

  /**
   * Infer type of expression
   */
  infer(expr, expectedType = null) {
    if (typeof expr === 'number') {
      if (Number.isInteger(expr)) return 'i32';
      return 'f64';
    }

    if (typeof expr === 'string') return 'str';
    if (typeof expr === 'boolean') return 'bool';

    if (Array.isArray(expr)) {
      if (expr.length === 0) return this.freshVar();
      const elemType = this.infer(expr[0], expectedType);
      return `[${elemType}]`;
    }

    if (typeof expr === 'object' && expr !== null) {
      if (expr.type === 'binop') {
        return this.inferBinop(expr, expectedType);
      }
      if (expr.type === 'call') {
        return this.inferCall(expr, expectedType);
      }
      if (expr.type === 'if') {
        return this.inferIf(expr, expectedType);
      }
    }

    return this.freshVar();
  }

  /**
   * Infer type of binary operation
   */
  inferBinop(expr) {
    const { left, op, right } = expr;
    const leftType = this.infer(left);
    const rightType = this.infer(right);

    // Constraint: left and right must be same type
    this.addConstraint(leftType, rightType);

    // Result type based on operator
    const resultType = {
      '+': leftType === 'str' ? 'str' : 'i32',
      '-': 'i32',
      '*': 'i32',
      '/': 'f64',
      '%': 'i32',
      '==': 'bool',
      '!=': 'bool',
      '<': 'bool',
      '>': 'bool',
      '<=': 'bool',
      '>=': 'bool',
      '&&': 'bool',
      '||': 'bool'
    }[op];

    return resultType || this.freshVar();
  }

  /**
   * Infer type of function call
   */
  inferCall(expr) {
    const { fn, args } = expr;
    const fnType = this.lookupFunction(fn);
    
    if (fnType) {
      // Check argument types
      if (fnType.params) {
        args.forEach((arg, i) => {
          const argType = this.infer(arg);
          const paramType = fnType.params[i];
          this.addConstraint(argType, paramType);
        });
      }
      return fnType.returns || this.freshVar();
    }

    return this.freshVar();
  }

  /**
   * Infer type of if expression
   */
  inferIf(expr) {
    const { condition, consequent, alternate } = expr;
    
    // Condition must be bool
    const condType = this.infer(condition);
    this.addConstraint(condType, 'bool');

    // Both branches must have same type
    const consequentType = this.infer(consequent);
    const alternateType = this.infer(alternate);
    this.addConstraint(consequentType, alternateType);

    return consequentType;
  }

  /**
   * Add type constraint
   */
  addConstraint(type1, type2) {
    if (type1 !== type2) {
      this.constraints.push({ type1, type2 });
    }
  }

  /**
   * Lookup function signature
   */
  lookupFunction(name) {
    const signatures = {
      'print': { params: ['str'], returns: 'null' },
      'println': { params: ['str'], returns: 'null' },
      'len': { params: ['str', '[T]'], returns: 'i32' },
      'type': { params: ['T'], returns: 'str' },
      'push': { params: ['[T]', 'T'], returns: '[T]' },
      'pop': { params: ['[T]'], returns: 'T' },
      'map': { params: ['[T]', 'fn(T)->U'], returns: '[U]' },
      'filter': { params: ['[T]', 'fn(T)->bool'], returns: '[T]' },
      'reduce': { params: ['[T]', 'fn(T,T)->T', 'T'], returns: 'T' }
    };

    return signatures[name];
  }

  /**
   * Solve constraints
   */
  solve() {
    while (this.constraints.length > 0) {
      const { type1, type2 } = this.constraints.shift();
      
      if (type1.startsWith("'T") && !type2.startsWith("'T")) {
        this.bindings.set(type1, type2);
      } else if (type2.startsWith("'T") && !type1.startsWith("'T")) {
        this.bindings.set(type2, type1);
      }
    }
  }

  /**
   * Apply substitutions
   */
  apply(type) {
    if (this.bindings.has(type)) {
      return this.apply(this.bindings.get(type));
    }
    return type;
  }

  /**
   * Check type compatibility
   */
  isCompatible(type1, type2) {
    type1 = this.apply(type1);
    type2 = this.apply(type2);
    
    if (type1 === type2) return true;
    if (type1 === 'i32' && type2 === 'f64') return true;
    if (type1 === 'i64' && type2 === 'f64') return true;
    
    return false;
  }
}

export { TypeInference };
