![Version](https://img.shields.io/badge/version-v3.1.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Tests](https://img.shields.io/badge/tests-97%20passing-brightgreen)
![Backends](https://img.shields.io/badge/backends-44-orange)
[![npm](https://img.shields.io/badge/npm-@bino--elgua/swibe-brightgreen)](https://www.npmjs.com/package/@bino-elgua/swibe)

# Swibe: Agent-Native Scripting Language (v3.1.0)

**Autonomous swarms, self-healing loops, and world creation from one sentence.**

Swibe is a sovereign programming language where agents, prompts, neural layers, and secure execution are first-class citizens. Write declarative agentic code that compiles to 44 backend targets, runs self-repairing swarms, and persists state via a BIP-39 ritual vault.

v3.1 adds a full tool system with granular permissions, MCP integration, agentic think loops, hierarchical memory, bidirectional IDE bridge, advanced multi-agent coordination (hierarchical/democratic/competitive/pipeline), and production hardening with cost tracking, A/B analytics, and org-level policy controls.

## Installation

```bash
npm i -g @bino-elgua/swibe
```

For local development:

```bash
git clone https://github.com/Bino-Elgua/Swibe.git
cd Swibe
npm install
npm test    # 97 tests across 6 suites
```

## Quick Start

```swibe
-- Sovereign agent with full tool system
ethics {
  harm_none: true;
  sovereign_data: true;
  receipt_chain: true
}

permission {
  think: "auto";
  bash: "plan";
  mint: "ask"
}

think "Analyze codebase for security issues" {
  loop: true,
  max_iterations: 5
}

budget {
  tokens: 100000;
  time: "300s"
}
```

```bash
swibe run agent.swibe
```

## CLI Commands

| Command | Description |
|---|---|
| `swibe run <file.swibe>` | Execute a Swibe agent |
| `swibe compile <file> --target <lang>` | Compile to any of 44 targets |
| `swibe repl` | Interactive REPL with history, tab completion, Sabbath awareness |
| `swibe init <template> [name]` | Scaffold from template (`basic-agent`, `swarm`, `hybrid`, `chain`, `daily`) |
| `swibe watch <file.swibe>` | Hot-reload on file changes |
| `swibe debug <file> --target <lang>` | Debug with lexer/parser/compile timing + AST stats |
| `swibe daemon <file.swibe>` | Run headless agent (PID managed in `~/.swibe/`) |
| `swibe daemon:stop` | Stop running daemon |
| `swibe route <file.swibe>` | Show neural LLM routing report |
| `swibe docs [--live]` | Auto-generate documentation from examples |
| `swibe plugin list` | List installed plugins |
| `swibe docker dockerfile --lang <lang>` | Generate Dockerfile, Lambda, GCP, Azure, systemd configs |
| `swibe agent <file> --gen-class <name>` | Extract and generate agent classes |
| `swibe api <file> --format <express\|graphql\|openapi\|fastapi>` | Generate API scaffolding |
| `swibe microservice <name> --port <n>` | Generate microservice scaffold |
| `swibe pkg manifest\|install\|publish` | Package management |

## Language Primitives

### Core Primitives

| Primitive | Purpose |
|---|---|
| `think` | LLM reasoning with agentic tool-call loops and receipt sealing |
| `chain` | LangChain-style sequential reasoning steps |
| `plan` | Semantic Kernel-style goal decomposition |
| `swarm` | Multi-agent coordination (async in JS, OTP in Elixir) |
| `loop until` | Self-healing execution — runs until a goal is verified |
| `budget` | Token, time, and USD cost limits with alert thresholds |
| `remember` | Three-tier hierarchical memory (working/short-term/long-term) |
| `evolve` | Soul-state evolution |
| `observe` | Event listeners and hooks |
| `ethics` | Runtime ethical guardrails (Hermetic principles) |
| `neural` | Neural layer simulation (86B internal neurons) |
| `meta-digital` | Chained skill execution with `refuse_if` ethical filters |
| `secure { }` | Restricted `vm` execution sandbox |
| `app { }` | Declare full applications in one block |
| `%%` | Prompt-splice — natural language as compiled syntax |
| `mint` / `receipt` / `seal` / `walrus` | Sui blockchain primitives |
| `@target` | Multi-target directives (`@elixir`, `@move`, `@rust`) |

### Phase 2: Tool System + MCP + Permissions

| Primitive | Purpose |
|---|---|
| `permission` | Granular permission matrix — `auto` / `ask` / `plan` / `refuse` per action |
| `mcp` | Model Context Protocol server connections (filesystem, GitHub, databases) |
| `team` | Role-based multi-agent teams with coordination modes |
| `edit` | Partial file modification via string replacement |
| `skill` | Reusable capability definitions with prompt templates and tool lists |

```swibe
permission {
  think: "auto";
  bash: "plan";
  mint: "ask";
  net: "refuse"
}

mcp {
  server: "filesystem";
  transport: "stdio"
}

team "DevTeam" {
  architect: "designs the system architecture";
  coder: "implements the design";
  reviewer: "audits for ethics and quality";
  coordination: "hierarchical"
}

edit "src/main.swibe" {
  replace: "old_function()";
  with: "new_function()"
}
```

### Phase 3: IDE Bridge + Session Management

| Primitive | Purpose |
|---|---|
| `bridge` | Bidirectional IDE connection — JSON-RPC 2.0 over stdio or TCP |
| `session` | Persistent agent sessions — create, resume, pause across IDE restarts |

```swibe
bridge "sovereign-ide" {
  transport: "tcp";
  port: 6271
}

session "dev-sprint" {
  action: "create"
}
```

The IDE bridge enables:
- Two-way communication between Swibe runtime and VSCode/JetBrains
- Permission request callbacks (runtime asks IDE user for approval)
- REPL evaluation via bridge (evaluate selection in editor)
- Session persistence across IDE restarts
- Real-time diagnostics push

### Phase 4: Advanced Agent Coordination

| Primitive | Purpose |
|---|---|
| `coordinate` | Dispatch tasks to teams with strategy selection |

Four coordination strategies:

| Strategy | How It Works |
|---|---|
| `hierarchical` | Lead agent plans, delegates to workers, synthesizes results |
| `democratic` | All agents solve independently, vote on best result (weighted) |
| `competitive` | Agents race — fastest valid result wins |
| `pipeline` | Sequential pass-through, each agent transforms the output |

```swibe
team "SecurityTeam" {
  lead: "designs audit strategy [design, review]";
  scanner: "runs static analysis [scan, lint]";
  reviewer: "reviews findings for ethics [audit, ethics]";
  coordination: "hierarchical"
}

coordinate "Audit codebase for OWASP top 10" {
  strategy: "hierarchical";
  team: "SecurityTeam"
}
```

### Phase 5: Production Hardening

| Primitive | Purpose |
|---|---|
| `policy` | Org-level controls — per-user token/USD limits, forbidden operations, rate limiting |
| `analytics` | A/B experiment management for model selection, custom metrics tracking |
| `budget` (enhanced) | USD cost tracking with model pricing table and alert thresholds |

```swibe
policy "sovereign-org" {
  max_tokens_per_user: 500000;
  max_usd_per_user: 10;
  forbidden: "rm_rf"
}

budget {
  tokens: 200000;
  time: "600s";
  cost_usd: 5
}

analytics model_routing {
  experiment: "model_comparison";
  variants: "claude_sonnet"
}
```

Cost tracking supports model-specific pricing (Claude Opus/Sonnet/Haiku, GPT-4o, Ollama free models) with automatic USD calculation and configurable alert thresholds at 80%/100% utilization.

## 44 Compilation Targets

Swibe backends are pure codegen emitters, mapping agentic primitives to native constructs.

### Tier 1: High-Speed & Embedded
| Target | Architecture | Use Case |
|---|---|---|
| **JavaScript** | Async/Node | Universal runtime (default) |
| **TypeScript** | Typed Async | Web + type-safe agents |
| **Lua** | Coroutines | Tiny embedded agents |
| **Nim** | Macros/DSL | High-performance edge |
| **Crystal** | Fibers | Safe concurrency |
| **Janet** | Lisp Macros | Scripting/embed |
| **Scheme** | Lambdas | Minimal footprint |

### Tier 2: Systems & Safety
| Target | Architecture | Use Case |
|---|---|---|
| **Rust** | Threads/Safety | Sovereign enforcers |
| **Go** | Goroutines | High-scale workers |
| **Zig** | Comptime | Zero-overhead edge |
| **V** | Auto-free | Fast-compile vaults |
| **Odin** | Data-Oriented | Neural sim crunching |
| **OCaml** | Functors | Formal skill proofs |
| **F#** | Async Workflows | Typed .NET receipts |
| **Clojure** | Atoms/STM | Immutable swarms |
| **Haskell** | Monads | Pure ethical chaining |

### Tier 3: Scientific & Scripting
| Target | Architecture | Use Case |
|---|---|---|
| **Python** | Asyncio | ML/data pipelines |
| **R** | Vectors | Statistical agents |
| **Julia** | Matrix/SIMD | Scientific compute |
| **Ruby** | Blocks | Rapid prototyping |
| **Perl** | Regex/glue | Text processing |
| **Lisp** | S-expressions | Symbolic reasoning |
| **Matlab** | Matrix ops | Engineering compute |
| **Wolfram** | Symbolic | Mathematical agents |

### Tier 4: Exotic & Specialized
**Pony** (lock-free actors), **Aether** (work-stealing queues), **Mojo** (SIMD kernels), **Sui Move** (on-chain soul), **APL** (tensor ops), **J** (vector processing), **K** (event streams), **Forth** (stack machine), **Prolog** (logic judge), **Mercury** (deterministic), **Ada** (crash-proof), **COBOL** (batch audit), **Smalltalk** (live object), **D** (contract guard), **Raku** (grammar ethics), **Scala** (Akka scale), **Idris** (dependent types), **WASM** (browser/edge), **OpenClaw** (agent skill deployment)

## LLM Providers

Swibe supports multiple LLM backends via a provider fallback chain:

**Ollama -> OpenRouter -> Claude -> Mock**

| Provider | Setup | Cost |
|---|---|---|
| Ollama (default) | `ollama serve` locally | Free |
| OpenRouter | Set `OPENROUTER_API_KEY` | Free tier available |
| Claude | Set `ANTHROPIC_API_KEY` | Paid |

**Free OpenRouter models:**
- `meta-llama/llama-3.3-70b-instruct:free`
- `mistralai/mistral-7b-instruct:free`
- `google/gemma-2-9b-it:free`

## Neural Model Routing

`SovereignNeuralLayer` uses 86 cortical birth parameters to select LLM models:

```
prefrontal  [12 weights] -> reasoning model selection
hippocampus [18 weights] -> memory capacity
amygdala    [ 8 weights] -> ethics threshold (>0.7 -> safety model)
temporal    [16 weights] -> language weights
occipital   [12 weights] -> pattern weights
cerebellum  [10 weights] -> coordination
brainstem   [ 4 weights] -> entropy sensitivity
parietal    [ 6 weights] -> economic weights
```

```javascript
const layer = SovereignNeuralLayer.random();
const model = layer.getTopModel();      // prefrontal-weighted selection
const safe  = layer.getEthicsModel();   // amygdala-gated safety model
const report = layer.getRoutingReport(); // full fingerprint + metrics
```

## Sovereign Identity & Vault

Agents are born with a sovereign identity derived from a Yoruba-inspired BIP-39 ritual phrase. This identity secures the agent's RAG memory and signs every execution receipt.

- **BIP-39 ritual phrase** generation (e.g., `esu-gate sango-volt`)
- **Ed25519 keypairs** (SPKI/PKCS8 encoded) from deterministic seed derivation
- **SHA-256 receipt chain** — every `think` call produces an auditable receipt
- **AES-256-GCM** encryption for vault storage

## Hermetic Ethics Engine (v3.1)

Opt-in runtime enforcement of 7 Hermetic principles:

1. **Mentalism** — intent required before action
2. **Correspondence** — soul karma tracking
3. **Vibration** — refusals have configurable TTL cooldowns
4. **Polarity** — refusals redirect to constructive opposites
5. **Rhythm** — Sabbath guard (Saturday/Sunday awareness)
6. **Cause-Effect** — receipt chain enforcement
7. **Gender** — consensus token required for critical actions (e.g., `mint`)

The `EthicsValidator` AST visitor enforces structural constraints at parse time:
- `mcp` and `bridge` require a `permission {}` block
- `edit` requires an `ethics {}` declaration
- `policy` requires an `ethics {}` declaration
- Think loops without `budget {}` produce informational diagnostics

## Permission System

Granular per-action permission control with four modes:

| Mode | Behavior |
|---|---|
| `auto` | Auto-approve (safe actions like `think`, `chain`) |
| `ask` | Always prompt the user for approval |
| `plan` | Ask once per session, then auto-approve |
| `refuse` | Always deny |

The `PermissionGate` modulates permissions based on the agent's ethics threshold from `SovereignNeuralLayer`. High-ethics agents get stricter defaults; all decisions are logged to a sealed audit chain.

## MCP Integration

Swibe is MCP-native, connecting to any [Model Context Protocol](https://modelcontextprotocol.io/) tool server:

```swibe
mcp {
  server: "filesystem";
  transport: "stdio"
}
```

The `MCPHub` manages multiple server connections with JSON-RPC 2.0 (stdio or HTTP transport), automatic tool discovery, and permission gate integration.

## Three-Tier Memory Engine

The `MemoryEngine` provides hierarchical memory beyond simple RAG:

| Tier | Persistence | Use Case |
|---|---|---|
| **Working** | Volatile (in-memory) | Current task context |
| **Short-term** | Persisted, auto-pruned | Recent facts, session state |
| **Long-term** | Permanent, encrypted | Core knowledge, identity |

Features: auto-extraction of definitions/entities/action items from text, context compression when working memory exceeds threshold, cross-agent memory sharing (export/import).

## Agentic Think Loops

`think` is upgraded from single-shot to iterative tool-call loops:

```swibe
think "Review the codebase and find security issues" {
  loop: true,
  max_iterations: 5
}
```

The `ThinkLoop` engine parses tool calls from LLM output, executes them via the `ToolRegistry`, feeds results back, and repeats until goal achieved or budget exhausted. Built-in tools: `read_file`, `write_file`, `edit_file`, `list_files`, `bash`. Every iteration is sealed into a trajectory receipt.

## IDE Bridge & Session Management

Bidirectional communication between Swibe runtime and IDEs:

- **JSON-RPC 2.0** protocol over TCP (port 6271) or stdio
- **SessionManager** — persistent sessions with create/resume/pause/destroy
- **Permission callbacks** — runtime asks IDE user for approval via modal dialog
- **REPL bridge** — evaluate Swibe code from editor selection
- **Real-time diagnostics** — push parse errors and ethics violations to IDE

### VSCode Extension (v3.1.0)

Install from the `vscode-extension/` directory:

```bash
cd vscode-extension && npm install && npm run compile
```

Features:
- Syntax highlighting + Swibe Dark/Light themes
- LSP server with real-time diagnostics, hover docs, document symbols
- Completions for all 35+ keywords with documentation
- Commands: Compile (Ctrl+Shift+B), REPL (Ctrl+Shift+R), Eval Selection (Ctrl+Shift+E)
- Bridge connection panel, session management UI
- Permission request modal (Allow / Allow for Session / Deny)

## Ecosystem & Plugins

### Plugin System
Any ecosystem can implement the `SwibePlugin` contract:
- `onBirth(agent)` — inject entropy or register identity
- `onThink(prompt)` — pre-reasoning audit
- `onReceipt(receipt)` — post-execution verification
- `onSettle(result)` — final value settlement

```bash
swibe run agent.swibe --plugin ./my-adapter.js
```

### OpenClaw Integration
Compile Swibe agents to OpenClaw skill packages:
```bash
swibe compile agent.swibe --target openclaw
# Generates SKILL.md, agent.js, SOUL.md
openclaw skill install ./openclaw-out
```

## Project Structure

```
src/
  index.js              # CLI entry point
  lexer.js              # Tokenizer (90+ token types)
  parser.js             # AST parser (EBNF grammar, 20+ statement types)
  compiler.js           # Multi-target compiler (44 backends)
  stdlib.js             # Standard library (think, swarm, budget, ethics, etc.)
  neural.js             # SovereignNeuralLayer (86B neurons, cortical routing)
  sovereign-vault.js    # BIP-39 + Ed25519 + AES-256-GCM identity
  repl.js               # Interactive REPL
  visitor.js            # AST visitors (ThinkCollector, EthicsValidator)
  permissions.js        # PermissionGate with ethics-modulated access control
  mcp-client.js         # MCPConnection + MCPHub (JSON-RPC 2.0)
  think-loop.js         # Agentic iteration engine with tool registry
  memory-engine.js      # Three-tier hierarchical memory
  ide-bridge.js         # Bidirectional IDE bridge + SessionManager
  agent-coordinator.js  # Advanced multi-agent coordination (4 strategies)
  production.js         # CostTracker, Analytics, PolicyEngine
  type-inference.js     # Static type inference
  conductor.js          # Technosis Sovereign Conductor
  backends/             # 44 codegen backends
  plugins/              # Plugin implementations
tests/                  # 97 tests (vitest) across 6 suites
spec/                   # Formal grammar (EBNF), execution model, security model
examples/               # 36 example .swibe files
docs/                   # Landing page (Vercel/Netlify ready)
registry/               # Cloudflare Worker package registry
vscode-extension/       # VSCode extension (LSP, bridge, themes, snippets)
pwa/                    # Progressive Web App playground
web-playground/         # Browser-based Swibe editor
swibe-openclaw/         # OpenClaw bridge package
adapters/               # Ecosystem adapters (oso, seemplify)
grammar.ebnf            # Full EBNF specification
```

## Test & Audit Status

| Suite | Tests | Status |
|---|---|---|
| Core (v0.4) | 5 | Pass |
| SovereignNeuralLayer | 5 | Pass |
| Extensions (v0.5) | 10 | Pass |
| v2.0 Primitives | 14 | Pass |
| v2.0 Phase D — Plugins | 3 | Pass |
| OpenClaw Integration | 3 | Pass |
| v3.1 Hermetic Ethics | 5 | Pass |
| v3.2 Compiler Hardening | 5 | Pass |
| v3.3 REPL | 5 | Pass |
| v3.4 VSCode Extension | 4 | Pass |
| v3.6+v3.7 Registry + Docs | 5 | Pass |
| Backend Suites (Tier 1-3) | 33 | Pass |
| **Total** | **97** | **All passing** |

## Roadmap

| Version | Status | Highlights |
|---|---|---|
| v0.1-v0.4 | Complete | Lexer, parser, backends, neural layer |
| v1.0 | Complete | Agent runtime, sovereign vault, RAG |
| v1.1 | Complete | Hybrid compiler, swarm OTP, plugin system |
| v1.2 | Complete | Python/R/Lisp/Matlab/Wolfram backends |
| v1.3 | Complete | VSCode LSP, PWA real LLM, think real primitive |
| v2.x | Complete | budget/remember/evolve/observe/ethics, shared state, swarm.scale |
| v3.0-v3.1 | Complete | OpenClaw integration, Hermetic ethics engine |
| v3.2 | Complete | Compiler hardening, type inference, AST visitor |
| v3.3 | Complete | Interactive REPL with history, tab completion, Sabbath |
| v3.4 | Complete | VSCode extension (syntax, snippets, theme, commands) |
| v3.5-v3.7 | Complete | Registry hardening, Cloudflare registry worker, docs |
| **v3.1.0** | **Current** | Phase 2: Permission system, MCP, think loops, memory engine |
| | | Phase 3: IDE bridge, session management, two-way communication |
| | | Phase 4: Advanced agent coordination (4 strategies) |
| | | Phase 5: Cost tracking, A/B analytics, policy engine |
| **Next** | Planned | TypeScript core migration, WASM runtime, production RAG |

## Environment Variables

See `.env.example` for full configuration. Key variables:

| Variable | Purpose |
|---|---|
| `OPENROUTER_API_KEY` | OpenRouter LLM access (free tier available) |
| `OPENROUTER_DEFAULT_MODEL` | Default model for think calls |
| `ANTHROPIC_API_KEY` | Claude API access |
| `OLLAMA_URL` | Local Ollama endpoint (default: `localhost:11434`) |
| `SWIBE_LOOP_MAX` | Max iterations for `loop until` (default: 10) |
| `SWIBE_CONSENSUS_TOKEN` | Consensus token for Hermetic Gender principle |
| `TELNYX_API_KEY` | Telephony plugin (optional) |
| `DEBUG` | Enable debug output |

## Part of the Technosis Sovereign Ecosystem

Swibe is a foundational component of a larger architecture for creating and coordinating sovereign AI. For more information on the complete system, see the [organism-core repository](https://github.com/Bino-Elgua/organism-core).

---

**EMI NI BINO EL GUA**
Ase.
