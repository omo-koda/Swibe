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

class Compiler {
  constructor(source, targetLanguage = 'javascript') {
    this.source = source;
    this.targetLanguage = targetLanguage;
    this.llm = new LLMIntegration();
    this.ast = null;
  }

  async compile() {
    // Tokenize
    const lexer = new Lexer(this.source);
    const tokens = lexer.tokenize();

    // Parse
    const parser = new Parser(tokens);
    this.ast = parser.parse();

    // Process prompts with LLM
    await this.processPrompts(this.ast);

    // Generate code for target language
    const code = this.generateCode(this.ast);

    return code;
  }

  async processPrompts(node, depth = 0) {
    if (!node || depth > 5) return;

    if (node.type === 'Prompt') {
      // Generate code from prompt
      const generated = await this.llm.generateCode(node.text, {
        targetLanguage: this.targetLanguage,
      });
      // Parse and replace with generated AST
      const lexer = new Lexer(generated);
      const tokens = lexer.tokenize();
      const parser = new Parser(tokens);
      const generatedAst = parser.parse();
      
      // If it's a single expression/statement, we might want to just take that
      if (generatedAst.type === 'Program' && generatedAst.statements.length === 1) {
        const statement = generatedAst.statements[0];
        for (const key in node) delete node[key];
        Object.assign(node, statement);
      } else {
        for (const key in node) delete node[key];
        Object.assign(node, generatedAst);
      }
      
      // Recurse on the newly generated node to handle prompts in the generated code
      await this.processPrompts(node, depth + 1);
      return;
    }

    if (node.type === 'Voice') {
      // Extract command from voice format
      const commandMatch = node.text.match(/voice:\s*"([^"]*)"/);
      if (commandMatch) {
        const command = commandMatch[1];
        const generated = await this.llm.generateCode(command, {
          targetLanguage: this.targetLanguage,
        });
        const lexer = new Lexer(generated);
        const tokens = lexer.tokenize();
        const parser = new Parser(tokens);
        const generatedAst = parser.parse();
        
        if (generatedAst.type === 'Program' && generatedAst.statements.length === 1) {
          const statement = generatedAst.statements[0];
          for (const key in node) delete node[key];
          Object.assign(node, statement);
        } else {
          for (const key in node) delete node[key];
          Object.assign(node, generatedAst);
        }
        
        // Recurse on the newly generated node
        await this.processPrompts(node, depth + 1);
      }
      return;
    }

    // Recursively process child nodes
    for (const key in node) {
      if (key === 'type') continue;
      if (Array.isArray(node[key])) {
        for (const item of node[key]) {
          await this.processPrompts(item, depth);
        }
      } else if (typeof node[key] === 'object' && node[key] !== null) {
        await this.processPrompts(node[key], depth);
      }
    }
  }

  generateCode(node) {
    switch (this.targetLanguage) {
      case 'javascript':
        return this.genJavaScript(node);
      case 'python':
        return this.genPython(node);
      case 'rust':
        return this.genRust(node);
      case 'go':
        return this.genGo(node);
      case 'wolfram':
        return this.genWolfram(node);
      case 'elixir':
        return genElixir(node);
      case 'pony':
        return genPony(node);
      case 'mojo':
        return genMojo(node);
      case 'aether':
        return genAether(node);
      case 'lua':
        return genLua(node);
      case 'zig':
        return genZig(node);
      case 'julia':
        return genJulia(node);
      case 'agent-skills':
        return this.genAgentSkillsFormat(node);
      default:
        return this.genJavaScript(node);
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
        return this.genJSFunction(node);

      case 'StructDecl':
        return this.genJSStruct(node);

      case 'EnumDecl':
        return this.genJSEnum(node);

      case 'VariableDecl':
        return `${node.isMut ? 'let' : 'const'} ${node.name} = ${this.genJavaScript(node.value)};`;

      case 'Return':
        return `return ${this.genJavaScript(node.value)};`;

      case 'Break':
        return 'break;';

      case 'Block':
        return (
          '{\n' + node.statements.map(s => {
            const code = this.genJavaScript(s);
            const term = code.endsWith(';') || code.endsWith('}') ? '' : ';';
            return '  ' + code + term;
          }).join('\n') + '\n}'
        );

      case 'If':
        return (
          `if (${this.genJavaScript(node.condition)}) ${this.genJavaScript(node.thenBranch)}` +
          (node.elseBranch ? ` else ${this.genJavaScript(node.elseBranch)}` : '')
        );

      case 'Match':
        return this.genJSMatch(node);

      case 'SwarmStatement':
        return this.genJSSwarm(node);

      case 'AppDecl':
        return this.genJSApp(node);

      case 'MetaDigital':
        return this.genJSMetaDigital(node);

      case 'SkillDecl':
        return this.genJSSkill(node);

      case 'SecureBlock':
        return this.genJSSecure(node);

      case 'LoopUntil':
        return this.genJSLoopUntil(node);

      case 'CallToolStatement':
        return this.genJSCallTool(node);

      case 'AgentDefinition':
        return this.genJSAgent(node);

      case 'FunctionCall':
        return `(await ${node.name}(${node.args.map(a => this.genJavaScript(a)).join(', ')}))`;

      case 'MethodCall':
        return `(await ${this.genJavaScript(node.object)}.${node.method}(${node.args.map(a => this.genJavaScript(a)).join(', ')}))`;

      case 'FieldAccess':
        return `${this.genJavaScript(node.object)}.${node.field}`;

      case 'Index':
        return `${this.genJavaScript(node.object)}[${this.genJavaScript(node.index)}]`;

      case 'BinaryOp':
        return `${this.genJavaScript(node.left)} ${node.op} ${this.genJavaScript(node.right)}`;

      case 'UnaryOp':
        return `${node.op}${this.genJavaScript(node.expr)}`;

      case 'Pipeline':
        return `${this.genJavaScript(node.left)} |> ${this.genJavaScript(node.right)}`;

      case 'Number':
        return String(node.value);

      case 'String':
        return `"${node.value.replace(/\n/g, '\\n').replace(/"/g, '\\"')}"`;

      case 'Boolean':
        return String(node.value);

      case 'Nil':
        return 'null';

      case 'Identifier':
        return node.name;

      case 'ArrayLiteral':
        return `[${node.elements.map(e => this.genJavaScript(e)).join(', ')}]`;

      case 'StructLiteral':
      case 'DictLiteral':
        return `{ ${Object.entries(node.fields).map(([k, v]) => `${k}: ${this.genJavaScript(v)}`).join(', ')} }`;

      case 'Prompt':
        return `/* Generated from prompt: ${node.text} */`;

      case 'Voice':
        return `/* Generated from voice: ${node.text} */`;

      default:
        return '';
    }
  }

  genJSFunction(node) {
    const params = node.params.map(p => p.name).join(', ');
    return `async function ${node.name}(${params}) ${this.genJavaScript(node.body)}`;
  }

  genJSStruct(node) {
    return (
      `class ${node.name} {\n` +
      `  constructor(${node.fields.map(f => f.name).join(', ')}) {\n` +
      node.fields.map(f => `    this.${f.name} = ${f.name};`).join('\n') +
      '\n  }\n}\n'
    );
  }

  genJSEnum(node) {
    return `const ${node.name} = { ${node.variants.map(v => `${v}: '${v}'`).join(', ')} };`;
  }

  genJSMatch(node) {
    let code = `(() => { const __val = ${this.genJavaScript(node.expr)}; `;
    for (const arm of node.arms) {
      code += `if (__val === '${arm.pattern.name}') return ${this.genJavaScript(arm.body)}; `;
    }
    code += `})()`;
    return code;
  }

  genJSSwarm(node) {
    let code = `const __swarm = new SwarmPipeline([\n`;
    for (const step of node.steps) {
      code += `  { name: "${step.name}", role: ${this.genJavaScript(step.role)} },\n`;
    }
    code += `]);\n(await __swarm.run(typeof __APP_CONFIG !== 'undefined' ? __APP_CONFIG : undefined));\n`;
    return code;
  }

  genJSApp(node) {
    let code = `const __APP_CONFIG = {\n`;
    // We assume keys are simple identifiers
    for (const key in node.config) {
      code += `  ${key}: ${this.genJavaScript(node.config[key])},\n`;
    }
    code += `};\n`;
    code += `(await deploy_app(__APP_CONFIG));\n`;
    return code;
  }

  genJSMetaDigital(node) {
    let code = `const ${node.name.replace(/[^a-zA-Z0-9_]/g, '_')} = new MetaDigital({\n`;
    code += `  name: "${node.name}",\n`;
    for (const key in node.config) {
      if (key === 'chain') {
        code += `  ${key}: [${node.config[key].join(', ')}],\n`;
      } else {
        code += `  ${key}: ${this.genJavaScript(node.config[key])},\n`;
      }
    }
    code += `});\n`;
    return code;
  }

  genJSSkill(node) {
    let code = `const ${node.name} = {\n`;
    code += `  type: "skill",\n`;
    code += `  actions: async () => {\n`;
    for (const item of node.body) {
      if (item.type === 'SkillProperty') {
        code += `    this.${item.name} = ${this.genJavaScript(item.value)};\n`;
      } else {
        code += `    ${this.genJavaScript(item)}\n`;
      }
    }
    code += `  }\n};\n`;
    return code;
  }

  genJSSecure(node) {
    return `await sandbox_run(async () => {\n${this.indentCode(this.genJavaScript(node.body), 2)}\n});`;
  }

  genJSLoopUntil(node) {
    return `while (true) {\n  (await trace("Loop iteration started", { goal: ${this.genJavaScript(node.goal)} }));\n  const __goal = ${this.genJavaScript(node.goal)};\n  if (await checkGoal(__goal)) break;\n  ${this.indentCode(this.genJavaScript(node.body), 2)}\n}`;
  }

  genJSCallTool(node) {
    return `await mcp.call_tool("${node.name}", ${this.genJavaScript(node.args)});`;
  }

  genJSAgent(node) {
    let code = `new Agent({\n`;
    for (const [key, value] of Object.entries(node.fields)) {
      code += `  ${key}: ${this.genJavaScript(value)},\n`;
    }
    code += `})`;
    return code;
  }

  genAgentSkillsFormat(node) {
    if (node.type === 'SkillDecl') {
      const instructions = node.body
        .filter(item => item.type === 'SkillProperty' && item.name === 'prompt')
        .map(item => this.genJavaScript(item.value))[0] || "";
      const tools = node.body
        .filter(item => item.type === 'SkillProperty' && item.name === 'tools')
        .flatMap(item => item.value.elements ? item.value.elements.map(e => e.value) : []) || [];
        
      return JSON.stringify({
        version: "2026.1",
        name: node.name,
        type: "skill",
        instructions,
        tools,
        resources: []
      }, null, 2);
    }
    
    if (node.type === 'SwarmStatement') {
      return JSON.stringify({
        version: "2026.1",
        type: "swarm",
        agents: node.steps.map(s => s.name),
        pipeline: node.steps.map(s => s.name).join(" => "),
        memory: "rag.last_iteration"
      }, null, 2);
    }

    if (node.type === 'LoopUntil') {
      return JSON.stringify({
        version: "2026.1",
        type: "loop",
        until: this.genJavaScript(node.goal),
        trace: true
      }, null, 2);
    }

    if (node.type === 'Program') {
      return node.statements.map(s => this.genAgentSkillsFormat(s)).filter(s => s !== "").join('\n---\n');
    }

    return '';
  }

  genPython(node) {
    if (!node) return '';

    switch (node.type) {
      case 'Program':
        return node.statements.map(s => this.genPython(s)).join('\n\n');

      case 'FunctionDecl':
        return (
          `def ${node.name}(${node.params.map(p => p.name).join(', ')}):\n` +
          this.indentCode(this.genPython(node.body), 2)
        );

      case 'Block':
        return node.statements.map(s => this.genPython(s)).join('\n');

      case 'VariableDecl':
        return `${node.name} = ${this.genPython(node.value)}`;

      case 'Return':
        return `return ${this.genPython(node.value)}`;

      case 'FunctionCall':
        return `${node.name}(${node.args.map(a => this.genPython(a)).join(', ')})`;

      case 'Number':
        return String(node.value);

      case 'String':
        return `"${node.value.replace(/\n/g, '\\n').replace(/"/g, '\\"')}"`;

      case 'Boolean':
        return node.value ? 'True' : 'False';

      case 'Nil':
        return 'None';

      case 'Identifier':
        return node.name;

      case 'ArrayLiteral':
        return `[${node.elements.map(e => this.genPython(e)).join(', ')}]`;

      default:
        return '';
    }
  }

  genRust(node) {
    if (!node) return '';

    switch (node.type) {
      case 'Program':
        return node.statements.map(s => this.genRust(s)).join('\n\n');

      case 'FunctionDecl':
        return (
          `fn ${node.name}(${node.params.map(p => `${p.name}: ${this.typeToRust(p.type)}`).join(', ')})` +
          (node.returnType ? ` -> ${this.typeToRust(node.returnType)}` : '') +
          ` ${this.genRust(node.body)}`
        );

      case 'VariableDecl':
        return `${node.isMut ? 'let mut' : 'let'} ${node.name} = ${this.genRust(node.value)};`;

      case 'Return':
        return `${this.genRust(node.value)}`;

      case 'Block':
        return (
          '{\n' + node.statements.map(s => '  ' + this.genRust(s)).join('\n') + '\n}'
        );

      case 'Number':
        return String(node.value);

      case 'String':
        return `"${node.value}".to_string()`;

      case 'Identifier':
        return node.name;

      default:
        return '';
    }
  }

  genGo(node) {
    if (!node) return '';

    switch (node.type) {
      case 'Program':
        return 'package main\n\nimport "fmt"\n\n' + node.statements.map(s => this.genGo(s)).join('\n\n');

      case 'FunctionDecl':
        const isMain = node.name === 'main';
        const returnType = node.returnType ? ` ${this.typeToGo(node.returnType)}` : '';
        return (
          `func ${node.name}(${node.params.map(p => `${p.name} ${this.typeToGo(p.type)}`).join(', ')})${returnType} ${this.genGo(node.body)}`
        );

      case 'VariableDecl':
        return `${node.name} := ${this.genGo(node.value)}`;

      case 'Block':
        return (
          '{\n' + node.statements.map(s => '  ' + this.genGo(s)).join('\n') + '\n}'
        );

      case 'Return':
        return `return ${this.genGo(node.value)}`;

      case 'FunctionCall':
        if (node.name === 'print') {
          return `fmt.Println(${node.args.map(a => this.genGo(a)).join(', ')})`;
        }
        return `${node.name}(${node.args.map(a => this.genGo(a)).join(', ')})`;

      case 'Number':
        return String(node.value);

      case 'String':
        return `"${node.value.replace(/\n/g, '\\n').replace(/"/g, '\\"')}"`;

      case 'Boolean':
        return String(node.value);

      case 'Identifier':
        return node.name;

      case 'BinaryOp':
        return `${this.genGo(node.left)} ${node.op} ${this.genGo(node.right)}`;

      default:
        return '';
    }
  }

  genJulia(node) {
    if (!node) return '';

    switch (node.type) {
      case 'Program':
        return node.statements.map(s => this.genJulia(s)).join('\n\n');

      case 'FunctionDecl':
        return (
          `function ${node.name}(${node.params.map(p => `${p.name}::${this.typeToJulia(p.type)}`).join(', ')})\n` +
          this.indentCode(this.genJulia(node.body), 2) +
          '\nend'
        );

      case 'VariableDecl':
        return `${node.name} = ${this.genJulia(node.value)}`;

      case 'Block':
        return node.statements.map(s => this.genJulia(s)).join('\n');

      case 'Return':
        return `return ${this.genJulia(node.value)}`;

      case 'FunctionCall':
        return `${node.name}(${node.args.map(a => this.genJulia(a)).join(', ')})`;

      case 'Number':
        return String(node.value);

      case 'String':
        return `"${node.value.replace(/\n/g, '\\n').replace(/"/g, '\\"')}"`;

      case 'Boolean':
        return String(node.value);

      case 'Identifier':
        return node.name;

      case 'ArrayLiteral':
        return `[${node.elements.map(e => this.genJulia(e)).join(', ')}]`;

      case 'BinaryOp':
        return `${this.genJulia(node.left)} ${node.op} ${this.genJulia(node.right)}`;

      default:
        return '';
    }
  }

  genIdris(node) {
    if (!node) return '';

    switch (node.type) {
      case 'Program':
        return node.statements.map(s => this.genIdris(s)).join('\n\n');

      case 'FunctionDecl':
        const params = node.params.map(p => `(${p.name} : ${this.typeToIdris(p.type)})`).join(' ');
        const returnType = node.returnType ? ` -> ${this.typeToIdris(node.returnType)}` : '';
        return (
          `${node.name} : ${params}${returnType}\n` +
          `${node.name} ${node.params.map(p => p.name).join(' ')} = ${this.genIdris(node.body)}`
        );

      case 'VariableDecl':
        return `let ${node.name} = ${this.genIdris(node.value)}`;

      case 'Block':
        return node.statements.map(s => this.genIdris(s)).join('\n');

      case 'Return':
        return this.genIdris(node.value);

      case 'FunctionCall':
        return `${node.name} ${node.args.map(a => this.genIdris(a)).join(' ')}`;

      case 'Number':
        return String(node.value);

      case 'String':
        return `"${node.value.replace(/\n/g, '\\n').replace(/"/g, '\\"')}"`;

      case 'Boolean':
        return String(node.value);

      case 'Identifier':
        return node.name;

      case 'BinaryOp':
        return `(${this.genIdris(node.left)} ${node.op} ${this.genIdris(node.right)})`;

      default:
        return '';
    }
  }

  genMove(node) {
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
        code += node.statements.map(s => '  ' + this.genMove(s)).filter(s => s.trim() !== '').join('\n\n');
        code += '\n}';
        return code;

      case 'FunctionDecl':
        const returnType = node.returnType ? `: ${this.typeToMove(node.returnType)}` : '';
        return (
          `fun ${node.name}(${node.params.map(p => `${p.name}: ${this.typeToMove(p.type)}`).join(', ')})${returnType} ${this.genMove(node.body)}`
        );

      case 'VariableDecl':
        return `let ${node.isMut ? 'mut ' : ''}${node.name} = ${this.genMove(node.value)};`;

      case 'Block':
        return (
          '{\n' + node.statements.map(s => '  ' + this.genMove(s)).join('\n') + '\n}'
        );

      case 'Return':
        return `${this.genMove(node.value)}`;

      case 'FunctionCall':
        return `${node.name}(${node.args.map(a => this.genMove(a)).join(', ')})`;

      case 'StructDecl':
        return (
          `struct ${node.name} {\n` +
          node.fields.map(f => `  ${f.name}: ${this.typeToMove(f.type)},`).join('\n') +
          '\n}'
        );

      case 'Number':
        return String(node.value);

      case 'String':
        return `b"${node.value}"`;

      case 'Boolean':
        return String(node.value);

      case 'Identifier':
        return node.name;

      case 'SwarmStatement':
        return this.genMoveSwarm(node);

      case 'SkillDecl':
        return this.genMoveSkill(node);

      case 'CallToolStatement':
        return this.genMoveCallTool(node);

      case 'BinaryOp':
        return `${this.genMove(node.left)} ${node.op} ${this.genMove(node.right)}`;

      default:
        return '';
    }
  }

  genMoveSwarm(node) {
    let code = `public entry fun swarm_execute(ctx: &mut TxContext) {\n`;
    code += `    let iter = 1;\n`;
    for (const step of node.steps) {
      code += `    // Step: ${step.name}\n`;
      let prompt = "I was here before the question";
      if (step.role.type === 'String') prompt = step.role.value;
      if (step.role.type === 'Identifier') prompt = `Acting as ${step.role.name}`;
      
      code += `    event::emit(BreathEvent {\n`;
      code += `      message: b"${prompt}",\n`;
      code += `      iteration: iter\n`;
      code += `    });\n`;
    }
    code += `  }\n`;
    return code;
  }

  genMoveSkill(node) {
    let code = `struct ${node.name} has copy, drop, store {\n`;
    code += `  // Skill: ${node.name}\n`;
    code += `}\n`;
    return code;
  }

  genMoveCallTool(node) {
    if (node.name === 'sui_rpc') {
      return `sui::execute_transaction_block(ctx, b"${JSON.stringify(node.args)}");`;
    }
    return `// Call tool: ${node.name}(${JSON.stringify(node.args)})`;
  }

  typeToGo(type) {
    if (typeof type === 'string') {
      const typeMap = {
        i32: 'int32',
        i64: 'int64',
        f32: 'float32',
        f64: 'float64',
        str: 'string',
        bool: 'bool'
      };
      return typeMap[type] || 'interface{}';
    }
    if (type.array) {
      return `[]${this.typeToGo(type.array)}`;
    }
    return 'interface{}';
  }

  typeToJulia(type) {
    if (typeof type === 'string') {
      const typeMap = {
        i32: 'Int32',
        i64: 'Int64',
        f32: 'Float32',
        f64: 'Float64',
        str: 'String',
        bool: 'Bool'
      };
      return typeMap[type] || 'Any';
    }
    if (type.array) {
      return `Vector{${this.typeToJulia(type.array)}}`;
    }
    return 'Any';
  }

  typeToIdris(type) {
    if (typeof type === 'string') {
      const typeMap = {
        i32: 'Int',
        i64: 'Integer',
        f32: 'Double',
        f64: 'Double',
        str: 'String',
        bool: 'Bool'
      };
      return typeMap[type] || 'Type';
    }
    if (type.array) {
      return `List (${this.typeToIdris(type.array)})`;
    }
    return 'Type';
  }

  typeToMove(type) {
    if (typeof type === 'string') {
      const typeMap = {
        i32: 'u64',
        i64: 'u64',
        f32: 'u64',
        f64: 'u64',
        str: 'vector<u8>',
        bool: 'bool'
      };
      return typeMap[type] || 'u64';
    }
    if (type.array) {
      return `vector<${this.typeToMove(type.array)}>`;
    }
    return 'u64';
  }

  genR(node) {
    if (!node) return '';

    switch (node.type) {
      case 'Program':
        return node.statements.map(s => this.genR(s)).join('\n\n');

      case 'FunctionDecl':
        return (
          `${node.name} <- function(${node.params.map(p => p.name).join(', ')}) {\n` +
          this.indentCode(this.genR(node.body), 2) +
          '\n}'
        );

      case 'VariableDecl':
        return `${node.name} <- ${this.genR(node.value)}`;

      case 'Block':
        return node.statements.map(s => this.genR(s)).join('\n');

      case 'Return':
        return this.genR(node.value);

      case 'FunctionCall':
        return `${node.name}(${node.args.map(a => this.genR(a)).join(', ')})`;

      case 'Number':
        return String(node.value);

      case 'String':
        return `"${node.value.replace(/\n/g, '\\n').replace(/"/g, '\\"')}"`;

      case 'Boolean':
        return String(node.value);

      case 'Identifier':
        return node.name;

      case 'ArrayLiteral':
        return `c(${node.elements.map(e => this.genR(e)).join(', ')})`;

      case 'BinaryOp':
        return `${this.genR(node.left)} ${node.op} ${this.genR(node.right)}`;

      default:
        return '';
    }
  }

  genProlog(node) {
    if (!node) return '';

    switch (node.type) {
      case 'Program':
        return node.statements.map(s => this.genProlog(s)).join('.\n') + '.';

      case 'FunctionDecl':
        const params = node.params.map(p => p.name.toUpperCase()).join(', ');
        return `${node.name}(${params}) :- ${this.genProlog(node.body)}`;

      case 'VariableDecl':
        return `${node.name.toUpperCase()} = ${this.genProlog(node.value)}`;

      case 'Block':
        return node.statements.map(s => this.genProlog(s)).join(', ');

      case 'FunctionCall':
        return `${node.name}(${node.args.map(a => this.genProlog(a)).join(', ')})`;

      case 'Number':
        return String(node.value);

      case 'String':
        return `'${node.value}'`;

      case 'Identifier':
        return node.name.charAt(0).toUpperCase() === node.name.charAt(0) ? node.name : node.name;

      case 'BinaryOp':
        return `(${this.genProlog(node.left)} ${node.op} ${this.genProlog(node.right)})`;

      default:
        return '';
    }
  }

  genLisp(node) {
    if (!node) return '';

    switch (node.type) {
      case 'Program':
        return node.statements.map(s => this.genLisp(s)).join('\n');

      case 'FunctionDecl':
        const params = node.params.map(p => p.name).join(' ');
        return `(defun ${node.name} (${params})\n  ${this.genLisp(node.body)}\n)`;

      case 'VariableDecl':
        return `(setq ${node.name} ${this.genLisp(node.value)})`;

      case 'Block':
        return `(progn\n  ${node.statements.map(s => this.genLisp(s)).join('\n  ')}\n)`;

      case 'FunctionCall':
        return `(${node.name} ${node.args.map(a => this.genLisp(a)).join(' ')})`;

      case 'Number':
        return String(node.value);

      case 'String':
        return `"${node.value.replace(/\n/g, '\\n').replace(/"/g, '\\"')}"`;

      case 'Boolean':
        return node.value ? 't' : 'nil';

      case 'Identifier':
        return node.name;

      case 'ArrayLiteral':
        return `'(${node.elements.map(e => this.genLisp(e)).join(' ')})`;

      case 'BinaryOp':
        return `(${node.op} ${this.genLisp(node.left)} ${this.genLisp(node.right)})`;

      default:
        return '';
    }
  }

  genHaskell(node) {
    if (!node) return '';

    switch (node.type) {
      case 'Program':
        return node.statements.map(s => this.genHaskell(s)).join('\n\n');

      case 'FunctionDecl':
        const params = node.params.map(p => p.name).join(' ');
        const returnType = node.returnType ? ` :: ${this.typeToHaskell(node.returnType)}` : '';
        return (
          `${node.name}${returnType}\n` +
          `${node.name} ${params} = ${this.genHaskell(node.body)}`
        );

      case 'VariableDecl':
        return `${node.name} = ${this.genHaskell(node.value)}`;

      case 'Block':
        return node.statements.map(s => this.genHaskell(s)).join('\n');

      case 'Return':
        return this.genHaskell(node.value);

      case 'FunctionCall':
        return `${node.name} ${node.args.map(a => this.genHaskell(a)).join(' ')}`;

      case 'Number':
        return String(node.value);

      case 'String':
        return `"${node.value.replace(/\n/g, '\\n').replace(/"/g, '\\"')}"`;

      case 'Boolean':
        return String(node.value);

      case 'Identifier':
        return node.name;

      case 'ArrayLiteral':
        return `[${node.elements.map(e => this.genHaskell(e)).join(', ')}]`;

      case 'BinaryOp':
        return `(${this.genHaskell(node.left)} ${node.op} ${this.genHaskell(node.right)})`;

      default:
        return '';
    }
  }

  genLua(node) {
    if (!node) return '';

    switch (node.type) {
      case 'Program':
        return node.statements.map(s => this.genLua(s)).join('\n\n');

      case 'FunctionDecl':
        return (
          `function ${node.name}(${node.params.map(p => p.name).join(', ')})\n` +
          this.indentCode(this.genLua(node.body), 2) +
          '\nend'
        );

      case 'VariableDecl':
        return `local ${node.name} = ${this.genLua(node.value)}`;

      case 'Block':
        return node.statements.map(s => this.genLua(s)).join('\n');

      case 'Return':
        return `return ${this.genLua(node.value)}`;

      case 'FunctionCall':
        return `${node.name}(${node.args.map(a => this.genLua(a)).join(', ')})`;

      case 'Number':
        return String(node.value);

      case 'String':
        return `"${node.value.replace(/\n/g, '\\n').replace(/"/g, '\\"')}"`;

      case 'Boolean':
        return String(node.value);

      case 'Identifier':
        return node.name;

      case 'ArrayLiteral':
        return `{${node.elements.map(e => this.genLua(e)).join(', ')}}`;

      case 'BinaryOp':
        return `${this.genLua(node.left)} ${node.op} ${this.genLua(node.right)}`;

      default:
        return '';
    }
  }

  genMatlab(node) {
    if (!node) return '';

    switch (node.type) {
      case 'Program':
        return node.statements.map(s => this.genMatlab(s)).join('\n\n');

      case 'FunctionDecl':
        return (
          `function ${this.typeToMatlab(node.returnType)} = ${node.name}(${node.params.map(p => p.name).join(', ')})\n` +
          this.indentCode(this.genMatlab(node.body), 4) +
          '\nend'
        );

      case 'VariableDecl':
        return `${node.name} = ${this.genMatlab(node.value)};`;

      case 'Block':
        return node.statements.map(s => this.genMatlab(s)).join('\n');

      case 'Return':
        return this.genMatlab(node.value);

      case 'FunctionCall':
        return `${node.name}(${node.args.map(a => this.genMatlab(a)).join(', ')})`;

      case 'Number':
        return String(node.value);

      case 'String':
        return `'${node.value}'`;

      case 'Boolean':
        return node.value ? 'true' : 'false';

      case 'Identifier':
        return node.name;

      case 'ArrayLiteral':
        return `[${node.elements.map(e => this.genMatlab(e)).join(', ')}]`;

      case 'BinaryOp':
        return `${this.genMatlab(node.left)} ${node.op} ${this.genMatlab(node.right)}`;

      default:
        return '';
    }
  }

  typeToHaskell(type) {
    if (typeof type === 'string') {
      const typeMap = {
        i32: 'Int',
        i64: 'Integer',
        f32: 'Float',
        f64: 'Double',
        str: 'String',
        bool: 'Bool'
      };
      return typeMap[type] || 'a';
    }
    if (type.array) {
      return `[${this.typeToHaskell(type.array)}]`;
    }
    return 'a';
  }

  typeToMatlab(type) {
    return 'varargout';
  }

  genScala(node) {
    if (!node) return '';

    switch (node.type) {
      case 'Program':
        return node.statements.map(s => this.genScala(s)).join('\n\n');

      case 'FunctionDecl':
        const returnType = node.returnType ? `: ${this.typeToScala(node.returnType)}` : '';
        return (
          `def ${node.name}(${node.params.map(p => `${p.name}: ${this.typeToScala(p.type)}`).join(', ')})${returnType} = {\n` +
          this.indentCode(this.genScala(node.body), 2) +
          '\n}'
        );

      case 'VariableDecl':
        return `val ${node.name} = ${this.genScala(node.value)}`;

      case 'Block':
        return node.statements.map(s => this.genScala(s)).join('\n');

      case 'Return':
        return this.genScala(node.value);

      case 'FunctionCall':
        return `${node.name}(${node.args.map(a => this.genScala(a)).join(', ')})`;

      case 'Number':
        return String(node.value);

      case 'String':
        return `"${node.value.replace(/\n/g, '\\n').replace(/"/g, '\\"')}"`;

      case 'Boolean':
        return String(node.value);

      case 'Identifier':
        return node.name;

      case 'ArrayLiteral':
        return `Vector(${node.elements.map(e => this.genScala(e)).join(', ')})`;

      case 'BinaryOp':
        return `${this.genScala(node.left)} ${node.op} ${this.genScala(node.right)}`;

      default:
        return '';
    }
  }

  genClojure(node) {
    if (!node) return '';

    switch (node.type) {
      case 'Program':
        return node.statements.map(s => this.genClojure(s)).join('\n\n');

      case 'FunctionDecl':
        const params = node.params.map(p => p.name).join(' ');
        return `(defn ${node.name} [${params}]\n  ${this.genClojure(node.body)}\n)`;

      case 'VariableDecl':
        return `(def ${node.name} ${this.genClojure(node.value)})`;

      case 'Block':
        return `(do\n  ${node.statements.map(s => this.genClojure(s)).join('\n  ')}\n)`;

      case 'Return':
        return this.genClojure(node.value);

      case 'FunctionCall':
        return `(${node.name} ${node.args.map(a => this.genClojure(a)).join(' ')})`;

      case 'Number':
        return String(node.value);

      case 'String':
        return `"${node.value.replace(/\n/g, '\\n').replace(/"/g, '\\"')}"`;

      case 'Boolean':
        return String(node.value);

      case 'Identifier':
        return node.name;

      case 'ArrayLiteral':
        return `[${node.elements.map(e => this.genClojure(e)).join(' ')}]`;

      case 'BinaryOp':
        return `(${node.op} ${this.genClojure(node.left)} ${this.genClojure(node.right)})`;

      default:
        return '';
    }
  }

  genOCaml(node) {
    if (!node) return '';

    switch (node.type) {
      case 'Program':
        return node.statements.map(s => this.genOCaml(s)).join('\n\n;;');

      case 'FunctionDecl':
        return (
          `let ${node.name} ${node.params.map(p => p.name).join(' ')} =\n` +
          this.indentCode(this.genOCaml(node.body), 2)
        );

      case 'VariableDecl':
        return `let ${node.name} = ${this.genOCaml(node.value)}`;

      case 'Block':
        return node.statements.map(s => this.genOCaml(s)).join('\n');

      case 'Return':
        return this.genOCaml(node.value);

      case 'FunctionCall':
        return `${node.name} ${node.args.map(a => this.genOCaml(a)).join(' ')}`;

      case 'Number':
        return String(node.value);

      case 'String':
        return `"${node.value.replace(/\n/g, '\\n').replace(/"/g, '\\"')}"`;

      case 'Boolean':
        return String(node.value);

      case 'Identifier':
        return node.name;

      case 'ArrayLiteral':
        return `[|${node.elements.map(e => this.genOCaml(e)).join('; ')}|]`;

      case 'BinaryOp':
        return `(${this.genOCaml(node.left)} ${node.op} ${this.genOCaml(node.right)})`;

      default:
        return '';
    }
  }

  genScheme(node) {
    if (!node) return '';

    switch (node.type) {
      case 'Program':
        return node.statements.map(s => this.genScheme(s)).join('\n');

      case 'FunctionDecl':
        const params = node.params.map(p => p.name).join(' ');
        return `(define (${node.name} ${params})\n  ${this.genScheme(node.body)}\n)`;

      case 'VariableDecl':
        return `(define ${node.name} ${this.genScheme(node.value)})`;

      case 'Block':
        return `(begin\n  ${node.statements.map(s => this.genScheme(s)).join('\n  ')}\n)`;

      case 'Return':
        return this.genScheme(node.value);

      case 'FunctionCall':
        return `(${node.name} ${node.args.map(a => this.genScheme(a)).join(' ')})`;

      case 'Number':
        return String(node.value);

      case 'String':
        return `"${node.value.replace(/\n/g, '\\n').replace(/"/g, '\\"')}"`;

      case 'Boolean':
        return String(node.value);

      case 'Identifier':
        return node.name;

      case 'ArrayLiteral':
        return `'(${node.elements.map(e => this.genScheme(e)).join(' ')})`;

      case 'BinaryOp':
        return `(${node.op} ${this.genScheme(node.left)} ${this.genScheme(node.right)})`;

      default:
        return '';
    }
  }

  genWolfram(node) {
    if (!node) return '';

    switch (node.type) {
      case 'Program':
        return node.statements.map(s => this.genWolfram(s)).join('\n');

      case 'FunctionDecl':
        return (
          `${node.name}[${node.params.map(p => p.name).join(', ')}] := ` +
          this.genWolfram(node.body)
        );

      case 'VariableDecl':
        return `${node.name} = ${this.genWolfram(node.value)}`;

      case 'Block':
        return `Block[{}, ${node.statements.map(s => this.genWolfram(s)).join('; ')}]`;

      case 'Return':
        return this.genWolfram(node.value);

      case 'FunctionCall':
        return `${node.name}[${node.args.map(a => this.genWolfram(a)).join(', ')}]`;

      case 'Number':
        return String(node.value);

      case 'String':
        return `"${node.value.replace(/\n/g, '\\n').replace(/"/g, '\\"')}"`;

      case 'Boolean':
        return String(node.value);

      case 'Identifier':
        return node.name;

      case 'ArrayLiteral':
        return `{${node.elements.map(e => this.genWolfram(e)).join(', ')}}`;

      case 'BinaryOp':
        return `${this.genWolfram(node.left)} ${node.op} ${this.genWolfram(node.right)}`;

      default:
        return '';
    }
  }

  typeToScala(type) {
    if (typeof type === 'string') {
      const typeMap = {
        i32: 'Int',
        i64: 'Long',
        f32: 'Float',
        f64: 'Double',
        str: 'String',
        bool: 'Boolean'
      };
      return typeMap[type] || 'Any';
    }
    if (type.array) {
      return `Vector[${this.typeToScala(type.array)}]`;
    }
    return 'Any';
  }

  typeToRust(type) {
    if (typeof type === 'string') {
      const typeMap = { i32: 'i32', f64: 'f64', str: 'String' };
      return typeMap[type] || 'i32';
    }
    if (type.array) {
      return `Vec<${this.typeToRust(type.array)}>`;
    }
    if (type.generic) {
      return `${type.generic}<${this.typeToRust(type.inner)}>`;
    }
    return 'i32';
  }

  indentCode(code, spaces) {
    const indent = ' '.repeat(spaces);
    return code
      .split('\n')
      .map(line => (line ? indent + line : line))
      .join('\n');
  }
}

export { Compiler };
