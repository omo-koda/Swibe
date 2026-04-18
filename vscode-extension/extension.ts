/**
 * Swibe Language VSCode Extension
 * Phase 3: Full IDE Bridge — two-way communication, session management, REPL
 */

import * as vscode from 'vscode';
import * as path from 'path';
import * as net from 'net';
import { LanguageClient, LanguageClientOptions, ServerOptions, TransportKind } from 'vscode-languageclient/node';

let client: LanguageClient;
let bridgeSocket: net.Socket | null = null;
let activeSessionId: string | null = null;
let outputChannel: vscode.OutputChannel;
let statusBarItem: vscode.StatusBarItem;

export function activate(context: vscode.ExtensionContext) {
  // ── LSP Client ──
  const serverModule = context.asAbsolutePath(path.join('out', 'server.js'));
  const debugOptions = { execArgv: ['--nolazy', '--inspect=6009'] };
  const serverOptions: ServerOptions = {
    run: { module: serverModule, transport: TransportKind.ipc },
    debug: { module: serverModule, transport: TransportKind.ipc, options: debugOptions }
  };

  const clientOptions: LanguageClientOptions = {
    documentSelector: [{ scheme: 'file', language: 'swibe' }],
    synchronize: { fileEvents: vscode.workspace.createFileSystemWatcher('**/*.swibe') }
  };

  client = new LanguageClient('swibe', 'Swibe Language Server', serverOptions, clientOptions);
  client.start();

  // ── Output + Status Bar ──
  outputChannel = vscode.window.createOutputChannel('Swibe Bridge');
  statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 50);
  statusBarItem.text = '$(plug) Swibe';
  statusBarItem.tooltip = 'Swibe IDE Bridge';
  statusBarItem.command = 'swibe.bridgeConnect';
  statusBarItem.show();

  // ── Hover Provider ──
  context.subscriptions.push(
    vscode.languages.registerHoverProvider('swibe', new SwibeHoverProvider())
  );

  // ── Completion Provider ──
  context.subscriptions.push(
    vscode.languages.registerCompletionItemProvider('swibe', new SwibeCompletionProvider(), '.', '[')
  );

  // ── Definition Provider ──
  context.subscriptions.push(
    vscode.languages.registerDefinitionProvider('swibe', new SwibeDefinitionProvider())
  );

  // ── Symbol Provider ──
  context.subscriptions.push(
    vscode.languages.registerDocumentSymbolProvider('swibe', new SwibeSymbolProvider())
  );

  // ── Commands ──

  // Compile
  context.subscriptions.push(
    vscode.commands.registerCommand('swibe.compile', async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) return;
      const swibeModule = await import('./swibe-compiler');
      const output = await swibeModule.compile(editor.document.getText());
      const channel = vscode.window.createOutputChannel('Swibe Compiler');
      channel.appendLine(output);
      channel.show();
    })
  );

  // Format
  context.subscriptions.push(
    vscode.commands.registerCommand('swibe.format', async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) return;
      const swibeModule = await import('./swibe-compiler');
      const formatted = await swibeModule.format(editor.document.getText());
      editor.edit(editBuilder => {
        const fullRange = new vscode.Range(
          editor.document.positionAt(0),
          editor.document.positionAt(editor.document.getText().length)
        );
        editBuilder.replace(fullRange, formatted);
      });
    })
  );

  // REPL
  context.subscriptions.push(
    vscode.commands.registerCommand('swibe.openRepl', () => {
      const terminal = vscode.window.createTerminal({ name: 'Swibe REPL', shellPath: 'swibe', shellArgs: ['repl'] });
      terminal.show();
    })
  );

  // Run
  context.subscriptions.push(
    vscode.commands.registerCommand('swibe.run', () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) return;
      const terminal = vscode.window.createTerminal('Swibe Run');
      terminal.show();
      terminal.sendText(`swibe run "${editor.document.fileName}"`);
    })
  );

  // Bridge Connect
  context.subscriptions.push(
    vscode.commands.registerCommand('swibe.bridgeConnect', async () => {
      if (bridgeSocket && !bridgeSocket.destroyed) {
        vscode.window.showInformationMessage('Swibe bridge already connected');
        return;
      }
      const portStr = await vscode.window.showInputBox({ prompt: 'Bridge port', value: '6271' });
      const port = parseInt(portStr || '6271', 10);

      bridgeSocket = net.createConnection({ port }, () => {
        statusBarItem.text = '$(plug) Swibe: Connected';
        outputChannel.appendLine(`[BRIDGE] Connected to port ${port}`);
        vscode.window.showInformationMessage(`Swibe bridge connected on port ${port}`);
      });

      bridgeSocket.setEncoding('utf-8');
      let buffer = '';
      bridgeSocket.on('data', (chunk: string) => {
        buffer += chunk;
        let idx: number;
        while ((idx = buffer.indexOf('\n')) !== -1) {
          const line = buffer.slice(0, idx).trim();
          buffer = buffer.slice(idx + 1);
          if (line) {
            try { handleBridgeMessage(JSON.parse(line)); } catch { /* skip */ }
          }
        }
      });
      bridgeSocket.on('error', (err: Error) => {
        statusBarItem.text = '$(plug) Swibe';
        outputChannel.appendLine(`[BRIDGE] Error: ${err.message}`);
      });
      bridgeSocket.on('close', () => {
        statusBarItem.text = '$(plug) Swibe';
        bridgeSocket = null;
      });
    })
  );

  // Bridge Disconnect
  context.subscriptions.push(
    vscode.commands.registerCommand('swibe.bridgeDisconnect', () => {
      if (bridgeSocket) { bridgeSocket.end(); bridgeSocket = null; }
      statusBarItem.text = '$(plug) Swibe';
    })
  );

  // Session Create
  context.subscriptions.push(
    vscode.commands.registerCommand('swibe.sessionCreate', async () => {
      const name = await vscode.window.showInputBox({ prompt: 'Session name' });
      if (name) sendBridgeRequest('swibe/session.create', { name });
    })
  );

  // Session Resume
  context.subscriptions.push(
    vscode.commands.registerCommand('swibe.sessionResume', async () => {
      const name = await vscode.window.showInputBox({ prompt: 'Session name or ID to resume' });
      if (name) sendBridgeRequest('swibe/session.resume', { name });
    })
  );

  // Eval Selection
  context.subscriptions.push(
    vscode.commands.registerCommand('swibe.evalSelection', async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) return;
      const sel = editor.selection;
      const source = sel.isEmpty
        ? editor.document.lineAt(sel.active.line).text
        : editor.document.getText(sel);
      if (!source.trim()) return;

      const result = await sendBridgeRequest('swibe/repl.eval', { source });
      if (result?.output) {
        outputChannel.appendLine(`> ${source}`);
        result.output.forEach((l: string) => outputChannel.appendLine(l));
        outputChannel.show(true);
      }
    })
  );

  context.subscriptions.push(outputChannel, statusBarItem);
}

export function deactivate(): Thenable<void> | undefined {
  if (bridgeSocket) { bridgeSocket.end(); bridgeSocket = null; }
  return client?.stop();
}

// ── Bridge helpers ──

let reqId = 0;
const pending = new Map<number, { resolve: (v: any) => void; reject: (e: any) => void }>();

function sendBridgeRequest(method: string, params: any): Promise<any> {
  return new Promise((resolve, reject) => {
    if (!bridgeSocket || bridgeSocket.destroyed) {
      vscode.window.showWarningMessage('Swibe bridge not connected');
      reject(new Error('Not connected'));
      return;
    }
    const id = ++reqId;
    pending.set(id, { resolve, reject });
    bridgeSocket.write(JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n');
    setTimeout(() => { if (pending.has(id)) { pending.delete(id); reject(new Error('Timeout')); } }, 30000);
  });
}

function handleBridgeMessage(msg: any) {
  if (msg.id !== undefined && !msg.method) {
    const p = pending.get(msg.id);
    if (p) {
      pending.delete(msg.id);
      msg.error ? p.reject(msg.error) : p.resolve(msg.result);
      if (msg.result?.id && msg.result?.state === 'active') {
        activeSessionId = msg.result.id;
        statusBarItem.text = `$(plug) Swibe: ${msg.result.name || 'Session'}`;
      }
    }
    return;
  }
  // Notifications from runtime
  if (msg.method === 'swibe/permission.request') {
    handlePermissionRequest(msg.params);
  } else if (msg.method === 'swibe/agent.output' || msg.method === 'swibe/log') {
    outputChannel.appendLine(`[${msg.method}] ${JSON.stringify(msg.params)}`);
  }
}

async function handlePermissionRequest(params: any) {
  const choice = await vscode.window.showWarningMessage(
    `Swibe Permission: ${params.message || params.action}`,
    { modal: true },
    'Allow', 'Allow for Session', 'Deny'
  );
  const granted = choice === 'Allow' || choice === 'Allow for Session';
  if (bridgeSocket && !bridgeSocket.destroyed) {
    bridgeSocket.write(JSON.stringify({
      jsonrpc: '2.0',
      method: 'swibe/permission.response',
      params: { requestId: params.requestId, action: params.action, granted, remember: choice === 'Allow for Session' },
    }) + '\n');
  }
}

// ── Providers (same as before, enhanced with Phase 2+3 keywords) ──

class SwibeHoverProvider implements vscode.HoverProvider {
  private docs: { [key: string]: string } = {
    fn: 'Function declaration', struct: 'Struct definition', enum: 'Enumeration type',
    match: 'Pattern matching', if: 'Conditional branch', else: 'Alternative branch',
    return: 'Return from function', mut: 'Mutable binding', async: 'Asynchronous function',
    await: 'Wait for async result', think: 'LLM reasoning primitive — think "prompt" { config }',
    ethics: 'Ethics declaration — harm_none, sovereign_data', permission: 'Permission matrix — auto/ask/plan/refuse',
    mcp: 'MCP tool server connection', team: 'Multi-agent team coordination',
    edit: 'Partial file modification', bridge: 'IDE bridge — two-way communication',
    session: 'Persistent agent session — create/resume/pause', budget: 'Resource budget enforcement',
    skill: 'Reusable capability definition', swarm: 'Multi-agent swarm', birth: 'Agent birth ceremony',
    mint: 'Blockchain mint', receipt: 'Execution receipt', seal: 'Cryptographic seal',
    secure: 'Sandboxed execution block', remember: 'Memory store',
  };

  async provideHover(doc: vscode.TextDocument, pos: vscode.Position): Promise<vscode.Hover | null> {
    const range = doc.getWordRangeAtPosition(pos, /[\w-]+/);
    if (!range) return null;
    const word = doc.getText(range);
    if (this.docs[word]) {
      return new vscode.Hover(new vscode.MarkdownString(`**${word}** — ${this.docs[word]}`));
    }
    return null;
  }
}

class SwibeCompletionProvider implements vscode.CompletionItemProvider {
  provideCompletionItems(): vscode.CompletionItem[] {
    const keywords = [
      'fn', 'struct', 'enum', 'match', 'if', 'else', 'return', 'mut', 'async', 'await',
      'let', 'const', 'think', 'swarm', 'ethics', 'permission', 'mcp', 'team', 'edit',
      'bridge', 'session', 'budget', 'skill', 'secure', 'birth', 'mint', 'receipt', 'seal',
      'remember', 'neural', 'app', 'chain', 'plan', 'observe', 'evolve', 'heartbeat',
    ];
    return keywords.map(k => {
      const item = new vscode.CompletionItem(k, vscode.CompletionItemKind.Keyword);
      item.insertText = k;
      return item;
    });
  }
}

class SwibeDefinitionProvider implements vscode.DefinitionProvider {
  provideDefinition(): vscode.Location | null {
    return null;
  }
}

class SwibeSymbolProvider implements vscode.DocumentSymbolProvider {
  provideDocumentSymbols(doc: vscode.TextDocument): vscode.DocumentSymbol[] {
    const symbols: vscode.DocumentSymbol[] = [];
    const lines = doc.getText().split('\n');
    const patterns: [RegExp, string, vscode.SymbolKind][] = [
      [/^\s*(?:async\s+)?fn\s+(\w+)/, 'function', vscode.SymbolKind.Function],
      [/^\s*struct\s+(\w+)/, 'struct', vscode.SymbolKind.Struct],
      [/^\s*enum\s+(\w+)/, 'enum', vscode.SymbolKind.Enum],
      [/^\s*(?:trait|protocol)\s+(\w+)/, 'trait', vscode.SymbolKind.Interface],
      [/^\s*skill\s+(\w+)/, 'skill', vscode.SymbolKind.Module],
      [/^\s*team\s+"([^"]+)"/, 'team', vscode.SymbolKind.Namespace],
      [/^\s*bridge\s+"([^"]+)"/, 'bridge', vscode.SymbolKind.Event],
      [/^\s*session\s+"([^"]+)"/, 'session', vscode.SymbolKind.Object],
      [/^\s*ethics\b/, 'ethics', vscode.SymbolKind.Property],
      [/^\s*permission\b/, 'permission', vscode.SymbolKind.Key],
    ];
    lines.forEach((line, i) => {
      for (const [re, kind, sym] of patterns) {
        const m = line.match(re);
        if (m) {
          symbols.push(new vscode.DocumentSymbol(
            m[1] || kind, kind, sym,
            new vscode.Range(i, 0, i, line.length),
            new vscode.Range(i, 0, i, line.length)
          ));
          break;
        }
      }
    });
    return symbols;
  }
}
