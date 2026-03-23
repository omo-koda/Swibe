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

    case 'SwarmStatement': {
      // Map swarm to Raku promises/channels
      let swarmCode = `${indent}# Swarm Initiation: Promises\n`;
      node.steps.forEach(step => {
        swarmCode += `${indent}start { say "[RAKU] Birthing Agent ${step.name}..." };\n`;
      });
      return swarmCode;

    }
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
