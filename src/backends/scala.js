/**
 * Scala Backend for Swibe
 * Target: Akka Scale & JVM Swarms
 */

export function genScala(node, indent = "") {
  if (!node) return '';

  switch (node.type) {
    case 'Program': {
      let code = `import scala.concurrent.Future\n`;
      code += `import scala.concurrent.ExecutionContext.Implicits.global\n\n`;
      code += `object SwibeApp extends App {\n`;
      code += `  println("Swibe Sovereign Birth Ritual (Scala Backend)")\n`;
      code += node.statements.filter(s => s.type !== 'FunctionDecl').map(s => genScala(s, "  ")).join('\n');
      code += `\n}\n\n`;
      code += node.statements.filter(s => s.type === 'FunctionDecl').map(s => genScala(s, "")).join('\n\n');
      return code;

    }
    case 'FunctionDecl':
      return `${indent}def ${node.name}(${node.params.map(p => `${p.name}: Any`).join(', ')}): Any = {\n` +
        genScala(node.body, indent + "  ") +
        `\n${indent}}`;

    case 'Block':
      return node.statements.map(s => genScala(s, indent)).join('\n');

    case 'VariableDecl':
      return `${indent}val ${node.name} = ${genScala(node.value, "")}`;

    case 'Return':
      return genScala(node.value, "");

    case 'SwarmStatement': {
      // Map swarm to Futures
      let swarmCode = `${indent}// Swarm Initiation: Akka-style Futures\n`;
      node.steps.forEach(step => {
        swarmCode += `${indent}Future { println("[SCALA] Birthing Agent ${step.name}...") }\n`;
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
      return `${genScala(node.left, "")} ${node.op} ${genScala(node.right, "")}`;

    case 'ThinkStatement':
      return `${indent}// think: ${genScala(node.prompt, "")}`;

    default:
      return `${indent}// [SCALA-GEN] Unhandled: ${node.type}`;
  }
}
