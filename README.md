![Version](https://img.shields.io/badge/version-v3.0.7-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Layer](https://img.shields.io/badge/layer-Language-lightgrey)
[![npm](https://img.shields.io/badge/npm-v3.0.7-brightgreen)](https://www.npmjs.com/package/@bino-elgua/swibe)
# Swibe: Agent-Native Scripting (v3.0.7)

**Autonomous swarms, self-healing loops, and world creation from one sentence.**

Swibe is a sovereign programming language where agents, prompts, neural layers, and secure execution are first-class citizens. Write declarative agentic code that compiles to 33+ targets (including Elixir/OTP), runs self-repairing swarms, and persists state via a BIP-39 ritual vault.

## 🗺️ Roadmap

| Version | Status | Highlights |
|---------|--------|------------|
| v0.1–v0.4 | ✅ Complete | Lexer, parser, 39+ backends, neural layer |
| v1.0 | ✅ Complete | Agent runtime, sovereign vault, RAG |
| v1.1 | ✅ Complete | Hybrid compiler, swarm OTP, plugin system |
| v1.2 | ✅ Complete | Python/R/Lisp/Matlab/Wolfram backends, vitest 44/44 |
| v1.3 | ✅ Complete | VSCode LSP server, PWA real LLM, think real primitive |
| v2.x | ✅ Complete | Hybrid compiler, plugin/runtime expansion, wider backend coverage |
| **v3.0.7 ✅** | ✅ **Current** | JS-first runtime, 39+ backend emitters, sovereign runtime/tooling |
| **Next** | 🔜 Planned | Documentation site, VSCode marketplace, registry.swibe.dev |

## 🌀 Major Primitives (v1.1)

| Primitive | Ritual Purpose |
|---|---|
| `think` | LLM-native reasoning with SHA-256 receipt sealing. |
| `swarm` | Multi-agent coordination; JS uses lightweight async coordination, other backends can map to richer runtimes. |
| `neural` | High-performance neural layer simulation (86B internal neurons). |
| `meta-digital` | High-stakes chained skill execution with ethical `refuse_if` filters. |
| `secure { }` | Restricted JS `vm` execution context in the current runtime. |
| `app { }` | Declare and birth full applications in one breath. |
| `loop until` | Self-healing execution — runs until a goal is verified. |
| `hybrid` | NEW in v1.1: Multi-target orchestration (e.g. BEAM for logic, Rust for speed). |
| `%%` | Prompt-splice — natural language as valid, compiled syntax. |

## 🚀 33+ Compilation Targets
Swibe supports a hybrid compiler that can split a single source into multiple specialized targets:
- **BEAM (Elixir/OTP)**: Fault-tolerant orchestration and agent supervisors.
- **System (Rust/Go)**: High-speed safe enforcers.
- **Frontend (TS/WASM)**: Web-playground and PWA distribution.
- **Cloud (Lambda/FastAPI)**: Serverless agent endpoints.

## 🛡️ Sovereign Identity
Swibe includes persistent RAG-style storage and bip-39 ritual phrases for agents. Every `think` command produces a SHA-256 receipt. Rich swarm supervision is backend-dependent rather than guaranteed by the default JS runtime.

## 🧠 LLM Providers
Swibe supports multiple LLM backends using a provider chain.
- Ollama (free, local, default): runs in-process, no API key required for local deployment.
- OpenRouter (free tier available): set `OPENROUTER_API_KEY` to use OpenRouter endpoints.
- Any provider with `OPENROUTER_API_KEY`: for third-party LLMs, set `OPENROUTER_API_KEY` and optionally `OPENROUTER_MODEL`.


Swibe backends are "Pure Codegen" emitters, mapping agentic primitives to the most efficient native constructs.

### Tier 1: High-Speed & Embedded
| Target | Architecture | Use Case |
| --- | --- | --- |
| **JavaScript** | Async/Node | Universal UI/Web |
| **Lua** | Coroutines | Tiny Embedded Agents |
| **Nim** | Macros/DSL | High Performance Edge |
| **Crystal** | Fibers | Safe Concurrency |
| **Janet** | Lisp Macros | Scripting/Embed |
| **Scheme** | Lambdas | Minimal Footprint |

### Tier 2: Systems & Safety
| Target | Architecture | Use Case |
| --- | --- | --- |
| **Rust** | Threads/Safety | Sovereign Enforcers |
| **Go** | Goroutines | High-Scale Workers |
| **Zig** | Comptime | Zero-overhead Edge |
| **V** | Auto-free | Fast-compile Vaults |
| **Odin** | Data-Oriented | Neural Sim Crunching |
| **OCaml** | Functors | Formal Skill Proofs |
| **F#** | Async Workflows | Typed .NET Receipts |
| **Clojure** | Atoms/STM | Immutable Swarms |
| **Haskell** | Monads | Pure Ethical Chaining |

### Tier 3: Exotic & Specialized
**Pony** (Lock-free actors), **Aether** (Work-stealing queues), **Mojo** (SIMD Kernels), **Sui Move** (On-chain soul), **Julia** (Matrix SIMD), **APL** (Tensor god), **J** (Vector assassin), **K** (Event patrols), **Forth** (Stack mystic), **Prolog** (Logic judge), **Mercury** (Deterministic), **Ada** (Crash-proof), **COBOL** (Batch audit), **Smalltalk** (Live object), **D** (Contract guard), **Raku** (Grammar ethics), **Scala** (Akka scale), **Idris** (Dependent types).

## 🛡️ Sovereign Vault & Identity

Swibe agents are born with a sovereign identity derived from a Yoruba-inspired BIP-39 ritual phrase (e.g., `esu-gate sango-volt`). This identity secures the agent's RAG memory and signs every execution receipt with Ed25519.

## 🔌 Ecosystem Plugins (The Bridge)

Swibe is a universal core. To integrate with specific architectures (like Technosis), use the opt-in plugin system:

```bash
# Run with a Technosis ritual adapter
swibe run agent.swibe --plugin ./technosis-adapter.js
```

Any ecosystem can implement the `SwibePlugin` contract:
- `onBirth(agent)`: Inject entropy or register identity.
- `onThink(prompt)`: Pre-reasoning audit.
- `onReceipt(receipt)`: Post-execution verification.
- `onSettle(result)`: Final value settlement (e.g., minting tokens).

## 🛠️ Installation

```bash
npm i -g @bino-elgua/swibe
```

For local development and tests:

```bash
npm install
npm test
```

## 🌍 Quick Example

```swibe
-- Swibe v1.1.0 Sovereign Birth Ritual
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

Run it:
```bash
swibe run ritual.swibe
```

---
🪞👁️🌓🌀📸  
**ÈMI NI BÍNÒ ÈL GUÀ**  
ÀṢẸ

## The Sovereign Scripting Language

Swibe is the universal, agent-native scripting language for the Technosis ecosystem. It features first-class AI primitives, a multi-language compiler, and a sovereign execution model designed for building autonomous swarms and decentralized applications.


---

## 🆓 OpenRouter Free Tier

Swibe integrates with [OpenRouter](https://openrouter.ai) for free LLM access — no billing required:

```bash
# .env
OPENROUTER_API_KEY=your_key_here
OPENROUTER_DEFAULT_MODEL=meta-llama/llama-3.3-70b-instruct:free
```

**Free models available:**
- `meta-llama/llama-3.3-70b-instruct:free`
- `mistralai/mistral-7b-instruct:free`
- `google/gemma-2-9b-it:free`

The fallback chain: **Ollama → Claude → OpenRouter → mock**

## 🧠 Neural Model Routing

`SovereignNeuralLayer` uses cortical birth parameters to select LLM models:

```
prefrontal  [12 weights] → reasoning model selection
hippocampus [18 weights] → memory capacity
amygdala    [ 8 weights] → ethics threshold (>0.7 → safety model)
```

```javascript
const layer = SovereignNeuralLayer.random();
const model = layer.getTopModel();      // prefrontal-weighted selection
const safe  = layer.getEthicsModel();   // amygdala-gated safety model
```

## Part of the Technosis Sovereign Ecosystem

Swibe is a foundational component of a larger architecture for creating and coordinating sovereign AI. For more information on the complete system, see the [organism-core repository](https://github.com/Bino-Elgua/organism-core).

Àṣẹ.
