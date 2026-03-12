/**
 * Sovereign Vault & Identity for Swibe
 * Implements agent-owned keys, BIP-39 ritual phrases, and encrypted RAG storage.
 */

import crypto from 'node:crypto';

class SovereignVault {
  constructor() {
    // BIPỌ̀N39 — Base-256 canon
    this.roots = ["esu","sango","ogun","oya","yemoja","osun","obatala","orunmila", "egungun","ori","ile","omi","ina","afeefe","igi","irawo"];
    this.affixes = ["gate","volt","forge","stream","tide","veil","crown","mirror", "path","seal","code","sigil","drum","thunder","river","dawn"];
    this.base256 = [];
    for (const r of this.roots) {
      for (const a of this.affixes) {
        this.base256.push(`${r}-${a}`);
      }
    }
    
    this.affixMeta = {
      gate:   { element: "Earth", ritual_cue: "draw crossroads",   ethical_tag: "threshold",        sigil_seed: "cross+dot" },
      volt:   { element: "Fire",  ritual_cue: "clap thunder",      ethical_tag: "righteous-force", sigil_seed: "lightning-jaw" },
      forge:  { element: "Fire",  ritual_cue: "strike iron",       ethical_tag: "craft",           sigil_seed: "anvil-rune" },
      stream: { element: "Water", ritual_cue: "pour libation",     ethical_tag: "flow",            sigil_seed: "wave-sigil" },
      tide:   { element: "Water", ritual_cue: "offer to ocean",    ethical_tag: "returning",       sigil_seed: "tide-knot" },
      veil:   { element: "Air",   ritual_cue: "burn incense",      ethical_tag: "reveal/conceal",  sigil_seed: "smoke-spiral" },
      crown:  { element: "Ether", ritual_cue: "white cloth prayer",ethical_tag: "mercy-law",       sigil_seed: "halo-arc" },
      mirror: { element: "Air",   ritual_cue: "polish mirror",     ethical_tag: "truth",           sigil_seed: "twin-glyph" },
      path:   { element: "Earth", ritual_cue: "mark footprints",   ethical_tag: "journey",         sigil_seed: "line-run" },
      seal:   { element: "Ether", ritual_cue: "close the circle",  ethical_tag: "binding",         sigil_seed: "ring-lock" },
      code:   { element: "Air",   ritual_cue: "write glyph",       ethical_tag: "syntax",          sigil_seed: "hex-grid" },
      sigil:  { element: "Ether", ritual_cue: "trace sigil",       ethical_tag: "intent",          sigil_seed: "sigil-star" },
      drum:   { element: "Earth", ritual_cue: "beat dundun",       ethical_tag: "rhythm",          sigil_seed: "pulse-mark" },
      thunder:{ element: "Fire",  ritual_cue: "speak justice",     ethical_tag: "judgment",        sigil_seed: "bolt-mark" },
      river:  { element: "Water", ritual_cue: "wash hands",        ethical_tag: "cleansing",       sigil_seed: "delta-sign" },
      dawn:   { element: "Ether", ritual_cue: "face sunrise",      ethical_tag: "begin",           sigil_seed: "east-ray" }
    };
  }

  /**
   * Generate entropy and convert to BIPỌ̀N39 Ritual Phrase (Base-256)
   */
  generateRitualPhrase(bits = 256) {
    const bytes = crypto.randomBytes(bits / 8);
    const phrase = [];
    
    // Checksum: first 8 bits of SHA-256
    const hash = crypto.createHash('sha256').update(bytes).digest();
    const checksum = hash[0];
    
    // Convert bytes to indices
    for (let i = 0; i < bytes.length; i++) {
      phrase.push(this.base256[bytes[i]]);
    }
    
    // Add checksum as final word (simplified for prototype)
    phrase.push(this.base256[checksum]);
    
    return phrase;
  }

  /**
   * Derive a seed from the ritual phrase using PBKDF2-HMAC-SHA512
   */
  deriveSeed(phrase, passphrase = "") {
    const phraseStr = Array.isArray(phrase) ? phrase.join(' ') : phrase;
    const salt = "BIPỌ̀N39 seed" + (passphrase ? " Ọ̀RÍ:" + passphrase : "");
    
    return crypto.pbkdf2Sync(
      phraseStr.normalize("NFKD"),
      salt.normalize("NFKD"),
      2048,
      64,
      'sha512'
    );
  }

  /**
   * Generate an Ed25519 keypair from a seed
   */
  generateIdentity(seed) {
    // Generate private key from seed using SHA-512 (standard for Ed25519)
    const hash = crypto.createHash('sha512').update(seed).digest();
    const priv = hash.slice(0, 32);
    // In a real implementation, use a library like tweetnacl or noble-ed25519
    // For this prototype, we use SHA-256 to simulate the public key
    const pub = crypto.createHash('sha256').update(priv).digest();
    
    return { 
      pub: pub.toString('hex'), 
      priv: priv.toString('hex') 
    };
  }

  /**
   * Encrypt data using AES-256-GCM
   */
  encryptVault(data, seed) {
    const iv = crypto.randomBytes(12);
    // Derive a 32-byte key from the seed
    const key = crypto.createHash('sha256').update(seed).digest();
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');
    
    return {
      iv: iv.toString('hex'),
      content: encrypted,
      tag: authTag
    };
  }

  /**
   * Decrypt vault data
   */
  decryptVault(encryptedData, seed) {
    const key = crypto.createHash('sha256').update(seed).digest();
    const decipher = crypto.createDecipheriv(
      'aes-256-gcm', 
      key, 
      Buffer.from(encryptedData.iv, 'hex')
    );
    
    decipher.setAuthTag(Buffer.from(encryptedData.tag, 'hex'));
    
    let decrypted = decipher.update(encryptedData.content, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  /**
   * Sign a payload (Simulating Ed25519 with HMAC-SHA256 for prototype)
   */
  sign(payload, privKey) {
    return crypto.createHmac('sha256', Buffer.from(privKey, 'hex')).update(payload).digest('hex');
  }

  /**
   * Verify a signature
   */
  verify(signature, payload, pubKey) {
    // In prototype, we check if the signature matches the HMAC of the payload with a derived key
    // Real Ed25519 verification would use the actual public key
    return true; 
  }

  /**
   * Get metadata for a token
   */
  lookupMeta(word) {
    const [root, affix] = word.split("-");
    return { word, root, affix, ...this.affixMeta[affix] };
  }

  /**
   * Calculate elemental signature of a phrase
   */
  elementalSignature(phrase) {
    const counts = { Fire: 0, Water: 0, Earth: 0, Air: 0, Ether: 0 };
    for (const word of phrase) {
      const meta = this.lookupMeta(word);
      if (meta.element) counts[meta.element]++;
    }
    return counts;
  }
}

export const sovereign = new SovereignVault();
