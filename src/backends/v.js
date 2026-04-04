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

    case 'FunctionCall':
      if (node.name === 'print') {
        return `${indent}println(${node.args.map(a => genV(a, "")).join(' + ')})`;
      }
      return `${indent}${node.name}(${node.args.map(a => genV(a, "")).join(', ')})`;

    case 'BinaryOp':
      return `${genV(node.left, "")} ${node.op} ${genV(node.right, "")}`;

    case 'ThinkStatement':
      return `${indent}// think: ${genV(node.prompt, "")}`;

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
