# Swibe Security Model

Swibe is designed for the safe execution of autonomous agents and AI-generated code. The core of this model is the `secure{}` primitive.

## The `secure{}` Sandbox

The `secure{}` block provides a multi-layered sandbox that isolates execution from the host system and the rest of the Swibe runtime.

### 1. Node.js `vm` Isolation (JavaScript Target)
In the JavaScript/Node.js backend, `secure{}` utilizes the native `vm` module to create a new, isolated context.
- **Global Object:** The global object is replaced with a minimal set of safe primitives. Standard Node.js globals like `process`, `require`, `module`, and `exports` are removed.
- **Context Separation:** Code inside the block cannot access variables or functions defined outside unless they are explicitly passed into the context via a "bridge".

### 2. Resource Limits
To prevent Denial of Service (DoS) attacks from untrusted code, `secure{}` enforces the following limits:
- **CPU Time:** Execution is interrupted if the CPU time exceeds a predefined threshold (default: 5000ms).
- **Memory Usage:** The memory allocated to the sandboxed context is capped.
- **Recursion Depth:** The parser and runtime limit the depth of the call stack.

### 3. Network Rules
By default, code within a `secure{}` block is "air-gapped":
- **Zero Ingress/Egress:** Direct access to the `http` and `net` modules is disabled.
- **Tool-Call Only:** Any network interaction must happen through an authorized tool call registered with the Swibe runtime. These tool calls are audited and can be rate-limited or blocked based on ethical guardrails.

### 4. File System Access
The host file system is completely hidden from the `secure{}` block:
- **No `fs` access:** The `fs` module is not provided.
- **Virtual RAG Storage:** If the code needs to persist data, it must use the `rag` module, which maps to a virtual, scoped storage area managed by the agent's identity.

### 5. Identity-Based Permissions
Every `secure{}` block is associated with a Swibe identity (BIP-39 ritual phrase). Permissions are tied to this identity:
- **Capability-Based Security:** Code must possess a specific "token" or "capability" to perform effectful operations like minting tokens or storage blobs.
- **Audit Trails:** All actions within a `secure{}` block that interact with the outside world (via tools) are recorded in a SHA-256 sealed receipt.

## Multi-Target Security
While the JavaScript target uses `vm`, other targets implement `secure{}` using native isolation mechanisms:
- **Rust:** Maps to `std::thread` with restricted capabilities and potentially WASM-based isolation for untrusted logic.
- **Move:** Naturally secure due to the Move VM's linear type system and lack of dynamic dispatch, preventing reentrancy and unauthorized resource access.
- **Elixir:** Uses separate OTP processes with restricted message-passing capabilities and custom reducers to limit resource consumption.
