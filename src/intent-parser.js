/**
 * Swibe Intent Parser — Native fast-path for forgiving REPL mode
 * 
 * Lightweight keyword/regex recognizer that translates common natural
 * language intents into valid Swibe code WITHOUT an LLM call.
 * Falls through to the LLM translator when no intent matches.
 */

// ────────────────────────────────────────────────────────────
// Intent Definitions
// ────────────────────────────────────────────────────────────

const INTENTS = [
  {
    name: 'self-intro',
    patterns: [
      /^(what can you do|who are you|introduce yourself|help me|capabilities|what are you)\??$/i,
      /^(tell me about yourself|what is swibe|explain swibe)\??$/i,
    ],
    generate: () =>
      `think "Describe your capabilities as a sovereign Swibe agent. List your primitives (think, swarm, chain, plan, loop, ethics, permission, budget, remember, evolve, witness, pilot, viewport, gestalt, mcp, wallet, token, convert, royalty, escrow, secure, neural, birth, heartbeat, edit, coordinate, team), your layered architecture (Layer 0 Ethics → Layer 5 Neural), and your sovereign philosophy. End with Àṣẹ."`,
  },
  {
    name: 'create-swarm',
    patterns: [
      /^create\s+(a\s+)?(.+?\s+)?swarm(.*)$/i,
      /^(launch|start|spin up|build)\s+(a\s+)?(.+?\s+)?swarm(.*)$/i,
    ],
    generate: (match) => {
      const desc = (match[2] || match[3] || '').trim() || 'general';
      return [
        `ethics { harm_none: true; mode: "hermetic" }`,
        `permission { think: "auto" }`,
        `swarm {`,
        `  think "Perform ${desc} analysis — phase 1: reconnaissance"`,
        `  think "Perform ${desc} analysis — phase 2: deep inspection"`,
        `  think "Perform ${desc} analysis — phase 3: synthesis and report"`,
        `}`,
      ].join('\n');
    },
  },
  {
    name: 'analyze-code',
    patterns: [
      /^(analyze|audit|review|scan|check)\s+(the\s+)?(code|codebase|project|repo|source)(.*)$/i,
      /^(security|vulnerability|bug)\s+(audit|scan|check|review)(.*)$/i,
    ],
    generate: (match) => {
      const task = match[0].trim();
      return [
        `ethics { harm_none: true }`,
        `permission { think: "auto"; bash: "simulate" }`,
        `think "${task}" { loop: true, tools: ["read_file", "list_files"] }`,
      ].join('\n');
    },
  },
  {
    name: 'show-balance',
    patterns: [
      /^(show|check|display|get|what'?s?)\s+(my\s+)?(token|dopamine|toc|wallet|balance|stake)(.*)$/i,
    ],
    generate: () =>
      `wallet { token: "toc_s" }\nprintln("Querying sovereign token balance... Àṣẹ.")`,
  },
  {
    name: 'remember',
    patterns: [
      /^remember\s+(.+)$/i,
      /^(save|store|memorize|record)\s+(.+)$/i,
    ],
    generate: (match) => {
      const key = (match[1] || match[2] || 'context').trim();
      return `remember { "${key}" }`;
    },
  },
  {
    name: 'think',
    patterns: [
      /^(think about|ponder|reason about|consider|reflect on)\s+(.+)$/i,
    ],
    generate: (match) => {
      const topic = match[2].trim();
      return `think "${topic}"`;
    },
  },
  {
    name: 'create-chain',
    patterns: [
      /^(create|build|make)\s+(a\s+)?chain(.*)$/i,
    ],
    generate: (match) => {
      const desc = (match[3] || '').trim() || 'multi-step task';
      return [
        `chain {`,
        `  think "Step 1: Plan the ${desc}"`,
        `  think "Step 2: Execute the ${desc}"`,
        `  think "Step 3: Verify the ${desc}"`,
        `}`,
      ].join('\n');
    },
  },
  {
    name: 'create-agent',
    patterns: [
      /^(create|build|spawn|launch)\s+(a\s+|an\s+)?(.+?\s+)?(agent|bot)(.*)$/i,
    ],
    generate: (match) => {
      const kind = (match[3] || '').trim() || 'sovereign';
      return [
        `ethics { harm_none: true; mode: "hermetic" }`,
        `permission { think: "auto"; bash: "ask" }`,
        `budget { tokens: 50000; time: "60s" }`,
        `think "Initialize as a ${kind} agent. Describe your purpose and begin work."`,
      ].join('\n');
    },
  },
  {
    name: 'set-ethics',
    patterns: [
      /^(set|enable|activate)\s+(hermetic|strict|permissive)\s+(ethics|mode)(.*)$/i,
    ],
    generate: (match) => {
      const mode = match[2].toLowerCase();
      return `ethics { harm_none: true; mode: "${mode}" }`;
    },
  },
  {
    name: 'heartbeat',
    patterns: [
      /^(monitor|watch|heartbeat|check every|run every)\s+(.+)$/i,
    ],
    generate: (match) => {
      const desc = match[2].trim();
      return `heartbeat { every: 60s; check: "${desc}" }`;
    },
  },
];

// ────────────────────────────────────────────────────────────
// Intent Matcher
// ────────────────────────────────────────────────────────────

/**
 * Attempt to match natural language input to a known intent.
 * @param {string} input — Raw user input
 * @returns {{ matched: boolean, intent?: string, code?: string }}
 */
export function matchIntent(input) {
  const trimmed = input.trim();
  if (!trimmed) return { matched: false };

  for (const intent of INTENTS) {
    for (const pattern of intent.patterns) {
      const match = trimmed.match(pattern);
      if (match) {
        const code = intent.generate(match);
        return {
          matched: true,
          intent: intent.name,
          code,
        };
      }
    }
  }

  return { matched: false };
}

/**
 * Inject default ethics + permission blocks if the code lacks them.
 * Only used in forgiving mode to ensure safe defaults.
 */
export function injectDefaults(code) {
  const hasEthics = /\bethics\s*\{/.test(code);
  const hasPermission = /\bpermission\s*\{/.test(code);

  const parts = [];
  if (!hasEthics) {
    parts.push('ethics { harm_none: true; mode: "permissive" }');
  }
  if (!hasPermission) {
    parts.push('permission { think: "auto" }');
  }
  if (parts.length > 0) {
    return parts.join('\n') + '\n' + code;
  }
  return code;
}
