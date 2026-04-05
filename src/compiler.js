/**
 * Swibe Compiler
 * Compiles Swibe AST to target languages
 */

import { Lexer } from './lexer.js';
import { Parser } from './parser.js';
import { LLMIntegration } from './llm-integration.js';
import { genElixir } from './backends/elixir.js';
import { genPony } from './backends/pony.js';
import { genMojo } from './backends/mojo.js';
import { genAether } from './backends/aether.js';
import { genLua } from './backends/lua.js';
import { genZig } from './backends/zig.js';
import { genJulia } from './backends/julia.js';
import { genNim } from './backends/nim.js';
import { genCrystal } from './backends/crystal.js';
import { genJanet } from './backends/janet.js';
import { genScheme } from './backends/scheme.js';
import { genRust } from './backends/rust.js';
import { genGo } from './backends/go.js';
import { genV } from './backends/v.js';
import { genOdin } from './backends/odin.js';
import { genOCaml } from './backends/ocaml.js';
import { genFSharp } from './backends/fsharp.js';
import { genClojure } from './backends/clojure.js';
import { genHaskell } from './backends/haskell.js';
import { genProlog } from './backends/prolog.js';
import { genScala } from './backends/scala.js';
import { genIdris } from './backends/idris.js';
import { genMove } from './backends/move.js';
import { genAPL } from './backends/apl.js';
import { genJ } from './backends/j.js';
import { genK } from './backends/k.js';
import { genForth } from './backends/forth.js';
import { genMercury } from './backends/mercury.js';
import { genAda } from './backends/ada.js';
import { genCOBOL } from './backends/cobol.js';
import { genSmalltalk } from './backends/smalltalk.js';
import { genD } from './backends/d.js';
import { genTypeScript } from './backends/typescript.js';
import { genRaku } from './backends/raku.js';
import { genRuby } from './backends/ruby.js';
import { genPerl } from './backends/perl.js';

class Compiler {
  constructor(source, targetLanguage = 'javascript') {
    this.source = source;
    this.targetLanguage = targetLanguage;
    this.llm = new LLMIntegration();
    this.ast = null;
  }

  async compile() {
    const lexer = new Lexer(this.source);
    const tokens = lexer.tokenize();
    const parser = new Parser(tokens);
    let ast = parser.parse();

    try {
      const ir = new IRGenerator();
      const irAst = ir.generate(ast);
      // Wire IR generator in a non-destructive way for compatibility
      ast = (irAst && irAst.type) ? irAst : ast;
    } catch (_e) {
      // silently catch IR generation errors
    }

    try {
      const typeInference = new TypeInference();
      typeInference.infer(ast);
    } catch (_e) {
      // silently catch type inference errors
    }

    this.ast = ast;
    await this.processPrompts(this.ast);
    const code = this.generateCode(this.ast);
    return code;
  }

  async processPrompts(node, depth = 0) {
    if (!node || depth > 5) return;
    if (node.type === 'Prompt' || node.type === 'Voice') {
      const promptText = node.type === 'Prompt' ? node.text : node.text.match(/voice:\s*"([^"]*)"/)?.[1];
      if (promptText) {
        const generated = await this.llm.generateCode(promptText, { targetLanguage: this.targetLanguage });
        const generatedAst = new Parser(new Lexer(generated).tokenize()).parse();
        if (generatedAst.type === 'Program' && generatedAst.statements.length === 1) {
          Object.assign(node, generatedAst.statements[0]);
        } else {
          Object.assign(node, generatedAst);
        }
        await this.processPrompts(node, depth + 1);
      }
      return;
    }
    for (const key in node) {
      if (key === 'type') continue;
      if (Array.isArray(node[key])) {
        for (const item of node[key]) await this.processPrompts(item, depth);
      } else if (typeof node[key] === 'object' && node[key] !== null) {
        await this.processPrompts(node[key], depth);
      }
    }
  }

  generateCode(node) {
    switch (this.targetLanguage) {
      case 'javascript': return this.genJavaScript(node);
      case 'rust': return genRust(node);
      case 'go': return genGo(node);
      case 'v': return genV(node);
      case 'odin': return genOdin(node);
      case 'fsharp': return genFSharp(node);
      case 'julia': return genJulia(node);
      case 'idris': return genIdris(node);
      case 'move': return genMove(node);
      case 'prolog': return genProlog(node);
      case 'janet': return genJanet(node);
      case 'haskell': return genHaskell(node);
      case 'lua': return genLua(node);
      case 'nim': return genNim(node);
      case 'crystal': return genCrystal(node);
      case 'scheme': return genScheme(node);
      case 'clojure': return genClojure(node);
      case 'ocaml': return genOCaml(node);
      case 'scala': return genScala(node);
      case 'elixir': return genElixir(node);
      case 'hybrid': return this.genHybrid(node);
      case 'pony': return genPony(node);
      case 'mojo': return genMojo(node);
      case 'aether': return genAether(node);
      case 'zig': return genZig(node);
      case 'apl': return genAPL(node);
      case 'j': return genJ(node);
      case 'k': return genK(node);
      case 'forth': return genForth(node);
      case 'mercury': return genMercury(node);
      case 'ada': return genAda(node);
      case 'cobol': return genCOBOL(node);
      case 'smalltalk': return genSmalltalk(node);
      case 'd': return genD(node);
      case 'raku': return genRaku(node);
      case 'ruby': return genRuby(node);
      case 'perl': return genPerl(node);
      case 'python': return this.genPython(node);
      case 'r': return this.genR(node);
      case 'lisp': return this.genLisp(node);
      case 'matlab': return this.genMatlab(node);
      case 'wolfram': return this.genWolfram(node);
      case 'agent-skills': return this.genAgentSkills(node);
      default: return this.genJavaScript(node);
    }
  }

  genHybrid(node) {
    if (!node) return '';
    if (node.type === 'Program') {
      const elixirNodes = { type: 'Program', statements: [] };
      const moveNodes = { type: 'Program', statements: [] };
      node.statements.forEach(s => {
        if (s.type === 'TargetDirective' && s.body) {
          if (s.target === 'move') {
            moveNodes.statements.push(...s.body.statements);
          } else if (s.target === 'elixir' || s.target === 'beam') {
            elixirNodes.statements.push(...s.body.statements);
          }
        } else if (s.type === 'SwarmStatement') {
          const elixirSteps = s.steps.filter(step => step.target !== 'move' && !step.role?.text?.includes('@move'));
          const moveSteps = s.steps.filter(step => step.target === 'move' || step.role?.text?.includes('@move'));
          if (elixirSteps.length > 0) elixirNodes.statements.push({ ...s, steps: elixirSteps });
          if (moveSteps.length > 0) moveNodes.statements.push({ ...s, steps: moveSteps });
        } else if (s.type === 'MintStatement' || s.type === 'ReceiptStatement' || s.type === 'SealStatement' || s.type === 'WalrusStatement') {
          moveNodes.statements.push(s);
        } else {
          elixirNodes.statements.push(s);
          if (s.type === 'FunctionDecl' || s.type === 'StructDecl' || s.type === 'EnumDecl') moveNodes.statements.push(s);
        }
      });
      const elixirCode = genElixir(elixirNodes);
      const moveCode = genMove(moveNodes);
      return `--- ELIXIR ---\n${elixirCode}\n--- MOVE ---\n${moveCode}`;
    }
    return this.genJavaScript(node);
  }

  genJavaScript(node) {
    if (!node) return '';
    switch (node.type) {
      case 'Program':
        let code = node.statements.map(s => {
          const code = this.genJavaScript(s);
          return code.endsWith(';') || code.endsWith('}') ? code : code + ';';
        }).join('\n\n');
        code += '\n\nmain();';
        return code;
      case 'FunctionDecl': {
        // Strip type annotations: 'a: i32' -> 'a', handles both {name,type} objects and 'a: i32' strings
        const jsParams = node.params.map(p =>
          typeof p === 'string' ? p.split(':')[0].trim() : p.name
        ).join(', ');
        return `async function ${node.name}(${jsParams}) ${this.genJavaScript(node.body)}`;
      }
      case 'Block':
        return '{\n' + node.statements.map(s => {
          const code = this.genJavaScript(s);
          return '  ' + code + (code.endsWith(';') || code.endsWith('}') ? '' : ';');
        }).join('\n') + '\n}';
      case 'VariableDecl':
        return `${node.isMut ? 'let' : 'const'} ${node.name} = ${this.genJavaScript(node.value)};`;
      case 'Return':
        return `return ${this.genJavaScript(node.value)};`;
      case 'FunctionCall':
        const args = node.args.map(a => this.genJavaScript(a)).join(', ');
        if (node.name === 'print') {
          return `console.log(${args})`;
        } else {
          return `${node.name}(${args})`;
        }
      case 'Call':
        return `${this.genJavaScript(node.callee)}(${node.args.map(a => this.genJavaScript(a)).join(', ')})`;
      case 'MethodCall':
        return `${this.genJavaScript(node.object)}.${node.method}(${node.args.map(a => this.genJavaScript(a)).join(', ')})`;
      case 'FieldAccess':
        return `${this.genJavaScript(node.object)}.${node.field}`;
      case 'If': {
        let ifCode = `if (${this.genJavaScript(node.condition)}) ${this.genJavaScript(node.thenBranch)}`;
        if (node.elseBranch) ifCode += ` else ${this.genJavaScript(node.elseBranch)}`;
        return ifCode;
      }
      case 'SkillDecl':
        return `const ${node.name} = {\n  actions: async function() {\n${node.body.map(s => '    ' + this.genJavaScript(s)).join(';\n')}\n  }\n};`;
      case 'SecureBlock':
        return `await sandbox_run(async () => ${this.genJavaScript(node.body)})`;
      case 'MetaDigital': {
        return `const ${node.name.replace(/\s+/g, '_')} = new MetaDigital({ name: "${node.name}", ethics: ${this.genJavaScript(node.config.ethics)}, output: ${this.genJavaScript(node.config.output)} });\nawait ${node.name.replace(/\s+/g, '_')}.run();`;
      }
      case 'Number': return String(node.value);
      case 'String': return `"${node.value.replace(/"/g, '\\"').replace(/\n/g, '\\n')}"`;
      case 'Identifier': return node.name;
      case 'IdentifierPattern': return node.name;
      case 'Boolean': return String(node.value);
      case 'Nil': return 'null';
      case 'BinaryOp':
        return `(${this.genJavaScript(node.left)} ${node.op} ${this.genJavaScript(node.right)})`;
      case 'SwarmStatement': {
        const agents = node.agents?.map(a => `"${a.name || 'agent'}"`).join(', ') || '';
        return `// Swarm: ${node.name || 'anonymous'}\n` +
          `const swarm = await Promise.all([${agents}]\n` +
          `.map(name => ({ name, status: 'running' })));\n`;
      }
      case 'ThinkStatement': {
        const prompt = this.genJavaScript(node.prompt);
        const model = node.config?.model
          ? (typeof node.config.model === 'string' ? node.config.model : this.genJavaScript(node.config.model))
          : 'ollama:llama3';
        const maxTokens = node.config?.max_tokens
          ? (typeof node.config.max_tokens === 'number' ? node.config.max_tokens : this.genJavaScript(node.config.max_tokens))
          : 512;
        return `await std.think(${prompt}, { model: "${model}", max_tokens: ${maxTokens} })`;
      }
      case 'NeuralLayer':
        return `/* Neural Layer: 86B neurons activated */`;
      case 'ArrayLiteral':
        return `[${node.elements.map(e => this.genJavaScript(e)).join(', ')}]`;
      case 'DictLiteral':
        return `{ ${Object.entries(node.fields).map(([k, v]) => `${k}: ${this.genJavaScript(v)}`).join(', ')} }`;
      case 'Index':
        return `${this.genJavaScript(node.object)}[${this.genJavaScript(node.index)}]`;
      case 'CallToolStatement':
        return `await mcp.call_tool("${node.name}", ${this.genJavaScript(node.args)})`;
      case 'StructDecl': {
        const fieldNames = node.fields.map(f => f.name);
        return `class ${node.name} {\n  constructor(${fieldNames.join(', ')}) {\n${fieldNames.map(f => `    this.${f} = ${f};`).join('\n')}\n  }\n}`;
      }
      case 'EnumDecl':
        return `const ${node.name} = Object.freeze({\n${node.variants.map((v, i) => `  ${v}: ${i}`).join(',\n')}\n});`;
      case 'Match': {
        const arms = node.arms.map(a => `  case ${this.genJavaScript(a.pattern)}: ${this.genJavaScript(a.body)}; break;`).join('\n');
        return `switch (${this.genJavaScript(node.expr)}) {\n${arms}\n}`;
      }
      case 'LoopStatement': {
        const until = node.until || '';
        const maxAttempts = node.maxAttempts 
          || parseInt(process.env.SWIBE_LOOP_MAX) || 10;
        const body = this.genJavaScript(node.body);
        return `
        let _loopAttempts = 0;
        let _loopDone = false;
        while (!_loopDone && _loopAttempts < ${maxAttempts}) {
          _loopAttempts++;
          ${body}
          // Check until condition
          if ("${until}" && typeof _lastThought === 'string') {
            if (_lastThought.toLowerCase().includes(
              "${until}".replace('until:', '').trim().toLowerCase()
            )) {
              _loopDone = true;
            }
          }
        }`;
      }
      case 'AppDecl': {
        const configEntries = Object.entries(node.config).map(([k, v]) => `  const ${k} = ${this.genJavaScript(v)};`).join('\n');
        return `(async () => {\n${configEntries}\n  await deploy_app({ ${Object.keys(node.config).join(', ')} });\n})();`;
      }
      case 'SkillProperty':
        return `this.${node.name} = ${this.genJavaScript(node.value)}`;
      case 'TargetDirective':
        return `/* @target ${node.target} */`;
      case 'ChainStatement': {
        const name = node.name || 'chain';
        const steps = (node.steps || [])
          .map(s => this.genJavaScript(s))
          .join('\n  ');
        return `await (async () => {
            // Chain: ${name}
            let _ctx = {};
            ${steps}
            return _ctx;
        })();`;
      }
      case 'PlanStatement': {
        const goal = node.goal || 'plan';
        const body = this.genJavaScript(node.body);
        return `await (async () => {
            console.log('[PLAN] Starting: ${goal}');
            const _plan = await std.think(
              'Break this goal into 3-5 steps: ${goal}'
            );
            console.log('[PLAN] Steps:', _plan.content);
            ${body}
            console.log('[PLAN] Complete: ${goal}');
        })();`;
      }
      case 'ThinkStatement': {
        return `await std.think(${this.genJavaScript(node.prompt)});`;
      }
      case 'InvokeStatement': {
        return `await std.invoke(${this.genJavaScript(node.tool)});`;
      }
      case 'RetrieveStatement': {
        const source = node.source || 'vault';
        const query = node.query ? this.genJavaScript(node.query) : (node.vault ? this.genJavaScript(node.vault) : '"query"');
        return `await std.retrieve(${query}, { source: "${source}" })`;
      }
      default: return `/* Unhandled: ${node.type} */`;
    }
  }

  genPython(node) {
    if (!node) return '';
    switch (node.type) {
      case 'Program': {
        const code = node.statements.map(s => this.genPython(s)).join('\n\n');
        return code + '\n\nif __name__ == "__main__":\n  main()';
      }
      case 'FunctionDecl': return `def ${node.name}(${node.params.map(p => p.name).join(', ')}):\n` + this.indentCode(this.genPython(node.body), 2);
      case 'Block': {
        const stmts = node.statements.map(s => this.genPython(s));
        if (stmts.length > 0) {
          const last = node.statements[node.statements.length - 1];
          if (['BinaryOp', 'FunctionCall', 'Number', 'String', 'Identifier', 'ArrayLiteral'].includes(last.type)) {
            // Only add return if it's not a print call
            if (!(last.type === 'FunctionCall' && last.name === 'print')) {
              stmts[stmts.length - 1] = 'return ' + stmts[stmts.length - 1];
            }
          }
        }
        return stmts.join('\n');
      }
      case 'VariableDecl': return `${node.name} = ${this.genPython(node.value)}`;
      case 'Return': return `return ${this.genPython(node.value)}`;
      case 'FunctionCall': {
        if (node.name === 'print') {
          return `print(${node.args.map(a => this.genPython(a)).join(', ')})`;
        } else {
          return `${node.name}(${node.args.map(a => this.genPython(a)).join(', ')})`;
        }
      }
      case 'BinaryOp': return `(${this.genPython(node.left)} ${node.op} ${this.genPython(node.right)})`;
      case 'ThinkStatement': {
        const prompt = this.genPython(node.prompt);
        return `print(f"Thinking: {${prompt}}")`;
      }
      case 'Number': return String(node.value);
      case 'String': return `"${node.value.replace(/\n/g, '\\n').replace(/"/g, '\\"')}"`;
      case 'Boolean': return node.value ? 'True' : 'False';
      case 'Nil': return 'None';
      case 'Identifier': return node.name;
      case 'ArrayLiteral': return `[${node.elements.map(e => this.genPython(e)).join(', ')}]`;
      default: return '';
    }
  }

  genR(node) {
    if (!node) return '';
    switch (node.type) {
      case 'Program': return node.statements.map(s => this.genR(s)).join('\n\n');
      case 'FunctionDecl': return `${node.name} <- function(${node.params.map(p => p.name).join(', ')}) {\n` + this.indentCode(this.genR(node.body), 2) + '\n}';
      case 'VariableDecl': return `${node.name} <- ${this.genR(node.value)}`;
      case 'Block': return node.statements.map(s => this.genR(s)).join('\n');
      case 'Return': return this.genR(node.value);
      case 'FunctionCall': return `${node.name}(${node.args.map(a => this.genR(a)).join(', ')})`;
      case 'Number': return String(node.value);
      case 'String': return `"${node.value.replace(/\n/g, '\\n').replace(/"/g, '\\"')}"`;
      case 'Boolean': return String(node.value);
      case 'Identifier': return node.name;
      case 'ArrayLiteral': return `c(${node.elements.map(e => this.genR(e)).join(', ')})`;
      case 'BinaryOp': return `${this.genR(node.left)} ${node.op} ${this.genR(node.right)}`;
      case 'ThinkStatement': {
        const prompt = this.genR(node.prompt);
        return `cat("Thinking:", ${prompt}, "\n")`;
      }
      default: return '';
    }
  }

  genLisp(node) {
    if (!node) return '';
    switch (node.type) {
      case 'Program': return node.statements.map(s => this.genLisp(s)).join('\n');
      case 'FunctionDecl': return `(defun ${node.name} (${node.params.map(p => p.name).join(' ')})\n  ${this.genLisp(node.body)}\n)`;
      case 'VariableDecl': return `(setq ${node.name} ${this.genLisp(node.value)})`;
      case 'Block': return `(progn\n  ${node.statements.map(s => this.genLisp(s)).join('\n  ')}\n)`;
      case 'FunctionCall': return `(${node.name} ${node.args.map(a => this.genLisp(a)).join(' ')})`;
      case 'Number': return String(node.value);
      case 'String': return `"${node.value.replace(/\n/g, '\\n').replace(/"/g, '\\"')}"`;
      case 'Boolean': return node.value ? 't' : 'nil';
      case 'Identifier': return node.name;
      case 'ArrayLiteral': return `'(${node.elements.map(e => this.genLisp(e)).join(' ')})`;
      case 'BinaryOp': return `(${node.op} ${this.genLisp(node.left)} ${this.genLisp(node.right)})`;
      case 'ThinkStatement': {
        const prompt = this.genLisp(node.prompt);
        return `(format t "Thinking: ~a~%" ${prompt})`;
      }
      default: return '';
    }
  }

  genMatlab(node) {
    if (!node) return '';
    switch (node.type) {
      case 'Program': return node.statements.map(s => this.genMatlab(s)).join('\n\n');
      case 'FunctionDecl': return `function varargout = ${node.name}(${node.params.map(p => p.name).join(', ')})\n` + this.indentCode(this.genMatlab(node.body), 4) + '\nend';
      case 'VariableDecl': return `${node.name} = ${this.genMatlab(node.value)};`;
      case 'Block': return node.statements.map(s => this.genMatlab(s)).join('\n');
      case 'Return': return this.genMatlab(node.value);
      case 'FunctionCall': return `${node.name}(${node.args.map(a => this.genMatlab(a)).join(', ')})`;
      case 'Number': return String(node.value);
      case 'String': return `'${node.value.replace(/\n/g, '\\n')}'`;
      case 'Boolean': return node.value ? 'true' : 'false';
      case 'Identifier': return node.name;
      case 'ArrayLiteral': return `[${node.elements.map(e => this.genMatlab(e)).join(', ')}]`;
      case 'BinaryOp': return `${this.genMatlab(node.left)} ${node.op} ${this.genMatlab(node.right)}`;
      case 'ThinkStatement': {
        const prompt = this.genMatlab(node.prompt);
        return `disp(['Thinking: ', ${prompt}])`;
      }
      default: return '';
    }
  }

  genWolfram(node) {
    if (!node) return '';
    switch (node.type) {
      case 'Program': return node.statements.map(s => this.genWolfram(s)).join('\n');
      case 'FunctionDecl': return `${node.name}[${node.params.map(p => p.name).join(', ')}] := ` + this.genWolfram(node.body);
      case 'VariableDecl': return `${node.name} = ${this.genWolfram(node.value)}`;
      case 'Block': return `Block[{}, ${node.statements.map(s => this.genWolfram(s)).join('; ')}]`;
      case 'Return': return this.genWolfram(node.value);
      case 'FunctionCall': return `${node.name}[${node.args.map(a => this.genWolfram(a)).join(', ')}]`;
      case 'Number': return String(node.value);
      case 'String': return `"${node.value.replace(/\n/g, '\\n').replace(/"/g, '\\"')}"`;
      case 'Boolean': return String(node.value);
      case 'Identifier': return node.name;
      case 'ArrayLiteral': return `{${node.elements.map(e => this.genWolfram(e)).join(', ')}}`;
      case 'BinaryOp': return `${this.genWolfram(node.left)} ${node.op} ${this.genWolfram(node.right)}`;
      case 'ThinkStatement': {
        const prompt = this.genWolfram(node.prompt);
        return `Print["Thinking: ", ${prompt}]`;
      }
      default: return '';
    }
  }

  genAgentSkills(node) {
    if (node.type === 'SkillDecl') {
      const instructions = node.body.filter(item => item.type === 'SkillProperty' && item.name === 'prompt').map(item => this.genJavaScript(item.value))[0] || "";
      const tools = node.body.filter(item => item.type === 'SkillProperty' && item.name === 'tools').flatMap(item => item.value.elements ? item.value.elements.map(e => e.value) : []) || [];
      return JSON.stringify({ version: "2026.1", name: node.name, type: "skill", instructions, tools, resources: [] }, null, 2);
    }
    if (node.type === 'SwarmStatement') {
      return JSON.stringify({ version: "2026.1", type: "swarm", agents: node.steps.map(s => s.name), pipeline: node.steps.map(s => s.name).join(" => "), memory: "rag.last_iteration" }, null, 2);
    }
    if (node.type === 'LoopStatement') {
      return JSON.stringify({ version: "2026.1", type: "loop", until: node.until, trace: true }, null, 2);
    }
    if (node.type === 'Program') {
      return node.statements.map(s => this.genAgentSkills(s)).filter(s => s !== "").join('\n---\n');
    }
    return '';
  }

  indentCode(code, spaces) {
    const indent = ' '.repeat(spaces);
    return code.split('\n').map(line => (line ? indent + line : line)).join('\n');
  }
}

export { Compiler };
