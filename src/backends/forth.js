/**
 * Forth Backend for Swibe
 * Target: Stack Mystic & Word Think
 */

export function genForth(node, indent = "") {
  if (!node) return '';

  switch (node.type) {
    case 'Program':
      let code = `( Swibe Sovereign Birth Ritual - Forth Backend )\n`;
      code += node.statements.map(s => genForth(s)).join('\n');
      return code;

    case 'FunctionDecl':
      return `: ${node.name} ( params ) ${genForth(node.body)} ;`;

    case 'Block':
      return node.statements.map(s => genForth(s)).join(' ');

    case 'VariableDecl':
      return `VARIABLE ${node.name} ${genForth(node.value)} ${node.name} !`;

    case 'Number':
      return String(node.value);

    case 'String':
      return `." ${node.value}"`;

    case 'Identifier':
      return node.name;

    default:
      return `${indent}( [FORTH-GEN] Unhandled: ${node.type} )`;
  }
}
