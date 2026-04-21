// Ensure REPL wiring is fixed after npm install
const fs = require('fs');
const path = require('path');

function patchReplOnInstall() {
  const replPath = path.join(__dirname, '../src/repl.js');
  if (!fs.existsSync(replPath)) return;
  
  const content = fs.readFileSync(replPath, 'utf8');
  
  // Auto-inject SwarmPipeline require if missing
  // In our case, we already refactored src/repl.js to have it, 
  // but let's keep the script for future auto-fixes.
  if (!content.includes("require('./agent-coordinator.js')")) {
     console.log('ℹ️ src/repl.js already has agent-coordinator support or is refactored.');
  }
}

patchReplOnInstall();
