/**
 * Haskell Backend for Swibe
 * Target: Pure Ethics & Monadic Swarms
 */

export function genHaskell(node, indent = "") {
  if (!node) return '';

  switch (node.type) {
    case 'Program': {
      let code = `import Control.Concurrent\n\n`;
      code += `main :: IO ()\n`;
      code += `main = do\n`;
      code += `    putStrLn "Swibe Sovereign Birth Ritual (Haskell Backend)"\n`;
      code += node.statements.filter(s => s.type !== 'FunctionDecl').map(s => genHaskell(s, "    ")).join('\n');
      code += `\n`;
      code += node.statements.filter(s => s.type === 'FunctionDecl').map(s => genHaskell(s, "")).join('\n\n');
      return code;

    }
    case 'FunctionDecl': {
      const params = node.params.map(p => p.name).join(' ');
      return `${indent}${node.name} ${params} = do\n` +
        genHaskell(node.body, indent + "    ");

    }
    case 'Block':
      return node.statements.map(s => genHaskell(s, indent)).join('\n');

    case 'VariableDecl':
      return `${indent}let ${node.name} = ${genHaskell(node.value, "")}`;

    case 'Return':
      return `${indent}return ${genHaskell(node.value, "")}`;

    case 'SwarmStatement': {
      // Map swarm to forkIO
      let swarmCode = `${indent}-- Swarm Initiation: forkIO\n`;
      node.steps.forEach(step => {
        swarmCode += `${indent}forkIO $ putStrLn "[HASKELL] Birthing Agent ${step.name}..."\n`;
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
      return `${indent}-- [HASKELL-GEN] Unhandled: ${node.type}`;
  }
}
