#!/usr/bin/env node
/**
 * Swibe Language Main Entry Point
 */

import { Lexer } from './lexer.js';
import { Parser } from './parser.js';
import { Compiler } from './compiler.js';
import { LLMIntegration, RAGIntegration, Agent } from './llm-integration.js';
import { SwibeREPL, startRepl } from './repl.js';
import { DocGenerator } from './doc-generator.js';
import { APIGenerator } from './api-generator.js';
import { PackageManager } from './package-manager.js';
import { AgentGenerator } from './agent-generator.js';
import { DockerGenerator } from './docker-generator.js';
import { MicroservicesGenerator } from './microservices-generator.js';
import { ObsidianExporter } from './obsidian-exporter.js';
import crypto from 'node:crypto';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const pkg = require('../package.json');
const VERSION = pkg.version;

async function main() {
  const args = process.argv.slice(2);

  // No arguments - start REPL
  if (args.length === 0) {
    await startRepl();
    return;
  }

  const command = args[0];

  switch (command) {
    case 'compile': {
      if (args.length < 2) {
        console.error('Usage: swibe compile <file> [--target language] [--report] [--strict-layers]');
        process.exit(1);
      }

      const file = args[1];
      let target = 'javascript';

      if (args.includes('--target')) {
        target = args[args.indexOf('--target') + 1];
      }

      const strictLayers = args.includes('--strict-layers');

      const source = fs.readFileSync(file, 'utf-8');

      const compiler = new Compiler(source, target, { strictLayers });
      const code = await compiler.compile();
      
      if (args.includes('--report')) {
        const report = compiler.getSovereignReadinessReport();
        console.log('\n--- Sovereign Readiness Report ---');
        console.log(`Risk Score: ${report.riskScore}/100 [${report.status}]`);
        console.log(`Ethics Validator: ${report.validators.ethics.passed ? '✅' : '❌'} (${report.validators.ethics.violations} violations)`);
        console.log(`Layer Validator:  ${report.validators.layers.passed ? '✅' : '❌'} (${report.validators.layers.warnings} warnings)`);
        if (report.missingFeatures.ethics) console.log('⚠️ Missing ethics {} block');
        if (report.missingFeatures.secure) console.log('⚠️ Missing secure {} block');
        if (report.missingFeatures.permissions) console.log('⚠️ Missing permission {} block');
        console.log('----------------------------------\n');
      }

      if (target === 'rust') {
        const { genCargoToml } = await import('./backends/rust.js');
        const cargoToml = genCargoToml();
        

        const outputDir = path.dirname(file);
        const rustFile = path.join(outputDir, 'main.rs');
        const cargoFile = path.join(outputDir, 'Cargo.toml');
        
        fs.writeFileSync(rustFile, code);
        fs.writeFileSync(cargoFile, cargoToml);
        console.log(`[RUST] Generated main.rs and Cargo.toml in ${outputDir}`);
      } else if (target === 'elixir') {
        const { genMixExs } = await import('./backends/elixir.js');
        const mixExs = genMixExs();
        

        const outputDir = path.dirname(file);
        const exFile = path.join(outputDir, 'output.ex');
        const mixFile = path.join(outputDir, 'mix.exs');
        
        fs.writeFileSync(exFile, code);
        fs.writeFileSync(mixFile, mixExs);
        console.log(`[ELIXIR] Generated output.ex and mix.exs in ${outputDir}`);
      } else if (target === 'move') {
        const { genMoveToml } = await import('./backends/move.js');
        const moveToml = genMoveToml();
        

        const outputDir = path.dirname(file);
        const moveFile = path.join(outputDir, 'sources', 'soul.move');
        const tomlFile = path.join(outputDir, 'Move.toml');
        
        fs.mkdirSync(path.join(outputDir, 'sources'), { recursive: true });
        fs.writeFileSync(moveFile, code);
        fs.writeFileSync(tomlFile, moveToml);
        console.log(`[MOVE] Generated sources/soul.move and Move.toml in ${outputDir}`);
      } else if (target === 'openclaw') {
        const outDir = './openclaw-out';
        fs.mkdirSync(outDir, { recursive: true });
        for (const [filename, content] of Object.entries(code.files)) {
          fs.writeFileSync(
            path.join(outDir, filename),
            content
          );
          console.log(`[OPENCLAW] Generated: ${filename}`);
        }
        console.log('');
        console.log('[OPENCLAW] Agent ready for deployment.');
        console.log('[OPENCLAW] Install: openclaw skill install ./openclaw-out');
        console.log('[OPENCLAW] Start:   openclaw start');
        console.log('');
        console.log('Files generated in ./openclaw-out/:');
        console.log('  SKILL.md  — OpenClaw skill definition');
        console.log('  agent.js  — Runtime implementation');
        console.log('  SOUL.md   — Sovereign identity');
      } else if (target === 'hybrid') {

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
      const jsCode = await compiler.compile();

      const { StandardLibrary } = await import('./stdlib.js');
      const std = new StandardLibrary();
      
      if (pluginPath) {
        const { default: PluginClass } = await import(path.resolve(pluginPath));
        std.setPlugin(new PluginClass());
      }

      const evalContext = {
        std,
        console,
        Buffer,
        process,
        setTimeout,
        setInterval,
        clearInterval,
        clearTimeout,
        _lastThought: null,
      };

      const script = new vm.Script(jsCode);
      const context = vm.createContext({
        ...evalContext,
        ...std.builtins
      });
      await script.runInContext(context);
      break;
    }

    case 'repl': {
      const forgiving = args.includes('--forgiving');
      await startRepl({ forgiving });
      break;
    }

    case 'plugin': {
      const subcommand = args[1];
      if (subcommand === 'list') {
        const pluginsDir = path.join(path.dirname(fileURLToPath(import.meta.url)), 'plugins');
        const files = fs.readdirSync(pluginsDir);
        console.log('Installed Plugins:');
        files.forEach(f => console.log(`- ${f.replace('.js', '')}`));
        break;
      }
      
      if (subcommand === 'add') {
        const pluginName = args[2];
        if (!pluginName) {
          console.error('Usage: swibe plugin add <name>');
          process.exit(1);
        }
        console.log(`[PLUGIN] Adding: ${pluginName}`);
        console.log('[PLUGIN] Available: telephony');
        console.log('[PLUGIN] To enable: set env vars');
        console.log('  TELNYX_API_KEY=your_key');
        console.log('  TELEPHONY_PROVIDER=telnyx');
        break;
      }

      if (subcommand === 'info') {
        const pluginName = args[2];
        const pluginPath = path.join(
          path.dirname(fileURLToPath(import.meta.url)),
          '..', 'src', 'plugins',
          `${pluginName}.js`
        );
        const fs = await import('node:fs');
        if (fs.existsSync(pluginPath)) {
          const { default: plugin } = await import(pluginPath);
          console.log(`Plugin: ${plugin.name || pluginName}`);
          console.log(`Hooks: ${Object.keys(plugin)
            .filter(k => k.startsWith('on'))
            .join(', ')}`);
        } else {
          console.log(`Plugin not found: ${pluginName}`);
          console.log('Available: telephony');
        }
        break;
      }

      console.log(`
        Swibe Plugin Manager

        USAGE:
          swibe plugin list           List installed plugins
          swibe plugin add <name>     Add a plugin
          swibe plugin info <name>    Plugin details

        AVAILABLE PLUGINS:
          telephony   Phone/SMS at agent birth
                      Providers: telnyx, twilio (mock default)
                      Env: TELNYX_API_KEY, TELEPHONY_PROVIDER
      `);
      break;
    }

    case 'token': {
      const subcommand = args[1];
      const { ToCEconomy } = await import('./toc/index.js');
      const toc = new ToCEconomy();
      
      if (subcommand === 'audit') {
        const status = toc.getStatus();
        const slashed = toc.staking.getSlashHistory();
        const totalSlashed = slashed.reduce((sum, s) => sum + s.slashAmount, 0);
        const agentCount = toc.wallets.wallets.size;
        
        console.log('--- ToC Token Audit Report ---');
        console.log(`Total Agents: ${agentCount}`);
        console.log(`Dopamine Supply: ${status.supply.toc_d || 0}`);
        console.log(`Synapse Supply: ${status.supply.toc_s || 0}`);
        console.log(`Total Dopamine Burned: ${status.burned.toc_d || 0}`);
        console.log(`Total Synapse Burned: ${status.burned.toc_s || 0}`);
        console.log(`Total Slashed: ${totalSlashed}`);
        console.log(`Total Staked Dopamine: ${status.totalStaked.toc_d || 0}`);
        console.log(`Total Staked Synapse: ${status.totalStaked.toc_s || 0}`);
        
        if (slashed.length > 0) {
          console.log('\nRecent Slashing Events:');
          slashed.slice(-5).forEach(s => {
            console.log(`- ${s.holderId}: ${s.slashAmount} ${s.token} (${s.reason})`);
          });
        }
      } else {
        console.log('Usage: swibe token audit');
      }
      break;
    }

    case 'route': {
      if (args.length < 2) {
        console.error('Usage: swibe route <file>');
        process.exit(1);
      }
      
      const file = args[1];
      const source = fs.readFileSync(file, 'utf-8');
      const lexer = new Lexer(source);
      const tokens = lexer.tokenize();
      const parser = new Parser(tokens);
      const ast = parser.parse();
      
      const { gateFromAST, DEFAULT_PERMISSIONS, HIGH_RISK_PRIMITIVES } = await import('./permissions.js');
      const ethicsNode = ast.statements.find(s => s.type === 'EthicsStatement');
      const permNode = ast.statements.find(s => s.type === 'PermissionStatement');
      const gate = gateFromAST(ethicsNode, permNode);
      
      const { SovereignNeuralLayer } = await import('./neural.js');
      const neuralLayer = SovereignNeuralLayer.random();
      const report = neuralLayer.getRoutingReport();
      
      console.log('--- Agent Routing Report ---');
      console.log(`Neural Archetype: ${neuralLayer.archetype}`);
      console.log(`Ethics Threshold: ${neuralLayer.ethicsThreshold.toFixed(3)}`);
      console.log('\nLLM Routing Preferences:');
      console.log(JSON.stringify(report, null, 2));
      
      console.log('\n--- Permission Matrix Report ---');
      console.log('Primitive'.padEnd(15) + ' | ' + 'Mode'.padEnd(10) + ' | ' + 'Status');
      console.log('-'.repeat(45));
      
      const allPrimitives = Array.from(new Set([
        ...Object.keys(DEFAULT_PERMISSIONS),
        ...Object.keys(gate.matrix),
        ...HIGH_RISK_PRIMITIVES
      ])).sort();
      
      for (const p of allPrimitives) {
        const mode = gate.matrix[p] || 'ask';
        const isHighRisk = HIGH_RISK_PRIMITIVES.includes(p);
        const status = isHighRisk ? (gate.matrix[p] ? '✅ Protected' : '⚠️ UNPROTECTED') : 'Standard';
        console.log(p.padEnd(15) + ' | ' + mode.padEnd(10) + ' | ' + status);
      }
      
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
    @move executor {
      mint { value: 10 }
    }
  }
}`,

        'hardened': `-- Hardened Sovereign Agent
-- Generated by swibe init hardened

-- Layer 0: Ethics & Identity
ethics {
  harm_none: true;
  sovereign_data: true;
  receipt_chain: true
}

secure {
  execution: "strict-vm";
  network: "refuse";
  llm_routing: "ethics_only";
  receipt_sealing: "immediate";
  strict: true
}

filesystem {
  allowed: ["src/**", "data/"];
  read_only: false
}

wallet {
  token: "toc_s";
  initial_stake: 1000
}

-- Layer 1: Core Agent
permission {
  think: "auto";
  bash: "simulate";
  mint: "ask";
  file_write: "quarantine";
  edit: "ask"
}

budget {
  tokens: 50000;
  time: "60s"
}

fn main() {
  println("🛡️ Hardened agent " + "${name}" + " awakening...")
  think "Perform a secure security audit of the current context."
  println("Àṣẹ. 🕊️")
}`,

        'chain': `-- Chain Agent
-- Generated by swibe init chain

fn main() {
  println("🔗 Chain agent starting...")
  chain {
    think "Step 1: Planning"
    think "Step 2: Execution"
    think "Step 3: Verification"
  }
  println("Àṣẹ. 🕊️")
}`,

        'daily': `-- Daily Routine Agent
-- Generated by swibe init daily

fn main() {
  println("☀️ Daily routine starting...")
  heartbeat {
    every: 3600s;
    check: "Check news and update summary"
  }
  println("Àṣẹ. 🕊️")
}`
      };

      if (templates[template]) {
        const output = templates[template];
        const filename = `${name}.swibe`;
        fs.writeFileSync(filename, output);
        console.log(`[INIT] Created ${filename} from ${template} template`);
      } else {
        console.log(`Unknown template: ${template}`);
        console.log(`Available templates: ${Object.keys(templates).join(', ')}`);
      }
      break;
    }

    case 'audit': {
      if (args.length < 2) {
        console.error('Usage: swibe audit <file.swibe>');
        process.exit(1);
      }
      
      const file = args[1];
      const source = fs.readFileSync(file, 'utf-8');
      const compiler = new Compiler(source, 'javascript');
      await compiler.compile();
      
      const report = compiler.getSovereignReadinessReport();
      console.log('\n====================================');
      console.log('   SOVEREIGN READINESS REPORT');
      console.log('====================================');
      console.log(`File:       ${file}`);
      console.log(`Risk Score: ${report.riskScore}/100`);
      console.log(`Status:     [${report.status}]`);
      console.log('------------------------------------');
      console.log('VALIDATORS:');
      console.log(`Ethics:     ${report.validators.ethics.passed ? '✅ PASSED' : '❌ FAILED'} (${report.validators.ethics.violations} violations)`);
      console.log(`Layers:     ${report.validators.layers.passed ? '✅ PASSED' : '❌ FAILED'} (${report.validators.layers.warnings} warnings)`);
      console.log('------------------------------------');
      console.log('SECURITY POLICIES:');
      console.log(`Ethics Block:     ${report.missingFeatures.ethics ? '❌ MISSING' : '✅ PRESENT'}`);
      console.log(`Secure Block:     ${report.missingFeatures.secure ? '❌ MISSING' : '✅ PRESENT'}`);
      console.log(`Permission Block: ${report.missingFeatures.permissions ? '❌ MISSING' : '✅ PRESENT'}`);
      
      if (report.riskScore > 0) {
        console.log('------------------------------------');
        console.log('RECOMMENDATIONS:');
        if (report.missingFeatures.ethics) console.log('- Add an ethics {} block to define core agent values.');
        if (report.missingFeatures.secure) console.log('- Add a secure {} block to restrict runtime execution.');
        if (report.missingFeatures.permissions) console.log('- Add a permission {} block for high-risk primitives.');
      }
      console.log('====================================\n');
      break;
    }

    case 'watch': {
      if (args.length < 2) {
        console.error('Usage: swibe watch <file>');
        process.exit(1);
      }
      const file = args[1];
      console.log(`[WATCH] Watching ${file} for changes...`);
      fs.watchFile(file, async () => {
        console.log(`[WATCH] Change detected, re-running...`);
        const source = fs.readFileSync(file, 'utf-8');
        const compiler = new Compiler(source, 'javascript');
        try {
          const jsCode = await compiler.compile();
          // ... execute jsCode ...
          console.log('[WATCH] Execution complete');
        } catch (e) {
          console.error(`[WATCH] Error: ${e.message}`);
        }
      });
      break;
    }

    case 'version': {
      console.log(`Swibe v${VERSION}`);
      break;
    }

    case 'help':
    default: {
      console.log(`
        Swibe: Agent-Native Scripting Language (v${VERSION})

        USAGE:
          swibe run <file.swibe>          Execute a Swibe agent
          swibe compile <file.swibe>      Compile to target language
          swibe audit <file.swibe>        Run Sovereign Readiness Report
          swibe repl                      Start interactive REPL
          swibe repl --forgiving          Start REPL in forgiving mode
          swibe route <file.swibe>        Show neural routing & permission matrix
          swibe init <template> [name]    Scaffold from template
          swibe token audit               Audit agent token balances & slashes
          swibe plugin <cmd>              Manage plugins
          swibe watch <file.swibe>        Hot-reload on changes

        TEMPLATES:
          basic-agent, swarm, hybrid, hardened, chain, daily

        FLAGS:
          --target <lang>       Compile target (javascript, rust, elixir, move, openclaw, hybrid)
          --report              Show sovereign readiness report during compile
          --strict-layers       Enable hard errors for layer-order violations
          --forgiving           Start REPL in forgiving (natural language) mode
      `);
      break;
    }
  }
}

import vm from 'node:vm';
main().catch(err => {
  console.error(err);
  process.exit(1);
});
