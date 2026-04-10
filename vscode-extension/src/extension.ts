import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
  console.log('Swibe extension activated');

  // Register REPL command
  const replCmd = vscode.commands.registerCommand(
    'swibe.openRepl',
    () => {
      const terminal = vscode.window.createTerminal('Swibe REPL');
      terminal.show();
      terminal.sendText('swibe repl');
    }
  );

  // Register compile command
  const compileCmd = vscode.commands.registerCommand(
    'swibe.compile',
    () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) return;
      const file = editor.document.fileName;
      const terminal = vscode.window.createTerminal('Swibe');
      terminal.show();
      terminal.sendText(`swibe compile "${file}" --target javascript`);
    }
  );

  // Register run command
  const runCmd = vscode.commands.registerCommand(
    'swibe.run',
    () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) return;
      const file = editor.document.fileName;
      const terminal = vscode.window.createTerminal('Swibe');
      terminal.show();
      terminal.sendText(`swibe run "${file}"`);
    }
  );

  // Register openclaw compile command
  const openclawCmd = vscode.commands.registerCommand(
    'swibe.compileOpenClaw',
    () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) return;
      const file = editor.document.fileName;
      const terminal = vscode.window.createTerminal('Swibe');
      terminal.show();
      terminal.sendText(
        `swibe compile "${file}" --target openclaw`
      );
    }
  );

  context.subscriptions.push(
    replCmd, compileCmd, runCmd, openclawCmd
  );
}

export function deactivate() {}
