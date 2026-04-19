/**
 * Swibe Gestalt Engine — Parallel Tool Execution
 *
 * Runs multiple tool calls concurrently and merges
 * results into a unified context before the next think cycle.
 */

class GestaltEngine {
  constructor(config = {}) {
    this.config = {
      maxConcurrent: config.maxConcurrent || 10,
      timeout: config.timeout || 30000,
      ...config,
    };
    this.history = [];
  }

  async execute(tasks, options = {}) {
    const merge = options.merge || 'unified_context';
    const startTime = Date.now();

    const results = await Promise.allSettled(
      tasks.map((task, i) => this._runWithTimeout(task, i))
    );

    const output = results.map((r, i) => ({
      index: i,
      status: r.status,
      value: r.status === 'fulfilled' ? r.value : null,
      error: r.status === 'rejected' ? String(r.reason) : null,
    }));

    const merged = this._merge(output, merge);

    this.history.push({
      timestamp: startTime,
      duration_ms: Date.now() - startTime,
      task_count: tasks.length,
      succeeded: output.filter(o => o.status === 'fulfilled').length,
      failed: output.filter(o => o.status === 'rejected').length,
      merge_strategy: merge,
    });

    return merged;
  }

  async _runWithTimeout(task, index) {
    if (typeof task === 'function') {
      return Promise.race([
        task(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error(`Task ${index} timed out`)), this.config.timeout)
        ),
      ]);
    }
    if (task && typeof task.then === 'function') {
      return task;
    }
    return task;
  }

  _merge(outputs, strategy) {
    switch (strategy) {
      case 'unified_context':
        return {
          strategy: 'unified_context',
          results: outputs.filter(o => o.status === 'fulfilled').map(o => o.value),
          errors: outputs.filter(o => o.status === 'rejected').map(o => o.error),
          total: outputs.length,
        };
      case 'first_success':
        return {
          strategy: 'first_success',
          result: outputs.find(o => o.status === 'fulfilled')?.value || null,
        };
      case 'all_or_nothing':
        return {
          strategy: 'all_or_nothing',
          success: outputs.every(o => o.status === 'fulfilled'),
          results: outputs.every(o => o.status === 'fulfilled')
            ? outputs.map(o => o.value)
            : [],
        };
      default:
        return { strategy, results: outputs.map(o => o.value || o.error) };
    }
  }

  getHistory() {
    return this.history;
  }
}

export { GestaltEngine };
