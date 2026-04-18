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
  { label: 'coordinate', kind: CompletionItemKind.Keyword, detail: 'Agent coordination dispatch',
    documentation: 'coordinate "task" { strategy: "democratic" }' },
  { label: 'policy',     kind: CompletionItemKind.Keyword, detail: 'Org-level policy enforcement',
    documentation: 'policy { max_tokens_per_user: 100000; forbidden: ["rm_rf"] }' },
  { label: 'analytics',  kind: CompletionItemKind.Keyword, detail: 'A/B testing and metrics',
    documentation: 'analytics "model_test" { variants: ["claude", "llama3"] }' },
  { label: 'witness',    kind: CompletionItemKind.Keyword, detail: 'Multimodal perception',
    documentation: 'witness { modalities: "image,audio"; fusion: "unified_context" }' },
  { label: 'pilot',      kind: CompletionItemKind.Keyword, detail: 'Computer control',
    documentation: 'pilot { mode: "browser"; safe_mode: true }' },
  { label: 'viewport',   kind: CompletionItemKind.Keyword, detail: 'Screen understanding',
    documentation: 'viewport { width: 1920; height: 1080; ocr: true }' },
  { label: 'gestalt',    kind: CompletionItemKind.Keyword, detail: 'Parallel tool execution',
    documentation: 'gestalt { search: "query"; analyze: "data"; merge: "unified_context" }' },
  { label: 'token',      kind: CompletionItemKind.Keyword, detail: 'ToC token definition',
    documentation: 'token "ase" { holders: "humans"; daily_mint: 1440 }' },
  { label: 'wallet',     kind: CompletionItemKind.Keyword, detail: 'Agent wallet with birth endowment',
    documentation: 'wallet "agent_1" { type: "agent"; birth: true }' },
  { label: 'stake',      kind: CompletionItemKind.Keyword, detail: 'Token staking',
    documentation: 'stake { holder: "agent_1"; token: "toc_s"; amount: 1000 }' },
  { label: 'slash',      kind: CompletionItemKind.Keyword, detail: 'Slash staked tokens',
    documentation: 'slash { holder: "agent_1"; percentage: 50; reason: "fraud" }' },
  { label: 'convert',    kind: CompletionItemKind.Keyword, detail: 'Burn-convert tokens',
    documentation: 'convert { from: "ase"; to: "toc_d"; ratio: "10000_per_ase" }' },
  { label: 'royalty',    kind: CompletionItemKind.Keyword, detail: 'Creator royalty config',
    documentation: 'royalty { recipient: "creator"; token: "ase"; percentage: "10%" }' },
  { label: 'escrow',     kind: CompletionItemKind.Keyword, detail: 'Job payment escrow',
    documentation: 'escrow "delivery_job" { human: "user_1"; agent: "drone_1"; amount: 1 }' },
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
  coordinate: 'Dispatch task to team — hierarchical, democratic, competitive, or pipeline.',
  policy: 'Org-level controls — per-user limits, forbidden operations, rate limiting.',
  analytics: 'A/B experiments and metrics — model selection testing, custom tracking.',
  witness: 'Multimodal perception — process image/video/audio/document with context fusion.',
  pilot: 'Computer control — desktop/browser/mobile modes with perceive/act cycle.',
  viewport: 'Screen understanding — resolution, accessibility tree, UI extraction, OCR.',
  gestalt: 'Parallel tool execution — run concurrent operations and merge results.',
  token: 'ToC token definition — Àṣẹ (human), Dopamine (agent internal), Synapse (agent commerce).',
  wallet: 'Agent wallet — 86B Dopamine + 86M Synapse neural birth endowment.',
  stake: 'Stake tokens for validation rights, service offering, or agent registration.',
  slash: 'Slash staked tokens on fraud, bad agents, or protocol violations.',
  convert: 'Burn-convert: Àṣẹ→Dopamine (1:10000), Dopamine→Synapse (10:1), Synapse→Dopamine (1:5 emergency).',
  royalty: 'Creator royalty — 10% Àṣẹ on every job, locked 7 days (Sabbath vesting).',
  escrow: 'Job payment escrow — human locks Àṣẹ, released on verification, forfeited on false jobs.',
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
    [/^\s*policy\b/, 'policy', SymbolKind.Key],
    [/^\s*analytics\s+"([^"]+)"/, 'analytics', SymbolKind.Event],
    [/^\s*analytics\s+(\w+)/, 'analytics', SymbolKind.Event],
    [/^\s*coordinate\s+"([^"]+)"/, 'coordinate', SymbolKind.Method],
    [/^\s*witness\b/, 'witness', SymbolKind.Event],
    [/^\s*pilot\b/, 'pilot', SymbolKind.Event],
    [/^\s*viewport\b/, 'viewport', SymbolKind.Property],
    [/^\s*gestalt\b/, 'gestalt', SymbolKind.Method],
    [/^\s*token\s+"([^"]+)"/, 'token', SymbolKind.Constant],
    [/^\s*token\b/, 'token', SymbolKind.Constant],
    [/^\s*wallet\s+"([^"]+)"/, 'wallet', SymbolKind.Object],
    [/^\s*wallet\b/, 'wallet', SymbolKind.Object],
    [/^\s*stake\b/, 'stake', SymbolKind.Property],
    [/^\s*slash\b/, 'slash', SymbolKind.Property],
    [/^\s*convert\b/, 'convert', SymbolKind.Method],
    [/^\s*royalty\b/, 'royalty', SymbolKind.Property],
    [/^\s*escrow\s+"([^"]+)"/, 'escrow', SymbolKind.Object],
    [/^\s*escrow\b/, 'escrow', SymbolKind.Object],
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
