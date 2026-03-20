/**
 * Nim Backend for Swibe
 * Target: Macro speed & DSL Think
 */

export function genNim(node, indent = "") {
  if (!node) return '';

  switch (node.type) {
    case 'Program':
      let code = `import std/asyncdispatch, std/json, std/sha1\n\n`;
      code += `echo "Swibe Sovereign Birth Ritual (Nim Backend)"\n\n`;
      code += node.statements.map(s => genNim(s, "")).join('\n\n');
      return code;

    case 'FunctionDecl':
      const params = node.params.map(p => `${p.name}: JsonNode`).join(', ');
      return `${indent}proc ${node.name}(${params}): Future[JsonNode] {.async.} =\n` +
        genNim(node.body, indent + "  ");

    case 'Block':
      if (node.statements.length === 0) return `${indent}discard`;
      return node.statements.map(s => genNim(s, indent)).join('\n');

    case 'VariableDecl':
      return `${indent}var ${node.name} = ${genNim(node.value, "")}`;

    case 'Return':
      return `${indent}return ${genNim(node.value, "")}`;

    case 'FunctionCall':
      return `${indent}await ${node.name}(${node.args.map(a => genNim(a, "")).join(', ')})`;

    case 'SwarmStatement':
      // Map swarm to native concurrency (async/await threads)
      let swarmCode = `${indent}# Swarm Initiation: Async Dispatch\n`;
      node.steps.forEach(step => {
        swarmCode += `${indent}echo "[NIM] Birthing Agent ${step.name}..."\n`;
      });
      return swarmCode;

    case 'MetaDigital':
      // Map meta-digital to macro-like templates
      let metaCode = `${indent}# Meta-Digital: ${node.name}\n`;
      metaCode += `${indent}template ${node.name}_ritual() =\n`;
      metaCode += `${indent}  echo "Executing high-stakes chain: ${node.name}"\n`;
      return metaCode;

    case 'Number':
      return String(node.value);

    case 'String':
      return `"${node.value}"`;

    case 'Identifier':
      return node.name;

    default:
      return `${indent}# [NIM-GEN] Unhandled: ${node.type}`;
  }
}
