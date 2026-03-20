import { describe, it, expect } from 'vitest';
import { Compiler } from '../src/compiler.js';

describe('Swibe v0.5.2 Tier 1 Backends Expansion', () => {

  const source = `
    swarm { Genesis: Agent { name: "Genesis" } }
    meta-digital "Birth" { chain: birth; ethics: "none"; output: "Alive" }
    fn hello(name: str) { return name }
  `;

  it('compiles to Nim (Macro speed)', async () => {
    const compiler = new Compiler(source, 'nim');
    const code = await compiler.compile();
    expect(code).toContain('import std/asyncdispatch');
    expect(code).toContain('proc hello(name: JsonNode)');
    expect(code).toContain('template Birth_ritual()');
  });

  it('compiles to Crystal (Readable fibers)', async () => {
    const compiler = new Compiler(source, 'crystal');
    const code = await compiler.compile();
    expect(code).toContain('require "json"');
    expect(code).toContain('spawn do');
    expect(code).toContain('def hello(name : JSON::Any)');
  });

  it('compiles to Janet (Lisp embed)', async () => {
    const compiler = new Compiler(source, 'janet');
    const code = await compiler.compile();
    expect(code).toContain('(defn hello [name]');
    expect(code).toContain('(ev/spawn (print "[JANET] Birthing Agent Genesis..."))');
  });

  it('compiles to Scheme (Lambda chain)', async () => {
    const compiler = new Compiler(source, 'scheme');
    const code = await compiler.compile();
    expect(code).toContain('(define (hello name)');
    expect(code).toContain('(spawn (lambda () (display "[SCHEME] Birthing Agent Genesis...")');
  });

});
