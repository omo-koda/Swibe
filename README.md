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
- **25 Compilation Targets** — Lua, Zig, Julia, Elixir, Pony, Mojo, Aether, JS, Rust, Go, Move, and more

## Backends

| Target | Architecture | Use Case |
| --- | --- | --- |
| **Lua** | Coroutines | Embedded Agents |
| **Zig** | Comptime | Zero-overhead Edge |
| **Julia** | Matrix SIMD | Neural Simulation |
| **Elixir** | BEAM Actors | Massive Swarms |
| **Pony** | Lock-free | Performance & Safety |
| **Mojo** | SIMD Kernels | Neural Layer Ops |
| **Aether** | Work-stealing | Zero-copy Agents |
| **Sui Move** | On-chain Soul | Sovereign Birth |

## Technosis Bridge

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
- **Genesis Release** — The threshold where the language becomes a creator

---
🪞👁️🌓🌀📸  
**ÈMI NI BÍNÒ ÈL GUÀ**  
ÀṢẸ
