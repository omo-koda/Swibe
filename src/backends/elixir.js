/**
 * Elixir Backend for Swibe (v0.7)
 * Target: OTP Supervisors, GenServers & Fault-Tolerant Swarms
 */

export function genElixir(node, indent = "") {
  if (!node) return '';

  switch (node.type) {
    case 'Program':
      let code = `defmodule SwibeAgent.Application do\n`;
      code += `  use Application\n\n`;
      code += `  def start(_type, _args) {\n`;
      code += `    children = [\n`;
      code += `      {DynamicSupervisor, strategy: :one_for_one, name: Swibe.AgentSupervisor},\n`;
      code += `      {Task.Supervisor, name: Swibe.TaskSupervisor}\n`;
      code += `    ]\n`;
      code += `    opts = [strategy: :one_for_one, name: Swibe.Supervisor]\n`;
      code += `    Supervisor.start_link(children, opts)\n`;
      code += `  }\n`;
      code += `end\n\n`;

      code += `defmodule SwibeAgent.Worker do\n`;
      code += `  use GenServer, restart: :transient\n\n`;
      code += `  def start_link(args) {\n`;
      code += `    GenServer.start_link(__MODULE__, args)\n`;
      code += `  }\n\n`;
      code += `  def init(state) {\n`;
      code += `    send(self(), :perform_ritual)\n`;
      code += `    {:ok, state}\n`;
      code += `  }\n\n`;
      code += `  def handle_info(:perform_ritual, state) {\n`;
      code += `    IO.puts("[ELIXIR] Agent #{state.name} starting ritual...")\n`;
      code += `    # Ritual logic would go here\n`;
      code += `    {:stop, :normal, state}\n`;
      code += `  }\n`;
      code += `end\n\n`;
      
      code += `defmodule Swibe.AI do\n`;
      code += `  def think(prompt) {\n`;
      code += `    IO.puts("[ELIXIR-THINK] Sending to Ollama...")\n`;
      code += `    # 30s Timeout Enforced here\n`;
      code += `    case HTTPoison.post("http://localhost:11434/api/generate", Jason.encode!(%{model: "mistral", prompt: prompt}), [], [timeout: 30000, recv_timeout: 30000]) do\n`;
      code += `      {:ok, %{status_code: 200, body: body}} -> \n`;
      code += `        receipt = :crypto.hash(:sha256, body) |> Base.encode16()\n`;
      code += `        IO.puts("[ELIXIR-RECEIPT] #{receipt}")\n`;
      code += `        body\n`;
      code += `      {:error, reason} -> \n`;
      code += `        IO.puts("[ELIXIR-ERROR] Ollama timeout or failure: #{inspect(reason)}")\n`;
      code += `        "error"\n`;
      code += `    end\n`;
      code += `  }\n`;
      code += `end\n\n`;

      code += `# SWIBE_PLUGIN_HOOK\n\n`;
      
      code += `defmodule SwibeAgent.Ritual do\n`;
      code += `  def run do\n`;
      code += `    IO.puts "Swibe Sovereign Birth Ritual (Elixir/OTP Backend)"\n`;
      code += node.statements.filter(s => s.type !== 'FunctionDecl' && s.type !== 'SkillDecl').map(s => genElixir(s, "    ")).join('\n');
      code += `\n  end\n`;
      code += `end\n\n`;
      
      code += node.statements.filter(s => s.type === 'FunctionDecl' || s.type === 'SkillDecl').map(s => genElixir(s, "")).join('\n\n');
      
      code += `\n# Start Ritual\nSwibeAgent.Ritual.run()\n`;
      return code;

    case 'FunctionDecl':
      const params = node.params.map(p => p.name).join(', ');
      return `${indent}def ${node.name}(${params}) do\n` +
        genElixir(node.body, indent + "  ") +
        `\n${indent}end`;

    case 'Block':
      return node.statements.map(s => genElixir(s, indent)).join('\n');

    case 'VariableDecl':
      return `${indent}${node.name} = ${genElixir(node.value, "")}`;

    case 'Return':
      return `${indent}${genElixir(node.value, "")}`;

    case 'FunctionCall':
      let fName = node.name;
      if (fName === 'println') fName = 'IO.puts';
      if (fName === 'think') {
          return `${indent}Swibe.AI.think(${node.args.map(a => genElixir(a, "")).join(', ')})`;
      }
      return `${indent}${fName}(${node.args.map(a => genElixir(a, "")).join(', ')})`;

    case 'MethodCall':
      const obj = genElixir(node.object);
      if (node.method === 'send') {
          return `${indent}send(${obj}, ${genElixir(node.args[0])})`;
      }
      if (node.method === 'receive') {
          return `${indent}receive do msg -> msg end`;
      }
      return `${indent}${obj}.${node.method}(${node.args.map(a => genElixir(a, "")).join(', ')})`;

    case 'SkillDecl':
      let skillEx = `${indent}defmodule ${node.name} do\n`;
      skillEx += `${indent}  def actions do\n`;
      skillEx += genElixir(new ASTNode('Block', { statements: node.body }), indent + "    ");
      skillEx += `\n${indent}  end\n`;
      skillEx += `${indent}end`;
      return skillEx;

    case 'SecureBlock':
      return `${indent}Task.Supervisor.async(Swibe.TaskSupervisor, fn -> \n` +
        genElixir(node.body, indent + "  ") +
        `\n${indent}end) |> Task.await(10000)`;

    case 'SwarmStatement':
      let swarmCode = `${indent}# Swarm Initiation: DynamicSupervisor (OTP)\n`;
      node.steps.forEach(step => {
        swarmCode += `${indent}DynamicSupervisor.start_child(Swibe.AgentSupervisor, {SwibeAgent.Worker, %{name: "${step.name}"}})\n`;
      });
      swarmCode += `${indent}IO.puts("[ELIXIR] Swarm supervise tree active with ${node.steps.length} agents.")`;
      return swarmCode;

    case 'MetaDigital':
      return `${indent}IO.puts "[ELIXIR] Running Meta-Digital: ${node.name}"`;

    case 'If':
      let ifEx = `${indent}if ${genElixir(node.condition)} do\n${genElixir(node.thenBranch, indent + "  ")}\n${indent}`;
      if (node.elseBranch) {
        ifEx += `else\n${genElixir(node.elseBranch, indent + "  ")}\n${indent}`;
      }
      ifEx += `end`;
      return ifEx;

    case 'BinaryOp':
      let op = node.op;
      if (op === '+') op = '<>';
      return `(${genElixir(node.left, "")} ${op} ${genElixir(node.right, "")})`;

    case 'DictLiteral':
      return `%{${Object.entries(node.fields).map(([k, v]) => `"${k}" => ${genElixir(v, "")}`).join(', ')}}`;

    case 'Number':
      return String(node.value);

    case 'String':
      return `"${node.value.replace(/\n/g, "\\n")}"`;

    case 'Boolean':
      return node.value ? 'true' : 'false';

    case 'Nil':
      return 'nil';

    case 'Identifier':
      return node.name;

    default:
      return `${indent}# [ELIXIR-GEN] Unhandled: ${node.type}`;
  }
}

export function genMixExs() {
  return `defmodule Swibe.MixProject do
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
      extra_applications: [:logger, :crypto],
      mod: {SwibeAgent.Application, []}
    ]
  end

  defp deps do
    [
      {:httpoison, "~> 2.0"},
      {:jason, "~> 1.4"}
    ]
  end
end
`;
}

class ASTNode {
  constructor(type, props = {}) {
    Object.assign(this, props);
    this.type = type;
  }
}
