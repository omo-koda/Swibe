# Swibe Execution Model

This document describes the execution behavior, determinism guarantees, and sandboxing for Swibe primitives.

## Core Primitives

### `fn` (Functions)
Functions in Swibe are deterministic by default when operating on pure data. However, transparency is prioritized over strict bit-for-bit determinism in multi-target compilation, as different backends (JS, Rust, Elixir) may handle floating-point or collection ordering slightly differently.

### `skill` (Agent Capabilities)
Skills encapsulate prompts and logic for agents. They are non-deterministic by nature as they involve LLM interactions. The execution model treats a skill as a stateful transition where the input is a prompt context and the output is a receipt-sealed action.

### `swarm` (Agent Coordination)
Swarms execute as concurrent, fault-tolerant groups. In the Elixir backend, this maps to OTP Supervision trees. Determinism is not guaranteed for execution order, but the "consensus" of the swarm is finalized via a collective receipt.

### `think` (LLM Inference)
The `think` primitive is explicitly non-deterministic. Every `think` call generates a SHA-256 receipt that includes the prompt, the response, and the model metadata, allowing for post-hoc verification of the "thought" process.

### `secure` (Sandboxed Blocks)
The `secure{}` block enforces strict resource and capability isolation. Code inside a `secure` block cannot access the network, file system, or global state unless explicitly granted via a tool-call bridge. It is the primary mechanism for safe execution of untrusted or AI-generated code.

### `meta-digital` (Ethical Guardrails)
Meta-digital blocks execute as a sequential chain of "breaths" or steps. Each step must pass the defined `ethics` guard (an automated audit) before the next step begins. It provides a high-level deterministic flow for otherwise non-deterministic agent actions.

### `loop until` (Goal-Based Iteration)
Loops continue until a specific `goal` (a string-based semantic condition) is met. The execution model uses an internal evaluator (or an agent) to check the state against the goal. To prevent infinite loops, all `loop until` constructs have a hard-coded or configurable iteration cap.

### `%%` (Prompt Splicing)
Prompt splicing is a compile-time or JIT-time construct. It triggers the LLM to generate the implementation of a function or block. Once generated, the resulting code follows the execution model of the target language.

### `agent` (Autonomous Units)
Agents are the primary units of execution. They are stateful and asynchronous. An agent's execution is defined by its role and the tools it can call. Every major state change is recorded in the agent's internal RAG storage.

### `channel` (Concurrency)
Channels provide synchronized communication between agents or concurrent blocks. They follow the CSP (Communicating Sequential Processes) model, ensuring safe data transfer without shared memory issues.

### `resource` (Linear Types)
Resources follow linear logic: they must be consumed exactly once. This ensures that critical assets (like file handles or blockchain tokens) are never duplicated or leaked. The compiler enforces these rules at the static analysis phase.

### `app` (Autonomous Applications)
The `app` primitive defines a top-level autonomous system. Its execution involves spinning up the necessary swarms, setting up RAG persistence, and deploying the resulting interfaces to the specified platform.

### `mint`, `receipt`, `seal`, `walrus` (Sovereign Blockchain)
These primitives interact with the Sui blockchain (via the Omokoda soul module). `mint` creates on-chain assets, `receipt` emits events for verification, `seal` handles key derivation, and `walrus` manages decentralized blob storage. These operations are deterministic in their effect on the blockchain state.

### `@target` (Multi-Target Directives)
Target directives allow for "hybrid" execution. Code marked with a specific target (e.g., `@move`) is routed to the corresponding backend during compilation. The execution model for these blocks is defined by the semantics of the target environment (e.g., Move VM, BEAM).
