/**
 * Smalltalk Backend for Swibe
 * Target: Live Objects & Debug Hive
 */

export function genSmalltalk(node, indent = "") {
  if (!node) return '';

  switch (node.type) {
    case 'Program': {
      let code = `"Swibe Sovereign Birth Ritual (Smalltalk Backend)"\n`;
      code += `Transcript show: 'Swibe Sovereign Birth Ritual'; cr.\n`;
      code += node.statements.map(s => genSmalltalk(s)).join('.\n');
      code += `.\n`;
      return code;

    }
    case 'FunctionDecl':
      return `${node.name}\n\t^ ${genSmalltalk(node.body)}`;

    case 'Block':
      return node.statements.map(s => genSmalltalk(s)).join('.\n\t');

    case 'Return':
      return `^ ${genSmalltalk(node.value)}`;

    case 'VariableDecl':
      return `${node.name} := ${genSmalltalk(node.value)}`;

    case 'FunctionCall':
      if (node.name === 'print') {
        return `Transcript show: ${node.args.map(a => genSmalltalk(a)).join(' , ')}`;
      }
      return `${node.name} value: ${node.args.map(a => genSmalltalk(a)).join(' value: ')}`;

    case 'BinaryOp':
      return `(${genSmalltalk(node.left)} ${node.op} ${genSmalltalk(node.right)})`;

    case 'ThinkStatement':
      return `"think: ${genSmalltalk(node.prompt)}"`;

    case 'Number':
      return String(node.value);

    case 'String':
      return `'${node.value}'`;

    case 'Identifier':
      return node.name;

    case 'SwarmStatement': {
      // Map swarm to object messages
      let swarmCode = `"Swarm Initiation: Live Objects"\n`;
      node.steps.forEach(step => {
        swarmCode += `Transcript show: '[SMALLTALK] Birthing Agent ${step.name}...'; cr`;
      });
      return swarmCode;

    }
    default:
      return `${indent}"[SMALLTALK-GEN] Unhandled: ${node.type}"`;
  }
}
