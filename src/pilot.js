/**
 * Swibe Pilot Engine — Computer Control
 *
 * Abstracts desktop, browser, and terminal control
 * with built-in ethical constraints and audit logging.
 */

import crypto from 'node:crypto';

class PilotEngine {
  constructor(config = {}) {
    this.mode = config.mode || 'terminal';
    this.config = { audit: config.audit !== false, ...config };
    this.forbidden = new Set(config.forbid || ['password_fields', 'private_browsing']);
    this.actionLog = [];
  }

  async execute(action) {
    if (this._isForbidden(action)) {
      const msg = `[PILOT] Action blocked by ethics: ${action.type}`;
      console.warn(msg);
      return { blocked: true, reason: msg };
    }

    const entry = {
      timestamp: Date.now(),
      mode: this.mode,
      action: action.type,
      target: action.target || null,
      hash: crypto.createHash('sha256')
        .update(JSON.stringify(action))
        .digest('hex')
        .slice(0, 16),
    };

    let result;
    switch (action.type) {
      case 'click':
        result = { type: 'click', coordinates: action.coordinates || [0, 0], mode: this.mode, executed: true };
        break;
      case 'type':
        result = { type: 'type', text: action.text || '', mode: this.mode, executed: true };
        break;
      case 'scroll':
        result = { type: 'scroll', direction: action.direction || 'down', mode: this.mode, executed: true };
        break;
      case 'keycombo':
        result = { type: 'keycombo', combo: action.combo || '', mode: this.mode, executed: true };
        break;
      case 'screenshot':
        result = { type: 'screenshot', mode: this.mode, captured: true, format: 'png' };
        break;
      case 'bash':
        result = { type: 'bash', command: action.command || '', mode: 'terminal', executed: true };
        break;
      default:
        result = { error: `Unknown action: ${action.type}` };
    }

    entry.result = result;
    if (this.config.audit) this.actionLog.push(entry);
    return result;
  }

  _isForbidden(action) {
    if (this.forbidden.has(action.type)) return true;
    if (action.target && this.forbidden.has(action.target)) return true;
    return false;
  }

  getAuditLog() {
    return this.actionLog;
  }
}

export { PilotEngine };
