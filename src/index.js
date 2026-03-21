#!/usr/bin/env node
/**
 * Swibe Language Main Entry Point
 */

import { Lexer } from './lexer.js';
import { Parser } from './parser.js';
import { Compiler } from './compiler.js';
import { LLMIntegration, RAGIntegration, Agent } from './llm-integration.js';
import { SwibeREPL } from './repl.js';
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

      const fs = await import('node:fs');
      const source = fs.readFileSync(file, 'utf-8');

      const compiler = new Compiler(source, target);
      const code = await compiler.compile();
      console.log(code);
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

      const fs = await import('node:fs');
      const source = fs.readFileSync(file, 'utf-8');

      const compiler = new Compiler(source, 'javascript');
      const code = await compiler.compile();

      const { StandardLibrary, SwarmPipeline, sandbox, mcp, MetaDigital } = await import('./stdlib.js');
      const { RAGIntegration, Agent } = await import('./llm-integration.js');
      const std = new StandardLibrary();
      
      // Load Plugin if specified
      if (pluginPath) {
        try {
          // Resolve relative paths
          const absolutePath = pluginPath.startsWith('.') 
            ? await import('node:path').then(p => p.resolve(process.cwd(), pluginPath))
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

    case 'repl': {
      const repl = new SwibeREPL();
      repl.start();
      break;
    }

    case 'version': {
      console.log('Swibe v0.6.0');
      break;
    }

    case 'help':
    default: {
      console.log(`
Swibe Language CLI v0.6.0

Usage:
  swibe                              Start interactive REPL
  swibe compile <file> [--target]   Compile Swibe to target language
  swibe run <file> [--plugin path]  Run Swibe code with optional ecosystem plugin
  swibe repl                        Interactive shell
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
