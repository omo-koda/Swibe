/**
 * Elixir Backend for Swibe
 * Target: BEAM Actors (Swarms)
 */

export function genElixir(node, indent = "") {
  if (!node) return '';

  switch (node.type) {
    case 'Program':
      let code = `defmodule Swibe.Sovereign do\n`;
      code += `  @moduledoc "Swibe Sovereign Ritual on BEAM"\n\n`;
      code += node.statements.map(s => genElixir(s, "  ")).join('\n\n');
      code += `\nend`;
      return code;

    case 'FunctionDecl':
      const params = node.params.map(p => p.name).join(', ');
      return `${indent}def ${node.name}(${params}) do\n` +
        genElixir(node.body, indent + "  ") +
        `\n${indent}end`;

    case 'Block':
      return node.statements.map(s => genElixir(s, indent)).join('\n');

    case 'VariableDecl':
      return `${indent}${node.name} = ${genElixir(node.value, "")}`;

    case 'Return':
      return `${indent}${genElixir(node.value, "")}`;

    case 'FunctionCall':
      return `${indent}${node.name}(${node.args.map(a => genElixir(a, "")).join(', ')})`;

    case 'SwarmStatement':
      // Map swarm to Elixir processes
      let swarmCode = `${indent}# Swarm Initiation: BEAM Actors\n`;
      swarmCode += `${indent}Enum.each([${node.steps.map(s => `"${s.name}"`).join(', ')}], fn name ->\n`;
      swarmCode += `${indent}  spawn(fn -> IO.puts("[BEAM] Actor #{name} birthing...") end)\n`;
      swarmCode += `${indent}end)`;
      return swarmCode;

    case 'MetaDigital':
      // Map meta-digital to chained pipes
      let metaCode = `${indent}# Meta-Digital Chain: ${node.name}\n`;
      metaCode += `${indent}def ${node.name}_chain(input) do\n`;
      metaCode += `${indent}  input\n`;
      node.config.chain.forEach(step => {
        metaCode += `${indent}  |> ${step}_skill()\n`;
      });
      metaCode += `${indent}end`;
      return metaCode;

    case 'Number':
      return String(node.value);

    case 'String':
      return `"${node.value}"`;

    case 'Boolean':
      return node.value ? 'true' : 'false';

    case 'Identifier':
      return node.name;

    case 'BinaryOp':
      const opMap = { '&&': 'and', '||': 'or', '==': '==', '!=': '!=' };
      const op = opMap[node.op] || node.op;
      return `(${genElixir(node.left, "")} ${op} ${genElixir(node.right, "")})`;

    default:
      return `${indent}# [ELIXIR-GEN] Unhandled: ${node.type}`;
  }
}
