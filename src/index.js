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

    case 'api': {
      if (args.length < 2) {
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
        case 'install':
          if (args.length < 3) {
            console.error('Usage: swibe pkg install <manifest-file>');
            process.exit(1);
          }
          const manifestPath = args[2];
          const lockfile = await pkgManager.install(manifestPath);
          console.log('Installed packages:', JSON.stringify(lockfile, null, 2));
          break;
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
        case 'dockerfile':
          let lang = 'javascript';
          if (args.includes('--lang')) {
            lang = args[args.indexOf('--lang') + 1];
          }
          console.log(dockerGen.generateDockerfile(lang));
          break;
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

    case 'version': {
      console.log('Swibe v1.2.0');
      break;
    }

    case 'help':
    default: {
      console.log(`
Swibe Language CLI v1.2.0

Usage:
  swibe compile <file> [--target]   Compile Swibe to target language
  swibe run <file> [--plugin path]  Run Swibe code with optional ecosystem plugin
  swibe doc <file>                  Generate documentation from a Swibe file
  swibe api <file> [--format]       Generate API code/spec from a Swibe file
  swibe pkg <command> [args...]     Manage Swibe packages
  swibe agent <file> [--gen-class <name>] Generate agent code
  swibe docker <command> [args...]  Generate Docker/Cloud Function configs
  swibe microservice <name> [--port] Generate microservice scaffold
  swibe repl                        Start interactive shell
  swibe version                     Show version
  swibe help                        Show this help

Target languages: 
  Tier 1: javascript, lua, nim, crystal, janet, scheme
  Tier 2: rust, go, zig, v, odin, ocaml, fsharp, clojure, haskell
  Tier 3: pony, aether, mojo, move, julia, apl, j, k, forth, prolog, mercury, ada, cobol, smalltalk, d, raku, scala, idris

Examples:
  swibe compile hello.swibe --target apl
  swibe run agent.swibe --plugin ./technosis-adapter.js
  swibe compile ai-app.swibe --target cobol
      `);
      break;
    }
  }
}

main().catch(console.error);

export { Lexer, Parser, Compiler, LLMIntegration, RAGIntegration, Agent };
