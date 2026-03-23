/**
 * Go Backend for Swibe
 * Target: Goroutine Workers & Channels
 */

export function genGo(node, indent = "") {
  if (!node) return '';

  switch (node.type) {
    case 'Program': {
      let code = `package main\n\n`;
      code += `import (\n  "context"\n  "crypto/aes"\n  "crypto/cipher"\n  "crypto/ed25519"\n  "crypto/rand"\n  "crypto/sha256"\n  "encoding/hex"\n  "fmt"\n  "strings"\n  "sync"\n  "time"\n)\n\n`;
      code += `type Keypair struct { Pub string; Priv string }\n`;
      code += `type Encrypted struct { Iv string; Content string; Tag string }\n`;
      code += `type Vault struct { Mnemonic []string; Creds map[string]string; BornAt string }\n\n`;
      code += `func bipon39_entropyToMnemonic(e []byte, b string) []string { return []string{"esu-gate"} }\n`;
      code += `func bipon39_mnemonicToSeed(p string) []byte { return make([]byte, 64) }\n`;
      code += `func gen_ritual_keypair(s []byte) Keypair {\n  pub, priv, _ := ed25519.GenerateKey(rand.Reader)\n  return Keypair{hex.EncodeToString(pub), hex.EncodeToString(priv)}\n}\n`;
      code += `func aes_gcm_encrypt(d string, s []byte) Encrypted {\n  block, _ := aes.NewCipher(s[:32])\n  gcm, _ := cipher.NewGCM(block)\n  iv := make([]byte, gcm.NonceSize())\n  rand.Read(iv)\n  sealed := gcm.Seal(nil, iv, []byte(d), nil)\n  return Encrypted{hex.EncodeToString(iv), hex.EncodeToString(sealed[:len(sealed)-gcm.Overhead()]), hex.EncodeToString(sealed[len(sealed)-gcm.Overhead():])}\n}\n`;
      code += `func aes_gcm_decrypt(e Encrypted, s []byte) string { return "{}" }\n`;
      code += `func ed25519_sign(p string, k string) string { return "sig" }\n`;
      code += `func ed25519_verify(sig string, payload string, pub string) bool {\n  // TODO: SECURITY — always returns true\n  // Replace before production deployment\n  panic("ed25519_verify stub — not for production")\n}\n`;
      code += `func join(v []string, s string) string { return strings.Join(v, s) }\n`;
      code += `func trace(m string) { fmt.Printf("[TRACE] %s\\n", m) }\n\n`;
      code += `var json = struct {\n  Stringify func(interface{}) string\n  Parse func(string) Vault\n}{\n  Stringify: func(v interface{}) string { return "{}" },\n  Parse: func(s string) Vault { return Vault{} },\n}\n\n`;
      code += `var crypto_struct = struct {\n  RandomBytes func(int) []byte\n}{\n  RandomBytes: func(n int) []byte { b := make([]byte, n); rand.Read(b); return b },\n}\n\n`;
      code += `var rag = struct {\n  Save func(string, interface{}) \n}{\n  Save: func(k string, v interface{}) {},\n}\n\n`;
      code += `func Think(prompt string) string {\n  fmt.Printf("[GO-THINK] %s...\\n", prompt[:10])\n  return "Àṣẹ"\n}\n\n`;

      const functionDecls = node.statements.filter(s => s.type === 'FunctionDecl' || s.type === 'SkillDecl');
      code += functionDecls.map(s => genGo(s, "")).join('\n\n');

      const hasMain = node.statements.some(s => s.type === 'FunctionDecl' && s.name === 'main');
      if (!hasMain) {
        code += `\nfunc main() {\n`;
        code += `    fmt.Println("Swibe Sovereign Birth Ritual (Go Backend)")\n`;
        code += `    var wg sync.WaitGroup\n`;
        code += node.statements.filter(s => s.type !== 'FunctionDecl' && s.type !== 'SkillDecl').map(s => genGo(s, "    ")).join('\n');
        code += `    wg.Wait()\n`;
        code += `}\n`;
      }
      return code;

    }
    case 'FunctionDecl': {
      const params = node.params.map(p => `${p.name} interface{}`).join(', ');
      return `${indent}func ${node.name}(${params}) {\n` +
        genGo(node.body, indent + "    ") +
        `\n${indent}}`;

    }
    case 'Block':
      return node.statements.map(s => {
          const g = genGo(s, indent);
          if (s.type === 'FunctionCall' || s.type === 'MethodCall' || s.type === 'VariableDecl') {
              return g;
          }
          return g;
      }).join('\n');

    case 'VariableDecl':
      return `${indent}${node.name} := ${genGo(node.value, "")}`;

    case 'Return':
      return `${indent}return ${genGo(node.value, "")}`;

    case 'FunctionCall': {
      const fName = node.name;
      if (fName === 'think') return `${indent}Think(${node.args.map(a => genGo(a, "")).join(', ')})`;
      if (fName === 'println') return `${indent}fmt.Println(${node.args.map(a => genGo(a, "")).join(', ')})`;
      return `${indent}${fName}(${node.args.map(a => genGo(a, "")).join(', ')})`;

    }
    case 'MethodCall': {
      const obj = genGo(node.object);
      if (obj === 'crypto' && node.method === 'randomBytes') {
          return `${indent}crypto_struct.RandomBytes(${node.args.map(a => genGo(a, "")).join(', ')})`;
      }
      if (obj === 'json' || obj === 'rag') {
          return `${indent}${obj}.${node.method.charAt(0).toUpperCase() + node.method.slice(1)}(${node.args.map(a => genGo(a, "")).join(', ')})`;
      }
      if (obj === 'SovereignRitual' && node.method === 'actions') {
          return `${indent}SovereignRitual{}.Actions()`;
      }
      return `${indent}${obj}.${node.method.charAt(0).toUpperCase() + node.method.slice(1)}(${node.args.map(a => genGo(a, "")).join(', ')})`;

    }
    case 'SkillDecl': {
      let skillGo = `${indent}type ${node.name} struct {}\n`;
      skillGo += `${indent}func (s ${node.name}) Actions() {\n`;
      skillGo += node.body.map(s => genGo(s, indent + "    ")).join('\n');
      skillGo += `\n${indent}}`;
      return skillGo;

    }
    case 'SecureBlock':
      return `${indent}go func() {\n${indent}    ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)\n${indent}    defer cancel()\n${indent}    _ = ctx\n` +
        genGo(node.body, indent + "    ") +
        `\n${indent}}()`;

    case 'MetaDigital':
      return `${indent}fmt.Println("[GO] Running Meta-Digital: ${node.name}")`;

    case 'FieldAccess':
      return `${genGo(node.object)}.${node.field.charAt(0).toUpperCase() + node.field.slice(1)}`;

    case 'DictLiteral':
      // Very basic map literal for Go
      return `map[string]interface{}{${Object.entries(node.fields).map(([k, v]) => `"${k}": ${genGo(v, "")}`).join(', ')}}`;

    case 'If': {
      let ifGo = `${indent}if ${genGo(node.condition)} {\n${genGo(node.thenBranch, indent + "    ")}\n${indent}}`;
      if (node.elseBranch) {
        ifGo += ` else {\n${genGo(node.elseBranch, indent + "    ")}\n${indent}}`;
      }
      return ifGo;

    }
    case 'BinaryOp':
      return `(${genGo(node.left, "")} ${node.op} ${genGo(node.right, "")})`;

    case 'SwarmStatement': {
      let swarmCode = `${indent}// Swarm Initiation: Goroutines\n`;
      node.steps.forEach(step => {
        swarmCode += `${indent}wg.Add(1)\n`;
        swarmCode += `${indent}go func() {\n`;
        swarmCode += `${indent}    defer wg.Done()\n`;
        swarmCode += `${indent}    fmt.Println("[GO] Birthing Agent ${step.name}...")\n`;
        swarmCode += `${indent}}()\n`;
      });
      return swarmCode;

    }
    case 'Boolean':
      return node.value ? 'true' : 'false';

    case 'Nil':
      return 'nil';

    case 'Number':
      return String(node.value);

    case 'String':
      return `"${node.value.replace(/\n/g, "\\n")}"`;

    case 'Identifier':
      return node.name;

    default:
      return `${indent}// [GO-GEN] Unhandled: ${node.type}`;
  }
}
