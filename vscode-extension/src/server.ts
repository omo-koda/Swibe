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

// ── Keyword database (all Swibe keywords with docs) ──

const SWIBE_KEYWORDS: CompletionItem[] = [
  // Core
  { label: 'fn',       kind: CompletionItemKind.Keyword, detail: 'Function declaration',
    documentation: 'fn name(param: Type) -> ReturnType { ... }' },
  { label: 'let',      kind: CompletionItemKind.Keyword, detail: 'Variable binding' },
  { label: 'const',    kind: CompletionItemKind.Keyword, detail: 'Constant binding' },
  { label: 'struct',   kind: CompletionItemKind.Keyword, detail: 'Struct declaration' },
  { label: 'enum',     kind: CompletionItemKind.Keyword, detail: 'Enum declaration' },
  { label: 'match',    kind: CompletionItemKind.Keyword, detail: 'Pattern matching' },
  { label: 'if',       kind: CompletionItemKind.Keyword, detail: 'Conditional branch' },
  { label: 'else',     kind: CompletionItemKind.Keyword, detail: 'Alternative branch' },
  { label: 'return',   kind: CompletionItemKind.Keyword, detail: 'Return value' },
  { label: 'async',    kind: CompletionItemKind.Keyword, detail: 'Async function' },
  { label: 'await',    kind: CompletionItemKind.Keyword, detail: 'Await async result' },

  // AI-Native
  { label: 'think',    kind: CompletionItemKind.Keyword, detail: 'LLM reasoning primitive',
    documentation: 'think "prompt" { loop: true, max_iterations: 5 }' },
  { label: 'swarm',    kind: CompletionItemKind.Keyword, detail: 'Multi-agent coordination',
    documentation: 'swarm { @elixir agent { ... } }' },
  { label: 'skill',    kind: CompletionItemKind.Keyword, detail: 'Modular capability',
    documentation: 'skill Name { prompt: "...", tools: [...] }' },
  { label: 'secure',   kind: CompletionItemKind.Keyword, detail: 'Sandboxed execution' },
  { label: 'meta-digital', kind: CompletionItemKind.Keyword, detail: 'Ethics-aware task chain' },
  { label: 'neural',   kind: CompletionItemKind.Keyword, detail: 'Neural layer activation' },
  { label: 'app',      kind: CompletionItemKind.Keyword, detail: 'Application block' },

  // Sovereign
  { label: 'ethics',   kind: CompletionItemKind.Keyword, detail: 'Ethics declaration',
    documentation: 'ethics { harm_none: true; sovereign_data: true }' },
  { label: 'mint',     kind: CompletionItemKind.Keyword, detail: 'Blockchain mint' },
  { label: 'receipt',  kind: CompletionItemKind.Keyword, detail: 'Execution receipt' },
  { label: 'seal',     kind: CompletionItemKind.Keyword, detail: 'Cryptographic seal' },
  { label: 'birth',    kind: CompletionItemKind.Keyword, detail: 'Agent birth ceremony' },

  // Phase 2 — Tool System
  { label: 'permission', kind: CompletionItemKind.Keyword, detail: 'Permission matrix',
    documentation: 'permission { think: "auto"; bash: "plan"; mint: "ask" }' },
  { label: 'mcp',      kind: CompletionItemKind.Keyword, detail: 'MCP server connection',
    documentation: 'mcp { server: "filesystem"; transport: "stdio" }' },
  { label: 'team',     kind: CompletionItemKind.Keyword, detail: 'Team coordination',
    documentation: 'team "Name" { role: "description"; coordination: "hierarchical" }' },
  { label: 'edit',     kind: CompletionItemKind.Keyword, detail: 'Partial file edit',
    documentation: 'edit "file.swibe" { replace: "old"; with: "new" }' },
  { label: 'budget',   kind: CompletionItemKind.Keyword, detail: 'Resource budget',
    documentation: 'budget { tokens: 100000; time: "300s" }' },
  { label: 'remember', kind: CompletionItemKind.Keyword, detail: 'Memory store' },

  // Phase 3 — IDE Bridge
  { label: 'bridge',   kind: CompletionItemKind.Keyword, detail: 'IDE bridge connection',
    documentation: 'bridge "name" { transport: "stdio"; port: 6271 }' },
  { label: 'session',  kind: CompletionItemKind.Keyword, detail: 'Session management',
    documentation: 'session "name" { action: "create" }' },

  // Classes
  { label: 'NeuralLayer',         kind: CompletionItemKind.Class, detail: '86B neuron cognitive layer' },
  { label: 'SovereignNeuralLayer', kind: CompletionItemKind.Class, detail: '86-parameter sovereign neural architecture' },
];

// ── Hover documentation ──

const HOVER_DOCS: { [key: string]: { title: string; desc: string; example?: string } } = {
  think:      { title: 'think', desc: 'LLM reasoning primitive — sends prompt to model, returns response',
                example: 'think "Analyze this code" { loop: true, max_iterations: 5 }' },
  ethics:     { title: 'ethics', desc: 'Declare ethical constraints for the program',
                example: 'ethics { harm_none: true; sovereign_data: true }' },
  permission: { title: 'permission', desc: 'Granular permission matrix — auto/ask/plan/refuse per action',
                example: 'permission { think: "auto"; bash: "plan"; mint: "ask" }' },
  mcp:        { title: 'mcp', desc: 'Connect to Model Context Protocol tool servers',
                example: 'mcp { server: "filesystem"; transport: "stdio" }' },
  team:       { title: 'team', desc: 'Multi-agent team coordination with role assignments',
                example: 'team "DevTeam" { architect: "design"; coder: "implement" }' },
  edit:       { title: 'edit', desc: 'Partial file modification via string replacement',
                example: 'edit "src/main.swibe" { replace: "old()"; with: "new()" }' },
  bridge:     { title: 'bridge', desc: 'Bidirectional IDE connection — JSON-RPC 2.0 over stdio or TCP',
                example: 'bridge "ide" { transport: "stdio"; port: 6271 }' },
  session:    { title: 'session', desc: 'Persistent agent session — create, resume, pause',
                example: 'session "dev" { action: "create" }' },
  budget:     { title: 'budget', desc: 'Resource budget enforcement — tokens, time, cost limits',
                example: 'budget { tokens: 100000; time: "300s" }' },
  swarm:      { title: 'swarm', desc: 'Multi-agent swarm coordination block' },
  skill:      { title: 'skill', desc: 'Reusable capability definition with tools and prompts',
                example: 'skill Audit { prompt: "Check OWASP top 10", tools: ["read_file"] }' },
  birth:      { title: 'birth', desc: 'Sovereign agent birth ceremony with BIPỌ̀N39 wallet' },
  mint:       { title: 'mint', desc: 'Mint a blockchain artifact or token' },
  receipt:    { title: 'receipt', desc: 'Generate cryptographic execution receipt' },
  seal:       { title: 'seal', desc: 'Cryptographically seal the current state' },
  secure:     { title: 'secure', desc: 'Sandboxed execution block' },
  fn:         { title: 'fn', desc: 'Function declaration',
                example: 'fn greet(name: str) -> str { return "Hello " + name; }' },
  struct:     { title: 'struct', desc: 'Data structure declaration',
                example: 'struct Point { x: f64, y: f64 }' },
  match:      { title: 'match', desc: 'Pattern matching expression',
                example: 'match value { 1 => "one", _ => "other" }' },
};

// ── AST node type → SymbolKind mapping ──

const AST_SYMBOL_MAP: { [key: string]: SymbolKind } = {
  FunctionDecl: SymbolKind.Function,
  StructDecl: SymbolKind.Struct,
  EnumDecl: SymbolKind.Enum,
  TraitDecl: SymbolKind.Interface,
  ImplBlock: SymbolKind.Class,
  VariableDecl: SymbolKind.Variable,
  SkillDecl: SymbolKind.Module,
  TeamStatement: SymbolKind.Namespace,
  BridgeStatement: SymbolKind.Event,
  SessionStatement: SymbolKind.Object,
  EthicsStatement: SymbolKind.Property,
  PermissionStatement: SymbolKind.Key,
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

    // Inside permission block → suggest modes
    if (line.match(/^\s*\w+:\s*$/)) {
      return [
        { label: '"auto"',   kind: CompletionItemKind.EnumMember, detail: 'Auto-approve' },
        { label: '"ask"',    kind: CompletionItemKind.EnumMember, detail: 'Always ask user' },
        { label: '"plan"',   kind: CompletionItemKind.EnumMember, detail: 'Ask once per session' },
        { label: '"refuse"', kind: CompletionItemKind.EnumMember, detail: 'Always deny' },
      ];
    }

    // After bridge { → suggest bridge config keys
    if (line.match(/bridge\s/)) {
      return [
        { label: 'transport', kind: CompletionItemKind.Property, detail: '"stdio" | "tcp"' },
        { label: 'port',      kind: CompletionItemKind.Property, detail: 'TCP port (default 6271)' },
        { label: 'auth',      kind: CompletionItemKind.Property, detail: 'Authentication mode' },
        ...SWIBE_KEYWORDS,
      ];
    }

    // After session { → suggest session config keys
    if (line.match(/session\s/)) {
      return [
        { label: 'action',  kind: CompletionItemKind.Property, detail: '"create" | "resume" | "pause" | "list"' },
        { label: 'id',      kind: CompletionItemKind.Property, detail: 'Session ID to resume' },
        { label: 'budget',  kind: CompletionItemKind.Property, detail: 'Session budget' },
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

  const line = doc.getText(Range.create(params.position.line, 0, params.position.line + 1, 0));
  const offset = params.position.character;

  // Extract word at position
  const before = line.slice(0, offset).match(/[\w-]+$/);
  const after = line.slice(offset).match(/^[\w-]*/);
  const word = (before?.[0] || '') + (after?.[0] || '');

  const info = HOVER_DOCS[word];
  if (!info) return null;

  let content = `**${info.title}** — ${info.desc}`;
  if (info.example) {
    content += `\n\n\`\`\`swibe\n${info.example}\n\`\`\``;
  }

  return {
    contents: {
      kind: MarkupKind.Markdown,
      value: content,
    }
  };
});

// ── Document Symbols (AST-powered) ──

connection.onDocumentSymbol((params: DocumentSymbolParams): DocumentSymbol[] => {
  const doc = documents.get(params.textDocument.uri);
  if (!doc) return [];

  const symbols: DocumentSymbol[] = [];
  const text = doc.getText();
  const lines = text.split('\n');

  // Regex-based fast symbol extraction (no parser dependency in server)
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
    for (const [regex, kind, symbolKind] of patterns) {
      const m = line.match(regex);
      if (m) {
        const name = m[1] || kind;
        symbols.push({
          name,
          detail: kind,
          kind: symbolKind,
          range: Range.create(i, 0, i, line.length),
          selectionRange: Range.create(i, 0, i, line.length),
        });
        break;
      }
    }
  });

  return symbols;
});

// ── Real-time Diagnostics (parser-powered) ──

documents.onDidChangeContent(change => {
  validateDocument(change.document);
});

async function validateDocument(document: TextDocument): Promise<void> {
  const diagnostics: Diagnostic[] = [];
  const text = document.getText();
  const lines = text.split('\n');

  // ── Syntax checks via pattern matching ──

  lines.forEach((line, i) => {
    const trimmed = line.trim();

    // think() function call instead of statement
    if (trimmed.includes('think(') && !trimmed.startsWith('--')) {
      diagnostics.push({
        severity: DiagnosticSeverity.Warning,
        range: Range.create(i, 0, i, line.length),
        message: 'think is a statement, not a function call. Use: think "prompt"',
        source: 'swibe'
      });
    }

    // MCP without permission block (file-level heuristic)
    if (trimmed.startsWith('mcp ') || trimmed === 'mcp{' || trimmed === 'mcp {') {
      const hasPermission = text.includes('permission {') || text.includes('permission{');
      if (!hasPermission) {
        diagnostics.push({
          severity: DiagnosticSeverity.Warning,
          range: Range.create(i, 0, i, line.length),
          message: 'MCP connections should have a permission {} block declared before them',
          source: 'swibe'
        });
      }
    }

    // Bridge without permission block
    if (trimmed.startsWith('bridge ') || trimmed === 'bridge{' || trimmed === 'bridge {') {
      const hasPermission = text.includes('permission {') || text.includes('permission{');
      if (!hasPermission) {
        diagnostics.push({
          severity: DiagnosticSeverity.Warning,
          range: Range.create(i, 0, i, line.length),
          message: 'IDE bridge should have a permission {} block declared before it',
          source: 'swibe'
        });
      }
    }

    // Edit without ethics
    if (trimmed.startsWith('edit ') && trimmed.includes('{')) {
      const hasEthics = text.includes('ethics {') || text.includes('ethics{');
      if (!hasEthics) {
        diagnostics.push({
          severity: DiagnosticSeverity.Warning,
          range: Range.create(i, 0, i, line.length),
          message: 'File edit should have an ethics {} declaration',
          source: 'swibe'
        });
      }
    }

    // Think loop without budget
    if (trimmed.includes('loop: true') || trimmed.includes('loop:true')) {
      const hasBudget = text.includes('budget {') || text.includes('budget{');
      if (!hasBudget) {
        diagnostics.push({
          severity: DiagnosticSeverity.Information,
          range: Range.create(i, 0, i, line.length),
          message: 'Think loops should have a budget {} block to prevent runaway iterations',
          source: 'swibe'
        });
      }
    }
  });

  connection.sendDiagnostics({ uri: document.uri, diagnostics });
}

documents.listen(connection);
connection.listen();
