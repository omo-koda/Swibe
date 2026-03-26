"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const node_1 = require("vscode-languageserver/node");
const vscode_languageserver_textdocument_1 = require("vscode-languageserver-textdocument");
const connection = (0, node_1.createConnection)(node_1.ProposedFeatures.all);
const documents = new node_1.TextDocuments(vscode_languageserver_textdocument_1.TextDocument);
const SWIBE_KEYWORDS = [
    { label: 'think', kind: node_1.CompletionItemKind.Keyword,
        detail: 'LLM reasoning primitive',
        documentation: 'think "prompt" { model: "ollama:llama3" }' },
    { label: 'swarm', kind: node_1.CompletionItemKind.Keyword,
        detail: 'Multi-agent coordination' },
    { label: 'skill', kind: node_1.CompletionItemKind.Keyword,
        detail: 'Modular capability' },
    { label: 'secure', kind: node_1.CompletionItemKind.Keyword,
        detail: 'Sandboxed execution' },
    { label: 'meta-digital', kind: node_1.CompletionItemKind.Keyword,
        detail: 'Ethics-aware task chain' },
    { label: 'fn', kind: node_1.CompletionItemKind.Keyword },
    { label: 'let', kind: node_1.CompletionItemKind.Keyword },
    { label: 'struct', kind: node_1.CompletionItemKind.Keyword },
    { label: 'enum', kind: node_1.CompletionItemKind.Keyword },
    { label: 'match', kind: node_1.CompletionItemKind.Keyword },
    { label: 'app', kind: node_1.CompletionItemKind.Keyword },
    { label: 'mint', kind: node_1.CompletionItemKind.Keyword },
    { label: 'NeuralLayer', kind: node_1.CompletionItemKind.Class },
    { label: 'SovereignNeuralLayer',
        kind: node_1.CompletionItemKind.Class },
];
connection.onInitialize((_params) => {
    return {
        capabilities: {
            textDocumentSync: node_1.TextDocumentSyncKind.Incremental,
            completionProvider: { resolveProvider: true },
            hoverProvider: true
        }
    };
});
connection.onCompletion((_pos) => {
    return SWIBE_KEYWORDS;
});
connection.onCompletionResolve((item) => item);
documents.onDidChangeContent(change => {
    const diagnostics = [];
    const text = change.document.getText();
    const lines = text.split('\n');
    lines.forEach((line, i) => {
        if (line.includes('think(') &&
            !line.trim().startsWith('--')) {
            diagnostics.push({
                severity: node_1.DiagnosticSeverity.Warning,
                range: node_1.Range.create(i, 0, i, line.length),
                message: 'Use think "prompt" not think()',
                source: 'swibe'
            });
        }
    });
    connection.sendDiagnostics({
        uri: change.document.uri,
        diagnostics
    });
});
documents.listen(connection);
connection.listen();
//# sourceMappingURL=server.js.map