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
    case 'FunctionDecl':
      return `${indent}function ${node.name} return Integer is\n${indent}begin\n${genAda(node.body, indent + "    ")}\n${indent}end ${node.name};`;

    case 'Block':
      return node.statements.map(s => genAda(s, indent)).join('\n');

    case 'Return':
      return `${indent}return ${genAda(node.value, "")};`;

    case 'FunctionCall':
      if (node.name === 'print') {
        return `${indent}Put_Line(${node.args.map(a => genAda(a, "")).join(' & ')});`;
      }
      return `${indent}${node.name}(${node.args.map(a => genAda(a, "")).join(', ')});`;

    case 'BinaryOp':
      return `${genAda(node.left, "")} ${node.op} ${genAda(node.right, "")}`;

    case 'ThinkStatement':
      return `${indent}-- think: ${genAda(node.prompt, "")}`;

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
