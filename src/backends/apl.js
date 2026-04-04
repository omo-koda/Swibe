/**
 * APL Backend for Swibe
 * Target: Array God & Tensor Neural Ops
 */

export function genAPL(node, indent = "") {
  if (!node) return '';

  switch (node.type) {
    case 'Program': {
      let code = `⍝ Swibe Sovereign Birth Ritual (APL Backend)\n`;
      code += `Neurons ← 86000000000 ⍴ 1\nSynapses ← Neurons +.× Neurons\n`;
      code += node.statements.map(s => genAPL(s)).join('\n');
      return code;

    }
    case 'FunctionDecl':
      return `${node.name} ← { ${genAPL(node.body)} }`;

    case 'Block':
      return node.statements.map(s => genAPL(s)).join(' ⋄ ');

    case 'VariableDecl':
      return `${node.name} ← ${genAPL(node.value)}`;

    case 'FunctionCall':
      if (node.name === 'print') {
        return `⎕ ← ${node.args.map(a => genAPL(a)).join(' ')}`;
      }
      return `${node.name} ${node.args.map(a => genAPL(a)).join(' ')}`;

    case 'BinaryOp':
      return `(${genAPL(node.left)} ${node.op} ${genAPL(node.right)})`;

    case 'ThinkStatement':
      return `⍝ think: ${genAPL(node.prompt)}`;

    case 'Number':
      return String(node.value);

    case 'String':
      return `'${node.value}'`;

    case 'Identifier':
      return node.name;

    default:
      return `${indent}⍝ [APL-GEN] Unhandled: ${node.type}`;
  }
}
