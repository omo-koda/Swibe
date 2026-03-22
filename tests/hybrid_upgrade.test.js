import { describe, it, expect } from 'vitest';
import { Compiler } from '../src/compiler.js';

describe('Swibe v1.1.0 Hybrid Upgrade', () => {
  it('correctly splits @target blocks and sovereign statements', async () => {
    const source = `
@elixir {
  fn orchestrate() {
    print("Orchestrating from BEAM")
  }
}

@move {
  fn on_chain_helper() {
    -- this will be in Move
  }
}

swarm {
  Thinker: Agent { role: "reasoner" } @elixir,
  Auditor: Agent { role: "verifier" } @move
}

mint { agent: "0x123", value: 100 }
receipt { hash: "abc", agent: "0x123" }
seal;
walrus { blob: "data" }
    `;
    const compiler = new Compiler(source, 'hybrid');
    const code = await compiler.compile();

    expect(code).toContain('--- ELIXIR ---');
    expect(code).toContain('--- MOVE ---');

    const sections = code.split('--- MOVE ---');
    const elixirPart = sections[sectionIndex('ELIXIR', sections)]; // helper logic if needed, but let's just check strings
    const movePart = sections[1];

    // Elixir checks
    expect(elixirPart).toContain('def orchestrate() do');
    expect(elixirPart).toContain('IO.puts("Orchestrating from BEAM")');
    expect(elixirPart).toContain('name: "Thinker"');
    expect(elixirPart).not.toContain('name: "Auditor"');

    // Move checks
    expect(movePart).toContain('fun on_chain_helper()');
    expect(movePart).toContain('public entry fun init_ritual');
    expect(movePart).toContain('SoulToken { id: object::new(ctx), agent: 0x123, value: 100 }');
    expect(movePart).toContain('event::emit(ReceiptEvent { hash: b"abc", agent: 0x123 })');
    expect(movePart).toContain('message: b"seal_request"');
    expect(movePart).toContain('message: b"data"');
    expect(movePart).toContain('message: b"Auditor"');
    expect(movePart).not.toContain('message: b"Thinker"');
  });
});

function sectionIndex(name, sections) {
  return sections.findIndex(s => s.includes(`--- ${name} ---`));
}
