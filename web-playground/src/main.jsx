import { SovereignAgent } from '../../src/agent.js';

const agent = new SovereignAgent();

const input = document.getElementById('input');
const output = document.getElementById('output');

input.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    const command = input.value;
    input.value = '';

    const commandOutput = `\n> ${command}`;
    output.textContent += commandOutput;

    const result = agent.run(command);
    const resultOutput = `\n${result}`;
    output.textContent += resultOutput;

    // Scroll to bottom
    window.scrollTo(0, document.body.scrollHeight);
  }
});
