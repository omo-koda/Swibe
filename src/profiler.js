/**
 * Profiler & Benchmarker
 * Performance profiling and cross-language benchmarking
 */

class Profiler {
  constructor() {
    this.samples = [];
    this.results = [];
  }

  /**
   * Profile function
   */
  profile(fn, name = 'function', iterations = 1) {
    const samples = [];

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      const startMem = process.memoryUsage().heapUsed;

      fn();

      const end = performance.now();
      const endMem = process.memoryUsage().heapUsed;

      samples.push({
        time: end - start,
        memory: endMem - startMem
      });
    }

    this.samples.push({ name, samples });
    return this.analyze(samples);
  }

  /**
   * Analyze samples
   */
  analyze(samples) {
    const times = samples.map(s => s.time);
    const memories = samples.map(s => s.memory);

    times.sort((a, b) => a - b);
    memories.sort((a, b) => a - b);

    return {
      time: {
        min: times[0],
        max: times[times.length - 1],
        avg: times.reduce((a, b) => a + b) / times.length,
        median: times[Math.floor(times.length / 2)],
        stdDev: this.stdDev(times),
        p95: times[Math.floor(times.length * 0.95)],
        p99: times[Math.floor(times.length * 0.99)]
      },
      memory: {
        min: memories[0],
        max: memories[memories.length - 1],
        avg: memories.reduce((a, b) => a + b) / memories.length
      },
      count: samples.length
    };
  }

  /**
   * Calculate standard deviation
   */
  stdDev(nums) {
    const avg = nums.reduce((a, b) => a + b) / nums.length;
    const diffs = nums.map(n => Math.pow(n - avg, 2));
    const variance = diffs.reduce((a, b) => a + b) / diffs.length;
    return Math.sqrt(variance);
  }

  /**
   * Compare benchmarks
   */
  compare(results1, results2) {
    const avg1 = results1.time.avg;
    const avg2 = results2.time.avg;
    const diff = ((avg2 - avg1) / avg1) * 100;

    return {
      faster: diff < 0,
      slower: diff > 0,
      percentChange: diff.toFixed(2),
      speedup: (avg1 / avg2).toFixed(2) + 'x'
    };
  }

  /**
   * Generate report
   */
  generateReport() {
    let report = '# Performance Report\n\n';

    this.samples.forEach(({ name, samples }) => {
      const analysis = this.analyze(samples);

      report += `## ${name}\n`;
      report += `- Min: ${analysis.time.min.toFixed(3)}ms\n`;
      report += `- Max: ${analysis.time.max.toFixed(3)}ms\n`;
      report += `- Avg: ${analysis.time.avg.toFixed(3)}ms\n`;
      report += `- Median: ${analysis.time.median.toFixed(3)}ms\n`;
      report += `- Std Dev: ${analysis.time.stdDev?.toFixed(3) || 'N/A'}ms\n`;
      report += `- P95: ${analysis.time.p95.toFixed(3)}ms\n`;
      report += `- P99: ${analysis.time.p99.toFixed(3)}ms\n`;
      report += `- Memory: ${(analysis.memory.avg / 1024 / 1024).toFixed(2)}MB avg\n\n`;
    });

    return report;
  }
}

export { Profiler };
