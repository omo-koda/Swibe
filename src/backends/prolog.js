/**
 * Prolog Backend for Swibe
 * Target: Logic Judge & Predicates
 */

export function genProlog(node, indent = "") {
  if (!node) return '';

  switch (node.type) {
    case 'Program':
      return node.statements.map(s => genProlog(s)).join('.\n') + '.';

    case 'FunctionDecl':
      const params = node.params.map(p => p.name.toUpperCase()).join(', ');
      return `${node.name}(${params}) :- ${genProlog(node.body)}`;

    case 'VariableDecl':
      return `${node.name.toUpperCase()} = ${genProlog(node.value)}`;

    case 'Block':
      return node.statements.map(s => genProlog(s)).join(', ');

    case 'FunctionCall':
      return `${node.name}(${node.args.map(a => genProlog(a)).join(', ')})`;

    case 'Number':
      return String(node.value);

    case 'String':
      return `'${node.value}'`;

    case 'Identifier':
      return node.name.charAt(0).toUpperCase() === node.name.charAt(0) ? node.name : node.name;

    case 'BinaryOp':
      return `(${genProlog(node.left)} ${node.op} ${genProlog(node.right)})`;

    case 'SwarmStatement':
      return `% Swarm: ${node.steps.map(s => s.name).join(', ')}`;

    default:
      return `${indent}% [PROLOG-GEN] Unhandled: ${node.type}`;
  }
}
