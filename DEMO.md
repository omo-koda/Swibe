# One sentence. Sovereign AI swarm.

This demo executes a self-contained, multi-language swarm that performs a full end-to-end "breath" of the Technosis Sovereign Ecosystem. An Elixir-based agent thinks, another Elixir agent audits the thought, and a Sui Move-based agent records the result on-chain.

## The 8-Phase Breath Cycle

The demo follows a simplified version of the complete 8-phase breath cycle:

1.  **Phase 1: Birth** → `swarm` block initializes the Oracle, Auditor, and Scribe agents.
2.  **Phase 2: Thought** → The `Oracle` agent uses the `think` primitive, calling an LLM.
3.  **Phase 3: VM** → The `@src/backends/...` directives route agent execution to the appropriate language backends (Elixir & Move).
4.  **Phase 4: Audit** → The `Auditor` agent receives the `receipt` from the Oracle's thought for verification.
5.  **Phase 5: Consensus** → The `Scribe` agent's actions represent the swarm's consensus, ready for on-chain anchoring.
6.  **Phase 6: Sabbath** → (Not demonstrated) A check to pause execution on specific days.
7.  **Phase 7: Reward** → The `Scribe` agent `mint`s a `soul_token` on the Sui blockchain.
8.  **Phase 8: Sealing** → The `Scribe` agent `seal`s the final receipt to Walrus for decentralized storage.

## How to Run

Compile and execute the demo using the Swibe CLI with the `hybrid` target:

```bash
swibe compile examples/sovereign-demo.swibe --target hybrid
```

## Expected Output

The compilation will generate two primary artifacts: a `*.ex` file for the Elixir agents and a `*.move` file for the Sui Move agent. The Elixir script will then execute, orchestrating the swarm and producing output similar to this:

```
Technosis Sovereign Demo — v1.0
[ELIXIR] Swarm supervise tree active with 3 agents.
[ELIXIR] Agent Oracle starting ritual...
[ELIXIR-THINK] Sending to Ollama...
[ELIXIR-RECEIPT] 4A1B2C3D...
[ELIXIR] Agent Auditor starting ritual...
[AUDIT] Receipt 4A1B2C3D... from Oracle is valid.
[MOVE] 📦 Batching 2 Sui transactions...
[MOVE] Minting Soul Token for Oracle (369).
[MOVE] Sealing receipt to Walrus.
The organism has spoken.
```

## Agent Responsibilities

*   **Agent Oracle**: An Elixir-based agent responsible for reasoning and generating a thought via an LLM. Its output is a cryptographically signed `receipt`.
*   **Agent Auditor**: An Elixir-based agent that verifies the integrity and authenticity of the `receipt` produced by the Oracle.
*   **Agent Scribe**: A Sui Move-based agent that acts as the on-chain notary. It mints a `soul_token` as a reward and seals the final proof to decentralized storage.
