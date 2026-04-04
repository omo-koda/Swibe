/**
 * Ruby Backend for Swibe
 */

export function genRuby(node, indent = "") {
  if (!node) return '';

  switch (node.type) {
    case 'Program': {
      let code = node.statements.map(s => genRuby(s, "")).join('\n\n');
      // Always call main if it exists
      if (node.statements.some(s => s.type === 'FunctionDecl' && s.name === 'main')) {
        code += '\n\nmain()';
      }
      return code;
    }
    case 'FunctionDecl': {
      const params = node.params.map(p => p.name).join(', ');
      return `${indent}def ${node.name}(${params})\n` +
        genRuby(node.body, indent + "  ") +
        `\n${indent}end`;
    }
    case 'Block':
      return node.statements.map((s, i) => {
        const code = genRuby(s, indent);
        // For the last statement in a block, add implicit return
        if (i === node.statements.length - 1) {
          if ((s.type === 'BinaryOp' || s.type === 'FunctionCall' || s.type === 'Identifier' || s.type === 'Number') &&
              !(s.type === 'FunctionCall' && s.name === 'print')) {
            return code;
          }
        }
        return code;
      }).join('\n');
    case 'VariableDecl':
      return `${indent}${node.name} = ${genRuby(node.value, "")}`;
    case 'Return':
      return `${indent}return ${genRuby(node.value, "")}`;
    case 'FunctionCall':
      if (node.name === 'print') {
        return `${indent}puts(${node.args.map(a => genRuby(a, "")).join(', ')})`;
      }
      return `${indent}${node.name}(${node.args.map(a => genRuby(a, "")).join(', ')})`;
    case 'BinaryOp':
      return `(${genRuby(node.left, "")} ${node.op} ${genRuby(node.right, "")})`;
    case 'Number':
      return String(node.value);
    case 'String':
      return `"${node.value.replace(/\n/g, '\\n').replace(/"/g, '\\"')}"`;
    case 'Boolean':
      return node.value ? 'true' : 'false';
    case 'Nil':
      return 'nil';
    case 'Identifier':
      return node.name;
    case 'ArrayLiteral':
      return `[${node.elements.map(e => genRuby(e, "")).join(', ')}]`;
    default:
      return '';
  }
}
