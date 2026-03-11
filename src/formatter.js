/**
 * Code Formatter & Linter
 * Formats Vibe code to consistent style
 */

class Formatter {
  constructor(options = {}) {
    this.indent = options.indent || 2;
    this.lineWidth = options.lineWidth || 100;
    this.rules = {
      spaces: true,
      semicolons: false,
      trailingComma: true,
      singleQuote: true
    };
  }

  /**
   * Format code
   */
  format(code) {
    let formatted = code;
    
    // Remove trailing whitespace
    formatted = formatted.split('\n').map(l => l.trimRight()).join('\n');
    
    // Fix indentation
    formatted = this.fixIndentation(formatted);
    
    // Add spaces around operators
    formatted = this.fixSpacing(formatted);
    
    // Fix braces
    formatted = this.fixBraces(formatted);
    
    return formatted;
  }

  /**
   * Fix indentation
   */
  fixIndentation(code) {
    const lines = code.split('\n');
    let level = 0;
    const result = [];

    for (const line of lines) {
      const trimmed = line.trim();
      
      // Decrease indent for closing braces
      if (trimmed.startsWith('}')) level--;
      
      // Add indentation
      const indented = ' '.repeat(level * this.indent) + trimmed;
      result.push(indented);
      
      // Increase indent for opening braces
      if (trimmed.endsWith('{')) level++;
    }

    return result.filter(l => l.trim()).join('\n');
  }

  /**
   * Fix spacing around operators
   */
  fixSpacing(code) {
    return code
      .replace(/\s*([+\-*/%=<>!]+)\s*/g, ' $1 ')
      .replace(/\s*([,;:])\s*/g, '$1 ')
      .replace(/\s+\}/g, '\n}')
      .replace(/{\s+/g, ' {\n')
      .replace(/\s+/g, ' ');
  }

  /**
   * Fix brace positioning
   */
  fixBraces(code) {
    return code
      .replace(/\)\s*\{/g, ') {')
      .replace(/\}\s*else\s*\{/g, '} else {')
      .replace(/}\s*$/gm, '}\n');
  }

  /**
   * Lint code for issues
   */
  lint(code) {
    const issues = [];
    const lines = code.split('\n');

    lines.forEach((line, i) => {
      const lineNum = i + 1;

      // Check for trailing whitespace
      if (line !== line.trimRight()) {
        issues.push({
          line: lineNum,
          level: 'warning',
          message: 'Trailing whitespace'
        });
      }

      // Check for mixed indentation
      if (line.match(/\t/)) {
        issues.push({
          line: lineNum,
          level: 'warning',
          message: 'Found tabs, use spaces'
        });
      }

      // Check for multiple blank lines
      if (line === '' && lines[i - 1] === '') {
        issues.push({
          line: lineNum,
          level: 'info',
          message: 'Multiple blank lines'
        });
      }

      // Check line length
      if (line.length > this.lineWidth) {
        issues.push({
          line: lineNum,
          level: 'warning',
          message: `Line length ${line.length} > ${this.lineWidth}`
        });
      }

      // Check for missing function types
      if (line.match(/^\s*fn\s+\w+\s*\(/) && !line.match(/->/)) {
        issues.push({
          line: lineNum,
          level: 'warning',
          message: 'Function missing return type annotation'
        });
      }

      // Check for unused variables
      if (line.match(/let\s+_\w+\s*=/)) {
        issues.push({
          line: lineNum,
          level: 'info',
          message: 'Unused variable (prefixed with _)'
        });
      }
    });

    return issues;
  }

  /**
   * Auto-fix issues
   */
  autoFix(code) {
    let fixed = code;
    
    // Replace tabs with spaces
    fixed = fixed.replace(/\t/g, ' '.repeat(this.indent));
    
    // Remove trailing whitespace
    fixed = fixed.split('\n').map(l => l.trimRight()).join('\n');
    
    // Remove multiple blank lines
    fixed = fixed.replace(/\n\n\n+/g, '\n\n');
    
    // Format
    fixed = this.format(fixed);
    
    return fixed;
  }
}

export { Formatter };
