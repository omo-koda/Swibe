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
import { genRaku } from './backends/raku.js';

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
    this.ast = parser.parse();
    await this.processPrompts(this.ast);
    const code = this.generateCode(this.ast);
    return code;
  }

  async processPrompts(node, depth = 0) {
    if (!node || depth > 5) return;
    if (node.type === 'Prompt' || node.type === 'Voice') {
      let promptText = node.type === 'Prompt' ? node.text : node.text.match(/voice:\s*"([^"]*)"/)?.[1];
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
      default: return this.genJavaScript(node);
    }
  }

  genJavaScript(node) {
    if (!node) return '';
    switch (node.type) {
      case 'Program':
        return node.statements.map(s => {
          const code = this.genJavaScript(s);
          return code.endsWith(';') || code.endsWith('}') ? code : code + ';';
        }).join('\n\n');
      case 'FunctionDecl':
        return `async function ${node.name}(${node.params.map(p => p.name).join(', ')}) ${this.genJavaScript(node.body)}`;
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
        return `await ${node.name}(${node.args.map(a => this.genJavaScript(a)).join(', ')})`;
      case 'Call':
        return `await ${this.genJavaScript(node.callee)}(${node.args.map(a => this.genJavaScript(a)).join(', ')})`;
      case 'MethodCall':
        return `await ${this.genJavaScript(node.object)}.${node.method}(${node.args.map(a => this.genJavaScript(a)).join(', ')})`;
      case 'FieldAccess':
        return `${this.genJavaScript(node.object)}.${node.field}`;
      case 'If':
        let ifCode = `if (${this.genJavaScript(node.condition)}) ${this.genJavaScript(node.thenBranch)}`;
        if (node.elseBranch) {
          ifCode += ` else ${this.genJavaScript(node.elseBranch)}`;
        }
        return ifCode;
      case 'SkillDecl':
        return `const ${node.name} = {\n  actions: async function() {\n${node.body.map(s => '    ' + this.genJavaScript(s)).join(';\n')}\n  }\n};`;
      case 'SecureBlock':
        return `await sandbox_run(async () => ${this.genJavaScript(node.body)})`;
      case 'MetaDigital':
        const metaConfig = { ...node.config };
        // Convert AST nodes in config to JS values/code if needed
        return `const ${node.name.replace(/\s+/g, '_')} = new MetaDigital({ name: "${node.name}", ethics: ${this.genJavaScript(node.config.ethics)}, output: ${this.genJavaScript(node.config.output)} });\nawait ${node.name.replace(/\s+/g, '_')}.run();`;
      case 'Number': return String(node.value);
      case 'String': return `"${node.value.replace(/"/g, '\\"').replace(/\n/g, '\\n')}"`;
      case 'Identifier': return node.name;
      case 'Boolean': return String(node.value);
      case 'Nil': return 'null';
      case 'BinaryOp':
        return `(${this.genJavaScript(node.left)} ${node.op} ${this.genJavaScript(node.right)})`;
      case 'SwarmStatement':
        // Elixir is the default target for swarm{} blocks at v0.6
        return `/* SWARM-TARGET: ELIXIR */\n${genElixir(node, "")}`;
      case 'NeuralLayer':
        return `/* Neural Layer: 86B neurons activated */`;
      case 'ArrayLiteral':
        return `[${node.elements.map(e => this.genJavaScript(e)).join(', ')}]`;
      case 'DictLiteral':
        return `{ ${Object.entries(node.fields).map(([k, v]) => `${k}: ${this.genJavaScript(v)}`).join(', ')} }`;
      default: return `/* Unhandled: ${node.type} */`;
    }
  }

  indentCode(code, spaces) {
    const indent = ' '.repeat(spaces);
    return code.split('\n').map(line => (line ? indent + line : line)).join('\n');
  }
}

export { Compiler };
