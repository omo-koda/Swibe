/**
 * Vibe Playground Server
 * Handles compilation requests from the web UI
 */

const express = require('express');
const path = require('path');
const { Lexer } = require('../src/lexer');
const { Parser } = require('../src/parser');
const { Compiler } = require('../src/compiler');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname)));

/**
 * Compile Vibe code to target language
 */
app.post('/api/compile', (req, res) => {
  const { code, target = 'javascript' } = req.body;

  if (!code) {
    return res.status(400).json({ error: 'No code provided' });
  }

  try {
    // Lexical analysis
    const lexer = new Lexer(code);
    const tokens = lexer.tokenize();

    // Parsing
    const parser = new Parser(tokens);
    const ast = parser.parse();

    // Code generation
    const compiler = new Compiler(ast);
    const output = compiler.compile(target);

    res.json({
      success: true,
      output,
      target,
      tokens: tokens.length,
      ast: ast.type
    });
  } catch (error) {
    res.status(400).json({
      error: error.message,
      type: error.constructor.name
    });
  }
});

/**
 * Health check
 */
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', version: '0.1.0' });
});

/**
 * Available targets
 */
app.get('/api/targets', (req, res) => {
  res.json({
    targets: [
      { id: 'javascript', name: 'JavaScript' },
      { id: 'python', name: 'Python' },
      { id: 'rust', name: 'Rust' },
      { id: 'go', name: 'Go' },
      { id: 'java', name: 'Java' },
      { id: 'cpp', name: 'C++' },
      { id: 'typescript', name: 'TypeScript' }
    ]
  });
});

/**
 * Format code
 */
app.post('/api/format', (req, res) => {
  const { code } = req.body;
  
  if (!code) {
    return res.status(400).json({ error: 'No code provided' });
  }

  try {
    const lexer = new Lexer(code);
    const tokens = lexer.tokenize();
    const parser = new Parser(tokens);
    const ast = parser.parse();
    
    // Simple formatter: reconstruct code from AST
    const formatted = reconstructCode(ast);
    
    res.json({ success: true, formatted });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * Parse code to AST
 */
app.post('/api/parse', (req, res) => {
  const { code } = req.body;

  if (!code) {
    return res.status(400).json({ error: 'No code provided' });
  }

  try {
    const lexer = new Lexer(code);
    const tokens = lexer.tokenize();
    const parser = new Parser(tokens);
    const ast = parser.parse();

    res.json({
      success: true,
      ast,
      tokens: tokens.length
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * Example programs
 */
app.get('/api/examples', (req, res) => {
  res.json({
    examples: [
      {
        id: 'hello',
        name: 'Hello World',
        code: 'fn main() {\n  println("Hello, World!")\n}'
      },
      {
        id: 'fibonacci',
        name: 'Fibonacci',
        code: 'fn fib(n: i32) -> i32 {\n  if n <= 1 { n } else { fib(n-1) + fib(n-2) }\n}'
      },
      {
        id: 'sum',
        name: 'Sum Array',
        code: 'fn sum(arr: [i32]) -> i32 {\n  reduce(arr, fn(a, b) { a + b }, 0)\n}'
      },
      {
        id: 'ai_prompt',
        name: 'AI Prompt',
        code: 'fn classify(text: str) {\n  %% classify this text as positive or negative\n}'
      }
    ]
  });
});

function reconstructCode(ast) {
  // Simple reconstruction - can be improved
  return JSON.stringify(ast, null, 2);
}

app.listen(port, () => {
  console.log(`🎵 Vibe Playground running on http://localhost:${port}`);
  console.log(`📝 Open http://localhost:${port} in your browser`);
});
