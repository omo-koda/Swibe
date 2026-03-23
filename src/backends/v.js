/**
 * V Backend for Swibe
 * Target: Auto-free Structs & Fast Compile
 */

export function genV(node, indent = "") {
  if (!node) return '';

  switch (node.type) {
    case 'Program': {
      let code = `module main\n\n`;
      code += `fn main() {\n`;
      code += `    println('Swibe Sovereign Birth Ritual (V Backend)')\n`;
      code += node.statements.filter(s => s.type !== 'FunctionDecl').map(s => genV(s, "    ")).join('\n');
      code += `\n}\n\n`;
      code += node.statements.filter(s => s.type === 'FunctionDecl').map(s => genV(s, "")).join('\n\n');
      return code;

    }
    case 'FunctionDecl': {
      const params = node.params.map(p => `${p.name} string`).join(', ');
      return `${indent}fn ${node.name}(${params}) {\n` +
        genV(node.body, indent + "    ") +
        `\n${indent}}`;

    }
    case 'Block':
      return node.statements.map(s => genV(s, indent)).join('\n');

    case 'VariableDecl':
      return `${indent}${node.name} := ${genV(node.value, "")}`;

    case 'Return':
      return `${indent}return ${genV(node.value, "")}`;

    case 'SwarmStatement': {
      // Map swarm to V's threads
      let swarmCode = `${indent}// Swarm Initiation: V Threads\n`;
      node.steps.forEach(step => {
        swarmCode += `${indent}go fn(name string) {\n`;
        swarmCode += `${indent}    println('[V] Birthing Agent $name...')\n`;
        swarmCode += `${indent}}('${step.name}')\n`;
      });
      return swarmCode;

    }
    case 'Number':
      return String(node.value);

    case 'String':
      return `'${node.value}'`;

    case 'Identifier':
      return node.name;

    default:
      return `${indent}// [V-GEN] Unhandled: ${node.type}`;
  }
}
