/**
 * Crystal Backend for Swibe
 * Target: Readable Fibers & Channels (Swarms)
 */

export function genCrystal(node, indent = "") {
  if (!node) return '';

  switch (node.type) {
    case 'Program': {
      let code = `require "json"\n`;
      code += `require "crypto"\n\n`;
      code += `puts "Swibe Sovereign Birth Ritual (Crystal Backend)"\n\n`;
      code += node.statements.map(s => genCrystal(s, "")).join('\n\n');
      return code;

    }
    case 'FunctionDecl': {
      const params = node.params.map(p => `${p.name} : JSON::Any`).join(', ');
      return `${indent}def ${node.name}(${params})\n` +
        genCrystal(node.body, indent + "  ") +
        `\n${indent}end`;

    }
    case 'Block':
      return node.statements.map(s => genCrystal(s, indent)).join('\n');

    case 'VariableDecl':
      return `${indent}${node.name} = ${genCrystal(node.value, "")}`;

    case 'Return':
      return `${indent}${genCrystal(node.value, "")}`;

    case 'FunctionCall':
      return `${indent}${node.name}(${node.args.map(a => genCrystal(a, "")).join(', ')})`;

    case 'SwarmStatement': {
      // Map swarm to native fibers
      let swarmCode = `${indent}# Swarm Initiation: Fibers/Channels\n`;
      node.steps.forEach(step => {
        swarmCode += `${indent}spawn do\n`;
        swarmCode += `${indent}  puts "[CRYSTAL] Birthing Agent ${step.name}..."\n`;
        swarmCode += `${indent}end\n`;
      });
      return swarmCode;

    }
    case 'Number':
      return String(node.value);

    case 'String':
      return `"${node.value}"`;

    case 'Identifier':
      return node.name;

    default:
      return `${indent}# [CRYSTAL-GEN] Unhandled: ${node.type}`;
  }
}
