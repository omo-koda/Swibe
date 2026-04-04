/**
 * F# Backend for Swibe
 * Target: Typed Receipts & .NET Safe
 */

export function genFSharp(node, indent = "") {
  if (!node) return '';

  switch (node.type) {
    case 'Program': {
      let code = `printfn "Swibe Sovereign Birth Ritual (F# Backend)"\n\n`;
      code += node.statements.map(s => genFSharp(s, "")).join('\n\n');
      return code;

    }
    case 'FunctionDecl': {
      const params = node.params.map(p => p.name).join(' ');
      return `${indent}let ${node.name} ${params} =\n` +
        genFSharp(node.body, indent + "    ");

    }
    case 'Block':
      return node.statements.map(s => genFSharp(s, indent)).join('\n');

    case 'VariableDecl':
      return `${indent}let ${node.name} = ${genFSharp(node.value, "")}`;

    case 'Return':
      return genFSharp(node.value, "");

    case 'FunctionCall':
      if (node.name === 'print') {
        return `${indent}printfn "%s" ${node.args.map(a => genFSharp(a, "")).join(' + ')}`;
      }
      return `${indent}${node.name} ${node.args.map(a => genFSharp(a, "")).join(' ')}`;

    case 'BinaryOp':
      return `${genFSharp(node.left, "")} ${node.op} ${genFSharp(node.right, "")}`;

    case 'ThinkStatement':
      return `${indent}// think: ${genFSharp(node.prompt, "")}`;

    case 'Number':
      return String(node.value);

    case 'String':
      return `"${node.value}"`;

    case 'Identifier':
      return node.name;

    case 'SwarmStatement':
      return `Async.Start(async {\n    // ${node.name || 'swarm'}\n})`;

    default:
      return `${indent}// [F#-GEN] Unhandled: ${node.type}`;
  }
}
