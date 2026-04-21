/**
 * Swibe REPL v3.4.2
 * Interactive sovereign agent shell — Isolated VM & Async Support
 */

import readline from 'node:readline';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
import { Compiler } from './compiler.js';
import { StandardLibrary } from './stdlib.js';
import { LLMIntegration } from './llm-integration.js';
import { matchIntent, injectDefaults, correctTypos } from './intent-parser.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const HISTORY_FILE = path.join(
  os.homedir(), '.swibe', 'repl-history.json'
);

const TRANSLATOR_PROMPT_PATH = path.join(
  __dirname, 'prompts', 'forgiving-translator.json'
);

const BANNER = `🌀 Swibe REPL v3.4.2
══════════════════════════════════════
Sovereign Agent-Native Scripting Shell
Type Swibe primitives and see results.
Type .help for commands, .exit to quit.
══════════════════════════════════════`;

const HINTS = [
  'think "your prompt"',
  'swarm { think "task" }',
  'ethics { harm-none }',
  'ethics { mode: "hermetic" }',
  'birth { identity: "bipọn39" }',
  'budget { tokens: 1000; time: "30s" }',
  'remember { "key" }',
  'evolve { soul: "Ọbàtálá", rank: 1 }',
  'heartbeat { every: 60s; check: "updates?" }',
  'println("Àṣẹ")',
  '.help',
  '.exit',
  '.clear',
  '.history',
  '.sabbath',
  '.forgiving',
  '.strict',
];

// ────────────────────────────────────────────────────────────
// Multi-line Input Buffering (Change 9)
// ────────────────────────────────────────────────────────────

class ReplBuffer {
  constructor() {
    this.buffer = [];
    this.braceDepth = 0;
    this.inString = false;
  }
  
  addLine(line) {
    this.buffer.push(line);
    
    // Track structural completeness
    for (const char of line) {
      if (char === '"' && !this.inString) { this.inString = true; continue; }
      if (char === '"' && this.inString) { this.inString = false; continue; }
      if (!this.inString) {
        if (char === '{') this.braceDepth++;
        if (char === '}') this.braceDepth--;
      }
    }
    
    // Ready to eval when balanced and not in string
    return this.braceDepth <= 0 && !this.inString;
  }
  
  flush() {
    const code = this.buffer.join('\n');
    this.buffer = [];
    this.braceDepth = 0;
    return code;
  }

  clear() {
    this.buffer = [];
    this.braceDepth = 0;
    this.inString = false;
  }
}

// ────────────────────────────────────────────────────────────
// Isolated Execution Context (Change 7)
// ────────────────────────────────────────────────────────────

function createSwibeContext(std) {
  const sandbox = {
    console,
    require,
    std,
    process,
    
    // Swibe primitives injected here
    AgentCoordinator: require('./agent-coordinator.js').default,
    SwarmPipeline: require('./agent-coordinator.js').default,
    ToCBurner: require('./toc/burner.js').default,
    println: (msg) => process.stdout.write(msg + '\n'),
    
    // Layer registry for order enforcement
    __layerOrder: [],
    __declareLayer: (layerNum, name) => {
      if (layerNum < (sandbox.__layerOrder.at(-1)?.layerNum ?? -1)) {
        throw new Error(`[COMPILER:LAYER-ORDER] Layer ${layerNum} (${name}) declared out of order`);
      }
      sandbox.__layerOrder.push({ layerNum, name });
    }
  };
  
  return vm.createContext(sandbox);
}

// ────────────────────────────────────────────────────────────
// Async Evaluator (Change 8)
// ────────────────────────────────────────────────────────────

async function evaluateSwibe(source, context) {
  const wrappedSource = source.includes('fn ')
    ? source
    : `fn main() {\n  ${source.split('\n').join('\n  ')}\n}`;

  try {
    const compiler = new Compiler(wrappedSource, 'javascript');
    const code = await compiler.compile();

    // Wrap in async IIFE for top-level await support in REPL
    const wrappedCode = `(async () => {
      ${code}
    })()`;
    
    const result = await vm.runInContext(wrappedCode, context, { timeout: 30000 });
    return { success: true, result };
  } catch (err) {
    if (err.name === 'SyntaxError') {
      return { success: false, error: `PARSE: ${err.message}`, recoverable: true };
    }
    return { success: false, error: `RUNTIME: ${err.message}`, recoverable: false };
  }
}

// ────────────────────────────────────────────────────────────
// Dot Commands
// ────────────────────────────────────────────────────────────

function buildDotCommands(state, std, buffer) {
  return {
    '.help': () => {
      console.log(`Swibe REPL Commands:
  .help      — Show this help
  .exit      — Exit the REPL
  .clear     — Clear the screen
  .history   — Show command history
  .sabbath   — Check Sabbath status
  .reset     — Reset the VM state
  .version   — Show Swibe version
  .forgiving — Enable forgiving mode (natural language → Swibe)
  .strict    — Return to strict parsing mode

Mode: ${state.forgiving ? '🧠 Forgiving' : '⚙️ Strict'}

Primitives:
  think "prompt"
  swarm { think "task" }
  chain { think "step1"; think "step2" }
  ethics { harm_none: true; mode: "hermetic" }
  permission { think: "auto"; bash: "ask" }
  birth { identity: "bipọn39" }
  budget { tokens: 1000 }
  remember { "key" }
  evolve { soul: "name", rank: 1 }
  heartbeat { every: 60s }
  wallet { token: "toc_s" }
  secure { execution: "strict-vm" }
  println("message")

Àṣẹ.`);
    },
    '.clear': () => {
      process.stdout.write('\x1Bc');
    },
    '.sabbath': () => {
      const day = new Date().getDay();
      if (day === 6) {
        console.log('[SABBATH] Saturday — rest is law. Heavy actions blocked.');
      } else {
        const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
        console.log(`[SABBATH] ${days[day]} — active. No restrictions.`);
      }
    },
    '.version': () => {
      try {
        const pkg = JSON.parse(
          fs.readFileSync(
            path.join(__dirname, '..', 'package.json'), 'utf-8'
          )
        );
        console.log(`Swibe v${pkg.version}`);
      } catch {
        console.log('Swibe v3.4.2');
      }
    },
    '.forgiving': () => {
      state.forgiving = true;
      console.log('🧠 Forgiving mode ON — type natural language and Swibe will translate.');
    },
    '.strict': () => {
      state.forgiving = false;
      console.log('⚙️ Strict mode ON — standard Swibe parsing restored.');
    },
    '.reset': () => {
      buffer.clear();
      console.log('[REPL] Buffer cleared and VM reset.');
    }
  };
}

// ────────────────────────────────────────────────────────────
// History
// ────────────────────────────────────────────────────────────

function loadHistory() {
  try {
    if (fs.existsSync(HISTORY_FILE)) {
      return JSON.parse(
        fs.readFileSync(HISTORY_FILE, 'utf-8')
      );
    }
  } catch (_e) { }
  return [];
}

function saveHistory(history) {
  try {
    fs.mkdirSync(path.dirname(HISTORY_FILE), { recursive: true });
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(history.slice(-100), null, 2));
  } catch (_e) { }
}

// ────────────────────────────────────────────────────────────
// Forgiving Handler
// ────────────────────────────────────────────────────────────

async function handleForgiving(source, context) {
  const intent = matchIntent(source);
  if (intent.matched) {
    const code = injectDefaults(intent.code);
    console.log(`\x1b[90m╭─ Understood: "${source}"\x1b[0m`);
    console.log(`\x1b[36m${code}\x1b[0m\n`);
    await evaluateSwibe(code, context);
    return;
  }

  const result = await translateWithLLM(source);
  const code = injectDefaults(result.code);
  console.log(`\x1b[90m╭─ Translated:\x1b[0m`);
  console.log(`\x1b[36m${code}\x1b[0m\n`);
  await evaluateSwibe(code, context);
}

// ────────────────────────────────────────────────────────────
// Forgiving Translator — LLM fallback
// ────────────────────────────────────────────────────────────

let _translatorPromptCache = null;

function loadTranslatorPrompt() {
  if (_translatorPromptCache) return _translatorPromptCache;
  try {
    const raw = fs.readFileSync(TRANSLATOR_PROMPT_PATH, 'utf-8');
    _translatorPromptCache = JSON.parse(raw);
    return _translatorPromptCache;
  } catch {
    return null;
  }
}

async function translateWithLLM(input) {
  const promptData = loadTranslatorPrompt();
  if (!promptData) return { code: `think "${input}"`, explanation: 'No prompt data' };

  const examplesText = (promptData.examples || [])
    .map(e => `User: ${e.input}\nSwibe:\n${e.output}`)
    .join('\n\n');

  const fullPrompt = `${promptData.system}\n\n## Examples\n${examplesText}\n\nUser: ${input}\nSwibe:`;

  try {
    const llm = new LLMIntegration();
    const result = await llm.think(fullPrompt, { max_tokens: 512 });
    return { code: result.content.trim() || `think "${input}"` };
  } catch (err) {
    return { code: `think "${input}"` };
  }
}

// ────────────────────────────────────────────────────────────
// REPL Entry Point
// ────────────────────────────────────────────────────────────

export async function startRepl(options = {}) {
  console.log(BANNER);

  const history = loadHistory();
  const std = new StandardLibrary();
  const buffer = new ReplBuffer();
  const state = { forgiving: options.forgiving || false };
  const context = createSwibeContext(std);
  const dotCommands = buildDotCommands(state, std, buffer);

  const promptStr = () =>
    state.forgiving
      ? '\x1b[35mswibe\x1b[0m \x1b[33m🧠❯\x1b[0m '
      : '\x1b[36mswibe\x1b[0m \x1b[33m❯\x1b[0m ';

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: promptStr(),
    history: history,
    historySize: 100,
    completer: (line) => {
      const completions = HINTS.filter(h => h.startsWith(line));
      return [completions, line];
    }
  });

  rl.prompt();

  rl.on('line', async (line) => {
    const trimmed = line.trim();

    if (!trimmed) {
      if (buffer.braceDepth > 0) buffer.addLine('');
      rl.prompt();
      return;
    }

    if (trimmed.startsWith('.')) {
      if (trimmed === '.exit' || trimmed === '.quit') {
        saveHistory(rl.history);
        console.log('\nÀṣẹ. Signing off. 🕊️');
        process.exit(0);
      }
      const cmd = dotCommands[trimmed];
      if (cmd) cmd();
      else console.log(`Unknown command: ${trimmed}`);
      rl.prompt();
      return;
    }

    if (buffer.addLine(line)) {
      const source = buffer.flush();
      const { corrected } = correctTypos(source);
      
      if (state.forgiving) {
        try {
          const evalResult = await evaluateSwibe(corrected, context);
          if (!evalResult.success && evalResult.recoverable) {
            await handleForgiving(source, context);
          }
        } catch (err) {
          console.error(`\x1b[31m[ERROR]\x1b[0m ${err.message}`);
        }
      } else {
        const evalResult = await evaluateSwibe(corrected, context);
        if (!evalResult.success) {
          console.error(`\x1b[31m[ERROR]\x1b[0m ${evalResult.error}`);
        }
      }
      rl.setPrompt(promptStr());
    } else {
      rl.setPrompt('\x1b[33m  ...\x1b[0m ');
    }
    rl.prompt();
  });

  rl.on('close', () => {
    saveHistory(rl.history);
    console.log('\nÀṣẹ. 🕊️');
    process.exit(0);
  });

  rl.on('SIGINT', () => {
    if (buffer.buffer.length > 0) {
      buffer.clear();
      rl.setPrompt(promptStr());
      console.log('\n[REPL] Cancelled.');
      rl.prompt();
    } else {
      saveHistory(rl.history);
      process.exit(0);
    }
  });
}

class SwibeREPL {
  start(options = {}) {
    return startRepl(options);
  }
}

export { SwibeREPL };
