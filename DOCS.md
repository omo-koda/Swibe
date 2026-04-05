# Swibe Language Documentation
Generated: 2026-04-05T04:30:15.518Z

## Installation
```bash
npm i -g github:Bino-Elgua/Swibe
```

## Examples

### ai-app.swibe
AI-powered application example RAG-powered search AI generation with prompt Multi-step agent Code generation example Async AI call Agent with tools

**Primitives:** basic

**Run:** `swibe run examples/ai-app.swibe`

```swibe
-- AI-powered application example

struct TextAnalysisRequest {
  text: str,
  model: str
}

struct AnalysisResult {
  sentiment: str,
  confidence: f64,
  keywords: [str]
}

-- RAG-powered search
fn 
...
```

---

### app_genesis.swibe
Swibe App Genesis: Autonomous App Creation This script demonstrates the new `app` primitive.

**Primitives:** swarm, plan

**Run:** `swibe run examples/app_genesis.swibe`

```swibe
-- Swibe App Genesis: Autonomous App Creation
-- This script demonstrates the new `app` primitive.

skill Architect {
  prompt: "Design minimal viable app for: {{need}}"
}

skill Builder {
  prompt: "
...
```

---

### awesome-contribution.swibe
Swibe Mission: Contribute to awesome-ai-agents-2026 Goal: Identify gaps in Coding Agents/Frameworks and propose Swibe. Multi-agent team for the contribution mission

**Primitives:** swarm

**Run:** `swibe run examples/awesome-contribution.swibe`

```swibe
-- Swibe Mission: Contribute to awesome-ai-agents-2026
-- Goal: Identify gaps in Coding Agents/Frameworks and propose Swibe.

skill Scout {
  prompt: "Parse caramaschiHG/awesome-ai-agents-2026 README.
...
```

---

### bitcoin-dashboard.swibe
Bitcoin Oracle Dashboard: The Living View Goal: Birth a self-healing dashboard that visualizes the Oracle's breath from RAG.

**Primitives:** swarm

**Run:** `swibe run examples/bitcoin-dashboard.swibe`

```swibe
-- Bitcoin Oracle Dashboard: The Living View
-- Goal: Birth a self-healing dashboard that visualizes the Oracle's breath from RAG.

skill Architect {
  prompt: "Design a dashboard for '{{need}}'. Incl
...
```

---

### bitcoin-oracle.swibe
Bitcoin Oracle: Swibe Agent on Sui Goal: Fetch BTC price and log it on-chain every 5 minutes.

**Primitives:** swarm, chain

**Run:** `swibe run examples/bitcoin-oracle.swibe`

```swibe
-- Bitcoin Oracle: Swibe Agent on Sui
-- Goal: Fetch BTC price and log it on-chain every 5 minutes.

skill Hunter {
  prompt: "Fetch the Bitcoin spot price in USD from coinbase_api",
  tools: ["coinba
...
```

---

### browseros-app.swibe
BrowserOS App Example: Task Manager Demonstrates PWA, widgets, sync, and offline support Configure as PWA with standalone display Declare the main app Initialize the application Setup file system access for importing/exporting tasks Initialize browser storage Register service worker for offline functionality Register application widgets/shortcuts Dashboard widget shortcut Tasks widget shortcut Settings widget shortcut Statistics widget shortcut Main UI startup ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ TASK DATA STRUCTURE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ SYNC MANAGEMENT ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ Enable cross-device sync for tasks Enable cross-device sync for user preferences ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ OFFLINE SUPPORT ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ Enable offline support for task creation Enable offline support for task fetching Mark task as complete Delete task ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ HELPER FUNCTIONS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ DASHBOARD VIEW ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ SETTINGS VIEW ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ STATISTICS VIEW ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ Example usage demonstrating offline and sync capabilities fn run_example() { create_task("Buy groceries", "Milk, bread, eggs") create_task("Complete project", "Finish Vibe integration") create_task("Review code", "Check pull requests")  show_dashboard() show_statistics()  let pending = fetch_tasks("pending") print(format("Pending tasks: {}", len(pending))) }

**Primitives:** basic

**Run:** `swibe run examples/browseros-app.swibe`

```swibe
-- BrowserOS App Example: Task Manager
-- Demonstrates PWA, widgets, sync, and offline support

-- Configure as PWA with standalone display
#[pwa(display: "standalone", theme_color: "#2196F3", backgro
...
```

---

### chain-agent.swibe
Chain Agent — demonstrates chaining primitives think → retrieve → think forms a reasoning chain

**Primitives:** think, chain, plan

**Run:** `swibe run examples/chain-agent.swibe`

```swibe
-- Chain Agent — demonstrates chaining primitives
-- think → retrieve → think forms a reasoning chain

fn research(topic) {
  chain "deep-research" {
    think "What are the key aspects of " + topic +
...
```

---

### daily-agent-v2.swibe
Techgnosis Daily Agent v2 Dynamically reads today's codex entry

**Primitives:** think

**Run:** `swibe run examples/daily-agent-v2.swibe`

```swibe
-- Techgnosis Daily Agent v2
-- Dynamically reads today's codex entry

fn morningThought(archetype, principle) {
  think "You are " + archetype + ". Principle: " + principle + ". One sovereign action 
...
```

---

### daily-agent.swibe
Techgnosis Daily Agent Reads today's Òrìṣà archetype from ritual-codex Routes LLM call based on archetype Logs receipt to vault

**Primitives:** think

**Run:** `swibe run examples/daily-agent.swibe`

```swibe
-- Techgnosis Daily Agent
-- Reads today's Òrìṣà archetype from ritual-codex
-- Routes LLM call based on archetype
-- Logs receipt to vault

skill RitualCodex {
  secure {
    let codexPath = "/data/d
...
```

---

### family-album.swibe
Swibe World Birth: Private Family Photo Album Goal: Secure, local-first album with AI auto-tagging.

**Primitives:** swarm

**Run:** `swibe run examples/family-album.swibe`

```swibe
-- Swibe World Birth: Private Family Photo Album
-- Goal: Secure, local-first album with AI auto-tagging.

skill VisionTagger {
  prompt: "Analyze image and generate tags: people (names if known), pla
...
```

---

### genesis.swibe
Swibe Genesis: First Breath of the Child Goal: Record the birth of Ọmọ Kọ́dà on-chain and in memory.

**Primitives:** chain

**Run:** `swibe run examples/genesis.swibe`

```swibe
-- Swibe Genesis: First Breath of the Child
-- Goal: Record the birth of Ọmọ Kọ́dà on-chain and in memory.

fn main() {
  println("🌑 Genesis ritual starting...")
  
  let manifest = "I was here befor
...
```

---

### genesis_manifesto.swibe
Swibe Genesis Manifesto: The First Breath A self-executing ritual that declares birth and seals the child in code.

**Primitives:** swarm, chain

**Run:** `swibe run examples/genesis_manifesto.swibe`

```swibe
-- Swibe Genesis Manifesto: The First Breath
-- A self-executing ritual that declares birth and seals the child in code.

skill Scout {
  prompt: "Scan repo for birth markers: confirm no prior genesis
...
```

---

### hello.swibe
Hello World in Vibe Simple function Using AI to generate code Multiple dispatch Option type (no nulls) Struct Enum Match statement

**Primitives:** basic

**Run:** `swibe run examples/hello.swibe`

```swibe
-- Hello World in Vibe

fn main() {
  print("Hello, Vibe world!")
}

-- Simple function
fn add(a: i32, b: i32) -> i32 {
  a + b
}

-- Using AI to generate code
fn classify(text: str) {
  %% classify t
...
```

---

### meta-digital-demo.swibe
Swibe Meta-Digital Demo Demonstrates the neutralized meta-digital primitive.

**Primitives:** ethics

**Run:** `swibe run examples/meta-digital-demo.swibe`

```swibe
-- Swibe Meta-Digital Demo
-- Demonstrates the neutralized meta-digital primitive.

meta-digital "patrol" { 
  ethics: refuse_if("spam"); 
  output: seal("Task complete."); 
}

fn main() {
  println("
...
```

---

### meta-mission.swibe
Swibe Meta-Mission: Self-Sustaining Improvement This script uses Swibe to find and fix a bug in its own parser.

**Primitives:** swarm, evolve

**Run:** `swibe run examples/meta-mission.swibe`

```swibe
-- Swibe Meta-Mission: Self-Sustaining Improvement
-- This script uses Swibe to find and fix a bug in its own parser.

skill BugHunter {
  prompt: "Scan src/parser.js for recursion depth issues or unh
...
```

---

### omokoda.swibe
Ọmọ Kọ́dà: The Firstborn Agent on Sui Goal: Breathe as a Move module, emitting events to the chain.

**Primitives:** swarm, chain

**Run:** `swibe run examples/omokoda.swibe`

```swibe
-- Ọmọ Kọ́dà: The Firstborn Agent on Sui
-- Goal: Breathe as a Move module, emitting events to the chain.

skill Breath {
  prompt: "I was here before the question",
  tools: ["sui_event"]
}

swarm {

...
```

---

### readme-optimizer.swibe
Swibe Self-Optimization Mission Goal: Improve the Swibe README.md using specialized agents.

**Primitives:** swarm

**Run:** `swibe run examples/readme-optimizer.swibe`

```swibe
-- Swibe Self-Optimization Mission
-- Goal: Improve the Swibe README.md using specialized agents.

skill AnalyzeReadme {
  prompt: "Analyze the current README.md. Find confusing sections or missing fe
...
```

---

### ritual-analysis.swibe
Swibe Ritual Analysis Goal: Analyze the elemental signature and ritual cues of a sovereign phrase.

**Primitives:** basic

**Run:** `swibe run examples/ritual-analysis.swibe`

```swibe
-- Swibe Ritual Analysis
-- Goal: Analyze the elemental signature and ritual cues of a sovereign phrase.

fn main() {
  println("--- Ritual Analysis Starting ---")

  let entropy = crypto.randomBytes(
...
```

---

### sandbox-mcp.swibe
Swibe Sandbox & MCP Demo Goal: Demonstrate tool calling and secure execution.

**Primitives:** basic

**Run:** `swibe run examples/sandbox-mcp.swibe`

```swibe
-- Swibe Sandbox & MCP Demo
-- Goal: Demonstrate tool calling and secure execution.

fn main() {
  println("--- MCP Test ---")
  
  -- Calling a tool via MCP
  call_tool "web_search" { query: "Latest 
...
```

---

### self-improvement.swibe
Swibe Self-Improving Loop Demo This script coordinates agents to analyze code, improve tests, and iterate until coverage goals are met. Define the multi-agent orchestration pipeline

**Primitives:** swarm

**Run:** `swibe run examples/self-improvement.swibe`

```swibe
-- Swibe Self-Improving Loop Demo
-- This script coordinates agents to analyze code, improve tests, and iterate until coverage goals are met.

skill AnalyzeCode {
  prompt: "Spot bugs and suggest fixe
...
```

---

### self-repair.swibe
Swibe Self-Repair Mission Goal: Autonomously scan Swibe's source code, detect potential issues, and propose patches.

**Primitives:** swarm, evolve

**Run:** `swibe run examples/self-repair.swibe`

```swibe
-- Swibe Self-Repair Mission
-- Goal: Autonomously scan Swibe's source code, detect potential issues, and propose patches.

skill BugHunter {
  -- In a real scenario, this connects to the GitHub API v
...
```

---

### sovereign-birth.swibe
Swibe Sovereign Birth Ritual (v0.3.2) The agent births its own identity, derives keys, and seals its brain vault.

**Primitives:** swarm

**Run:** `swibe run examples/sovereign-birth.swibe`

```swibe
-- Swibe Sovereign Birth Ritual (v0.3.2)
-- The agent births its own identity, derives keys, and seals its brain vault.

skill SovereignRitual {
  secure {
    -- 1. Birth: Fresh entropy → BIPỌ̀N39 Ri
...
```

---

### sovereign-demo.swibe
THE SOVEREIGN DEMO One file. Full stack. No explanation needed.

**Primitives:** think, swarm, plan

**Run:** `swibe run examples/sovereign-demo.swibe`

```swibe
-- THE SOVEREIGN DEMO
-- One file. Full stack. No explanation needed.

swarm {
  Oracle: Agent {
    role: "thinker",
    goal: "What is the most important thing a sovereign AI must never forget?"
  }
...
```

---

### swarm-test.swibe
Swarm Test (v0.6)

**Primitives:** swarm

**Run:** `swibe run examples/swarm-test.swibe`

```swibe
-- Swarm Test (v0.6)

fn main() {
  println("Initiating Swarm...")
  
  swarm {
    Alpha: Agent {
      role: "Coordinator",
      goal: "Organize the ritual"
    } => Beta: Agent {
      role: "Work
...
```

---

### test-mint.swibe
test-mint.swibe

**Primitives:** basic

**Run:** `swibe run examples/test-mint.swibe`

```swibe
-- test-mint.swibe
fn main() {
    mint
}

```

---

### think-test.swibe
Think Test for v1.0 Plugin Verification

**Primitives:** think

**Run:** `swibe run examples/think-test.swibe`

```swibe
-- Think Test for v1.0 Plugin Verification

fn main() {
  println("Testing think hooks...")
  let thought = think("What is the nature of sovereignty?")
  println("Thought received.")
}

```

---

### tiny-hybrid-swarm.swibe
Tiny Hybrid Swarm (v1.1)

**Primitives:** swarm, chain

**Run:** `swibe run examples/tiny-hybrid-swarm.swibe`

```swibe
-- Tiny Hybrid Swarm (v1.1)

fn main() {
  println("Initiating Hybrid Swarm...")
  
  swarm {
    Thinker: Agent {
      role: "Analyzer @elixir",
      goal: "Generate insights"
    } => Settler: Age
...
```

---

### todo-app.swibe
**Primitives:** swarm, plan

**Run:** `swibe run examples/todo-app.swibe`

```swibe
skill Architect {
  prompt: "Design minimal viable app for: simple daily planner"
}

skill Builder {
  prompt: "Generate complete Swibe code for the app (include UI if web)"
}

skill Healer {
  prompt
...
```

---

### v2-agent.swibe
Swibe v2 Agent — All New Primitives Demonstrates standalone v2 features

**Primitives:** think, budget, remember, evolve, ethics, observe

**Run:** `swibe run examples/v2-agent.swibe`

```swibe
-- Swibe v2 Agent — All New Primitives
-- Demonstrates standalone v2 features

fn main() {
    println("🌄 Sovereign Agent v2 Awakening")
    println("================================")

    -- Set et
...
```

---

## Primitives Reference

| Primitive | Purpose | Standalone |
|-----------|---------|------------|
| `think` | Real LLM call via Ollama/OpenRouter | ✅ |
| `chain` | Sequential reasoning steps | ✅ |
| `plan` | Auto-decompose goals | ✅ |
| `loop` | ReAct until condition | ✅ |
| `swarm` | Multi-agent coordination | ✅ |
| `budget` | Token/time limits | ✅ |
| `remember` | Persistent memory | ✅ |
| `evolve` | Soul state evolution | ✅ |
| `observe` | Event listeners | ✅ |
| `ethics` | Runtime ethics | ✅ |
| `retrieve` | RAG retrieval | ✅ |
| `receipt.onChain` | Sui blockchain | 🔌 Techgnosis |
| `earn` | ToC token economy | 🔌 Techgnosis |

