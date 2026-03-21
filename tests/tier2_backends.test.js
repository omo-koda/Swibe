import { describe, it, expect } from 'vitest';
import { Compiler } from '../src/compiler.js';

describe('Swibe v0.5.3 Tier 2 Backends Expansion', () => {

  const source = `
    swarm { Genesis: Agent { name: "Genesis" } }
    fn add(a: i32, b: i32) { return a + b }
  `;

  it('compiles to Rust (Safe enforcer)', async () => {
    const compiler = new Compiler(source, 'rust');
    const code = await compiler.compile();
    expect(code).toContain('fn main()');
    expect(code).toContain('thread::spawn');
    expect(code).toContain('fn add(a: i32, b: i32)');
  });

  it('compiles to Go (Goroutine worker)', async () => {
    const compiler = new Compiler(source, 'go');
    const code = await compiler.compile();
    expect(code).toContain('package main');
    expect(code).toContain('go func()');
    expect(code).toContain('func add(a interface{}, b interface{})');
  });

  it('compiles to V (Auto-free)', async () => {
    const compiler = new Compiler(source, 'v');
    const code = await compiler.compile();
    expect(code).toContain('module main');
    expect(code).toContain('go fn(name string)');
  });

  it('compiles to Odin (Data beast)', async () => {
    const compiler = new Compiler(source, 'odin');
    const code = await compiler.compile();
    expect(code).toContain('package main');
    expect(code).toContain('main :: proc()');
    expect(code).toContain('add :: proc(a: any, b: any)');
  });

  it('compiles to OCaml (Functor skills)', async () => {
    const compiler = new Compiler(source, 'ocaml');
    const code = await compiler.compile();
    expect(code).toContain('print_endline');
    expect(code).toContain('let add a b =');
  });

  it('compiles to F# (Typed receipts)', async () => {
    const compiler = new Compiler(source, 'fsharp');
    const code = await compiler.compile();
    expect(code).toContain('printfn');
    expect(code).toContain('let add a b =');
    expect(code).toContain('Async.Start');
  });

  it('compiles to Clojure (Immutable)', async () => {
    const compiler = new Compiler(source, 'clojure');
    const code = await compiler.compile();
    expect(code).toContain('(defn add [a b]');
    expect(code).toContain('(future');
  });

  it('compiles to Haskell (Pure ethics)', async () => {
    const compiler = new Compiler(source, 'haskell');
    const code = await compiler.compile();
    expect(code).toContain('main = do');
    expect(code).toContain('forkIO');
  });

});
