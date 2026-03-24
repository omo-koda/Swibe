# Swibe Language - Multi-Target Update

## New Compilation Targets Added

Swibe now supports **7 language targets**:

### JavaScript (Original)
```bash
npm run compile examples/hello.swibe
npm run compile examples/hello.swibe --target javascript
```

### Python (Original)
```bash
npm run compile examples/hello.swibe --target python
```

### Rust (Original)
```bash
npm run compile examples/hello.swibe --target rust
```

### Go (NEW)
```bash
npm run compile examples/hello.swibe --target go
```
- Generates package main with fmt imports
- Goroutine-like concurrency patterns
- Type mapping: `i32` → `int32`, `str` → `string`, etc.

### Julia (NEW)
```bash
npm run compile examples/hello.swibe --target julia
```
- Multiple dispatch support native
- Type annotations: `::`
- Vector and array syntax
- Perfect for scientific computing

### Idris (NEW)
```bash
npm run compile examples/hello.swibe --target idris
```
- Dependent types support
- Proof-based programming
- Type signatures with →
- Functional style emphasis

### Move (NEW)
```bash
npm run compile examples/hello.swibe --target move
```
- Linear resource management
- Module-based organization
- Blockchain-friendly
- Memory safety first-class

## Target Comparison

| Language | Use Case | Memory Safety | Types | Concurrency |
|----------|----------|---------------|-------|-------------|
| JavaScript | Web/Node.js | Garbage collected | Dynamic | Async/Await |
| Python | Data Science | Garbage collected | Dynamic | Async/Await |
| Rust | Systems | Manual/Ownership | Static | Threads/Async |
| Go | Backend | Garbage collected | Static | Goroutines |
| Julia | Scientific | Garbage collected | Dynamic (typed) | Threads |
| Idris | Formal Proof | Garbage collected | Dependent | Sequential |
| Move | Blockchain | Linear types | Static | Sequential |

## Type System Mappings

### Primitive Types
```
Swibe Type → Target Language
i32       → JavaScript: number, Python: int, Go: int32, Julia: Int32, Idris: Int, Move: u64
i64       → int64, int, int64, Int64, Integer, u64
f32       → float, float, float32, Float32, Double, u64
f64       → float, float, float64, Float64, Double, u64
str       → string, str, string, String, String, vector<u8>
bool      → boolean, bool, bool, Bool, Bool, bool
```

### Collections
```
Swibe: [T]
→ JavaScript: Array
→ Python: List
→ Go: []T
→ Julia: Vector{T}
→ Idris: List T
→ Move: vector<T>
```

## Code Generation Examples

### Function Definition
**Swibe:**
```swibe
fn add(a: i32, b: i32) -> i32 { a + b }
```

**Go:**
```go
func add(a int32, b int32) int32 {
  a + b
}
```

**Julia:**
```julia
function add(a::Int32, b::Int32)
  a + b
end
```

**Idris:**
```idris
add : (a : Int) (b : Int) -> Int
add a b = (a + b)
```

**Move:**
```move
fun add(a: u64, b: u64): u64 {
  a + b
}
```

## Architecture

The compiler uses a **unified AST** that maps to all targets:

```
Swibe Source Code
    ↓
Lexer (tokenize)
    ↓
Parser (build AST)
    ↓
LLM Integration (process prompts)
    ↓
Code Generation (select target)
    ├─ genJavaScript()
    ├─ genPython()
    ├─ genRust()
    ├─ genGo()
    ├─ genJulia()
    ├─ genIdris()
    └─ genMove()
    ↓
Target Language Code
```

## Implementation Details

### Go Generator (genGo)
- Generates `package main` header
- Auto-imports `fmt` for print statements
- Type-safe function signatures
- fmt.Println for output

### Julia Generator (genJulia)
- Type annotations with `::`
- Multiple dispatch ready
- Function/end blocks
- Vector array syntax

### Idris Generator (genIdris)
- Type signatures before implementation
- Dependent type support
- Functional style
- Parenthesized expressions

### Move Generator (genMove)
- Module wrapper
- Linear type system
- Resource safety
- Struct definitions

## Extending to New Targets

To add a new language target:

1. **Add case to generateCode():**
   ```javascript
   case 'newlang':
     return this.genNewLang(node);
   ```

2. **Implement generator method:**
   ```javascript
   genNewLang(node) {
     switch (node.type) {
       case 'FunctionDecl':
         // Generate function syntax
       // ... handle all AST node types
     }
   }
   ```

3. **Add type mapper:**
   ```javascript
   typeToNewLang(type) {
     const typeMap = { i32: 'int32', str: 'string', ... };
     return typeMap[type] || 'unknown';
   }
   ```

4. **Update CLI and documentation**

## Testing New Targets

```bash
# Compile with each target
npm run compile examples/hello.swibe --target go
npm run compile examples/hello.swibe --target julia
npm run compile examples/hello.swibe --target idris
npm run compile examples/hello.swibe --target move

# View generated code
npm run compile examples/hello.swibe --target julia | head -20
```

## Future Targets

Potential targets to add:
- **TypeScript** - Typed JavaScript variant
- **Kotlin** - JVM with better syntax
- **Swift** - Apple ecosystem
- **C++** - Systems programming
- **LLVM IR** - Universal backend
- **WebAssembly** - Browser execution
- **Solidity** - Smart contracts

## Performance Notes

- **JavaScript/Python**: Fast compilation, runtime interpreted
- **Go**: Fast compilation, fast execution
- **Rust**: Slower compilation, optimal execution
- **Julia**: JIT compilation, scientific computing focus
- **Idris**: Type-checking overhead, proof assistance
- **Move**: Type-checking + linear analysis overhead

## Documentation

- See `VIBE_SPEC.md` for full language specification
- See `QUICKSTART.md` for getting started guide
- See examples/ for working code samples

---

**Version**: v0.2.0 (Multi-target)
**Updated**: December 2025
