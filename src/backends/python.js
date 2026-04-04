/**
 * Python Backend
 */

function indentCode(code, spaces) {
  const indent = " ".repeat(spaces);
  return code.split("\n").map(line => (line ? indent + line : line)).join("\n");
}

export function genPython(node) {
  if (!node) return '';

  switch (node.type) {
    case 'Program':
      const code = node.statements.map(s => genPython(s)).join('\n\n');
      return code + '\n\nif __name__ == "__main__":\n  main()';

    case 'FunctionDecl':
      return (
        `def ${node.name}(${node.params.map(p => p.name).join(', ')}):\n` +
        indentCode(genPython(node.body), 2)
      );

    case 'Block':
      return node.statements.map(s => genPython(s)).join('\n');

    case 'VariableDecl':
      return `${node.name} = ${genPython(node.value)}`;

    case 'Return':
      return `return ${genPython(node.value)}`;

    case 'FunctionCall':
      if (node.name === 'print') {
        return `print(${node.args.map(a => genPython(a)).join(', ')})`;
      } else {
        return `${node.name}(${node.args.map(a => genPython(a)).join(', ')})`;
      }

    case 'Number':
      return String(node.value);

    case 'String':
      return `"${node.value.replace(/\n/g, '\\n').replace(/"/g, '\\"')}"`;

    case 'Boolean':
      return node.value ? 'True' : 'False';

    case 'Nil':
      return 'None';

    case 'Identifier':
      return node.name;

    case 'ArrayLiteral':
      return `[${node.elements.map(e => genPython(e)).join(', ')}]`;

    default:
      return '';
  }
}
