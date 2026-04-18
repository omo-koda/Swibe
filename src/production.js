/**
 * Swibe Production Hardening — Phase 5
 *
 * 1. CostTracker — USD + token budgets with alert thresholds
 * 2. Analytics — model selection A/B testing, usage metrics, feature flags
 * 3. PolicyEngine — org-level controls (max tokens per user, forbidden ops)
 */

import { EventEmitter } from 'node:events';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

// ── Model pricing table (USD per 1M tokens) ─────────────────

const MODEL_PRICING = {
  // Input / Output per 1M tokens
  'claude-opus-4':       { input: 15.00,  output: 75.00 },
  'claude-sonnet-4':     { input: 3.00,   output: 15.00 },
  'claude-haiku-4':      { input: 0.80,   output: 4.00 },
  'gpt-4o':              { input: 2.50,   output: 10.00 },
  'gpt-4o-mini':         { input: 0.15,   output: 0.60 },
  'ollama:llama3':       { input: 0,      output: 0 },
  'ollama:mistral':      { input: 0,      output: 0 },
  'ollama:codestral':    { input: 0,      output: 0 },
  'meta-llama/llama-3.3-70b-instruct:free': { input: 0, output: 0 },
  'default':             { input: 1.00,   output: 5.00 },
};

// ── Cost Tracker ─────────────────────────────────────────────

export class CostTracker extends EventEmitter {
  /**
   * @param {object} config
   * @param {number} config.maxTokens — token budget
   * @param {number} config.maxUsd — USD budget
   * @param {number} config.maxTime — time budget in ms
   * @param {number[]} config.alerts — alert thresholds (e.g., [0.8, 1.0])
   * @param {string} config.logFile — path to persist cost log
   */
  constructor(config = {}) {
    super();
    this.maxTokens = config.maxTokens || Infinity;
    this.maxUsd = config.maxUsd ?? Infinity;
    this.maxTime = config.maxTime || Infinity;
    this.alerts = config.alerts || [0.8, 1.0];
    this.logFile = config.logFile || null;

    this.startTime = Date.now();
    this.usedTokens = { input: 0, output: 0 };
    this.usedUsd = 0;
    this.entries = [];
    this._alertsFired = new Set();
  }

  /**
   * Record a model call's cost
   */
  record(model, inputTokens, outputTokens, metadata = {}) {
    const pricing = MODEL_PRICING[model] || MODEL_PRICING['default'];
    const cost = (inputTokens / 1_000_000) * pricing.input
               + (outputTokens / 1_000_000) * pricing.output;

    this.usedTokens.input += inputTokens;
    this.usedTokens.output += outputTokens;
    this.usedUsd += cost;

    const entry = {
      model,
      inputTokens,
      outputTokens,
      cost,
      totalCost: this.usedUsd,
      timestamp: Date.now(),
      ...metadata,
    };
    this.entries.push(entry);
    this.emit('cost', entry);

    // Check alerts
    this._checkAlerts();

    // Persist if logFile set
    if (this.logFile) {
      this._persist(entry);
    }

    return entry;
  }

  /**
   * Check if budget allows another call
   * @returns {{ allowed: boolean, reason?: string }}
   */
  check(estimatedTokens = 0) {
    const totalTokens = this.usedTokens.input + this.usedTokens.output;
    if (totalTokens + estimatedTokens > this.maxTokens) {
      return { allowed: false, reason: `Token budget exceeded: ${totalTokens}/${this.maxTokens}` };
    }
    if (this.usedUsd >= this.maxUsd) {
      return { allowed: false, reason: `USD budget exceeded: $${this.usedUsd.toFixed(4)}/$${this.maxUsd.toFixed(2)}` };
    }
    const elapsed = Date.now() - this.startTime;
    if (elapsed > this.maxTime) {
      return { allowed: false, reason: `Time budget exceeded: ${elapsed}ms/${this.maxTime}ms` };
    }
    return { allowed: true };
  }

  /**
   * Get usage summary
   */
  summary() {
    const totalTokens = this.usedTokens.input + this.usedTokens.output;
    const elapsed = Date.now() - this.startTime;
    return {
      tokens: { input: this.usedTokens.input, output: this.usedTokens.output, total: totalTokens },
      usd: this.usedUsd,
      elapsed,
      budgetTokens: this.maxTokens === Infinity ? 'unlimited' : this.maxTokens,
      budgetUsd: this.maxUsd === Infinity ? 'unlimited' : this.maxUsd,
      budgetTime: this.maxTime === Infinity ? 'unlimited' : this.maxTime,
      utilizationTokens: this.maxTokens === Infinity ? 0 : totalTokens / this.maxTokens,
      utilizationUsd: this.maxUsd === Infinity ? 0 : this.usedUsd / this.maxUsd,
      calls: this.entries.length,
    };
  }

  /**
   * Get cost breakdown by model
   */
  breakdown() {
    const byModel = {};
    for (const entry of this.entries) {
      if (!byModel[entry.model]) {
        byModel[entry.model] = { calls: 0, inputTokens: 0, outputTokens: 0, cost: 0 };
      }
      byModel[entry.model].calls++;
      byModel[entry.model].inputTokens += entry.inputTokens;
      byModel[entry.model].outputTokens += entry.outputTokens;
      byModel[entry.model].cost += entry.cost;
    }
    return byModel;
  }

  _checkAlerts() {
    for (const threshold of this.alerts) {
      const key = `tokens_${threshold}`;
      if (!this._alertsFired.has(key)) {
        const totalTokens = this.usedTokens.input + this.usedTokens.output;
        if (this.maxTokens !== Infinity && totalTokens / this.maxTokens >= threshold) {
          this._alertsFired.add(key);
          this.emit('alert', { type: 'tokens', threshold, used: totalTokens, max: this.maxTokens });
        }
      }

      const usdKey = `usd_${threshold}`;
      if (!this._alertsFired.has(usdKey)) {
        if (this.maxUsd !== Infinity && this.usedUsd / this.maxUsd >= threshold) {
          this._alertsFired.add(usdKey);
          this.emit('alert', { type: 'usd', threshold, used: this.usedUsd, max: this.maxUsd });
        }
      }
    }
  }

  _persist(entry) {
    try {
      const dir = path.dirname(this.logFile);
      fs.mkdirSync(dir, { recursive: true });
      fs.appendFileSync(this.logFile, JSON.stringify(entry) + '\n');
    } catch { /* best effort */ }
  }
}

// ── Analytics Engine ─────────────────────────────────────────

export class Analytics extends EventEmitter {
  constructor(config = {}) {
    super();
    this.experiments = new Map();
    this.metrics = new Map();
    this.logDir = config.logDir || path.join(os.homedir(), '.swibe', 'analytics');
    fs.mkdirSync(this.logDir, { recursive: true });
  }

  /**
   * Create an A/B experiment for model selection
   * @param {string} name — experiment name
   * @param {string[]} variants — model names to test
   * @param {number[]} weights — traffic split (must sum to 1.0)
   */
  createExperiment(name, variants, weights = null) {
    if (!weights) {
      weights = variants.map(() => 1 / variants.length);
    }
    const experiment = {
      name,
      variants,
      weights,
      results: variants.map(() => ({ calls: 0, totalLatency: 0, totalTokens: 0, successes: 0, failures: 0 })),
      created: Date.now(),
      active: true,
    };
    this.experiments.set(name, experiment);
    this.emit('experiment_created', { name, variants });
    return experiment;
  }

  /**
   * Select a variant for an experiment (weighted random)
   */
  selectVariant(experimentName) {
    const exp = this.experiments.get(experimentName);
    if (!exp || !exp.active) return null;

    const rand = Math.random();
    let cumulative = 0;
    for (let i = 0; i < exp.variants.length; i++) {
      cumulative += exp.weights[i];
      if (rand <= cumulative) {
        return { variant: exp.variants[i], index: i };
      }
    }
    return { variant: exp.variants[exp.variants.length - 1], index: exp.variants.length - 1 };
  }

  /**
   * Record the outcome of an experiment call
   */
  recordOutcome(experimentName, variantIndex, outcome) {
    const exp = this.experiments.get(experimentName);
    if (!exp) return;

    const bucket = exp.results[variantIndex];
    bucket.calls++;
    bucket.totalLatency += outcome.latency || 0;
    bucket.totalTokens += outcome.tokens || 0;
    if (outcome.success) bucket.successes++;
    else bucket.failures++;

    this.emit('outcome', { experiment: experimentName, variant: exp.variants[variantIndex], outcome });
  }

  /**
   * Get experiment results with statistical summary
   */
  getResults(experimentName) {
    const exp = this.experiments.get(experimentName);
    if (!exp) return null;

    return exp.variants.map((variant, i) => {
      const r = exp.results[i];
      return {
        variant,
        calls: r.calls,
        avgLatency: r.calls > 0 ? r.totalLatency / r.calls : 0,
        avgTokens: r.calls > 0 ? r.totalTokens / r.calls : 0,
        successRate: r.calls > 0 ? r.successes / r.calls : 0,
        weight: exp.weights[i],
      };
    });
  }

  /**
   * End an experiment and declare a winner
   */
  concludeExperiment(experimentName) {
    const exp = this.experiments.get(experimentName);
    if (!exp) return null;

    exp.active = false;
    const results = this.getResults(experimentName);
    const winner = results.reduce((best, r) =>
      r.successRate > best.successRate ? r : best
    );

    this.emit('experiment_concluded', { name: experimentName, winner: winner.variant, results });
    return { winner: winner.variant, results };
  }

  /**
   * Track a custom metric
   */
  track(name, value, tags = {}) {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    const point = { value, tags, timestamp: Date.now() };
    this.metrics.get(name).push(point);
    this.emit('metric', { name, ...point });

    // Keep bounded
    const series = this.metrics.get(name);
    if (series.length > 10000) {
      this.metrics.set(name, series.slice(-5000));
    }
  }

  /**
   * Get metric summary
   */
  getMetric(name, window = 3600000) {
    const series = this.metrics.get(name);
    if (!series || series.length === 0) return null;

    const cutoff = Date.now() - window;
    const recent = series.filter(p => p.timestamp >= cutoff);
    if (recent.length === 0) return null;

    const values = recent.map(p => p.value);
    return {
      name,
      count: values.length,
      min: Math.min(...values),
      max: Math.max(...values),
      avg: values.reduce((a, b) => a + b, 0) / values.length,
      sum: values.reduce((a, b) => a + b, 0),
      latest: values[values.length - 1],
      window,
    };
  }

  /**
   * Dump all metrics to disk
   */
  flush() {
    const data = {
      experiments: Object.fromEntries(this.experiments),
      metrics: Object.fromEntries(this.metrics),
      flushed: Date.now(),
    };
    const file = path.join(this.logDir, `analytics-${Date.now()}.json`);
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
    return file;
  }
}

// ── Policy Engine ────────────────────────────────────────────

export class PolicyEngine {
  /**
   * @param {object} config
   * @param {object} config.limits — per-user/team limits
   * @param {string[]} config.forbidden — forbidden operations
   * @param {object} config.rateLimit — rate limiting config
   */
  constructor(config = {}) {
    this.limits = config.limits || {};
    this.forbidden = new Set(config.forbidden || []);
    this.rateLimit = config.rateLimit || null;
    this.overrides = new Map();
    this._rateCounts = new Map();
  }

  /**
   * Set org-level limits
   */
  setLimits(limits) {
    Object.assign(this.limits, limits);
  }

  /**
   * Set per-user/team override
   */
  setOverride(userId, overrides) {
    this.overrides.set(userId, overrides);
  }

  /**
   * Add a forbidden operation
   */
  forbid(operation) {
    this.forbidden.add(operation);
  }

  /**
   * Remove a forbidden operation
   */
  allow(operation) {
    this.forbidden.delete(operation);
  }

  /**
   * Check if an operation is allowed
   * @returns {{ allowed: boolean, reason?: string }}
   */
  check(operation, userId = 'default', context = {}) {
    // Forbidden operations
    if (this.forbidden.has(operation)) {
      return { allowed: false, reason: `Operation "${operation}" is forbidden by policy` };
    }

    // Per-user overrides
    const userOverride = this.overrides.get(userId);
    if (userOverride?.forbidden?.includes(operation)) {
      return { allowed: false, reason: `Operation "${operation}" forbidden for user "${userId}"` };
    }

    // Token limits
    const maxTokens = userOverride?.maxTokens || this.limits.maxTokensPerUser;
    if (maxTokens && (context.usedTokens || 0) >= maxTokens) {
      return { allowed: false, reason: `Token limit reached for user "${userId}": ${context.usedTokens}/${maxTokens}` };
    }

    // USD limits
    const maxUsd = userOverride?.maxUsd || this.limits.maxUsdPerUser;
    if (maxUsd && (context.usedUsd || 0) >= maxUsd) {
      return { allowed: false, reason: `USD limit reached for user "${userId}": $${context.usedUsd}/$${maxUsd}` };
    }

    // Rate limiting
    if (this.rateLimit) {
      const rateCheck = this._checkRate(userId, operation);
      if (!rateCheck.allowed) return rateCheck;
    }

    return { allowed: true };
  }

  /**
   * Enforce a policy check — throws on denial
   */
  enforce(operation, userId = 'default', context = {}) {
    const result = this.check(operation, userId, context);
    if (!result.allowed) {
      throw new Error(`[POLICY] ${result.reason}`);
    }
    return true;
  }

  /**
   * Get policy summary
   */
  summary() {
    return {
      limits: this.limits,
      forbidden: Array.from(this.forbidden),
      overrides: Object.fromEntries(this.overrides),
      rateLimit: this.rateLimit,
    };
  }

  _checkRate(userId, operation) {
    const key = `${userId}:${operation}`;
    const now = Date.now();
    const window = this.rateLimit.window || 60000; // default 1 minute
    const maxCalls = this.rateLimit.maxCalls || 60;

    if (!this._rateCounts.has(key)) {
      this._rateCounts.set(key, []);
    }

    const timestamps = this._rateCounts.get(key);
    // Remove old entries
    while (timestamps.length > 0 && timestamps[0] < now - window) {
      timestamps.shift();
    }

    if (timestamps.length >= maxCalls) {
      return {
        allowed: false,
        reason: `Rate limit exceeded for "${operation}": ${timestamps.length}/${maxCalls} calls in ${window}ms`,
      };
    }

    timestamps.push(now);
    return { allowed: true };
  }
}

// ── Convenience: build from AST budget node ──────────────────

export function costTrackerFromAST(node) {
  const config = {};

  if (node.maxTokens) {
    config.maxTokens = typeof node.maxTokens === 'object' ? node.maxTokens.value : node.maxTokens;
  }

  // Handle "100k" shorthand
  if (typeof config.maxTokens === 'string') {
    const m = config.maxTokens.match(/^(\d+)k$/i);
    if (m) config.maxTokens = parseInt(m[1], 10) * 1000;
    else config.maxTokens = parseInt(config.maxTokens, 10);
  }

  if (node.config?.cost_usd) {
    config.maxUsd = typeof node.config.cost_usd === 'object'
      ? node.config.cost_usd.value : node.config.cost_usd;
  }

  if (node.config?.alerts) {
    const alertNode = node.config.alerts;
    if (Array.isArray(alertNode)) {
      config.alerts = alertNode.map(a => {
        const val = typeof a === 'object' ? a.value : a;
        return typeof val === 'string' && val.endsWith('%')
          ? parseFloat(val) / 100
          : parseFloat(val);
      });
    }
  }

  if (node.maxMs || node.config?.time) {
    const time = node.maxMs || node.config.time;
    const val = typeof time === 'object' ? time.value : time;
    if (typeof val === 'string' && val.endsWith('s')) {
      config.maxTime = parseFloat(val) * 1000;
    } else {
      config.maxTime = parseInt(val, 10);
    }
  }

  return new CostTracker(config);
}

/**
 * Build a PolicyEngine from a policy {} AST node
 */
export function policyFromAST(node) {
  const config = {};
  if (node.limits) config.limits = node.limits;
  if (node.forbidden) {
    config.forbidden = Array.isArray(node.forbidden)
      ? node.forbidden.map(f => typeof f === 'object' ? f.value : f)
      : [node.forbidden];
  }
  if (node.rate_limit) config.rateLimit = node.rate_limit;
  return new PolicyEngine(config);
}
