/**
 * Go Backend for Swibe
 * Target: Goroutine Workers & Channels
 */

export function genGo(node, indent = "") {
  if (!node) return '';

  switch (node.type) {
    case 'Program': {
      let code = `package main\n\n`;
      code += `import (\n  "fmt"\n)\n\n`;
      
      const functionDecls = node.statements.filter(s => s.type === 'FunctionDecl' || s.type === 'SkillDecl');
      code += functionDecls.map(s => genGo(s, "")).join('\n\n');

      const hasMain = node.statements.some(s => s.type === 'FunctionDecl' && s.name === 'main');
      if (!hasMain) {
        code += `\nfunc main() {\n`;
        code += `    fmt.Println("Swibe")\n`;
        code += node.statements.filter(s => s.type !== 'FunctionDecl' && s.type !== 'SkillDecl').map(s => genGo(s, "    ")).join('\n');
        code += `}\n`;
      }
      return code;

    }
    case 'FunctionDecl': {
      const params = node.params.map(p => `${p.name} int`).join(', ');
      let retType = '';
      // Go main() has no return type
      if (node.name !== 'main') {
        retType = node.returnType ? ` ${node.returnType}` : ' int';
      }
      return `${indent}func ${node.name}(${params})${retType} {\n` +
        genGo(node.body, indent + "    ") +
        `\n${indent}}`;

    }
    case 'Block':
      return node.statements.map((s, i) => {
        const g = genGo(s, indent);
        if (i === node.statements.length - 1) {
          // For the last statement, if it's an expression (not print), add return
          if ((s.type === 'BinaryOp' || s.type === 'FunctionCall' || s.type === 'Identifier' || s.type === 'Number') && !(s.type === 'FunctionCall' && s.name === 'print')) {
            return `${indent}return ${g}`;
          }
        }
        return g;
      }).join('\n');

    case 'VariableDecl':
      return `${indent}${node.name} := ${genGo(node.value, "")}`;

    case 'Return':
      return `${indent}return ${genGo(node.value, "")}`;

    case 'FunctionCall': {
      const fName = node.name;
      if (fName === 'print') return `${indent}fmt.Println(${node.args.map(a => genGo(a, "")).join(', ')})`;
      if (fName === 'think') return `${indent}Think(${node.args.map(a => genGo(a, "")).join(', ')})`;
      if (fName === 'println') return `${indent}fmt.Println(${node.args.map(a => genGo(a, "")).join(', ')})`;
      return `${indent}${fName}(${node.args.map(a => genGo(a, "")).join(', ')})`;

    }
    case 'MethodCall': {
      const obj = genGo(node.object);
      if (obj === 'crypto' && node.method === 'randomBytes') {
          return `${indent}crypto_struct.RandomBytes(${node.args.map(a => genGo(a, "")).join(', ')})`;
      }
      if (obj === 'json' || obj === 'rag') {
          return `${indent}${obj}.${node.method.charAt(0).toUpperCase() + node.method.slice(1)}(${node.args.map(a => genGo(a, "")).join(', ')})`;
      }
      if (obj === 'SovereignRitual' && node.method === 'actions') {
          return `${indent}SovereignRitual{}.Actions()`;
      }
      return `${indent}${obj}.${node.method.charAt(0).toUpperCase() + node.method.slice(1)}(${node.args.map(a => genGo(a, "")).join(', ')})`;

    }
    case 'SkillDecl': {
      let skillGo = `${indent}type ${node.name} struct {}\n`;
      skillGo += `${indent}func (s ${node.name}) Actions() {\n`;
      skillGo += node.body.map(s => genGo(s, indent + "    ")).join('\n');
      skillGo += `\n${indent}}`;
      return skillGo;

    }
    case 'SecureBlock':
      return `${indent}go func() {\n${indent}    ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)\n${indent}    defer cancel()\n${indent}    _ = ctx\n` +
        genGo(node.body, indent + "    ") +
        `\n${indent}}()`;

    case 'MetaDigital':
      return `${indent}fmt.Println("[GO] Running Meta-Digital: ${node.name}")`;

    case 'FieldAccess':
      return `${genGo(node.object)}.${node.field.charAt(0).toUpperCase() + node.field.slice(1)}`;

    case 'DictLiteral':
      // Very basic map literal for Go
      return `map[string]interface{}{${Object.entries(node.fields).map(([k, v]) => `"${k}": ${genGo(v, "")}`).join(', ')}}`;

    case 'If': {
      let ifGo = `${indent}if ${genGo(node.condition)} {\n${genGo(node.thenBranch, indent + "    ")}\n${indent}}`;
      if (node.elseBranch) {
        ifGo += ` else {\n${genGo(node.elseBranch, indent + "    ")}\n${indent}}`;
      }
      return ifGo;

    }
    case 'BinaryOp':
      return `(${genGo(node.left, "")} ${node.op} ${genGo(node.right, "")})`;

    case 'SwarmStatement': {
      let swarmCode = `${indent}// Swarm Initiation: Goroutines\n`;
      node.steps.forEach(step => {
        swarmCode += `${indent}wg.Add(1)\n`;
        swarmCode += `${indent}go func() {\n`;
        swarmCode += `${indent}    defer wg.Done()\n`;
        swarmCode += `${indent}    fmt.Println("[GO] Birthing Agent ${step.name}...")\n`;
        swarmCode += `${indent}}()\n`;
      });
      return swarmCode;

    }
    case 'Boolean':
      return node.value ? 'true' : 'false';

    case 'Nil':
      return 'nil';

    case 'Number':
      return String(node.value);

    case 'String':
      return `"${node.value.replace(/\n/g, "\\n")}"`;

    case 'Identifier':
      return node.name;

    case 'ThinkStatement': {
      const prompt = genGo(node.prompt, "");
      return `${indent}fmt.Printf("[THINK] Processing: %s\\n", ${prompt})\n${indent}result := std.Think(ctx, ${prompt})`;
    }

    case 'ChainStatement': {
      const name = node.name || 'chain';
      const steps = (node.steps || []).map(s => genGo(s, indent + "    ")).join('\n');
      return `${indent}// Chain: ${name}\n${indent}func() {\n${steps}\n${indent}}()`;
    }

    case 'PlanStatement': {
      const goal = node.goal || 'plan';
      const body = genGo(node.body, indent + "    ");
      return `${indent}// Plan: ${goal}\n${indent}plan := std.Plan(ctx, "${goal}")\n${indent}for _, step := range plan.Steps {\n${indent}    std.Think(ctx, step)\n${indent}}\n${body}`;
    }

    case 'EthicsStatement': {
      const rules = (node.rules || []).map(r => `"${r.rule}"`).join(', ');
      return `${indent}if !std.Ethics([]string{${rules}}) {\n${indent}    return errors.New("ethics violation")\n${indent}}`;
    }

    case 'BirthStatement': {
      const config = genGo(node.config, "");
      return `${indent}agent := std.Birth(${config})\n${indent}fmt.Printf("[BIRTH] Agent: %s\\n", agent.Name)`;
    }

    case 'BudgetStatement': {
      const tokens = node.tokens || 10000;
      const timeStr = node.time || '30s';
      return `${indent}ctx = std.WithBudget(ctx, ${tokens}, "${timeStr}")`;
    }

    case 'RememberStatement': {
      const key = genGo(node.key, "");
      return `${indent}std.Remember(ctx, ${key})`;
    }

    case 'EvolveStatement': {
      const soul = node.config?.soul ? genGo(node.config.soul, "") : `"unknown"`;
      const rank = node.config?.rank ? genGo(node.config.rank, "") : '1';
      return `${indent}std.Evolve(ctx, ${soul}, ${rank})`;
    }

    case 'HeartbeatStatement': {
      const every = node.config?.every ? genGo(node.config.every, "") : `"60s"`;
      const check = node.config?.check ? genGo(node.config.check, "") : `"any updates?"`;
      return `${indent}go std.Heartbeat(ctx, ${every}, ${check})`;
    }

    case 'PrintlnStatement': {
      const args = (node.args || []).map(a => genGo(a, "")).join(', ');
      return `${indent}fmt.Println(${args})`;
    }

    case 'ObserveStatement': {
      const event = genGo(node.event, "");
      return `${indent}std.Observe(ctx, ${event})`;
    }

    case 'InvokeStatement': {
      const tool = genGo(node.tool, "");
      return `${indent}std.Invoke(ctx, ${tool})`;
    }

    case 'RetrieveStatement': {
      const query = node.query ? genGo(node.query, "") : `"query"`;
      return `${indent}std.Retrieve(ctx, ${query})`;
    }

    case 'EmptyStatement':
      return '';

    case 'ArrayLiteral':
      return `[]interface{}{${node.elements.map(e => genGo(e, "")).join(', ')}}`;

    case 'LoopStatement': {
      const body = genGo(node.body, indent + "    ");
      const max = node.maxAttempts || 10;
      return `${indent}for _i := 0; _i < ${max}; _i++ {\n${body}\n${indent}}`;
    }

    case 'StructDecl': {
      const fields = node.fields.map(f => `    ${f.name.charAt(0).toUpperCase() + f.name.slice(1)} interface{}`).join('\n');
      return `${indent}type ${node.name} struct {\n${fields}\n${indent}}`;
    }

    case 'EnumDecl': {
      const variants = node.variants.map((v, i) => `${indent}    ${v} = ${i}`).join('\n');
      return `${indent}const (\n${variants}\n${indent})`;
    }

    case 'NeuralLayer':
      return `${indent}// Neural Layer: 86B neurons activated`;

    case 'TargetDirective':
      return `${indent}// @target ${node.target}`;

    case 'SkillProperty':
      return `${indent}// skill.${node.name}`;

    case 'AppDecl':
      return `${indent}// App: ${node.name || 'app'}`;

    case 'Match': {
      const expr = genGo(node.expr, "");
      const arms = node.arms.map(a => `${indent}case ${genGo(a.pattern, "")}:\n${indent}    ${genGo(a.body, "")}`).join('\n');
      return `${indent}switch ${expr} {\n${arms}\n${indent}}`;
    }

    case 'SwarmScaleStatement': {
      const config = genGo(node.config, "");
      return `${indent}std.SwarmScale(${config})`;
    }

    case 'ShareStatement': {
      const config = genGo(node.config, "");
      return `${indent}std.WriteSharedState(${config})`;
    }

    case 'CallToolStatement':
      return `${indent}mcp.CallTool("${node.name}", ${genGo(node.args, "")})`;

    case 'Return':
      return `${indent}return ${genGo(node.value, "")}`;

    case 'Call':
      return `${indent}${genGo(node.callee, "")}(${node.args.map(a => genGo(a, "")).join(', ')})`;

    case 'Index':
      return `${genGo(node.object, "")}[${genGo(node.index, "")}]`;

    case 'IdentifierPattern':
      return node.name;

    default:
      return `${indent}// [GO-GEN] ${node.type}`;
  }
}
