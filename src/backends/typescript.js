/**
 * TypeScript Backend for Swibe Compiler
 */

export function genTypeScript(node) {
  if (!node) return '';
  switch (node.type) {
    case 'Program': {
      const code = node.statements.map(s => {
        const code = genTypeScript(s);
        return code.endsWith(';') || code.endsWith('}') ? code : code + ';';
      }).join('\n\n');
      return code + '\n\nmain();';
    }
    case 'FunctionDecl': {
      const params = node.params.map(p => {
        const typeStr = p.type ? p.type : 'any';
        return p.name + ': ' + typeStr;
      }).join(', ');
      const returnType = node.returnType ? node.returnType : 'any';
      return `function ${node.name}(${params}): ${returnType} ${genTypeScript(node.body)}`;
    }
    case 'Block': {
      const stmts = node.statements.map(s => {
        const code = genTypeScript(s);
        return '  ' + code + (code.endsWith(';') || code.endsWith('}') ? '' : ';');
      });
      if (stmts.length > 0) {
        const last = node.statements[node.statements.length - 1];
        if (['BinaryOp', 'FunctionCall', 'Number', 'String', 'Identifier', 'ArrayLiteral'].includes(last.type)) {
          // Don't return print statements
          if (!(last.type === 'FunctionCall' && last.name === 'print')) {
            stmts[stmts.length - 1] = '  return ' + genTypeScript(last) + ';';
          }
        }
      }
      return '{\n' + stmts.join('\n') + '\n}';
    }
    case 'VariableDecl':
      return `const ${node.name} = ${genTypeScript(node.value)};`;
    case 'Return':
      return `return ${genTypeScript(node.value)};`;
    case 'FunctionCall': {
      const args = node.args.map(a => genTypeScript(a)).join(', ');
      if (node.name === 'print') {
        return `console.log(${args})`;
      } else {
        return `${node.name}(${args})`;
      }
    }
    case 'BinaryOp':
      return `(${genTypeScript(node.left)} ${node.op} ${genTypeScript(node.right)})`;
    case 'ThinkStatement': {
      const prompt = genTypeScript(node.prompt);
      const model = node.config?.model ? (typeof node.config.model === 'string' ? node.config.model : genTypeScript(node.config.model)) : 'ollama:llama3';
      const maxTokens = node.config?.max_tokens ? (typeof node.config.max_tokens === 'number' ? node.config.max_tokens : genTypeScript(node.config.max_tokens)) : 512;
      return `await std.think(${prompt}, { model: "${model}", max_tokens: ${maxTokens} })`;
    }
    case 'Number': return String(node.value);
    case 'String': return `"${node.value.replace(/"/g, '\\"').replace(/\n/g, '\\n')}"`;
    case 'Identifier': return node.name;
    case 'Boolean': return String(node.value);
    case 'Nil': return 'null';
    default: return `/* Unhandled: ${node.type} */`;
  }
}