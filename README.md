# Swibe

A compact, agent-native scripting language. Natural-feeling syntax that compiles to real code, runs autonomous loops, swarms tasks across agents, and remembers state across runs. 

**Status**: Alpha. Core pipeline (Lexer -> Parser -> Inference -> IR -> Codegen) is live and verified.

## Core Primitives

- **Swarms**: Declarative multi-agent orchestration.
  ```vibe
  swarm { planner: "break this down", coder: "write it" }
  ```
- **Smart Loops**: Bounded iteration until a goal is achieved.
  ```vibe
  loop until goal: "tests pass" { refine code }
  ```
- **Skills**: Modular, reusable agent capabilities.
  ```vibe
  skill FixBugs { prompt: "patch this", tools: ["test_runner"] }
  ```
- **Prompts**: First-class LLM integration with AST splicing.
  ```vibe
  %% "generate a regex for emails"
  ```
- **Memory**: Persistent, file-based RAG.
  ```vibe
  rag.save("v1") / rag.load()
  ```

## Example: Autonomous API Builder

```vibe
skill BuildApi {
  prompt: "Create a REST endpoint for users",
  tools: ["fs", "http"]
}

swarm {
  planner: "Outline routes" =>
  coder: BuildApi =>
  tester: "Run unit tests"
}

loop until goal: "Coverage > 90%" {
  %% fix failing tests
}

rag.save("user_api_v1")
```

## Compilation Targets
Swibe generates idiomatic code for 18 targets:
- **Web/Backend**: JS, Python, Go, Rust, Java, C++
- **Functional**: Julia, Haskell, OCaml, Scala, Clojure, Scheme
- **Specialized**: Idris, Move, R, Prolog, Lisp, Lua, MATLAB, Wolfram
- **Ecosystem**: **Agent Skills JSON** (for 2026 interoperability)

## Quick Start
```bash
npm install
npm run compile examples/app.vibe -- --target javascript
```

## Project Structure
- `src/lexer.js`: Tokenizer for 90+ primitives.
- `src/parser.js`: Recursive-descent parser with error recovery.
- `src/type-inference.js`: HM bidirectional type checker.
- `src/ir-generator.js`: SSA-like IR & Optimization.
- `src/compiler.js`: Multi-target code generation.
- `src/llm-integration.js`: Prompt splicing & Agent loops.
- `src/stdlib.js`: 100+ builtins & agentic patterns.

---

**Built for the 2026 agentic wave.** End-to-end verified on Android/Termux via Amp.
