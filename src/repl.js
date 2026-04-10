/**
 * Swibe REPL v3.3
 * Interactive sovereign agent shell
 */

import readline from 'node:readline';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { Lexer } from './lexer.js';
import { Parser } from './parser.js';
import { Compiler } from './compiler.js';
import { StandardLibrary } from './stdlib.js';

const HISTORY_FILE = path.join(
  os.homedir(), '.swibe', 'repl-history.json'
);

const BANNER = `🌀 Swibe REPL v3.3
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
];

const DOT_COMMANDS = {
  '.help': () => {
    console.log(`Swibe REPL Commands:
  .help     — Show this help
  .exit     — Exit the REPL
  .clear    — Clear the screen
  .history  — Show command history
  .sabbath  — Check Sabbath status
  .reset    — Reset the VM state
  .version  — Show Swibe version

Primitives:
  think "prompt"
  swarm { think "task" }
  ethics { harm-none }
  ethics { mode: "hermetic" }
  birth { identity: "bipọn39" }
  budget { tokens: 1000 }
  remember { "key" }
  evolve { soul: "name", rank: 1 }
  heartbeat { every: 60s }
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
          path.join(process.cwd(), 'package.json'), 'utf-8'
        )
      );
      console.log(`Swibe v${pkg.version}`);
    } catch {
      console.log('Swibe v3.3');
    }
  },
};

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

function getHint(input) {
  if (!input || input.startsWith('.')) return '';
  const match = HINTS.find(h =>
    h.startsWith(input) && h !== input
  );
  return match ? match.slice(input.length) : '';
}

export async function startRepl() {
  console.log(BANNER);

  const history = loadHistory();
  const std = new StandardLibrary();

  let multilineBuffer = '';
  let braceDepth = 0;

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: '\x1b[36mswibe\x1b[0m \x1b[33m❯\x1b[0m ',
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
        rl.prompt();
        return;
      }

      if (trimmed === '.reset') {
        Object.keys(std).forEach(k => {
          if (k.startsWith('_hermetic')) delete std[k];
        });
        std._budget = null;
        console.log('[REPL] VM state reset.');
        rl.prompt();
        return;
      }

      const cmd = DOT_COMMANDS[trimmed];
      if (cmd) {
        cmd();
      } else {
        console.log(`Unknown command: ${trimmed}. Type .help`);
      }
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
    rl.setPrompt('\x1b[36mswibe\x1b[0m \x1b[33m❯\x1b[0m ');

    const source = multilineBuffer;
    multilineBuffer = '';
    braceDepth = 0;

    // Wrap bare statements in fn main()
    const wrapped = source.includes('fn ')
      ? source
      : `fn main() {\n  ${source.split('\n').join('\n  ')}\n}`;

    try {
      // Compile and execute
      const compiler = new Compiler(wrapped, 'javascript');
      const code = await compiler.compile();

      // Execute in stdlib context
      const fn = new Function(
        'std', 'console',
        `return (async () => {\n${code}\nawait main();\n})()`
      );
      await fn(std, console);
    } catch (err) {
      // Show friendly errors
      if (err.message?.includes('Unexpected token') ||
          err.message?.includes('parse')) {
        console.error(
          `\x1b[31m[SYNTAX]\x1b[0m ${err.message}`
        );
      } else {
        console.error(
          `\x1b[31m[ERROR]\x1b[0m ${err.message}`
        );
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
      rl.setPrompt('\x1b[36mswibe\x1b[0m \x1b[33m❯\x1b[0m ');
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
  start() {
    return startRepl();
  }
}

export { SwibeREPL };
