/**
 * Go Backend for Swibe
 * Target: Goroutine Workers & Channels
 */

export function genGo(node, indent = "") {
  if (!node) return '';

  switch (node.type) {
    case 'Program':
      let code = `package main\n\n`;
      code += `import (\n  "fmt"\n  "sync"\n)\n\n`;
      code += `func main() {\n`;
      code += `    fmt.Println("Swibe Sovereign Birth Ritual (Go Backend)")\n`;
      code += `    var wg sync.WaitGroup\n`;
      code += node.statements.filter(s => s.type !== 'FunctionDecl').map(s => genGo(s, "    ")).join('\n');
      code += `    wg.Wait()\n`;
      code += `}\n\n`;
      code += node.statements.filter(s => s.type === 'FunctionDecl').map(s => genGo(s, "")).join('\n\n');
      return code;

    case 'FunctionDecl':
      const params = node.params.map(p => `${p.name} interface{}`).join(', ');
      return `${indent}func ${node.name}(${params}) {\n` +
        genGo(node.body, indent + "    ") +
        `\n${indent}}`;

    case 'Block':
      return node.statements.map(s => genGo(s, indent)).join('\n');

    case 'VariableDecl':
      return `${indent}${node.name} := ${genGo(node.value, "")}`;

    case 'Return':
      return `${indent}return ${genGo(node.value, "")}`;

    case 'SwarmStatement':
      // Map swarm to goroutines
      let swarmCode = `${indent}// Swarm Initiation: Goroutines\n`;
      node.steps.forEach(step => {
        swarmCode += `${indent}wg.Add(1)\n`;
        swarmCode += `${indent}go func() {\n`;
        swarmCode += `${indent}    defer wg.Done()\n`;
        swarmCode += `${indent}    fmt.Println("[GO] Birthing Agent ${step.name}...")\n`;
        swarmCode += `${indent}}()\n`;
      });
      return swarmCode;

    case 'Number':
      return String(node.value);

    case 'String':
      return `"${node.value}"`;

    case 'Identifier':
      return node.name;

    default:
      return `${indent}// [GO-GEN] Unhandled: ${node.type}`;
  }
}
