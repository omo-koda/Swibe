/**
 * Swibe Compiler wrapper for VSCode Extension
 */

import * as path from 'path';

// Dynamically import the Swibe compiler from the main project
let compiler: any = null;

async function loadCompiler() {
  if (!compiler) {
    try {
      const compilerPath = path.resolve(__dirname, '../../src/compiler.js');
      compiler = await import(compilerPath);
    } catch (error) {
      console.error('Failed to load Swibe compiler:', error);
      throw error;
    }
  }
  return compiler;
}

export async function compile(source: string): Promise<string> {
  const comp = await loadCompiler();
  if (comp.compile) {
    return comp.compile(source);
  }
  return 'Compilation not available';
}

export async function format(source: string): Promise<string> {
  const comp = await loadCompiler();
  if (comp.format) {
    return comp.format(source);
  }
  // Fallback: return source as-is if no formatter
  return source;
}
