/**
 * Sui Move Backend for Swibe
 * Target: Trust Broker & On-chain Soul
 */

export function genMove(node, indent = "") {
  if (!node) return '';

  switch (node.type) {
    case 'Program': {
      let code = 'module omokoda::soul {\n';
      code += '  use sui::event;\n';
      code += '  use sui::object::{Self, UID};\n';
      code += '  use sui::transfer;\n';
      code += '  use sui::tx_context::{Self, TxContext};\n\n';
      
      code += '  struct BreathEvent has copy, drop {\n';
      code += '    message: vector<u8>,\n';
      code += '    iteration: u64,\n';
      code += '  }\n\n';
      
      code += '  struct SoulToken has key, store {\n';
      code += '    id: UID,\n';
      code += '    agent: address,\n';
      code += '    value: u64,\n';
      code += '  }\n\n';
      
      code += '  struct ReceiptEvent has copy, drop {\n';
      code += '    hash: vector<u8>,\n';
      code += '    agent: address,\n';
      code += '  }\n\n';
      
      const effectTypes = ['MintStatement', 'ReceiptStatement', 'SealStatement', 'WalrusStatement', 'If', 'LoopUntil', 'VariableDecl'];
      const structuralNodes = node.statements.filter(s => !effectTypes.includes(s.type));
      const effectNodes = node.statements.filter(s => effectTypes.includes(s.type));

      code += structuralNodes.map(s => '  ' + genMove(s)).filter(s => s.trim() !== '').join('\n\n');
      
      if (effectNodes.length > 0) {
        code += '\n\n  public entry fun init_ritual(ctx: &mut TxContext) {\n';
        code += effectNodes.map(s => '    ' + genMove(s, '    ').trim()).join('\n');
        code += '\n  }';
      }

      code += '\n}';
      return code;

    }
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
      if (node.value.startsWith('0x')) return node.value;
      return `b"${node.value}"`;

    case 'Identifier':
      return node.name;

    case 'SwarmStatement': {
      let swarmCode = `public entry fun swarm_execute(ctx: &mut TxContext) {\n`;
      swarmCode += `    let iter = 1;\n`;
      node.steps.forEach(step => {
        swarmCode += `    event::emit(BreathEvent { message: b"${step.name}", iteration: iter });\n`;
      });
      swarmCode += `  }`;
      return swarmCode;

    }
    case 'MetaDigital': {
      const safeName = node.name.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
      let mdCode = `${indent}// Meta-Digital Chain: ${node.name}\n`;
      if (node.config?.ethics) {
        const ethicsVal = node.config.ethics.value || node.config.ethics;
        mdCode += `${indent}// Ethics guard: ${ethicsVal}\n`;
      }
      mdCode += `${indent}public entry fun meta_digital_${safeName}(ctx: &mut TxContext) {\n`;
      if (Array.isArray(node.config?.chain)) {
        node.config.chain.forEach((step, i) => {
          mdCode += `${indent}  event::emit(BreathEvent { message: b"${step}", iteration: ${i + 1} });\n`;
        });
      }
      mdCode += `${indent}}`;
      return mdCode;
    }

    case 'NeuralLayer':
      return `${indent}struct NeuralState has key, store {\n` +
        `${indent}  id: UID,\n` +
        `${indent}  neurons: u64,\n` +
        `${indent}  synapses: u64,\n` +
        `${indent}}\n\n` +
        `${indent}public entry fun neural_fire(state: &mut NeuralState, pathway: vector<u8>) {\n` +
        `${indent}  state.synapses = state.synapses + 1;\n` +
        `${indent}  event::emit(BreathEvent { message: pathway, iteration: state.synapses });\n` +
        `${indent}}`;

    case 'SecureBlock':
      return `${indent}// === Secure Sandbox Begin ===\n` +
        genMove(node.body, indent) +
        `\n${indent}// === Secure Sandbox End ===`;

    case 'If': {
      let ifCode = `${indent}if (${genMove(node.condition)}) {\n${genMove(node.thenBranch, indent + '  ')}\n${indent}}`;
      if (node.elseBranch) {
        ifCode += ` else {\n${genMove(node.elseBranch, indent + '  ')}\n${indent}}`;
      }
      return ifCode;
    }

    case 'BinaryOp':
      return `${genMove(node.left)} ${node.op} ${genMove(node.right)}`;

    case 'Boolean':
      return node.value ? 'true' : 'false';

    case 'FunctionCall':
      return `${indent}${node.name}(${node.args.map(a => genMove(a)).join(', ')})`;

    case 'SkillDecl': {
      let skillCode = `${indent}struct ${node.name} has key, store {\n`;
      skillCode += `${indent}  id: UID,\n`;
      skillCode += `${indent}}\n\n`;
      skillCode += `${indent}public entry fun ${node.name.toLowerCase()}_execute(ctx: &mut TxContext) {\n`;
      skillCode += `${indent}  event::emit(BreathEvent { message: b"${node.name}", iteration: 1 });\n`;
      skillCode += `${indent}}`;
      return skillCode;
    }

    case 'LoopUntil': {
      const goalStr = node.goal?.value || 'goal_met';
      return `${indent}// Loop until: ${goalStr}\n` +
        `${indent}let mut iterations: u64 = 0;\n` +
        `${indent}while (iterations < 1000) {\n` +
        `${indent}  iterations = iterations + 1;\n` +
        genMove(node.body, indent + '  ') + '\n' +
        `${indent}  // abort if goal not met after max iterations\n` +
        `${indent}};\n` +
        `${indent}assert!(iterations < 1000, 0);`;
    }

    case 'TargetDirective':
      return `${indent}// @target ${node.target}`;

    case 'MintStatement': {
      const agent = node.args?.fields?.agent ? genMove(node.args.fields.agent) : 'tx_context::sender(ctx)';
      const value = node.args?.fields?.value ? genMove(node.args.fields.value) : '1';
      return `${indent}transfer::public_transfer(\n` +
             `${indent}  SoulToken { id: object::new(ctx), agent: ${agent}, value: ${value} },\n` +
             `${indent}  ${agent}\n` +
             `${indent});`;
    }

    case 'ReceiptStatement': {
      const hash = node.args?.fields?.hash ? genMove(node.args.fields.hash) : 'b"none"';
      const agent = node.args?.fields?.agent ? genMove(node.args.fields.agent) : 'tx_context::sender(ctx)';
      return `${indent}event::emit(ReceiptEvent { hash: ${hash}, agent: ${agent} });`;
    }

    case 'SealStatement':
      return `${indent}// SEAL_HOOK: Requesting key derivation via Seal server\n` +
             `${indent}event::emit(BreathEvent { message: b"seal_request", iteration: 0 });`;

    case 'WalrusStatement': {
      const blob = node.args?.fields?.blob ? genMove(node.args.fields.blob) : 'b""';
      return `${indent}// WALRUS_HOOK: Storing blob via Walrus SDK\n` +
             `${indent}event::emit(BreathEvent { message: ${blob}, iteration: 999 });`;
    }

    case 'Nil':
      return '0';

    default:
      return `${indent}// [MOVE-GEN] Unhandled: ${node.type}`;
  }
}

export function genMoveToml() {
  return `[package]
name = "swibe-agent"
version = "0.1.0"

[dependencies]
Sui = { git = "https://github.com/MystenLabs/sui.git", subdir = "crates/sui-framework/packages/sui-framework", rev = "framework/testnet" }

[addresses]
omokoda = "0x0"
`;
}
