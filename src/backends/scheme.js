/**
 * Scheme Backend for Swibe
 * Target: Lambda Chain & Minimal Footprint
 */

export function genScheme(node, indent = "") {
  if (!node) return '';

  switch (node.type) {
    case 'Program': {
      let code = `(display "Swibe Sovereign Birth Ritual (Scheme Backend)")\n(newline)\n\n`;
      code += node.statements.map(s => genScheme(s, "")).join('\n');
      return code;

    }
    case 'FunctionDecl': {
      const params = node.params.map(p => p.name).join(' ');
      return `${indent}(define (${node.name} ${params})\n` +
        genScheme(node.body, indent + "  ") +
        `\n${indent})`;

    }
    case 'Block':
      return `${indent}(begin\n` +
        node.statements.map(s => genScheme(s, indent + "  ")).join('\n') +
        `\n${indent})`;

    case 'VariableDecl':
      return `${indent}(define ${node.name} ${genScheme(node.value, "")})`;

    case 'Return':
      return genScheme(node.value, "");

    case 'FunctionCall':
      return `${indent}(${node.name} ${node.args.map(a => genScheme(a, "")).join(' ')})`;

    case 'SwarmStatement': {
      // Map swarm to Scheme fibers/tasks
      let swarmCode = `${indent}; Swarm Initiation: Lambda/Fibers\n`;
      node.steps.forEach(step => {
        swarmCode += `${indent}(spawn (lambda () (display "[SCHEME] Birthing Agent ${step.name}...") (newline)))\n`;
      });
      return swarmCode;

    }
    case 'Number':
      return String(node.value);

    case 'String':
      return `"${node.value}"`;

    case 'Identifier':
      return node.name;

    case 'BinaryOp':
      return `(${node.op} ${genScheme(node.left, "")} ${genScheme(node.right, "")})`;

    default:
      return `${indent}; [SCHEME-GEN] Unhandled: ${node.type}`;
  }
}
