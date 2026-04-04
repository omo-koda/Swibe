/**
 * Clojure Backend for Swibe
 * Target: Atoms/STM & Immutable Swarms
 */

export function genClojure(node, indent = "") {
  if (!node) return '';

  switch (node.type) {
    case 'Program': {
      let code = `(println "Swibe Sovereign Birth Ritual (Clojure Backend)")\n\n`;
      code += node.statements.map(s => genClojure(s, "")).join('\n');
      return code;

    }
    case 'FunctionDecl': {
      const params = node.params.map(p => p.name).join(' ');
      return `${indent}(defn ${node.name} [${params}]\n` +
        genClojure(node.body, indent + "  ") +
        `\n${indent})`;

    }
    case 'Block':
      return `${indent}(do\n` +
        node.statements.map(s => genClojure(s, indent + "  ")).join('\n') +
        `\n${indent})`;

    case 'VariableDecl':
      return `${indent}(def ${node.name} (atom ${genClojure(node.value, "")}))`;

    case 'Return':
      return genClojure(node.value, "");

    case 'SwarmStatement': {
      // Map swarm to futures/agents
      let swarmCode = `${indent}; Swarm Initiation: Futures/Atoms\n`;
      node.steps.forEach(step => {
        swarmCode += `${indent}(future (println "[CLOJURE] Birthing Agent ${step.name}..."))\n`;
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
      return `(${node.op} ${genClojure(node.left, "")} ${genClojure(node.right, "")})`;

    case 'ThinkStatement':
      return `${indent}; think: ${genClojure(node.prompt, "")}`;

    default:
      return `${indent}; [CLOJURE-GEN] Unhandled: ${node.type}`;
  }
}
