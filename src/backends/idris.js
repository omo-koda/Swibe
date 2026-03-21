/**
 * Idris Backend for Swibe
 * Target: Proof Vaults & Dependent Types
 */

export function genIdris(node, indent = "") {
  if (!node) return '';

  switch (node.type) {
    case 'Program':
      let code = `module Main\n\n`;
      code += `main : IO ()\n`;
      code += `main = putStrLn "Swibe Sovereign Birth Ritual (Idris Backend)"\n\n`;
      code += node.statements.map(s => genIdris(s, "")).join('\n\n');
      return code;

    case 'FunctionDecl':
      const params = node.params.map(p => `(${p.name} : Any)`).join(' ');
      return `${indent}${node.name} : ${params} -> Any\n` +
        `${indent}${node.name} ${node.params.map(p => p.name).join(' ')} = ${genIdris(node.body, indent + "  ")}`;

    case 'Block':
      return node.statements.map(s => genIdris(s, indent)).join('\n');

    case 'VariableDecl':
      return `${indent}let ${node.name} = ${genIdris(node.value, "")}`;

    case 'Return':
      return genIdris(node.value, "");

    case 'Number':
      return String(node.value);

    case 'String':
      return `"${node.value}"`;

    case 'Identifier':
      return node.name;

    case 'BinaryOp':
      return `(${genIdris(node.left, "")} ${node.op} ${genIdris(node.right, "")})`;

    default:
      return `${indent}-- [IDRIS-GEN] Unhandled: ${node.type}`;
  }
}
