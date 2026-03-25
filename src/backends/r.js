/**
 * R Backend
 */

function indentCode(code, spaces) {
  const indent = " ".repeat(spaces);
  return code.split("\n").map(line => (line ? indent + line : line)).join("\n");
}

export function genR(node) {
  if (!node) return '';

  switch (node.type) {
    case 'Program':
      return node.statements.map(s => genR(s)).join('\n\n');

    case 'FunctionDecl':
      return (
        `${node.name} <- function(${node.params.map(p => p.name).join(', ')}) {\n` +
        indentCode(genR(node.body), 2) +
        '\n}'
      );

    case 'VariableDecl':
      return `${node.name} <- ${genR(node.value)}`;

    case 'Block':
      return node.statements.map(s => genR(s)).join('\n');

    case 'Return':
      return genR(node.value);

    case 'FunctionCall':
      return `${node.name}(${node.args.map(a => genR(a)).join(', ')})`;

    case 'Number':
      return String(node.value);

    case 'String':
      return `"${node.value.replace(/\n/g, '\\n').replace(/"/g, '\\"')}"`;

    case 'Boolean':
      return String(node.value);

    case 'Identifier':
      return node.name;

    case 'ArrayLiteral':
      return `c(${node.elements.map(e => genR(e)).join(', ')})`;

    case 'BinaryOp':
      return `${genR(node.left)} ${node.op} ${genR(node.right)}`;

    default:
      return '';
  }
}
