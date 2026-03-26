"use strict";
/**
 * Swibe Language VSCode Extension
 * Syntax highlighting, completion, hover info, diagnostics
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
const node_1 = require("vscode-languageclient/node");
let client;
function activate(context) {
    const serverModule = context.asAbsolutePath(path.join('out', 'server.js'));
    const debugOptions = { execArgv: ['--nolazy', '--inspect=6009'] };
    const serverOptions = {
        run: { module: serverModule, transport: node_1.TransportKind.ipc },
        debug: {
            module: serverModule,
            transport: node_1.TransportKind.ipc,
            options: debugOptions
        }
    };
    const clientOptions = {
        documentSelector: [{ scheme: 'file', language: 'swibe' }],
        synchronize: {
            fileEvents: vscode.workspace.createFileSystemWatcher('**/.swibe')
        }
    };
    client = new node_1.LanguageClient('swibe', 'Swibe Language Server', serverOptions, clientOptions);
    // Start language server
    client.start();
    // Register hover provider
    context.subscriptions.push(vscode.languages.registerHoverProvider('swibe', new SwibeHoverProvider()));
    // Register completion provider
    context.subscriptions.push(vscode.languages.registerCompletionItemProvider('swibe', new SwibeCompletionProvider(), '.', '['));
    // Register definition provider
    context.subscriptions.push(vscode.languages.registerDefinitionProvider('swibe', new SwibeDefinitionProvider()));
    // Register symbol provider
    context.subscriptions.push(vscode.languages.registerDocumentSymbolProvider('swibe', new SwibeSymbolProvider()));
    // Compile command
    context.subscriptions.push(vscode.commands.registerCommand('swibe.compile', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor)
            return;
        const swibeModule = await Promise.resolve().then(() => __importStar(require('./swibe-compiler')));
        const output = await swibeModule.compile(editor.document.getText());
        const channel = vscode.window.createOutputChannel('Swibe Compiler');
        channel.appendLine(output);
        channel.show();
    }));
    // Format command
    context.subscriptions.push(vscode.commands.registerCommand('swibe.format', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor)
            return;
        const swibeModule = await Promise.resolve().then(() => __importStar(require('./swibe-compiler')));
        const formatted = await swibeModule.format(editor.document.getText());
        editor.edit(editBuilder => {
            const fullRange = new vscode.Range(editor.document.positionAt(0), editor.document.positionAt(editor.document.getText().length));
            editBuilder.replace(fullRange, formatted);
        });
    }));
}
exports.activate = activate;
function deactivate() {
    if (!client) {
        return undefined;
    }
    return client.stop();
}
exports.deactivate = deactivate;
class SwibeHoverProvider {
    async provideHover(document, position) {
        const range = document.getWordRangeAtPosition(position);
        if (!range)
            return null;
        const word = document.getText(range);
        const builtins = {
            'fn': 'Function declaration',
            'struct': 'Struct definition',
            'enum': 'Enumeration type',
            'match': 'Pattern matching',
            'if': 'Conditional branch',
            'else': 'Alternative branch',
            'while': 'Loop statement',
            'for': 'Iterator loop',
            'break': 'Exit loop',
            'continue': 'Skip iteration',
            'return': 'Return from function',
            'mut': 'Mutable binding',
            'async': 'Asynchronous function',
            'await': 'Wait for async result',
            'print': 'Output to console',
            'len': 'Get length',
            'type': 'Get type information',
        };
        if (builtins[word]) {
            return new vscode.Hover(new vscode.MarkdownString(`**${word}** - ${builtins[word]}`));
        }
        return null;
    }
}
class SwibeCompletionProvider {
    provideCompletionItems(document, position) {
        const completions = [];
        // Keywords
        const keywords = [
            'fn', 'struct', 'enum', 'match', 'if', 'else', 'while', 'for', 'break', 'continue',
            'return', 'mut', 'async', 'await', 'pub', 'impl', 'trait', 'type'
        ];
        keywords.forEach(keyword => {
            const item = new vscode.CompletionItem(keyword, vscode.CompletionItemKind.Keyword);
            item.insertText = keyword;
            completions.push(item);
        });
        // Built-in functions
        const builtins = [
            'print', 'println', 'len', 'type', 'push', 'pop', 'map', 'filter',
            'reduce', 'range', 'zip', 'enumerate', 'panic', 'assert'
        ];
        builtins.forEach(builtin => {
            const item = new vscode.CompletionItem(builtin, vscode.CompletionItemKind.Function);
            item.insertText = builtin + '()';
            completions.push(item);
        });
        return completions;
    }
}
class SwibeDefinitionProvider {
    provideDefinition(document, position) {
        // Parse document and find definitions
        // Return location of definition
        return null;
    }
}
class SwibeSymbolProvider {
    provideDocumentSymbols(document) {
        const symbols = [];
        const text = document.getText();
        const lines = text.split('\n');
        lines.forEach((line, index) => {
            // Functions
            const fnMatch = line.match(/^\s*fn\s+(\w+)\s*\(/);
            if (fnMatch) {
                symbols.push(new vscode.DocumentSymbol(fnMatch[1], 'function', vscode.SymbolKind.Function, new vscode.Range(index, 0, index, line.length), new vscode.Range(index, 0, index, line.length)));
            }
            // Structs
            const structMatch = line.match(/^\s*struct\s+(\w+)/);
            if (structMatch) {
                symbols.push(new vscode.DocumentSymbol(structMatch[1], 'struct', vscode.SymbolKind.Struct, new vscode.Range(index, 0, index, line.length), new vscode.Range(index, 0, index, line.length)));
            }
            // Enums
            const enumMatch = line.match(/^\s*enum\s+(\w+)/);
            if (enumMatch) {
                symbols.push(new vscode.DocumentSymbol(enumMatch[1], 'enum', vscode.SymbolKind.Enum, new vscode.Range(index, 0, index, line.length), new vscode.Range(index, 0, index, line.length)));
            }
        });
        return symbols;
    }
}
//# sourceMappingURL=extension.js.map