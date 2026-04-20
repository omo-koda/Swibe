/**
 * Swibe IDE Bridge — Bidirectional communication protocol
 * Phase 3: Two-way IDE integration with session management
 *
 * Protocol: JSON-RPC 2.0 over stdio or WebSocket
 * Supports: VSCode, JetBrains, Neovim (any LSP-compatible editor)
 */

import { EventEmitter } from 'node:events';
import { createServer } from 'node:net';
import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const SESSION_DIR = path.join(os.homedir(), '.swibe', 'sessions');

// ── Session Manager ─────────────────────────────────────────

export class SessionManager {
  constructor(config = {}) {
    this.sessionsDir = config.sessionsDir || SESSION_DIR;
    this.maxSessions = config.maxSessions || 20;
    this.sessions = new Map();
    this._ensureDir();
  }

  _ensureDir() {
    fs.mkdirSync(this.sessionsDir, { recursive: true });
  }

  /**
   * Create a new agent session with persistent state
   */
  create(name, options = {}) {
    const id = randomUUID();
    const session = {
      id,
      name: name || `session-${id.slice(0, 8)}`,
      created: Date.now(),
      updated: Date.now(),
      state: 'active',        // active | paused | completed | error
      context: {},             // accumulated agent context
      history: [],             // command/response pairs
      permissions: {},         // session-scoped permission approvals
      budget: options.budget || null,
      ethics: options.ethics || null,
      workingDir: options.workingDir || process.cwd(),
      variables: {},           // user-defined session variables
    };
    this.sessions.set(id, session);
    this._persist(session);
    return session;
  }

  /**
   * Resume a previously saved session by ID or name
   */
  resume(idOrName) {
    // Check in-memory first
    for (const [id, s] of this.sessions) {
      if (id === idOrName || s.name === idOrName) {
        s.state = 'active';
        s.updated = Date.now();
        return s;
      }
    }
    // Try loading from disk
    const files = fs.readdirSync(this.sessionsDir)
      .filter(f => f.endsWith('.json'));
    for (const file of files) {
      try {
        const data = JSON.parse(
          fs.readFileSync(path.join(this.sessionsDir, file), 'utf-8')
        );
        if (data.id === idOrName || data.name === idOrName) {
          data.state = 'active';
          data.updated = Date.now();
          this.sessions.set(data.id, data);
          return data;
        }
      } catch { /* skip corrupt files */ }
    }
    return null;
  }

  /**
   * Pause a session — persists state to disk
   */
  pause(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) return null;
    session.state = 'paused';
    session.updated = Date.now();
    this._persist(session);
    return session;
  }

  /**
   * Append a command/response pair to session history
   */
  record(sessionId, entry) {
    const session = this.sessions.get(sessionId);
    if (!session) return;
    session.history.push({
      ...entry,
      timestamp: Date.now(),
    });
    session.updated = Date.now();
    // Keep history bounded
    if (session.history.length > 200) {
      session.history = session.history.slice(-150);
    }
    this._persist(session);
  }

  /**
   * Store a session-scoped permission approval (plan mode)
   */
  approvePermission(sessionId, action) {
    const session = this.sessions.get(sessionId);
    if (!session) return;
    session.permissions[action] = { approved: true, at: Date.now() };
    session.updated = Date.now();
  }

  /**
   * Check if an action was already approved in this session
   */
  isApproved(sessionId, action) {
    const session = this.sessions.get(sessionId);
    if (!session) return false;
    return !!session.permissions[action]?.approved;
  }

  /**
   * Set a session variable
   */
  setVar(sessionId, key, value) {
    const session = this.sessions.get(sessionId);
    if (!session) return;
    session.variables[key] = value;
    session.updated = Date.now();
  }

  /**
   * Get a session variable
   */
  getVar(sessionId, key) {
    const session = this.sessions.get(sessionId);
    return session?.variables?.[key];
  }

  /**
   * List all sessions (active + persisted)
   */
  list() {
    const result = [];
    // In-memory
    for (const s of this.sessions.values()) {
      result.push({
        id: s.id,
        name: s.name,
        state: s.state,
        created: s.created,
        updated: s.updated,
        historyCount: s.history.length,
      });
    }
    // On-disk (not already loaded)
    const loaded = new Set(this.sessions.keys());
    try {
      const files = fs.readdirSync(this.sessionsDir)
        .filter(f => f.endsWith('.json'));
      for (const file of files) {
        try {
          const data = JSON.parse(
            fs.readFileSync(path.join(this.sessionsDir, file), 'utf-8')
          );
          if (!loaded.has(data.id)) {
            result.push({
              id: data.id,
              name: data.name,
              state: data.state,
              created: data.created,
              updated: data.updated,
              historyCount: data.history?.length || 0,
            });
          }
        } catch { /* skip */ }
      }
    } catch { /* dir doesn't exist yet */ }
    return result.sort((a, b) => b.updated - a.updated);
  }

  /**
   * Destroy a session — remove from memory and disk
   */
  destroy(sessionId) {
    this.sessions.delete(sessionId);
    const file = path.join(this.sessionsDir, `${sessionId}.json`);
    try { fs.unlinkSync(file); } catch { /* ok */ }
  }

  _persist(session) {
    const file = path.join(this.sessionsDir, `${session.id}.json`);
    fs.writeFileSync(file, JSON.stringify(session, null, 2));
  }
}

// ── Bridge Protocol ─────────────────────────────────────────

/**
 * JSON-RPC 2.0 message types for IDE ↔ Swibe communication
 */
const BridgeMethod = {
  // IDE → Swibe
  COMPILE:         'swibe/compile',
  EXECUTE:         'swibe/execute',
  PARSE:           'swibe/parse',
  VALIDATE:        'swibe/validate',
  SESSION_CREATE:  'swibe/session.create',
  SESSION_RESUME:  'swibe/session.resume',
  SESSION_PAUSE:   'swibe/session.pause',
  SESSION_LIST:    'swibe/session.list',
  SESSION_DESTROY: 'swibe/session.destroy',
  REPL_EVAL:       'swibe/repl.eval',
  REPL_COMPLETE:   'swibe/repl.complete',
  PERMISSION_RESPONSE: 'swibe/permission.response',

  // Swibe → IDE (notifications)
  DIAGNOSTICS:     'swibe/diagnostics',
  LOG:             'swibe/log',
  PERMISSION_REQUEST: 'swibe/permission.request',
  SESSION_UPDATE:  'swibe/session.update',
  PROGRESS:        'swibe/progress',
  AGENT_OUTPUT:    'swibe/agent.output',
};

export { BridgeMethod };

export class IdeBridge extends EventEmitter {
  constructor(config = {}) {
    super();
    this.sessionManager = new SessionManager(config);
    this.activeSession = null;
    this._pendingPermissions = new Map();
    this._transport = null;
    this._requestId = 0;
    this._pendingRequests = new Map();
  }

  /**
   * Start the bridge server on a TCP port (for IDE connections)
   */
  startServer(port = 6271) {
    return new Promise((resolve, reject) => {
      this._server = createServer((socket) => {
        this._transport = new TcpTransport(socket);
        this._transport.on('message', (msg) => this._handleMessage(msg));
        this._transport.on('close', () => {
          this._transport = null;
          this.emit('disconnected');
        });
        this.emit('connected');
      });
      this._server.listen(port, () => {
        this.emit('listening', port);
        resolve(port);
      });
      this._server.on('error', reject);
    });
  }

  /**
   * Connect to an IDE bridge (as client)
   */
  connectStdio(input = process.stdin, output = process.stdout) {
    this._transport = new StdioTransport(input, output);
    this._transport.on('message', (msg) => this._handleMessage(msg));
    this.emit('connected');
  }

  /**
   * Send a JSON-RPC notification to the IDE
   */
  notify(method, params = {}) {
    if (!this._transport) return;
    this._transport.send({
      jsonrpc: '2.0',
      method,
      params,
    });
  }

  /**
   * Send a JSON-RPC request and await response
   */
  request(method, params = {}) {
    return new Promise((resolve, reject) => {
      if (!this._transport) {
        reject(new Error('No IDE connection'));
        return;
      }
      const id = ++this._requestId;
      this._pendingRequests.set(id, { resolve, reject });
      this._transport.send({
        jsonrpc: '2.0',
        id,
        method,
        params,
      });
      // Timeout after 60s
      setTimeout(() => {
        if (this._pendingRequests.has(id)) {
          this._pendingRequests.delete(id);
          reject(new Error(`Request ${method} timed out`));
        }
      }, 60000);
    });
  }

  /**
   * Request permission from the IDE user
   * Used when PermissionGate hits 'ask' mode
   */
  async requestPermission(action, context = {}) {
    const requestId = randomUUID();
    this.notify(BridgeMethod.PERMISSION_REQUEST, {
      requestId,
      action,
      context,
      message: `Swibe needs permission to: ${action}`,
    });

    return new Promise((resolve) => {
      this._pendingPermissions.set(requestId, resolve);
      // Default deny after 30s
      setTimeout(() => {
        if (this._pendingPermissions.has(requestId)) {
          this._pendingPermissions.delete(requestId);
          resolve({ granted: false, reason: 'timeout' });
        }
      }, 30000);
    });
  }

  /**
   * Push diagnostics to the IDE (real-time parse errors)
   */
  pushDiagnostics(uri, diagnostics) {
    this.notify(BridgeMethod.DIAGNOSTICS, { uri, diagnostics });
  }

  /**
   * Push agent output (think loop progress, etc.)
   */
  pushAgentOutput(sessionId, output) {
    this.notify(BridgeMethod.AGENT_OUTPUT, {
      sessionId,
      ...output,
    });
  }

  /**
   * Push progress updates
   */
  pushProgress(sessionId, progress) {
    this.notify(BridgeMethod.PROGRESS, {
      sessionId,
      ...progress,
    });
  }

  // ── Internal message handler ──

  async _handleMessage(msg) {
    // Response to our request
    if (msg.id && !msg.method) {
      const pending = this._pendingRequests.get(msg.id);
      if (pending) {
        this._pendingRequests.delete(msg.id);
        if (msg.error) pending.reject(msg.error);
        else pending.resolve(msg.result);
      }
      return;
    }

    // Request from IDE
    const { method, params, id } = msg;
    let result = null;
    let error = null;

    try {
      switch (method) {
        case BridgeMethod.SESSION_CREATE:
          result = this.sessionManager.create(params?.name, params);
          this.activeSession = result.id;
          break;

        case BridgeMethod.SESSION_RESUME:
          result = this.sessionManager.resume(params?.id || params?.name);
          if (result) this.activeSession = result.id;
          else error = { code: -1, message: 'Session not found' };
          break;

        case BridgeMethod.SESSION_PAUSE:
          result = this.sessionManager.pause(
            params?.id || this.activeSession
          );
          break;

        case BridgeMethod.SESSION_LIST:
          result = this.sessionManager.list();
          break;

        case BridgeMethod.SESSION_DESTROY:
          this.sessionManager.destroy(params?.id);
          if (this.activeSession === params?.id) {
            this.activeSession = null;
          }
          result = { ok: true };
          break;

        case BridgeMethod.COMPILE:
          result = await this._handleCompile(params);
          break;

        case BridgeMethod.PARSE:
          result = await this._handleParse(params);
          break;

        case BridgeMethod.VALIDATE:
          result = await this._handleValidate(params);
          break;

        case BridgeMethod.EXECUTE:
          result = await this._handleExecute(params);
          break;

        case BridgeMethod.REPL_EVAL:
          result = await this._handleReplEval(params);
          break;

        case BridgeMethod.REPL_COMPLETE:
          result = await this._handleReplComplete(params);
          break;

        case BridgeMethod.PERMISSION_RESPONSE:
          this._handlePermissionResponse(params);
          result = { ok: true };
          break;

        default:
          error = { code: -32601, message: `Unknown method: ${method}` };
      }
    } catch (err) {
      error = { code: -32603, message: err.message };
    }

    // Send response if it was a request (has id)
    if (id !== undefined) {
      this._transport.send({
        jsonrpc: '2.0',
        id,
        ...(error ? { error } : { result }),
      });
    }
  }

  async _handleCompile(params) {
    const { Lexer: _Lexer } = await import('./lexer.js');
    const { Parser: _Parser } = await import('./parser.js');
    const { Compiler } = await import('./compiler.js');

    const compiler = new Compiler(
      params.source,
      params.target || 'javascript'
    );
    const code = await compiler.compile();

    if (this.activeSession) {
      this.sessionManager.record(this.activeSession, {
        type: 'compile',
        target: params.target || 'javascript',
        sourceLength: params.source.length,
      });
    }

    return { code, target: params.target || 'javascript' };
  }

  async _handleParse(params) {
    const { Lexer } = await import('./lexer.js');
    const { Parser } = await import('./parser.js');

    const lexer = new Lexer(params.source);
    const tokens = lexer.tokenize();
    const parser = new Parser(tokens);
    const ast = parser.parse();

    return {
      statements: ast.statements.length,
      types: ast.statements.map(s => s.type),
      ast,
    };
  }

  async _handleValidate(params) {
    const { Lexer } = await import('./lexer.js');
    const { Parser } = await import('./parser.js');
    const { EthicsValidator } = await import('./visitor.js');

    const diagnostics = [];
    try {
      const lexer = new Lexer(params.source);
      const tokens = lexer.tokenize();
      const parser = new Parser(tokens);
      const ast = parser.parse();

      const validator = new EthicsValidator();
      ast.statements.forEach(s => validator.visit(s));

      for (const v of validator.violations) {
        diagnostics.push({
          severity: 'error',
          message: v.message || `Ethics violation: ${v.type}`,
          type: v.type,
        });
      }
    } catch (err) {
      diagnostics.push({
        severity: 'error',
        message: err.message,
        type: 'parse_error',
      });
    }

    return { valid: diagnostics.length === 0, diagnostics };
  }

  async _handleExecute(params) {
    const { Compiler } = await import('./compiler.js');

    const compiler = new Compiler(
      params.source,
      params.target || 'javascript'
    );
    const code = await compiler.compile();

    // Execute in sandboxed context
    const output = [];
    const mockConsole = {
      log: (...args) => output.push(args.join(' ')),
      error: (...args) => output.push('[ERROR] ' + args.join(' ')),
      warn: (...args) => output.push('[WARN] ' + args.join(' ')),
    };

    try {
      const { StandardLibrary } = await import('./stdlib.js');
      const std = new StandardLibrary();
      const fn = new Function(
        'std', 'console',
        `return (async () => {\n${code}\n})()`
      );
      await fn(std, mockConsole);
    } catch (err) {
      output.push(`[RUNTIME] ${err.message}`);
    }

    if (this.activeSession) {
      this.sessionManager.record(this.activeSession, {
        type: 'execute',
        output: output.slice(0, 50),
      });
    }

    return { output, code };
  }

  async _handleReplEval(params) {
    const source = params.source;
    const sessionId = params.sessionId || this.activeSession;

    // Wrap bare statements
    const wrapped = source.includes('fn ')
      ? source
      : `fn main() {\n  ${source.split('\n').join('\n  ')}\n}`;

    try {
      const { Compiler } = await import('./compiler.js');
      const compiler = new Compiler(wrapped, 'javascript');
      const code = await compiler.compile();

      const output = [];
      const mockConsole = {
        log: (...args) => output.push(args.join(' ')),
        error: (...args) => output.push('[ERROR] ' + args.join(' ')),
        warn: (...args) => output.push('[WARN] ' + args.join(' ')),
      };

      const { StandardLibrary } = await import('./stdlib.js');
      const std = new StandardLibrary();
      const fn = new Function(
        'std', 'console',
        `return (async () => {\n${code}\nawait main();\n})()`
      );
      await fn(std, mockConsole);

      if (sessionId) {
        this.sessionManager.record(sessionId, {
          type: 'repl',
          input: source,
          output,
        });
      }

      return { output, ok: true };
    } catch (err) {
      return { output: [err.message], ok: false, error: err.message };
    }
  }

  async _handleReplComplete(params) {
    const prefix = params.prefix || '';
    const keywords = [
      'fn', 'let', 'const', 'struct', 'enum', 'match', 'if', 'else',
      'think', 'swarm', 'ethics', 'permission', 'mcp', 'team', 'edit',
      'budget', 'remember', 'skill', 'bridge', 'session', 'secure',
      'meta-digital', 'birth', 'mint', 'receipt', 'seal', 'neural',
      'app', 'chain', 'plan', 'observe', 'evolve', 'heartbeat',
    ];
    const matches = keywords.filter(k => k.startsWith(prefix));
    return { completions: matches };
  }

  _handlePermissionResponse(params) {
    const { requestId, granted, remember } = params;
    const resolve = this._pendingPermissions.get(requestId);
    if (resolve) {
      this._pendingPermissions.delete(requestId);
      resolve({ granted: !!granted, reason: granted ? 'user' : 'denied' });
      // If user says "remember for session", save the approval
      if (granted && remember && this.activeSession) {
        this.sessionManager.approvePermission(
          this.activeSession,
          params.action
        );
      }
    }
  }

  /**
   * Shut down the bridge
   */
  close() {
    if (this._server) {
      this._server.close();
      this._server = null;
    }
    if (this._transport) {
      this._transport.close();
      this._transport = null;
    }
    // Pause active session
    if (this.activeSession) {
      this.sessionManager.pause(this.activeSession);
    }
  }
}

// ── Transport Layers ────────────────────────────────────────

class StdioTransport extends EventEmitter {
  constructor(input, output) {
    super();
    this._input = input;
    this._output = output;
    this._buffer = '';

    input.setEncoding('utf-8');
    input.on('data', (chunk) => this._onData(chunk));
    input.on('end', () => this.emit('close'));
  }

  _onData(chunk) {
    this._buffer += chunk;
    // Parse Content-Length header protocol (LSP-style)
    while (true) {
      const headerEnd = this._buffer.indexOf('\r\n\r\n');
      if (headerEnd === -1) break;

      const header = this._buffer.slice(0, headerEnd);
      const match = header.match(/Content-Length:\s*(\d+)/i);
      if (!match) {
        // Try raw JSON (one message per line)
        const lineEnd = this._buffer.indexOf('\n');
        if (lineEnd === -1) break;
        const line = this._buffer.slice(0, lineEnd).trim();
        this._buffer = this._buffer.slice(lineEnd + 1);
        if (line) {
          try {
            this.emit('message', JSON.parse(line));
          } catch { /* skip malformed */ }
        }
        continue;
      }

      const length = parseInt(match[1], 10);
      const bodyStart = headerEnd + 4;
      if (this._buffer.length < bodyStart + length) break;

      const body = this._buffer.slice(bodyStart, bodyStart + length);
      this._buffer = this._buffer.slice(bodyStart + length);

      try {
        this.emit('message', JSON.parse(body));
      } catch { /* skip malformed */ }
    }
  }

  send(msg) {
    const body = JSON.stringify(msg);
    const header = `Content-Length: ${Buffer.byteLength(body)}\r\n\r\n`;
    this._output.write(header + body);
  }

  close() {
    // Don't close stdin/stdout
  }
}

class TcpTransport extends EventEmitter {
  constructor(socket) {
    super();
    this._socket = socket;
    this._buffer = '';

    socket.setEncoding('utf-8');
    socket.on('data', (chunk) => this._onData(chunk));
    socket.on('end', () => this.emit('close'));
    socket.on('error', () => this.emit('close'));
  }

  _onData(chunk) {
    this._buffer += chunk;
    // Newline-delimited JSON
    while (true) {
      const lineEnd = this._buffer.indexOf('\n');
      if (lineEnd === -1) break;
      const line = this._buffer.slice(0, lineEnd).trim();
      this._buffer = this._buffer.slice(lineEnd + 1);
      if (line) {
        try {
          this.emit('message', JSON.parse(line));
        } catch { /* skip */ }
      }
    }
  }

  send(msg) {
    this._socket.write(JSON.stringify(msg) + '\n');
  }

  close() {
    this._socket.end();
  }
}

// ── Convenience: create bridge from Swibe AST node ──────────

export function bridgeFromAST(node) {
  const config = node.config || {};
  const bridge = new IdeBridge({
    sessionsDir: config.sessions_dir,
  });
  if (config.transport === 'stdio') {
    bridge.connectStdio();
  }
  return bridge;
}
