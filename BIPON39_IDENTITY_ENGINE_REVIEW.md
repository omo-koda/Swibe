# BIPỌ̀N39 Identity Engine - Technical Review

**Review Date:** 2026-04-19  
**Version:** Swibe v3.3.3  
**Test Status:** 35/35 PASSING

---

## Executive Summary

BIPỌ̀N39 is a deterministic agent identity system inspired by BIP-39 wallet standards, adapted for Swibe's agent-native runtime. It combines Yoruba Orisha cosmology with cryptographic primitives to create unique, reproducible agent identities with archetypal routing keys and elemental personality vectors.

**Assessment:** Production-ready with strong cryptographic foundations, clean architecture, and comprehensive test coverage.

---

## 1. Architecture Overview

### Module Structure

```
src/bipon39/
├── index.js          # Re-exports all public APIs
├── wordspace.js      # 256/2048 token wordlists + Merkle verification
├── mnemonic.js       # Entropy ↔ mnemonic ↔ seed conversion
├── crypto.js         # SHA-256, PBKDF2, HMAC-SHA512 primitives
├── derivation.js     # Master key + derivation paths
└── agent-identity.js # High-level agent identity generation
```

### Identity Generation Flow

```
Entropy (32 bytes)
    ↓
Mnemonic (32 words: esu-gate, sango-volt, ...)
    ↓
Seed (64 bytes via PBKDF2-HMAC-SHA512)
    ↓
Master Key + Chain Code (HMAC-SHA512)
    ↓
Agent ID (SHA-256) | Odù (XOR) | Elements (Affix mapping)
```

---

## 2. Wordspace Analysis (`wordspace.js`)

### Token Structure

| Component | Count | Pattern |
|-----------|-------|---------|
| ROOTS | 16 | Yoruba deities: esu, sango, ogun, oya, yemoja, osun, obatala, orunmila, egungun, ori, ile, omi, ina, afeefe, igi, irawo |
| AFFIXES | 16 | Tech-spiritual: gate, volt, forge, stream, tide, veil, crown, mirror, path, seal, code, sigil, drum, thunder, river, dawn |
| SUBTONES | 8 | Greek: alpha, beta, gamma, delta, epsilon, zeta, eta, theta |
| BASE256 | 256 | `{root}-{affix}` (e.g., `esu-gate`) |
| EXP2048 | 2048 | `{root}-{affix}~{subtone}` (e.g., `esu-gate~alpha`) |

### Integrity Verification

```javascript
export const WORDLIST256_MERKLE_ROOT =
  '0ab1fafa074065c86877877f828499a8649b558457000f0ede436730eeb9da89';
```

The wordlist has a pinned Merkle root for integrity verification. The `verifyWordlistIntegrity()` function computes the Merkle root and compares against the pinned value.

### Affix Metadata

Each affix carries element/ritual/ethic/sigil metadata:

```javascript
gate: {
  element: 'Earth',
  ritual_cue: 'draw crossroads',
  ethical_tag: 'threshold',
  sigil_seed: 'cross+dot'
}
```

**Element Distribution:**
- Earth: gate, path, drum (threshold, journey, rhythm)
- Fire: volt, forge, thunder (force, craft, judgment)
- Water: stream, tide, river (flow, return, cleansing)
- Air: veil, mirror, code (reveal/conceal, truth, syntax)
- Ether: crown, sigil, seal, dawn (mercy, intent, binding, beginning)

---

## 3. Mnemonic Engine (`mnemonic.js`)

### Entropy Modes

| Mode | Bits per Word | Checksum | Word Count |
|------|---------------|----------|------------|
| 256 | 8 bits | ENT/32 bits | ENT/8 |
| 2048 | 11 bits | ENT/32 bits | ceil((ENT + ENT/32) / 11) |

Supported entropy sizes: 128, 160, 192, 224, 256 bits

### Key Functions

#### `entropyToMnemonic(entropy, mode)`
1. SHA-256 hash of entropy for checksum
2. Bit packing: entropy + checksum bits
3. Padding to word boundary
4. Index mapping to BASE256 or EXP2048

#### `mnemonicToEntropy(words, mode)`
Reverse operation with checksum validation. Iterates through supported ENT sizes and validates checksum via constant-time comparison.

#### `mnemonicToSeed(mnemonic, passphrase)`
PBKDF2-HMAC-SHA512 with:
- Salt: `"BIPỌ̀N39 seed" + " Ọ̀RÍ:" + passphrase`
- Iterations: 2048
- Output: 64 bytes

**Security Note:** Uses `zeroize()` to clear sensitive intermediates from memory.

#### `oduPrimaryIndex(words, mode)`
XOR reduction of word indices → 0-255. This serves as the agent's archetypal routing key.

#### `elementalSignature(words)`
Counts elements across all words based on affix metadata. Used for capability derivation.

#### `sabbathGate(date, override, trustedDay)`
Temporal governance: queues irreversible writes on Saturday (UTC day 6).

---

## 4. Crypto Primitives (`crypto.js`)

| Function | Implementation | Purpose |
|----------|----------------|---------|
| `sha256(data)` | `crypto.createHash('sha256')` | Checksum, agent ID |
| `pbkdf2HmacSha512(password, salt, iters, dkLen)` | `crypto.pbkdf2Sync()` | Seed derivation |
| `hmacSha512(key, data)` | `crypto.createHmac('sha512')` | Master key derivation |
| `timingSafeEq(a, b)` | `crypto.timingSafeEqual()` | Constant-time compare |
| `zeroize(buf)` | `buf.fill(0)` | Memory clearing |
| `bufToHex(buf)` | Custom | Hex encoding |
| `hexToBytes(hex)` | Custom | Hex decoding |

**Assessment:** All primitives use Node.js built-in crypto (FIPS-validated algorithms). No external dependencies.

---

## 5. Key Derivation (`derivation.js`)

### Master Key Generation

```javascript
masterFromSeed(seed, label):
  hmacKey = label === 'bitcoin' ? 'Bitcoin seed' : 'BIPỌ̀N39 master'
  I = HMAC-SHA512(hmacKey, seed)
  return {
    key: I[0:32],      // Master private key
    chainCode: I[32:64] // Chain code for child derivation
  }
```

### Derivation Paths

```javascript
PATHS = {
  EVM:     "m/44'/60'/0'/0/0",
  Bitcoin: "m/44'/0'/0'/0/0" (p44), "m/84'/0'/0'/0/0" (p84),
  Solana:  "m/44'/501'/0'/0'/0'",
  Sui:     "m/44'/784'/0'/0'/0'",
}

AGENT_PATH = {
  identity: "m/86'/8639'/0'/0/0",  // Purpose 86, Coin 8639
  signing:  "m/86'/8639'/0'/1/0",
  comms:    "m/86'/8639'/0'/2/0",
}
```

**Note:** Swibe uses custom purpose 86 (agent identity) and coin type 8639 (BIPỌ̀N39).

---

## 6. Agent Identity (`agent-identity.js`)

### `generateAgentIdentity(entropy, options)`

Returns complete identity object:

```javascript
{
  agentId: "sha256_hex_64_chars",
  mnemonic: ["esu-gate", "sango-volt", ...],
  mode: "256",
  odu: 42,  // 0-255 archetype
  elements: { Fire: 5, Water: 3, Earth: 1, Air: 2, Ether: 1 },
  dominantElement: "Fire",
  ritualTokens: [{ id, word, root, affix, element, ritual_cue, ... }],
  paths: {
    identity: "m/86'/8639'/0'/0/0",
    signing: "m/86'/8639'/0'/1/0",
    comms: "m/86'/8639'/0'/2/0",
  },
  masterKey: Uint8Array(32),
  chainCode: Uint8Array(32),
  created: timestamp
}
```

### `deriveCapabilities(odu, elements)`

Maps elemental dominance to agent affinities:

| Element | Affinities |
|---------|------------|
| Fire | execution: 1.0, speed: 0.8, persistence: 0.3 |
| Water | routing: 1.0, flow: 0.8, adaptation: 0.7 |
| Earth | storage: 1.0, stability: 0.9, persistence: 0.8 |
| Air | analysis: 1.0, reasoning: 0.8, communication: 0.7 |
| Ether | coordination: 1.0, governance: 0.8, synthesis: 0.7 |

### `signMessage(masterKey, message)`

HMAC-SHA256 message authentication (lightweight, not blockchain signature).

### `agentAddress(agentId)`

Returns `swibe://` URI with first 40 hex chars of agent ID.

---

## 7. Test Coverage Analysis

### Test Breakdown (35 tests)

| Category | Tests | Status |
|----------|-------|--------|
| Wordspace | 7 | All pass |
| Mnemonic | 7 | All pass |
| Sabbath Gate | 3 | All pass |
| Merkle Root | 2 | All pass |
| Derivation | 3 | All pass |
| Pinned Vectors | 6 | All pass |
| Agent Identity | 7 | All pass |

### Pinned Test Vectors

The test suite includes pinned vectors for conformance:

```javascript
VECTOR_256 = {
  entropy: '000102030405060708090a0b0c0d0e0f...',
  mnemonic: ['esu-gate', 'esu-volt', ...],  // 32 words
  seed_no_pass: '7671a6d7ba40d24c3f70826b4e0cc74e...',
  master_native: {
    IL: '1b5aaa24b346dda8f187de09fc8dc3bb...',
    IR: '3779555de6c42cd658a4369765ae5b30...'
  }
}
```

All vectors verified against reference implementation.

---

## 8. Security Assessment

### Strengths

1. **Deterministic Identity:** Same entropy = same agent forever (reproducible, auditable)
2. **Memory Safety:** `zeroize()` clears sensitive intermediates
3. **Constant-Time Compare:** `timingSafeEq()` prevents timing attacks
4. **Merkle Verification:** Wordlist integrity verifiable
5. **Sabbath Gate:** Temporal governance for irreversible operations
6. **No External Dependencies:** All crypto from Node.js built-in

### Potential Concerns

| Issue | Severity | Status |
|-------|----------|--------|
| PBKDF2 iterations (2048) | Low | Acceptable for agent identity; could increase to 20480 for higher security |
| HMAC-SHA256 signatures | Info | Lightweight auth, not blockchain-grade; appropriate for internal use |
| No hardware security module support | Info | Could add HSM/YubiKey integration for production deployments |

---

## 9. Cultural Integration

The BIPỌ̀N39 system uniquely integrates Yoruba cosmology with cryptographic identity:

- **16 ROOTS:** Orisha pantheon (Èṣù, Ṣàngó, Ogun, Ọya, Yemoja, Ọṣun, Ọbàtálá, Ọ̀rúnmìlà, etc.)
- **Odù:** Primary index (0-255) references the 256 Odù Ifá
- **Elements:** Fire/Water/Earth/Air/Ether mapping to agent capabilities
- **Sabbath Gate:** Ọbàtálá day (Saturday) governance
- **Ọ̀RÍ Passphrase:** Personal head/destiny marker

This is not merely aesthetic—the ritual metadata provides semantic grounding for agent behavior and ethical reasoning.

---

## 10. Recommendations

### Immediate Actions
None required. The engine is production-ready.

### Future Enhancements

1. **Increase PBKDF2 iterations** to 20,480 for higher security margin
2. **Add Ed25519 signing** for blockchain-native signatures (Sui Move integration)
3. **Add HSM support** for hardware-backed key storage
4. **Add mnemonic validation UI** for agent recovery verification
5. **Document ritual semantics** for developers building ethics layers

---

## 11. Conclusion

**BIPỌ̀N39 is a sophisticated, production-ready identity engine** that successfully:

- Implements BIP-39 style deterministic identity
- Integrates cultural cosmology with cryptographic primitives
- Provides comprehensive test coverage (35/35 passing)
- Maintains security best practices (zeroize, timing-safe compare)
- Enables agent capability derivation from archetypal signatures

The engine is well-documented, has no critical vulnerabilities, and demonstrates thoughtful design that bridges technical and cultural domains.

**Rating:** APPROVED for production use.

---

*Reviewed by Claude Code*
*Àṣẹ. 🕊️*
