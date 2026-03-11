/**
 * Vibe Testing Framework
 * Supports #[test] macros, assertions, benchmarking
 */

class TestRunner {
  constructor() {
    this.tests = [];
    this.benchmarks = [];
    this.results = {
      passed: 0,
      failed: 0,
      skipped: 0,
      totalTime: 0
    };
  }

  /**
   * Register test function
   */
  registerTest(name, fn, options = {}) {
    this.tests.push({
      name,
      fn,
      skip: options.skip || false,
      timeout: options.timeout || 5000
    });
  }

  /**
   * Register benchmark
   */
  registerBenchmark(name, fn, options = {}) {
    this.benchmarks.push({
      name,
      fn,
      iterations: options.iterations || 1000,
      warmup: options.warmup || 100
    });
  }

  /**
   * Run all tests
   */
  async runTests() {
    console.log('\n📋 Running Tests\n');
    
    const startTime = Date.now();

    for (const test of this.tests) {
      if (test.skip) {
        this.results.skipped++;
        console.log(`⊘ SKIP  ${test.name}`);
        continue;
      }

      try {
        await this.runTest(test);
        this.results.passed++;
        console.log(`✓ PASS  ${test.name}`);
      } catch (error) {
        this.results.failed++;
        console.log(`✗ FAIL  ${test.name}`);
        console.log(`  Error: ${error.message}`);
      }
    }

    this.results.totalTime = Date.now() - startTime;
    this.printSummary();
    
    return this.results.failed === 0;
  }

  /**
   * Run single test with timeout
   */
  async runTest(test) {
    return Promise.race([
      Promise.resolve(test.fn()),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Test timeout')), test.timeout)
      )
    ]);
  }

  /**
   * Run benchmarks
   */
  async runBenchmarks() {
    console.log('\n⏱️  Running Benchmarks\n');

    for (const bench of this.benchmarks) {
      // Warmup
      for (let i = 0; i < bench.warmup; i++) {
        bench.fn();
      }

      // Measure
      const times = [];
      for (let i = 0; i < bench.iterations; i++) {
        const start = performance.now();
        bench.fn();
        const end = performance.now();
        times.push(end - start);
      }

      // Statistics
      const stats = this.calculateStats(times);
      this.printBenchmark(bench.name, stats);
    }
  }

  /**
   * Calculate benchmark statistics
   */
  calculateStats(times) {
    times.sort((a, b) => a - b);
    const min = times[0];
    const max = times[times.length - 1];
    const avg = times.reduce((a, b) => a + b) / times.length;
    const median = times[Math.floor(times.length / 2)];

    return { min, max, avg, median, count: times.length };
  }

  /**
   * Print test summary
   */
  printSummary() {
    const total = this.results.passed + this.results.failed + this.results.skipped;
    console.log(`\n${'='.repeat(50)}`);
    console.log(`Tests run: ${total}`);
    console.log(`✓ Passed: ${this.results.passed}`);
    console.log(`✗ Failed: ${this.results.failed}`);
    console.log(`⊘ Skipped: ${this.results.skipped}`);
    console.log(`⏱️  Time: ${this.results.totalTime}ms`);
    console.log(`${'='.repeat(50)}\n`);
  }

  /**
   * Print benchmark result
   */
  printBenchmark(name, stats) {
    console.log(`${name}`);
    console.log(`  Iterations: ${stats.count}`);
    console.log(`  Min:    ${stats.min.toFixed(3)}ms`);
    console.log(`  Max:    ${stats.max.toFixed(3)}ms`);
    console.log(`  Avg:    ${stats.avg.toFixed(3)}ms`);
    console.log(`  Median: ${stats.median.toFixed(3)}ms`);
    console.log();
  }
}

/**
 * Assertion functions
 */
class Assertions {
  static assert(condition, message = 'Assertion failed') {
    if (!condition) throw new Error(message);
  }

  static assertEquals(actual, expected, message) {
    if (actual !== expected) {
      const msg = message || `Expected ${expected} but got ${actual}`;
      throw new Error(msg);
    }
  }

  static assertNotEquals(actual, expected, message) {
    if (actual === expected) {
      const msg = message || `Expected not equal to ${expected}`;
      throw new Error(msg);
    }
  }

  static assertTrue(value, message = 'Expected true') {
    if (value !== true) throw new Error(message);
  }

  static assertFalse(value, message = 'Expected false') {
    if (value !== false) throw new Error(message);
  }

  static assertNull(value, message = 'Expected null') {
    if (value !== null) throw new Error(message);
  }

  static assertNotNull(value, message = 'Expected not null') {
    if (value === null) throw new Error(message);
  }

  static assertThrows(fn, message = 'Expected function to throw') {
    try {
      fn();
      throw new Error(message);
    } catch (e) {
      if (e.message === message) throw e;
      // Function threw, as expected
    }
  }

  static assertArrayEquals(actual, expected, message) {
    if (!Array.isArray(actual) || !Array.isArray(expected)) {
      throw new Error('Both values must be arrays');
    }
    if (actual.length !== expected.length) {
      throw new Error(message || `Array length mismatch: ${actual.length} vs ${expected.length}`);
    }
    for (let i = 0; i < actual.length; i++) {
      if (actual[i] !== expected[i]) {
        throw new Error(message || `Array element ${i} mismatch: ${actual[i]} vs ${expected[i]}`);
      }
    }
  }

  static assertObjectEquals(actual, expected, message) {
    const actualJson = JSON.stringify(actual);
    const expectedJson = JSON.stringify(expected);
    if (actualJson !== expectedJson) {
      throw new Error(message || `Object mismatch:\n${actualJson}\nvs\n${expectedJson}`);
    }
  }

  static assertCloseTo(actual, expected, epsilon = 0.0001, message) {
    const diff = Math.abs(actual - expected);
    if (diff > epsilon) {
      const msg = message || `Expected ${expected} ±${epsilon} but got ${actual}`;
      throw new Error(msg);
    }
  }

  static assertStringContains(str, substring, message) {
    if (!str.includes(substring)) {
      const msg = message || `Expected "${str}" to contain "${substring}"`;
      throw new Error(msg);
    }
  }

  static assertStringStartsWith(str, prefix, message) {
    if (!str.startsWith(prefix)) {
      const msg = message || `Expected "${str}" to start with "${prefix}"`;
      throw new Error(msg);
    }
  }

  static assertStringEndsWith(str, suffix, message) {
    if (!str.endsWith(suffix)) {
      const msg = message || `Expected "${str}" to end with "${suffix}"`;
      throw new Error(msg);
    }
  }
}

/**
 * Test decorator macro parser
 */
class TestMacroParser {
  static extract(code) {
    const tests = [];
    const benchmarks = [];

    // Find #[test] functions
    const testRegex = /#\[test(?:\([^)]*\))?\]\s*fn\s+(\w+)\s*\([^)]*\)\s*{([^}]*)}/gs;
    let match;

    while ((match = testRegex.exec(code)) !== null) {
      tests.push({
        name: match[1],
        body: match[2]
      });
    }

    // Find #[bench] functions
    const benchRegex = /#\[bench(?:\([^)]*\))?\]\s*fn\s+(\w+)\s*\([^)]*\)\s*{([^}]*)}/gs;

    while ((match = benchRegex.exec(code)) !== null) {
      benchmarks.push({
        name: match[1],
        body: match[2]
      });
    }

    return { tests, benchmarks };
  }
}

const assert = Assertions.assert;
const assertEquals = Assertions.assertEquals;
const assertTrue = Assertions.assertTrue;
const assertFalse = Assertions.assertFalse;
const assertThrows = Assertions.assertThrows;
const assertArrayEquals = Assertions.assertArrayEquals;
const assertObjectEquals = Assertions.assertObjectEquals;
const assertCloseTo = Assertions.assertCloseTo;
const assertStringContains = Assertions.assertStringContains;

export {
  TestRunner,
  Assertions,
  TestMacroParser,
  assert,
  assertEquals,
  assertTrue,
  assertFalse,
  assertThrows,
  assertArrayEquals,
  assertObjectEquals,
  assertCloseTo,
  assertStringContains
};
