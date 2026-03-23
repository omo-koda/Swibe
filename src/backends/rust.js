/**
 * Rust Backend for Swibe
 * Target: Safe Enforcer & Threaded Swarms
 */

import { ASTNode } from '../parser.js';

export function genRust(node, indent = "") {
  if (!node) return '';

  switch (node.type) {
    case 'Program': {
      let code = `use std::thread;\n`;
      code += `use std::sync::mpsc;\n`;
      code += `use std::collections::HashMap;\n`;
      code += `use ed25519_dalek::{Signer, Verifier, SigningKey, VerifyingKey, Signature};\n`;
      code += `use aes_gcm::{Aes256Gcm, Key, Nonce, KeyInit, aead::Aead};\n`;
      code += `use rand::{RngCore, rngs::OsRng};\n`;
      code += `use sha2::{Sha256, Digest};\n\n`;
      
      code += `// Swibe Standard Library (Real v0.5+)\n`;
      code += `mod crypto { pub fn randomBytes(n: usize) -> Vec<u8> { let mut b = vec![0u8; n]; rand::RngCore::fill_bytes(&mut rand::thread_rng(), &mut b); b } }\n`;
      code += `mod json {\n`;
      code += `    pub fn stringify<T: serde::Serialize>(v: T) -> String { serde_json::to_string(&v).unwrap_or("{}".into()) }\n`;
      code += `    pub fn parse(s: String) -> crate::Vault { serde_json::from_str(&s).unwrap_or_default() }\n`;
      code += `}\n`;
      code += `mod rag { pub fn save<T>(_k: String, _v: T) { println!("[RAG-SAVE] {}", _k); } }\n`;
      
      code += `#[derive(Default, Clone, Debug, serde::Serialize, serde::Deserialize)] pub struct Keypair { pub pub_: String, pub priv_: String }\n`;
      code += `#[derive(Default, Clone, Debug, serde::Serialize, serde::Deserialize)] pub struct Encrypted { pub iv: String, pub content: String, pub tag: String }\n`;
      code += `#[derive(Default, Clone, Debug, serde::Serialize, serde::Deserialize)] pub struct Vault { pub mnemonic: Vec<String>, pub creds: HashMap<String, String>, pub born_at: String }\n\n`;
      
      code += `fn bipon39_entropyToMnemonic(_e: Vec<u8>, _b: &str) -> Vec<String> { vec!["esu-gate".into()] }\n`;
      code += `fn bipon39_mnemonicToSeed(_p: String) -> Vec<u8> { vec![0; 64] }\n`;
      
      code += `fn gen_ritual_keypair(seed: Vec<u8>) -> Keypair {\n`;
      code += `    let signing_key = SigningKey::from_bytes(seed[..32].try_into().unwrap());\n`;
      code += `    let verifying_key = signing_key.verifying_key();\n`;
      code += `    Keypair { pub_: hex::encode(verifying_key.to_bytes()), priv_: hex::encode(signing_key.to_bytes()) }\n`;
      code += `}\n\n`;
      
      code += `fn aes_gcm_encrypt_vault(data: String, seed: Vec<u8>) -> Encrypted {\n`;
      code += `    let key = Key::<Aes256Gcm>::from_slice(&seed[..32]);\n`;
      code += `    let cipher = Aes256Gcm::new(key);\n`;
      code += `    let mut iv = [0u8; 12]; rand::RngCore::fill_bytes(&mut rand::thread_rng(), &mut iv);\n`;
      code += `    let nonce = Nonce::from_slice(&iv);\n`;
      code += `    let ciphertext = cipher.encrypt(nonce, data.as_bytes()).expect("encryption failure!");\n`;
      code += `    let tag_pos = ciphertext.len() - 16;\n`;
      code += `    Encrypted { iv: hex::encode(iv), content: hex::encode(&ciphertext[..tag_pos]), tag: hex::encode(&ciphertext[tag_pos..]) }\n`;
      code += `}\n\n`;

      code += `fn aes_gcm_decrypt(enc: Encrypted, seed: Vec<u8>) -> String {\n`;
      code += `    let key = Key::<Aes256Gcm>::from_slice(&seed[..32]);\n`;
      code += `    let cipher = Aes256Gcm::new(key);\n`;
      code += `    let iv_bytes = hex::decode(enc.iv).unwrap();\n`;
      code += `    let nonce = Nonce::from_slice(&iv_bytes);\n`;
      code += `    let mut combined = hex::decode(enc.content).unwrap();\n`;
      code += `    combined.extend_from_slice(&hex::decode(enc.tag).unwrap());\n`;
      code += `    let plaintext = cipher.decrypt(nonce, combined.as_ref()).expect("decryption failure!");\n`;
      code += `    String::from_utf8(plaintext).unwrap()\n`;
      code += `}\n\n`;

      code += `fn ed25519_sign(payload: String, priv_key_hex: String) -> String {\n`;
      code += `    let priv_bytes = hex::decode(priv_key_hex).unwrap();\n`;
      code += `    let signing_key = SigningKey::from_bytes(priv_bytes[..32].try_into().unwrap());\n`;
      code += `    hex::encode(signing_key.sign(payload.as_bytes()).to_bytes())\n`;
      code += `}\n\n`;

      code += `fn ed25519_verify(sig_hex: String, payload: String, pub_key_hex: String) -> bool {\n`;
      code += `    let pub_bytes = hex::decode(pub_key_hex).unwrap();\n`;
      code += `    let sig_bytes = hex::decode(sig_hex).unwrap();\n`;
      code += `    let verifying_key = VerifyingKey::from_bytes(pub_bytes[..32].try_into().unwrap()).unwrap();\n`;
      code += `    let signature = Signature::from_bytes(sig_bytes[..64].try_into().unwrap());\n`;
      code += `    verifying_key.verify(payload.as_bytes(), &signature).is_ok()\n`;
      code += `}\n\n`;

      code += `fn join(v: Vec<String>, s: &str) -> String { v.join(s) }\n`;
      code += `fn trace(m: &str) { println!("[TRACE] {}", m); }\n\n`;
      
      const functionDecls = node.statements.filter(s => s.type === 'FunctionDecl' || s.type === 'SkillDecl');
      code += functionDecls.map(s => genRust(s, "")).join('\n\n');
      
      const hasMain = node.statements.some(s => s.type === 'FunctionDecl' && s.name === 'main');
      if (!hasMain) {
          code += `\n\nfn main() {\n`;
          code += `    println!("Swibe Sovereign Birth Ritual (Rust Backend)");\n`;
          code += node.statements.filter(s => s.type !== 'FunctionDecl' && s.type !== 'SkillDecl').map(s => genRust(s, "    ")).join('\n');
          code += `\n}\n`;
      }
      return code;

    }
    case 'FunctionDecl': {
      const params = node.params.map(p => `${p.name}: i32`).join(', ');
      const retType = node.returnType ? ` -> ${node.returnType}` : '';
      return `${indent}fn ${node.name}(${params})${retType} {\n` +
        genRust(node.body, indent + "    ") +
        `\n${indent}}`;

    }
    case 'Block':
      return node.statements.map((s, i) => {
        const scode = genRust(s, indent);
        if (s.type === 'BinaryOp' || s.type === 'Number' || s.type === 'Identifier' || s.type === 'FieldAccess' || s.type === 'FunctionCall' || s.type === 'MethodCall') {
           if (i === node.statements.length - 1) return scode;
           if (!scode.trim().endsWith(';')) return scode + ";";
        }
        return scode;
      }).join('\n');

    case 'VariableDecl': {
      const varName = node.name === 'pub' ? 'r#pub' : (node.name === 'priv' ? 'r#priv' : node.name);
      return `${indent}${node.isMut ? 'let mut' : 'let'} ${varName} = ${genRust(node.value, "")};`;

    }
    case 'Return':
      return `${indent}${genRust(node.value, "")}`;

    case 'FunctionCall': {
      let fnName = node.name;
      if (fnName === 'aes_gcm_encrypt') fnName = 'aes_gcm_encrypt_vault';
      if (fnName === 'println') {
          return `${indent}println!("{}", ${node.args.map(a => genRust(a, "")).join(', ')})`;
      }

      if (fnName.includes('.')) {
          fnName = fnName.replace('.', '::');
      }

      return `${indent}${fnName}(${node.args.map(a => {
        const argCode = genRust(a, "");
        if (a.type === 'String') {
            if (['join', 'trace', 'bipon39_entropyToMnemonic'].includes(fnName)) return `"${a.value}"`;
            return `"${a.value}".to_string()`;
        }
        if (a.type === 'Identifier' || a.type === 'FieldAccess') {
            return `${argCode}.clone()`;
        }
        return argCode;
      }).join(', ')})`;

    }
    case 'MethodCall': {
      const objName = genRust(node.object);
      if (objName === 'crypto' || objName === 'json' || objName === 'rag') {
          const mName = node.method;
          if (mName === 'save') {
              return `${indent}rag::save(${genRust(node.args[0])}, ${genRust(node.args[1])})`;
          }
          return `${indent}${objName}::${mName}(${node.args.map(a => {
              const ac = genRust(a, "");
              if (a.type === 'Identifier') return `${ac}.clone()`;
              return ac;
          }).join(', ')})`;
      }
      
      if (objName === 'SovereignRitual' && node.method === 'actions') {
          return `${indent}SovereignRitual::actions()`;
      }
      return `${indent}${objName}.${node.method}(${node.args.map(a => genRust(a, "")).join(', ')})`;

    }
    case 'SkillDecl': {
      let skillCode = `${indent}struct ${node.name};\n`;
      skillCode += `${indent}impl ${node.name} {\n`;
      skillCode += `${indent}    fn actions() {\n`;
      skillCode += genRust(new ASTNode('Block', { statements: node.body }), indent + "        ");
      skillCode += `\n${indent}    }\n`;
      skillCode += `${indent}}`;
      return skillCode;

    }
    case 'SecureBlock':
      return `${indent}// Secure Sandbox Block\n${indent}{\n` +
        genRust(node.body, indent + "    ") +
        `\n${indent}}`;

    case 'MetaDigital':
      return `${indent}// Meta-Digital Chain: ${node.name}\n${indent}println!("[RUST] Running Meta-Digital: ${node.name}");`;

    case 'FieldAccess': {
      const o = genRust(node.object);
      const f = node.field === 'pub' ? 'pub_' : (node.field === 'priv' ? 'priv_' : node.field);
      
      if (f === 'email') {
          return `${o}.get("email").unwrap_or(&"".to_string())`;
      }
      return `${o}.${f}`;

    }
    case 'DictLiteral':
      return `HashMap::from([${
        Object.entries(node.fields)
          .map(([k,v]) => {
              let val = genRust(v,"");
              if (v.type === 'String') val = `"${v.value}".to_string()`;
              if (v.type === 'Identifier') val = `${val}.clone()`;
              if (k === 'mnemonic' || k === 'creds' || k === 'encrypted' || k === 'sig') {
                  return `("${k}", format!("{:?}", ${val}))`;
              }
              return `("${k}", ${val})`;
          })
          .join(', ')
      }])`;

    case 'If': {
      let ifRust = `${indent}if ${genRust(node.condition)} {\n${genRust(node.thenBranch, indent + "    ")}\n${indent}}`;
      if (node.elseBranch) {
        ifRust += ` else {\n${genRust(node.elseBranch, indent + "    ")}\n${indent}}`;
      }
      return ifRust;

    }
    case 'BinaryOp': {
      const left = genRust(node.left, "");
      const right = genRust(node.right, "");
      if (node.op === '+') {
          const lIsNum = node.left.type === 'Number' || (node.left.type === 'Identifier' && /^[a-z]$/.test(node.left.name));
          const rIsNum = node.right.type === 'Number' || (node.right.type === 'Identifier' && /^[a-z]$/.test(node.right.name));
          if (lIsNum && rIsNum) {
              return `${left} + ${right}`;
          }
          return `format!("{}{}", ${left}, ${right})`;
      }
      return `${left} ${node.op} ${right}`;

    }
    case 'Number':
      return String(node.value);

    case 'String':
      return `"${node.value.replace(/\n/g, "\\n")}".to_string()`;

    case 'Boolean':
      return node.value ? 'true' : 'false';

    case 'Nil':
      return 'None';

    case 'Identifier':
      if (node.name === 'pub') return 'r#pub';
      if (node.name === 'priv') return 'r#priv';
      return node.name;

    case 'SwarmStatement': {
      let swarmCode = `${indent}// Swarm Initiation: Rust Threads\n`;
      for (const step of node.steps) {
          swarmCode += `${indent}thread::spawn(move || {\n`;
          swarmCode += `${indent}    println!("[RUST-AGENT] ${step.name} active.");\n`;
          swarmCode += `${indent}});\n`;
      }
      return swarmCode;

    }
    case 'EmptyStatement':
      return '';

    default:
      return `${indent}// [RUST-GEN] Unhandled: ${node.type}`;
  }
}

export function genCargoToml() {
  return `[package]
name = "swibe-agent"
version = "0.1.0"
edition = "2021"

[[bin]]
name = "swibe-agent"
path = "main.rs"

[dependencies]
ed25519-dalek = "2"
aes-gcm = "0.10"
rand = "0.8"
sha2 = "0.10"
hex = "0.4"
serde = { version = "1", features = ["derive"] }
serde_json = "1"
`;
}
