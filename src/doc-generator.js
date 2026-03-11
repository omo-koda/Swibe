/**
 * Documentation Generator
 * Auto-generates API docs from docstrings
 */

class DocGenerator {
  constructor() {
    this.docs = [];
  }

  /**
   * Alias for extract to match tests
   */
  generate(code) {
    return this.extract(code);
  }

  /**
   * Extract documentation from code
   */
  extract(code) {
    const lines = code.split('\n');
    let currentDoc = null;
    const docs = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Docstring comment
      if (line.trim().startsWith('//')) {
        if (!currentDoc) currentDoc = [];
        currentDoc.push(line.trim().replace(/^\/\/\s*/, ''));
      }

      // Function definition
      const fnMatch = line.match(/^\s*fn\s+(\w+)\s*\(([^)]*)\)\s*->\s*(\w+)/);
      if (fnMatch) {
        docs.push({
          type: 'function',
          name: fnMatch[1],
          params: fnMatch[2],
          returns: fnMatch[3],
          description: currentDoc ? currentDoc.join(' ') : '',
          lineNumber: i + 1
        });
        currentDoc = null;
      }

      // Struct definition
      const structMatch = line.match(/^\s*struct\s+(\w+)\s*{/);
      if (structMatch) {
        docs.push({
          type: 'struct',
          name: structMatch[1],
          description: currentDoc ? currentDoc.join(' ') : '',
          lineNumber: i + 1
        });
        currentDoc = null;
      }

      // Enum definition
      const enumMatch = line.match(/^\s*enum\s+(\w+)\s*{/);
      if (enumMatch) {
        docs.push({
          type: 'enum',
          name: enumMatch[1],
          description: currentDoc ? currentDoc.join(' ') : '',
          lineNumber: i + 1
        });
        currentDoc = null;
      }
    }

    this.docs = docs;
    return docs;
  }

  /**
   * Generate HTML documentation
   */
  generateHTML(title = 'API Documentation') {
    const functions = this.docs.filter(d => d.type === 'function');
    const structs = this.docs.filter(d => d.type === 'struct');
    const enums = this.docs.filter(d => d.type === 'enum');

    let html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 1000px; margin: 0 auto; padding: 20px; background: #f5f5f5; }
    h1 { color: #333; border-bottom: 3px solid #667eea; padding-bottom: 10px; }
    h2 { color: #555; margin-top: 30px; }
    h3 { color: #667eea; }
    .item { background: white; padding: 15px; margin: 10px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .description { color: #666; margin: 10px 0; }
    .params { background: #f9f9f9; padding: 10px; border-left: 3px solid #667eea; margin: 10px 0; }
    code { background: #f0f0f0; padding: 2px 6px; border-radius: 3px; font-family: monospace; }
    .type { color: #4ec9b0; font-weight: bold; }
  </style>
</head>
<body>
  <h1>${title}</h1>`;

    if (functions.length > 0) {
      html += '<h2>Functions</h2>';
      functions.forEach(fn => {
        html += `
  <div class="item">
    <h3><code>${fn.name}(${fn.params}) -> <span class="type">${fn.returns}</span></code></h3>
    <p class="description">${fn.description || 'No description'}</p>
  </div>`;
      });
    }

    if (structs.length > 0) {
      html += '<h2>Structs</h2>';
      structs.forEach(st => {
        html += `
  <div class="item">
    <h3><code>struct ${st.name}</code></h3>
    <p class="description">${st.description || 'No description'}</p>
  </div>`;
      });
    }

    if (enums.length > 0) {
      html += '<h2>Enums</h2>';
      enums.forEach(en => {
        html += `
  <div class="item">
    <h3><code>enum ${en.name}</code></h3>
    <p class="description">${en.description || 'No description'}</p>
  </div>`;
      });
    }

    html += '</body></html>';
    return html;
  }

  /**
   * Generate Markdown documentation
   */
  generateMarkdown(title = 'API Documentation') {
    const functions = this.docs.filter(d => d.type === 'function');
    const structs = this.docs.filter(d => d.type === 'struct');
    const enums = this.docs.filter(d => d.type === 'enum');

    let md = `# ${title}\n\n`;

    if (functions.length > 0) {
      md += '## Functions\n\n';
      functions.forEach(fn => {
        md += `### \`${fn.name}(${fn.params}) -> ${fn.returns}\`\n\n`;
        md += `${fn.description || 'No description'}\n\n`;
      });
    }

    if (structs.length > 0) {
      md += '## Structs\n\n';
      structs.forEach(st => {
        md += `### \`struct ${st.name}\`\n\n`;
        md += `${st.description || 'No description'}\n\n`;
      });
    }

    if (enums.length > 0) {
      md += '## Enums\n\n';
      enums.forEach(en => {
        md += `### \`enum ${en.name}\`\n\n`;
        md += `${en.description || 'No description'}\n\n`;
      });
    }

    return md;
  }

  /**
   * Generate JSON API reference
   */
  generateJSON() {
    return {
      title: 'API Reference',
      generated: new Date().toISOString(),
      items: this.docs
    };
  }
}

export { DocGenerator };
