/**
 * Aether Backend for Swibe
 * Target: Work-stealing Queues (Zero-copy Agents)
 */

export function genAether(node, indent = "") {
  if (!node) return '';

  switch (node.type) {
    case 'Program': {
      let code = `#include <aether/core.h>\n`;
      code += `#include <stdio.h>\n\n`;
      code += `int main() {\n`;
      code += `  printf("Swibe Sovereign Birth Ritual (Aether Backend)\\n");\n`;
      code += node.statements.map(s => genAether(s, "  ")).join('\n');
      code += `\n  return 0;\n}`;
      return code;

    }
    case 'FunctionDecl':
      return `${indent}void ${node.name}() {\n${genAether(node.body, indent + "  ")}\n${indent}}`;

    case 'Block':
      return node.statements.map(s => genAether(s, indent)).join('\n');

    case 'FunctionCall':
      if (node.name === 'print') {
        return `${indent}printf(${node.args.map(a => genAether(a, "")).join(' ')});`;
      }
      return `${indent}${node.name}(${node.args.map(a => genAether(a, "")).join(', ')});`;

    case 'BinaryOp':
      return `${genAether(node.left, "")} ${node.op} ${genAether(node.right, "")}`;

    case 'ThinkStatement':
      return `${indent}// think: ${genAether(node.prompt, "")}`;

    case 'VariableDecl':
      return `${indent}auto ${node.name} = ${genAether(node.value, "")};`;

    case 'SwarmStatement': {
      // Map swarm to Aether tasks
      let swarmCode = `${indent}// Swarm Initiation: Zero-copy Work-stealing Queues\n`;
      node.steps.forEach(step => {
        swarmCode += `${indent}aether::spawn_task([]() { printf("Agent ${step.name} birthing on Aether...\\n"); });\n`;
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
      return `${indent}// [AETHER-GEN] Unhandled: ${node.type}`;
  }
}
