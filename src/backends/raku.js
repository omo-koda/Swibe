/**
 * Raku Backend for Swibe
 * Target: Grammar Ethics & Wild Syntax
 */

export function genRaku(node, indent = "") {
  if (!node) return '';

  switch (node.type) {
    case 'Program': {
      let code = `use v6;\n\n`;
      code += `say "Swibe Sovereign Birth Ritual (Raku Backend)";\n\n`;
      code += node.statements.map(s => genRaku(s, "")).join('\n');
      return code;

    }
    case 'FunctionDecl':
      return `${indent}sub ${node.name}(${node.params.map(p => `$${p.name}`).join(', ')}) {\n` +
        genRaku(node.body, indent + "    ") +
        `\n${indent}}`;

    case 'Block':
      return node.statements.map(s => genRaku(s, indent)).join('\n');

    case 'VariableDecl':
      return `${indent}my $${node.name} = ${genRaku(node.value, "")};`;

    case 'FunctionCall':
      if (node.name === 'print') {
        return `${indent}say ${node.args.map(a => genRaku(a, "")).join(' ~ ')};`;
      }
      return `${indent}${node.name}(${node.args.map(a => genRaku(a, "")).join(', ')});`;

    case 'BinaryOp':
      return `${genRaku(node.left, "")} ${node.op} ${genRaku(node.right, "")}`;

    case 'ThinkStatement':
      return `${indent}# think: ${genRaku(node.prompt, "")}`;

    case 'Number':
      return String(node.value);

    case 'String':
      return `"${node.value}"`;

    case 'Identifier':
      return `$${node.name}`;

    default:
      return `${indent}# [RAKU-GEN] Unhandled: ${node.type}`;
  }
}
