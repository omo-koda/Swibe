/**
 * Lua Backend for Swibe
 * Target: Embedded Agents & Coroutines (Tiny Runtime)
 */

export function genLua(node, indent = "") {
  if (!node) return '';

  switch (node.type) {
    case 'Program': {
      let code = `-- Swibe Sovereign Birth Ritual (Lua Backend)\n`;
      code += `local swibe = require("swibe_runtime")\n\n`;
      code += node.statements.map(s => genLua(s, "")).join('\n\n');
      return code;

    }
    case 'FunctionDecl': {
      const params = node.params.map(p => p.name).join(', ');
      return `${indent}function ${node.name}(${params})\n` +
        genLua(node.body, indent + "  ") +
        `\n${indent}end`;

    }
    case 'Block':
      return node.statements.map(s => genLua(s, indent)).join('\n');

    case 'VariableDecl':
      return `${indent}local ${node.name} = ${genLua(node.value, "")}`;

    case 'Return':
      return `${indent}return ${genLua(node.value, "")}`;

    case 'FunctionCall':
      return `${indent}${node.name}(${node.args.map(a => genLua(a, "")).join(', ')})`;

    case 'SwarmStatement': {
      // Map swarm to Lua Coroutines
      let swarmCode = `${indent}-- Swarm Initiation: Coroutines\n`;
      swarmCode += `${indent}local swarm_threads = {}\n`;
      node.steps.forEach(step => {
        swarmCode += `${indent}table.insert(swarm_threads, coroutine.create(function()\n`;
        swarmCode += `${indent}  print("[LUA] Birthing Agent ${step.name}...")\n`;
        swarmCode += `${indent}end))\n`;
      });
      swarmCode += `${indent}for _, co in ipairs(swarm_threads) do coroutine.resume(co) end`;
      return swarmCode;

    }
    case 'MetaDigital': {
      // Map meta-digital to metatables
      let metaCode = `${indent}-- Meta-Digital: ${node.name}\n`;
      metaCode += `${indent}local ${node.name} = setmetatable({}, {\n`;
      metaCode += `${indent}  __call = function(self, input)\n`;
      metaCode += `${indent}    -- Ethics: ${node.config.ethics || "None"}\n`;
      metaCode += `${indent}    return "${node.config.output || "Alive"}"\n`;
      metaCode += `${indent}  end\n`;
      metaCode += `${indent}})\n`;
      return metaCode;

    }
    case 'Number':
      return String(node.value);

    case 'String':
      return `"${node.value}"`;

    case 'Boolean':
      return node.value ? 'true' : 'false';

    case 'Identifier':
      return node.name;

    case 'BinaryOp': {
      const opMap = { '&&': 'and', '||': 'or', '!=': '~=' };
      const op = opMap[node.op] || node.op;
      return `(${genLua(node.left, "")} ${op} ${genLua(node.right, "")})`;

    }
    case 'ThinkStatement':
      return `${indent}-- think: ${genLua(node.prompt, "")}`;

    default:
      return `${indent}-- [LUA-GEN] Unhandled: ${node.type}`;
  }
}
