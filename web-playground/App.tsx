/**
 * Swibe Web Playground - Main App Component
 * Real-time compilation, syntax highlighting, multiple targets
 */

import React, { useState, useCallback } from 'react';
import Editor from '@monaco-editor/react';
import './App.css';

interface PlaygroundState {
  code: string;
  target: 'javascript' | 'python' | 'rust';
  output: string;
  error: string;
  isCompiling: boolean;
}

export default function App() {
  const [state, setState] = React.useState<PlaygroundState>({
    code: `-- Swibe v0.4.0 Sovereign Birth Ritual\nmeta-digital "Genesis" {\n  chain: [birth];\n  ethics: "harm-none";\n  output: "Alive"\n}\n\nfn speak() {\n  %% [voice: "I am here"]\n}`,
    target: 'javascript',
    output: '',
    error: '',
    isCompiling: false,
  });

  const handleCompile = useCallback(async () => {
    setState(prev => ({ ...prev, isCompiling: true, error: '' }));

    try {
      const response = await fetch('/api/compile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: state.code,
          target: state.target,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setState(prev => ({ 
          ...prev, 
          output: data.output,
          isCompiling: false 
        }));
      } else {
        setState(prev => ({ 
          ...prev, 
          error: data.error,
          isCompiling: false 
        }));
      }
    } catch (err) {
      setState(prev => ({ 
        ...prev, 
        error: String(err),
        isCompiling: false 
      }));
    }
  }, [state.code, state.target]);

  const handleShare = useCallback(async () => {
    const shareUrl = `${window.location.origin}?code=${btoa(state.code)}&target=${state.target}`;
    await navigator.clipboard.writeText(shareUrl);
    alert('Share link copied!');
  }, [state.code, state.target]);

  const handleExport = useCallback(() => {
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(state.output));
    element.setAttribute('download', `output.${state.target === 'python' ? 'py' : state.target === 'rust' ? 'rs' : 'js'}`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  }, [state.output, state.target]);

  return (
    <div className="playground">
      <header className="playground-header">
        <div className="logo">
          <h1>🎵 Swibe Playground</h1>
          <p>AI-Native Programming Language IDE</p>
        </div>
        <div className="controls">
          <select 
            value={state.target}
            onChange={(e) => setState(prev => ({ ...prev, target: e.target.value as any }))}
            className="target-selector"
          >
            <option value="javascript">JavaScript</option>
            <option value="python">Python</option>
            <option value="rust">Rust</option>
            <option value="go">Go</option>
            <option value="move">Sui Move</option>
            <option value="elixir">Elixir</option>
            <option value="pony">Pony</option>
            <option value="mojo">Mojo</option>
            <option value="aether">Aether</option>
            <option value="lua">Lua</option>
            <option value="zig">Zig</option>
            <option value="julia">Julia</option>
          </select>
          <button onClick={handleCompile} disabled={state.isCompiling} className="btn-primary">
            {state.isCompiling ? 'Compiling...' : 'Compile'}
          </button>
          <button onClick={handleShare} className="btn-secondary">Share</button>
          <button onClick={handleExport} disabled={!state.output} className="btn-secondary">Export</button>
        </div>
      </header>

      <div className="playground-container">
        <div className="editor-section">
          <h2>Swibe Code</h2>
          <Editor
            height="100%"
            language="swibe"
            theme="vs-dark"
            value={state.code}
            onChange={(value) => setState(prev => ({ ...prev, code: value || '' }))}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              wordWrap: 'on',
              formatOnPaste: true,
              automaticLayout: true,
            }}
          />
        </div>

        <div className="output-section">
          {state.error ? (
            <div className="error-panel">
              <h2>❌ Error</h2>
              <pre>{state.error}</pre>
            </div>
          ) : (
            <div className="output-panel">
              <h2>Compiled {state.target.toUpperCase()}</h2>
              <pre>{state.output || '(Compile to see output)'}</pre>
            </div>
          )}
        </div>
      </div>

      <footer className="playground-footer">
        <p>Swibe v0.5.0 | 25 Targets including Lua, Zig, Julia, Elixir, Pony</p>
      </footer>
    </div>
  );
}
