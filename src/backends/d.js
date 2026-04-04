/**
 * D Backend for Swibe
 * Target: Contract Guard & Coroutines
 */

export function genD(node, indent = "") {
  if (!node) return '';

  switch (node.type) {
    case 'Program': {
      let code = `import std.stdio;\nimport core.thread;\n\n`;
      code += `void main() {\n`;
      code += `    writeln("[D] Birthing Agent Genesis...");\n`;
      code += node.statements.filter(s => s.type !== 'FunctionDecl').map(s => genD(s, "    ")).join('\n');
      code += `}\n\n`;
      code += node.statements.filter(s => s.type === 'FunctionDecl').map(s => genD(s, "")).join('\n\n');
      return code;

    }
    case 'FunctionDecl':
      return `${indent}void ${node.name}(${node.params.map(p => `auto ${p.name}`).join(', ')}) {\n` +
        genD(node.body, indent + "    ") +
        `\n${indent}}`;

    case 'Block':
      return node.statements.map(s => genD(s, indent)).join('\n');

    case 'VariableDecl':
      return `${indent}auto ${node.name} = ${genD(node.value, "")};`;

    case 'FunctionCall':
      if (node.name === 'print') {
        return `${indent}writeln(${node.args.map(a => genD(a, "")).join(' ~ ')});`;
      }
      return `${indent}${node.name}(${node.args.map(a => genD(a, "")).join(', ')});`;

    case 'BinaryOp':
      return `${genD(node.left, "")} ${node.op} ${genD(node.right, "")}`;

    case 'ThinkStatement':
      return `${indent}// think: ${genD(node.prompt, "")}`;

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
