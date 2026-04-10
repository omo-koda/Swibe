/**
 * Nim Backend for Swibe
 * Target: Macro speed & DSL Think
 */

export function genNim(node, indent = "") {
  if (!node) return '';

  switch (node.type) {
    case 'Program': {
      let code = `import std/asyncdispatch, std/json, std/sha1\n\n`;
      code += `echo "Swibe Sovereign Birth Ritual (Nim Backend)"\n\n`;
      code += node.statements.map(s => genNim(s, "")).join('\n\n');
      return code;

    }
    case 'FunctionDecl': {
      const params = node.params.map(p => `${p.name}: JsonNode`).join(', ');
      return `${indent}proc ${node.name}(${params}): Future[JsonNode] {.async.} =\n` +
        genNim(node.body, indent + "  ");

    }
    case 'Block':
      if (node.statements.length === 0) return `${indent}discard`;
      return node.statements.map(s => genNim(s, indent)).join('\n');

    case 'VariableDecl':
      return `${indent}var ${node.name} = ${genNim(node.value, "")}`;

    case 'Return':
      return `${indent}return ${genNim(node.value, "")}`;

    case 'FunctionCall':
      return `${indent}await ${node.name}(${node.args.map(a => genNim(a, "")).join(', ')})`;

    case 'SwarmStatement': {
      // Map swarm to native concurrency (async/await threads)
      let swarmCode = `${indent}# Swarm Initiation: Async Dispatch\n`;
      node.steps.forEach(step => {
        swarmCode += `${indent}echo "[NIM] Birthing Agent ${step.name}..."\n`;
      });
      return swarmCode;

    }
    case 'MetaDigital': {
      // Map meta-digital to macro-like templates
      let metaCode = `${indent}# Meta-Digital: ${node.name}\n`;
      metaCode += `${indent}template ${node.name}_ritual()\n`;
      return metaCode;

    }
    case 'Number':
      return String(node.value);

    case 'String':
      return `"${node.value}"`;

    case 'Identifier':
      return node.name;

    case 'BinaryOp':
      return `${genNim(node.left, "")} ${node.op} ${genNim(node.right, "")}`;

    case 'ThinkStatement': {
      const prompt = genNim(node.prompt, "");
      return `${indent}echo "[THINK] Processing: ", ${prompt}\n${indent}let result = std.think(ctx, ${prompt})`;
    }

    case 'EthicsStatement': {
      const rules = (node.rules || []).map(r => `"${r.rule}"`).join(', ');
      return `${indent}if not std.ethics(@[${rules}]):\n${indent}  raise newException(ValueError, "ethics violation")`;
    }

    case 'BirthStatement': {
      const config = genNim(node.config, "");
      return `${indent}let agent = std.birth(${config})\n${indent}echo "[BIRTH] Agent: ", agent.name`;
    }

    case 'BudgetStatement': {
      const tokens = node.tokens || 10000;
      const timeStr = node.time || '30s';
      return `${indent}ctx = std.withBudget(ctx, ${tokens}, "${timeStr}")`;
    }

    case 'RememberStatement': {
      const key = genNim(node.key, "");
      return `${indent}await std.remember(ctx, ${key})`;
    }

    case 'EvolveStatement': {
      const soul = node.config?.soul ? genNim(node.config.soul, "") : `"unknown"`;
      const rank = node.config?.rank ? genNim(node.config.rank, "") : '1';
      return `${indent}await std.evolve(ctx, ${soul}, ${rank})`;
    }

    case 'HeartbeatStatement': {
      const every = node.config?.every ? genNim(node.config.every, "") : `"60s"`;
      const check = node.config?.check ? genNim(node.config.check, "") : `"any updates?"`;
      return `${indent}asyncCheck std.heartbeat(ctx, ${every}, ${check})`;
    }

    case 'PrintlnStatement': {
      const args = (node.args || []).map(a => genNim(a, "")).join(', ');
      return `${indent}echo ${args}`;
    }

    case 'ChainStatement': {
      const name = node.name || 'chain';
      const steps = (node.steps || []).map(s => genNim(s, indent + "  ")).join('\n');
      return `${indent}# Chain: ${name}\n${indent}block:\n${steps}`;
    }

    case 'PlanStatement': {
      const goal = node.goal || 'plan';
      const body = genNim(node.body, indent + "  ");
      return `${indent}# Plan: ${goal}\n${indent}let plan = await std.plan(ctx, "${goal}")\n${indent}for step in plan.steps:\n${indent}  await std.think(ctx, step)\n${body}`;
    }

    case 'ObserveStatement': {
      const event = genNim(node.event, "");
      return `${indent}std.observe(ctx, ${event})`;
    }

    case 'InvokeStatement': {
      const tool = genNim(node.tool, "");
      return `${indent}await std.invoke(ctx, ${tool})`;
    }

    case 'RetrieveStatement': {
      const query = node.query ? genNim(node.query, "") : `"query"`;
      return `${indent}await std.retrieve(ctx, ${query})`;
    }

    case 'EmptyStatement':
      return '';

    case 'Boolean':
      return node.value ? 'true' : 'false';

    case 'Nil':
      return 'nil';

    case 'ArrayLiteral':
      return `@[${node.elements.map(e => genNim(e, "")).join(', ')}]`;

    case 'FieldAccess':
      return `${genNim(node.object)}.${node.field}`;

    case 'MethodCall':
      return `${indent}${genNim(node.object)}.${node.method}(${node.args.map(a => genNim(a, "")).join(', ')})`;

    case 'If': {
      let code = `${indent}if ${genNim(node.condition)}:\n${genNim(node.thenBranch, indent + "  ")}`;
      if (node.elseBranch) code += `\n${indent}else:\n${genNim(node.elseBranch, indent + "  ")}`;
      return code;
    }

    case 'DictLiteral':
      return `{${Object.entries(node.fields).map(([k, v]) => `"${k}": ${genNim(v, "")}`).join(', ')}.toTable}`;

    case 'SecureBlock':
      return `${indent}# Secure sandbox\n${indent}block:\n${genNim(node.body, indent + "  ")}`;

    case 'NeuralLayer':
      return `${indent}# Neural Layer: 86B neurons activated`;

    case 'TargetDirective':
      return `${indent}# @target ${node.target}`;

    case 'SkillProperty':
      return `${indent}# skill.${node.name}`;

    default:
      return `${indent}# [NIM-GEN] ${node.type}`;
  }
}
