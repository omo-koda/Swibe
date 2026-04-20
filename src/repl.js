/**
 * Swibe REPL v3.3.2
 * Interactive sovereign agent shell — now with Forgiving Mode
 */

import readline from 'node:readline';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { Lexer } from './lexer.js';
import { Parser } from './parser.js';
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

const BANNER = `🌀 Swibe REPL v3.3.2
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
// Forgiving Translator — LLM fallback
// ────────────────────────────────────────────────────────────

let _translatorPromptCache = null;

function loadTranslatorPrompt() {
  if (_translatorPromptCache) return _translatorPromptCache;
  try {
    const raw = fs.readFileSync(TRANSLATOR_PROMPT_PATH, 'utf-8');
    const data = JSON.parse(raw);
    _translatorPromptCache = data;
    return data;
  } catch {
    return null;
  }
}

async function translateWithLLM(input) {
  const promptData = loadTranslatorPrompt();
  if (!promptData) {
    return { code: `think "${input}"`, explanation: 'Translator prompt not found — defaulting to think.' };
  }

  const examplesText = (promptData.examples || [])
    .map(e => `User: ${e.input}\nSwibe:\n${e.output}`)
    .join('\n\n');

  const fullPrompt = [
    promptData.system,
    '',
    '## Examples',
    examplesText,
    '',
    `## Translate this user input to valid Swibe code:`,
    `User: ${input}`,
    `Swibe:`,
  ].join('\n');

  try {
    const llm = new LLMIntegration();
    const result = await llm.think(fullPrompt, { max_tokens: 512 });
    const code = (result.content || '').trim();
    return {
      code: code || `think "${input}"`,
      explanation: `Translated natural language to Swibe syntax.`,
    };
  } catch (err) {
    return {
      code: `think "${input}"`,
      explanation: `LLM translation failed (${err.message}) — wrapped as think.`,
    };
  }
}

// ────────────────────────────────────────────────────────────
// Dot Commands
// ────────────────────────────────────────────────────────────

function buildDotCommands(state) {
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

Forgiving Mode:
  Type natural English and Swibe translates it for you.
  Examples: "what can you do", "create a swarm",
            "analyze code", "show my balance"
  Fast-path intents are matched locally.
  Unrecognized input falls back to LLM translation.

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
        console.log('Swibe v3.3.2');
      }
    },
    '.forgiving': () => {
      state.forgiving = true;
      console.log('🧠 Forgiving mode ON — type natural language and Swibe will translate.');
      console.log('   Use .strict to return to normal parsing.');
    },
    '.strict': () => {
      state.forgiving = false;
      console.log('⚙️ Strict mode ON — standard Swibe parsing restored.');
    },
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
  } catch {}
  return [];
}

function saveHistory(history) {
  try {
    fs.mkdirSync(path.dirname(HISTORY_FILE), { recursive: true });
    fs.writeFileSync(
      HISTORY_FILE,
      JSON.stringify(history.slice(-100), null, 2)
    );
  } catch {}
}

// ────────────────────────────────────────────────────────────
// Core Execution
// ────────────────────────────────────────────────────────────

async function executeSwibe(source, std) {
  const wrapped = source.includes('fn ')
    ? source
    : `fn main() {\n  ${source.split('\n').join('\n  ')}\n}`;

  const compiler = new Compiler(wrapped, 'javascript');
  const code = await compiler.compile();

  // The compiler's genJavaScript already wraps in an async IIFE
  // with its own main() call. Execute the compiled output directly.
  const fn = new Function(
    'std', 'console',
    `return (async () => {\n${code}\n})()`
  );
  await fn(std, console);
}

// ────────────────────────────────────────────────────────────
// Forgiving Handler
// ────────────────────────────────────────────────────────────

async function handleForgiving(source, std) {
  // Part 1: Try native intent parser (fast path)
  const intent = matchIntent(source);
  if (intent.matched) {
    const code = injectDefaults(intent.code);
    console.log(`\x1b[90m╭─ Understood: "${source}"\x1b[0m`);
    console.log(`\x1b[90m│  Intent: ${intent.intent}\x1b[0m`);
    console.log(`\x1b[90m╰─ Translated to:\x1b[0m`);
    console.log(`\x1b[36m${code}\x1b[0m`);
    console.log('');
    await executeSwibe(code, std);
    return;
  }

  // Part 2: LLM translator fallback
  console.log(`\x1b[33m⏳ Translating natural input...\x1b[0m`);
  const result = await translateWithLLM(source);
  const code = injectDefaults(result.code);

  console.log(`\x1b[90m╭─ Understood: "${source}"\x1b[0m`);
  console.log(`\x1b[90m│  ${result.explanation}\x1b[0m`);
  console.log(`\x1b[90m╰─ Translated to:\x1b[0m`);
  console.log(`\x1b[36m${code}\x1b[0m`);
  console.log('');
  await executeSwibe(code, std);
}

// ────────────────────────────────────────────────────────────
// REPL Entry Point
// ────────────────────────────────────────────────────────────

export async function startRepl(options = {}) {
  console.log(BANNER);

  const history = loadHistory();
  const std = new StandardLibrary();

  const state = {
    forgiving: options.forgiving || false,
  };

  const dotCommands = buildDotCommands(state);

  let multilineBuffer = '';
  let braceDepth = 0;

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

    // Empty line
    if (!trimmed) {
      if (braceDepth > 0) {
        multilineBuffer += '\n';
      }
      rl.setPrompt(promptStr());
      rl.prompt();
      return;
    }

    // Dot commands
    if (trimmed.startsWith('.')) {
      if (trimmed === '.exit' || trimmed === '.quit') {
        saveHistory(rl.history);
        console.log('\nÀṣẹ. Sovereign agent signing off. 🕊️');
        process.exit(0);
      }

      if (trimmed === '.history') {
        rl.history.slice(0, 20).forEach((h, i) => {
          console.log(`  ${i + 1}: ${h}`);
        });
        rl.setPrompt(promptStr());
        rl.prompt();
        return;
      }

      if (trimmed === '.reset') {
        Object.keys(std).forEach(k => {
          if (k.startsWith('_hermetic')) delete std[k];
        });
        std._budget = null;
        console.log('[REPL] VM state reset.');
        rl.setPrompt(promptStr());
        rl.prompt();
        return;
      }

      const cmd = dotCommands[trimmed];
      if (cmd) {
        cmd();
      } else {
        console.log(`Unknown command: ${trimmed}. Type .help`);
      }
      rl.setPrompt(promptStr());
      rl.prompt();
      return;
    }

    // Multi-line handling — count braces
    multilineBuffer += (multilineBuffer ? '\n' : '') + line;
    braceDepth += (line.match(/\{/g) || []).length;
    braceDepth -= (line.match(/\}/g) || []).length;

    // If braces not balanced, wait for more input
    if (braceDepth > 0) {
      rl.setPrompt('\x1b[33m  ...\x1b[0m ');
      rl.prompt();
      return;
    }

    // Reset prompt
    rl.setPrompt(promptStr());

    let source = multilineBuffer;
    multilineBuffer = '';
    braceDepth = 0;

    // Typo correction (both modes)
    const { corrected, corrections } = correctTypos(source);
    if (corrections.length > 0) {
      console.log(`\x1b[90m  ✏️  Auto-corrected: ${corrections.join(', ')}\x1b[0m`);
      source = corrected;
    }

    // In forgiving mode, try intent parser FIRST (before compile)
    if (state.forgiving) {
      try {
        await executeSwibe(source, std);
      } catch (err) {
        const isSyntax = err.message?.includes('Unexpected') ||
                         err.message?.includes('parse') ||
                         err.message?.includes('Expected');
        if (isSyntax) {
          try {
            await handleForgiving(source, std);
          } catch (innerErr) {
            console.error(
              `\x1b[31m[ERROR]\x1b[0m Translation also failed: ${innerErr.message}`
            );
          }
        } else {
          console.error(
            `\x1b[31m[ERROR]\x1b[0m ${err.message}`
          );
        }
      }
    } else {
      // Strict mode
      try {
        await executeSwibe(source, std);
      } catch (err) {
        if (err.message?.includes('Unexpected token') ||
            err.message?.includes('parse') ||
            err.message?.includes('Expected')) {
          console.error(
            `\x1b[31m[SYNTAX]\x1b[0m ${err.message}`
          );
          console.error(
            `\x1b[90m  💡 Tip: Type .forgiving to enable natural language mode.\x1b[0m`
          );
        } else {
          console.error(
            `\x1b[31m[ERROR]\x1b[0m ${err.message}`
          );
        }
      }
    }

    rl.prompt();
  });

  rl.on('close', () => {
    saveHistory(rl.history);
    console.log('\nÀṣẹ. 🕊️');
    process.exit(0);
  });

  // Handle Ctrl+C gracefully
  rl.on('SIGINT', () => {
    if (multilineBuffer) {
      multilineBuffer = '';
      braceDepth = 0;
      rl.setPrompt(promptStr());
      console.log('\n[REPL] Cancelled.');
      rl.prompt();
    } else {
      saveHistory(rl.history);
      console.log('\nÀṣẹ. 🕊️');
      process.exit(0);
    }
  });
}

// Legacy compat — SwibeREPL class wraps startRepl
class SwibeREPL {
  start(options = {}) {
    return startRepl(options);
  }
}

export { SwibeREPL };
