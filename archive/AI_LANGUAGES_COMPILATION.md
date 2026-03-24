# Swibe Language - AI-Focused Language Targets

## Complete Target List (13 Languages)

Swibe compiles to all major AI and data science languages:

### Data Science & Statistics
- **R** - Statistical computing, data visualization, ML frameworks
- **MATLAB** - Numerical computing, signal processing
- **Python** - Already included, ML/AI/data science standard

### Machine Learning & Symbolic AI
- **Julia** - Multiple dispatch, scientific computing, high performance
- **Lisp** - Classical AI, symbolic computation, REPL-driven development
- **Prolog** - Logic programming, constraint solving, declarative AI

### Functional Programming (AI Foundations)
- **Haskell** - Pure functional, lazy evaluation, type system
- **Idris** - Dependent types, proof-based programming

### Web & Embedded AI
- **JavaScript** - Web AI, TensorFlow.js, Node.js
- **Lua** - Embedded AI in games, neural networks
- **Go** - High-performance services, concurrent systems

### Systems Programming
- **Rust** - Safe systems AI, blockchain
- **Move** - Linear types for resource-safe AI

---

## Use Cases by Target

### R: Statistical AI & Data Analysis
```bash
npm run compile myapp.swibe --target r
```
**Best for:** Statistical learning, data visualization, research

```r
main <- function() {
  print("Hello, Swibe world!")
}

add <- function(a, b) {
  a + b
}
```

### MATLAB: Numerical Computing
```bash
npm run compile myapp.swibe --target matlab
```
**Best for:** Signal processing, control systems, rapid prototyping

```matlab
function varargout = main()
    print('Hello, Swibe world!')
end

function varargout = add(a, b)
    a + b
end
```

### Julia: High-Performance ML
```bash
npm run compile myapp.swibe --target julia
```
**Best for:** Scientific computing, matrix operations, ML research

```julia
function main()
  print("Hello, Swibe world!")
end

function add(a::Int32, b::Int32)
  a + b
end
```

### Prolog: Logic & Constraint AI
```bash
npm run compile myapp.swibe --target prolog
```
**Best for:** Expert systems, constraint satisfaction, rule-based AI

```prolog
main() :- print('Hello, Swibe world!').
add(A, B) :- (a + b).
```

### Lisp: Symbolic AI & Metaprogramming
```bash
npm run compile myapp.swibe --target lisp
```
**Best for:** Symbolic reasoning, code generation, classical AI

```lisp
(defun main ()
  (print "Hello, Swibe world!")
)

(defun add (a b)
  (+ a b)
)
```

### Haskell: Formal Methods & Type Safety
```bash
npm run compile myapp.swibe --target haskell
```
**Best for:** Verified code, functional programming, theorem proving

```haskell
main
main = print "Hello, Swibe world!"

add :: Int
add a b = (a + b)
```

### Lua: Embedded & Game AI
```bash
npm run compile myapp.swibe --target lua
```
**Best for:** Game AI, embedding in applications, neural networks

```lua
function main()
  print("Hello, Swibe world!")
end

function add(a, b)
  a + b
end
```

---

## Compilation Examples

### Compile to all AI targets:
```bash
# R
node src/index.js compile app.swibe --target r

# MATLAB
node src/index.js compile app.swibe --target matlab

# Julia
node src/index.js compile app.swibe --target julia

# Prolog
node src/index.js compile app.swibe --target prolog

# Lisp
node src/index.js compile app.swibe --target lisp

# Haskell
node src/index.js compile app.swibe --target haskell

# Lua
node src/index.js compile app.swibe --target lua
```

---

## Language Comparison Table

| Language | Domain | Type System | Paradigm | AI Focus |
|----------|--------|-------------|----------|----------|
| R | Statistics | Dynamic | Functional/Imperative | Data Science ⭐⭐⭐ |
| MATLAB | Numerics | Dynamic | Imperative | Math/Signal ⭐⭐⭐ |
| Julia | Scientific | Dynamic (typed) | Multiple Dispatch | ML/Science ⭐⭐⭐⭐⭐ |
| Prolog | Logic | Dynamic | Declarative | Symbolic ⭐⭐⭐⭐ |
| Lisp | Symbolic | Dynamic | Functional/Meta | Classical AI ⭐⭐⭐⭐ |
| Haskell | Math | Static | Pure Functional | Verification ⭐⭐⭐ |
| Lua | Embedded | Dynamic | Imperative | Game/Neural ⭐⭐ |
| Python | General | Dynamic | Multi | Universal ⭐⭐⭐⭐⭐ |
| JavaScript | Web | Dynamic | Multi | Web AI ⭐⭐⭐ |
| Go | Backend | Static | Multi | Services ⭐⭐ |
| Rust | Systems | Static | Multi | Safe Systems ⭐⭐ |
| Idris | Proof | Static | Functional | Verification ⭐⭐⭐ |
| Move | Blockchain | Linear | Multi | Resource Safe ⭐ |

---

## Type System Mappings for AI

### Numeric Types
```
Swibe      →  R        MATLAB      Julia          Prolog          Lua
i32       →  integer  int32       Int32          (number)        number
i64       →  integer  int64       Int64          (number)        number
f32       →  numeric  single      Float32        (float)         number
f64       →  numeric  double      Float64        (float)         number
```

### Collections
```
Swibe [T]  →  R        MATLAB      Julia          Prolog          Lua
           →  c(...)   [...]       Vector{...}    [...]           {...}
```

---

## AI Frameworks by Target

### R
- TensorFlow for R
- Keras
- Caret (classification/regression)
- XGBoost

### MATLAB
- Deep Learning Toolbox
- Parallel Computing Toolbox
- Statistical Toolbox
- Signal Processing Toolbox

### Julia
- Flux.jl (neural networks)
- MLJ.jl (machine learning)
- DifferentialEquations.jl
- Optimization.jl

### Python (via Swibe)
- TensorFlow/PyTorch
- Scikit-learn
- XGBoost
- JAX

### JavaScript
- TensorFlow.js
- Brain.js
- Ml.js
- OpenAI API clients

### Prolog
- SWI-Prolog
- CHR (Constraint Handling Rules)
- Constraint solvers
- Logic inference engines

### Lisp
- CLIPS (Expert Systems)
- ACL2 (Proof system)
- CL-ML
- Symbol manipulation

### Lua
- Torch (neural networks)
- MoonRocks
- Game AI libraries
- LÖVE (game framework)

---

## Performance Characteristics

| Language | Speed | Startup | Memory | Best For |
|----------|-------|---------|--------|----------|
| Rust | ⭐⭐⭐⭐⭐ | ⭐ | ⭐⭐⭐⭐ | Performance |
| Go | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | Services |
| Julia | ⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐ | Computing |
| MATLAB | ⭐⭐⭐ | ⭐⭐ | ⭐⭐ | Prototyping |
| Haskell | ⭐⭐⭐ | ⭐ | ⭐⭐⭐ | Verification |
| JavaScript | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐ | Web |
| Python | ⭐⭐ | ⭐⭐⭐ | ⭐⭐ | Learning |
| Lua | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | Embedded |
| Prolog | ⭐⭐ | ⭐⭐ | ⭐⭐⭐ | Logic |
| Lisp | ⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐ | Meta |
| R | ⭐ | ⭐⭐ | ⭐ | Stats |
| Idris | ⭐ | ⭐ | ⭐⭐ | Proof |
| Move | ⭐⭐⭐ | ⭐ | ⭐⭐⭐⭐ | Blockchain |

---

## Choosing a Target

### For Data Science
→ Use **R**, **MATLAB**, or **Python**

### For Machine Learning Research
→ Use **Julia** or **Python**

### For Symbolic/Logical AI
→ Use **Prolog** or **Lisp**

### For Verified Code
→ Use **Idris** or **Haskell**

### For High Performance
→ Use **Rust**, **Go**, or **Julia**

### For Web Applications
→ Use **JavaScript** or **Python**

### For Game AI
→ Use **Lua** or **Go**

### For Blockchain
→ Use **Move** or **Rust**

---

## Example: Multi-Target AI App

Single Swibe source code:

```swibe
fn classify(text: str) -> str {
  %% use sentiment analysis to classify as positive or negative
}

fn predict(features: [f64]) -> f64 {
  %% predict using trained model
}

fn train_model(data: [str]) {
  %% train ML model on data
}
```

Then compile to all targets:

```bash
# For R (stats)
npm run compile app.swibe --target r

# For Julia (ML research)
npm run compile app.swibe --target julia

# For Python (general ML)
npm run compile app.swibe --target python

# For Prolog (symbolic reasoning)
npm run compile app.swibe --target prolog

# For JavaScript (web deployment)
npm run compile app.swibe --target javascript

# For Lua (game integration)
npm run compile app.swibe --target lua
```

Each generates idiomatic code for that language!

---

## Next Steps

1. **Write Swibe code** with your AI algorithms
2. **Choose target languages** based on your use case
3. **Compile to all targets** in one command
4. **Use AI frameworks** native to each language
5. **Deploy anywhere** - same logic, different languages

---

**Version**: v0.3.0 (AI-Complete)
**Updated**: December 2025

This update makes Swibe the **most comprehensive AI language compilation system**, supporting all major AI and data science languages in one place.
