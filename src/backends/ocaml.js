/**
 * OCaml Backend for Swibe
 * Target: Functor Skills & Safe Proofs
 */

export function genOCaml(node, indent = "") {
  if (!node) return '';

  switch (node.type) {
    case 'Program': {
      let code = `print_endline "Swibe Sovereign Birth Ritual (OCaml Backend)";;\n\n`;
      code += node.statements.map(s => genOCaml(s, "")).join('\n\n');
      return code;

    }
    case 'FunctionDecl': {
      const params = node.params.map(p => p.name).join(' ');
      return `${indent}let ${node.name} ${params} =\n` +
        genOCaml(node.body, indent + "  ");

    }
    case 'Block':
      return node.statements.map(s => genOCaml(s, indent)).join('\n');

    case 'VariableDecl':
      return `${indent}let ${node.name} = ${genOCaml(node.value, "")}`;

    case 'Return':
      return genOCaml(node.value, "");

    case 'FunctionCall':
      if (node.name === 'print') {
        return `${indent}print_endline ${node.args.map(a => genOCaml(a, "")).join(' ^ ')}`;
      }
      return `${indent}${node.name} ${node.args.map(a => genOCaml(a, "")).join(' ')}`;

    case 'BinaryOp':
      return `${genOCaml(node.left, "")} ${node.op} ${genOCaml(node.right, "")}`;

    case 'ThinkStatement':
      return `${indent}(* think: ${genOCaml(node.prompt, "")} *)`;

    case 'Number':
      return String(node.value);

    case 'String':
      return `"${node.value}"`;

    case 'Identifier':
      return node.name;

    default:
      return `${indent}(* [OCAML-GEN] Unhandled: ${node.type} *)`;
  }
}
