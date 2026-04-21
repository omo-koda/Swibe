import { Lexer } from './src/lexer.js';
import fs from 'fs';

const source = fs.readFileSync('examples/app_genesis.swibe', 'utf8');
const lexer = new Lexer(source);
const tokens = lexer.tokenize();

// Print tokens around line 27
for (let i = 0; i < tokens.length; i++) {
  const t = tokens[i];
  if (t.line >= 25 && t.line <= 30) {
    console.log(`${i}: ${t.type} ('${t.value}') at ${t.line}:${t.column}`);
  }
}
