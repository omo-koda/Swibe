/**
 * Lisp Backend
 */

export function genLisp(node) {
  if (!node) return '';

  switch (node.type) {
    case 'Program':
      return node.statements.map(s => genLisp(s)).join('\n');

    case 'FunctionDecl':
      const params = node.params.map(p => p.name).join(' ');
      return `(defun ${node.name} (${params})\n  ${genLisp(node.body)}\n)`;

    case 'VariableDecl':
      return `(setq ${node.name} ${genLisp(node.value)})`;

    case 'Block':
      return `(progn\n  ${node.statements.map(s => genLisp(s)).join('\n  ')}\n)`;

    case 'FunctionCall':
      return `(${node.name} ${node.args.map(a => genLisp(a)).join(' ')})`;

    case 'Number':
      return String(node.value);

    case 'String':
      return `"${node.value.replace(/\n/g, '\\n').replace(/"/g, '\\"')}"`;

    case 'Boolean':
      return node.value ? 't' : 'nil';

    case 'Identifier':
      return node.name;

    case 'ArrayLiteral':
      return `'(${node.elements.map(e => genLisp(e)).join(' ')})`;

    case 'BinaryOp':
      return `(${node.op} ${genLisp(node.left)} ${genLisp(node.right)})`;

    default:
      return '';
  }
}
