/**
 * Swibe Standard Library
 * Core functions for array, string, math, and I/O operations
 */

import vm from 'node:vm';
import crypto from 'node:crypto';
import { Agent, LLMIntegration, RAGIntegration } from './llm-integration.js';
import { sovereign } from './sovereign-vault.js';
import { NeuralLayer } from './neural.js';

class StandardLibrary {
  constructor() {
    this.goalAttempts = new Map();
    this.neural = new NeuralLayer();
    this.llm = new LLMIntegration();
    this.rag = new RAGIntegration();
    this.plugin = null;
    
    this.builtins = {
      'len': this.len.bind(this),
      'push': this.push.bind(this),
      'pop': this.pop.bind(this),
      'map': this.map.bind(this),
      'filter': this.filter.bind(this),
      'reduce': this.reduce.bind(this),
      'find': this.find.bind(this),
      'any': this.any.bind(this),
      'all': this.all.bind(this),
      'range': this.range.bind(this),
      'reverse': this.reverse.bind(this),
      'sort': this.sort.bind(this),
      'keys': this.keys.bind(this),
      'values': this.values.bind(this),
      'items': this.items.bind(this),
      'get': this.get.bind(this),
      'upper': this.upper.bind(this),
      'lower': this.lower.bind(this),
      'trim': this.trim.bind(this),
      'split': this.split.bind(this),
      'join': this.join.bind(this),
      'contains': this.contains.bind(this),
      'print': this.print.bind(this),
      'println': this.println.bind(this),
      'trace': this.trace.bind(this),
      'type': this.type.bind(this),
      'exit': this.exit.bind(this),
      'sleep': this.sleep.bind(this),
      'create_agent': this.create_agent.bind(this),
      'deploy_app': this.deploy_app.bind(this),
      'encrypt_storage': this.encrypt_storage.bind(this),
      'no_external_upload': this.no_external_upload.bind(this),
      'search_tags': this.search_tags.bind(this),
      'gen_ritual_keypair': this.gen_ritual_keypair.bind(this),
      'aes_gcm_encrypt': this.aes_gcm_encrypt.bind(this),
      'aes_gcm_decrypt': this.aes_gcm_decrypt.bind(this),
      'ed25519_sign': this.ed25519_sign.bind(this),
      'ed25519_verify': this.ed25519_verify.bind(this),
      'derive_aes_key': this.derive_aes_key.bind(this),
      'bipon39_entropyToMnemonic': this.bipon39_entropyToMnemonic.bind(this),
      'bipon39_mnemonicToSeed': this.bipon39_mnemonicToSeed.bind(this),
      'lookup_meta': this.lookup_meta.bind(this),
      'elemental_signature': this.elemental_signature.bind(this),
      'think': this.think.bind(this),
      'neural': this.neural,
      'refuse_if': this.refuse_if.bind(this),
      'seal': (msg) => msg,
    };
  }

  setPlugin(plugin) {
    this.plugin = plugin;
  }

  create_agent(config) {
    const agent = new Agent(config);
    if (this.plugin && typeof this.plugin.onBirth === 'function') {
      this.plugin.onBirth(agent);
    }
    return agent;
  }

  async think(prompt) {
    console.log(`[THINK] Processing: ${prompt.substring(0, 50)}...`);
    const result = await this.llm.think(prompt);
    
    // Wire Hook: after think → call onThink(prompt, response)
    if (this.plugin && typeof this.plugin.onThink === 'function') {
      this.plugin.onThink(prompt, result.content);
    }
    
    this.neural.fire(prompt, { type: 'thought', receipt: result.receipt });
    
    // Wire Hook: after receipt seal → call onReceipt(receipt)
    if (this.plugin && typeof this.plugin.onReceipt === 'function') {
      this.plugin.onReceipt(result.receipt);
    }
    
    return result;
  }

  async refuse_if(condition) {
    if (typeof condition === 'boolean' && condition) {
      throw new Error("Action refused by boolean condition.");
    }
    if (typeof condition === 'string') {
      const { content } = await this.think(`Review this ethical constraint: "${condition}". If it is violated by the current context, reply with "REFUSE". Otherwise "PROCEED".`);
      if (content.includes("REFUSE")) {
        throw new Error(`Action refused by ethical constraint: ${condition}`);
      }
    }
    return true;
  }

  lookup_meta(word) { return sovereign.lookupMeta(word); }
  elemental_signature(phrase) { return sovereign.elementalSignature(phrase); }
  encrypt_storage() { return true; }
  no_external_upload() { return true; }
  search_tags(query) { return ["photo1.jpg", "photo2.jpg"]; }
  deploy_app(config) { return "https://swibe-app.vercel.app"; }
  async sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

  async checkGoal(goal) {
    const attempts = this.goalAttempts.get(goal) || 0;
    this.goalAttempts.set(goal, attempts + 1);
    return attempts >= 1;
  }

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
  keys(obj) { return Object.keys(obj); }
  values(obj) { return Object.values(obj); }
  items(obj) { return Object.entries(obj); }
  get(obj, key, defaultVal = null) { return obj[key] !== undefined ? obj[key] : defaultVal; }
  upper(str) { return str.toUpperCase(); }
  lower(str) { return str.toLowerCase(); }
  trim(str) { return str.trim(); }
  split(str, sep) { return str.split(sep); }
  join(arr, sep) { return arr.join(sep); }
  contains(str, sub) { return str.includes(sub); }
  type(val) { return typeof val; }
  exit(code = 0) { process.exit(code); }
  print(...args) { process.stdout.write(args.join(' ')); }
  println(...args) { console.log(...args); }
  trace(message, data = null) {
    const timestamp = new Date().toISOString();
    console.log(`[TRACE] [${timestamp}] ${message}`, data ? JSON.stringify(data) : '');
  }

  async sandbox_run(fn) {
    console.warn('[SWIBE] secure{} sandbox: Node.js vm isolation. Not for untrusted code.');

    const path = await import('node:path');
    const os = await import('node:os');
    const fs = await import('node:fs');

    const ragApi = Object.freeze({
      save: async (key, data) => {
        const dir = path.join(os.homedir(), '.swibe');
        if (!fs.existsSync(dir)) fs.mkdirSync(dir);
        const dbPath = path.join(dir, 'vault.json');
        let db = {};
        if (fs.existsSync(dbPath)) db = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
        const embedding = await this.rag.embed(typeof data === 'string' ? data : JSON.stringify(data));
        db[key] = { data, embedding, timestamp: new Date().toISOString() };
        fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));

        if (this.plugin && typeof this.plugin.onSettle === 'function') {
          this.plugin.onSettle({ key: key || 'unknown', status: 'saved' });
        }

        console.log(`[SANDBOX-LOG] [RAG] Persistent store: ${key}`);
        return true;
      },
      search: async (query, n = 5) => {
        return this.rag.search(query, n);
      }
    });

    const script = new vm.Script(`(${fn.toString()})()`);
    const context = vm.createContext(Object.freeze({
      console: Object.freeze({ log: (...args) => console.log('[SANDBOX-LOG]', ...args) }),
      encrypt_storage: this.encrypt_storage.bind(this),
      no_external_upload: this.no_external_upload.bind(this),
      println: (...args) => console.log('[SANDBOX-LOG]', ...args),
      join: this.join.bind(this),
      trace: this.trace.bind(this),
      gen_ritual_keypair: this.gen_ritual_keypair.bind(this),
      aes_gcm_encrypt: this.aes_gcm_encrypt.bind(this),
      aes_gcm_decrypt: this.aes_gcm_decrypt.bind(this),
      ed25519_sign: this.ed25519_sign.bind(this),
      ed25519_verify: this.ed25519_verify.bind(this),
      derive_aes_key: this.derive_aes_key.bind(this),
      bipon39_entropyToMnemonic: this.bipon39_entropyToMnemonic.bind(this),
      bipon39_mnemonicToSeed: this.bipon39_mnemonicToSeed.bind(this),
      crypto: Object.freeze({ randomBytes: (n) => crypto.randomBytes(n) }),
      json: Object.freeze({ stringify: (obj) => JSON.stringify(obj), parse: (str) => JSON.parse(str) }),
      rag: ragApi,
      process: Object.freeze({ exit: () => { throw new Error('process.exit() is forbidden'); } })
    }));

    try {
      return await script.runInContext(context, { timeout: 5000 });
    } catch (err) {
      console.error('[SANDBOX-ERROR]', err.message);
      throw err;
    }
  }

  gen_ritual_keypair(seed) {
    const kp = sovereign.generateIdentity(seed);
    // Wire Hook: after gen_ritual_keypair → call onBirth(keypair)
    if (this.plugin && typeof this.plugin.onBirth === 'function') {
      this.plugin.onBirth(kp);
    }
    return kp;
  }

  aes_gcm_encrypt(data, seed) { return sovereign.encryptVault(data, seed); }
  aes_gcm_decrypt(encrypted, seed) { return sovereign.decryptVault(encrypted, seed); }
  ed25519_sign(data, privKey) { return sovereign.sign(data, privKey); }
  ed25519_verify(sig, data, pubKey) { return sovereign.verify(sig, data, pubKey); }
  derive_aes_key(seed) { return seed; }
  bipon39_entropyToMnemonic(entropy, bits) { return sovereign.generateRitualPhrase(bits); }
  bipon39_mnemonicToSeed(phrase) { return sovereign.deriveSeed(phrase); }
}

const sandbox = {
  run: async (fn) => { console.warn("Using deprecated global sandbox.run"); }
};

const mcp = {
  async call_tool(name, args) {
    if (name === "coinbase_api") return JSON.stringify({ price: "67000" });
    return `Result from ${name}`;
  }
};

class SwarmPipeline {
  constructor(steps) { this.steps = steps; this.results = {}; }
  async run(initialInput = '') {
    let currentInput = initialInput;
    for (const step of this.steps) {
      const agent = new Agent({ name: step.name, system_prompt: step.role });
      const result = await agent.run(currentInput);
      this.results[step.name] = result;
      currentInput = result;
    }
    return this.results;
  }
}

class MetaDigital {
  constructor(config) {
    this.name = config.name;
    this.ethics = config.ethics;
    this.chain = config.chain || [];
    this.output = config.output;
  }

  async run(input = '', context = {}) {
    const currentInput = input;
    const receiptContent = JSON.stringify({ input, output: this.output, chain: this.chain.length });
    const receipt = crypto.createHash('sha256').update(receiptContent).digest('hex');
    console.log(`[META-DIGITAL] Receipt Sealed: ${receipt}`);
    return this.output;
  }
}

export { StandardLibrary, SwarmPipeline, Agent, sandbox, mcp, MetaDigital };
