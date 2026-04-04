/**
 * Perl Backend for Swibe
 */

export function genPerl(node, indent = "") {
  if (!node) return '';

  switch (node.type) {
    case 'Program': {
      let code = `#!/usr/bin/perl\nuse strict;\nuse warnings;\n\n`;
      code += node.statements.map(s => genPerl(s, "")).join('\n\n');
      if (node.statements.some(s => s.type === 'FunctionDecl' && s.name === 'main')) {
        code += '\n\nmain();';
      }
      return code;
    }
    case 'FunctionDecl': {
      const params = node.params.map(p => p.name).join(', ');
      let funcCode = `${indent}sub ${node.name} {\n`;
      if (params) {
        funcCode += `${indent}  my (${node.params.map(p => '$' + p.name).join(', ')}) = @_;\n`;
      }
      funcCode += genPerl(node.body, indent + "  ") + `\n${indent}}`;
      return funcCode;
    }
    case 'Block':
      return node.statements.map((s, i) => {
        const code = genPerl(s, indent);
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
      return `${indent}my $${node.name} = ${genPerl(node.value, "")};`;
    case 'Return':
      return `${indent}return ${genPerl(node.value, "")};`;
    case 'FunctionCall':
      if (node.name === 'print') {
        return `${indent}print(${node.args.map(a => genPerl(a, "")).join(', ')});`;
      }
      return `${indent}${node.name}(${node.args.map(a => genPerl(a, "")).join(', ')});`;
    case 'BinaryOp':
      return `(${genPerl(node.left, "")} ${node.op} ${genPerl(node.right, "")})`;
    case 'Number':
      return String(node.value);
    case 'String':
      return `"${node.value.replace(/\n/g, '\\n').replace(/"/g, '\\"')}"`;
    case 'Boolean':
      return node.value ? '1' : '0';
    case 'Nil':
      return 'undef';
    case 'Identifier':
      return '$' + node.name;
    case 'ArrayLiteral':
      return `(${node.elements.map(e => genPerl(e, "")).join(', ')})`;
    default:
      return '';
  }
}
