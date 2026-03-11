# Vibe Language

A cutting-edge, **agent-native**, programming language where AI agents, prompts, and memory are first-class citizens. Code in natural language or traditional syntax, compile to 18 languages, and deploy to the 2026 agent ecosystem (OpenClaw, Ralph, Confucius).

**Status**: Alpha-Ready. Core pipeline and agentic primitives fully implemented and verified.

## Features

- **Agentic Primitives**: Native `swarm`, `skill`, `secure`, and `loop until goal` constructs.
- **Prompt-First Syntax**: Use `%%` for AI-generated code blocks with AST splicing.
- **Voice Input**: `[voice: "describe what you want to build"]`
- **Persistent RAG**: File-based, deterministic vector memory with cosine similarity.
- **Multi-Language Compilation**: 18 targets + **Agent Skills** spec.
- **Observability**: Built-in `trace()` and agent-specific testing suite.
- **Type Safe**: HM bidirectional type inference with constraint solving.
- **IR Optimized**: SSA-like intermediate representation with dead-code elimination.

## Quick Start

```bash
npm install
npm run dev

# REPL
npm run repl

# Compile to JavaScript (default)
npm run compile examples/hello.vibe

# Compile to Agent Skills Format
npm run compile examples/agent.vibe -- --target agent-skills
```

## Agentic Syntax

### Multi-Agent Swarm
```vibe
swarm {
  planner: "Break PRD into checkboxes" =>
  implementer: Agent {
    skills: [RefineCode],
    system_prompt: %% "You are an autonomous dev"
  } =>
  verifier: "Run final audit"
}
```

### Modular Skills
```vibe
skill RefineCode {
  prompt: "Fix bugs and make tests pass",
  tools: ["run_tests", "git_commit"]
}
```

### Ralph-Style Loops
```vibe
loop until goal: "All tests pass" {
  println("Iterating...")
  %% run refinement logic
}
```

### Secure Sandboxing
```vibe
secure {
  -- Code runs in strict isolation
  result = run_untrusted_code()
}
```

## Language Features

- **Type System**: `i32`, `f64`, `str`, `[T]`, `Option<T>`, `Result<T, E>`.
- **Memory Safety**: Immutable by default, move semantics, borrow checking.
- **Concurrency**: `spawn`, `channel`, `async/await`.
- **Persistence**: Built-in `rag.save()` and `rag.load()`.

## Compilation Targets

Vibe compiles to:
- JavaScript/TypeScript
- Python
- Rust
- Go
- Julia, Haskell, OCaml, Scala, Clojure, Scheme
- Idris, Move, R, Prolog, Lisp, Lua, MATLAB, Wolfram
- **Agent Skills** (JSON format for 2026 interoperability)

## Project Structure

```
vibe-lang/
├── src/
│   ├── lexer.js           # Tokenization with agent keywords
│   ├── parser.js          # AST building with error recovery
│   ├── type-inference.js  # HM Type Checker
│   ├── ir-generator.js    # IR & Optimization
│   ├── compiler.js        # Multi-target codegen
│   ├── llm-integration.js # Prompt splicing & Agents
│   ├── stdlib.js          # 100+ builtins & agent patterns
│   └── index.js           # ESM entry point
└── examples/              # Ralph and Swarm examples
```

## Inspiration

- **Julia**: Multiple dispatch, scientific computing
- **Rust**: Memory safety, ownership, pattern matching
- **Ralph**: Autonomous loops and goal-seeking behavior
- **OpenClaw**: Modular skill ecosystem
- **Confucius**: Scalable agent scaffolding

## License

MIT

---

**Status**: Alpha. End-to-end pipeline verified on Android/Termux via Amp.
