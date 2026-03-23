/**
 * Janet Backend for Swibe
 * Target: Lisp Macros & Embeddable Runtime
 */

export function genJanet(node, indent = "") {
  if (!node) return '';

  switch (node.type) {
    case 'Program': {
      let code = `(print "Swibe Sovereign Birth Ritual (Janet Backend)")\n\n`;
      code += node.statements.map(s => genJanet(s, "")).join('\n');
      return code;

    }
    case 'FunctionDecl': {
      const params = node.params.map(p => p.name).join(' ');
      return `${indent}(defn ${node.name} [${params}]\n` +
        genJanet(node.body, indent + "  ") +
        `\n${indent})`;

    }
    case 'Block':
      return `${indent}(do\n` +
        node.statements.map(s => genJanet(s, indent + "  ")).join('\n') +
        `\n${indent})`;

    case 'VariableDecl':
      return `${indent}(def ${node.name} ${genJanet(node.value, "")})`;

    case 'Return':
      return genJanet(node.value, "");

    case 'FunctionCall':
      return `${indent}(${node.name} ${node.args.map(a => genJanet(a, "")).join(' ')})`;

    case 'SwarmStatement': {
      // Map swarm to Janet fibers/channels
      let swarmCode = `${indent}# Swarm Initiation: Janet Fibers\n`;
      node.steps.forEach(step => {
        swarmCode += `${indent}(ev/spawn (print "[JANET] Birthing Agent ${step.name}..."))\n`;
      });
      return swarmCode;

    }
    case 'Number':
      return String(node.value);

    case 'String':
      return `"${node.value}"`;

    case 'Identifier':
      return node.name;

    case 'BinaryOp': {
      const op = node.op === '==' ? '=' : node.op;
      return `(${op} ${genJanet(node.left, "")} ${genJanet(node.right, "")})`;

    }
    default:
      return `${indent}# [JANET-GEN] Unhandled: ${node.type}`;
  }
}
