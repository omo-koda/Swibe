// Swibe Playground - Frontend
class SwibePlayground {
  constructor() {
    this.editor = null;
    this.output = document.getElementById('output');
    this.targetSelect = document.getElementById('targetSelect');
    this.compileBtn = document.getElementById('compileBtn');
    this.shareBtn = document.getElementById('shareBtn');
    this.clearBtn = document.getElementById('clearBtn');
    this.themeBtn = document.getElementById('themeBtn');
    this.status = document.getElementById('status');
    this.stats = document.getElementById('stats');
    
    this.isDarkTheme = true;
    this.init();
  }

  async init() {
    // Initialize Monaco Editor
    require(['vs/editor/editor.main'], () => {
      this.editor = monaco.editor.create(document.getElementById('editor'), {
        value: this.getDefaultCode(),
        language: 'swibe',
        theme: 'vs-dark',
        automaticLayout: true,
        fontSize: 14,
        lineNumbers: 'on',
        scrollBeyondLastLine: false,
        minimap: { enabled: false },
        wordWrap: 'on',
        formatOnPaste: true
      });
      
      // Add Swibe language support
      this.setupLanguage();
    });

    // Event listeners
    this.compileBtn.addEventListener('click', () => this.compile());
    this.shareBtn.addEventListener('click', () => this.share());
    this.clearBtn.addEventListener('click', () => this.clear());
    this.themeBtn.addEventListener('click', () => this.toggleTheme());
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        this.compile();
      }
    });
  }

  setupLanguage() {
    // Register Swibe language
    monaco.languages.register({ id: 'swibe' });
    
    // Syntax highlighting
    monaco.languages.setMonacoTokensProvider('swibe', {
      tokenizer: {
        root: [
          [/\bfn\b/, 'keyword'],
          [/\bstruct\b/, 'keyword'],
          [/\benum\b/, 'keyword'],
          [/\bif\b|\belse\b|\bmatch\b/, 'keyword'],
          [/\bfor\b|\bwhile\b|\bloop\b/, 'keyword'],
          [/\breturn\b|\bbreak\b|\bcontinue\b/, 'keyword'],
          [/\basync\b|\bawait\b/, 'keyword'],
          [/\bmut\b|\bconst\b/, 'keyword'],
          [/\btrue\b|\bfalse\b/, 'constant'],
          [/".*?"/, 'string'],
          [/'.*?'/, 'string'],
          [/\d+/, 'number'],
          [/\/\/.*/, 'comment'],
          [/\/\*/, 'comment', '@comment'],
        ],
        comment: [
          [/[^*/]+/, 'comment'],
          [/\*\//, 'comment', '@pop'],
          [/[*/]/, 'comment']
        ]
      }
    });

    // Auto-completion
    monaco.languages.registerCompletionItemProvider('swibe', {
      provideCompletionItems: (model, position) => {
        return {
          suggestions: [
            {
              label: 'fn',
              kind: monaco.languages.CompletionItemKind.Keyword,
              insertText: 'fn ${1:name}() {\n  $0\n}'
            },
            {
              label: 'struct',
              kind: monaco.languages.CompletionItemKind.Keyword,
              insertText: 'struct ${1:Name} {\n  $0\n}'
            },
            {
              label: 'if',
              kind: monaco.languages.CompletionItemKind.Keyword,
              insertText: 'if ${1:condition} {\n  $0\n}'
            },
            {
              label: 'for',
              kind: monaco.languages.CompletionItemKind.Keyword,
              insertText: 'for ${1:item} in ${2:iterable} {\n  $0\n}'
            },
            {
              label: 'print',
              kind: monaco.languages.CompletionItemKind.Function,
              insertText: 'print($0)'
            },
            {
              label: 'println',
              kind: monaco.languages.CompletionItemKind.Function,
              insertText: 'println($0)'
            }
          ]
        };
      }
    });
  }

  getDefaultCode() {
    return `// Welcome to Swibe Playground
// Compile to JavaScript, Python, Rust, and more!

fn greet(name: str) -> str {
  "Hello, " + name
}

fn main() {
  msg = greet("World")
  println(msg)
}`;
  }

  async compile() {
    const code = this.editor.getValue();
    const target = this.targetSelect.value;
    
    this.setStatus('Compiling...');
    
    try {
      const response = await fetch('/api/compile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, target })
      });

      const result = await response.json();
      
      if (response.ok) {
        this.output.textContent = result.output;
        this.setStatus('Compiled successfully', 'success');
        this.updateStats(code, result.output);
      } else {
        this.output.textContent = `Error: ${result.error}`;
        this.setStatus('Compilation failed', 'error');
      }
    } catch (err) {
      this.output.textContent = `Network error: ${err.message}`;
      this.setStatus('Error', 'error');
    }
  }

  share() {
    const code = this.editor.getValue();
    const target = this.targetSelect.value;
    const encodedCode = btoa(code);
    const url = `${window.location.origin}?code=${encodedCode}&target=${target}`;
    
    // Copy to clipboard
    navigator.clipboard.writeText(url).then(() => {
      this.setStatus('Link copied to clipboard', 'success');
    });
  }

  clear() {
    this.editor.setValue(this.getDefaultCode());
    this.output.textContent = '';
    this.setStatus('Cleared');
  }

  toggleTheme() {
    this.isDarkTheme = !this.isDarkTheme;
    const theme = this.isDarkTheme ? 'vs-dark' : 'vs';
    document.body.classList.toggle('light-theme');
    monaco.editor.setTheme(theme);
    this.themeBtn.textContent = this.isDarkTheme ? 'Dark Mode' : 'Light Mode';
  }

  setStatus(message, type = 'info') {
    this.status.textContent = message;
    this.status.style.color = {
      success: '#4ec9b0',
      error: '#f48771',
      info: '#4ec9b0'
    }[type] || '#4ec9b0';
  }

  updateStats(input, output) {
    const inputLines = input.split('\n').length;
    const outputLines = output.split('\n').length;
    this.stats.textContent = `${inputLines} lines → ${outputLines} lines`;
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new SwibePlayground();
});
