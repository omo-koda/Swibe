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

    case 'FunctionCall':
      if (node.name === 'print') {
        return `0: ${node.args.map(a => genK(a)).join(' ')}`;
      }
      return `${node.name} ${node.args.map(a => genK(a)).join(' ')}`;

    case 'BinaryOp':
      return `(${genK(node.left)} ${node.op} ${genK(node.right)})`;

    case 'ThinkStatement':
      return `/ think: ${genK(node.prompt)}`;

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
