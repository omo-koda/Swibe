/**
 * Swibe Agent Coordinator — Phase 4: Advanced Agent Coordination
 *
 * Beyond basic swarm: typed agents with skills, coordination strategies,
 * message passing, consensus protocols, and sub-agent spawning with isolation.
 *
 * Coordination modes:
 *   - hierarchical: lead agent delegates tasks, collects results
 *   - democratic: agents vote on decisions via weighted consensus
 *   - competitive: agents race to solve, best result wins
 *   - pipeline: sequential pass-through, each agent transforms output
 */

import { EventEmitter } from 'node:events';
import crypto from 'node:crypto';

// ── Agent Definition ────────────────────────────────────────

export class AgentDef {
  /**
   * @param {string} role — role name (architect, coder, reviewer, etc.)
   * @param {object} config
   * @param {string} config.description — what this agent does
   * @param {string[]} config.skills — list of skill names
   * @param {string} config.model — preferred LLM model
   * @param {number} config.weight — voting weight for democratic mode
   * @param {object} config.constraints — per-agent ethics/budget overrides
   */
  constructor(role, config = {}) {
    this.id = crypto.randomUUID();
    this.role = role;
    this.description = config.description || '';
    this.skills = config.skills || [];
    this.model = config.model || null;
    this.weight = config.weight ?? 1.0;
    this.constraints = config.constraints || {};
    this.state = 'idle';     // idle | working | blocked | done | error
    this.inbox = [];
    this.outbox = [];
    this.results = [];
    this.metrics = { tasksCompleted: 0, tokensUsed: 0, errors: 0 };
  }

  /** Whether this agent has a specific skill */
  hasSkill(name) {
    return this.skills.includes(name);
  }

  /** Record a result from this agent */
  recordResult(result) {
    this.results.push({ ...result, timestamp: Date.now() });
    this.metrics.tasksCompleted++;
    this.state = 'done';
  }

  /** Record an error */
  recordError(error) {
    this.metrics.errors++;
    this.state = 'error';
    this.results.push({ error: error.message || error, timestamp: Date.now() });
  }

  /** Send a message to this agent's inbox */
  receive(message) {
    this.inbox.push({ ...message, received: Date.now() });
  }

  /** Consume next message from inbox */
  consume() {
    return this.inbox.shift() || null;
  }

  /** Post a message to this agent's outbox */
  post(message) {
    this.outbox.push({ from: this.role, ...message, sent: Date.now() });
  }
}

// ── Coordination Strategies ─────────────────────────────────

const strategies = {
  /**
   * Hierarchical: lead agent delegates tasks, collects results.
   * First agent in the roster is the lead.
   */
  async hierarchical(coordinator, task, agents, executor) {
    const lead = agents[0];
    const workers = agents.slice(1);

    // Lead plans the work
    lead.state = 'working';
    const plan = await executor(lead, {
      type: 'plan',
      prompt: `You are the ${lead.role}. Plan how to accomplish: ${task}\nAvailable workers: ${workers.map(w => w.role).join(', ')}`,
    });
    lead.recordResult({ type: 'plan', output: plan });

    // Delegate sub-tasks to workers
    const subtasks = parseSubtasks(plan, workers);
    const workerResults = await Promise.all(
      subtasks.map(async ({ agent, subtask }) => {
        agent.state = 'working';
        try {
          const result = await executor(agent, {
            type: 'execute',
            prompt: `You are the ${agent.role}. Task from ${lead.role}: ${subtask}`,
          });
          agent.recordResult({ type: 'execute', output: result });
          return { role: agent.role, result, ok: true };
        } catch (err) {
          agent.recordError(err);
          return { role: agent.role, error: err.message, ok: false };
        }
      })
    );

    // Lead synthesizes
    lead.state = 'working';
    const synthesis = await executor(lead, {
      type: 'synthesize',
      prompt: `Synthesize these results for: ${task}\n${workerResults.map(r => `${r.role}: ${r.ok ? r.result : 'ERROR: ' + r.error}`).join('\n')}`,
    });
    lead.recordResult({ type: 'synthesis', output: synthesis });

    coordinator.emit('round_complete', { strategy: 'hierarchical', results: workerResults, synthesis });
    return { synthesis, workerResults };
  },

  /**
   * Democratic: all agents work independently, then vote on best result.
   * Voting is weighted by agent.weight.
   */
  async democratic(coordinator, task, agents, executor) {
    // All agents produce their solution
    const solutions = await Promise.all(
      agents.map(async (agent) => {
        agent.state = 'working';
        try {
          const result = await executor(agent, {
            type: 'solve',
            prompt: `You are the ${agent.role}. Propose your solution for: ${task}`,
          });
          agent.recordResult({ type: 'solution', output: result });
          return { agent, result, ok: true };
        } catch (err) {
          agent.recordError(err);
          return { agent, result: null, ok: false };
        }
      })
    );

    const valid = solutions.filter(s => s.ok);
    if (valid.length === 0) {
      coordinator.emit('round_complete', { strategy: 'democratic', error: 'all agents failed' });
      return { winner: null, solutions };
    }

    // Each agent votes on all solutions (excluding their own)
    const votes = new Map();
    valid.forEach(s => votes.set(s.agent.id, 0));

    for (const voter of agents) {
      if (voter.state === 'error') continue;
      const others = valid.filter(s => s.agent.id !== voter.id);
      if (others.length === 0) continue;

      try {
        const voteResult = await executor(voter, {
          type: 'vote',
          prompt: `Vote for the best solution:\n${others.map((s, i) => `[${i}] ${s.agent.role}: ${typeof s.result === 'string' ? s.result.slice(0, 200) : JSON.stringify(s.result).slice(0, 200)}`).join('\n')}\nReply with the number of the best solution.`,
        });

        const choice = parseInt(String(voteResult).match(/\d+/)?.[0] || '0', 10);
        if (choice >= 0 && choice < others.length) {
          const target = others[choice].agent.id;
          votes.set(target, (votes.get(target) || 0) + voter.weight);
        }
      } catch { /* voter failed, skip */ }
    }

    // Find winner
    let maxVotes = -1;
    let winnerId = null;
    for (const [id, score] of votes) {
      if (score > maxVotes) {
        maxVotes = score;
        winnerId = id;
      }
    }

    const winner = valid.find(s => s.agent.id === winnerId);
    coordinator.emit('round_complete', { strategy: 'democratic', winner: winner?.agent.role, votes: Object.fromEntries(votes) });
    return { winner: winner?.result, votes: Object.fromEntries(votes), solutions };
  },

  /**
   * Competitive: agents race, first valid result wins (or best by scoring).
   */
  async competitive(coordinator, task, agents, executor) {
    const results = await Promise.allSettled(
      agents.map(async (agent) => {
        agent.state = 'working';
        const start = Date.now();
        const result = await executor(agent, {
          type: 'compete',
          prompt: `You are the ${agent.role}. Solve as fast and well as possible: ${task}`,
        });
        agent.recordResult({ type: 'compete', output: result });
        return { agent, result, time: Date.now() - start };
      })
    );

    const fulfilled = results
      .filter(r => r.status === 'fulfilled')
      .map(r => r.value)
      .sort((a, b) => a.time - b.time);

    const winner = fulfilled[0] || null;
    coordinator.emit('round_complete', {
      strategy: 'competitive',
      winner: winner?.agent.role,
      times: fulfilled.map(f => ({ role: f.agent.role, time: f.time })),
    });
    return { winner: winner?.result, leaderboard: fulfilled };
  },

  /**
   * Pipeline: sequential pass-through. Each agent transforms the output of the previous.
   */
  async pipeline(coordinator, task, agents, executor) {
    let current = task;
    const stages = [];

    for (const agent of agents) {
      agent.state = 'working';
      try {
        const result = await executor(agent, {
          type: 'transform',
          prompt: `You are the ${agent.role}. Transform this input:\n${typeof current === 'string' ? current : JSON.stringify(current)}`,
        });
        agent.recordResult({ type: 'transform', output: result });
        stages.push({ role: agent.role, output: result, ok: true });
        current = result;
      } catch (err) {
        agent.recordError(err);
        stages.push({ role: agent.role, error: err.message, ok: false });
        // Pipeline broken — stop
        break;
      }
    }

    coordinator.emit('round_complete', { strategy: 'pipeline', stages });
    return { output: current, stages };
  },
};

// ── Agent Coordinator ───────────────────────────────────────

export class AgentCoordinator extends EventEmitter {
  /**
   * @param {string} name — team name
   * @param {object} config
   * @param {string} config.coordination — hierarchical|democratic|competitive|pipeline
   * @param {function} config.executor — async (agent, task) => result
   * @param {object} config.budget — shared team budget
   * @param {object} config.ethics — shared ethics constraints
   */
  constructor(name, config = {}) {
    super();
    this.name = name;
    this.coordination = config.coordination || 'hierarchical';
    this.executor = config.executor || defaultExecutor;
    this.agents = new Map();
    this.rounds = [];
    this.budget = config.budget || null;
    this.ethics = config.ethics || null;
    this.messageLog = [];
  }

  /**
   * Add an agent to the team
   */
  addAgent(role, config = {}) {
    const agent = new AgentDef(role, config);
    this.agents.set(role, agent);
    this.emit('agent_added', { role, id: agent.id });
    return agent;
  }

  /**
   * Remove an agent from the team
   */
  removeAgent(role) {
    this.agents.delete(role);
  }

  /**
   * Get an agent by role
   */
  getAgent(role) {
    return this.agents.get(role);
  }

  /**
   * List all agents with their current state
   */
  roster() {
    return Array.from(this.agents.values()).map(a => ({
      role: a.role,
      id: a.id,
      state: a.state,
      skills: a.skills,
      weight: a.weight,
      metrics: a.metrics,
    }));
  }

  /**
   * Send a message between agents
   */
  send(fromRole, toRole, message) {
    const target = this.agents.get(toRole);
    if (!target) return false;
    const msg = { from: fromRole, to: toRole, body: message, timestamp: Date.now() };
    target.receive(msg);
    this.messageLog.push(msg);
    this.emit('message', msg);
    return true;
  }

  /**
   * Broadcast a message to all agents
   */
  broadcast(fromRole, message) {
    for (const [role, _agent] of this.agents) {
      if (role !== fromRole) {
        this.send(fromRole, role, message);
      }
    }
  }

  /**
   * Execute a task using the configured coordination strategy
   */
  async coordinate(task) {
    const agentList = Array.from(this.agents.values());
    if (agentList.length === 0) {
      throw new Error(`Team "${this.name}" has no agents`);
    }

    const strategy = strategies[this.coordination];
    if (!strategy) {
      throw new Error(`Unknown coordination strategy: ${this.coordination}`);
    }

    // Budget check before starting
    if (this.budget) {
      this._checkBudget();
    }

    this.emit('round_start', { task, strategy: this.coordination, agents: agentList.length });

    const result = await strategy(this, task, agentList, this.executor);

    this.rounds.push({
      task,
      strategy: this.coordination,
      result,
      timestamp: Date.now(),
      agentCount: agentList.length,
    });

    return result;
  }

  /**
   * Spawn a sub-agent with isolated state
   */
  spawn(role, config = {}) {
    const agent = this.addAgent(role, config);
    agent.state = 'idle';
    this.emit('agent_spawned', { role, id: agent.id, isolated: true });
    return agent;
  }

  /**
   * Aggregate thoughts from all agents (Consensus)
   */
  async aggregate(thought, options = {}) {
    const timeout = options.timeout ?? 30000;
    const agents = Array.from(this.agents.values());
    
    return Promise.race([
      this._collectResponses(thought, agents),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('CONSENSUS_TIMEOUT')), timeout)
      )
    ]).catch(err => {
      if (err.message === 'CONSENSUS_TIMEOUT') {
        console.warn(`[CONSENSUS] Timeout after ${timeout}ms — returning partial results`);
        return this._getPartialResults();
      }
      throw err;
    });
  }

  async _collectResponses(thought, agents) {
    const start = Date.now();
    const results = await Promise.allSettled(
      agents.map(async (agent) => {
        const result = await this.executor(agent, { type: 'thought', prompt: thought });
        return { agent, result, time: Date.now() - start };
      })
    );
    return results.filter(r => r.status === 'fulfilled').map(r => r.value);
  }

  _getPartialResults() {
    return Array.from(this.agents.values())
      .filter(a => a.results.length > 0)
      .map(a => ({ agent: a, result: a.results[a.results.length - 1] }));
  }

  /**
   * Get team performance summary
   */
  summary() {
    const agents = this.roster();
    return {
      name: this.name,
      coordination: this.coordination,
      agents: agents.length,
      rounds: this.rounds.length,
      messages: this.messageLog.length,
      totalTasks: agents.reduce((sum, a) => sum + a.metrics.tasksCompleted, 0),
      totalErrors: agents.reduce((sum, a) => sum + a.metrics.errors, 0),
    };
  }

  /**
   * Get full audit trail
   */
  auditTrail() {
    return {
      team: this.name,
      rounds: this.rounds,
      messages: this.messageLog,
      agents: Array.from(this.agents.values()).map(a => ({
        role: a.role,
        results: a.results,
        metrics: a.metrics,
      })),
    };
  }

  _checkBudget() {
    if (!this.budget) return;
    if (this.budget.maxRounds && this.rounds.length >= this.budget.maxRounds) {
      throw new Error(`Team "${this.name}" exceeded max rounds (${this.budget.maxRounds})`);
    }
  }
}

// ── Helpers ──────────────────────────────────────────────────

function parseSubtasks(planOutput, workers) {
  const text = typeof planOutput === 'string' ? planOutput : JSON.stringify(planOutput);
  // Simple heuristic: distribute evenly across workers
  return workers.map((agent, i) => ({
    agent,
    subtask: `Task ${i + 1} from plan: ${text.slice(0, 200)}`,
  }));
}

async function defaultExecutor(agent, task) {
  // Stub executor — in real usage, this calls LLM via think loop
  return `[${agent.role}] Completed: ${task.type} — ${(task.prompt || '').slice(0, 100)}`;
}

/**
 * Build an AgentCoordinator from a parsed TeamStatement AST node
 */
export function coordinatorFromAST(node, executor = null) {
  const coord = new AgentCoordinator(node.name || 'team', {
    coordination: typeof node.coordination === 'string'
      ? node.coordination
      : node.coordination?.value || 'hierarchical',
    executor: executor || defaultExecutor,
  });

  for (const [role, desc] of Object.entries(node.roles || {})) {
    const description = typeof desc === 'string' ? desc : desc?.value || '';
    // Parse skills from description if present (e.g., "designs [design, review]")
    const skillMatch = description.match(/\[([^\]]+)\]/);
    const skills = skillMatch
      ? skillMatch[1].split(',').map(s => s.trim())
      : [];
    coord.addAgent(role, { description, skills });
  }

  return coord;
}

// CRITICAL: Named + default export for REPL compatibility
export default AgentCoordinator;
