/**
 * Mojo Backend for Swibe
 * Target: High-performance Kernels (Neural Layer)
 */

export function genMojo(node, indent = "") {
  if (!node) return '';

  switch (node.type) {
    case 'Program': {
      let code = `from tensor import Tensor\n`;
      code += `from math import sin\n\n`;
      code += `fn main():\n`;
      code += `    print("Swibe Sovereign Birth Ritual (Mojo Backend)")\n`;
      code += node.statements.map(s => genMojo(s, "    ")).join('\n');
      return code;

    }
    case 'FunctionDecl': {
      const params = node.params.map(p => `${p.name}: Int`).join(', ');
      return `${indent}fn ${node.name}(${params}):\n` +
        genMojo(node.body, indent + "    ");

    }
    case 'Block':
      return node.statements.map(s => genMojo(s, indent)).join('\n');

    case 'FunctionCall':
      if (node.name === 'print') {
        return `${indent}print(${node.args.map(a => genMojo(a, "")).join(' ')})`;
      }
      return `${indent}${node.name}(${node.args.map(a => genMojo(a, "")).join(', ')})`;

    case 'BinaryOp':
      return `${genMojo(node.left, "")} ${node.op} ${genMojo(node.right, "")}`;

    case 'ThinkStatement':
      return `${indent}# think: ${genMojo(node.prompt, "")}`;

    case 'VariableDecl':
      return `${indent}var ${node.name} = ${genMojo(node.value, "")}`;

    case 'NeuralLayer':
      return `${indent}# Mojo High-Performance Kernel: Neural Simulation\n` +
             `${indent}let neurons = 86_000_000_000\n` +
             `${indent}let synapses = 86_000_000`;

    case 'Number':
      return String(node.value);

    case 'String':
      return `"${node.value}"`;

    default:
      return `${indent}# [MOJO-GEN] Unhandled: ${node.type}`;
  }
}
