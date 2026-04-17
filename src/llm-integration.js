import crypto from 'node:crypto';

/**
 * LLM Integration for Swibe
 * Supports Claude, Ollama, HuggingFace, Grok, and AI Tools
 */

class LLMIntegration {
  constructor() {
    this.provider = process.env.LLM_PROVIDER || 'claude';
    this.apiKey = process.env.ANTHROPIC_API_KEY || null;
    this.hfToken = process.env.HF_TOKEN || null;
    this.xaiKey = process.env.XAI_API_KEY || null;
    this.ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
    this.groqKey = process.env.GROQ_API_KEY || null;
    this.tools = this.initializeTools();
    this.prompt = { optimize: true };
    this.providers = ['ollama', 'claude', 'openrouter', 'hf', 'grok'];
  }

  initializeTools() {
    return {
      openai: { name: 'OpenAI API', models: ['gpt-4', 'gpt-3.5'], features: ['chat', 'embeddings', 'vision'] },
      anthropic: { name: 'Anthropic Claude', models: ['claude-3-opus', 'claude-3-sonnet'], features: ['vision', 'code'] },
      groq: { name: 'Groq', models: ['mixtral', 'llama2'], features: ['fast-inference'] },
      grok: { name: 'Grok AI', models: ['grok-1'], features: ['reasoning', 'multimodal'] },
      pinecone: { name: 'Pinecone', type: 'vector-db', operations: ['upsert', 'query', 'delete'] },
      weaviate: { name: 'Weaviate', type: 'vector-db', operations: ['semantic-search', 'filtering'] },
      qdrant: { name: 'Qdrant', type: 'vector-db', operations: ['vector-search', 'similarity'] },
    };
  }

  async think(prompt) {
    let content;
    try {
      try {
        content = await this.ollamaGenerate(prompt);
      } catch (e) {
        if (this.provider === 'claude') {
          content = await this.claudeGenerate(prompt);
        } else {
          throw e;
        }
      }
    } catch (e) {
      try {
        const orResult = await this.callOpenRouter(prompt);
        if (orResult) { content = orResult; }
        else throw new Error('OpenRouter returned null');
      } catch (e2) {
        console.warn(`[THINK] LLM failed, using mock: ${e.message}`);
        content = this.mockGenerate(prompt);
      }
    }

    const receipt = crypto.createHash('sha256').update(content).digest('hex');
    return { content, receipt };
  }

  async generateCode(prompt, context = {}) {
    const enhancedPrompt = this.buildPrompt(prompt, context);

    try {
      try {
        return await this.ollamaGenerate(enhancedPrompt);
      } catch (e) {
        if (this.provider === 'claude') {
          return await this.claudeGenerate(enhancedPrompt);
        } else {
          throw e;
        }
      }
    } catch (e) {
      const orResult = await this.callOpenRouter(enhancedPrompt);
      if (orResult) return orResult;
      return this.mockGenerate(enhancedPrompt);
    }
  }

  async callOpenRouter(prompt, config = {}) {
    const key = process.env.OPENROUTER_API_KEY;
    if (!key) return null;
    const model = config.model
      || process.env.OPENROUTER_DEFAULT_MODEL
      || 'meta-llama/llama-3.3-70b-instruct:free';
    try {
      const res = await fetch(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${key}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://github.com/Bino-Elgua/Swibe'
          },
          body: JSON.stringify({
            model,
            messages: [{ role: 'user', content: prompt }],
            max_tokens: config.max_tokens || 512
          })
        }
      );
      const data = await res.json();
      return data.choices?.[0]?.message?.content || null;
    } catch { return null; }
  }

  async ollamaGenerate(prompt) {
    const response = await fetch(`${this.ollamaUrl}/api/generate`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        model: process.env.OLLAMA_MODEL || 'glm-4.7:cloud',
        prompt: prompt,
        stream: false,
      }),
    });

    if (!response.ok) throw new Error(`Ollama error: ${response.status}`);
    const data = await response.json();
    return data.response;
  }

  async embed(text) {
    try {
      const response = await fetch(`${this.ollamaUrl}/api/embeddings`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          model: 'mxbai-embed-large',
          prompt: text,
        }),
      });

      if (!response.ok) throw new Error(`Ollama embeddings error: ${response.status}`);
      const data = await response.json();
      return data.embedding;
    } catch (e) {
      console.warn(`[EMBED] Ollama failed, using mock embedding: ${e.message}`);
      return new Array(1024).fill(0).map(() => Math.random());
    }
  }

  async claudeGenerate(prompt) {
    if (!this.apiKey) throw new Error('ANTHROPIC_API_KEY not set');
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 2048,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) throw new Error(`Claude API error: ${response.status}`);
    const data = await response.json();
    return data.content[0].text;
  }

  mockGenerate(prompt) {
    if (prompt.includes('fibonacci')) return `fn fibonacci(n: u32) -> [u32] { ... }`;
    return `fn generated() { println("Àṣẹ") }`;
  }

  buildPrompt(prompt, context = {}) {
    let fullPrompt = prompt;
    if (context.targetLanguage) fullPrompt += `\n\nCompile this to ${context.targetLanguage}.`;
    return fullPrompt;
  }
}

// RAG (Retrieval Augmented Generation)
class RAGIntegration {
  constructor() {
    this.llm = new LLMIntegration();
  }

  async embed(text) {
    return this.llm.embed(text);
  }

  cosineSimilarity(a, b) {
    if (!a || !b) return 0;
    const dotProduct = a.reduce((sum, av, i) => sum + (av * (b[i] || 0)), 0);
    const mag = (vec) => Math.sqrt(vec.reduce((sum, v) => sum + v * v, 0));
    const denom = mag(a) * mag(b);
    return denom === 0 ? 0 : dotProduct / denom;
  }

  async search(query, topK = 5) {
    try {
      const { default: path } = await import('node:path');
      const { default: os } = await import('node:os');
      const { default: fs } = await import('node:fs');
      const vaultPath = path.join(os.homedir(), '.swibe', 'vault.json');
      if (!fs.existsSync(vaultPath)) return [];
      const vault = JSON.parse(fs.readFileSync(vaultPath, 'utf-8'));
      return Object.entries(vault)
        .filter(([k]) => k.toLowerCase().includes(query.toLowerCase()))
        .slice(0, topK)
        .map(([key, v]) => ({ key, data: v.data, score: 1 }));
    } catch { return []; }
  }

  async save(key, data) {
    try {
      const { default: path } = await import('node:path');
      const { default: os } = await import('node:os');
      const { default: fs } = await import('node:fs');
      const vaultPath = path.join(os.homedir(), '.swibe', 'vault.json');
      const vault = fs.existsSync(vaultPath)
        ? JSON.parse(fs.readFileSync(vaultPath, 'utf-8'))
        : {};
      vault[key] = { data, timestamp: Date.now() };
      fs.mkdirSync(path.dirname(vaultPath), { recursive: true });
      fs.writeFileSync(vaultPath, JSON.stringify(vault, null, 2));
      return { key, saved: true };
    } catch { return { key, saved: false }; }
  }

  async load(key) {
    try {
      const { default: path } = await import('node:path');
      const { default: os } = await import('node:os');
      const { default: fs } = await import('node:fs');
      const vaultPath = path.join(os.homedir(), '.swibe', 'vault.json');
      if (!fs.existsSync(vaultPath)) return null;
      const vault = JSON.parse(fs.readFileSync(vaultPath, 'utf-8'));
      return vault[key] ? vault[key].data : null;
    } catch { return null; }
  }
}

// Agent system
class Agent {
  constructor(config) {
    this.name = config.name || 'Agent';
    this.tools = config.tools || [];
    this.systemPrompt = config.system_prompt || '';
    this.llm = new LLMIntegration();
    this.memory = [];
  }

  async run(goal) {
    this.memory.push({ role: 'user', content: goal });
    try {
      const result = await this.llm.think(goal, { system: this.systemPrompt });
      const response = result.content || result;
      this.memory.push({ role: 'assistant', content: response });
      return response;
    } catch(err) {
      return `Agent ${this.name} error: ${err.message}`;
    }
  }
}

export { LLMIntegration, RAGIntegration, Agent };
