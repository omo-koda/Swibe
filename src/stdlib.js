/**
 * Swibe Standard Library
 * Core functions for array, string, math, and I/O operations
 */

import vm from 'node:vm';
import { Agent, LLMIntegration } from './llm-integration.js';

class StandardLibrary {
  constructor() {
    this.builtins = {
      // Array operations
      'len': this.len,
      'push': this.push,
      'pop': this.pop,
      'map': this.map,
      'filter': this.filter,
      'reduce': this.reduce,
      'find': this.find,
      'any': this.any,
      'all': this.all,
      'range': this.range,
      'reverse': this.reverse,
      'sort': this.sort,
      
      // Dictionary operations
      'keys': this.keys,
      'values': this.values,
      'items': this.items,
      'get': this.get,
      
      // String operations
      'upper': this.upper,
      'lower': this.lower,
      'trim': this.trim,
      'split': this.split,
      'join': this.join,
      'contains': this.contains,
      
      // I/O & Utils
      'print': this.print,
      'println': this.println,
      'trace': this.trace,
      'type': this.type,
      'exit': this.exit,
    };
  }

  // Array operations
  len(arr) { return Array.isArray(arr) || typeof arr === 'string' ? arr.length : 0; }
  push(arr, item) { arr.push(item); return arr; }
  pop(arr) { return arr.pop(); }
  map(arr, fn) { return arr.map(fn); }
  filter(arr, fn) { return arr.filter(fn); }
  reduce(arr, fn, init) { return arr.reduce(fn, init); }
  find(arr, fn) { return arr.find(fn); }
  any(arr, pred = x => x) { return arr.some(pred); }
  all(arr, pred = x => x) { return arr.every(pred); }
  reverse(arr) { return [...arr].reverse(); }
  sort(arr) { return [...arr].sort(); }
  
  range(start, end = null) {
    if (end === null) { end = start; start = 0; }
    const result = [];
    for (let i = start; i < end; i++) result.push(i);
    return result;
  }

  // Dictionary operations
  keys(obj) { return Object.keys(obj); }
  values(obj) { return Object.values(obj); }
  items(obj) { return Object.entries(obj); }
  get(obj, key, defaultVal = null) { return obj[key] !== undefined ? obj[key] : defaultVal; }

  // String operations
  upper(str) { return str.toUpperCase(); }
  lower(str) { return str.toLowerCase(); }
  trim(str) { return str.trim(); }
  split(str, sep) { return str.split(sep); }
  join(arr, sep) { return arr.join(sep); }
  contains(str, sub) { return str.includes(sub); }

  // Utils
  type(val) { return typeof val; }
  exit(code = 0) { process.exit(code); }

  print(...args) {
    process.stdout.write(args.join(' '));
  }

  println(...args) {
    console.log(...args);
  }

  trace(message, data = null) {
    const timestamp = new Date().toISOString();
    console.log(`[TRACE] [${timestamp}] ${message}`, data ? JSON.stringify(data) : '');
  }

  async checkGoal(goal) {
    console.log(`[GOAL] Checking: ${goal}`);
    return Math.random() > 0.8;
  }
}

const sandbox = {
  async run(fn) {
    console.log('[SANDBOX] Entering secure execution block...');
    // Create a script that executes the function
    const script = new vm.Script(`(${fn.toString()})()`);
    const context = vm.createContext({
      console: { log: (...args) => console.log('[SANDBOX-LOG]', ...args) },
      setTimeout,
      clearTimeout,
      process: { exit: () => { throw new Error('process.exit() is forbidden'); } }
    });
    try {
      return await script.runInContext(context, { timeout: 1000 });
    } catch (err) {
      console.error('[SANDBOX-ERROR]', err.message);
      throw err;
    }
  }
};

const mcp = {
  async call_tool(name, args) {
    console.log(`[MCP] Calling tool: ${name}`, JSON.stringify(args));
    return `Result from ${name}`;
  }
};

class SwarmPipeline {
  constructor(steps) {
    this.steps = steps;
    this.results = {};
  }

  async run(initialInput = '') {
    console.log(`[SWARM] Starting pipeline with ${this.steps.length} steps`);
    let currentInput = initialInput;

    for (const step of this.steps) {
      console.log(`[SWARM] Step: ${step.name}`);
      const agent = step.role instanceof Agent ? step.role : new Agent({ name: step.name, system_prompt: step.role });
      
      const result = await agent.run(currentInput);
      this.results[step.name] = result;
      currentInput = result; // Pass output of one agent as input to the next
    }
    
    return this.results;
  }
}

export { StandardLibrary, SwarmPipeline, Agent, sandbox, mcp };
