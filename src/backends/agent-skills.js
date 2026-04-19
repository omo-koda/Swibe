/**
 * Agent Skills Backend for Swibe
 * Generates JSON skill definitions for agentic ecosystems.
 */

export function genAgentSkills(node, genJS) {
  if (!node) return '';

  switch (node.type) {
    case 'SkillDecl': {
      const instructions = node.body
        .filter(item => item.type === 'SkillProperty' && item.name === 'prompt')
        .map(item => genJS(item.value))[0] || "";
      const tools = node.body
        .filter(item => item.type === 'SkillProperty' && item.name === 'tools')
        .flatMap(item => item.value.elements ? item.value.elements.map(e => e.value) : []) || [];
        
      return JSON.stringify({
        version: "2026.1",
        name: node.name,
        type: "skill",
        instructions,
        tools,
        resources: []
      }, null, 2);
    }
    
    case 'SwarmStatement': {
      return JSON.stringify({
        version: "2026.1",
        type: "swarm",
        agents: node.steps.map(s => s.name),
        pipeline: node.steps.map(s => s.name).join(" => "),
        memory: "rag.last_iteration"
      }, null, 2);
    }

    case 'LoopUntil': {
      return JSON.stringify({
        version: "2026.1",
        type: "loop",
        until: genJS(node.goal),
        trace: true
      }, null, 2);
    }

    case 'Program':
      return node.statements.map(s => genAgentSkills(s, genJS)).filter(s => s !== "").join('\n---\n');

    default:
      return '';
  }
}
