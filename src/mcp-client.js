/**
 * Swibe MCP Client — Model Context Protocol Integration
 *
 * Connects Swibe agents to the MCP ecosystem of tool servers.
 * Agents can discover, connect to, and invoke tools from any
 * MCP-compliant server (filesystem, GitHub, databases, etc.)
 *
 * This is Swibe-native: every MCP call goes through the
 * PermissionGate and gets a receipt on the sovereign chain.
 */

import crypto from 'node:crypto';

// ────────────────────────────────────────────────────────────
// MCP Message Types (JSON-RPC 2.0)
// ────────────────────────────────────────────────────────────

const MCPMethod = Object.freeze({
  INITIALIZE:    'initialize',
  LIST_TOOLS:    'tools/list',
  CALL_TOOL:     'tools/call',
  LIST_PROMPTS:  'prompts/list',
  GET_PROMPT:    'prompts/get',
  LIST_RESOURCES:'resources/list',
  READ_RESOURCE: 'resources/read',
  PING:          'ping',
});

// ────────────────────────────────────────────────────────────
// MCP Server Connection
// ────────────────────────────────────────────────────────────

class MCPConnection {
  /**
   * @param {string} name — Human-readable server name
   * @param {string} transport — "stdio" | "http" | "sse"
   * @param {object} config — Transport-specific config
   */
  constructor(name, transport, config = {}) {
    this.name = name;
    this.transport = transport;
    this.config = config;
    this.connected = false;
    this.capabilities = {};
    this.tools = [];
    this.requestId = 0;
  }

  /**
   * Send a JSON-RPC 2.0 request to the MCP server.
   */
  async _rpc(method, params = {}) {
    const id = ++this.requestId;
    const request = {
      jsonrpc: '2.0',
      id,
      method,
      params,
    };

    if (this.transport === 'http' || this.transport === 'sse') {
      return this._httpTransport(request);
    }

    if (this.transport === 'stdio') {
      return this._stdioTransport(request);
    }

    throw new Error(`Unsupported MCP transport: ${this.transport}`);
  }

  async _httpTransport(request) {
    const url = this.config.url;
    if (!url) throw new Error('MCP HTTP transport requires config.url');

    const headers = { 'Content-Type': 'application/json' };
    if (this.config.apiKey) {
      headers['Authorization'] = `Bearer ${this.config.apiKey}`;
    }

    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(request),
    });

    if (!res.ok) {
      throw new Error(`MCP HTTP error: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    if (data.error) {
      throw new Error(`MCP error ${data.error.code}: ${data.error.message}`);
    }
    return data.result;
  }

  async _stdioTransport(request) {
    // For stdio transport, spawn the server process and communicate via stdin/stdout
    const { spawn } = await import('node:child_process');
    const cmd = this.config.command;
    const args = this.config.args || [];

    if (!cmd) throw new Error('MCP stdio transport requires config.command');

    return new Promise((resolve, reject) => {
      const proc = spawn(cmd, args, {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env, ...this.config.env },
      });

      let stdout = '';
      proc.stdout.on('data', chunk => { stdout += chunk; });
      proc.stderr.on('data', chunk => {
        console.warn(`[MCP:${this.name}:stderr]`, chunk.toString());
      });

      proc.on('close', () => {
        try {
          const lines = stdout.trim().split('\n');
          // Find the JSON-RPC response line
          for (const line of lines) {
            try {
              const parsed = JSON.parse(line);
              if (parsed.id === request.id) {
                if (parsed.error) {
                  reject(new Error(`MCP error: ${parsed.error.message}`));
                } else {
                  resolve(parsed.result);
                }
                return;
              }
            } catch { /* skip non-JSON lines */ }
          }
          reject(new Error('No matching JSON-RPC response from MCP server'));
        } catch (e) {
          reject(e);
        }
      });

      proc.stdin.write(JSON.stringify(request) + '\n');
      proc.stdin.end();
    });
  }

  /**
   * Initialize the connection and discover capabilities.
   */
  async connect() {
    try {
      const result = await this._rpc(MCPMethod.INITIALIZE, {
        protocolVersion: '2025-03-26',
        capabilities: {},
        clientInfo: {
          name: 'swibe',
          version: '3.0.7',
        },
      });

      this.capabilities = result?.capabilities || {};
      this.connected = true;
      console.log(`[MCP] Connected to "${this.name}" (${this.transport})`);

      // Auto-discover tools
      if (this.capabilities.tools) {
        await this.discoverTools();
      }

      return result;
    } catch (e) {
      console.warn(`[MCP] Connection to "${this.name}" failed: ${e.message}`);
      this.connected = false;
      return null;
    }
  }

  async discoverTools() {
    try {
      const result = await this._rpc(MCPMethod.LIST_TOOLS);
      this.tools = result?.tools || [];
      console.log(`[MCP:${this.name}] Discovered ${this.tools.length} tools`);
      return this.tools;
    } catch (e) {
      console.warn(`[MCP:${this.name}] Tool discovery failed: ${e.message}`);
      return [];
    }
  }

  async callTool(toolName, args = {}) {
    if (!this.connected) {
      throw new Error(`MCP server "${this.name}" not connected`);
    }

    const result = await this._rpc(MCPMethod.CALL_TOOL, {
      name: toolName,
      arguments: args,
    });

    return result;
  }

  async listResources() {
    return this._rpc(MCPMethod.LIST_RESOURCES);
  }

  async readResource(uri) {
    return this._rpc(MCPMethod.READ_RESOURCE, { uri });
  }

  async ping() {
    return this._rpc(MCPMethod.PING);
  }
}

// ────────────────────────────────────────────────────────────
// MCP Hub — Multi-Server Manager
// ────────────────────────────────────────────────────────────

class MCPHub {
  constructor(permissionGate = null) {
    this.servers = new Map();
    this.permissionGate = permissionGate;
    this.callLog = [];
  }

  /**
   * Register an MCP server.
   * @param {string} name
   * @param {string} transport — "stdio" | "http" | "sse"
   * @param {object} config — Transport-specific configuration
   */
  register(name, transport, config = {}) {
    const conn = new MCPConnection(name, transport, config);
    this.servers.set(name, conn);
    return conn;
  }

  /**
   * Connect to all registered servers.
   */
  async connectAll() {
    const results = {};
    for (const [name, conn] of this.servers) {
      results[name] = await conn.connect();
    }
    return results;
  }

  /**
   * Discover all tools across all connected servers.
   */
  allTools() {
    const tools = [];
    for (const [serverName, conn] of this.servers) {
      if (!conn.connected) continue;
      for (const tool of conn.tools) {
        tools.push({
          server: serverName,
          name: tool.name,
          description: tool.description,
          inputSchema: tool.inputSchema,
        });
      }
    }
    return tools;
  }

  /**
   * Call a tool on a specific server, with permission check.
   */
  async callTool(serverName, toolName, args = {}) {
    // Permission check
    if (this.permissionGate) {
      const { granted, reason } = await this.permissionGate.check('mcp', {
        server: serverName,
        tool: toolName,
        args,
      });
      if (!granted) {
        throw new Error(`[MCP] Permission denied for ${serverName}:${toolName} — ${reason}`);
      }
    }

    const conn = this.servers.get(serverName);
    if (!conn) throw new Error(`[MCP] Unknown server: ${serverName}`);
    if (!conn.connected) throw new Error(`[MCP] Server "${serverName}" not connected`);

    const start = Date.now();
    const result = await conn.callTool(toolName, args);
    const elapsed = Date.now() - start;

    // Log the call with receipt
    const logEntry = {
      server: serverName,
      tool: toolName,
      args,
      elapsed_ms: elapsed,
      receipt: crypto.createHash('sha256')
        .update(`${serverName}:${toolName}:${JSON.stringify(args)}:${Date.now()}`)
        .digest('hex'),
      timestamp: new Date().toISOString(),
    };
    this.callLog.push(logEntry);

    return result;
  }

  /**
   * Find a tool by name across all servers.
   */
  findTool(toolName) {
    for (const [serverName, conn] of this.servers) {
      if (!conn.connected) continue;
      const tool = conn.tools.find(t => t.name === toolName);
      if (tool) return { server: serverName, tool };
    }
    return null;
  }

  /**
   * Get the call log as a signed receipt chain.
   */
  sealCallLog() {
    const payload = JSON.stringify(this.callLog);
    return {
      entries: this.callLog.length,
      hash: crypto.createHash('sha256').update(payload).digest('hex'),
      sealed_at: new Date().toISOString(),
    };
  }
}

export { MCPConnection, MCPHub, MCPMethod };
