import { describe, it, expect } from 'vitest';
import { Compiler } from '../src/compiler.js';

describe('Swibe v0.6.0 Tier 3 Backends Expansion', () => {

  const source = `
    swarm { Genesis: Agent { name: "Genesis" } }
    neural;
    fn add(a: i32, b: i32) { return a + b }
  `;

  it('compiles to APL (Array god)', async () => {
    const compiler = new Compiler(source, 'apl');
    const code = await compiler.compile();
    expect(code).toContain('⍝ Swibe Sovereign Birth Ritual');
    expect(code).toContain('Neurons ← 86000000000 ⍴ 1');
  });

  it('compiles to J (Vector assassin)', async () => {
    const compiler = new Compiler(source, 'j');
    const code = await compiler.compile();
    expect(code).toContain('NB. Swibe Sovereign Birth Ritual');
    expect(code).toContain('add =: 3 : 0');
  });

  it('compiles to K (Time watcher)', async () => {
    const compiler = new Compiler(source, 'k');
    const code = await compiler.compile();
    expect(code).toContain('/ Swibe Sovereign Birth Ritual');
    expect(code).toContain('add:{[a;b]');
  });

  it('compiles to Forth (Stack mystic)', async () => {
    const compiler = new Compiler(source, 'forth');
    const code = await compiler.compile();
    expect(code).toContain('( Swibe Sovereign Birth Ritual');
    expect(code).toContain(': add');
  });

  it('compiles to Mercury (Deterministic)', async () => {
    const compiler = new Compiler(source, 'mercury');
    const code = await compiler.compile();
    expect(code).toContain(':- module swibe_app.');
    expect(code).toContain(':- pred add');
  });

  it('compiles to Ada (Crash-proof)', async () => {
    const compiler = new Compiler(source, 'ada');
    const code = await compiler.compile();
    expect(code).toContain('procedure Swibe_App is');
    expect(code).toContain('-- Swarm Initiation: Ada Tasks');
  });

  it('compiles to COBOL (Batch audit)', async () => {
    const compiler = new Compiler(source, 'cobol');
    const code = await compiler.compile();
    expect(code).toContain('PROGRAM-ID. SWIBE-APP.');
    expect(code).toContain('DISPLAY "[COBOL] Logging swarm members');
  });

  it('compiles to Smalltalk (Live object)', async () => {
    const compiler = new Compiler(source, 'smalltalk');
    const code = await compiler.compile();
    expect(code).toContain('"Swibe Sovereign Birth Ritual');
    expect(code).toContain('Transcript show:');
  });

  it('compiles to D (Contract guard)', async () => {
    const compiler = new Compiler(source, 'd');
    const code = await compiler.compile();
    expect(code).toContain('void main()');
    expect(code).toContain('writeln("[D] Birthing Agent Genesis...");');
  });

  it('compiles to Raku (Grammar ethics)', async () => {
    const compiler = new Compiler(source, 'raku');
    const code = await compiler.compile();
    expect(code).toContain('use v6;');
    expect(code).toContain('sub add($a, $b)');
  });

  it('compiles to Scala (Akka scale)', async () => {
    const compiler = new Compiler(source, 'scala');
    const code = await compiler.compile();
    expect(code).toContain('object SwibeApp extends App');
    expect(code).toContain('Future { println("[SCALA] Birthing Agent Genesis...") }');
  });

  it('compiles to Idris (Proof vaults)', async () => {
    const compiler = new Compiler(source, 'idris');
    const code = await compiler.compile();
    expect(code).toContain('module Main');
    expect(code).toContain('add : (a : Any) (b : Any) -> Any');
  });

  it('compiles to Sui Move (On-chain)', async () => {
    const compiler = new Compiler(source, 'move');
    const code = await compiler.compile();
    expect(code).toContain('module omokoda::soul');
    expect(code).toContain('event::emit(BreathEvent { message: b"Genesis", iteration: iter });');
  });

  it('compiles MetaDigital to Move entry function', async () => {
    const metaSource = 'meta-digital "Genesis" { chain: birth, audit; ethics: "harm-none"; output: "Alive" }';
    const compiler = new Compiler(metaSource, 'move');
    const code = await compiler.compile();
    expect(code).toContain('public entry fun meta_digital_genesis');
    expect(code).toContain('Ethics guard: harm-none');
    expect(code).toContain('event::emit(BreathEvent { message: b"birth"');
  });

  it('compiles NeuralLayer to Move struct + fire function', async () => {
    const neuralSource = 'neural;';
    const compiler = new Compiler(neuralSource, 'move');
    const code = await compiler.compile();
    expect(code).toContain('struct NeuralState has key, store');
    expect(code).toContain('public entry fun neural_fire');
    expect(code).toContain('state.synapses = state.synapses + 1');
  });

});
