/**
 * Swibe Compiler
 * Compiles Swibe AST to target languages
 */

import { Lexer } from './lexer.js';
import { Parser } from './parser.js';
import { LLMIntegration } from './llm-integration.js';
import { IRGenerator } from './ir-generator.js';
import { TypeInference } from './type-inference.js';
import { EthicsValidator, LayerValidator } from './visitor.js';
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
import { genPython } from './backends/python.js';
import { genR } from './backends/r.js';
import { genLisp } from './backends/lisp.js';
import { genMatlab } from './backends/matlab.js';
import { genWolfram } from './backends/wolfram.js';
import { genAgentSkills } from './backends/agent-skills.js';

class Compiler {
  constructor(source, targetLanguage = 'javascript', options = {}) {
    this.source = source;
    this.targetLanguage = targetLanguage;
    this.llm = new LLMIntegration();
    this.ast = null;
    this.options = {
      strictInternalPasses: false,
      strictLayers: false,
      ...options,
    };
    this.warnings = [];
  }

  _warn(pass, error) {
    const message = `[COMPILER:${pass}] ${error.message}`;
    this.warnings.push(message);
    if (this.options.strictInternalPasses) {
      throw error;
    }
    console.warn(message);
  }

  async compile() {
    const lexer = new Lexer(this.source);
    const tokens = lexer.tokenize();
    const parser = new Parser(tokens);
    let ast = parser.parse();

    if (parser.errors.length > 0) {
      throw new Error(`Parser errors:\n${parser.errors.join('\n')}`);
    }

    try {
      const ir = new IRGenerator();
      const irAst = ir.generate(ast);
      // Wire IR generator in a non-destructive way for compatibility
      ast = (irAst && irAst.type) ? irAst : ast;
    } catch (error) {
      this._warn('IR', error);
    }

    try {
      const typeInference = new TypeInference();
      typeInference.infer(ast);
      typeInference.solve();
      this._types = Object.fromEntries(typeInference.bindings);
    } catch (error) {
      this._warn('TYPE-INFERENCE', error);
    }

    // Run ethics validator
    try {
      const ethicsValidator = new EthicsValidator();
      for (const stmt of (ast.statements || [])) {
        ethicsValidator.visit(stmt);
      }
      for (const v of ethicsValidator.violations) {
        this._warn('ETHICS', new Error(v.message || v.type));
      }
    } catch (error) {
      this._warn('ETHICS', error);
    }

    // Run layer ordering validator
    try {
      const layerValidator = new LayerValidator({ 
        strict: this.options.strictLayers,
        targetLanguage: this.targetLanguage
      });
      for (const stmt of (ast.statements || [])) {
        layerValidator.visit(stmt);
      }
      for (const w of layerValidator.warnings) {
        if (layerValidator.strict) {
          throw new Error(w.message);
        }
        this._warn('LAYER-ORDER', new Error(w.message));
      }
    } catch (error) {
      if (this.options.strictLayers || error.message.includes('Layer ')) {
         throw error;
      }
      this._warn('LAYER-ORDER', error);
    }

    this.ast = ast;
    await this.processPrompts(this.ast);
    const code = await this.generateCode(this.ast);
    return code;
  }

  getSovereignReadinessReport() {
    if (!this.ast) {
      throw new Error('Must call compile() before getting readiness report');
    }

    const ethicsValidator = new EthicsValidator();
    const layerValidator = new LayerValidator({ targetLanguage: this.targetLanguage });
    for (const stmt of (this.ast.statements || [])) {
      ethicsValidator.visit(stmt);
      layerValidator.visit(stmt);
    }

    const violations = ethicsValidator.violations;
    const warnings = layerValidator.warnings;
    
    // Risk score calculation (0-100, higher is riskier)
    let riskScore = 0;
    riskScore += violations.length * 20;
    riskScore += warnings.length * 5;
    
    // Additional risk factors
    const hasSecure = ethicsValidator._hasSecure;
    const hasEthics = ethicsValidator._hasEthics;
    const hasPermissions = ethicsValidator._hasPermissions;
    
    if (!hasEthics) riskScore += 30;
    if (!hasSecure) riskScore += 15;
    if (!hasPermissions) riskScore += 25;
    
    riskScore = Math.min(100, Math.max(0, riskScore));

    return {
      riskScore,
      status: riskScore < 30 ? 'SOVEREIGN' : (riskScore < 70 ? 'CAUTIOUS' : 'VULNERABLE'),
      validators: {
        ethics: { violations: violations.length, passed: violations.length === 0 },
        layers: { warnings: warnings.length, passed: warnings.length === 0 },
      },
      missingFeatures: {
        ethics: !hasEthics,
        secure: !hasSecure,
        permissions: !hasPermissions,
      },
      timestamp: new Date().toISOString()
    };
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

  async generateCode(node) {
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
      case 'python': return genPython(node);
      case 'r': return genR(node);
      case 'lisp': return genLisp(node);
      case 'matlab': return genMatlab(node);
      case 'wolfram': return genWolfram(node);
      case 'agent-skills': return genAgentSkills(node, this.genJavaScript.bind(this));
      case 'openclaw': {
        const { OpenClawGenerator } = await import('./backends/openclaw.js');
        const gen = new OpenClawGenerator(this.ast, this.source);
        return gen.generate();
      }
      case 'wasm': {
        const { WasmGenerator } = await import('./wasm-generator.js');
        const gen = new WasmGenerator(this.ast);
        return gen.generate();
      }
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
      case 'Program': {
        let innerCode = node.statements.map(s => {
          const code = this.genJavaScript(s);
          return code.endsWith(';') || code.endsWith('}') ? code : code + ';';
        }).join('\n\n');

        // Append main call if main function is defined
        const hasMain = node.statements.some(s => s.type === 'FunctionDecl' && s.name === 'main');
        if (hasMain) {
          innerCode += '\n\nif (typeof main === "function") {\n  if (main.constructor.name === "AsyncFunction") {\n    await main();\n  } else {\n    main();\n  }\n}';
        }
        
        return `(async () => {\n${this.indentCode(innerCode, 2)}\n})().catch(err => {\n  console.error('[SWIBE-RUNTIME-ERROR]', err);\n  process.exit(1);\n});`;
      }
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
        const kw = node.isConst ? 'const' : (node.isMut ? 'let' : 'var');
        return `${kw} ${node.name} = ${this.genJavaScript(node.value)};`;
      case 'Return':
        return `return ${this.genJavaScript(node.value)};`;
      case 'FunctionCall':
        const args = node.args.map(a => this.genJavaScript(a)).join(', ');
        const stdBuiltins = [
          'think', 'retrieve', 'invoke', 'birth', 'swarmScale', 
          'readSharedState', 'writeSharedState', 'stake_status',
          'collect_interest', 'appeal_slash'
        ];
        
        if (node.name === 'print') {
          return `console.log(${args})`;
        } else if (stdBuiltins.includes(node.name)) {
          return `await std.${node.name}(${args})`;
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
      case 'SecureBlock': {
        const pol = node.policies || {};
        const policyJSON = JSON.stringify(pol);
        const inner = (node.body || []).map(s => '    ' + this.genJavaScript(s)).join(';\n');
        return `await sandbox_run(async () => {\n${inner}\n}, ${policyJSON})`;
      }
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
      case 'UnaryOp':
        return `(${node.op}${this.genJavaScript(node.expr)})`;
      case 'SwarmStatement': {
        const steps = (node.steps || node.agents || []).map(s => {
          const role = typeof s.role === 'string' ? `"${s.role}"` : (s.role ? this.genJavaScript(s.role) : '"agent"');
          return `{ name: "${s.name}", role: ${role} }`;
        }).join(', ');
        return `const pipeline = new SwarmPipeline([${steps}]);\nawait pipeline.run();`;
      }
      case 'BirthStatement': {
        const config = this.genJavaScript(node.config);
        return `await std.birth(${config})`;
      }
      case 'SwarmScaleStatement': {
        const config = this.genJavaScript(node.config);
        return `await std.swarmScale(${config})`;
      }
      case 'ShareStatement': {
        const config = this.genJavaScript(node.config);
        return `await std.writeSharedState(${config})`;
      }
      case 'NeuralLayer':
        return `/* Neural Layer: 86B neurons activated */`;
      case 'AgentDefinition': {
        const fields = Object.entries(node.fields).map(([k, v]) => {
          return `${k}: ${this.genJavaScript(v)}`;
        }).join(', ');
        return `{ ${fields} }`;
      }
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
          if (typeof std !== 'undefined') await std.checkLoopSecurity();
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
        const prompt = this.genJavaScript(node.prompt);
        const config = node.config || {};
        const configEntries = Object.entries(config).map(([k, v]) => {
          return `${k}: ${this.genJavaScript(v)}`;
        }).join(', ');
        
        return `await std.think(${prompt}, { ${configEntries} })`;
      }
      case 'InvokeStatement': {
        return `await std.invoke(${this.genJavaScript(node.tool)});`;
      }
      case 'RetrieveStatement': {
        const source = node.source || 'vault';
        const query = node.query ? this.genJavaScript(node.query) : (node.vault ? this.genJavaScript(node.vault) : '"query"');
        return `await std.retrieve(${query}, { source: "${source}" })`;
      }
      case 'BudgetStatement': {
        const tokens = node.tokens || 10000;
        const timeStr = node.time || '30s';
        const seconds = parseInt(timeStr) || 30;
        return `
// Budget enforcement
std._budget = {
        maxTokens: ${tokens},
          maxMs: ${seconds * 1000},
            startTime: Date.now(),
              usedTokens: 0
};
console.log('[BUDGET] Set: ${tokens} tokens, ${timeStr}');`;
      }
      case 'RememberStatement': {
        const key = this.genJavaScript(node.key);
        const configEntries = Object.entries(node.config).map(([k, v]) => {
          return `${k}: ${this.genJavaScript(v)}`;
        }).join(', ');
        
        return `await std.remember(${key}, { ${configEntries} });`;
      }
      case 'CommonsStatement': {
        const name = node.name ? this.genJavaScript(node.name) : 'null';
        const configEntries = Object.entries(node.config || {}).map(([k, v]) => {
          return `${k}: ${this.genJavaScript(v)}`;
        }).join(', ');
        return `await std.commons(${name}, { ${configEntries} })`;
      }
      case 'PublicFacingStatement': {
        const name = node.name ? this.genJavaScript(node.name) : 'null';
        const configEntries = Object.entries(node.config || {}).map(([k, v]) => {
          return `${k}: ${this.genJavaScript(v)}`;
        }).join(', ');
        return `await std.public_facing(${name}, { ${configEntries} })`;
      }
      case 'WebIngestStatement': {
        const configEntries = Object.entries(node.config || {}).map(([k, v]) => {
          return `${k}: ${this.genJavaScript(v)}`;
        }).join(', ');
        return `await std.web_ingest({ ${configEntries} })`;
      }
      case 'SovereignStatement': {
        const configEntries = Object.entries(node.config || {}).map(([k, v]) => {
          return `${k}: ${this.genJavaScript(v)}`;
        }).join(', ');
        return `await std.sovereign({ ${configEntries} })`;
      }
      case 'WalrusStatement': {
        const configEntries = Object.entries(node.config || {}).map(([k, v]) => {
          return `${k}: ${this.genJavaScript(v)}`;
        }).join(', ');
        return `await std.walrus({ ${configEntries} })`;
      }
      case 'MintStatement': {
        const configEntries = Object.entries(node.config || {}).map(([k, v]) => {
          return `${k}: ${this.genJavaScript(v)}`;
        }).join(', ');
        return `await std.mint({ ${configEntries} })`;
      }
      case 'ReceiptStatement': {
        const configEntries = Object.entries(node.config || {}).map(([k, v]) => {
          return `${k}: ${this.genJavaScript(v)}`;
        }).join(', ');
        return `await std.receipt({ ${configEntries} })`;
      }
      case 'SealStatement': {
        const configEntries = Object.entries(node.config || {}).map(([k, v]) => {
          return `${k}: ${this.genJavaScript(v)}`;
        }).join(', ');
        return `await std.seal_statement({ ${configEntries} })`;
      }
      case 'ObserveStatement': {
        const event = this.genJavaScript(node.event);
        return `std.observe(${event})`;
      }
      case 'EvolveStatement': {
        const soul = node.config?.soul
          ? this.genJavaScript(node.config.soul)
            : '"unknown"';
        const rank = node.config?.rank
          ? this.genJavaScript(node.config.rank)
            : '1';
        return `await std.evolve({
        soul: ${soul},
          rank: ${rank},
            onChain: false
});`;
      }
      case 'EthicsStatement': {
        const rules = node.rules || [];
        const rulesJson = JSON.stringify(
          rules.map(r => {
            let value = r.value;
            if (typeof value === 'object' && value !== null) {
              if (value.type === 'String') value = value.value;
              else if (value.type === 'Number') value = value.value;
              else if (value.type === 'Boolean') value = value.value;
              else value = this.genJavaScript(value);
            }
            return { rule: r.rule, value };
          })
        );
        return `await std.ethics(${rulesJson})`;
      }
      case 'HeartbeatStatement': {
        const every = node.config?.every
          ? this.genJavaScript(node.config.every)
          : '"60s"';
        const check = node.config?.check
          ? this.genJavaScript(node.config.check)
          : '"any updates?"';
        const ms = every.includes('s')
          ? parseInt(every) * 1000 || 60000
          : parseInt(every) || 60000;
        return `await std.heartbeat({
  every: ${ms},
  check: ${check}
})`;
      }
      case 'PermissionStatement': {
        const rules = (node.rules || []).map(r => {
          const val = typeof r.value === 'object' ? this.genJavaScript(r.value) : `"${r.value}"`;
          return `  ${r.action}: ${val}`;
        });
        return `std._permissions = {\n${rules.join(',\n')}\n};\nconsole.log('[PERMISSION] Matrix loaded:', Object.keys(std._permissions).length, 'rules');`;
      }
      case 'FilesystemBlock': {
        const entries = Object.entries(node.policies).map(([k, v]) => {
          return `${k}: ${this.genJavaScript(v)}`;
        }).join(', ');
        return `await std.setFilesystemPolicies({ ${entries} });`;
      }
      case 'MCPStatement': {
        const entries = Object.entries(node.config || {}).map(([k, v]) =>
          `  ${k}: ${this.genJavaScript(v)}`
        );
        return `await std.mcp({\n${entries.join(',\n')}\n});`;
      }
      case 'TeamStatement': {
        const name = node.name || 'team';
        const roles = Object.entries(node.roles || {}).map(([k, v]) =>
          `  ${k}: ${this.genJavaScript(v)}`
        );
        const coord = typeof node.coordination === 'string'
          ? node.coordination
          : this.genJavaScript(node.coordination);
        return `const ${name.replace(/[^a-zA-Z0-9_]/g, '_')} = await std.team({\n  name: "${name}",\n  coordination: ${typeof coord === 'string' && !coord.startsWith('"') ? `"${coord}"` : coord},\n  roles: {\n  ${roles.join(',\n  ')}\n  }\n});`;
      }
      case 'EditStatement': {
        const file = this.genJavaScript(node.file);
        const replace = node.config?.replace ? this.genJavaScript(node.config.replace) : '""';
        const withStr = node.config?.with ? this.genJavaScript(node.config.with) : '""';
        return `await std.editFile(${file}, ${replace}, ${withStr});`;
      }
      case 'BridgeStatement': {
        const name = node.name || 'bridge';
        const varName = name.replace(/[^a-zA-Z0-9_]/g, '_');
        const entries = Object.entries(node.config || {}).map(([k, v]) =>
          `  ${k}: ${this.genJavaScript(v)}`
        );
        return `const ${varName} = await std.bridge({\n  name: "${name}",\n${entries.join(',\n')}\n});`;
      }
      case 'SessionStatement': {
        const action = node.config?.action
          ? this.genJavaScript(node.config.action)
          : '"create"';
        const name = node.name ? `"${node.name}"` : 'null';
        const entries = Object.entries(node.config || {})
          .filter(([k]) => k !== 'action')
          .map(([k, v]) => `  ${k}: ${this.genJavaScript(v)}`);
        return `await std.session(${action}, ${name}, {\n${entries.join(',\n')}\n});`;
      }
      case 'PolicyStatement': {
        const name = node.name ? `"${node.name}"` : '"default"';
        const entries = Object.entries(node.config || {}).map(([k, v]) =>
          `  ${k}: ${this.genJavaScript(v)}`
        );
        return `std._policy = std._policy || {};\nObject.assign(std._policy, {\n  name: ${name},\n${entries.join(',\n')}\n});\nconsole.log('[POLICY] Loaded:', ${name});`;
      }
      case 'AnalyticsStatement': {
        const name = node.name || 'default';
        const varName = name.replace(/[^a-zA-Z0-9_]/g, '_');
        const entries = Object.entries(node.config || {}).map(([k, v]) =>
          `  ${k}: ${this.genJavaScript(v)}`
        );
        return `const ${varName}_analytics = await std.analytics({\n  name: "${name}",\n${entries.join(',\n')}\n});`;
      }
      case 'CoordinateStatement': {
        const task = node.task ? this.genJavaScript({ type: 'String', value: node.task }) : '"task"';
        const entries = Object.entries(node.config || {}).map(([k, v]) =>
          `  ${k}: ${this.genJavaScript(v)}`
        );
        return `await std.coordinate(${task}, {\n${entries.join(',\n')}\n});`;
      }
      case 'WitnessStatement': {
        const entries = Object.entries(node.config || {}).map(([k, v]) =>
          `  ${k}: ${this.genJavaScript(v)}`
        );
        return `const __witness = await std.witness({\n${entries.join(',\n')}\n});`;
      }
      case 'PilotStatement': {
        const entries = Object.entries(node.config || {}).map(([k, v]) =>
          `  ${k}: ${this.genJavaScript(v)}`
        );
        return `const __pilot = await std.pilot({\n${entries.join(',\n')}\n});`;
      }
      case 'ViewportStatement': {
        const entries = Object.entries(node.config || {}).map(([k, v]) =>
          `  ${k}: ${this.genJavaScript(v)}`
        );
        return `const __viewport = await std.viewport({\n${entries.join(',\n')}\n});`;
      }
      case 'GestaltStatement': {
        const tasks = (node.concurrent || []).map(c =>
          `  { action: ${JSON.stringify(c.action)}, value: ${this.genJavaScript(c.value)} }`
        );
        const merge = typeof node.merge === 'object' ? this.genJavaScript(node.merge) : `"${node.merge}"`;
        return `const __gestalt = await std.gestalt([\n${tasks.join(',\n')}\n], ${merge});`;
      }
      case 'TokenStatement': {
        const name = node.name ? `"${node.name}"` : '"unnamed"';
        const entries = Object.entries(node.config || {}).map(([k, v]) =>
          `  ${k}: ${this.genJavaScript(v)}`
        );
        return `const __token_${(node.name || 'def').replace(/[^a-zA-Z0-9]/g, '_')} = await std.toc.defineToken(${name}, {\n${entries.join(',\n')}\n});`;
      }
      case 'WalletStatement': {
        const name = node.name ? `"${node.name}"` : '"agent"';
        const entries = Object.entries(node.config || {}).map(([k, v]) =>
          `  ${k}: ${this.genJavaScript(v)}`
        );
        return `const __wallet = await std.toc.createWallet(${name}, {\n${entries.join(',\n')}\n});`;
      }
      case 'StakeStatement': {
        const entries = Object.entries(node.config || {}).map(([k, v]) =>
          `  ${k}: ${this.genJavaScript(v)}`
        );
        return `await std.toc.stake({\n${entries.join(',\n')}\n});`;
      }
      case 'SlashStatement': {
        const entries = Object.entries(node.config || {}).map(([k, v]) =>
          `  ${k}: ${this.genJavaScript(v)}`
        );
        return `await std.toc.slash({\n${entries.join(',\n')}\n});`;
      }
      case 'ConvertStatement': {
        const entries = Object.entries(node.config || {}).map(([k, v]) =>
          `  ${k}: ${this.genJavaScript(v)}`
        );
        return `await std.toc.convert({\n${entries.join(',\n')}\n});`;
      }
      case 'RoyaltyStatement': {
        const entries = Object.entries(node.config || {}).map(([k, v]) =>
          `  ${k}: ${this.genJavaScript(v)}`
        );
        return `await std.toc.royalty({\n${entries.join(',\n')}\n});`;
      }
      case 'EscrowStatement': {
        const name = node.name ? `"${node.name}"` : '"job"';
        const entries = Object.entries(node.config || {}).map(([k, v]) =>
          `  ${k}: ${this.genJavaScript(v)}`
        );
        return `const __escrow = await std.toc.escrow(${name}, {\n${entries.join(',\n')}\n});`;
      }
      case 'WitnessStatement': {
        const entries = Object.entries(node.config || {}).map(([k, v]) =>
          `  ${k}: ${this.genJavaScript(v)}`
        );
        return `await std.witness({\n${entries.join(',\n')}\n});`;
      }
      case 'PilotStatement': {
        const entries = Object.entries(node.config || {}).map(([k, v]) =>
          `  ${k}: ${this.genJavaScript(v)}`
        );
        return `await std.pilot({\n${entries.join(',\n')}\n});`;
      }
      case 'ViewportStatement': {
        const entries = Object.entries(node.config || {}).map(([k, v]) =>
          `  ${k}: ${this.genJavaScript(v)}`
        );
        return `await std.viewport({\n${entries.join(',\n')}\n});`;
      }
      case 'GestaltStatement': {
        const tasks = (node.concurrent || []).map(c =>
          `  std.${c.action}(${this.genJavaScript(c.value)})`
        );
        const mergeStr = typeof node.merge === 'string'
          ? `"${node.merge}"`
          : this.genJavaScript(node.merge);
        return `await std.gestalt([\n${tasks.join(',\n')}\n], { merge: ${mergeStr} });`;
      }
      default: return `/* Unhandled: ${node.type} */`;
    }
  }

  indentCode(code, spaces) {
    const indent = ' '.repeat(spaces);
    return code.split('\n').map(line => (line ? indent + line : line)).join('\n');
  }
}

export { Compiler };
