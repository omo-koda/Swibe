import { describe, it, expect } from 'vitest';
import {
  ROOTS, AFFIXES, BASE256, EXP2048,
  WORDLIST256_MERKLE_ROOT,
  merkleRoot256,
  verifyWordlistIntegrity,
  lookupMeta256,
  AFFIX_META,
} from '../src/bipon39/wordspace.js';
import {
  entropyToMnemonic,
  mnemonicToEntropy,
  mnemonicToSeed,
  reencodeMnemonic,
  bitsPerWord,
  oduPrimaryIndex,
  elementalSignature,
  sabbathGate,
} from '../src/bipon39/mnemonic.js';
import { masterFromSeed, PATHS, AGENT_PATH } from '../src/bipon39/derivation.js';
import {
  generateAgentIdentity,
  recoverAgentIdentity,
  signMessage,
  verifyMessage,
  deriveCapabilities,
  agentAddress,
} from '../src/bipon39/agent-identity.js';
import { bufToHex, hexToBytes } from '../src/bipon39/crypto.js';

describe('BIPON39 Wordspace', () => {
  it('generates exactly 256 BASE256 tokens', () => {
    expect(BASE256.length).toBe(256);
  });

  it('generates exactly 2048 EXP2048 tokens', () => {
    expect(EXP2048.length).toBe(2048);
  });

  it('has 16 roots and 16 affixes', () => {
    expect(ROOTS.length).toBe(16);
    expect(AFFIXES.length).toBe(16);
  });

  it('BASE256 tokens follow root-affix pattern', () => {
    expect(BASE256[0]).toBe('esu-gate');
    expect(BASE256[17]).toBe('sango-volt');
    expect(BASE256[255]).toBe('irawo-dawn');
  });

  it('EXP2048 tokens follow base~subtone pattern', () => {
    expect(EXP2048[0]).toBe('esu-gate~alpha');
    expect(EXP2048[7]).toBe('esu-gate~theta');
    expect(EXP2048[8]).toBe('esu-volt~alpha');
  });

  it('all BASE256 tokens are unique', () => {
    const set = new Set(BASE256);
    expect(set.size).toBe(256);
  });

  it('lookupMeta256 returns correct metadata', () => {
    const meta = lookupMeta256(0); // esu-gate
    expect(meta.word).toBe('esu-gate');
    expect(meta.root).toBe('esu');
    expect(meta.affix).toBe('gate');
    expect(meta.element).toBe('Earth');
    expect(meta.ritual_cue).toBe('draw crossroads');
  });

  it('every affix has metadata', () => {
    for (const affix of AFFIXES) {
      expect(AFFIX_META[affix]).toBeDefined();
      expect(AFFIX_META[affix].element).toBeDefined();
    }
  });
});

describe('BIPON39 Mnemonic', () => {
  it('roundtrips 256-mode for all ENT sizes', async () => {
    for (const ENT of [128, 160, 192, 224, 256]) {
      const ent = new Uint8Array(ENT / 8).map((_, i) => i);
      const words = await entropyToMnemonic(ent, '256');
      const back = await mnemonicToEntropy(words, '256');
      expect(bufToHex(back)).toBe(bufToHex(ent));

      const expected = Math.ceil((ENT + ENT / 32) / bitsPerWord('256'));
      expect(words.length).toBe(expected);
    }
  });

  it('roundtrips 2048-mode for all ENT sizes', async () => {
    for (const ENT of [128, 160, 192, 224, 256]) {
      const ent = new Uint8Array(ENT / 8).map((_, i) => 255 - i);
      const words = await entropyToMnemonic(ent, '2048');
      const back = await mnemonicToEntropy(words, '2048');
      expect(bufToHex(back)).toBe(bufToHex(ent));
    }
  });

  it('reencodes 256 -> 2048 preserving entropy', async () => {
    const ent = hexToBytes('000102030405060708090a0b0c0d0e0f');
    const w256 = await entropyToMnemonic(ent, '256');
    const w2048 = await reencodeMnemonic(w256, '256', '2048');
    const back = await mnemonicToEntropy(w2048, '2048');
    expect(bufToHex(back)).toBe(bufToHex(ent));
  });

  it('generates deterministic seed from mnemonic', async () => {
    const ent = hexToBytes('000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f');
    const words = await entropyToMnemonic(ent, '256');
    const seed1 = await mnemonicToSeed(words);
    const seed2 = await mnemonicToSeed(words);
    expect(bufToHex(seed1)).toBe(bufToHex(seed2));
  });

  it('passphrase changes the seed', async () => {
    const ent = hexToBytes('000102030405060708090a0b0c0d0e0f');
    const words = await entropyToMnemonic(ent, '256');
    const seed1 = await mnemonicToSeed(words, '');
    const seed2 = await mnemonicToSeed(words, 'river-mother');
    expect(bufToHex(seed1)).not.toBe(bufToHex(seed2));
  });

  it('computes Odu primary index (0-255)', async () => {
    const ent = new Uint8Array(32).fill(0);
    const words = await entropyToMnemonic(ent, '256');
    const odu = oduPrimaryIndex(words, '256');
    expect(odu).toBeGreaterThanOrEqual(0);
    expect(odu).toBeLessThanOrEqual(255);
  });

  it('computes elemental signature', async () => {
    const ent = new Uint8Array(32).fill(42);
    const words = await entropyToMnemonic(ent, '256');
    const sig = elementalSignature(words);
    expect(sig.Fire).toBeGreaterThanOrEqual(0);
    expect(sig.Water).toBeGreaterThanOrEqual(0);
    expect(sig.Earth).toBeGreaterThanOrEqual(0);
    expect(sig.Air).toBeGreaterThanOrEqual(0);
    expect(sig.Ether).toBeGreaterThanOrEqual(0);
    const total = sig.Fire + sig.Water + sig.Earth + sig.Air + sig.Ether;
    expect(total).toBe(words.length);
  });
});

describe('BIPON39 Sabbath Gate', () => {
  it('queues on Saturday', () => {
    expect(sabbathGate(new Date(), false, 6)).toBe('queue');
  });

  it('allows on other days', () => {
    for (const day of [0, 1, 2, 3, 4, 5]) {
      expect(sabbathGate(new Date(), false, day)).toBe('allow');
    }
  });

  it('council override allows Saturday', () => {
    expect(sabbathGate(new Date(), true, 6)).toBe('allow');
  });
});

describe('BIPON39 Merkle Root', () => {
  it('matches pinned constant', async () => {
    const root = await merkleRoot256();
    expect(root).toBe(WORDLIST256_MERKLE_ROOT);
  });

  it('verifies wordlist integrity', async () => {
    expect(await verifyWordlistIntegrity()).toBe(true);
  });
});

describe('BIPON39 Derivation', () => {
  it('derives master key from seed', async () => {
    const ent = hexToBytes('000102030405060708090a0b0c0d0e0f');
    const words = await entropyToMnemonic(ent, '256');
    const seed = await mnemonicToSeed(words);
    const master = masterFromSeed(seed, 'native');
    expect(master.key.length).toBe(32);
    expect(master.chainCode.length).toBe(32);
  });

  it('native and bitcoin labels produce different keys', async () => {
    const seed = new Uint8Array(64).fill(1);
    const native = masterFromSeed(seed, 'native');
    const btc = masterFromSeed(seed, 'bitcoin');
    expect(bufToHex(native.key)).not.toBe(bufToHex(btc.key));
  });

  it('has correct path formats', () => {
    expect(PATHS.EVM()).toBe("m/44'/60'/0'/0/0");
    expect(PATHS.Sui(1)).toBe("m/44'/784'/1'/0'/0'");
    expect(AGENT_PATH.identity(0)).toBe("m/86'/8639'/0'/0/0");
    expect(AGENT_PATH.signing(5)).toBe("m/86'/8639'/0'/1/5");
  });
});

describe('BIPON39 Pinned Test Vectors', () => {
  // Vectors from bipon39 repo vectors/vectors.json
  const VECTOR_256 = {
    entropy: '000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f',
    mnemonic: [
      'esu-gate','esu-volt','esu-forge','esu-stream','esu-tide','esu-veil','esu-crown','esu-mirror',
      'esu-path','esu-seal','esu-code','esu-sigil','esu-drum','esu-thunder','esu-river','esu-dawn',
      'sango-gate','sango-volt','sango-forge','sango-stream','sango-tide','sango-veil','sango-crown','sango-mirror',
      'sango-path','sango-seal','sango-code','sango-sigil','sango-drum','sango-thunder','sango-river','sango-dawn',
      'obatala-stream',
    ],
    seed_no_pass: '7671a6d7ba40d24c3f70826b4e0cc74e5d2db1fb3265579626e426a6110ea7ce74351476e3b855809bcc8a7776ace942eb69093c1d1bfe1bf9fd1cbc6afb75c0',
    master_native: {
      IL: '1b5aaa24b346dda8f187de09fc8dc3bbd5da6097f1f3004d622be052802aa6b1',
      IR: '3779555de6c42cd658a4369765ae5b30df72ebc0e8c32295ec0f541bcae7bb49',
    },
    seed_with_pass: 'c8161d08ad34fbc3e90ff4c51c7ef22e67ad7d62fd9d29aad544d345e51acf6d0383607a9c6ef6d98514e6cd2899d85de95d2b2d0709a80f701a77fd33105723',
    master_native_with_pass: {
      IL: 'cb5d5a012a7f69589af9b8a199851ab40e2cbf56c90728f877efc1b7cacb43c1',
      IR: 'a950c4470ffa4152b3f0c46459d5f6ce67695c67d8d4a6c5a4bc409903d8f187',
    },
  };

  it('entropy -> mnemonic matches pinned vector (256-mode, ENT=256)', async () => {
    const ent = hexToBytes(VECTOR_256.entropy);
    const words = await entropyToMnemonic(ent, '256');
    expect(words).toEqual(VECTOR_256.mnemonic);
  });

  it('mnemonic -> seed matches pinned vector (no passphrase)', async () => {
    const seed = await mnemonicToSeed(VECTOR_256.mnemonic);
    expect(bufToHex(seed)).toBe(VECTOR_256.seed_no_pass);
  });

  it('master key matches pinned vector (native label, no passphrase)', async () => {
    const seed = hexToBytes(VECTOR_256.seed_no_pass);
    const master = masterFromSeed(seed, 'native');
    expect(bufToHex(master.key)).toBe(VECTOR_256.master_native.IL);
    expect(bufToHex(master.chainCode)).toBe(VECTOR_256.master_native.IR);
  });

  it('seed with passphrase matches pinned vector', async () => {
    const seed = await mnemonicToSeed(VECTOR_256.mnemonic, 'river-mother');
    expect(bufToHex(seed)).toBe(VECTOR_256.seed_with_pass);
  });

  it('master key with passphrase matches pinned vector', async () => {
    const seed = hexToBytes(VECTOR_256.seed_with_pass);
    const master = masterFromSeed(seed, 'native');
    expect(bufToHex(master.key)).toBe(VECTOR_256.master_native_with_pass.IL);
    expect(bufToHex(master.chainCode)).toBe(VECTOR_256.master_native_with_pass.IR);
  });

  it('merkle root matches pinned vector', () => {
    expect(WORDLIST256_MERKLE_ROOT).toBe('0ab1fafa074065c86877877f828499a8649b558457000f0ede436730eeb9da89');
  });
});

describe('BIPON39 Agent Identity', () => {
  it('generates a complete agent identity', async () => {
    const identity = await generateAgentIdentity();
    expect(identity.agentId).toHaveLength(64); // SHA-256 hex
    expect(identity.mnemonic.length).toBeGreaterThan(0);
    expect(identity.odu).toBeGreaterThanOrEqual(0);
    expect(identity.odu).toBeLessThanOrEqual(255);
    expect(identity.elements).toBeDefined();
    expect(identity.dominantElement).toBeDefined();
    expect(identity.masterKey.length).toBe(32);
    expect(identity.chainCode.length).toBe(32);
  });

  it('same entropy produces same identity', async () => {
    const entropy = new Uint8Array(32).fill(7);
    const id1 = await generateAgentIdentity(entropy);
    const id2 = await generateAgentIdentity(entropy);
    expect(id1.agentId).toBe(id2.agentId);
    expect(id1.odu).toBe(id2.odu);
    expect(id1.mnemonic).toEqual(id2.mnemonic);
  });

  it('recovers identity from mnemonic', async () => {
    const entropy = new Uint8Array(32).fill(99);
    const original = await generateAgentIdentity(entropy);
    const recovered = await recoverAgentIdentity(original.mnemonic);
    expect(recovered.agentId).toBe(original.agentId);
    expect(recovered.odu).toBe(original.odu);
    expect(recovered.recovered).toBe(true);
  });

  it('signs and verifies messages', async () => {
    const identity = await generateAgentIdentity();
    const msg = 'hello from agent';
    const sig = signMessage(identity.masterKey, msg);
    expect(verifyMessage(identity.masterKey, msg, sig)).toBe(true);
    expect(verifyMessage(identity.masterKey, 'tampered', sig)).toBe(false);
  });

  it('generates agent address', async () => {
    const identity = await generateAgentIdentity();
    const addr = agentAddress(identity.agentId);
    expect(addr).toMatch(/^swibe:\/\/[0-9a-f]{40}$/);
  });

  it('derives capabilities from odu + elements', () => {
    const caps = deriveCapabilities(42, { Fire: 5, Water: 3, Earth: 1, Air: 2, Ether: 1 });
    expect(caps.primary.element).toBe('Fire');
    expect(caps.primary.execution).toBe(1.0);
    expect(caps.secondary.element).toBe('Water');
    expect(caps.sabbathAware).toBe(true);
  });
});
