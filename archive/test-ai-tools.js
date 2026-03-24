import { AIToolsRegistry } from './src/llm-integration.js';

const registry = new AIToolsRegistry();

console.log('=== AI Tools Registry ===\n');

console.log('Categories:');
console.log(registry.listCategories());
console.log('');

console.log('ML Frameworks:');
registry.listTools('ML Framework').forEach(tool => {
  console.log(`- ${tool.description}`);
  console.log(`  Languages: ${tool.languages.join(', ')}`);
  console.log(`  Install: ${tool.install}`);
});

console.log('\nLLM APIs:');
registry.listTools('LLM API').forEach(tool => {
  console.log(`- ${tool.description}`);
  console.log(`  Languages: ${tool.languages.join(', ')}`);
});

console.log('\nVector DBs:');
registry.listTools('Vector DB').forEach(tool => {
  console.log(`- ${tool.description}`);
});

console.log('\nData Science:');
registry.listTools('Data Science').forEach(tool => {
  console.log(`- ${tool.description}`);
});

console.log('\nNLP Tools:');
registry.listTools('NLP').forEach(tool => {
  console.log(`- ${tool.description}`);
});

console.log('\nVision Tools:');
registry.listTools('Vision').forEach(tool => {
  console.log(`- ${tool.description}`);
});
