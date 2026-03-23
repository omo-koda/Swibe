/**
 * Pony Backend for Swibe
 * Target: Lock-free Actors (Swarms)
 */

export function genPony(node, indent = "") {
  if (!node) return '';

  switch (node.type) {
    case 'Program': {
      let code = `actor Main\n`;
      code += `  new create(env: Env) =>\n`;
      code += `    env.out.print("Swibe Sovereign Birth Ritual (Pony Backend)")\n`;
      code += node.statements.filter(s => s.type !== 'FunctionDecl').map(s => genPony(s, "    ")).join('\n');
      code += `\n`;
      code += node.statements.filter(s => s.type === 'FunctionDecl').map(s => genPony(s, "  ")).join('\n\n');
      return code;

    }
    case 'FunctionDecl': {
      const params = node.params.map(p => `${p.name}: Any`).join(', ');
      return `${indent}fun tag ${node.name}(${params}) =>\n` +
        genPony(node.body, indent + "  ");

    }
    case 'Block':
      return node.statements.map(s => genPony(s, indent)).join('\n');

    case 'VariableDecl':
      return `${indent}let ${node.name} = ${genPony(node.value, "")}`;

    case 'SwarmStatement': {
      // Map swarm to Pony Actors
      let swarmCode = `${indent}// Swarm Initiation: Lock-free Actors\n`;
      node.steps.forEach(step => {
        swarmCode += `${indent}let actor_${step.name} = AgentActor("${step.name}")\n`;
      });
      return swarmCode;

    }
    case 'FunctionCall':
      return `${indent}${node.name}(${node.args.map(a => genPony(a, "")).join(', ')})`;

    case 'Number':
      return String(node.value);

    case 'String':
      return `"${node.value}"`;

    case 'Identifier':
      return node.name;

    default:
      return `${indent}// [PONY-GEN] Unhandled: ${node.type}`;
  }
}
