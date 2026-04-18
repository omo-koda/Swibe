/**
 * Swibe Pilot Module — Phase 6: Computer/Browser Control
 * Desktop, browser, and mobile control abstraction with perceive/act cycle
 */

import { EventEmitter } from 'events';

const PILOT_MODE = {
  DESKTOP: 'desktop',
  BROWSER: 'browser',
  MOBILE: 'mobile',
};

class Action {
  constructor(type, target, params = {}) {
    this.type = type;
    this.target = target;
    this.params = params;
    this.timestamp = Date.now();
    this.result = null;
    this.status = 'pending';
  }
}

export class Pilot extends EventEmitter {
  constructor(config = {}) {
    super();
    this.mode = config.mode || PILOT_MODE.BROWSER;
    this.safeMode = config.safe_mode !== false;
    this.maxActions = config.max_actions || 100;
    this.timeout = config.timeout || 30000;
    this.history = [];
    this._actionCount = 0;
    this._forbidden = new Set(config.forbidden || ['format_disk', 'delete_system', 'sudo_rm']);
  }

  async click(target, options = {}) {
    return this._execute(new Action('click', target, options));
  }

  async type(target, text, options = {}) {
    return this._execute(new Action('type', target, { text, ...options }));
  }

  async scroll(direction = 'down', amount = 1) {
    return this._execute(new Action('scroll', null, { direction, amount }));
  }

  async navigate(url) {
    if (this.mode !== PILOT_MODE.BROWSER) {
      throw new Error(`navigate() requires browser mode, current: ${this.mode}`);
    }
    return this._execute(new Action('navigate', url));
  }

  async screenshot() {
    return this._execute(new Action('screenshot', null));
  }

  async keypress(key, modifiers = []) {
    return this._execute(new Action('keypress', key, { modifiers }));
  }

  async select(target, value) {
    return this._execute(new Action('select', target, { value }));
  }

  async drag(from, to) {
    return this._execute(new Action('drag', from, { to }));
  }

  async waitFor(condition, timeout = null) {
    return this._execute(new Action('wait', condition, { timeout: timeout || this.timeout }));
  }

  async perceive() {
    const screenshot = await this.screenshot();
    this.emit('perceive', { screenshot, mode: this.mode });
    return {
      mode: this.mode,
      screenshot,
      timestamp: Date.now(),
    };
  }

  async act(instruction) {
    this.emit('act:start', { instruction, mode: this.mode });

    const plan = this._planFromInstruction(instruction);
    const results = [];

    for (const step of plan) {
      const result = await this._execute(step);
      results.push(result);
      if (result.status === 'failed') break;
    }

    this.emit('act:complete', { instruction, results });
    return { instruction, steps: results, success: results.every(r => r.status === 'completed') };
  }

  async cycle(goal, maxIterations = 10) {
    this.emit('cycle:start', { goal, maxIterations });
    const iterations = [];

    for (let i = 0; i < maxIterations; i++) {
      const perception = await this.perceive();
      const action = await this.act(goal);
      iterations.push({ perception, action, iteration: i + 1 });

      if (action.success) {
        this.emit('cycle:complete', { goal, iterations: i + 1, success: true });
        return { goal, iterations, success: true };
      }
    }

    this.emit('cycle:complete', { goal, iterations: maxIterations, success: false });
    return { goal, iterations, success: false };
  }

  _planFromInstruction(instruction) {
    return [new Action('instruction', instruction, { interpreted: true })];
  }

  async _execute(action) {
    if (this._actionCount >= this.maxActions) {
      action.status = 'failed';
      action.result = { error: 'Max action limit reached' };
      return action;
    }

    if (this.safeMode && this._forbidden.has(action.type)) {
      action.status = 'blocked';
      action.result = { error: `Action '${action.type}' is forbidden in safe mode` };
      this.emit('action:blocked', action);
      return action;
    }

    this.emit('action:start', action);
    this._actionCount++;

    try {
      action.status = 'completed';
      action.result = {
        mode: this.mode,
        action: action.type,
        target: action.target,
        timestamp: Date.now(),
      };
      this.history.push(action);
      this.emit('action:complete', action);
    } catch (err) {
      action.status = 'failed';
      action.result = { error: err.message };
      this.emit('action:error', { action, error: err });
    }

    return action;
  }

  getHistory() {
    return this.history.map(a => ({
      type: a.type,
      target: a.target,
      status: a.status,
      timestamp: a.timestamp,
    }));
  }

  reset() {
    this.history = [];
    this._actionCount = 0;
  }
}

export function pilotFromAST(node) {
  const config = node.config || {};
  const opts = {};
  for (const [key, val] of Object.entries(config)) {
    const v = typeof val === 'object' && val.value !== undefined ? val.value : val;
    switch (key) {
      case 'mode': opts.mode = String(v); break;
      case 'safe_mode': opts.safe_mode = v === true || v === 'true'; break;
      case 'max_actions': opts.max_actions = Number(v); break;
      case 'timeout': opts.timeout = Number(v); break;
      default: opts[key] = v;
    }
  }
  return new Pilot(opts);
}
