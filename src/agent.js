// src/agent.js
import { sovereign } from './sovereign-vault.js';

export class SovereignAgent {
  constructor() {
    const agentData = sovereign.createAgentAtBirth();
    this.identity = agentData.identity;
    this.neuralLayer = agentData.neuralLayer;
    this.seed = agentData.seed;
  }

  run(command) {
    // For now, just a simple command echo
    if (command.toLowerCase() === 'look') {
      return 'You see the swirling vortex of the Swibe command line.';
    }
    return `Unknown command: ${command}`;
  }
}
