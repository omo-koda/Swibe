/**
 * F# Backend for Swibe
 * Target: Typed Receipts & .NET Safe
 */

export function genFSharp(node, indent = "") {
  if (!node) return '';

  switch (node.type) {
    case 'Program':
      let code = `printfn "Swibe Sovereign Birth Ritual (F# Backend)"\n\n`;
      code += node.statements.map(s => genFSharp(s, "")).join('\n\n');
      return code;

    case 'FunctionDecl':
      const params = node.params.map(p => p.name).join(' ');
      return `${indent}let ${node.name} ${params} =\n` +
        genFSharp(node.body, indent + "    ");

    case 'Block':
      return node.statements.map(s => genFSharp(s, indent)).join('\n');

    case 'VariableDecl':
      return `${indent}let ${node.name} = ${genFSharp(node.value, "")}`;

    case 'Return':
      return genFSharp(node.value, "");

    case 'SwarmStatement':
      // Map swarm to Async workflows
      let swarmCode = `${indent}// Swarm Initiation: Async Workflows\n`;
      node.steps.forEach(step => {
        swarmCode += `${indent}async { printfn "[F#] Birthing Agent ${step.name}..." } |> Async.Start\n`;
      });
      return swarmCode;

    case 'Number':
      return String(node.value);

    case 'String':
      return `"${node.value}"`;

    case 'Identifier':
      return node.name;

    default:
      return `${indent}// [F#-GEN] Unhandled: ${node.type}`;
  }
}
