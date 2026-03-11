#!/usr/bin/env node
/**
 * Swibe Language Main Entry Point
 */

import { Lexer } from './lexer.js';
import { Parser } from './parser.js';
import { Compiler } from './compiler.js';
import { LLMIntegration, RAGIntegration, Agent } from './llm-integration.js';
import { VibeREPL } from './repl.js';

async function main() {
  const args = process.argv.slice(2);

  // No arguments - start REPL
  if (args.length === 0) {
    const repl = new VibeREPL();
    repl.start();
    return;
  }

  const command = args[0];

  switch (command) {
    case 'compile': {
      if (args.length < 2) {
        console.error('Usage: vibe compile <file> [--target language]');
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
        console.error('Usage: vibe run <file>');
        process.exit(1);
      }

      const file = args[1];
      const fs = await import('node:fs');
      const source = fs.readFileSync(file, 'utf-8');

      const compiler = new Compiler(source, 'javascript');
      const code = await compiler.compile();

      const { StandardLibrary, SwarmPipeline, sandbox, mcp } = await import('./stdlib.js');
      const { RAGIntegration, Agent } = await import('./llm-integration.js');
      const std = new StandardLibrary();
      const rag = new RAGIntegration();

      const vm = await import('node:vm');
      const context = vm.createContext({
        ...std.builtins,
        SwarmPipeline,
        Agent,
        RAGIntegration,
        sandbox,
        mcp,
        rag,
        checkGoal: std.checkGoal.bind(std),
        console,
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
      } catch (err) {
        console.error(`Runtime Error: ${err.message}`);
        process.exit(1);
      }
      break;
    }

    case 'repl': {
      const repl = new VibeREPL();
      repl.start();
      break;
    }

    case 'version': {
      console.log('Vibe v0.1.0');
      break;
    }

    case 'help':
    default: {
      console.log(`
Vibe Language CLI v0.1.0

Usage:
  vibe                              Start interactive REPL
  vibe compile <file> [--target]   Compile Vibe to target language
  vibe repl                        Interactive shell
  vibe version                     Show version
  vibe help                        Show this help

Target languages: javascript, python, rust, go (default: javascript)

Examples:
  vibe compile hello.vibe
  vibe compile app.vibe --target python
  vibe compile ai-app.vibe --target rust
      `);
      break;
    }
  }
}

main().catch(console.error);

export { Lexer, Parser, Compiler, LLMIntegration, RAGIntegration, Agent };
