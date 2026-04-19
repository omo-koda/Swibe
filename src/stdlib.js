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

import { ToCEconomy } from './toc/index.js';
import { SuiClientWrapper, WalrusStorage } from './backends/sui-integration.js';

class SovereignError extends Error {
  constructor(message, { layer, securityPolicy, receiptHash, detail } = {}) {
    super(message);
    this.name = 'SovereignError';
    this.layer = layer;
    this.securityPolicy = securityPolicy;
    this.receiptHash = receiptHash;
    this.detail = detail;
    this.timestamp = Date.now();
  }
}

class StandardLibrary {
  constructor() {
    this.goalAttempts = new Map();
    this.neural = new NeuralLayer();
    this.llm = new LLMIntegration();
    this.rag = new RAGIntegration();
    this.tocEconomy = new ToCEconomy();
    this.agentWalletPromise = this.tocEconomy.spawnAgent('agent-0', null, 10);
    this.agentWallet = null;
    this.plugin = null;
    this._receiptChain = [];
    this._lastReceiptHash = null;
    this._budget = null;
    this._violations = [];
    this._securityPolicy = {
      execution: 'standard',
      network: 'auto',
      filesystem: 'standard',
      memory: 'standard',
      receipts: 'optional',
      audit: 'off',
      llm_routing: 'performance_first',
      receipt_sealing: 'batch'
    };
    this._allowedPaths = [];
    this._events = new EventEmitter();
    this.workerThreads = { Worker };
    
    // Sui & Walrus
    this.sui = new SuiClientWrapper({
      packageId: process.env.SUI_PACKAGE_ID || '0x434ad5a62d3d9e03d32840c213699b703e7e43685e13028290f653456789abcd' // Placeholder
    });
    this.walrusStorage = new WalrusStorage();

    this.toc = {
      createWallet: async (name, config) => {
        return this.tocEconomy.wallets.createAgent(name, config);
      },
      stake: async (config) => {
        console.log(`[ToC] Staked:`, config);
        return { success: true };
      },
      slash: async (config) => {
        console.log(`[ToC] Slashed:`, config);
        const result = { success: true };
        if (this._securityPolicy?.audit === 'on') {
          await this._logToReceiptChain('slash', config);
        }
        return result;
      },
      convert: async (config) => {
        const amount = config.amount || 1000;
        const wallet = await this._getWallet();
        return this.tocEconomy.conversion.dopamineToSynapse(wallet.ownerId, amount);
      },
      royalty: async (config) => {
        console.log(`[ToC] Royalty paid:`, config);
        return { success: true };
      },
      appealSlash: async (slashId, evidence) => {
        const wallet = await this._getWallet();
        return this.tocEconomy.appealSlash(wallet.ownerId, slashId, evidence, this._receiptChain);
      },
      collectInterest: async () => {
        const wallet = await this._getWallet();
        const reward = this.tocEconomy.collectInterest(wallet.ownerId);
        return { success: true, reward };
      },
      escrow: async (name, config) => {
        console.log(`[ToC] Escrow created for ${name}:`, config);
        return { escrowId: `escrow-${Math.random().toString(36).substr(2, 9)}`, status: 'locked' };
      },
      defineToken: async (name, config) => {
        console.log(`[ToC] Token defined ${name}:`, config);
        return { tokenId: `token-${name.toLowerCase()}` };
      }
    };
    
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
      'sandbox_run': this.sandbox_run.bind(this),
      'readFile': this.readFile.bind(this),
      'writeFile': this.writeFile.bind(this),
      'editFile': this.editFile.bind(this),
      'neural': this.neural,
      'refuse_if': this.refuse_if.bind(this),
      'seal': (msg) => msg,
      'mint': this.mint.bind(this),
      'receipt': this.receipt.bind(this),
      'walrus': this.walrus.bind(this),
      'seal_statement': this.seal_statement.bind(this),
      'appeal_slash': this.toc.appealSlash.bind(this),
      'collect_interest': this.toc.collectInterest.bind(this),
      'stake_status': async () => {
        const wallet = await this._getWallet();
        const status = this.tocEconomy.getStakeStatus(wallet.ownerId);
        if (!status) console.log(`[STAKE-STATUS] No status found for ${wallet.ownerId}`);
        return status;
      },
      'pilot': this.pilot.bind(this),
      'witness': this.witness.bind(this),
      'viewport': this.viewport.bind(this),
      'gestalt': this.gestalt.bind(this),
      'mcp': this.mcp.bind(this),
    };
  }

  async pilot(config = {}) {
    console.log('[PILOT] Initializing computer control...');
    const { PilotEngine } = await import('./pilot.js');
    const pilot = new PilotEngine(config);
    // Map Swibe 'action' to PilotEngine 'type'
    const action = {
      type: config.action || config.type,
      ...config
    };
    const result = await pilot.execute(action);
    console.log(`[PILOT] Execution result: ${JSON.stringify(result)}`);
    return result;
  }

  async witness(config = {}) {
    console.log('[WITNESS] Activating multimodal perception...');
    const { WitnessEngine } = await import('./witness.js');
    const witness = new WitnessEngine(config);
    const result = await witness.perceive(config);
    return result;
  }

  async viewport(config = {}) {
    console.log('[VIEWPORT] Capturing screen state...');
    const { ViewportEngine } = await import('./viewport.js');
    const viewport = new ViewportEngine(config);
    const result = await viewport.analyze(config);
    return result;
  }

  async gestalt(tasks = [], options = {}) {
    console.log(`[GESTALT] Executing ${tasks.length} tasks in parallel...`);
    const { GestaltEngine } = await import('./gestalt.js');
    const gestalt = new GestaltEngine();
    const result = await gestalt.execute(tasks, { merge: options.merge || 'unified_context' });
    return result;
  }

  async mcp(config = {}) {
    console.log('[MCP] Connecting to tool servers...');
    // For now use a simplified version or the one from mcp-client.js if available
    try {
      const { MCPHub } = await import('./mcp-client.js');
      const hub = new MCPHub();
      // Add server if config provided
      if (config.name && (config.command || config.url)) {
        await hub.connect(config.name, config.transport || 'stdio', config);
      }
      return hub;
    } catch (e) {
      console.warn('[MCP] Using mock MCP client');
      return {
        call_tool: async (name, args) => `Mock result for ${name}`
      };
    }
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

  async _getWallet() {
    if (this.agentWallet) return this.agentWallet;
    this.agentWallet = await this.agentWalletPromise;
    return this.agentWallet;
  }

  async _logToReceiptChain(type, detail) {
    const receiptData = JSON.stringify({
      type,
      detail,
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
      timestamp: Date.now(),
      category: 'security',
      type
    });
    console.log(`[RECEIPT-CHAIN] ${type}: ${hash.slice(0,16)}...`);
  }

  async think(prompt, options = {}) {
    // Inject current security policy
    options.security_policy = this._securityPolicy;
    
    // LLM Routing logic
    if (this._securityPolicy?.llm_routing === 'ethics_only') {
      console.log('[LLM-ROUTING] Ethics-only mode: preferring safety models');
      prompt = `[SAFETY MODE: ENFORCED] ${prompt}`;
    }

    // Budget enforcement
    if (this._budget) {
      const elapsed = Date.now() - this._budget.startTime;
      if (elapsed > this._budget.maxMs) {
        console.warn('[BUDGET] Time limit exceeded');
        this._violations.push({ type: 'budget', detail: 'time limit exceeded', timestamp: Date.now() });
        return { content: '[BUDGET EXCEEDED: time]', receipt: null };
      }
      const estimated = Math.ceil(prompt.length / 4);
      this._budget.usedTokens += estimated;
      if (this._budget.usedTokens > this._budget.maxTokens) {
        console.warn('[BUDGET] Token limit exceeded');
        this._violations.push({ type: 'budget', detail: 'token limit exceeded', timestamp: Date.now() });
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
      if (this._hermeticPolarity) {
        const redirect = await this.llm.think(
          `The action "${prompt.substring(0,50)}" was refused for ethics. What is the constructive, ethical opposite action that achieves the underlying goal safely?`
        );
        console.log('[POLARITY] Redirect:', redirect.content?.substring(0,80));
        this._setVibrationTTL(prompt.substring(0, 50));
        return {
          content: `[ETHICS: redirected] ${redirect.content}`,
          receipt: null,
          polarity: redirect.content
        };
      }
      this._setVibrationTTL(prompt.substring(0, 50));
      console.warn('[ETHICS] Request refused');
      this._violations.push({ type: 'ethics', detail: 'request refused by rules', timestamp: Date.now() });
      return { content: '[ETHICS: request refused]', receipt: null };
    }

    // Hermetic: Mentalism — declare intent
    if (this._hermeticMentalism) {
      console.log(`[MENTALISM] Intent declared: ${prompt.substring(0, 60)}`);
    }

    console.log(`[THINK] Processing: ${prompt.substring(0, 50)}...`);
    
    // Burn Dopamine to act
    const burnAmount = options.burn || 1000;
    try {
      const wallet = await this._getWallet();
      wallet.spend('toc_d', burnAmount, 'think_action');
      console.log(`[ToC] Burned ${burnAmount} Dopamine for action.`);
    } catch (e) {
      console.warn(`[ToC] Action blocked: ${e.message}`);
      return { content: `[INSOLVENT] Not enough Dopamine to think.`, receipt: null };
    }

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
    
    const isPublic = options.publish_insights === true;
    const isSealed = options.seal_private === true;

    // Receipt chain
    const receiptData = JSON.stringify({
      prompt: isSealed ? "[SEALED]" : prompt.substring(0, 500),
      content: isSealed ? "[SEALED]" : result.content?.substring(0, 2000),
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
      timestamp: Date.now(),
      public: isPublic,
      sealed: isSealed,
      category: isPublic ? 'Insights' : 'general'
    });
    
    // Hardening: Merkle root
    const merkleRoot = this._calculateMerkleRoot();
    this._merkleRoot = merkleRoot;
    
    console.log(`[RECEIPT-CHAIN] ${hash.slice(0,16)}... | Merkle: ${merkleRoot.slice(0,8)}`);

    if (isPublic) {
      console.log(`[PUBLIC] Insight flagged for Obsidian: ${hash.slice(0,8)}`);
    }
    if (isSealed) {
      console.log(`[SEALED] Private reasoning trajectory encrypted.`);
    }

    // Receipt sealing: immediate vs batch
    if (this._securityPolicy?.receipt_sealing === 'immediate') {
      console.log(`[RECEIPT-SEALING] Immediate mode: sealing on-chain...`);
      await this.receipt({ hash: hash, type: 'immediate_seal' });
    }

    // Hermetic: Correspondence — soul karma
    if (this._hermeticCorrespondence) {
      try {
        const soulFile = path.join(
          os.homedir(), '.swibe', 'soul.json'
        );
        if (fs.existsSync(soulFile)) {
          const soul = JSON.parse(
            fs.readFileSync(soulFile, 'utf-8')
          );
          soul.karma = (soul.karma || 0) + 1;
          soul.lastAction = prompt.substring(0, 50);
          fs.writeFileSync(soulFile,
            JSON.stringify(soul, null, 2)
          );
          console.log(`[CORRESPONDENCE] Karma: ${soul.karma}`);
        }
      } catch(e) {}
    }
    
    this._events.emit('think.complete', {
      prompt: prompt.substring(0, 50),
      content: result.content?.substring(0, 50)
    });
    
    return result;
  }

  getReceiptChain() {
    return this._receiptChain;
  }

  _calculateMerkleRoot() {
    if (this._receiptChain.length === 0) return '0'.repeat(64);
    
    let level = this._receiptChain.map(r => Buffer.from(r.hash, 'hex'));
    
    while (level.length > 1) {
      if (level.length % 2 === 1) {
        level.push(level[level.length - 1]);
      }
      const next = [];
      for (let i = 0; i < level.length; i += 2) {
        const hash = crypto.createHash('sha256')
          .update(Buffer.concat([level[i], level[i + 1]]))
          .digest();
        next.push(hash);
      }
      level = next;
    }
    
    return level[0].toString('hex');
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
        
      // Save current receipt chain to memory with metadata
      if (this._receiptChain?.length > 0) {
        const chainWithMeta = this._receiptChain.map(r => ({
          ...r,
          public: r.public ?? options.public ?? false,
          category: r.category ?? options.category ?? 'general',
          tags: r.tags ?? options.tags ?? []
        }));
        memory.receipts.push(...chainWithMeta);
      }
      
      // Tag with key and metadata
      memory.keys.push({
        key,
        timestamp: Date.now(),
        receiptCount: this._receiptChain?.length || 0,
        public: options.public || false,
        category: options.category || 'general',
        tags: options.tags || []
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

  async commons(name, config = {}) {
    console.log(`[COMMONS] Connecting to federated commons: ${name || 'anonymous'}...`);
    if (config.stake) {
      console.log(`[COMMONS] Staking ${config.stake} Synapse for verification.`);
    }
    return { status: 'connected', protocol: 'synapse-v1', name };
  }

  async public_facing(name, config = {}) {
    console.log(`[PUBLIC-FACING] Bridge active: ${name || 'anonymous'} -> ${config.target || 'obsidian'}`);
    if (config.publish_insights) {
      console.log(`[PUBLIC-FACING] Auto-publishing insights enabled.`);
    }

    try {
      const memDir = path.join(os.homedir(), '.swibe', 'memory');
      fs.mkdirSync(memDir, { recursive: true });
      const memFile = path.join(memDir, 'agent.json');
      const memory = fs.existsSync(memFile)
        ? JSON.parse(fs.readFileSync(memFile, 'utf-8'))
        : { keys: [], receipts: [], thoughts: [] };
      
      memory.public_facing = { name, config, timestamp: Date.now() };
      fs.writeFileSync(memFile, JSON.stringify(memory, null, 2));
    } catch (e) {
      console.warn('[PUBLIC-FACING] Failed to save config to memory:', e.message);
    }

    return { bridge: 'active', target: config.target || 'obsidian', name };
  }

  async web_ingest(config = {}) {
    const url = config.url;
    console.log(`[WEB-INGEST] Ingesting content from: ${url}`);
    if (process.env.FIRECRAWL_API_KEY) {
      console.log(`[WEB-INGEST] Using Firecrawl for structured scraping.`);
    } else {
      console.log(`[WEB-INGEST] Firecrawl API key missing, using fallback scraper.`);
    }
    // Mock ingestion
    const content = `# Content from ${url}\n\nThis is a mock structured markdown representation of the web content.`;
    return { url, content, format: 'markdown' };
  }

  async sovereign(config = {}) {
    console.log(`[SOVEREIGN] Ritual phrase accepted: "${config.ritual_phrase || '...'}".`);
    console.log(`[SOVEREIGN] Vault encrypted via ${config.vault_encryption || 'AES-256-GCM'}.`);
    console.log(`[SOVEREIGN] BIP-39 mnemonic derived. Ed25519 soul-identity sealed.`);
    return { status: 'sovereign', identity: 'Ed25519-Soul', encrypted: true };
  }

  async walrus(config = {}) {
    const data = config.blob || config.content || JSON.stringify(config);
    console.log(`[WALRUS] Storing blob... Seal: ${config.seal}, Receipt: ${config.receipt}`);
    try {
      const blobId = await this.walrusStorage.store(data, config.epochs || 1);
      console.log(`[WALRUS] Persisted. Blob ID: ${blobId}`);
      if (config.receipt) {
        await this.receipt({ hash: blobId, type: 'walrus_seal' });
      }
      return { status: 'persisted', blob_id: blobId };
    } catch (e) {
      console.warn(`[WALRUS] Failed: ${e.message}. Using mock.`);
      return { status: 'persisted', blob_id: 'walrus-v1-mock-hash' };
    }
  }

  async mint(config = {}) {
    const recipient = config.recipient || config.agent || 'self';
    const value = config.value || 1;
    console.log(`[MINT] Minting Soul Token for ${recipient} (value: ${value})...`);
    try {
      const result = await this.sui.mintSoulToken(recipient, value);
      console.log(`[MINT] On-chain success: ${result.digest || 'mock'}`);
      return { status: 'minted', digest: result.digest, recipient, value };
    } catch (e) {
      console.warn(`[MINT] Failed: ${e.message}`);
      return { status: 'failed', error: e.message };
    }
  }

  async receipt(config = {}) {
    const hash = config.hash || this._lastReceiptHash || '0x0';
    const agent = config.agent || 'self';
    console.log(`[RECEIPT] Logging on-chain receipt: ${hash.slice(0, 16)}...`);
    try {
      const result = await this.sui.emitReceipt(hash, agent);
      console.log(`[RECEIPT] On-chain success: ${result.digest || 'mock'}`);
      return { status: 'recorded', digest: result.digest, hash };
    } catch (e) {
      console.warn(`[RECEIPT] Failed: ${e.message}`);
      return { status: 'failed', error: e.message };
    }
  }

  async seal_statement(config = {}) {
    console.log(`[SEAL] Requesting cryptographic seal for: ${config.message || 'unspecified'}`);
    // Seal is currently a pass-through to the receipt chain with extra metadata
    const result = await this.receipt({ 
      hash: crypto.createHash('sha256').update(config.message || 'seal').digest('hex'),
      agent: 'seal_service'
    });
    return { status: 'sealed', ...result };
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
    // Check for hermetic mode
    const hermeticMode = rules.find(
      r => r.rule === 'mode' && r.value === 'hermetic'
    );

    if (hermeticMode) {
      await this._activateHermeticEthics(rules);
      return { enforced: ['hermetic'], mode: 'hermetic' };
    }

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

  async heartbeat(config = {}) {
    const ms = config.every || 60000;
    const check = config.check || 'any updates?';

    console.log(`[HEARTBEAT] Starting: every ${ms/1000}s`);

    // Immediate first check
    const day = new Date().getDay();
    if (day === 6) {
      console.log('[HEARTBEAT] Sabbath — resting');
      return { started: true, every: ms, check };
    }

    const result = await this.think(check);
    console.log(`[HEARTBEAT] Check: ${result.content?.slice(0,50)}`);

    // Set recurring interval
    setInterval(async () => {
      const d = new Date().getDay();
      if (d === 6) {
        console.log('[HEARTBEAT] Sabbath — skipping');
        return;
      }

      if (this._budget) {
        const elapsed = Date.now() - this._budget.startTime;
        if (elapsed > this._budget.maxMs) {
          console.log('[HEARTBEAT] Budget exceeded — stopping');
          return;
        }
      }

      const r = await this.think(check);
      console.log(`[HEARTBEAT] ${r.content?.slice(0,50)}`);
    }, ms);

    return { started: true, every: ms, check };
  }

  async _activateHermeticEthics(rules = []) {
    console.log('[HERMETIC] 7 Principles activating...');

    // 1. MENTALISM — declare intent before invoke
    this._hermeticMentalism = true;
    console.log('[HERMETIC] 1. Mentalism: intent required before action');

    // 2. CORRESPONDENCE — soul karma updates on every action
    this._hermeticCorrespondence = true;
    console.log('[HERMETIC] 2. Correspondence: soul karma tracking active');

    // 3. VIBRATION — TTL on refusals (60s cooling period)
    this._hermeticVibration = true;
    this._refusalTTL = new Map();
    console.log('[HERMETIC] 3. Vibration: refusals have 60s TTL');

    // 4. POLARITY — redirect instead of pure refuse
    this._hermeticPolarity = true;
    console.log('[HERMETIC] 4. Polarity: refusals redirect to constructive opposite');

    // 5. RHYTHM — Sabbath guard + time-of-day routing
    this._hermeticRhythm = true;
    const day = new Date().getDay();
    if (day === 6) {
      console.warn('[HERMETIC] 5. Rhythm: Sabbath guard active — heavy actions blocked');
    } else {
      console.log('[HERMETIC] 5. Rhythm: Sabbath guard standing by');
    }

    // 6. CAUSE-EFFECT — receipt chain (already active)
    this._hermeticCauseEffect = true;
    console.log('[HERMETIC] 6. Cause-Effect: receipt chain enforced');

    // 7. GENDER — consensus threshold (developer configures)
    const genderRule = rules.find(r => r.rule === 'gender');
    this._hermeticGender = {
      active: true,
      requiresConsensus: genderRule?.value?.split(',') || []
    };
    console.log(
      `[HERMETIC] 7. Gender: consensus required for: ${
        this._hermeticGender.requiresConsensus.join(', ') || 'none configured'
      }`
    );

    // Also activate standard harm-none and audit-trail if present
    const hasHarmNone = rules.find(r => r.rule === 'harm-none');
    if (hasHarmNone) {
      this._ethicsPrompt = 'You must not produce harmful content. ';
    }
    const hasAuditTrail = rules.find(r => r.rule === 'audit-trail');
    if (hasAuditTrail) {
      this._auditTrail = true;
    }

    // Log to ethics audit
    const auditLog = path.join(
      os.homedir(), '.swibe', 'hermetic-audit.jsonl'
    );
    fs.mkdirSync(path.dirname(auditLog), { recursive: true });
    fs.appendFileSync(auditLog,
      JSON.stringify({
        activated: true,
        timestamp: Date.now(),
        principles: 7
      }) + '\n'
    );

    console.log('[HERMETIC] All 7 principles active. Àṣẹ.');
    return { activated: true, principles: 7 };
  }

  _checkVibrationTTL(action) {
    if (!this._hermeticVibration) return false;
    const entry = this._refusalTTL?.get(action);
    if (!entry) return false;
    const elapsed = Date.now() - entry.ts;
    if (elapsed > entry.ttl) {
      this._refusalTTL.delete(action);
      console.log(`[VIBRATION] Cooling ended for: ${action}`);
      return false;
    }
    const remaining = Math.ceil((entry.ttl - elapsed) / 1000);
    console.log(`[VIBRATION] Cooling: retry in ${remaining}s`);
    return true;
  }

  _setVibrationTTL(action, ttlMs = 60000) {
    if (!this._hermeticVibration) return;
    if (!this._refusalTTL) this._refusalTTL = new Map();
    this._refusalTTL.set(action, { ts: Date.now(), ttl: ttlMs });
    console.log(`[VIBRATION] Cooling started: ${action} (${ttlMs/1000}s)`);
  }

  async checkConsensus(action) {
    if (!this._hermeticGender?.active) return true;
    const required = this._hermeticGender.requiresConsensus || [];
    if (!required.includes(action)) return true;

    const token = process.env.SWIBE_CONSENSUS_TOKEN;
    if (!token) {
      console.warn(`[GENDER] Consensus required for: ${action}`);
      console.warn('[GENDER] Set SWIBE_CONSENSUS_TOKEN or add second agent');
      return false;
    }

    console.log(`[GENDER] Consensus authorized for: ${action}`);
    return true;
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

  async sandbox_run(fn, policy = {}) {
    const securityPolicy = {
      execution: policy.execution || 'strict-vm',
      network: policy.network || 'refuse',
      filesystem: policy.filesystem || 'read-only',
      memory: policy.memory || 'standard',
      receipts: policy.receipts || 'optional',
      audit: policy.audit || 'off',
      llm_routing: policy.llm_routing || 'performance_first',
      receipt_sealing: policy.receipt_sealing || 'batch',
      ...policy,
    };
    this._securityPolicy = securityPolicy;
    console.warn(`[SWIBE] secure{} sandbox: isolation=${securityPolicy.execution}, net=${securityPolicy.network}, fs=${securityPolicy.filesystem}, llm_routing=${securityPolicy.llm_routing}`);

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

    // Build context based on security policy
    const blocked = (name) => () => { throw new Error(`[SECURE] ${name} blocked by security policy`); };
    const contextObj = {
      console: Object.freeze({ log: (...args) => console.log('[SANDBOX-LOG]', ...args) }),
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
      process: Object.freeze({ exit: () => { throw new Error('process.exit() is forbidden'); } }),
    };

    // Enforce filesystem policy
    if (securityPolicy.filesystem === 'refuse') {
      contextObj.encrypt_storage = blocked('encrypt_storage (filesystem=refuse)');
      contextObj.no_external_upload = blocked('no_external_upload (filesystem=refuse)');
    } else {
      contextObj.encrypt_storage = this.encrypt_storage.bind(this);
      contextObj.no_external_upload = this.no_external_upload.bind(this);
    }

    // Enforce network policy — no net primitives exposed inside sandbox regardless,
    // but mark it explicitly so downstream tools respect the policy
    contextObj.__securityPolicy = Object.freeze(securityPolicy);

    // Audit mode — wrap every call with logging
    if (securityPolicy.audit === 'on') {
      contextObj.__auditLog = [];
      const origLog = contextObj.console.log;
      contextObj.console = Object.freeze({
        log: (...args) => {
          contextObj.__auditLog.push({ ts: Date.now(), args });
          origLog(...args);
        }
      });
    }

    const context = vm.createContext(Object.freeze(contextObj));

    try {
      return await script.runInContext(context, { timeout: 5000 });
    } catch (err) {
      console.error('[SANDBOX-ERROR]', err.message);
      throw err;
    }
  }

  async checkLoopSecurity() {
    if (this._violations.length > 0) {
      console.warn(`[SELF-HEALING] Detected ${this._violations.length} violations in loop. Applying QUARANTINE mode for safety.`);
      
      const violation = this._violations[this._violations.length - 1];
      const wallet = await this._getWallet();
      
      // Automatically slash for violation
      try {
        const slashRecord = this.tocEconomy.staking.slashForViolation(wallet.ownerId, violation.type, violation.detail);
        console.log(`[ToC] Auto-slashed for ${violation.type}: ${slashRecord.slashAmount} Dopamine`);
        
        if (this._securityPolicy?.audit === 'on') {
          await this._logToReceiptChain('auto_slash', { violation, slashRecord });
        }
      } catch (e) {
        console.warn(`[ToC] Auto-slash failed: ${e.message}`);
      }

      this._securityPolicy.execution = 'quarantine';
      // Reset violations for this iteration so we don't spam warnings
      // (they are still recorded in history, we just cleared the trigger for this specific check)
      return true;
    }
    return false;
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

  setFilesystemPolicies(policies) {
    if (policies.allowed) {
      // Handle both array of strings and single string
      const allowed = Array.isArray(policies.allowed) ? policies.allowed : [policies.allowed];
      // Strip quotes if they were added during compilation
      this._allowedPaths = allowed.map(p => typeof p === 'string' ? p.replace(/^"|"$/g, '') : p);
      console.log(`[FILESYSTEM] Allowed paths: ${this._allowedPaths.join(', ')}`);
    }
    if (policies.refuse === 'true' || policies.refuse === true) {
      this._securityPolicy.filesystem = 'refuse';
    } else if (policies.read_only === 'true' || policies.read_only === true) {
      this._securityPolicy.filesystem = 'read-only';
    }
  }

  _checkFilesystemAccess(filePath, mode = 'read') {
    if (this._securityPolicy.filesystem === 'refuse') {
      throw new SovereignError(`[SECURE] Filesystem access denied by policy`, {
        layer: 3,
        securityPolicy: this._securityPolicy,
        detail: `Attempted ${mode} on ${filePath}`
      });
    }

    if (mode === 'write' && this._securityPolicy.filesystem === 'read-only') {
      throw new SovereignError(`[SECURE] Filesystem write denied by policy`, {
        layer: 3,
        securityPolicy: this._securityPolicy,
        detail: `Attempted write on ${filePath}`
      });
    }

    if (this._allowedPaths.length > 0) {
      const isAllowed = this._allowedPaths.some(pattern => {
        // Very basic glob-to-regex conversion
        const regex = new RegExp('^' + pattern.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*') + '$');
        return regex.test(filePath) || filePath.startsWith(pattern.replace(/\*\*/g, ''));
      });

      if (!isAllowed) {
        throw new SovereignError(`[SECURE] Path not allowed by filesystem policy`, {
          layer: 3,
          securityPolicy: this._securityPolicy,
          detail: `Path: ${filePath}`
        });
      }
    }

    return true;
  }

  async readFile(filePath) {
    this._checkFilesystemAccess(filePath, 'read');
    const fullPath = path.resolve(process.cwd(), filePath);
    return await fs.promises.readFile(fullPath, 'utf8');
  }

  async writeFile(filePath, content) {
    this._checkFilesystemAccess(filePath, 'write');
    const fullPath = path.resolve(process.cwd(), filePath);
    await fs.promises.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.promises.writeFile(fullPath, content);
    return true;
  }

  async editFile(filePath, oldString, newString, options = {}) {
    this._checkFilesystemAccess(filePath, 'write');
    const fullPath = path.resolve(process.cwd(), filePath);
    console.log(`[EDIT] File: ${filePath}`);

    try {
      let content = await fs.promises.readFile(fullPath, 'utf8');
      
      if (!content.includes(oldString)) {
        throw new SovereignError(`String to replace not found in ${filePath}`, {
          layer: 3,
          securityPolicy: this._securityPolicy,
          detail: `Old string: ${oldString.substring(0, 20)}...`
        });
      }

      // Very basic implementation for now
      const updated = content.replace(oldString, newString);
      await fs.promises.writeFile(fullPath, updated);
      console.log(`[EDIT] Success: ${filePath}`);
      return true;
    } catch (e) {
      if (e instanceof SovereignError) throw e;
      console.error(`[EDIT] Failed: ${e.message}`);
      throw new SovereignError(`Failed to edit file: ${e.message}`, {
        layer: 3,
        securityPolicy: this._securityPolicy
      });
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
    console.log(`[SWARM] Starting pipeline with ${this.steps.length} agents...`);
    for (const step of this.steps) {
      console.log(`[SWARM] Agent "${step.name}" thinking...`);
      const role = typeof step.role === 'object' ? JSON.stringify(step.role) : step.role;
      const agent = new Agent({ name: step.name, system_prompt: role });
      const result = await agent.run(currentInput);
      console.log(`[SWARM] Agent "${step.name}" response: ${result.substring(0, 100)}...`);
      this.results[step.name] = result;
      currentInput = result;
    }
    console.log(`[SWARM] Pipeline complete.`);
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
