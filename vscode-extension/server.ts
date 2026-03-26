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
import { TextDocument } from 
  'vscode-languageserver-textdocument';

  const connection = createConnection(ProposedFeatures.all);
  const documents = new TextDocuments(TextDocument);

  const SWIBE_KEYWORDS: CompletionItem[] = [
      { label: 'think', kind: CompletionItemKind.Keyword,
          detail: 'LLM reasoning primitive',
              documentation: 'think "prompt" { model: "ollama:llama3" }' },
                { label: 'swarm', kind: CompletionItemKind.Keyword,
                    detail: 'Multi-agent coordination' },
                      { label: 'skill', kind: CompletionItemKind.Keyword,
                          detail: 'Modular capability' },
                            { label: 'secure', kind: CompletionItemKind.Keyword,
                                detail: 'Sandboxed execution' },
                                  { label: 'meta-digital', kind: CompletionItemKind.Keyword,
                                      detail: 'Ethics-aware task chain' },
                                        { label: 'fn', kind: CompletionItemKind.Keyword },
                                          { label: 'let', kind: CompletionItemKind.Keyword },
                                            { label: 'struct', kind: CompletionItemKind.Keyword },
                                              { label: 'enum', kind: CompletionItemKind.Keyword },
                                                { label: 'match', kind: CompletionItemKind.Keyword },
                                                  { label: 'app', kind: CompletionItemKind.Keyword },
                                                    { label: 'mint', kind: CompletionItemKind.Keyword },
                                                      { label: 'NeuralLayer', kind: CompletionItemKind.Class },
                                                        { label: 'SovereignNeuralLayer', 
                                                            kind: CompletionItemKind.Class },
  ];

  connection.onInitialize(
      (_params: InitializeParams): InitializeResult => {
            return {
                      capabilities: {
                                textDocumentSync: TextDocumentSyncKind.Incremental,
                                        completionProvider: { resolveProvider: true },
                                                hoverProvider: true
                      }
            };
      }
  );

  connection.onCompletion(
      (_pos: TextDocumentPositionParams): CompletionItem[] => {
            return SWIBE_KEYWORDS;
      }
  );

  connection.onCompletionResolve(
      (item: CompletionItem): CompletionItem => item
  );

  documents.onDidChangeContent(change => {
      const diagnostics: Diagnostic[] = [];
        const text = change.document.getText();
          const lines = text.split('\n');
            lines.forEach((line, i) => {
                    if (line.includes('think(') && 
                            !line.trim().startsWith('--')) {
                                      diagnostics.push({
                                                severity: DiagnosticSeverity.Warning,
                                                        range: Range.create(i, 0, i, line.length),
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