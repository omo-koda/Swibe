/**
 * Odin Backend for Swibe
 * Target: Data Beast & Array Ops
 */

export function genOdin(node, indent = "") {
  if (!node) return '';

  switch (node.type) {
    case 'Program': {
      let code = `package main\n\n`;
      code += `import "core:fmt"\n`;
      code += `import "core:thread"\n\n`;
      code += `main :: proc() {\n`;
      code += `    fmt.println("Swibe Sovereign Birth Ritual (Odin Backend)")\n`;
      code += node.statements.filter(s => s.type !== 'FunctionDecl').map(s => genOdin(s, "    ")).join('\n');
      code += `}\n\n`;
      code += node.statements.filter(s => s.type === 'FunctionDecl').map(s => genOdin(s, "")).join('\n\n');
      return code;

    }
    case 'FunctionDecl': {
      const params = node.params.map(p => `${p.name}: any`).join(', ');
      return `${indent}${node.name} :: proc(${params}) {\n` +
        genOdin(node.body, indent + "    ") +
        `\n${indent}}`;

    }
    case 'Block':
      return node.statements.map(s => genOdin(s, indent)).join('\n');

    case 'VariableDecl':
      return `${indent}${node.name} := ${genOdin(node.value, "")}`;

    case 'Return':
      return `${indent}return ${genOdin(node.value, "")}`;

    case 'SwarmStatement': {
      // Map swarm to Odin's threads
      let swarmCode = `${indent}// Swarm Initiation: Odin Threads\n`;
      node.steps.forEach(step => {
        swarmCode += `${indent}fmt.printf("[ODIN] Birthing Agent ${step.name}...\\n")\n`;
      });
      return swarmCode;

    }
    case 'Number':
      return String(node.value);

    case 'String':
      return `"${node.value}"`;

    case 'Identifier':
      return node.name;

    default:
      return `${indent}// [ODIN-GEN] Unhandled: ${node.type}`;
  }
}
