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
    case 'VariableDecl':
      return `${node.name} := ${genSmalltalk(node.value)}`;

    case 'FunctionCall':
      return `${node.name} value: ${node.args.map(a => genSmalltalk(a)).join(' value: ')}`;

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
