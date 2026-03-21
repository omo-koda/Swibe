/**
 * Sui Move Backend for Swibe
 * Target: Trust Broker & On-chain Soul
 */

export function genMove(node, indent = "") {
  if (!node) return '';

  switch (node.type) {
    case 'Program':
      let code = 'module omokoda::soul {\n';
      code += '  use sui::event;\n';
      code += '  use sui::tx_context::{Self, TxContext};\n\n';
      code += '  struct BreathEvent has copy, drop {\n';
      code += '    message: vector<u8>,\n';
      code += '    iteration: u64,\n';
      code += '  }\n\n';
      code += node.statements.map(s => '  ' + genMove(s)).filter(s => s.trim() !== '').join('\n\n');
      code += '\n}';
      return code;

    case 'FunctionDecl':
      return `fun ${node.name}(${node.params.map(p => `${p.name}: u64`).join(', ')}) ${genMove(node.body)}`;

    case 'Block':
      return '{\n' + node.statements.map(s => '    ' + genMove(s)).join('\n') + '\n  }';

    case 'VariableDecl':
      return `let ${node.isMut ? 'mut ' : ''}${node.name} = ${genMove(node.value)};`;

    case 'Return':
      return `${genMove(node.value)}`;

    case 'Number':
      return String(node.value);

    case 'String':
      return `b"${node.value}"`;

    case 'Identifier':
      return node.name;

    case 'SwarmStatement':
      let swarmCode = `public entry fun swarm_execute(ctx: &mut TxContext) {\n`;
      swarmCode += `    let iter = 1;\n`;
      node.steps.forEach(step => {
        swarmCode += `    event::emit(BreathEvent { message: b"${step.name}", iteration: iter });\n`;
      });
      swarmCode += `  }`;
      return swarmCode;

    default:
      return `${indent}// [MOVE-GEN] Unhandled: ${node.type}`;
  }
}
