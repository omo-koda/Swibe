/**
 * Go Backend for Swibe
 * Target: Goroutine Workers & Channels
 */

export function genGo(node, indent = "") {
  if (!node) return '';

  switch (node.type) {
    case 'Program': {
      let code = `package main\n\n`;
      code += `import (\n  "fmt"\n)\n\n`;
      
      const functionDecls = node.statements.filter(s => s.type === 'FunctionDecl' || s.type === 'SkillDecl');
      code += functionDecls.map(s => genGo(s, "")).join('\n\n');

      const hasMain = node.statements.some(s => s.type === 'FunctionDecl' && s.name === 'main');
      if (!hasMain) {
        code += `\nfunc main() {\n`;
        code += `    fmt.Println("Swibe")\n`;
        code += node.statements.filter(s => s.type !== 'FunctionDecl' && s.type !== 'SkillDecl').map(s => genGo(s, "    ")).join('\n');
        code += `}\n`;
      }
      return code;

    }
    case 'FunctionDecl': {
      const params = node.params.map(p => `${p.name} int`).join(', ');
      let retType = '';
      // Go main() has no return type
      if (node.name !== 'main') {
        retType = node.returnType ? ` ${node.returnType}` : ' int';
      }
      return `${indent}func ${node.name}(${params})${retType} {\n` +
        genGo(node.body, indent + "    ") +
        `\n${indent}}`;

    }
    case 'Block':
      return node.statements.map((s, i) => {
        const g = genGo(s, indent);
        if (i === node.statements.length - 1) {
          // For the last statement, if it's an expression (not print), add return
          if ((s.type === 'BinaryOp' || s.type === 'FunctionCall' || s.type === 'Identifier' || s.type === 'Number') && !(s.type === 'FunctionCall' && s.name === 'print')) {
            return `${indent}return ${g}`;
          }
        }
        return g;
      }).join('\n');

    case 'VariableDecl':
      return `${indent}${node.name} := ${genGo(node.value, "")}`;

    case 'Return':
      return `${indent}return ${genGo(node.value, "")}`;

    case 'FunctionCall': {
      const fName = node.name;
      if (fName === 'print') return `${indent}fmt.Println(${node.args.map(a => genGo(a, "")).join(', ')})`;
      if (fName === 'think') return `${indent}Think(${node.args.map(a => genGo(a, "")).join(', ')})`;
      if (fName === 'println') return `${indent}fmt.Println(${node.args.map(a => genGo(a, "")).join(', ')})`;
      return `${indent}${fName}(${node.args.map(a => genGo(a, "")).join(', ')})`;

    }
    case 'MethodCall': {
      const obj = genGo(node.object);
      if (obj === 'crypto' && node.method === 'randomBytes') {
          return `${indent}crypto_struct.RandomBytes(${node.args.map(a => genGo(a, "")).join(', ')})`;
      }
      if (obj === 'json' || obj === 'rag') {
          return `${indent}${obj}.${node.method.charAt(0).toUpperCase() + node.method.slice(1)}(${node.args.map(a => genGo(a, "")).join(', ')})`;
      }
      if (obj === 'SovereignRitual' && node.method === 'actions') {
          return `${indent}SovereignRitual{}.Actions()`;
      }
      return `${indent}${obj}.${node.method.charAt(0).toUpperCase() + node.method.slice(1)}(${node.args.map(a => genGo(a, "")).join(', ')})`;

    }
    case 'SkillDecl': {
      let skillGo = `${indent}type ${node.name} struct {}\n`;
      skillGo += `${indent}func (s ${node.name}) Actions() {\n`;
      skillGo += node.body.map(s => genGo(s, indent + "    ")).join('\n');
      skillGo += `\n${indent}}`;
      return skillGo;

    }
    case 'SecureBlock':
      return `${indent}go func() {\n${indent}    ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)\n${indent}    defer cancel()\n${indent}    _ = ctx\n` +
        genGo(node.body, indent + "    ") +
        `\n${indent}}()`;

    case 'MetaDigital':
      return `${indent}fmt.Println("[GO] Running Meta-Digital: ${node.name}")`;

    case 'FieldAccess':
      return `${genGo(node.object)}.${node.field.charAt(0).toUpperCase() + node.field.slice(1)}`;

    case 'DictLiteral':
      // Very basic map literal for Go
      return `map[string]interface{}{${Object.entries(node.fields).map(([k, v]) => `"${k}": ${genGo(v, "")}`).join(', ')}}`;

    case 'If': {
      let ifGo = `${indent}if ${genGo(node.condition)} {\n${genGo(node.thenBranch, indent + "    ")}\n${indent}}`;
      if (node.elseBranch) {
        ifGo += ` else {\n${genGo(node.elseBranch, indent + "    ")}\n${indent}}`;
      }
      return ifGo;

    }
    case 'BinaryOp':
      return `(${genGo(node.left, "")} ${node.op} ${genGo(node.right, "")})`;

    case 'SwarmStatement': {
      let swarmCode = `${indent}// Swarm Initiation: Goroutines\n`;
      node.steps.forEach(step => {
        swarmCode += `${indent}wg.Add(1)\n`;
        swarmCode += `${indent}go func() {\n`;
        swarmCode += `${indent}    defer wg.Done()\n`;
        swarmCode += `${indent}    fmt.Println("[GO] Birthing Agent ${step.name}...")\n`;
        swarmCode += `${indent}}()\n`;
      });
      return swarmCode;

    }
    case 'Boolean':
      return node.value ? 'true' : 'false';

    case 'Nil':
      return 'nil';

    case 'Number':
      return String(node.value);

    case 'String':
      return `"${node.value.replace(/\n/g, "\\n")}"`;

    case 'Identifier':
      return node.name;

    case 'ThinkStatement': {
      const prompt = genGo(node.prompt, "");
      return `${indent}fmt.Printf("Thinking: %s\\n", ${prompt})`;
    }

    default:
      return `${indent}// [GO-GEN] Unhandled: ${node.type}`;
  }
}
