# Swibe Security Model

Swibe is designed for the safe execution of autonomous agents and AI-generated code. The core of this model is the `secure{}` primitive.

## The `secure{}` Sandbox

In the current JavaScript runtime, `secure{}` provides a constrained Node `vm`
execution context plus a narrowed builtin surface. It is useful for reducing
ambient access, but it is not a hardened security boundary for hostile code.

### 1. Node.js `vm` Isolation (JavaScript Target)
In the JavaScript/Node.js backend, `secure{}` uses the native `vm` module to
create an isolated context.
- **Global Object:** The context exposes only a curated subset of Swibe
  builtins such as `println`, crypto helpers, and `rag`.
- **Context Separation:** Code inside the block cannot directly access module
  scope from the caller unless it is passed through the runtime bridge.

### 2. Resource Limits
The current JS runtime enforces a `vm` timeout and parser/runtime depth limits.
- **CPU Time:** `sandbox_run` applies a 5000ms timeout to `vm.runInContext`.
- **Memory Usage:** There is no hard process-level memory cap enforced by the
  current JS runtime.
- **Recursion Depth:** Parser and runtime depth checks exist, but they are not a
  full substitute for process isolation.

### 3. Network Rules
By default, the JS sandbox context does not expose `http`, `net`, or `fetch`.
- **Zero direct module access:** Direct access to Node networking modules is not
  available inside the provided context.
- **Runtime caveat:** This is a runtime-surface restriction, not a formal
  container boundary.

### 4. File System Access
The JS sandbox context does not expose `fs` directly.
- **No `fs` access in context:** File APIs are not injected into the sandbox.
- **Scoped persistence via runtime bridge:** Persistence currently happens
  through the provided `rag` API, which writes into Swibe-managed storage.

### 5. Identity-Based Permissions
Swibe associates effectful operations with runtime identity and receipt flows,
but capability enforcement is partial in the current JS runtime.
- **Receipt trails:** `think` and related runtime operations produce SHA-256
  receipt data.
- **Capability model:** This is an architectural direction; the current JS
  runtime does not yet enforce a complete capability token model across all
  primitives.

## Multi-Target Security
Backends may map `secure{}` differently, but those guarantees are backend-
specific and should be treated as codegen intent unless verified in the target
runtime.
- **Rust:** Intended to map to restricted execution or WASM-style isolation.
- **Move:** Benefits from the Move VM model for resource safety.
- **Elixir:** Intended to rely on OTP process separation and supervision.
