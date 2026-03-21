/**
 * D Backend for Swibe
 * Target: Contract Guard & Coroutines
 */

export function genD(node, indent = "") {
  if (!node) return '';

  switch (node.type) {
    case 'Program':
      let code = `import std.stdio;\nimport core.thread;\n\n`;
      code += `void main() {\n`;
      code += `    writeln("Swibe Sovereign Birth Ritual (D Backend)");\n`;
      code += node.statements.filter(s => s.type !== 'FunctionDecl').map(s => genD(s, "    ")).join('\n');
      code += `}\n\n`;
      code += node.statements.filter(s => s.type === 'FunctionDecl').map(s => genD(s, "")).join('\n\n');
      return code;

    case 'FunctionDecl':
      return `${indent}void ${node.name}(${node.params.map(p => `auto ${p.name}`).join(', ')}) {\n` +
        genD(node.body, indent + "    ") +
        `\n${indent}}`;

    case 'Block':
      return node.statements.map(s => genD(s, indent)).join('\n');

    case 'VariableDecl':
      return `${indent}auto ${node.name} = ${genD(node.value, "")};`;

    case 'SwarmStatement':
      // Map swarm to D fibers or threads
      let swarmCode = `${indent}// Swarm Initiation: Coroutines\n`;
      node.steps.forEach(step => {
        swarmCode += `${indent}writeln("[D] Birthing Agent ${step.name}...");\n`;
      });
      return swarmCode;

    case 'Number':
      return String(node.value);

    case 'String':
      return `"${node.value}"`;

    case 'Identifier':
      return node.name;

    default:
      return `${indent}// [D-GEN] Unhandled: ${node.type}`;
  }
}
