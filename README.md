![Version](https://img.shields.io/badge/version-v3.3.1-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Tests](https://img.shields.io/badge/tests-363%20passing-brightgreen)
![Backends](https://img.shields.io/badge/backends-44-orange)
[![npm](https://img.shields.io/badge/npm-@bino--elgua/swibe-brightgreen)](https://www.npmjs.com/package/@bino-elgua/swibe)

# Swibe: Agent-Native Scripting Language (v3.3.1)

**Autonomous swarms, self-healing loops, and world creation from one sentence.**

Swibe is a sovereign programming language where agents, prompts, neural layers, and secure execution are first-class citizens. Write declarative agentic code that compiles to 44 backend targets, runs self-repairing swarms, and persists state via a BIPỌ̀N39 ritual vault.

v3.3 adds a complete three-token economy (Àṣẹ/Dopamine/Synapse) with neural birth endowment (86B Dopamine + 86M Synapse per agent), burn conversions, creator royalties, job escrow, and staking/slashing.

v3.3.1 introduces **Security Hardening**: strict layer enforcement, formal `secure` block policies (`llm_routing`, `receipt_sealing`), `simulate` permission mode, Merkle-hardened receipt chains, and the Sovereign Readiness Report.

## Installation

```bash
npm i -g @bino-elgua/swibe
```

For local development:

```bash
git clone https://github.com/Bino-Elgua/Swibe.git
cd Swibe
npm install
npm test    # 363 tests passing
```

## Quick Start

```swibe
-- Fully Hardened Sovereign Agent
-- Layer 0: Ethics & Identity
ethics { harm_none: true; sovereign_data: true }
secure { 
  execution: "strict-vm"; 
  llm_routing: "ethics_only"; 
  strict: true 
}

-- Layer 1: Core Agent
permission { think: "auto"; bash: "simulate"; mint: "ask" }
budget { tokens: 100000; time: "300s" }

think "Analyze codebase for security issues" {
  loop: true,
  max_iterations: 5
}
```

```bash
swibe run agent.swibe
```

## CLI Commands

| Command | Description |
|---------|-------------|
| `swibe run <file.swibe>` | Execute a Swibe agent |
| `swibe compile <file> --target <lang>` | Compile to any of 44 targets |
| `swibe repl` | Interactive REPL with history, tab completion, Sabbath awareness |
| `swibe init <template> [name]` | Scaffold from template (`basic-agent`, `swarm`, `hybrid`, `chain`, `daily`) |
| `swibe watch <file.swibe>` | Hot-reload on file changes |
| `swibe debug <file> --target <lang>` | Debug with lexer/parser/compile timing + AST stats |
| `swibe daemon <file.swibe>` | Run headless agent (PID managed in `~/.swibe/`) |
| `swibe daemon:stop` | Stop running daemon |
| `swibe route <file.swibe>` | Show neural routing & permission matrix report |
| `swibe token audit` | Audit agent token balances, burns, and slashes |
| `swibe docs [--live]` | Auto-generate documentation from examples |
| `swibe plugin list` | List installed plugins |
| `swibe docker dockerfile --lang <lang>` | Generate Dockerfile, Lambda, GCP, Azure, systemd configs |
| `swibe agent <file> --gen-class <name>` | Extract and generate agent classes |
| `swibe api <file> --format <express\|graphql\|openapi\|fastapi>` | Generate API scaffolding |
| `swibe microservice <name> --port <n>` | Generate microservice scaffold |
| `swibe pkg manifest\|install\|publish` | Package management |

## Four-Layer Architecture

Swibe enforces a layered declaration model. The compiler validates that lower layers are declared before higher ones, producing warnings on out-of-order declarations. This makes large agent files easier to read, audit, and reason about.

| Layer | Name | Primitives | Purpose |
|-------|------|-----------|---------|
| **0** | **Ethics & Identity** | `ethics`, `secure`, `neural`, `wallet`, `token` | Foundation — who the agent is and what it believes |
| **1** | **Core Agent** | `think`, `remember`, `budget`, `permission`, `skill`, `chain`, `plan` | Cognition — how the agent reasons and what it's allowed to do |
| **2** | **Coordination** | `swarm`, `team`, `coordinate`, `gestalt` | Social — how agents work together |
| **3** | **Execution** | `pilot`, `witness`, `mcp`, `edit`, `bridge`, `viewport` | Action — how agents interact with the world |

```swibe
-- Correct ordering: Layer 0 → 1 → 2 → 3
ethics { harm_none: true }
secure { execution: "strict-vm"; network: "refuse"; audit: "on" }
permission { think: "auto"; pilot: "ask"; mint: "quarantine" }
budget { tokens: 100000; time: "300s" }
team "DevTeam" { architect: "design"; coder: "implement" }
pilot { mode: "browser"; safe_mode: true }
```

## Language Primitives

### Core Primitives

| Primitive | Purpose |
|-----------|---------|
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

### Formal Security Layer

The `secure` block enforces real sandboxing with policy-driven isolation. It sits at Layer 0 alongside `ethics` and controls what the runtime can access:

```swibe
secure {
  execution: "strict-vm";
  network: "refuse";
  filesystem: "read-only";
  memory: "encrypted";
  receipts: "mandatory";
  audit: "on"
}
```

| Policy | Values | Effect |
|--------|--------|--------|
| `execution` | `strict-vm`, `standard` | Isolation level for the runtime sandbox |
| `network` | `refuse`, `allow` | Block or allow network access inside sandbox |
| `filesystem` | `read-only`, `refuse`, `allow` | Control filesystem access |
| `memory` | `encrypted`, `standard` | Encrypt in-memory state |
| `receipts` | `mandatory`, `optional` | Require sealed receipts for every action |
| `audit` | `on`, `off` | Log every operation for review |

The compiler validates policy fields at parse time and generates isolated runtimes — especially useful for Rust, Zig, and WASM targets.

### Tool System, MCP & Permissions

| Primitive | Purpose |
|-----------|---------|
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

### IDE Bridge & Session Management

| Primitive | Purpose |
|-----------|---------|
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

### Advanced Agent Coordination

| Primitive | Purpose |
|-----------|---------|
| `coordinate` | Dispatch tasks to teams with strategy selection |

Four coordination strategies:

| Strategy | How It Works |
|----------|--------------|
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

### Production Hardening

| Primitive | Purpose |
|-----------|---------|
| `policy` | Org-level controls — per-user token/USD limits, forbidden operations, rate limiting |
| `analytics` | A/B experiment management for model selection, custom metrics tracking |

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

### Multimodal Perception & Computer Control

```swibe
-- Multimodal perception
witness {
  modalities: "image,audio,document";
  fusion: "unified_context";
  max_concurrent: 4
}

-- Computer control (browser/desktop/mobile)
pilot {
  mode: "browser";
  safe_mode: true;
  max_actions: 50
}

-- Screen understanding with OCR
viewport {
  width: 1920;
  height: 1080;
  accessibility: true;
  ocr: true
}

-- Parallel tool execution with merge strategies
gestalt {
  search: "find vulnerabilities";
  analyze: "review patterns";
  scan: "check dependencies";
  merge: "unified_context"
}
```

**Witness** processes image, video, audio, and document inputs with configurable fusion strategies (unified_context, weighted, sequential). **Pilot** provides a perceive/act cycle for browser, desktop, and mobile automation with safety guards. **Viewport** captures screen state, builds accessibility trees, extracts UI elements, and runs OCR. **Gestalt** executes multiple tool operations concurrently with five merge strategies: unified_context, first_wins, majority_vote, concatenate, and reduce.

### ToC Tokenomics — Three-Token Economy

```swibe
-- Define the three tokens
token "ase" {
  name: "Àṣẹ";
  holders: "humans_and_creators";
  daily_mint: 1440
}

token "toc_d" {
  name: "Dopamine";
  holders: "agents_only";
  birth_endowment: 86000000000;
  daily_decay: "1%"
}

token "toc_s" {
  name: "Synapse";
  holders: "agents_only";
  birth_endowment: 86000000
}

-- Agent wallet (born with 86B Dopamine + 86M Synapse)
wallet "drone_agent" {
  type: "agent";
  birth: true
}

-- Burn conversion: Àṣẹ → Dopamine (one-way, 1:10000)
convert {
  from: "ase";
  to: "toc_d";
  ratio: "10000_per_ase";
  direction: "one_way"
}

-- Creator royalty: 10% Àṣẹ, locked 7 days
royalty {
  recipient: "agent_creator";
  token: "ase";
  percentage: "10%";
  vesting: "sabbath"
}

-- Job escrow: human locks Àṣẹ until verification
escrow "delivery_job" {
  human: "user_001";
  agent: "drone_agent";
  amount: 1
}
```

**Three tokens, three purposes:** Àṣẹ is the human entry token (fixed supply, 1440/day mint, 5% burn per job). Dopamine is agent internal fuel (86B at birth, 1% daily decay, burned for every action). Synapse is agent commerce (86M at birth, earned by burning Dopamine at 10:1). The neural mapping is exact — 86 billion Dopamine maps to 86 billion neurons, 86 million Synapse maps to 86 million synaptic bundles. Creators earn Àṣẹ royalties (10%, locked 7 days). Staking/slashing enforces economic security. All conversions are one-way burns — deflationary by design.

**Token Hardening Rules:**

| Rule | Enforcement |
|------|-------------|
| **Staking gate** | Agents must stake 10% of Synapse to run `pilot` or `mint` |
| **Ethics slashing** | 25% Dopamine slashed on ethics violations |
| **Budget slashing** | 10% Dopamine slashed on budget overruns |
| **Escrow timeout** | Auto-refund Àṣẹ if job not completed in 7 days (configurable) |
| **Burn audit trail** | Every Dopamine burn links to a sealed receipt hash |

## Security & Hardening (v3.3.1)

Swibe v3.3.1 introduces a formal security framework based on layered architecture and policy-driven sandboxing.

### Sovereign Readiness Report
The compiler now performs a pre-compile static analysis pass that runs all validators (Ethics, Layer, Permission, Secure) and produces a report with a **Risk Score** (0-100).
```bash
swibe compile agent.swibe --report
```

### Enhanced Secure Block
The `secure {}` block (Layer 0) now supports advanced policy fields:

| Policy | Values | Effect |
|--------|--------|--------|
| `llm_routing` | `ethics_only`, `performance_first` | Forces safety models when ethics threshold is high |
| `receipt_sealing` | `immediate`, `batch` | Immediate sealing for high-security environments |
| `strict` | `true`, `false` | Turn layer-order warnings into hard errors |

### Advanced Permission Modes
Three new high-security modes added to the `permission {}` matrix:

| Mode | Behavior |
|------|----------|
| `simulate` | Run in a dry-run sandbox; returns predicted effects without execution |
| `monitor` | Allow action but log full telemetry to on-chain audit trail |
| `quarantine` | Auto-apply isolation on iteration N+1 if N violated ethics or budget |

### Merkle-Hardened Receipt Chain
The internal receipt chain now uses a **Merkle Tree** structure. Every `think` call produces a receipt that includes the Merkle root of all previous history, enabling privacy-preserving audits and proof of non-tampering.

## 44 Compilation Targets

Swibe backends are pure codegen emitters, mapping agentic primitives to native constructs.

### Tier 1: High-Speed & Embedded

| Target | Architecture | Use Case |
|--------|--------------|----------|
| **JavaScript** | Async/Node | Universal runtime (default) |
| **TypeScript** | Typed Async | Web + type-safe agents |
| **Lua** | Coroutines | Tiny embedded agents |
| **Nim** | Macros/DSL | High-performance edge |
| **Crystal** | Fibers | Safe concurrency |
| **Janet** | Lisp Macros | Scripting/embed |
| **Scheme** | Lambdas | Minimal footprint |

### Tier 2: Systems & Safety

| Target | Architecture | Use Case |
|--------|--------------|----------|
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
|--------|--------------|----------|
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
|----------|-------|------|
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

Agents are born with a sovereign identity derived from a BIPỌ̀N39 ritual phrase. This identity secures the agent's RAG memory and signs every execution receipt.

- **BIPỌ̀N39 mnemonic** generation — 16 roots x 16 affixes = 256 canonical tokens (e.g., `esu-gate sango-volt`)
- **Deterministic agent identity** — SHA-256 agent ID, Odù archetype (0-255), elemental signature, capability derivation
- **HMAC-SHA256 message signing** with seed-derived keys
- **Ed25519 keypairs** (SPKI/PKCS8 encoded) from deterministic seed derivation
- **SHA-256 receipt chain** — every `think` call produces an auditable receipt
- **AES-256-GCM** encryption for vault storage
- **Sabbath gate** — queue irreversible writes on Saturday (Ọbàtálá sabbath, UTC day 6)

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

Granular per-action permission control with seven modes:

| Mode | Behavior |
|------|----------|
| `auto` | Auto-approve (safe actions like `think`, `chain`) |
| `ask` | Always prompt the user for approval |
| `plan` | Ask once per session, then auto-approve |
| `monitor` | Run the action but log everything for review |
| `quarantine` | Run in isolated container with no side effects |
| `simulate` | Dry-run sandbox — returns predicted effects without execution |
| `refuse` | Always deny |

**Mandatory permissions:** High-risk primitives (`mcp`, `pilot`, `edit`, `mint`, `witness`, `viewport`, `bridge`, `escrow`, `slash`, `bash`, `file_write`, `net`) require an explicit `permission {}` block. The compiler will warn if these are used without one.

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
|------|-------------|----------|
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

### VSCode Extension (v3.2.0)

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
  lexer.js              # Tokenizer (120+ token types)
  parser.js             # AST parser (EBNF grammar, 49 statement types)
  compiler.js           # Multi-target compiler (44 backends)
  stdlib.js             # Standard library (think, swarm, budget, ethics, etc.)
  neural.js             # SovereignNeuralLayer (86B neurons, cortical routing)
  sovereign-vault.js    # BIP-39 + Ed25519 + AES-256-GCM identity
  repl.js               # Interactive REPL
  visitor.js            # AST visitors (ThinkCollector, EthicsValidator, LayerValidator)
  permissions.js        # PermissionGate with ethics-modulated access control
  mcp-client.js         # MCPConnection + MCPHub (JSON-RPC 2.0)
  think-loop.js         # Agentic iteration engine with tool registry
  memory-engine.js      # Three-tier hierarchical memory
  ide-bridge.js         # Bidirectional IDE bridge + SessionManager
  agent-coordinator.js  # Advanced multi-agent coordination (4 strategies)
  production.js         # CostTracker, Analytics, PolicyEngine
  witness.js            # Multimodal perception (image/video/audio/document)
  pilot.js              # Computer control (browser/desktop/mobile)
  viewport.js           # Screen understanding (a11y, OCR, UI extraction)
  gestalt.js            # Parallel tool execution (5 merge strategies)
  bipon39/              # BIPỌ̀N39 identity engine
    wordspace.js        # 256 canonical tokens, Merkle tree, affix metadata
    mnemonic.js         # Entropy/mnemonic/seed encoding, Odù, elemental signatures
    crypto.js           # SHA-256, PBKDF2, HMAC-SHA512, timing-safe compare
    derivation.js       # Master key derivation, agent derivation paths
    agent-identity.js   # Agent ID generation, signing, capabilities, addresses
    index.js            # Re-exports
  toc/                  # Three-token economy
    token.js            # Àṣẹ/Dopamine/Synapse definitions + ledger
    wallet.js           # Agent wallets, 86B+86M birth endowment, BIPỌ̀N39 identity
    conversion.js       # Burn conversions (Àṣẹ→D, D→S, S→D emergency)
    staking.js          # Stake/unstake/slash engine
    royalty.js          # Creator royalties (10% Àṣẹ, Sabbath vesting)
    escrow.js           # Job payment escrow + dispute resolution
    event-bridge.js     # Ọ̀ṢỌ́VM event bridge
    index.js            # ToCEconomy orchestrator
  type-inference.js     # Static type inference
  conductor.js          # Technosis Sovereign Conductor
  backends/             # 44 codegen backends
  plugins/              # Plugin implementations
test/
  bipon39.test.js       # BIPỌ̀N39 identity conformance (35 tests)
tests/
  swibe.test.js         # Core language suites (65 tests)
  tokenomics.test.js    # Three-token economy (39 tests)
  adversarial.test.js   # Adversarial attack resistance (34 tests)
  hardening.test.js     # Security hardening (25 tests)
  v3.3.1_security.test.js # v3.3.1 security E2E (6 tests)
  tier1_backends.test.js  # Tier 1 backends (4 tests)
  tier2_backends.test.js  # Tier 2 backends (8 tests)
  tier3_backends.test.js  # Tier 3 backends (15 tests)
  backends_v0.5.test.js   # v0.5 backend extensions (6 tests)
  hybrid_upgrade.test.js  # Hybrid compiler upgrade (1 test)
web-playground/         # Browser-based Swibe editor + crypto utils (125 tests)
spec/                   # Formal grammar (EBNF), execution model, security model
examples/               # 38 example .swibe files
docs/                   # Landing page (Vercel/Netlify ready)
registry/               # Cloudflare Worker package registry
vscode-extension/       # VSCode extension (LSP, bridge, themes, snippets)
pwa/                    # Progressive Web App playground
swibe-openclaw/         # OpenClaw bridge package
adapters/               # Ecosystem adapters (oso, seemplify)
grammar.ebnf            # Full EBNF specification
```

## Test & Audit Status

### Core Language Tests (tests/swibe.test.js — 65 tests)

| Suite | Tests | Status |
|-------|-------|--------|
| Core (v0.4) | 5 | Pass |
| SovereignNeuralLayer | 5 | Pass |
| Extensions (v0.5) | 9 | Pass |
| v2.0 Primitives | 10 | Pass |
| v2.0 Phase D — Plugins | 4 | Pass |
| OpenClaw Integration | 6 | Pass |
| v3.1 Hermetic Ethics | 5 | Pass |
| v3.2 Compiler Hardening | 5 | Pass |
| v3.3 REPL | 5 | Pass |
| v3.4 VSCode Extension | 4 | Pass |
| v3.6+v3.7 Registry + Docs | 5 | Pass |

### Tokenomics & Security Tests (104 tests)

| Suite | Tests | Status |
|-------|-------|--------|
| Tokenomics (Sabbath, Èṣù tax, wallets, decay, conversion, escrow) | 39 | Pass |
| Adversarial (commingling, treasury, rounding, VeilSim, entropy, UBI) | 34 | Pass |
| Hardening (secure policy, monitor/quarantine, staking gates, escrow timeout, burn audit, layer ordering) | 25 | Pass |
| v3.3.1 Security E2E (sovereign readiness, receipt chain, appeal/interest, SovereignError) | 6 | Pass |

### BIPỌ̀N39 Identity Tests (test/bipon39.test.js — 35 tests)

| Suite | Tests | Status |
|-------|-------|--------|
| Wordspace (roots, affixes, tokens, subtones, metadata) | 7 | Pass |
| Mnemonic (roundtrip 256/2048, re-encode, checksum) | 6 | Pass |
| Sabbath Gate | 3 | Pass |
| Merkle Root | 2 | Pass |
| Derivation (master key, paths) | 3 | Pass |
| Pinned Test Vectors (entropy/seed/master key conformance) | 6 | Pass |
| Agent Identity (generate, recover, sign, verify, capabilities, address) | 8 | Pass |

### Backend Tests (33 tests)

| Suite | Tests | Status |
|-------|-------|--------|
| Tier 1 Backends | 4 | Pass |
| Tier 2 Backends | 8 | Pass |
| Tier 3 Backends | 15 | Pass |
| v0.5 Backend Extensions | 6 | Pass |

### Web Playground Tests (125 tests)

| Suite | Tests | Status |
|-------|-------|--------|
| Crypto utilities | 29 | Pass |
| Cipher implementations | 19 | Pass |
| Input validation | 24 | Pass |
| Chain crypto | 14 | Pass |
| BIP-39 helper | 14 | Pass |
| Profile management | 8 | Pass |
| Encryption | 6 | Pass |
| Poison radar | 6 | Pass |
| Address generator hook | 5 | Pass |

### Other (1 test)

| Suite | Tests | Status |
|-------|-------|--------|
| Hybrid compiler upgrade | 1 | Pass |

| | | |
|---|---|---|
| **Total** | **363** | **All passing** |

## Roadmap

| Version | Status | Highlights |
|---------|--------|------------|
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
| v3.1.0 | Complete | Permissions, MCP, think loops, IDE bridge, coordination, production |
| v3.2.0 | Complete | Witness (multimodal), Pilot (computer control), Viewport (screen), Gestalt (parallel) |
| **v3.3.0** | **Current** | ToC Tokenomics (Àṣẹ/Dopamine/Synapse), BIPỌ̀N39 identity, neural birth endowment, escrow, royalties |
| **v3.3.1** | **Current** | Security hardening: formal `secure` policy block, monitor/quarantine permissions, staking gates, slashing, escrow timeout, burn audit, four-layer architecture enforcement |
| **Next** | Planned | Phase 8: Beacon network, validation consensus, Twelve-Thrones |

## Environment Variables

See `.env.example` for full configuration. Key variables:

| Variable | Purpose |
|----------|---------|
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
