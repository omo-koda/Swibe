/**
 * Swibe Gestalt Module — Phase 6: Parallel Tool Execution
 * Concurrent operations with result synthesis and merge strategies
 */

import { EventEmitter } from 'events';

const MERGE_STRATEGY = {
  UNIFIED_CONTEXT: 'unified_context',
  FIRST_WINS: 'first_wins',
  MAJORITY_VOTE: 'majority_vote',
  CONCATENATE: 'concatenate',
  REDUCE: 'reduce',
};

class GestaltTask {
  constructor(action, value, index) {
    this.action = action;
    this.value = value;
    this.index = index;
    this.status = 'pending';
    this.result = null;
    this.error = null;
    this.startTime = null;
    this.endTime = null;
  }

  get duration() {
    if (!this.startTime || !this.endTime) return null;
    return this.endTime - this.startTime;
  }
}

export class Gestalt extends EventEmitter {
  constructor(tasks = [], mergeStrategy = MERGE_STRATEGY.UNIFIED_CONTEXT) {
    super();
    this.tasks = tasks.map((t, i) => new GestaltTask(t.action, t.value, i));
    this.mergeStrategy = mergeStrategy;
    this.maxConcurrent = 0; // 0 = unlimited
    this.timeout = 30000;
    this._results = [];
  }

  async execute(executors = {}) {
    this.emit('execute:start', { taskCount: this.tasks.length, strategy: this.mergeStrategy });

    const promises = this.tasks.map(async (task) => {
      task.status = 'running';
      task.startTime = Date.now();
      this.emit('task:start', task);

      try {
        const executor = executors[task.action];
        if (executor) {
          task.result = await Promise.race([
            executor(task.value),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error('Task timeout')), this.timeout)
            ),
          ]);
        } else {
          task.result = { action: task.action, value: task.value, status: 'no_executor' };
        }
        task.status = 'completed';
      } catch (err) {
        task.status = 'failed';
        task.error = err.message;
        task.result = { error: err.message };
      }

      task.endTime = Date.now();
      this.emit('task:complete', task);
      return task;
    });

    const settled = await Promise.allSettled(promises);
    this._results = settled.map(s => s.status === 'fulfilled' ? s.value : s.reason);

    const merged = this.merge();
    this.emit('execute:complete', merged);
    return merged;
  }

  merge(results = null) {
    const tasks = results || this.tasks;
    const completed = tasks.filter(t => t.status === 'completed');
    const failed = tasks.filter(t => t.status === 'failed');

    switch (this.mergeStrategy) {
      case MERGE_STRATEGY.UNIFIED_CONTEXT:
        return this._mergeUnified(completed, failed);
      case MERGE_STRATEGY.FIRST_WINS:
        return this._mergeFirstWins(completed, failed);
      case MERGE_STRATEGY.MAJORITY_VOTE:
        return this._mergeMajorityVote(completed, failed);
      case MERGE_STRATEGY.CONCATENATE:
        return this._mergeConcatenate(completed, failed);
      case MERGE_STRATEGY.REDUCE:
        return this._mergeReduce(completed, failed);
      default:
        return this._mergeUnified(completed, failed);
    }
  }

  _mergeUnified(completed, failed) {
    return {
      strategy: 'unified_context',
      results: completed.map(t => ({ action: t.action, result: t.result, duration: t.duration })),
      failed: failed.map(t => ({ action: t.action, error: t.error })),
      total: completed.length + failed.length,
      succeeded: completed.length,
      summary: `${completed.length}/${completed.length + failed.length} tasks completed`,
    };
  }

  _mergeFirstWins(completed, failed) {
    const sorted = [...completed].sort((a, b) => a.endTime - b.endTime);
    return {
      strategy: 'first_wins',
      winner: sorted[0] ? { action: sorted[0].action, result: sorted[0].result, duration: sorted[0].duration } : null,
      others: sorted.slice(1).map(t => ({ action: t.action, result: t.result })),
      failed: failed.map(t => ({ action: t.action, error: t.error })),
    };
  }

  _mergeMajorityVote(completed, failed) {
    const votes = {};
    for (const task of completed) {
      const key = JSON.stringify(task.result);
      votes[key] = (votes[key] || 0) + 1;
    }
    const sorted = Object.entries(votes).sort((a, b) => b[1] - a[1]);
    return {
      strategy: 'majority_vote',
      winner: sorted[0] ? { result: JSON.parse(sorted[0][0]), votes: sorted[0][1] } : null,
      allVotes: sorted.map(([r, c]) => ({ result: JSON.parse(r), count: c })),
      total: completed.length,
    };
  }

  _mergeConcatenate(completed, failed) {
    return {
      strategy: 'concatenate',
      results: completed.map(t => t.result),
      failed: failed.map(t => ({ action: t.action, error: t.error })),
      total: completed.length,
    };
  }

  _mergeReduce(completed, failed) {
    const reduced = completed.reduce((acc, task) => {
      acc[task.action] = task.result;
      return acc;
    }, {});
    return {
      strategy: 'reduce',
      reduced,
      failed: failed.map(t => ({ action: t.action, error: t.error })),
      total: completed.length,
    };
  }

  addTask(action, value) {
    const task = new GestaltTask(action, value, this.tasks.length);
    this.tasks.push(task);
    return task;
  }

  getStats() {
    return {
      total: this.tasks.length,
      pending: this.tasks.filter(t => t.status === 'pending').length,
      running: this.tasks.filter(t => t.status === 'running').length,
      completed: this.tasks.filter(t => t.status === 'completed').length,
      failed: this.tasks.filter(t => t.status === 'failed').length,
      totalDuration: this.tasks.reduce((s, t) => s + (t.duration || 0), 0),
    };
  }

  reset() {
    this.tasks.forEach(t => {
      t.status = 'pending';
      t.result = null;
      t.error = null;
      t.startTime = null;
      t.endTime = null;
    });
    this._results = [];
  }
}

export function gestaltFromAST(node) {
  const concurrent = (node.concurrent || []).map(c => ({
    action: c.action,
    value: typeof c.value === 'object' && c.value.value !== undefined ? c.value.value : c.value,
  }));
  const merge = typeof node.merge === 'object' && node.merge.value !== undefined
    ? node.merge.value
    : (node.merge || 'unified_context');
  return new Gestalt(concurrent, merge);
}
