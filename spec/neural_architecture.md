# Sovereign Neural Architecture

This document specifies the structure and function of the `SovereignNeuralLayer`, the cognitive core of a Swibe agent.

## Overview

The `SovereignNeuralLayer` uses an 86-parameter vector, known as `birthParams`, to configure an agent's behavior. These parameters are generated from a high-entropy source (e.g., IfáScript) at the moment of the agent's creation. They are immutable and define the agent's unique cognitive fingerprint.

The 86 parameters are mapped to 8 distinct "cortical regions," each influencing a different aspect of the agent's thought process, from model routing to ethical constraints.

## Cortical Region Specification

The `birthParams` array is an array of 86 floating-point numbers between 0.0 and 1.0. The array is sliced into the following regions:

| Region        | Index Range | Size | Purpose                                       |
|---------------|-------------|------|-----------------------------------------------|
| Prefrontal    | `0-11`      | 12   | **Reasoning & Routing:** Weights for model selection in the agent's Mixture of Experts. Determines which LLMs the agent prefers for a given task. |
| Hippocampus   | `12-29`     | 18   | **Memory:** Influences the agent's memory capacity, specifically the maximum number of results retrieved from its RAG (Retrieval-Augmented Generation) store. |
| Amygdala      | `30-37`     | 8    | **Ethics & Guardrails:** Sets the agent's base ethical threshold. This value is used by the `meta-digital refuse_if` check to determine if a prompt violates the agent's core principles. |
| Temporal      | `38-53`     | 16   | **Language:** Weights that affect language style, verbosity, and choice of vocabulary. (Future implementation) |
| Occipital     | `54-65`     | 12   | **Pattern Recognition:** Influences the agent's ability to recognize patterns in data, code, and behavior. Affects multi-modal reasoning. (Future implementation) |
| Cerebellum    | `66-75`     | 10   | **Coordination & Tool Use:** Fine-tunes the agent's ability to sequence and coordinate complex tool use. (Future implementation) |
| Brainstem     | `76-79`     | 4    | **Entropy Sensitivity:** Determines how the agent reacts to randomness and unexpected inputs. Influences creativity and exploration. |
| Parietal      | `80-85`     | 6    | **Economic Sense:** Weights that guide the agent's decisions in resource-constrained environments (e.g., gas fees, API costs). |

## Implementation

The `SovereignNeuralLayer` class in `src/neural.js` implements this specification.

- The **constructor** accepts the `birthParams` and creates the `cortex` object.
- The `route()` method uses the `prefrontal` weights to score and select models from the available pool.
- The `ethicsThreshold` getter calculates the ethical baseline from the `amygdala` weights.
- The `memoryCapacity` getter calculates the RAG limit from the `hippocampus` weights.

This architecture ensures that no two agents are identical. Even when given the same prompt and tools, their unique `birthParams` will cause them to reason, route, and respond differently, leading to a truly diverse and sovereign swarm.
