/**
 * K Backend for Swibe
 * Target: Time Watcher & Event Patrols
 */

export function genK(node, indent = "") {
  if (!node) return '';

  switch (node.type) {
    case 'Program': {
      let code = `/ Swibe Sovereign Birth Ritual (K Backend)\n`;
      code += node.statements.map(s => genK(s)).join('\n');
      return code;

    }
    case 'FunctionDecl':
      return `${node.name}:{[${node.params.map(p => p.name).join(';')}] ${genK(node.body)} }`;

    case 'Block':
      return node.statements.map(s => genK(s)).join('; ');

    case 'VariableDecl':
      return `${node.name}: ${genK(node.value)}`;

    case 'Number':
      return String(node.value);

    case 'String':
      return `"${node.value}"`;

    case 'Identifier':
      return node.name;

    default:
      return `${indent}/ [K-GEN] Unhandled: ${node.type}`;
  }
}
