/**
 * Zig Backend for Swibe
 * Target: Edge Scouts & Comptime Threads (Zero Overhead)
 */

export function genZig(node, indent = "") {
  if (!node) return '';

  switch (node.type) {
    case 'Program':
      let code = `const std = @import("std");\n\n`;
      code += `pub fn main() !void {\n`;
      code += `    const stdout = std.io.getStdOut().writer();\n`;
      code += `    try stdout.print("Swibe Sovereign Birth Ritual (Zig Backend)\\n", .{});\n`;
      code += node.statements.filter(s => s.type !== 'FunctionDecl').map(s => genZig(s, "    ")).join('\n');
      code += `\n}\n\n`;
      code += node.statements.filter(s => s.type === 'FunctionDecl').map(s => genZig(s, "")).join('\n\n');
      return code;

    case 'FunctionDecl':
      const params = node.params.map(p => `${p.name}: anytype`).join(', ');
      return `${indent}fn ${node.name}(${params}) !void {\n` +
        genZig(node.body, indent + "    ") +
        `\n${indent}}`;

    case 'Block':
      return node.statements.map(s => genZig(s, indent)).join('\n');

    case 'VariableDecl':
      return `${indent}const ${node.name} = ${genZig(node.value, "")};`;

    case 'FunctionCall':
      if (node.name === 'print') {
        return `${indent}std.debug.print("{s}\\n", .{${node.args.map(a => genZig(a, "")).join(', ')}});`;
      }
      return `${indent}try ${node.name}(${node.args.map(a => genZig(a, "")).join(', ')});`;

    case 'SwarmStatement':
      // Map swarm to Zig threads (simplified for bridge)
      let swarmCode = `${indent}// Swarm Initiation: Native Threads\n`;
      node.steps.forEach(step => {
        swarmCode += `${indent}const thread_${step.name} = try std.Thread.spawn(.{}, ${step.name}_agent, .{});\n`;
        swarmCode += `${indent}thread_${step.name}.detach();\n`;
      });
      return swarmCode;

    case 'Number':
      return String(node.value);

    case 'String':
      return `"${node.value}"`;

    case 'Identifier':
      return node.name;

    default:
      return `${indent}// [ZIG-GEN] Unhandled: ${node.type}`;
  }
}
