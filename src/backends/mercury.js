/**
 * Mercury Backend for Swibe
 * Target: Deterministic Predicates & Provable Ethics
 */

export function genMercury(node, indent = "") {
  if (!node) return '';

  switch (node.type) {
    case 'Program': {
      let code = `:- module swibe_app.\n`;
      code += `:- interface.\n:- import_module io.\n`;
      code += `:- pred main(io::di, io::uo) is det.\n`;
      code += `:- implementation.\n\n`;
      code += `main(!IO) :-\n`;
      code += `    io.write_string("Swibe Sovereign Birth Ritual (Mercury Backend)\\n", !IO),\n`;
      code += node.statements.filter(s => s.type !== 'FunctionDecl').map(s => genMercury(s, "    ")).join(',\n');
      code += `.\n\n`;
      code += node.statements.filter(s => s.type === 'FunctionDecl').map(s => genMercury(s, "")).join('\n\n');
      return code;

    }
    case 'FunctionDecl':
      return `${indent}:- pred ${node.name}(string::in, io::di, io::uo) is det.\n` +
        `${indent}${node.name}(_, !IO) :-\n` +
        genMercury(node.body, indent + "    ") + `.`;

    case 'Block':
      return node.statements.map(s => genMercury(s, indent)).join(',\n');

    case 'VariableDecl':
      return `${indent}_${node.name} = ${genMercury(node.value, "")}`;

    case 'Number':
      return String(node.value);

    case 'String':
      return `"${node.value}"`;

    case 'Identifier':
      return node.name;

    default:
      return `${indent}% [MERCURY-GEN] Unhandled: ${node.type}`;
  }
}
