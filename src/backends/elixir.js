/**
 * Elixir Backend for Swibe (Simplified)
 */

export function genElixir(node, indent = "") {
  if (!node) return '';

  switch (node.type) {
    case 'Program': {
      let code = '';
      code += node.statements.filter(s => s.type === 'FunctionDecl').map(s => genElixir(s, "")).join('\n\n');
      code += node.statements.filter(s => s.type === 'SwarmStatement').map(s => genElixir(s, "")).join('\n\n');
      code += '\n\n# Run main\ncase Function.info(:main, 0) do\n';
      code += '  [_ | _] -> main()\n';
      code += '  nil -> :ok\nend\n';
      return code;
    }
    case 'FunctionDecl': {
      const params = node.params.map(p => p.name).join(', ');
      return `def ${node.name}(${params}) do\n` +
        genElixir(node.body, indent + "  ") +
        `\nend`;
    }
    case 'Block':
      return node.statements.map((s, i) => {
        const code = genElixir(s, indent);
        if (i === node.statements.length - 1 && 
            (s.type === 'BinaryOp' || s.type === 'FunctionCall' || s.type === 'Identifier' || s.type === 'Number') &&
            !(s.type === 'FunctionCall' && s.name === 'print')) {
          return code;
        }
        return code;
      }).join('\n');
    case 'VariableDecl':
      return `${indent}${node.name} = ${genElixir(node.value, "")}`;
    case 'Return':
      return `${indent}${genElixir(node.value, "")}`;
    case 'FunctionCall': {
      if (node.name === 'print') {
        return `${indent}IO.puts(${node.args.map(a => genElixir(a, "")).join(', ')})`;
      }
      return `${indent}${node.name}(${node.args.map(a => genElixir(a, "")).join(', ')})`;
    }
    case 'BinaryOp':
      return `(${genElixir(node.left, "")} ${node.op} ${genElixir(node.right, "")})`;
    case 'Number':
      return String(node.value);
    case 'String':
      return `"${node.value.replace(/\n/g, '\\n').replace(/"/g, '\\"')}"`;
    case 'Boolean':
      return node.value ? 'true' : 'false';
    case 'Nil':
      return 'nil';
    case 'Identifier':
      return node.name;
    case 'ArrayLiteral':
      return `[${node.elements.map(e => genElixir(e, "")).join(', ')}]`;
    case 'SwarmStatement': {
      // Handle swarm agents for Elixir
      let code = '';
      if (node.steps && node.steps.length > 0) {
        node.steps.forEach(step => {
          code += `${indent}# Agent: ${step.name}\n`;
          code += `${indent}name: "${step.name}"\n`;
        });
      }
      return code;
    }
    default:
      return '';
  }
}

export function genMixExs() {
  return `defmodule SwibeAgent.MixProject do
  use Mix.Project

  def project do
    [
      app: :swibe_agent,
      version: "0.1.0",
      elixir: "~> 1.14",
      start_permanent: Mix.env() == :prod,
      deps: deps()
    ]
  end

  def application do
    [
      extra_applications: [:logger]
    ]
  end

  defp deps do
    []
  end
end
`;
}
