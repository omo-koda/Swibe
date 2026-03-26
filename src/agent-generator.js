/**
 * Automatic Agent Generation
 * Generates AI agents from #[agent] macros
 */

class AgentGenerator {
  constructor() {
    this.agents = [];
  }

  /**
   * Extract agent definitions
   */
  extract(code) {
    const agentRegex = /#\[agent\(([^)]*)\)\]\s*fn\s+(\w+)\s*\([^)]*\)\s*{/gs;
    let match;

    while ((match = agentRegex.exec(code)) !== null) {
      const config = this.parseConfig(match[1]);
      const name = match[2];

      this.agents.push({
        name,
        tools: config.tools ? config.tools.split(',').map(s => s.trim()) : [],
        model: config.model || 'claude',
        temperature: parseFloat(config.temperature || '0.7')
      });
    }

    return this.agents;
  }

  /**
   * Parse agent configuration
   */
  parseConfig(configStr) {
    const config = {};
    let current = '';
    let inQuotes = false;
    const parts = [];
    
    for (let i = 0; i < configStr.length; i++) {
      const char = configStr[i];
      if (char === '"') inQuotes = !inQuotes;
      if (char === ',' && !inQuotes) {
        parts.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    parts.push(current);

    for (const part of parts) {
      const eqIndex = part.indexOf('=');
      if (eqIndex !== -1) {
        const key = part.substring(0, eqIndex).trim();
        const value = part.substring(eqIndex + 1).trim();
        config[key] = value.replace(/^"(.*)"$/, '$1').replace(/[[\]]/g, '');
      }
    }

    return config;
  }

  /**
   * Generate agent class
   */
  generateAgentClass(agent) {
    return `class ${this.capitalize(agent.name)}Agent {
  constructor(tools = []) {
    this.name = '${agent.name}';
    this.tools = tools;
    this.model = '${agent.model}';
    this.temperature = ${agent.temperature};
    this.memory = [];
    this.maxIterations = 10;
  }

  /**
   * Reason and act loop
   */
  async run(input) {
    this.memory.push({ role: 'user', content: input });

    for (let i = 0; i < this.maxIterations; i++) {
      // Get LLM response
      const response = await this.callLLM();

      if (response.action === 'finish') {
        return response.result;
      }

      // Execute tool
      const toolResult = await this.executeTool(response.tool, response.args);
      this.memory.push({ role: 'assistant', content: toolResult });
    }

    throw new Error('Max iterations reached');
  }

  /**
   * Call LLM to decide next action
   */
  async callLLM() {
    const systemPrompt = \`You are an agent called ${agent.name}.
You have access to these tools: ${agent.tools.join(', ')}.
When you want to finish, respond with {"action": "finish", "result": your_answer}.
When you want to use a tool, respond with {"action": "call", "tool": tool_name, "args": {...}}.
\`;

    // TODO: Call actual LLM
    return { action: 'finish', result: 'Processing complete' };
  }

  /**
   * Execute tool
   */
  async executeTool(toolName, args) {
    const tool = this.tools.find(t => t.name === toolName);
    if (!tool) throw new Error(\`Unknown tool: \${toolName}\`);
    return await tool.execute(args);
  }

  /**
   * Add tool to agent
   */
  addTool(tool) {
    this.tools.push(tool);
  }
}

module.exports = ${this.capitalize(agent.name)}Agent;
`;
  }

  /**
   * Generate agent factory
   */
  generateAgentFactory() {
    let code = `const agents = {};

`;

    for (const agent of this.agents) {
      code += `// Register ${agent.name} agent\n`;
      code += `agents['${agent.name}'] = {
  tools: ${JSON.stringify(agent.tools)},
  model: '${agent.model}',
  temperature: ${agent.temperature}
};

`;
    }

    code += `/**
 * Create agent instance
 */
function createAgent(name, tools = []) {
  const config = agents[name];
  if (!config) throw new Error(\`Unknown agent: \${name}\`);
  
  return {
    name,
    tools: tools.concat(config.tools),
    model: config.model,
    temperature: config.temperature,
    
    async run(input) {
      // Execute agent reasoning loop
      return await this.reason(input);
    },
    
    async reason(input) {
      // TODO: implement reasoning loop
      return { success: true, result: 'Processed' };
    }
  };
}

module.exports = { agents, createAgent };
`;

    return code;
  }

  /**
   * Capitalize string
   */
  capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}

export { AgentGenerator };
