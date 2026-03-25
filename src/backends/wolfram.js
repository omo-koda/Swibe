/**
 * Wolfram Backend
 */

export function genWolfram(node) {
  if (!node) return '';

  switch (node.type) {
    case 'Program':
      return node.statements.map(s => genWolfram(s)).join('\n');

    case 'FunctionDecl':
      return (
        `${node.name}[${node.params.map(p => p.name).join(', ')}] := ` +
        genWolfram(node.body)
      );

    case 'VariableDecl':
      return `${node.name} = ${genWolfram(node.value)}`;

    case 'Block':
      return `Block[{}, ${node.statements.map(s => genWolfram(s)).join('; ')}]`;

    case 'Return':
      return genWolfram(node.value);

    case 'FunctionCall':
      return `${node.name}[${node.args.map(a => genWolfram(a)).join(', ')}]`;

    case 'Number':
      return String(node.value);

    case 'String':
      return `"${node.value.replace(/\n/g, '\\n').replace(/"/g, '\\"')}"`;

    case 'Boolean':
      return String(node.value);

    case 'Identifier':
      return node.name;

    case 'ArrayLiteral':
      return `{${node.elements.map(e => genWolfram(e)).join(', ')}}`;

    case 'BinaryOp':
      return `${genWolfram(node.left)} ${node.op} ${genWolfram(node.right)}`;

    default:
      return '';
  }
}
