/**
 * Vibe Standard Library
 * Core functions for array, string, math, and I/O operations
 * Lines: 450+
 */

class StandardLibrary {
  constructor() {
    this.builtins = {
      // Array operations
      'len': this.len,
      'push': this.push,
      'pop': this.pop,
      'shift': this.shift,
      'unshift': this.unshift,
      'slice': this.slice,
      'map': this.map,
      'filter': this.filter,
      'reduce': this.reduce,
      'find': this.find,
      'includes': this.includes,
      'join': this.join,
      'reverse': this.reverse,
      'sort': this.sort,
      'flatten': this.flatten,
      'unique': this.unique,

      // String operations
      'str.len': this.strLen,
      'str.upper': this.strUpper,
      'str.lower': this.strLower,
      'str.trim': this.strTrim,
      'str.split': this.strSplit,
      'str.replace': this.strReplace,
      'str.contains': this.strContains,
      'str.starts_with': this.strStartsWith,
      'str.ends_with': this.strEndsWith,
      'str.chars': this.strChars,
      'str.reverse': this.strReverse,
      'str.pad_left': this.strPadLeft,
      'str.pad_right': this.strPadRight,

      // Math functions
      'abs': this.abs,
      'min': this.min,
      'max': this.max,
      'floor': this.floor,
      'ceil': this.ceil,
      'round': this.round,
      'sqrt': this.sqrt,
      'pow': this.pow,
      'log': this.log,
      'exp': this.exp,
      'sin': this.sin,
      'cos': this.cos,
      'tan': this.tan,
      'pi': Math.PI,
      'e': Math.E,

      // I/O functions
      'print': this.print,
      'println': this.println,
      'input': this.input,
      'format': this.format,

      // Type utilities
      'type': this.type,
      'is_array': this.isArray,
      'is_string': this.isString,
      'is_number': this.isNumber,
      'is_bool': this.isBool,
      'is_null': this.isNull,
      'is_option': this.isOption,
      'is_result': this.isResult,

      // Dictionary operations
      'dict.keys': this.dictKeys,
      'dict.values': this.dictValues,
      'dict.entries': this.dictEntries,
      'dict.has': this.dictHas,
      'dict.get': this.dictGet,
      'dict.set': this.dictSet,
      'dict.remove': this.dictRemove,
      'dict.merge': this.dictMerge,

      // Error handling
      'ok': this.ok,
      'err': this.err,
      'some': this.some,
      'none': this.none,
      'unwrap': this.unwrap,
      'unwrap_or': this.unwrapOr,

      // Collection functions
      'range': this.range,
      'zip': this.zip,
      'enumerate': this.enumerate,
      'any': this.any,
      'all': this.all,
    };
  }

  // Array Operations
  len(arr) {
    if (Array.isArray(arr)) return arr.length;
    if (typeof arr === 'string') return arr.length;
    if (typeof arr === 'object') return Object.keys(arr).length;
    return 0;
  }

  push(arr, item) {
    arr.push(item);
    return arr;
  }

  pop(arr) {
    return arr.pop();
  }

  shift(arr) {
    return arr.shift();
  }

  unshift(arr, item) {
    arr.unshift(item);
    return arr;
  }

  slice(arr, start = 0, end = undefined) {
    return arr.slice(start, end);
  }

  map(arr, fn) {
    return arr.map(fn);
  }

  filter(arr, predicate) {
    return arr.filter(predicate);
  }

  reduce(arr, fn, init = undefined) {
    return arr.reduce(fn, init);
  }

  find(arr, predicate) {
    return arr.find(predicate);
  }

  includes(arr, item) {
    return arr.includes(item);
  }

  join(arr, sep = ',') {
    return arr.join(sep);
  }

  reverse(arr) {
    return [...arr].reverse();
  }

  sort(arr, compareFn = undefined) {
    return [...arr].sort(compareFn);
  }

  flatten(arr, depth = 1) {
    return arr.flat(depth);
  }

  unique(arr) {
    return [...new Set(arr)];
  }

  // String Operations
  strLen(str) {
    return str.length;
  }

  strUpper(str) {
    return str.toUpperCase();
  }

  strLower(str) {
    return str.toLowerCase();
  }

  strTrim(str) {
    return str.trim();
  }

  strSplit(str, sep = '') {
    if (sep === '') return str.split('');
    return str.split(sep);
  }

  strReplace(str, from, to) {
    return str.replace(new RegExp(from, 'g'), to);
  }

  strContains(str, substr) {
    return str.includes(substr);
  }

  strStartsWith(str, prefix) {
    return str.startsWith(prefix);
  }

  strEndsWith(str, suffix) {
    return str.endsWith(suffix);
  }

  strChars(str) {
    return str.split('');
  }

  strReverse(str) {
    return str.split('').reverse().join('');
  }

  strPadLeft(str, width, char = ' ') {
    return str.padStart(width, char);
  }

  strPadRight(str, width, char = ' ') {
    return str.padEnd(width, char);
  }

  // Math Functions
  abs(n) {
    return Math.abs(n);
  }

  min(...nums) {
    return Math.min(...nums);
  }

  max(...nums) {
    return Math.max(...nums);
  }

  floor(n) {
    return Math.floor(n);
  }

  ceil(n) {
    return Math.ceil(n);
  }

  round(n, decimals = 0) {
    return Math.round(n * Math.pow(10, decimals)) / Math.pow(10, decimals);
  }

  sqrt(n) {
    return Math.sqrt(n);
  }

  pow(base, exp) {
    return Math.pow(base, exp);
  }

  log(n, base = Math.E) {
    return Math.log(n) / Math.log(base);
  }

  exp(n) {
    return Math.exp(n);
  }

  sin(n) {
    return Math.sin(n);
  }

  cos(n) {
    return Math.cos(n);
  }

  tan(n) {
    return Math.tan(n);
  }

  // I/O Functions
  print(...args) {
    process.stdout.write(args.join(''));
  }

  println(...args) {
    console.log(...args);
  }

  input(prompt = '') {
    if (prompt) this.print(prompt);
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    return new Promise(resolve => {
      rl.question('', ans => {
        rl.close();
        resolve(ans);
      });
    });
  }

  format(template, ...args) {
    let result = template;
    args.forEach((arg, i) => {
      result = result.replace(`{${i}}`, arg);
    });
    return result;
  }

  // Type Utilities
  type(val) {
    if (val === null) return 'null';
    if (Array.isArray(val)) return 'array';
    if (val && val.__type) return val.__type;
    return typeof val;
  }

  isArray(val) {
    return Array.isArray(val);
  }

  isString(val) {
    return typeof val === 'string';
  }

  isNumber(val) {
    return typeof val === 'number';
  }

  isBool(val) {
    return typeof val === 'boolean';
  }

  isNull(val) {
    return val === null;
  }

  isOption(val) {
    return val && val.__type === 'Option';
  }

  isResult(val) {
    return val && val.__type === 'Result';
  }

  // Dictionary Operations
  dictKeys(dict) {
    return Object.keys(dict);
  }

  dictValues(dict) {
    return Object.values(dict);
  }

  dictEntries(dict) {
    return Object.entries(dict);
  }

  dictHas(dict, key) {
    return key in dict;
  }

  dictGet(dict, key, defaultVal = null) {
    return dict.hasOwnProperty(key) ? dict[key] : defaultVal;
  }

  dictSet(dict, key, val) {
    dict[key] = val;
    return dict;
  }

  dictRemove(dict, key) {
    delete dict[key];
    return dict;
  }

  dictMerge(...dicts) {
    return Object.assign({}, ...dicts);
  }

  // Error Handling (Result type)
  ok(val) {
    return { __type: 'Result', ok: true, value: val };
  }

  err(val) {
    return { __type: 'Result', ok: false, error: val };
  }

  some(val) {
    return { __type: 'Option', some: true, value: val };
  }

  none() {
    return { __type: 'Option', some: false };
  }

  unwrap(result) {
    if (result.__type === 'Result' && result.ok) return result.value;
    if (result.__type === 'Result' && !result.ok) throw result.error;
    if (result.__type === 'Option' && result.some) return result.value;
    if (result.__type === 'Option' && !result.some) throw new Error('Called unwrap on None');
    throw new Error('Not a Result or Option');
  }

  unwrapOr(result, defaultVal) {
    if (result.__type === 'Result' && result.ok) return result.value;
    if (result.__type === 'Result' && !result.ok) return defaultVal;
    if (result.__type === 'Option' && result.some) return result.value;
    if (result.__type === 'Option' && !result.some) return defaultVal;
    return defaultVal;
  }

  // Collection Functions
  range(start, end = null, step = 1) {
    if (end === null) {
      end = start;
      start = 0;
    }
    const result = [];
    if (step > 0) {
      for (let i = start; i < end; i += step) result.push(i);
    } else {
      for (let i = start; i > end; i += step) result.push(i);
    }
    return result;
  }

  zip(...arrays) {
    const minLen = Math.min(...arrays.map(a => a.length));
    const result = [];
    for (let i = 0; i < minLen; i++) {
      result.push(arrays.map(a => a[i]));
    }
    return result;
  }

  enumerate(arr) {
    return arr.map((val, idx) => [idx, val]);
  }

  any(arr, predicate = x => x) {
    return arr.some(predicate);
  }

  all(arr, predicate = x => x) {
    return arr.every(predicate);
  }

  // Agentic Primitives
  trace(message, data = null) {
    const timestamp = new Date().toISOString();
    console.log(`[TRACE] [${timestamp}] ${message}`, data ? JSON.stringify(data) : '');
  }
}

class SwarmPipeline {
  constructor(steps) {
    this.steps = steps;
    this.results = {};
  }

  async run() {
    console.log(`[SWARM] Starting pipeline with ${this.steps.length} steps`);
    for (const step of this.steps) {
      console.log(`[SWARM] Step: ${step.name}`);
      // In a real implementation, this would call the LLM/Agent
      this.results[step.name] = `Result from ${step.name}`;
    }
    return this.results;
  }
}

class Agent {
  constructor(config) {
    this.config = config;
  }
}

async function checkGoal(goal) {
  // Mock goal checking
  console.log(`[GOAL] Checking goal: ${goal}`);
  return Math.random() > 0.8; // Randomly "succeed" for demo
}

export { StandardLibrary, SwarmPipeline, Agent, checkGoal };

