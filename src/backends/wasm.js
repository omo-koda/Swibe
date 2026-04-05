/**
 * WebAssembly Text Format (WAT) Backend for Swibe
 * Target: Portable binary via WAT → wasm
 */

export function genWasm(node, indent = "") {
  if (!node) return '';

  switch (node.type) {
    case 'Program': {
      let code = `(module\n`;
      code += `  ;; Import host print function\n`;
      code += `  (import "env" "print" (func $print (param i32)))\n`;
      code += `  (import "env" "print_str" (func $print_str (param i32 i32)))\n\n`;
      code += `  (memory (export "memory") 1)\n\n`;

      const funcs = node.statements.filter(s => s.type === 'FunctionDecl');
      const other = node.statements.filter(s => s.type !== 'FunctionDecl');

      funcs.forEach(fn => {
        code += genWasm(fn, "  ") + '\n\n';
      });

      if (other.length > 0) {
        code += `  (func (export "_start")\n`;
        other.forEach(s => {
          code += genWasm(s, "    ") + '\n';
        });
        code += `  )\n`;
      }

      code += `)`;
      return code;
    }
    case 'FunctionDecl': {
      const params = node.params.map(p => {
        const name = typeof p === 'string' ? p.split(':')[0].trim() : p.name;
        return `(param $${name} i32)`;
      }).join(' ');
      const isMain = node.name === 'main';
      const exportStr = isMain ? ` (export "main")` : '';
      const hasReturn = node.body?.statements?.some(s =>
        s.type === 'Return' || s.type === 'BinaryOp' || s.type === 'Number' || s.type === 'Identifier'
      );
      const result = !isMain && hasReturn ? ' (result i32)' : '';
      return `${indent}(func $${node.name}${exportStr} ${params}${result}\n` +
        genWasm(node.body, indent + "    ") +
        `\n${indent})`;
    }
    case 'Block':
      return node.statements.map(s => genWasm(s, indent)).join('\n');

    case 'VariableDecl':
      return `${indent}(local $${node.name} i32)\n${indent}(local.set $${node.name} ${genWasm(node.value, "")})`;

    case 'Return':
      return `${indent}${genWasm(node.value, "")}`;

    case 'FunctionCall': {
      if (node.name === 'print' || node.name === 'println') {
        const arg = node.args[0];
        return `${indent}${genWasm(arg, "")}\n${indent}(call $print)`;
      }
      const args = node.args.map(a => genWasm(a, "")).join('\n' + indent);
      return `${indent}${args}\n${indent}(call $${node.name})`;
    }
    case 'BinaryOp': {
      const left = genWasm(node.left, "");
      const right = genWasm(node.right, "");
      const opMap = { '+': 'i32.add', '-': 'i32.sub', '*': 'i32.mul', '/': 'i32.div_s', '%': 'i32.rem_s', '==': 'i32.eq', '!=': 'i32.ne', '<': 'i32.lt_s', '>': 'i32.gt_s' };
      const op = opMap[node.op] || 'i32.add';
      return `${left}\n${right}\n(${op})`;
    }
    case 'ThinkStatement':
      return `${indent};; think: LLM placeholder`;

    case 'If':
      return `${indent}${genWasm(node.condition, "")}\n${indent}(if\n${indent}  (then\n${genWasm(node.thenBranch, indent + "    ")}\n${indent}  )\n${indent})`;

    case 'Number': return `(i32.const ${node.value})`;
    case 'String': return `(i32.const 0) ;; string: "${node.value}"`;
    case 'Identifier': return `(local.get $${node.name})`;
    case 'Boolean': return `(i32.const ${node.value ? 1 : 0})`;
    case 'Nil': return `(i32.const 0)`;

    default: return `${indent};; Unhandled: ${node.type}`;
  }
}
