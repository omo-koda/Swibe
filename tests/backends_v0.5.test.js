import { describe, it, expect } from 'vitest';
import { Compiler } from '../src/compiler.js';

describe('Swibe v0.5 Multi-Target Expansion', () => {

  describe('Lua Backend (Tiny Runtime)', () => {
    it('compiles swarm to coroutines', async () => {
      const source = 'swarm { Scout: Agent { name: "Scout" } }';
      const compiler = new Compiler(source, 'lua');
      const code = await compiler.compile();
      expect(code).toContain('local swibe = require("swibe_runtime")');
      expect(code).toContain('coroutine.create(function()');
      expect(code).toContain('Birthing Agent Scout');
    });

    it('compiles meta-digital to metatables', async () => {
      const source = 'meta-digital "Truth" { output: "Veritas" }';
      const compiler = new Compiler(source, 'lua');
      const code = await compiler.compile();
      expect(code).toContain('setmetatable({}, {');
      expect(code).toContain('__call = function(self, input)');
    });
  });

  describe('Zig Backend (Edge Scouts)', () => {
    it('compiles main and std import', async () => {
      const source = 'fn start() {}';
      const compiler = new Compiler(source, 'zig');
      const code = await compiler.compile();
      expect(code).toContain('const std = @import("std");');
      expect(code).toContain('pub fn main() !void {');
    });

    it('compiles swarm to native threads', async () => {
      const source = 'swarm { EdgeNode: Agent { name: "EdgeNode" } }';
      const compiler = new Compiler(source, 'zig');
      const code = await compiler.compile();
      expect(code).toContain('std.Thread.spawn');
      expect(code).toContain('EdgeNode_agent');
    });
  });

  describe('Julia Backend (Osovm Bridge)', () => {
    it('compiles matrix ops for neural layer', async () => {
      const source = 'neural;';
      const compiler = new Compiler(source, 'julia');
      const code = await compiler.compile();
      expect(code).toContain('using LinearAlgebra');
      expect(code).toContain('neurons = rand(Float64, 86000, 86000)');
    });

    it('compiles swarm to async tasks', async () => {
      const source = 'swarm { MatrixSim: Agent { name: "MatrixSim" } }';
      const compiler = new Compiler(source, 'julia');
      const code = await compiler.compile();
      expect(code).toContain('@async println("[JULIA] Agent MatrixSim active")');
    });
  });

});
