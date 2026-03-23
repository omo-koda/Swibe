# Contributing to Swibe

## Adding a New Backend

1. Create `src/backends/<language>.js` exporting a `gen<Language>(node, indent)` function.
2. Handle at minimum these AST nodes: `Program`, `FunctionDecl`, `Block`, `VariableDecl`, `FunctionCall`, `SwarmStatement`, `String`, `Number`, `Identifier`.
3. Register the import and case in `src/compiler.js` → `generateCode()`.
4. Add tests in `tests/` covering compile output for swarm, function, and variable declarations.

## Running Tests

```bash
npm test            # or: npx vitest run
```

All 53 tests must pass before submitting a PR.

## Linting

```bash
npm run lint        # must show 0 errors
```

We enforce `no-case-declarations` (wrap case bodies in `{}`), `prefer-const`, and `no-dupe-keys`.

## Code Style

- ES modules (`import`/`export`) — no CommonJS.
- Use `const` by default; `let` only when reassignment is required.
- Wrap `switch` case bodies containing declarations in braces.
- No comments unless the code is non-obvious.
- Follow existing naming: `genRust`, `genGo`, `genElixir`, etc.

## PR Requirements

1. All tests pass (`npx vitest run` — 53/53).
2. Lint clean (`npm run lint` — 0 errors).
3. One logical change per commit.
4. Commit messages follow conventional format: `feat:`, `fix:`, `docs:`, `security:`.
5. New backends must include at least one test file.
