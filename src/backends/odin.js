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

    case 'FunctionCall':
      if (node.name === 'print') {
        return `${indent}fmt.println(${node.args.map(a => genOdin(a, "")).join(', ')})`;
      }
      return `${indent}${node.name}(${node.args.map(a => genOdin(a, "")).join(', ')})`;

    case 'BinaryOp':
      return `${genOdin(node.left, "")} ${node.op} ${genOdin(node.right, "")}`;

    case 'ThinkStatement':
      return `${indent}// think: ${genOdin(node.prompt, "")}`;

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
