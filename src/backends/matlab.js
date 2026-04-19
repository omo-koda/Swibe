/**
 * Matlab Backend for Swibe
 */

function indentCode(code, spaces) {
  const indent = " ".repeat(spaces);
  return code.split("\n").map(line => (line ? indent + line : line)).join("\n");
}

export function genMatlab(node) {
  if (!node) return '';

  switch (node.type) {
    case 'Program':
      return node.statements.map(s => genMatlab(s)).join('\n\n');

    case 'FunctionDecl':
      return (
        `function varargout = ${node.name}(${node.params.map(p => p.name).join(', ')})\n` +
        indentCode(genMatlab(node.body), 4) +
        '\nend'
      );

    case 'VariableDecl':
      return `${node.name} = ${genMatlab(node.value)};`;

    case 'Block':
      return node.statements.map(s => genMatlab(s)).join('\n');

    case 'Return':
      return genMatlab(node.value);

    case 'FunctionCall':
      return `${node.name}(${node.args.map(a => genMatlab(a)).join(', ')})`;

    case 'BinaryOp':
      return `${genMatlab(node.left)} ${node.op} ${genMatlab(node.right)}`;

    case 'ThinkStatement': {
      const prompt = genMatlab(node.prompt);
      return `disp(['Thinking: ', ${prompt}])`;
    }

    case 'Number':
      return String(node.value);

    case 'String':
      return `'${node.value.replace(/\n/g, '\\n')}'`;

    case 'Boolean':
      return node.value ? 'true' : 'false';

    case 'Identifier':
      return node.name;

    case 'ArrayLiteral':
      return `[${node.elements.map(e => genMatlab(e)).join(', ')}]`;

    default:
      return '';
  }
}
