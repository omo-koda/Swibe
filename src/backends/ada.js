/**
 * Ada Backend for Swibe
 * Target: Crash-proof Tasks & Exceptions
 */

export function genAda(node, indent = "") {
  if (!node) return '';

  switch (node.type) {
    case 'Program': {
      let code = `with Ada.Text_IO; use Ada.Text_IO;\n\n`;
      code += `procedure Swibe_App is\n`;
      code += `begin\n`;
      code += `    Put_Line("Swibe Sovereign Birth Ritual (Ada Backend)");\n`;
      code += node.statements.filter(s => s.type !== 'FunctionDecl').map(s => genAda(s, "    ")).join('\n');
      code += `\nend Swibe_App;`;
      return code;

    }
    case 'VariableDecl':
      return `${indent}${node.name} : Integer := ${genAda(node.value, "")};`;

    case 'SwarmStatement': {
      // Map swarm to Ada tasks
      let swarmCode = `${indent}-- Swarm Initiation: Ada Tasks\n`;
      node.steps.forEach(step => {
        swarmCode += `${indent}Put_Line("[ADA] Birthing Agent ${step.name}...");\n`;
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
      return `${indent}-- [ADA-GEN] Unhandled: ${node.type}`;
  }
}
