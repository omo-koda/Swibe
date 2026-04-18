import * as vscode from 'vscode';
import * as path from 'path';
import * as net from 'net';

let bridgeSocket: net.Socket | null = null;
let sessionPanel: vscode.WebviewPanel | null = null;
let activeSessionId: string | null = null;
let outputChannel: vscode.OutputChannel;
let statusBarItem: vscode.StatusBarItem;

export function activate(context: vscode.ExtensionContext) {
  outputChannel = vscode.window.createOutputChannel('Swibe Bridge');
  statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 50);
  statusBarItem.text = '$(plug) Swibe';
  statusBarItem.tooltip = 'Swibe IDE Bridge — Click to connect';
  statusBarItem.command = 'swibe.bridgeConnect';
  statusBarItem.show();

  // ── REPL ──
  context.subscriptions.push(
    vscode.commands.registerCommand('swibe.openRepl', () => {
      const terminal = vscode.window.createTerminal({
        name: 'Swibe REPL',
        shellPath: 'swibe',
        shellArgs: ['repl'],
      });
      terminal.show();
    })
  );

  // ── Compile ──
  context.subscriptions.push(
    vscode.commands.registerCommand('swibe.compile', async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) return;
      const file = editor.document.fileName;

      const target = await vscode.window.showQuickPick(
        ['javascript', 'rust', 'go', 'python', 'elixir', 'julia', 'zig', 'lua', 'typescript'],
        { placeHolder: 'Select compilation target' }
      );
      if (!target) return;

      const terminal = vscode.window.createTerminal('Swibe Compile');
      terminal.show();
      terminal.sendText(`swibe compile "${file}" --target ${target}`);
    })
  );

  // ── Run ──
  context.subscriptions.push(
    vscode.commands.registerCommand('swibe.run', () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) return;
      const file = editor.document.fileName;
      const terminal = vscode.window.createTerminal('Swibe Run');
      terminal.show();
      terminal.sendText(`swibe run "${file}"`);
    })
  );

  // ── OpenClaw compile ──
  context.subscriptions.push(
    vscode.commands.registerCommand('swibe.compileOpenClaw', () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) return;
      const file = editor.document.fileName;
      const terminal = vscode.window.createTerminal('Swibe OpenClaw');
      terminal.show();
      terminal.sendText(`swibe compile "${file}" --target openclaw`);
    })
  );

  // ── Bridge Connect ──
  context.subscriptions.push(
    vscode.commands.registerCommand('swibe.bridgeConnect', async () => {
      if (bridgeSocket && !bridgeSocket.destroyed) {
        vscode.window.showInformationMessage('Swibe bridge already connected');
        return;
      }

      const portStr = await vscode.window.showInputBox({
        prompt: 'Bridge port',
        value: '6271',
        placeHolder: '6271',
      });
      const port = parseInt(portStr || '6271', 10);

      bridgeSocket = net.createConnection({ port }, () => {
        statusBarItem.text = '$(plug) Swibe: Connected';
        statusBarItem.backgroundColor = undefined;
        outputChannel.appendLine(`[BRIDGE] Connected to port ${port}`);
        vscode.window.showInformationMessage(`Swibe bridge connected on port ${port}`);
      });

      bridgeSocket.setEncoding('utf-8');
      let buffer = '';

      bridgeSocket.on('data', (chunk: string) => {
        buffer += chunk;
        let lineEnd: number;
        while ((lineEnd = buffer.indexOf('\n')) !== -1) {
          const line = buffer.slice(0, lineEnd).trim();
          buffer = buffer.slice(lineEnd + 1);
          if (line) {
            try {
              handleBridgeMessage(JSON.parse(line));
            } catch { /* skip malformed */ }
          }
        }
      });

      bridgeSocket.on('error', (err: Error) => {
        statusBarItem.text = '$(plug) Swibe: Disconnected';
        outputChannel.appendLine(`[BRIDGE] Error: ${err.message}`);
        vscode.window.showErrorMessage(`Swibe bridge error: ${err.message}`);
      });

      bridgeSocket.on('close', () => {
        statusBarItem.text = '$(plug) Swibe';
        bridgeSocket = null;
        outputChannel.appendLine('[BRIDGE] Disconnected');
      });
    })
  );

  // ── Bridge Disconnect ──
  context.subscriptions.push(
    vscode.commands.registerCommand('swibe.bridgeDisconnect', () => {
      if (bridgeSocket) {
        bridgeSocket.end();
        bridgeSocket = null;
        statusBarItem.text = '$(plug) Swibe';
        vscode.window.showInformationMessage('Swibe bridge disconnected');
      }
    })
  );

  // ── Session Create ──
  context.subscriptions.push(
    vscode.commands.registerCommand('swibe.sessionCreate', async () => {
      const name = await vscode.window.showInputBox({
        prompt: 'Session name',
        placeHolder: 'dev-session',
      });
      if (!name) return;

      sendBridgeRequest('swibe/session.create', { name });
    })
  );

  // ── Session Resume ──
  context.subscriptions.push(
    vscode.commands.registerCommand('swibe.sessionResume', async () => {
      // Request session list first
      const response = await sendBridgeRequest('swibe/session.list', {});
      if (!response || !Array.isArray(response)) {
        vscode.window.showWarningMessage('No sessions available');
        return;
      }

      const items = response.map((s: any) => ({
        label: s.name,
        description: `${s.state} — ${s.historyCount} entries`,
        detail: `ID: ${s.id}`,
        id: s.id,
      }));

      const picked = await vscode.window.showQuickPick(items, {
        placeHolder: 'Select session to resume',
      });
      if (!picked) return;

      sendBridgeRequest('swibe/session.resume', { id: (picked as any).id });
    })
  );

  // ── Session Pause ──
  context.subscriptions.push(
    vscode.commands.registerCommand('swibe.sessionPause', () => {
      if (activeSessionId) {
        sendBridgeRequest('swibe/session.pause', { id: activeSessionId });
        activeSessionId = null;
        statusBarItem.text = '$(plug) Swibe: Connected';
      }
    })
  );

  // ── Session Panel (webview) ──
  context.subscriptions.push(
    vscode.commands.registerCommand('swibe.sessionPanel', () => {
      if (sessionPanel) {
        sessionPanel.reveal();
        return;
      }

      sessionPanel = vscode.window.createWebviewPanel(
        'swibeSession',
        'Swibe Sessions',
        vscode.ViewColumn.Two,
        { enableScripts: true }
      );

      sessionPanel.webview.html = getSessionPanelHTML();

      sessionPanel.webview.onDidReceiveMessage((msg: any) => {
        switch (msg.command) {
          case 'create':
            sendBridgeRequest('swibe/session.create', { name: msg.name });
            break;
          case 'resume':
            sendBridgeRequest('swibe/session.resume', { id: msg.id });
            break;
          case 'pause':
            sendBridgeRequest('swibe/session.pause', { id: msg.id });
            break;
          case 'destroy':
            sendBridgeRequest('swibe/session.destroy', { id: msg.id });
            break;
          case 'refresh':
            sendBridgeRequest('swibe/session.list', {});
            break;
        }
      });

      sessionPanel.onDidDispose(() => {
        sessionPanel = null;
      });
    })
  );

  // ── Inline REPL (evaluate selection) ──
  context.subscriptions.push(
    vscode.commands.registerCommand('swibe.evalSelection', async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) return;

      const selection = editor.selection;
      const source = selection.isEmpty
        ? editor.document.lineAt(selection.active.line).text
        : editor.document.getText(selection);

      if (!source.trim()) return;

      const result = await sendBridgeRequest('swibe/repl.eval', { source });
      if (result && result.output) {
        outputChannel.appendLine(`> ${source}`);
        result.output.forEach((line: string) => outputChannel.appendLine(line));
        outputChannel.show(true);
      }
    })
  );

  context.subscriptions.push(outputChannel, statusBarItem);
}

// ── Bridge Communication ──

let requestIdCounter = 0;
const pendingRequests = new Map<number, { resolve: (v: any) => void; reject: (e: any) => void }>();

function sendBridgeRequest(method: string, params: any): Promise<any> {
  return new Promise((resolve, reject) => {
    if (!bridgeSocket || bridgeSocket.destroyed) {
      vscode.window.showWarningMessage('Swibe bridge not connected. Run "Swibe: Connect Bridge" first.');
      reject(new Error('Not connected'));
      return;
    }

    const id = ++requestIdCounter;
    pendingRequests.set(id, { resolve, reject });

    const msg = JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n';
    bridgeSocket.write(msg);

    // Timeout
    setTimeout(() => {
      if (pendingRequests.has(id)) {
        pendingRequests.delete(id);
        reject(new Error('Request timed out'));
      }
    }, 30000);
  });
}

function handleBridgeMessage(msg: any) {
  // Response to our request
  if (msg.id !== undefined && !msg.method) {
    const pending = pendingRequests.get(msg.id);
    if (pending) {
      pendingRequests.delete(msg.id);
      if (msg.error) {
        pending.reject(msg.error);
        vscode.window.showErrorMessage(`Swibe: ${msg.error.message}`);
      } else {
        pending.resolve(msg.result);

        // Update UI based on result type
        if (msg.result?.id && msg.result?.state === 'active') {
          activeSessionId = msg.result.id;
          statusBarItem.text = `$(plug) Swibe: ${msg.result.name || 'Session'}`;
        }
      }
    }
    return;
  }

  // Notification from Swibe runtime
  switch (msg.method) {
    case 'swibe/permission.request':
      handlePermissionRequest(msg.params);
      break;

    case 'swibe/diagnostics':
      outputChannel.appendLine(`[DIAG] ${JSON.stringify(msg.params.diagnostics)}`);
      break;

    case 'swibe/agent.output':
      outputChannel.appendLine(`[AGENT] ${JSON.stringify(msg.params)}`);
      break;

    case 'swibe/progress':
      outputChannel.appendLine(`[PROGRESS] ${msg.params.message || JSON.stringify(msg.params)}`);
      break;

    case 'swibe/log':
      outputChannel.appendLine(`[LOG] ${msg.params.message || JSON.stringify(msg.params)}`);
      break;

    case 'swibe/session.update':
      if (sessionPanel) {
        sessionPanel.webview.postMessage({
          type: 'sessionUpdate',
          data: msg.params,
        });
      }
      break;
  }
}

// ── Permission Request Handler ──

async function handlePermissionRequest(params: any) {
  const { requestId, action, message } = params;

  const choice = await vscode.window.showWarningMessage(
    `Swibe Permission: ${message || action}`,
    { modal: true },
    'Allow',
    'Allow for Session',
    'Deny'
  );

  const granted = choice === 'Allow' || choice === 'Allow for Session';
  const remember = choice === 'Allow for Session';

  // Send response back through bridge
  if (bridgeSocket && !bridgeSocket.destroyed) {
    const response = JSON.stringify({
      jsonrpc: '2.0',
      method: 'swibe/permission.response',
      params: { requestId, action, granted, remember },
    }) + '\n';
    bridgeSocket.write(response);
  }
}

// ── Session Panel HTML ──

function getSessionPanelHTML(): string {
  return `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: var(--vscode-font-family); padding: 16px; color: var(--vscode-foreground); }
    h2 { border-bottom: 1px solid var(--vscode-panel-border); padding-bottom: 8px; }
    .session { padding: 8px; margin: 4px 0; border: 1px solid var(--vscode-panel-border); border-radius: 4px; }
    .session .name { font-weight: bold; }
    .session .state { color: var(--vscode-descriptionForeground); font-size: 0.9em; }
    .session.active .state { color: var(--vscode-testing-iconPassed); }
    .session.paused .state { color: var(--vscode-testing-iconQueued); }
    button { padding: 4px 8px; margin: 2px; cursor: pointer; background: var(--vscode-button-background);
             color: var(--vscode-button-foreground); border: none; border-radius: 3px; }
    button:hover { background: var(--vscode-button-hoverBackground); }
    button.danger { background: var(--vscode-errorForeground); }
    input { padding: 4px 8px; background: var(--vscode-input-background); color: var(--vscode-input-foreground);
            border: 1px solid var(--vscode-input-border); border-radius: 3px; }
    .toolbar { margin-bottom: 12px; }
    #sessions { margin-top: 12px; }
  </style>
</head>
<body>
  <h2>Swibe Sessions</h2>
  <div class="toolbar">
    <input id="sessionName" placeholder="Session name" />
    <button onclick="createSession()">Create</button>
    <button onclick="refresh()">Refresh</button>
  </div>
  <div id="sessions"><em>Click Refresh to load sessions</em></div>

  <script>
    const vscode = acquireVsCodeApi();

    function createSession() {
      const name = document.getElementById('sessionName').value || 'unnamed';
      vscode.postMessage({ command: 'create', name });
    }

    function refresh() {
      vscode.postMessage({ command: 'refresh' });
    }

    function resumeSession(id) {
      vscode.postMessage({ command: 'resume', id });
    }

    function pauseSession(id) {
      vscode.postMessage({ command: 'pause', id });
    }

    function destroySession(id) {
      vscode.postMessage({ command: 'destroy', id });
    }

    window.addEventListener('message', event => {
      const msg = event.data;
      if (msg.type === 'sessionUpdate' && Array.isArray(msg.data)) {
        const container = document.getElementById('sessions');
        container.innerHTML = msg.data.map(s =>
          '<div class="session ' + s.state + '">' +
          '<div class="name">' + s.name + '</div>' +
          '<div class="state">' + s.state + ' | ' + s.historyCount + ' entries</div>' +
          '<button onclick="resumeSession(\\'' + s.id + '\\')">Resume</button>' +
          '<button onclick="pauseSession(\\'' + s.id + '\\')">Pause</button>' +
          '<button class="danger" onclick="destroySession(\\'' + s.id + '\\')">Destroy</button>' +
          '</div>'
        ).join('');
      }
    });
  </script>
</body>
</html>`;
}

export function deactivate() {
  if (bridgeSocket) {
    bridgeSocket.end();
    bridgeSocket = null;
  }
}
