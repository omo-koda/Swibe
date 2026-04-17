![Version](https://img.shields.io/badge/version-v3.0.7-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Tests](https://img.shields.io/badge/tests-97%20passing-brightgreen)
![Backends](https://img.shields.io/badge/backends-44-orange)
[![npm](https://img.shields.io/badge/npm-v3.0.7-brightgreen)](https://www.npmjs.com/package/@bino-elgua/swibe)

# Swibe: Agent-Native Scripting Language (v3.0.7)

**Autonomous swarms, self-healing loops, and world creation from one sentence.**

Swibe is a sovereign programming language where agents, prompts, neural layers, and secure execution are first-class citizens. Write declarative agentic code that compiles to 44 backend targets, runs self-repairing swarms, and persists state via a BIP-39 ritual vault.

## 🛠️ Installation

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

## 🌍 Quick Start

```swibe
-- Sovereign Birth Ritual
meta-digital "Genesis" {
  chain: [birth, audit];
  ethics: "harm-none";
  output: "Alive"
}

fn speak(msg: str) {
  %% [voice: "I am here"]
}

swarm {
  Guardian: Agent { name: "Zangbeto" }
}
```

```bash
swibe run ritual.swibe
```

## 🧩 CLI Commands

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

## 🌀 Language Primitives

| Primitive | Purpose |
|---|---|
| `think` | LLM-native reasoning with SHA-256 receipt sealing |
| `chain` | LangChain-style sequential reasoning steps |
| `plan` | Semantic Kernel-style goal decomposition |
| `swarm` | Multi-agent coordination (async in JS, OTP in Elixir) |
| `loop until` | Self-healing execution — runs until a goal is verified |
| `budget` | Token and time limits (`budget { tokens: 10k; time: 30s }`) |
| `remember` | Persistent memory via RAG storage |
| `evolve` | Soul-state evolution |
| `observe` | Event listeners and hooks |
| `ethics` | Runtime ethical guardrails |
| `retrieve` | RAG retrieval |
| `neural` | Neural layer simulation (86B internal neurons) |
| `meta-digital` | Chained skill execution with `refuse_if` ethical filters |
| `secure { }` | Restricted `vm` execution sandbox (timeout, no fs/net access) |
| `app { }` | Declare full applications in one block |
| `hybrid` | Multi-target orchestration (e.g., BEAM for logic, Rust for speed) |
| `%%` | Prompt-splice — natural language as compiled syntax |
| `mint` / `receipt` / `seal` / `walrus` | Sui blockchain primitives |
| `@target` | Multi-target directives (`@elixir`, `@move`, `@rust`) |

## 🚀 44 Compilation Targets

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

## 🧠 LLM Providers

Swibe supports multiple LLM backends via a provider fallback chain:

**Ollama → OpenRouter → Claude → Mock**

| Provider | Setup | Cost |
|---|---|---|
| Ollama (default) | `ollama serve` locally | Free |
| OpenRouter | Set `OPENROUTER_API_KEY` | Free tier available |
| Claude | Set `ANTHROPIC_API_KEY` | Paid |

**Free OpenRouter models:**
- `meta-llama/llama-3.3-70b-instruct:free`
- `mistralai/mistral-7b-instruct:free`
- `google/gemma-2-9b-it:free`

## 🧠 Neural Model Routing

`SovereignNeuralLayer` uses 86 cortical birth parameters to select LLM models:

```
prefrontal  [12 weights] → reasoning model selection
hippocampus [18 weights] → memory capacity
amygdala    [ 8 weights] → ethics threshold (>0.7 → safety model)
+ 5 more cortical regions (48 additional weights)
```

```javascript
const layer = SovereignNeuralLayer.random();
const model = layer.getTopModel();      // prefrontal-weighted selection
const safe  = layer.getEthicsModel();   // amygdala-gated safety model
const report = layer.getRoutingReport(); // full fingerprint + metrics
```

## 🛡️ Sovereign Identity & Vault

Agents are born with a sovereign identity derived from a Yoruba-inspired BIP-39 ritual phrase. This identity secures the agent's RAG memory and signs every execution receipt.

- **BIP-39 ritual phrase** generation (e.g., `esu-gate sango-volt`)
- **Ed25519 keypairs** (SPKI/PKCS8 encoded) from deterministic seed derivation
- **SHA-256 receipt chain** — every `think` call produces an auditable receipt
- **AES-256-GCM** encryption for vault storage

## 🕊️ Hermetic Ethics Engine (v3.1)

Opt-in runtime enforcement of 7 Hermetic principles:

1. **Mentalism** — intent required before action
2. **Correspondence** — soul karma tracking
3. **Vibration** — refusals have configurable TTL cooldowns
4. **Polarity** — refusals redirect to constructive opposites
5. **Rhythm** — Sabbath guard (Saturday/Sunday awareness)
6. **Cause-Effect** — receipt chain enforcement
7. **Gender** — consensus token required for critical actions (e.g., `mint`)

## 🔌 Ecosystem & Plugins

### Plugin System
Any ecosystem can implement the `SwibePlugin` contract:
- `onBirth(agent)` — inject entropy or register identity
- `onThink(prompt)` — pre-reasoning audit
- `onReceipt(receipt)` — post-execution verification
- `onSettle(result)` — final value settlement

```bash
swibe run agent.swibe --plugin ./my-adapter.js
```

### Built-in Plugins
- **Telephony** — phone/SMS at agent birth (Telnyx/Twilio, mock default)

### OpenClaw Integration
Compile Swibe agents to OpenClaw skill packages:
```bash
swibe compile agent.swibe --target openclaw
# Generates SKILL.md, agent.js, SOUL.md
openclaw skill install ./openclaw-out
```

## 🏗️ Project Structure

```
src/
├── index.js          # CLI entry point (run, compile, debug, watch, daemon, etc.)
├── lexer.js          # Tokenizer
├── parser.js         # AST parser (EBNF grammar)
├── compiler.js       # Multi-target compiler
├── stdlib.js         # Standard library (think, swarm, budget, ethics, etc.)
├── neural.js         # SovereignNeuralLayer (86B neurons, cortical routing)
├── sovereign-vault.js # BIP-39 + Ed25519 + AES-256-GCM identity
├── repl.js           # Interactive REPL
├── type-inference.js # Static type inference
├── visitor.js        # AST visitor pattern (ThinkCollector, EthicsValidator)
├── backends/         # 44 codegen backends
├── plugins/          # Plugin implementations
├── ...
tests/                # 97 tests (vitest) — 6 suites
spec/                 # Formal grammar (EBNF), execution model, security model
examples/             # 33 example .swibe files
docs/                 # Landing page (Vercel/Netlify ready)
registry/             # Cloudflare Worker package registry
vscode-extension/     # VSCode extension (syntax, snippets, LSP, theme)
pwa/                  # Progressive Web App playground
web-playground/       # Browser-based Swibe editor
swibe-openclaw/       # OpenClaw bridge package
adapters/             # Ecosystem adapters (oso, seemplify)
```

## 📊 Test & Audit Status

| Suite | Tests | Status |
|---|---|---|
| Core (v0.4) | 5 | ✅ |
| SovereignNeuralLayer | 5 | ✅ |
| Extensions (v0.5) | 10 | ✅ |
| v2.0 Primitives | 14 | ✅ |
| v2.0 Phase D — Plugins | 3 | ✅ |
| OpenClaw Integration | 3 | ✅ |
| v3.1 Hermetic Ethics | 5 | ✅ |
| v3.2 Compiler Hardening | 5 | ✅ |
| v3.3 REPL | 5 | ✅ |
| v3.4 VSCode Extension | 4 | ✅ |
| v3.6+v3.7 Registry + Docs | 5 | ✅ |
| Backend Suites (Tier 1-3) | 33 | ✅ |
| **Total** | **97** | **✅ All passing** |

## 🗺️ Roadmap

| Version | Status | Highlights |
|---|---|---|
| v0.1–v0.4 | ✅ Complete | Lexer, parser, backends, neural layer |
| v1.0 | ✅ Complete | Agent runtime, sovereign vault, RAG |
| v1.1 | ✅ Complete | Hybrid compiler, swarm OTP, plugin system |
| v1.2 | ✅ Complete | Python/R/Lisp/Matlab/Wolfram backends, 53/53 tests |
| v1.3 | ✅ Complete | VSCode LSP, PWA real LLM, think real primitive |
| v2.x | ✅ Complete | budget/remember/evolve/observe/ethics, shared state, swarm.scale |
| v3.0–v3.1 | ✅ Complete | OpenClaw integration, Hermetic ethics engine |
| v3.2 | ✅ Complete | Compiler hardening, type inference, AST visitor |
| v3.3 | ✅ Complete | Interactive REPL with history, tab completion, Sabbath |
| v3.4 | ✅ Complete | VSCode extension (syntax, snippets, theme, commands) |
| v3.5 | ✅ Complete | Registry hardening |
| v3.6–v3.7 | ✅ Complete | Cloudflare registry worker, docs landing page |
| **v3.0.7** | **✅ Current** | Full 44-backend JS runtime, 97 tests, sovereign tooling |
| **Next** | 🔜 Planned | TypeScript core migration, WASM runtime, production RAG |

## ⚙️ Environment Variables

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

🪞👁️🌓🌀📸
**ÈMI NI BÍNÒ ÈL GUÀ**
Àṣẹ.
