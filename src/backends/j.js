/**
 * J Backend for Swibe
 * Target: Vector Assassin & Array Receipts
 */

export function genJ(node, indent = "") {
  if (!node) return '';

  switch (node.type) {
    case 'Program': {
      let code = `NB. Swibe Sovereign Birth Ritual (J Backend)\n`;
      code += node.statements.map(s => genJ(s)).join('\n');
      return code;

    }
    case 'FunctionDecl':
      return `${node.name} =: 3 : 0\n  ${genJ(node.body)}\n)`;

    case 'Block':
      return node.statements.map(s => genJ(s)).join('\n');

    case 'FunctionCall':
      if (node.name === 'print') {
        return `echo ${node.args.map(a => genJ(a)).join(' ')}`;
      }
      return `${node.name} ${node.args.map(a => genJ(a)).join(' ')}`;

    case 'BinaryOp':
      return `(${genJ(node.left)} ${node.op} ${genJ(node.right)})`;

    case 'ThinkStatement':
      return `NB. think: ${genJ(node.prompt)}`;

    case 'Number':
      return String(node.value);

    case 'String':
      return `'${node.value}'`;

    case 'Identifier':
      return node.name;

    default:
      return `${indent}NB. [J-GEN] Unhandled: ${node.type}`;
  }
}
