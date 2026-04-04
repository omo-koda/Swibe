/**
 * COBOL Backend for Swibe
 * Target: Batch Audits & Legacy Trails
 */

export function genCOBOL(node, indent = "") {
  if (!node) return '';

  switch (node.type) {
    case 'Program': {
      let code = `       IDENTIFICATION DIVISION.\n`;
      code += `       PROGRAM-ID. SWIBE-APP.\n`;
      code += `       PROCEDURE DIVISION.\n`;
      code += `           DISPLAY "Swibe Sovereign Birth Ritual (COBOL Backend)".\n`;
      code += node.statements.map(s => genCOBOL(s, "           ")).join('\n');
      code += `\n           STOP RUN.`;
      return code;

    }
    case 'FunctionDecl':
      return `${indent}${node.name.toUpperCase()} SECTION.\n${indent}    DISPLAY "Function ${node.name}".`;

    case 'Block':
      return node.statements.map(s => genCOBOL(s, indent)).join('\n');

    case 'FunctionCall':
      if (node.name === 'print') {
        return `${indent}DISPLAY ${node.args.map(a => genCOBOL(a, "")).join(' ')}.`;
      }
      return `${indent}PERFORM ${node.name.toUpperCase()}.`;

    case 'BinaryOp':
      return `${genCOBOL(node.left, "")} ${node.op} ${genCOBOL(node.right, "")}`;

    case 'ThinkStatement':
      return `${indent}* think: ${genCOBOL(node.prompt, "")}`;

    case 'VariableDecl':
      return `${indent}MOVE ${genCOBOL(node.value, "")} TO ${node.name.toUpperCase()}.`;

    case 'Number':
      return String(node.value);

    case 'String':
      return `"${node.value}"`;

    case 'Identifier':
      return node.name.toUpperCase();

    case 'SwarmStatement':
      return `${indent}DISPLAY "[COBOL] Logging swarm members: ${node.steps.map(s => s.name).join(', ')}".`;

    default:
      return `${indent}* [COBOL-GEN] Unhandled: ${node.type}`;
  }
}
