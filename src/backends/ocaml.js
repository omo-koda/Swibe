/**
 * OCaml Backend for Swibe
 * Target: Functor Skills & Safe Proofs
 */

export function genOCaml(node, indent = "") {
  if (!node) return '';

  switch (node.type) {
    case 'Program':
      let code = `print_endline "Swibe Sovereign Birth Ritual (OCaml Backend)";;\n\n`;
      code += node.statements.map(s => genOCaml(s, "")).join('\n\n');
      return code;

    case 'FunctionDecl':
      const params = node.params.map(p => p.name).join(' ');
      return `${indent}let ${node.name} ${params} =\n` +
        genOCaml(node.body, indent + "  ");

    case 'Block':
      return node.statements.map(s => genOCaml(s, indent)).join('\n');

    case 'VariableDecl':
      return `${indent}let ${node.name} = ${genOCaml(node.value, "")}`;

    case 'Return':
      return genOCaml(node.value, "");

    case 'SwarmStatement':
      // Map swarm to OCaml threads or Lwt/Async
      let swarmCode = `${indent}(* Swarm Initiation: OCaml Threads *)\n`;
      node.steps.forEach(step => {
        swarmCode += `${indent}print_endline "[OCAML] Birthing Agent ${step.name}...";\n`;
      });
      return swarmCode;

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
