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

    case 'VariableDecl':
      return `${node.name} =: ${genJ(node.value)}`;

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
