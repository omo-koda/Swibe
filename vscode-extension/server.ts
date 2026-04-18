/**
 * Swibe Language Server
 * Phase 3: Enhanced diagnostics, symbols, hover, bridge-aware completions
 */

import {
  createConnection,
  TextDocuments,
  ProposedFeatures,
  InitializeParams,
  CompletionItem,
  CompletionItemKind,
  TextDocumentPositionParams,
  TextDocumentSyncKind,
  InitializeResult,
  Diagnostic,
  DiagnosticSeverity,
  Range,
  DocumentSymbol,
  SymbolKind,
  DocumentSymbolParams,
  HoverParams,
  Hover,
  MarkupKind,
} from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';

const connection = createConnection(ProposedFeatures.all);
const documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);

// ── Keyword completion items ──

const SWIBE_KEYWORDS: CompletionItem[] = [
  { label: 'fn',         kind: CompletionItemKind.Keyword, detail: 'Function declaration',
    documentation: 'fn name(param: Type) -> ReturnType { ... }' },
  { label: 'let',        kind: CompletionItemKind.Keyword, detail: 'Variable binding' },
  { label: 'const',      kind: CompletionItemKind.Keyword, detail: 'Constant binding' },
  { label: 'struct',     kind: CompletionItemKind.Keyword, detail: 'Struct declaration' },
  { label: 'enum',       kind: CompletionItemKind.Keyword, detail: 'Enum declaration' },
  { label: 'match',      kind: CompletionItemKind.Keyword, detail: 'Pattern matching' },
  { label: 'if',         kind: CompletionItemKind.Keyword, detail: 'Conditional branch' },
  { label: 'return',     kind: CompletionItemKind.Keyword, detail: 'Return value' },
  { label: 'async',      kind: CompletionItemKind.Keyword, detail: 'Async function' },
  { label: 'await',      kind: CompletionItemKind.Keyword, detail: 'Await async' },
  { label: 'think',      kind: CompletionItemKind.Keyword, detail: 'LLM reasoning primitive',
    documentation: 'think "prompt" { loop: true, max_iterations: 5 }' },
  { label: 'swarm',      kind: CompletionItemKind.Keyword, detail: 'Multi-agent swarm' },
  { label: 'skill',      kind: CompletionItemKind.Keyword, detail: 'Capability module' },
  { label: 'secure',     kind: CompletionItemKind.Keyword, detail: 'Sandboxed execution' },
  { label: 'meta-digital', kind: CompletionItemKind.Keyword, detail: 'Ethics-aware chain' },
  { label: 'app',        kind: CompletionItemKind.Keyword, detail: 'Application block' },
  { label: 'mint',       kind: CompletionItemKind.Keyword, detail: 'Blockchain mint' },
  { label: 'receipt',    kind: CompletionItemKind.Keyword, detail: 'Execution receipt' },
  { label: 'seal',       kind: CompletionItemKind.Keyword, detail: 'Cryptographic seal' },
  { label: 'birth',      kind: CompletionItemKind.Keyword, detail: 'Agent birth ceremony' },
  { label: 'ethics',     kind: CompletionItemKind.Keyword, detail: 'Ethics declaration',
    documentation: 'ethics { harm_none: true; sovereign_data: true }' },
  { label: 'permission', kind: CompletionItemKind.Keyword, detail: 'Permission matrix',
    documentation: 'permission { think: "auto"; bash: "plan"; mint: "ask" }' },
  { label: 'mcp',        kind: CompletionItemKind.Keyword, detail: 'MCP server connection',
    documentation: 'mcp { server: "filesystem"; transport: "stdio" }' },
  { label: 'team',       kind: CompletionItemKind.Keyword, detail: 'Team coordination',
    documentation: 'team "Name" { role: "desc"; coordination: "hierarchical" }' },
  { label: 'edit',       kind: CompletionItemKind.Keyword, detail: 'Partial file edit',
    documentation: 'edit "file.swibe" { replace: "old"; with: "new" }' },
  { label: 'budget',     kind: CompletionItemKind.Keyword, detail: 'Resource budget' },
  { label: 'remember',   kind: CompletionItemKind.Keyword, detail: 'Memory store' },
  { label: 'bridge',     kind: CompletionItemKind.Keyword, detail: 'IDE bridge connection',
    documentation: 'bridge "name" { transport: "stdio"; port: 6271 }' },
  { label: 'session',    kind: CompletionItemKind.Keyword, detail: 'Session management',
    documentation: 'session "name" { action: "create" }' },
  { label: 'NeuralLayer',          kind: CompletionItemKind.Class, detail: '86B neuron cognitive layer' },
  { label: 'SovereignNeuralLayer', kind: CompletionItemKind.Class, detail: '86-param sovereign neural' },
];

// ── Hover docs ──

const HOVER_DOCS: { [key: string]: string } = {
  think: 'LLM reasoning — sends prompt to model. Supports loop mode with tool calls.',
  ethics: 'Declare ethical constraints: harm_none, sovereign_data, receipt_chain.',
  permission: 'Granular permission matrix — auto/ask/plan/refuse per action.',
  mcp: 'Connect to Model Context Protocol tool servers (filesystem, GitHub, etc).',
  team: 'Multi-agent coordination with roles and hierarchical/democratic modes.',
  edit: 'Partial file modification via string replacement — safer than full overwrite.',
  bridge: 'Bidirectional IDE connection — JSON-RPC 2.0 over stdio or TCP.',
  session: 'Persistent agent session — create, resume, pause across IDE restarts.',
  budget: 'Resource budget — tokens, time limits, cost caps.',
  skill: 'Reusable capability with prompt template and tool list.',
  birth: 'Sovereign agent birth ceremony with BIPỌ̀N39 wallet generation.',
  mint: 'Mint blockchain artifact or token.',
  receipt: 'Cryptographic execution receipt for audit trail.',
  seal: 'Seal current state with cryptographic signature.',
  secure: 'Sandboxed execution block — isolated from main context.',
  fn: 'Function declaration: fn name(param: Type) -> ReturnType { ... }',
  struct: 'Data structure: struct Name { field: Type }',
  match: 'Pattern matching: match expr { pattern => result }',
  swarm: 'Multi-agent swarm coordination block.',
};

// ── Initialization ──

connection.onInitialize((_params: InitializeParams): InitializeResult => {
  return {
    capabilities: {
      textDocumentSync: TextDocumentSyncKind.Incremental,
      completionProvider: { resolveProvider: true, triggerCharacters: ['.', '"', '{'] },
      hoverProvider: true,
      documentSymbolProvider: true,
    }
  };
});

// ── Completion ──

connection.onCompletion(
  (pos: TextDocumentPositionParams): CompletionItem[] => {
    const doc = documents.get(pos.textDocument.uri);
    if (!doc) return SWIBE_KEYWORDS;

    const line = doc.getText(Range.create(pos.position.line, 0, pos.position.line, pos.position.character));

    // Inside permission/bridge/session block — context-aware suggestions
    if (line.match(/^\s*\w+:\s*"?$/)) {
      return [
        { label: '"auto"',   kind: CompletionItemKind.EnumMember, detail: 'Auto-approve' },
        { label: '"ask"',    kind: CompletionItemKind.EnumMember, detail: 'Always ask' },
        { label: '"plan"',   kind: CompletionItemKind.EnumMember, detail: 'Ask once per session' },
        { label: '"refuse"', kind: CompletionItemKind.EnumMember, detail: 'Always deny' },
        ...SWIBE_KEYWORDS,
      ];
    }

    return SWIBE_KEYWORDS;
  }
);

connection.onCompletionResolve((item: CompletionItem): CompletionItem => item);

// ── Hover ──

connection.onHover((params: HoverParams): Hover | null => {
  const doc = documents.get(params.textDocument.uri);
  if (!doc) return null;

  const range = Range.create(params.position.line, 0, params.position.line + 1, 0);
  const line = doc.getText(range);
  const offset = params.position.character;
  const before = line.slice(0, offset).match(/[\w-]+$/);
  const after = line.slice(offset).match(/^[\w-]*/);
  const word = (before?.[0] || '') + (after?.[0] || '');

  const info = HOVER_DOCS[word];
  if (!info) return null;

  return { contents: { kind: MarkupKind.Markdown, value: `**${word}** — ${info}` } };
});

// ── Document Symbols ──

connection.onDocumentSymbol((params: DocumentSymbolParams): DocumentSymbol[] => {
  const doc = documents.get(params.textDocument.uri);
  if (!doc) return [];

  const symbols: DocumentSymbol[] = [];
  const lines = doc.getText().split('\n');
  const patterns: [RegExp, string, SymbolKind][] = [
    [/^\s*(?:async\s+)?fn\s+(\w+)/, 'function', SymbolKind.Function],
    [/^\s*struct\s+(\w+)/, 'struct', SymbolKind.Struct],
    [/^\s*enum\s+(\w+)/, 'enum', SymbolKind.Enum],
    [/^\s*(?:trait|protocol)\s+(\w+)/, 'trait', SymbolKind.Interface],
    [/^\s*impl\s+(\w+)/, 'impl', SymbolKind.Class],
    [/^\s*skill\s+(\w+)/, 'skill', SymbolKind.Module],
    [/^\s*team\s+"([^"]+)"/, 'team', SymbolKind.Namespace],
    [/^\s*bridge\s+"([^"]+)"/, 'bridge', SymbolKind.Event],
    [/^\s*session\s+"([^"]+)"/, 'session', SymbolKind.Object],
    [/^\s*ethics\b/, 'ethics', SymbolKind.Property],
    [/^\s*permission\b/, 'permission', SymbolKind.Key],
    [/^\s*mcp\b/, 'mcp', SymbolKind.Event],
    [/^\s*budget\b/, 'budget', SymbolKind.Constant],
  ];

  lines.forEach((line, i) => {
    for (const [re, kind, sym] of patterns) {
      const m = line.match(re);
      if (m) {
        symbols.push({
          name: m[1] || kind,
          detail: kind,
          kind: sym,
          range: Range.create(i, 0, i, line.length),
          selectionRange: Range.create(i, 0, i, line.length),
        });
        break;
      }
    }
  });

  return symbols;
});

// ── Diagnostics ──

documents.onDidChangeContent(change => {
  validateDocument(change.document);
});

async function validateDocument(document: TextDocument): Promise<void> {
  const diagnostics: Diagnostic[] = [];
  const text = document.getText();
  const lines = text.split('\n');

  lines.forEach((line, i) => {
    const trimmed = line.trim();

    if (trimmed.includes('think(') && !trimmed.startsWith('--')) {
      diagnostics.push({
        severity: DiagnosticSeverity.Warning,
        range: Range.create(i, 0, i, line.length),
        message: 'think is a statement, not a function call. Use: think "prompt"',
        source: 'swibe'
      });
    }

    if ((trimmed.startsWith('mcp ') || trimmed === 'mcp {') &&
        !text.includes('permission {') && !text.includes('permission{')) {
      diagnostics.push({
        severity: DiagnosticSeverity.Warning,
        range: Range.create(i, 0, i, line.length),
        message: 'MCP connections should have a permission {} block',
        source: 'swibe'
      });
    }

    if ((trimmed.startsWith('bridge ') || trimmed === 'bridge {') &&
        !text.includes('permission {') && !text.includes('permission{')) {
      diagnostics.push({
        severity: DiagnosticSeverity.Warning,
        range: Range.create(i, 0, i, line.length),
        message: 'IDE bridge should have a permission {} block',
        source: 'swibe'
      });
    }

    if (trimmed.startsWith('edit ') && trimmed.includes('{') &&
        !text.includes('ethics {') && !text.includes('ethics{')) {
      diagnostics.push({
        severity: DiagnosticSeverity.Warning,
        range: Range.create(i, 0, i, line.length),
        message: 'File edit should have an ethics {} declaration',
        source: 'swibe'
      });
    }

    if ((trimmed.includes('loop: true') || trimmed.includes('loop:true')) &&
        !text.includes('budget {') && !text.includes('budget{')) {
      diagnostics.push({
        severity: DiagnosticSeverity.Information,
        range: Range.create(i, 0, i, line.length),
        message: 'Think loops should have a budget {} to prevent runaway iterations',
        source: 'swibe'
      });
    }
  });

  connection.sendDiagnostics({ uri: document.uri, diagnostics });
}

documents.listen(connection);
connection.listen();
