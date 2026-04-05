#!/usr/bin/env node
/**
 * Swibe Language Main Entry Point
 */

import { Lexer } from './lexer.js';
import { Parser } from './parser.js';
import { Compiler } from './compiler.js';
import { LLMIntegration, RAGIntegration, Agent } from './llm-integration.js';
import { SwibeREPL } from './repl.js';
import { DocGenerator } from './doc-generator.js';
import { APIGenerator } from './api-generator.js';
import { PackageManager } from './package-manager.js';
import { AgentGenerator } from './agent-generator.js';
import { DockerGenerator } from './docker-generator.js';
import { MicroservicesGenerator } from './microservices-generator.js';
import crypto from 'node:crypto';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

async function main() {
  const args = process.argv.slice(2);

  // No arguments - start REPL
  if (args.length === 0) {
    const repl = new SwibeREPL();
    repl.start();
    return;
  }

  const command = args[0];
  const fs = await import('node:fs');

  switch (command) {
    case 'compile': {
      if (args.length < 2) {
        console.error('Usage: swibe compile <file> [--target language]');
        process.exit(1);
      }

      const file = args[1];
      let target = 'javascript';

      if (args.includes('--target')) {
        target = args[args.indexOf('--target') + 1];
      }

      const source = fs.readFileSync(file, 'utf-8');

      const compiler = new Compiler(source, target);
      const code = await compiler.compile();
      
      if (target === 'rust') {
        const { genCargoToml } = await import('./backends/rust.js');
        const cargoToml = genCargoToml();
        
        const path = await import('node:path');
        const outputDir = path.dirname(file);
        const rustFile = path.join(outputDir, 'main.rs');
        const cargoFile = path.join(outputDir, 'Cargo.toml');
        
        fs.writeFileSync(rustFile, code);
        fs.writeFileSync(cargoFile, cargoToml);
        console.log(`[RUST] Generated main.rs and Cargo.toml in ${outputDir}`);
      } else if (target === 'elixir') {
        const { genMixExs } = await import('./backends/elixir.js');
        const mixExs = genMixExs();
        
        const path = await import('node:path');
        const outputDir = path.dirname(file);
        const exFile = path.join(outputDir, 'output.ex');
        const mixFile = path.join(outputDir, 'mix.exs');
        
        fs.writeFileSync(exFile, code);
        fs.writeFileSync(mixFile, mixExs);
        console.log(`[ELIXIR] Generated output.ex and mix.exs in ${outputDir}`);
      } else if (target === 'move') {
        const { genMoveToml } = await import('./backends/move.js');
        const moveToml = genMoveToml();
        
        const path = await import('node:path');
        const outputDir = path.dirname(file);
        const moveFile = path.join(outputDir, 'sources', 'soul.move');
        const tomlFile = path.join(outputDir, 'Move.toml');
        
        fs.mkdirSync(path.join(outputDir, 'sources'), { recursive: true });
        fs.writeFileSync(moveFile, code);
        fs.writeFileSync(tomlFile, moveToml);
        console.log(`[MOVE] Generated sources/soul.move and Move.toml in ${outputDir}`);
      } else if (target === 'hybrid') {
        const path = await import('node:path');
        const outputDir = path.dirname(file);
        
        const sections = code.split('--- MOVE ---');
        const elixirPart = sections[0].replace('--- ELIXIR ---\n', '');
        const movePart = sections[1]?.trim() || '';
        
        const exFile = path.join(outputDir, 'thinker_auditor_swarm.ex');
        const moveFile = path.join(outputDir, 'settler_mint.move');
        
        fs.writeFileSync(exFile, elixirPart);
        fs.writeFileSync(moveFile, movePart);
        
        const { genMixExs } = await import('./backends/elixir.js');
        fs.writeFileSync(path.join(outputDir, 'mix.exs'), genMixExs());
        
        console.log(`[HYBRID] Generated ${exFile} and ${moveFile}`);
      } else {
        console.log(code);
      }
      break;
    }

    case 'run': {
      if (args.length < 2) {
        console.error('Usage: swibe run <file> [--plugin path]');
        process.exit(1);
      }

      const file = args[1];
      let pluginPath = null;
      if (args.includes('--plugin')) {
        const index = args.indexOf('--plugin');
        if (index + 1 < args.length) {
          pluginPath = args[index + 1];
        }
      }

      const source = fs.readFileSync(file, 'utf-8');

      const compiler = new Compiler(source, 'javascript');
      const code = await compiler.compile();

      const { StandardLibrary, SwarmPipeline, sandbox, mcp, MetaDigital } = await import('./stdlib.js');
      const std = new StandardLibrary();
      
      // Load Plugin if specified
      if (pluginPath) {
        try {
          const path = await import('node:path');
          const absolutePath = pluginPath.startsWith('.') 
            ? path.resolve(process.cwd(), pluginPath)
            : pluginPath;
            
          const { default: PluginClass } = await import(absolutePath);
          const plugin = new PluginClass();
          std.setPlugin(plugin);
          console.log(`[CORE] Plugin loaded: ${pluginPath}`);
        } catch (err) {
          console.warn(`[CORE-WARN] Failed to load plugin ${pluginPath}: ${err.message}`);
        }
      }

      const rag = new RAGIntegration();

      const vm = await import('node:vm');
      const context = vm.createContext({
        ...std.builtins,
        std,
        SwarmPipeline,
        Agent,
        RAGIntegration,
        sandbox,
        sandbox_run: std.sandbox_run.bind(std),
        mcp,
        rag,
        MetaDigital,
        checkGoal: std.checkGoal.bind(std),
        console,
        crypto,
        setTimeout,
        clearTimeout,
        process
      });

      try {
        const wrappedCode = `(async () => { 
          ${code} 
          if (typeof main === "function") await main(); 
        })()`;
        await vm.runInContext(wrappedCode, context);
        if (std.plugin && typeof std.plugin.onSettle === 'function') {
          std.plugin.onSettle({ status: 'completed' });
        }
      } catch (err) {
        console.error(`Runtime Error: ${err.message}`);
        if (std.plugin && typeof std.plugin.onSettle === 'function') {
          std.plugin.onSettle({ status: 'error', error: err.message });
        }
        process.exit(1);
      }
      break;
    }

    case 'route': {
      if (args.length < 2) {
        console.error('Usage: swibe route <file>');
        process.exit(1);
      }
      const { StandardLibrary } = await import('./stdlib.js');
      const { SovereignNeuralLayer } = await import('./neural.js');
      const agent = SovereignNeuralLayer.random();
      const report = agent.getRoutingReport();
      console.log('Agent Routing Report:');
      console.log(JSON.stringify(report, null, 2));
      break;
    }

    case 'init': {
      const template = args[1] || 'basic-agent';
      const name = args[2] || template;
      
      const templates = {
        'basic-agent': `-- Basic Sovereign Agent
-- Generated by swibe init basic-agent

fn main() {
  println("🌄 " + "${name}" + " awakening...")
  think "What should I do today?"
  println("Àṣẹ. 🕊️")
}`,

        'swarm': `-- Swarm Agent
-- Generated by swibe init swarm

fn coordinate() {
  swarm {
    think "Analyze the situation"
  }
}

fn main() {
  println("🌊 Swarm initializing...")
  coordinate()
  println("Àṣẹ. 🕊️")
}`,

        'hybrid': `-- Hybrid Sui + Elixir Agent
-- Generated by swibe init hybrid

fn main() {
  println("⚡ Hybrid agent starting...")
  swarm {
    @elixir coordinator {
      think "Coordinate tasks"
    }
    @move settler {
      mint("receipt")
    }
  }
  println("Àṣẹ. 🕊️")
}`,

        'chain': `-- Chain Agent
-- Generated by swibe init chain

fn main() {
  println("🔗 Chain agent starting...")
  chain "research" {
    think "What is sovereignty?"
  }
  println("Àṣẹ. 🕊️")
}`,

        'daily': `-- Daily Techgnosis Agent
-- Generated by swibe init daily

fn main() {
  println("🌄 Daily Agent Awakening")
  plan "Today's sovereign work" {
    think "What is the most important task today?"
  }
  println("Àṣẹ. 🕊️")
}`
      };

      const source = templates[template];
      if (!source) {
        console.error(
          'Templates: basic-agent, swarm, hybrid, chain, daily'
        );
        process.exit(1);
      }

      const filename = `${name}.swibe`;
      if (fs.existsSync(filename)) {
        console.error(`File exists: ${filename}`);
        process.exit(1);
      }

      fs.writeFileSync(filename, source);
      console.log(`✅ Created: ${filename}`);
      console.log(`Run: swibe run ${filename}`);
      break;
    }

    case 'daemon': {
      const file = args[1];
      if (!file) {
        console.error('Usage: swibe daemon <file.swibe>');
        process.exit(1);
      }
      const daemonLog = path.join(
        os.homedir(), '.swibe', 'daemon.log'
      );
      fs.mkdirSync(path.dirname(daemonLog), { recursive: true });
      
      console.log(`[DAEMON] Starting: ${file}`);
      console.log(`[DAEMON] Log: ${daemonLog}`);
      console.log(`[DAEMON] PID: ${process.pid}`);
      console.log('[DAEMON] Running headless...');
      
      // Write PID file
      const pidFile = path.join(
        os.homedir(), '.swibe', 'daemon.pid'
      );
      fs.writeFileSync(pidFile, String(process.pid));
        
      // Run the swibe file in a loop
      const runAgent = async () => {
        try {
          const source = fs.readFileSync(file, 'utf-8');
          const compiler = new Compiler(source, 'javascript');
          const code = await compiler.compile();
          const std = new StandardLibrary();
          const context = vm.createContext({
            std, console, process,
            setTimeout, clearTimeout
          });
          await vm.runInContext(
            `(async () => { ${code} })()`, context
          );
        } catch(e) {
          fs.appendFileSync(daemonLog,
            `[${new Date().toISOString()}] ERROR: ${e.message}\n`
          );
        }
      };
        
      await runAgent();
      break;
    }

    case 'daemon:stop': {
      const pidFile = path.join(
        os.homedir(), '.swibe', 'daemon.pid'
      );
      if (fs.existsSync(pidFile)) {
        const pid = parseInt(
          fs.readFileSync(pidFile, 'utf-8')
        );
        process.kill(pid, 'SIGTERM');
        fs.unlinkSync(pidFile);
        console.log(`[DAEMON] Stopped PID: ${pid}`);
      } else {
        console.log('[DAEMON] No daemon running');
      }
      break;
    }

    case 'doc': {
      if (args.length < 2) {
        console.error('Usage: swibe doc <file>');
        process.exit(1);
      }
      const file = args[1];
      const source = fs.readFileSync(file, 'utf-8');
      const docGen = new DocGenerator();
      const docs = docGen.generate(source);
      console.log(JSON.stringify(docs, null, 2));
      break;
    }

    case 'api': {      const template = args[1] || 'basic-agent';
      const name = args[2] || template;
      
      const templates = {
        'basic-agent': `-- Basic Sovereign Agent
-- Generated by swibe init basic-agent

fn main() {
  println("🌄 " + "${name}" + " awakening...")
  think "What should I do today?"
  println("Àṣẹ. 🕊️")
}`,

        'swarm': `-- Swarm Agent
-- Generated by swibe init swarm

fn coordinate() {
  swarm {
    think "Analyze the situation"
  }
}

fn main() {
  println("🌊 Swarm initializing...")
  coordinate()
  println("Àṣẹ. 🕊️")
}`,

        'hybrid': `-- Hybrid Sui + Elixir Agent
-- Generated by swibe init hybrid

fn main() {
  println("⚡ Hybrid agent starting...")
  swarm {
    @elixir coordinator {
      think "Coordinate tasks"
    }
    @move settler {
      mint("receipt")
    }
  }
  println("Àṣẹ. 🕊️")
}`,

        'chain': `-- Chain Agent
-- Generated by swibe init chain

fn main() {
  println("🔗 Chain agent starting...")
  chain "research" {
    think "What is sovereignty?"
  }
  println("Àṣẹ. 🕊️")
}`,

        'daily': `-- Daily Techgnosis Agent
-- Generated by swibe init daily

fn main() {
  println("🌄 Daily Agent Awakening")
  plan "Today's sovereign work" {
    think "What is the most important task today?"
  }
  println("Àṣẹ. 🕊️")
}`
      };

      const source = templates[template];
      if (!source) {
        console.error(
          'Templates: basic-agent, swarm, hybrid, chain, daily'
        );
        process.exit(1);
      }

      const filename = `${name}.swibe`;
      if (fs.existsSync(filename)) {
        console.error(`File exists: ${filename}`);
        process.exit(1);
      }

      fs.writeFileSync(filename, source);
      console.log(`✅ Created: ${filename}`);
      console.log(`Run: swibe run ${filename}`);
      break;
    }

    case 'daemon': {      if (args.length < 2) {
        console.error('Usage: swibe api <file> [--format <express|graphql|openapi|fastapi>]');
        process.exit(1);
      }
      const file = args[1];
      const source = fs.readFileSync(file, 'utf-8');
      const apiGen = new APIGenerator();
      const endpoints = apiGen.extract(source);
      
      let format = 'json';
      if (args.includes('--format')) {
        format = args[args.indexOf('--format') + 1];
      }

      let output;
      switch (format) {
        case 'express': output = apiGen.generateExpress(); break;
        case 'graphql': output = apiGen.generateGraphQL(); break;
        case 'openapi': output = apiGen.generateOpenAPI(); break;
        case 'fastapi': output = apiGen.generateFastAPI(); break;
        default: output = JSON.stringify(endpoints, null, 2); break;
      }
      console.log(output);
      break;
    }

    case 'pkg': {
      if (args.length < 2) {
        console.error('Usage: swibe pkg <command> [args...]');
        process.exit(1);
      }
      const pkgCommand = args[1];
      const pkgManager = new PackageManager();
      switch (pkgCommand) {
        case 'manifest':
          console.log(pkgManager.generateManifest('my-package'));
          break;
        case 'install': {
          if (args.length < 3) {
            console.error('Usage: swibe pkg install <manifest-file>');
            process.exit(1);
          }
          const manifestPath = args[2];
          const lockfile = await pkgManager.install(manifestPath);
          console.log('Installed packages:', JSON.stringify(lockfile, null, 2));
          break;
        }
        case 'publish':
          console.log('Publish command not fully implemented (mock)');
          break;
        default:
          console.error(`Unknown pkg command: ${pkgCommand}`);
          process.exit(1);
      }
      break;
    }

    case 'agent': {
      if (args.length < 2) {
        console.error('Usage: swibe agent <file> [--gen-class <name> | --gen-factory]');
        process.exit(1);
      }
      const file = args[1];
      const source = fs.readFileSync(file, 'utf-8');
      const agentGen = new AgentGenerator();
      const agents = agentGen.extract(source);

      if (args.includes('--gen-class')) {
        const agentName = args[args.indexOf('--gen-class') + 1];
        const agent = agents.find(a => a.name === agentName);
        if (agent) {
          console.log(agentGen.generateAgentClass(agent));
        } else {
          console.error(`Agent ${agentName} not found.`);
        }
      } else if (args.includes('--gen-factory')) {
        console.log(agentGen.generateAgentFactory());
      } else {
        console.log(JSON.stringify(agents, null, 2));
      }
      break;
    }

    case 'docker': {
      if (args.length < 2) {
        console.error('Usage: swibe docker <command> [args...]');
        process.exit(1);
      }
      const dockerCommand = args[1];
      const dockerGen = new DockerGenerator();
      switch (dockerCommand) {
        case 'dockerfile': {
          let lang = 'javascript';
          if (args.includes('--lang')) {
            lang = args[args.indexOf('--lang') + 1];
          }
          console.log(dockerGen.generateDockerfile(lang));
          break;
        }
        case 'compose':
          console.log(JSON.stringify(dockerGen.generateDockerCompose(), null, 2));
          break;
        case 'lambda':
          console.log(dockerGen.generateLambda());
          break;
        case 'gcp-function':
          console.log(dockerGen.generateGoogleCloudFunction());
          break;
        case 'azure-function':
          console.log(dockerGen.generateAzureFunction());
          break;
        case 'env-template':
          console.log(dockerGen.generateEnvTemplate());
          break;
        case 'systemd':
          console.log(dockerGen.generateSystemdService());
          break;
        default:
          console.error(`Unknown docker command: ${dockerCommand}`);
          process.exit(1);
      }
      break;
    }

    case 'microservice': {
      if (args.length < 2) {
        console.error('Usage: swibe microservice <name> [--port <port>]');
        process.exit(1);
      }
      const name = args[1];
      let port = 3000;
      if (args.includes('--port')) {
        port = parseInt(args[args.indexOf('--port') + 1], 10);
      }
      const microGen = new MicroservicesGenerator();
      const scaffold = microGen.generateService(name, port);
      console.log(JSON.stringify(scaffold, null, 2));
      break;
    }

    case 'repl': {
      const repl = new SwibeREPL();
      repl.start();
      break;
    }

    case 'watch': {
      const file = args[1];
      if (!file) {
        console.error('Usage: swibe watch <file.swibe>');
        process.exit(1);
      }
      if (!fs.existsSync(file)) {
        console.error(`File not found: ${file}`);
        process.exit(1);
      }

      const runFile = async () => {
        console.clear();
        console.log(`[WATCH] Running: ${file}`);
        console.log('[WATCH] Press Ctrl+C to stop');
        console.log('─'.repeat(40));
        try {
          const source = fs.readFileSync(file, 'utf-8');
          const compiler = new Compiler(source, 'javascript');
          const code = await compiler.compile();
          const { StandardLibrary } = await import('./stdlib.js');
          const std = new StandardLibrary();
          const context = vm.createContext({
            std, console, process,
            setTimeout, clearTimeout, setInterval
          });
          await vm.runInContext(
            `(async () => { ${code} })()`, context,
            { timeout: 30000 }
          );
        } catch(e) {
          console.error('[WATCH] Error:', e.message);
        }
        console.log('─'.repeat(40));
        console.log(`[WATCH] Waiting for changes...`);
      };

      await runFile();

      fs.watch(file, async (eventType) => {
        if (eventType === 'change') {
          console.log('[WATCH] Change detected, rerunning...');
          await runFile();
        }
      });

      // Keep process alive
      process.stdin.resume();
      break;
    }

    case 'debug': {
      const file = args[1];
      if (!file) {
        console.error('Usage: swibe debug <file.swibe> [--target lang]');
        process.exit(1);
      }

      const targetFlag = args.indexOf('--target');
      const target = targetFlag !== -1 ? args[targetFlag + 1] : 'javascript';

      if (!fs.existsSync(file)) {
        console.error(`File not found: ${file}`);
        process.exit(1);
      }

      const source = fs.readFileSync(file, 'utf-8');

      console.log('╔══════════════════════════════╗');
      console.log('║   Swibe Debug Mode           ║');
      console.log('╚══════════════════════════════╝');
      console.log(`File:   ${file}`);
      console.log(`Target: ${target}`);
      console.log(`Lines:  ${source.split('\n').length}`);
      console.log('');

      // Lexer debug
      const { Lexer } = await import('./lexer.js');
      const t0 = Date.now();
      const lexer = new Lexer(source);
      const tokens = lexer.tokenize();
      const lexTime = Date.now() - t0;
      console.log(`[LEX]    ${tokens.length} tokens in ${lexTime}ms`);

      // Parser debug
      const { Parser } = await import('./parser.js');
      const t1 = Date.now();
      const parser = new Parser(tokens);
      const ast = parser.parse();
      const parseTime = Date.now() - t1;
      console.log(`[PARSE]  ${ast.statements.length} statements in ${parseTime}ms`);
      if (parser.errors?.length > 0) {
        console.log(`[PARSE]  Errors: ${parser.errors.join(', ')}`);
      }

      // Compiler debug
      const t2 = Date.now();
      const compiler = new Compiler(source, target);
      const code = await compiler.compile();
      const compileTime = Date.now() - t2;
      const lines = code.split('\n').length;
      console.log(`[COMPILE] ${lines} lines in ${compileTime}ms`);
      console.log('');

      // Neural routing
      const { SovereignNeuralLayer } = await import('./neural.js');
      const agent = SovereignNeuralLayer.random();
      const routing = agent.getRoutingReport();
      console.log('[ROUTE]  Model:', routing.topModel);
      console.log('[ROUTE]  Ethics threshold:', routing.ethicsThreshold.toFixed(3));
      console.log('');

      // Show compiled output
      console.log('── Compiled Output ──────────────');
      console.log(code);
      console.log('─────────────────────────────────');
      console.log(`Total: ${lexTime + parseTime + compileTime}ms`);
      break;
    }

    case 'docs': {
      const live = args.includes('--live');
      const outFile = args[1] && !args[1].startsWith('--') ? args[1] : 'DOCS.md';

      const examplesDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'examples');

      const examples = fs.readdirSync(examplesDir)
        .filter(f => f.endsWith('.swibe'))
        .sort();

      let doc = `# Swibe Language Documentation
Generated: ${new Date().toISOString()}

## Installation
\`\`\`bash
npm i -g github:Bino-Elgua/Swibe
\`\`\`

## Examples\n\n`;

      for (const example of examples) {
        const src = fs.readFileSync(path.join(examplesDir, example), 'utf-8');
        const lines = src.split('\n');
        const comments = lines
          .filter(l => l.startsWith('--'))
          .map(l => l.replace('--', '').trim())
          .join(' ');

        const primitives = [];
        if (src.includes('think')) primitives.push('think');
        if (src.includes('swarm')) primitives.push('swarm');
        if (src.includes('chain')) primitives.push('chain');
        if (src.includes('plan')) primitives.push('plan');
        if (src.includes('budget')) primitives.push('budget');
        if (src.includes('remember')) primitives.push('remember');
        if (src.includes('evolve')) primitives.push('evolve');
        if (src.includes('ethics')) primitives.push('ethics');
        if (src.includes('observe')) primitives.push('observe');

        doc += `### ${example}\n`;
        if (comments) doc += `${comments}\n\n`;
        doc += `**Primitives:** ${primitives.join(', ') || 'basic'}\n\n`;
        doc += `**Run:** \`swibe run examples/${example}\`\n\n`;
        doc += `\`\`\`swibe\n${src.slice(0, 200)}${src.length > 200 ? '\n...' : ''}\n\`\`\`\n\n`;
        doc += '---\n\n';
      }

      doc += `## Primitives Reference\n\n`;
      doc += `| Primitive | Purpose | Standalone |\n`;
      doc += `|-----------|---------|------------|\n`;
      doc += `| \`think\` | Real LLM call via Ollama/OpenRouter | ✅ |\n`;
      doc += `| \`chain\` | Sequential reasoning steps | ✅ |\n`;
      doc += `| \`plan\` | Auto-decompose goals | ✅ |\n`;
      doc += `| \`loop\` | ReAct until condition | ✅ |\n`;
      doc += `| \`swarm\` | Multi-agent coordination | ✅ |\n`;
      doc += `| \`budget\` | Token/time limits | ✅ |\n`;
      doc += `| \`remember\` | Persistent memory | ✅ |\n`;
      doc += `| \`evolve\` | Soul state evolution | ✅ |\n`;
      doc += `| \`observe\` | Event listeners | ✅ |\n`;
      doc += `| \`ethics\` | Runtime ethics | ✅ |\n`;
      doc += `| \`retrieve\` | RAG retrieval | ✅ |\n`;
      doc += `| \`receipt.onChain\` | Sui blockchain | 🔌 Techgnosis |\n`;
      doc += `| \`earn\` | ToC token economy | 🔌 Techgnosis |\n\n`;

      fs.writeFileSync(outFile, doc);
      console.log(`✅ Docs generated: ${outFile}`);
      console.log(`   Examples: ${examples.length}`);

      if (live) {
        console.log('[DOCS] Live mode: watching examples/...');
        fs.watch(examplesDir, () => {
          console.log('[DOCS] Regenerating...');
        });
        process.stdin.resume();
      }
      break;
    }

    case 'version': {
      console.log('Swibe v1.2.0');
      break;
    }

    case 'help':
    default: {
      console.log(`
Swibe — Sovereign Agent Language v1.2.0

USAGE:
  swibe run <file.swibe>          Run a Swibe agent
  swibe compile <file> [--target] Compile to target lang
  swibe watch <file.swibe>        Hot reload on changes
  swibe debug <file> [--target]   Debug with AST + timing
  swibe init <template> [name]    Scaffold new agent
  swibe daemon <file.swibe>       Run headless agent
  swibe daemon:stop               Stop running daemon
  swibe route <file.swibe>        Show LLM routing
  swibe docs [--live]             Generate documentation
  swibe repl                      Interactive REPL

TARGETS:
  javascript typescript python rust go elixir
  move zig julia haskell lua r scala clojure
  crystal nim ocaml fsharp d ruby perl wasm
  + 19 more exotic targets

PRIMITIVES:
  think plan chain loop swarm
  budget remember evolve observe ethics retrieve

TEMPLATES:
  basic-agent swarm hybrid chain daily

EXAMPLES:
  swibe init daily my-agent
  swibe run my-agent.swibe
  swibe watch my-agent.swibe
  swibe debug my-agent.swibe --target rust
  swibe compile my-agent.swibe --target wasm
  swibe docs --live
      `);
      break;
    }
  }
}

main().catch(console.error);

export { Lexer, Parser, Compiler, LLMIntegration, RAGIntegration, Agent };
