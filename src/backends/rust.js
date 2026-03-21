/**
 * Rust Backend for Swibe
 * Target: Safe Enforcer & Threaded Swarms
 */

export function genRust(node, indent = "") {
  if (!node) return '';

  switch (node.type) {
    case 'Program':
      let code = `use std::thread;\n`;
      code += `use std::sync::mpsc;\n\n`;
      code += `fn main() {\n`;
      code += `    println!("Swibe Sovereign Birth Ritual (Rust Backend)");\n`;
      code += node.statements.filter(s => s.type !== 'FunctionDecl').map(s => genRust(s, "    ")).join('\n');
      code += `\n}\n\n`;
      code += node.statements.filter(s => s.type === 'FunctionDecl').map(s => genRust(s, "")).join('\n\n');
      return code;

    case 'FunctionDecl':
      const params = node.params.map(p => `${p.name}: i32`).join(', ');
      return `${indent}fn ${node.name}(${params}) {\n` +
        genRust(node.body, indent + "    ") +
        `\n${indent}}`;

    case 'Block':
      return node.statements.map(s => genRust(s, indent)).join('\n');

    case 'VariableDecl':
      return `${indent}${node.isMut ? 'let mut' : 'let'} ${node.name} = ${genRust(node.value, "")};`;

    case 'Return':
      return `${indent}${genRust(node.value, "")}`;

    case 'SwarmStatement':
      // Map swarm to native threads
      let swarmCode = `${indent}// Swarm Initiation: OS Threads\n`;
      node.steps.forEach(step => {
        swarmCode += `${indent}thread::spawn(|| {\n`;
        swarmCode += `${indent}    println!("[RUST] Birthing Agent ${step.name}...");\n`;
        swarmCode += `${indent}});\n`;
      });
      return swarmCode;

    case 'Number':
      return String(node.value);

    case 'String':
      return `"${node.value}".to_string()`;

    case 'Identifier':
      return node.name;

    default:
      return `${indent}// [RUST-GEN] Unhandled: ${node.type}`;
  }
}
