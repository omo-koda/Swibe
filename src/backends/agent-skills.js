/**
 * Agent Skills Backend
 */

import { Compiler } from "../compiler.js";
const compiler = new Compiler("", "javascript");
function genJavaScript(node) { return compiler.genJavaScript(node); }

export function genAgentSkills(node) {
  if (node.type === 'SkillDecl') {
    const instructions = node.body
      .filter(item => item.type === 'SkillProperty' && item.name === 'prompt')
      .map(item => genJavaScript(item.value))[0] || "";
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
  
  if (node.type === 'SwarmStatement') {
    return JSON.stringify({
      version: "2026.1",
      type: "swarm",
      agents: node.steps.map(s => s.name),
      pipeline: node.steps.map(s => s.name).join(" => "),
      memory: "rag.last_iteration"
    }, null, 2);
  }

  if (node.type === 'LoopUntil') {
    return JSON.stringify({
      version: "2026.1",
      type: "loop",
      until: genJavaScript(node.goal),
      trace: true
    }, null, 2);
  }

  if (node.type === 'Program') {
    return node.statements.map(s => genAgentSkills(s)).filter(s => s !== "").join('\n---\n');
  }

  return '';
}
