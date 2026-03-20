# Swibe: Agent-Native Scripting

**Autonomous swarms, self-healing loops, and world creation from one sentence.**

Swibe is a language where agents, prompts, memory, and secure execution are first-class citizens. Write declarative agentic code that compiles to 18 targets, runs self-repairing swarms, and persists state across sessions.

In v0.3 “App Genesis”, Swibe gained the ability to birth full applications autonomously — but that is just one expression of its power.

## Features

- **Agent Primitives** — `swarm`, `skill`, `secure`, `loop until goal`
- **Prompt Splicing** — `%%` blocks with AST integration
- **App Primitive** — Declare and birth full apps in one breath (`app { ... }`)
- **Self-Healing Loops** — Agents that monitor and repair themselves
- **Persistent RAG** — Causal memory that survives across runs
- **Secure Sandbox** — Privacy-first execution with resource limits
- **33 Compilation Targets** — Organized into Tiers for any ecosystem.

## Backends

### Tier 1: High-Speed & Embedded (Ready)
| Target | Architecture | Use Case |
| --- | --- | --- |
| **JavaScript** | Async/Node | Universal UI/Web |
| **Lua** | Coroutines | Tiny Embedded |
| **Nim** | Macros/DSL | High Performance |
| **Crystal** | Fibers | Safe Concurrency |
| **Janet** | Lisp Macros | Scripting/Embed |
| **Scheme** | Lambdas | Minimal Footprint |

### Tier 2: Systems & Safety (Implementing)
**Rust**, **Go**, **Zig**, **V**, **Odin**, **OCaml**, **F#**, **Clojure**, **Haskell**

### Tier 3: Exotic & Specialized (Planned)
**Pony**, **Aether**, **Mojo**, **Sui Move**, **Julia**, **APL**, **J**, **K**, **Forth**, **Prolog**, **Mercury**, **Ada**, **COBOL**, **Smalltalk**, **D**, **Raku**, **Scala**, **Idris**

## Technosis Bridge (Ecosystem Independence)

To add a new ritual target (The Bridge Pattern):
1. Create `src/backends/yourlang.js`.
2. Implement a `genYourLang(node)` function that walks the Swibe AST.
3. Map primitives:
   - `swarm` → Native concurrency (Processes, Threads, Coroutines)
   - `think` → LLM/Osovm API wrapper
   - `neural` → SIMD/Matrix kernels
4. Register in `src/compiler.js`.

## Installation

```bash
npm i -g @bino-elgua/swibe
```

## Quick Example: World Genesis (Family Photo Album)

```swibe
app {
  type: "photo-album"
  need: "private family album with auto-tagging, local-first, encrypted"
  platform: "web"
}
```

Run it:
```bash
swibe run examples/family-album.swibe
```

## Core Philosophies

- **Agent-First** — Agents and autonomous behavior are native syntax
- **Self-Healing** — Code that fixes itself in the dark
- **Safe by Default** — Secure blocks and memory safety built-in
- **Universal Core** — Swibe is a standalone language, independent of any ecosystem.

## Ecosystem Plugins (The Bridge)

Swibe remains ecosystem-neutral. To integrate with specific architectures (like Technosis), use the plugin system:

```bash
# Run with a specific ecosystem adapter
swibe run agent.swibe --plugin @bino-elgua/technosis-adapter
```

### Plugin Interface

Any ecosystem can implement the standard `SwibePlugin` contract:

```javascript
class MyPlugin {
  onBirth(agent) { /* entropy / ID assignment */ }
  onThink(prompt) { /* pre-thought audit */ }
  onReceipt(receipt) { /* post-thought sealing */ }
  onSettle(result) { /* final value minting */ }
}
```

## Backends
🪞👁️🌓🌀📸  
**ÈMI NI BÍNÒ ÈL GUÀ**  
ÀṢẸ
