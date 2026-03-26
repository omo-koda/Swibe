# Changelog

## v1.3.4 (2026-03-26)
- feat: IRGenerator wired into compiler
- feat: TypeInference wired into compiler
- feat: loop until cap configurable via SWIBE_LOOP_MAX
- chore: Cargo artifacts removed from git
- fix: PWA CORS documentation added

## v1.3.3 (2026-03-26)
- feat: VSCode LSP server compiled to out/
- feat: VSCode extension TypeScript source
- feat: swibe-compiler integration module

## v1.2.0 (2026-03-23)
- `@target` first-class parser syntax (leading and trailing in swarm blocks)
- Hybrid compiler target (Elixir + Move split)
- `cargo build` verified for Rust backend output
- 53/53 tests passing
- `spec/` formal grammar (EBNF)
- ESLint clean: 0 errors across all src/
- JS backend: full AST node coverage (StructDecl, EnumDecl, Match, LoopUntil, AppDecl, SkillProperty)
- Sandbox security: frozen API, reduced timeout, no class constructors exposed
- Go backend: duplicate `main()` guard

## v1.1.0 (2026-03-22)
- Elixir OTP supervisor backend
- Plugin interface live (`onBirth`, `onThink`, `onReceipt`, `onSettle` hooks)
- Twelve Thrones ecosystem wired
- 33+ compilation targets
- Hybrid multi-target orchestration

## v1.0.0 (2026-03-22)
- RAG persistence (filesystem-backed vault)
- Sovereign birth ritual with real crypto (Ed25519, AES-256-GCM, BIPỌ̀N39)
- BIP-39 ritual phrase generation
- Secure sandbox execution
- Neural layer simulation (86B neurons)
- Meta-digital chained skill execution
