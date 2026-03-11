/**
 * Intermediate Representation (IR) Generator
 * Generates cross-platform IR from AST
 */

class IRGenerator {
  constructor() {
    this.ir = {
      version: '1.0',
      module: '',
      functions: [],
      types: [],
      constants: []
    };
  }

  /**
   * Generate IR from AST
   */
  generate(ast) {
    this.ir.module = ast.module || 'main';

    if (ast.functions) {
      ast.functions.forEach(fn => {
        this.ir.functions.push(this.generateFunction(fn));
      });
    }

    if (ast.types) {
      ast.types.forEach(type => {
        this.ir.types.push(this.generateType(type));
      });
    }

    return this.ir;
  }

  /**
   * Generate function IR
   */
  generateFunction(fn) {
    return {
      name: fn.name,
      params: fn.params || [],
      returns: fn.returns || 'void',
      blocks: this.generateBlocks(fn.body)
    };
  }

  /**
   * Generate basic blocks
   */
  generateBlocks(body) {
    const blocks = [];
    let currentBlock = { label: 'entry', instructions: [] };

    if (Array.isArray(body)) {
      body.forEach(stmt => {
        const instr = this.generateInstruction(stmt);
        if (instr) currentBlock.instructions.push(instr);
      });
    }

    blocks.push(currentBlock);
    return blocks;
  }

  /**
   * Generate IR instruction
   */
  generateInstruction(stmt) {
    if (stmt.type === 'assignment') {
      return {
        op: 'store',
        dest: stmt.name,
        src: stmt.value
      };
    }

    if (stmt.type === 'call') {
      return {
        op: 'call',
        func: stmt.name,
        args: stmt.args || []
      };
    }

    if (stmt.type === 'return') {
      return {
        op: 'return',
        value: stmt.value
      };
    }

    return null;
  }

  /**
   * Generate type IR
   */
  generateType(type) {
    if (type.kind === 'struct') {
      return {
        name: type.name,
        kind: 'struct',
        fields: type.fields || []
      };
    }

    if (type.kind === 'enum') {
      return {
        name: type.name,
        kind: 'enum',
        variants: type.variants || []
      };
    }

    return type;
  }

  /**
   * Validate IR
   */
  validate() {
    const errors = [];

    // Check function references
    const funcNames = new Set(this.ir.functions.map(f => f.name));
    this.ir.functions.forEach(fn => {
      fn.blocks.forEach(block => {
        block.instructions.forEach(instr => {
          if (instr.op === 'call' && !funcNames.has(instr.func)) {
            errors.push(`Undefined function: ${instr.func}`);
          }
        });
      });
    });

    return { valid: errors.length === 0, errors };
  }

  /**
   * Optimize IR
   */
  optimize() {
    // Dead code elimination
    this.ir.functions.forEach(fn => {
      fn.blocks.forEach(block => {
        block.instructions = block.instructions.filter(instr => {
          return instr.op !== 'dead';
        });
      });
    });

    // Constant folding would go here
    return this.ir;
  }

  /**
   * Export IR to JSON
   */
  toJSON() {
    return JSON.stringify(this.ir, null, 2);
  }

  /**
   * Export IR to text format
   */
  toText() {
    let text = `module ${this.ir.module}\n\n`;

    // Types
    if (this.ir.types.length > 0) {
      text += '// Types\n';
      this.ir.types.forEach(type => {
        text += `type ${type.name} = ${type.kind}\n`;
      });
      text += '\n';
    }

    // Functions
    text += '// Functions\n';
    this.ir.functions.forEach(fn => {
      text += `function ${fn.name}(${fn.params.join(', ')}) -> ${fn.returns}\n`;
      fn.blocks.forEach(block => {
        text += `  ${block.label}:\n`;
        block.instructions.forEach(instr => {
          text += `    ${instr.op} ${instr.dest || ''} ${instr.src || ''}\n`;
        });
      });
      text += '\n';
    });

    return text;
  }
}

export { IRGenerator };
