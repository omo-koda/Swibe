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
  Range
} from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';

const connection = createConnection(ProposedFeatures.all);
const documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);

const SWIBE_KEYWORDS: CompletionItem[] = [
  {
    label: 'think',
    kind: CompletionItemKind.Keyword,
    detail: 'LLM reasoning primitive',
    documentation: 'think "prompt" { model: "ollama:llama3" }'
  },
  {
    label: 'swarm',
    kind: CompletionItemKind.Keyword,
    detail: 'Multi-agent coordination',
    documentation: 'swarm { @elixir agent { ... } }'
  },
  {
    label: 'skill',
    kind: CompletionItemKind.Keyword,
    detail: 'Modular capability',
    documentation: 'skill MySkill { ... }'
  },
  {
    label: 'secure',
    kind: CompletionItemKind.Keyword,
    detail: 'Sandboxed execution',
    documentation: 'secure { ... }'
  },
  {
    label: 'meta-digital',
    kind: CompletionItemKind.Keyword,
    detail: 'Ethics-aware task chain',
    documentation: 'meta-digital "Task" { refuse_if: true }'
  },
  { label: 'fn',      kind: CompletionItemKind.Keyword, detail: 'Function declaration' },
  { label: 'let',     kind: CompletionItemKind.Keyword, detail: 'Variable binding' },
  { label: 'struct',  kind: CompletionItemKind.Keyword, detail: 'Struct declaration' },
  { label: 'enum',    kind: CompletionItemKind.Keyword, detail: 'Enum declaration' },
  { label: 'match',   kind: CompletionItemKind.Keyword, detail: 'Pattern matching' },
  { label: 'app',     kind: CompletionItemKind.Keyword, detail: 'Application block' },
  { label: 'mint',    kind: CompletionItemKind.Keyword, detail: 'Blockchain mint' },
  { label: 'receipt', kind: CompletionItemKind.Keyword, detail: 'Execution receipt' },
  {
    label: 'NeuralLayer',
    kind: CompletionItemKind.Class,
    detail: '86B neuron cognitive layer'
  },
  {
    label: 'SovereignNeuralLayer',
    kind: CompletionItemKind.Class,
    detail: '86-parameter sovereign neural architecture'
  },
];

connection.onInitialize((_params: InitializeParams): InitializeResult => {
  return {
    capabilities: {
      textDocumentSync: TextDocumentSyncKind.Incremental,
      completionProvider: { resolveProvider: true },
      hoverProvider: true,
      diagnosticProvider: {
        interFileDependencies: false,
        workspaceDiagnostics: false
      }
    }
  };
});

connection.onCompletion(
  (_textDocumentPosition: TextDocumentPositionParams): CompletionItem[] => {
    return SWIBE_KEYWORDS;
  }
);

connection.onCompletionResolve((item: CompletionItem): CompletionItem => {
  return item;
});

documents.onDidChangeContent(change => {
  validateDocument(change.document);
});

async function validateDocument(document: TextDocument): Promise<void> {
  const diagnostics: Diagnostic[] = [];
  const text = document.getText();
  const lines = text.split('\n');

  lines.forEach((line, i) => {
    if (line.includes('think(') && !line.includes('await')) {
      diagnostics.push({
        severity: DiagnosticSeverity.Warning,
        range: Range.create(i, 0, i, line.length),
        message: 'think is a statement, not a function call. Use: think "prompt"',
        source: 'swibe'
      });
    }
  });

  connection.sendDiagnostics({ uri: document.uri, diagnostics });
}

documents.listen(connection);
connection.listen();
