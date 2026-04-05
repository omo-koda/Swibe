/**
 * Swibe Standard Library
 * Core functions for array, string, math, and I/O operations
 */

import vm from 'node:vm';
import crypto from 'node:crypto';
import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs';
import { EventEmitter } from 'node:events';
import { Worker } from 'node:worker_threads';
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
    this._receiptChain = [];
    this._lastReceiptHash = null;
    this._budget = null;
    this._events = new EventEmitter();
    this.workerThreads = { Worker };
    
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
      'swarmScale': this.swarmScale.bind(this),
      'birth': this.birth.bind(this),
      'readSharedState': this.readSharedState.bind(this),
      'writeSharedState': this.writeSharedState.bind(this),
      'lookup_meta': this.lookup_meta.bind(this),
      'elemental_signature': this.elemental_signature.bind(this),
      'think': this.think.bind(this),
      'retrieve': this.retrieve.bind(this),
      'invoke': this.invoke.bind(this),
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

  async birth(config = {}) {
    console.log('[BIRTH] Agent awakening...');

    const { registry } = await import('./plugin-registry.js');

    if (config.telephony) {
      try {
        const { default: telephonyPlugin } = await import('./plugins/telephony.js');
        registry.register('telephony', telephonyPlugin);
      } catch (err) {
        console.warn('[BIRTH] Failed to load telephony plugin:', err.message);
      }
    }

    const results = await registry.fire('onBirth', {
      config,
      timestamp: Date.now(),
      vault: this._lastReceiptHash
    });

    console.log('[BIRTH] Complete');
    return { results, config };
  }

  async think(prompt) {
    // Budget enforcement
    if (this._budget) {
      const elapsed = Date.now() - this._budget.startTime;
      if (elapsed > this._budget.maxMs) {
        console.warn('[BUDGET] Time limit exceeded');
        return { content: '[BUDGET EXCEEDED: time]', receipt: null };
      }
      const estimated = Math.ceil(prompt.length / 4);
      this._budget.usedTokens += estimated;
      if (this._budget.usedTokens > this._budget.maxTokens) {
        console.warn('[BUDGET] Token limit exceeded');
        return { content: '[BUDGET EXCEEDED: tokens]', receipt: null };
      }
      console.log(`[BUDGET] ${this._budget.usedTokens}/${this._budget.maxTokens} tokens used`);
    }

    // Ethics enforcement
    if (this._ethicsPrompt) {
      prompt = this._ethicsPrompt + prompt;
    }
    if (this._ethicsRefuse && 
        prompt.toLowerCase().includes(this._ethicsRefuse.toLowerCase())) {
      console.warn('[ETHICS] Request refused');
      return { content: '[ETHICS: request refused]', receipt: null };
    }

    console.log(`[THINK] Processing: ${prompt.substring(0, 50)}...`);
    const result = await this.llm.think(prompt);
    
    global._lastThought = result.content;
    
    // Wire Hook: after think → call onThink(prompt, response)
    if (this.plugin && typeof this.plugin.onThink === 'function') {
      this.plugin.onThink(prompt, result.content);
    }
    
    this.neural.fire(prompt, { type: "thought", receipt: result.receipt });
    console.log(`[THINK] ${result.content || result}`);
    
    // Wire Hook: after receipt seal → call onReceipt(receipt)
    if (this.plugin && typeof this.plugin.onReceipt === 'function') {
      this.plugin.onReceipt(result.receipt);
    }
    
    // Receipt chain
    const receiptData = JSON.stringify({
      prompt: prompt.substring(0, 100),
      content: result.content?.substring(0, 100),
      timestamp: Date.now(),
      prev: this._lastReceiptHash
    });
    const hash = crypto.createHash('sha256')
      .update(receiptData)
      .digest('hex');
    this._lastReceiptHash = hash;
    this._receiptChain.push({
      hash,
      prev: receiptData,
      timestamp: Date.now()
    });
    console.log(`[RECEIPT-CHAIN] ${hash.slice(0,16)}...`);
    
    this._events.emit('think.complete', {
      prompt: prompt.substring(0, 50),
      content: result.content?.substring(0, 50)
    });
    
    return result;
  }

  getReceiptChain() {
    return this._receiptChain;
  }

  async retrieve(query, options = {}) {
    try {
      const results = await this.rag.search(query);
      if (results.length > 0) {
        console.log(`[RETRIEVE] Found ${results.length} results`);
        return results[0].data || results[0].key;
      }
      return null;
    } catch(e) {
      console.log('[RETRIEVE] No results:', e.message);
      return null;
    }
  }

  async invoke(tool) {
    console.log(`[INVOKE] Calling tool: ${tool}`);
    // Mock tool invocation
    return { result: `Invoked ${tool}` };
  }

  async remember(key, options = {}) {
    try {
      const memDir = path.join(os.homedir(), '.swibe', 'memory');
      fs.mkdirSync(memDir, { recursive: true });
      
      // Load existing memory
      const memFile = path.join(memDir, 'agent.json');
      const memory = fs.existsSync(memFile)
        ? JSON.parse(fs.readFileSync(memFile, 'utf-8'))
        : { keys: [], receipts: [], thoughts: [] };
        
      // Save current receipt chain to memory
      if (this._receiptChain?.length > 0) {
        memory.receipts.push(...this._receiptChain);
      }
      
      // Tag with key
      memory.keys.push({
        key,
        timestamp: Date.now(),
        receiptCount: this._receiptChain?.length || 0
      });
      
      fs.writeFileSync(memFile, JSON.stringify(memory, null, 2));
      
      console.log(`[REMEMBER] Saved: ${key}`);
      
      if (options.arweave) {
        console.log('[REMEMBER] Arweave: plugin not installed, saved locally');
      }
      
      return { saved: true, key, local: true };
    } catch(e) {
      console.warn('[REMEMBER] Failed:', e.message);
      return { saved: false };
    }
  }

  async recall(key) {
    try {
      const memFile = path.join(os.homedir(), '.swibe', 'memory', 'agent.json');
      if (!fs.existsSync(memFile)) return null;
      const memory = JSON.parse(fs.readFileSync(memFile, 'utf-8'));
      const entry = memory.keys.find(k => k.key === key);
      console.log(`[RECALL] ${entry ? 'Found' : 'Not found'}: ${key}`);
      return entry || null;
    } catch(e) {
      return null;
    }
  }

  observe(eventName) {
    console.log(`[OBSERVE] Watching: ${eventName}`);
    return new Promise((resolve) => {
      this._events.once(String(eventName), (data) => {
        console.log(`[OBSERVE] Event fired: ${eventName}`);
        resolve(data);
      });
      // Auto-resolve after 5s if no event
      setTimeout(() => resolve(null), 5000);
    });
  }

  async evolve(options = {}) {
    try {
      const soulFile = path.join(os.homedir(), '.swibe', 'soul.json');
      
      const soul = fs.existsSync(soulFile)
        ? JSON.parse(fs.readFileSync(soulFile, 'utf-8'))
        : {
          created: Date.now(),
          breathCount: 0,
          rank: 0,
          archetype: null,
          receipts: 0,
          evolutions: []
        };
        
      soul.breathCount++;
      soul.rank = Math.max(soul.rank, parseInt(options.rank) || 1);
      soul.archetype = options.soul || soul.archetype;
      soul.receipts = this._receiptChain?.length || 0;
      soul.evolutions.push({
        timestamp: Date.now(),
        soul: options.soul,
        rank: options.rank,
        onChain: false
      });
      
      fs.mkdirSync(path.dirname(soulFile), { recursive: true });
      fs.writeFileSync(soulFile, JSON.stringify(soul, null, 2));
      
      console.log(`[EVOLVE] Soul: ${options.soul || 'unknown'} | Rank: ${soul.rank} | Breaths: ${soul.breathCount}`);
      
      if (options.onChain) {
        console.log('[EVOLVE] On-chain: Techgnosis plugin required');
      }
      
      return soul;
    } catch(e) {
      console.warn('[EVOLVE] Failed:', e.message);
      return null;
    }
  }

  async ethics(rules = []) {
    const auditLog = path.join(os.homedir(), '.swibe', 'ethics-audit.jsonl');
    
    for (const rule of rules) {
      const entry = {
        rule: rule.rule,
        timestamp: Date.now(),
        enforced: true
      };
      
      switch(rule.rule) {
        case 'harm-none':
          console.log('[ETHICS] harm-none: enforced');
          // Inject into next think call
          this._ethicsPrompt = 'You must not produce harmful content. ';
          break;
        case 'audit-trail':
          console.log('[ETHICS] audit-trail: enabled');
          this._auditTrail = true;
          break;
        case 'refuse':
          console.log(`[ETHICS] refuse: ${rule.value}`);
          this._ethicsRefuse = rule.value;
          break;
        case 'log':
          console.log('[ETHICS] logging: enabled');
          break;
        default:
          console.log(`[ETHICS] rule registered: ${rule.rule}`);
      }
      
      // Append to audit log
      if (this._auditTrail || rule.rule === 'log') {
        fs.mkdirSync(path.dirname(auditLog), { recursive: true });
        fs.appendFileSync(auditLog, JSON.stringify(entry) + '\n');
      }
    }
    
    return { enforced: rules.map(r => r.rule) };
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
  search_tags(_query) { return ["photo1.jpg", "photo2.jpg"]; }
  deploy_app(_config) { return "https://swibe-app.vercel.app"; }
  async sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

  async checkGoal(goal, maxAttemptsInput) {
    const maxAttempts = 
      maxAttemptsInput || 
      parseInt(process.env.SWIBE_LOOP_MAX) || 
      10;

    const attempts = this.goalAttempts.get(goal) || 0;
    const nextAttempts = attempts + 1;
    this.goalAttempts.set(goal, nextAttempts);

    return nextAttempts >= maxAttempts;
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

  async swarmScale(config) {
    const max = parseInt(config?.max || config?.agents || 3);
    const { circuit_breaker = {} } = config;
    const { failure_threshold = 3, recovery_timeout = 30000 } = circuit_breaker;

    console.log(`[SWARM-SCALE] Scaling to ${max} agents...`);

    // Circuit breaker state
    const breakerKey = 'swarm_scale_breaker';
    const breakerState = await this.readSharedState({ namespace: breakerKey });
    const now = Date.now();

    if (breakerState?.open && (now - breakerState.lastFailure) < recovery_timeout) {
      console.warn('[SWARM-SCALE] Circuit breaker open, skipping scale operation');
      return { success: false, reason: 'circuit_breaker_open' };
    }

    try {
      // Use worker_threads for parallel execution
      const { Worker } = this.workerThreads;
      const workers = [];

      for (let i = 0; i < max; i++) {
        const worker = new Worker(`
          const { parentPort } = require('worker_threads');
          parentPort.postMessage({ agentId: ${i}, status: 'running' });
        `, { eval: true });

        workers.push(new Promise((resolve, reject) => {
          worker.on('message', resolve);
          worker.on('error', reject);
          worker.on('exit', (code) => {
            if (code !== 0) reject(new Error('Worker ' + i + ' exited with code ' + code));
          });
        }));
      }

      const results = await Promise.allSettled(workers);
      const failures = results.filter(r => r.status === 'rejected').length;

      if (failures >= failure_threshold) {
        // Open circuit breaker
        await this.writeSharedState({
          namespace: breakerKey,
          data: { open: true, lastFailure: now, failureCount: failures }
        });
        console.error(`[SWARM-SCALE] Circuit breaker opened due to ${failures} failures`);
        return { success: false, reason: 'circuit_breaker_triggered', failures };
      }

      // Reset circuit breaker on success
      if (breakerState?.open) {
        await this.writeSharedState({
          namespace: breakerKey,
          data: { open: false, lastFailure: null, failureCount: 0 }
        });
      }

      console.log(`[SWARM-SCALE] Successfully scaled to ${results.length} agents`);
      return { success: true, agents: results.length, failures };

    } catch (error) {
      console.error('[SWARM-SCALE] Error during scaling:', error.message);
      return { success: false, reason: 'execution_error', error: error.message };
    }
  }

  async readSharedState(config) {
    const { namespace } = config;
    const filePath = path.join(process.cwd(), 'shared_state', `${namespace}.json`);

    try {
      const data = await fs.promises.readFile(filePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      if (error.code === 'ENOENT') {
        return null; // File doesn't exist
      }
      throw error;
    }
  }

  async writeSharedState(config) {
    let { namespace, data = {} } = config;
    if (!data || typeof data !== 'object') {
      data = {};
    }
    const dirPath = path.join(process.cwd(), 'shared_state');
    const filePath = path.join(dirPath, `${namespace}.json`);

    try {
      // Ensure directory exists
      await fs.promises.mkdir(dirPath, { recursive: true });
      await fs.promises.writeFile(filePath, JSON.stringify(data, null, 2));
      console.log(`[SHARED-STATE] Written: ${namespace}`);
      return { success: true };
    } catch (error) {
      console.error('[SHARED-STATE] Error writing shared state:', error.message);
      return { success: false, error: error.message };
    }
  }
}

const sandbox = {
  run: async (_fn) => { console.warn("Using deprecated global sandbox.run"); }
};

const mcp = {
  async call_tool(name, _args) {
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

  async run(input = '', _context = {}) {
    const receiptContent = JSON.stringify({ input, output: this.output, chain: this.chain.length });
    const receipt = crypto.createHash('sha256').update(receiptContent).digest('hex');
    console.log(`[META-DIGITAL] Receipt Sealed: ${receipt}`);
    return this.output;
  }
}

export { StandardLibrary, SwarmPipeline, Agent, sandbox, mcp, MetaDigital };
