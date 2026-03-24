# Swibe Language Specification

## Overview
Swibe is an AI-native, prompt-first programming language where AI constructs are first-class citizens. Code can be written via voice, prompts, or traditional syntax. Compiles to JavaScript, Python, Go, Rust, etc.

## Core Philosophy
- **Swibe First**: Natural language prompts are valid syntax
- **AI Native**: LLM calls, RAG queries, embeddings built-in
- **Multi-Target**: Compile to any language
- **Type Smart**: Inferred types with Julia-like multiple dispatch
- **Safe by Default**: Memory safety inspired by Rust

## Language Syntax

### 1. Basic Functions

```swibe
-- Traditional function syntax
fn add(a: i32, b: i32) -> i32 {
  a + b
}

-- Prompt-first function (AI writes body)
fn classify(text: str) {
  %% classify this text as positive, negative, or neutral
}

-- Voice input
fn process_audio() {
  %% [voice: "create a function that converts audio to text using whisper"]
}
```

### 2. AI as First-Class

```swibe
-- Direct LLM call
response = ai.generate("write a poem about coding")

-- RAG query
docs = rag.search("how to use swibe language", top_k=5)

-- Embedding similarity
similarity = embed.cosine(text1, text2)

-- Agent system
agent = Agent {
  name: "CodeWriter",
  tools: [search, execute, refine],
  system_prompt: %% "You are an expert programmer"
}

result = agent.run("build a todo app")
```

### 3. Type System (Julia-like)

```swibe
-- Multiple dispatch
fn process(x: i32) -> str { "int" }
fn process(x: str) -> str { "string" }
fn process(x: [f64]) -> str { "array" }

-- Generic types (Rust-like)
fn first<T>(arr: [T]) -> T {
  arr[0]
}

-- Trait/interface system
trait Serializable {
  fn to_json(self) -> str
}
```

### 4. Memory Safety (Rust-inspired)

```swibe
-- Ownership
value = Data { x: 42 }  -- value owns Data
ref = &value            -- borrow

-- Immutable by default
x = 10                  -- immutable
mut y = 20              -- mutable

-- No null (Option type)
option_val: Option<i32> = Some(42)
match option_val {
  Some(n) => print(n),
  None => print("empty")
}
```

### 5. Async/Concurrent (Go-inspired)

```swibe
-- Goroutine-like spawning
spawn {
  result = fetch("https://api.example.com")
  channel <- result
}

-- Channel communication
ch = channel<str>()
spawn { ch <- "hello" }
msg = <- ch

-- Async function
async fn fetch_data(url: str) -> str {
  response = await http.get(url)
  response.body
}
```

### 6. Move Semantics (Move language inspired)

```swibe
-- Linear types (resource management)
resource File = { handle: i64, path: str }

fn read_file(f: File) -> str {
  -- f is consumed here, cannot be used after
  content = fs.read(f.handle)
  content
}
```

### 7. Data Structures

```swibe
-- Struct
struct User {
  id: u64,
  name: str,
  email: str,
  tags: [str]
}

-- Enum
enum Status {
  Active,
  Inactive,
  Pending
}

-- Protocol/Interface
protocol Drawable {
  fn draw(self)
}
```

## Compilation Targets

Swibe compiles to:
- JavaScript/TypeScript
- Python
- Go
- Rust
- Java
- C++
- WASM

## Built-in Modules

- `ai`: LLM integration
- `rag`: Retrieval augmented generation
- `embed`: Embedding models
- `agent`: Multi-tool agents
- `http`: HTTP requests
- `fs`: File system
- `db`: Database
- `crypto`: Cryptography
- `ml`: Machine learning

## REPL

Interactive swibe shell:
```
$ swibe repl
> fn hello() { print("world") }
> hello()
world

> %% create a fibonacci generator
> fib(10)
[0, 1, 1, 2, 3, 5, 8, 13, 21, 34]
```

## Example Programs

### Todo App Generator
```swibe
app = generate_app {
  %% create a todo app with add, delete, mark complete features
  database: "sqlite",
  ui: "web",
  api: "rest"
}

app.deploy("localhost:3000")
```

### Data Pipeline
```swibe
data = rag.search("climate data", top_k=100)
processed = data
  |> filter(x => x.year > 2020)
  |> map(x => { year: x.year, temp: embed.normalize(x.temp) })
  |> group_by(x => x.year)

save(processed, "climate_2020.json")
```

### Voice Coding
```swibe
%% [voice: "write a function that takes a list of numbers and returns the ones that are prime"]
```

---

*Next: Tokenizer, Parser, Type Checker, Compiler Backend*
