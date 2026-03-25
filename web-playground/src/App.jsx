import React, { useState, useEffect } from 'react';
import { Compiler } from '@swibe/compiler.js';
import { Terminal, Play, Code2, Sparkles, Shield, Cpu, Layers } from 'lucide-react';

const SAMPLE_CODE = `
fn main() {
  let phrase = bipon39_entropyToMnemonic(crypto.randomBytes(32), 256);
  println("Born: " + phrase);

  think "Who am I?" { 
    model: "ollama:llama3", 
    max_tokens: 100 
  };
  
  meta-digital "Guardian" {
    need: "Protect the realm",
    refuse_if: false,
    chain: [Scan, Defend]
  }
}
`.trim();

function App() {
  const [source, setSource] = useState(SAMPLE_CODE);
  const [output, setOutput] = useState('');
  const [target, setTarget] = useState('javascript');
  const [status, setStatus] = useState('ready'); // ready, compiling, success, error
  const [activeTab, setActiveTab] = useState('code'); // code, visual

  const compile = async () => {
    setStatus('compiling');
    try {
      const compiler = new Compiler(source, target);
      const result = await compiler.compile();
      setOutput(result);
      setStatus('success');
    } catch (err) {
      setOutput(`Error: ${err.message}`);
      setStatus('error');
    }
  };

  useEffect(() => {
    // Auto-compile on load
    compile();
  }, []);

  return (
    <div className="min-h-screen bg-stone-950 text-stone-200 font-mono flex flex-col">
      {/* Header / Ritual Space */}
      <header className="border-b border-stone-800 bg-stone-900/50 p-4 flex items-center justify-between backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-600 to-red-600 flex items-center justify-center shadow-lg shadow-amber-900/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-amber-500 to-red-400">
              Swibe v0.4.0
            </h1>
            <p className="text-xs text-stone-500 tracking-wider">SOVEREIGN AGENT FORGE</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-stone-900 border border-stone-800 rounded-lg p-1">
            <select 
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              className="bg-transparent border-none outline-none text-sm px-2 py-1 text-stone-300 cursor-pointer hover:text-amber-500 transition-colors"
            >
              <option value="javascript">JavaScript (Node)</option>
              <option value="python">Python</option>
              <option value="rust">Rust</option>
              <option value="go">Go</option>
              <option value="move">Sui Move</option>
            </select>
          </div>

          <button 
            onClick={compile}
            disabled={status === 'compiling'}
            className="flex items-center gap-2 px-4 py-2 bg-stone-100 text-stone-900 rounded-lg hover:bg-white transition-all font-bold shadow-[0_0_15px_rgba(255,255,255,0.1)] active:scale-95 disabled:opacity-50"
          >
            <Play className="w-4 h-4 fill-current" />
            {status === 'compiling' ? 'Forging...' : 'Forge'}
          </button>
        </div>
      </header>

      {/* Main Altar */}
      <main className="flex-1 flex overflow-hidden">
        {/* Editor */}
        <div className="flex-1 flex flex-col border-r border-stone-800 bg-stone-950/80">
          <div className="p-2 border-b border-stone-800 flex justify-between items-center text-xs text-stone-500 uppercase tracking-widest bg-stone-900/30">
            <span className="flex items-center gap-2"><Code2 className="w-3 h-3" /> Incantation</span>
            <span>{source.split('\n').length} lines</span>
          </div>
          <textarea
            value={source}
            onChange={(e) => setSource(e.target.value)}
            className="flex-1 bg-transparent p-4 outline-none resize-none font-mono text-sm leading-relaxed text-stone-300 selection:bg-amber-900/50"
            spellCheck="false"
          />
        </div>

        {/* Output / Vision */}
        <div className="flex-1 flex flex-col bg-black/40">
           <div className="p-2 border-b border-stone-800 flex justify-between items-center text-xs text-stone-500 uppercase tracking-widest bg-stone-900/30">
            <span className="flex items-center gap-2">
              {status === 'error' ? <Shield className="w-3 h-3 text-red-500" /> : <Terminal className="w-3 h-3" />}
              Manifestation
            </span>
            <span className={status === 'success' ? 'text-green-500' : status === 'error' ? 'text-red-500' : ''}>
              {status.toUpperCase()}
            </span>
          </div>
          <div className="flex-1 p-4 overflow-auto">
            <pre className={`font-mono text-sm ${status === 'error' ? 'text-red-400' : 'text-emerald-400/90'}`}>
              {output || '// Awaiting ritual...'}
            </pre>
          </div>
          
          {/* Status Bar */}
          <div className="h-8 border-t border-stone-800 bg-stone-900 flex items-center px-4 gap-6 text-xs text-stone-500">
             <div className="flex items-center gap-2">
               <Shield className="w-3 h-3" />
               <span>Vault: Secured (AES-256)</span>
             </div>
             <div className="flex items-center gap-2">
               <Cpu className="w-3 h-3" />
               <span>Neurons: 86B</span>
             </div>
             <div className="flex items-center gap-2">
               <Layers className="w-3 h-3" />
               <span>Sui Net: Testnet</span>
             </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default App
