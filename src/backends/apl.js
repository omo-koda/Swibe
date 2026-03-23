/**
 * APL Backend for Swibe
 * Target: Array God & Tensor Neural Ops
 */

export function genAPL(node, indent = "") {
  if (!node) return '';

  switch (node.type) {
    case 'Program': {
      let code = `⍝ Swibe Sovereign Birth Ritual (APL Backend)\n`;
      code += node.statements.map(s => genAPL(s)).join('\n');
      return code;

    }
    case 'FunctionDecl':
      return `${node.name} ← { ${genAPL(node.body)} }`;

    case 'Block':
      return node.statements.map(s => genAPL(s)).join(' ⋄ ');

    case 'VariableDecl':
      return `${node.name} ← ${genAPL(node.value)}`;

    case 'NeuralLayer':
      return `⍝ 86B Neurons Simulation\nNeurons ← 86000000000 ⍴ 1\nSynapses ← Neurons +.× Neurons`;

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
