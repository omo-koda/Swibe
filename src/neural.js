// src/neural.js

class SovereignNeuralLayer {
  /**
   * @param {number[]} birthParams - Array of 86 floats (0-1) from IfáScript entropy.
   */
  constructor(birthParams) {
    if (!birthParams || birthParams.length !== 86) {
      throw new Error('SovereignNeuralLayer requires 86 birth parameters.');
    }

    // 86 parameters from IfáScript entropy
    this.params = birthParams; // Float array [0..1], length 86

    // Map params to cortical regions
    this.cortex = {
      prefrontal:  this.params.slice(0, 12),  // reasoning weights
      hippocampus: this.params.slice(12, 30), // memory weights
      amygdala:    this.params.slice(30, 38), // ethics thresholds
      temporal:    this.params.slice(38, 54), // language weights
      occipital:   this.params.slice(54, 66), // pattern weights
      cerebellum:  this.params.slice(66, 76), // coordination
      brainstem:   this.params.slice(76, 80), // entropy sensitivity
      parietal:    this.params.slice(80, 86)  // economic weights
    };
    
    // New parameters to be initialized
    this.synapseBalance = 0; // Example: a numerical balance for synapse strength
  }

  get neuronPool() {
    return 86_000_000_000n;
  }

  /**
   * Routes a prompt to available models based on birth parameters.
   * @param {string} prompt - The user prompt.
   * @param {Array<object>} availableModels - List of available models.
   * @returns {Promise<Array<{model: object, weight: number}>>} - Weighted model list.
   */
  async route(prompt, availableModels) {
    if (!availableModels || availableModels.length === 0) return [];
    if (this.cortex.prefrontal.length === 0) return [];
    return availableModels
      .map((model, i) => ({
        model,
        weight: this.cortex.prefrontal[
          i % this.cortex.prefrontal.length
        ]
      }))
      .sort((a, b) => b.weight - a.weight);
  }

  /**
   * Gets the ethics threshold for the agent.
   * @returns {number} - Average of amygdala params (0-1 float).
   */
  get ethicsThreshold() {
    if (this.cortex.amygdala.length === 0) {
      return 0;
    }
    return this.cortex.amygdala.reduce((a, b) => a + b, 0) / this.cortex.amygdala.length;
  }

  /**
   * Gets the memory capacity for the agent.
   * @returns {number} - Max RAG results for this agent.
   */
  get memoryCapacity() {
    return Math.floor(
      this.cortex.hippocampus.reduce((a, b) => a + b, 0) * 1000
    );
  }

  // Economic weight from parietal region
  get economicWeight() {
    if (this.cortex.parietal.length === 0) return 0;
    return this.cortex.parietal.reduce(
      (a, b) => a + b, 0
    ) / this.cortex.parietal.length;
  }

  // Creativity from brainstem entropy
  get creativityIndex() {
    if (this.cortex.brainstem.length === 0) return 0;
    return this.cortex.brainstem.reduce(
      (a, b) => a + b, 0
    ) / this.cortex.brainstem.length;
  }

  // Cognitive fingerprint — unique hash of params
  get fingerprint() {
    return this.params
      .map(p => Math.floor(p * 255)
      .toString(16).padStart(2, '0'))
      .join('');
  }

  // Static factory from raw entropy bytes
  static fromEntropy(entropyBytes) {
    const params = [];
    for (let i = 0; i < 86; i++) {
      params.push(
        (entropyBytes[i % entropyBytes.length] || 0) / 255
      );
    }
    return new SovereignNeuralLayer(params);
  }

  // Static random birth for testing
  static random() {
    const params = Array.from(
      { length: 86 }, 
      () => Math.random()
    );
    return new SovereignNeuralLayer(params);
  }

  // Cosine similarity for divergence measurement
  static divergence(agentA, agentB) {
    const a = agentA.cortex.prefrontal;
    const b = agentB.cortex.prefrontal;
    if (a.length === 0 || b.length === 0 || a.length !== b.length) return 0; // Handle empty or unequal length arrays
    const dot = a.reduce((sum, val, i) => 
      sum + val * b[i], 0);
    const magA = Math.sqrt(
      a.reduce((sum, val) => sum + val * val, 0)
    );
    const magB = Math.sqrt(
      b.reduce((sum, val) => sum + val * val, 0)
    );
    if (magA === 0 || magB === 0) return 0; // Prevent division by zero
    return dot / (magA * magB);
  }

  // Summary for logging
  summary() {
    return {
      fingerprint: this.fingerprint.slice(0, 16) + '...',
      ethicsThreshold: this.ethicsThreshold.toFixed(4),
      memoryCapacity: this.memoryCapacity,
      economicWeight: this.economicWeight.toFixed(4),
      creativityIndex: this.creativityIndex.toFixed(4),
      neuronPool: this.neuronPool.toString(),
      synapseBalance: this.synapseBalance
    };
  }
}

export default SovereignNeuralLayer;

// Named export for new architecture
export { SovereignNeuralLayer };

// Backward compatibility — legacy NeuralLayer
// that existing tests depend on
export class NeuralLayer {
  constructor() {
    this.neurons = 86_000_000_000n;
    this.synapses = 86_000_000;
  }

  actions(input = '') {
    const pathway = Math.floor(Math.random() * 0xFFFF);
    const context = typeof input === 'string' 
      ? input : JSON.stringify(input);
    console.log(`[NEURAL] Firing pathway: 0x${pathway.toString(16).toUpperCase()} (Context: ${context})`);
    this.synapses += 1;
    console.log(`[NEURAL] Synapse formed with: new-pathway (Total: ${this.synapses} Sui-synapses)`);
    return { pathway, synapses: this.synapses };
  }
}

// Fix NeuralLayer methods for existing tests
NeuralLayer.prototype.getState = function() {
  return {
    neurons: this.neurons.toString(),
    synapses: this.synapses.toString()
  };
};

NeuralLayer.prototype.fire = function(input) {
  const pathway = Math.floor(Math.random() * 0xFFFF);
  console.log(`[NEURAL] Firing pathway: 0x${pathway.toString(16).toUpperCase()} (Context: ${JSON.stringify(input)})`);
  return pathway;
};

NeuralLayer.prototype.connect = function(pathway) {
  this.synapses += 1;
  console.log(`[NEURAL] Synapse formed with: ${pathway} (Total: ${this.synapses} Sui-synapses)`);
};
