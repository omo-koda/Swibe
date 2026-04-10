export { OpenClawGenerator } from '../src/backends/openclaw.js';

export async function compileToOpenClaw(source) {
  const { Compiler } = await import('../src/compiler.js');
  const compiler = new Compiler(source, 'openclaw');
  return compiler.compile();
}

export async function deployToOpenClaw(source, outDir = './openclaw-out') {
  const { default: fs } = await import('node:fs');
  const { default: path } = await import('node:path');

  const result = await compileToOpenClaw(source);
  fs.mkdirSync(outDir, { recursive: true });

  for (const [file, content] of Object.entries(result.files)) {
    fs.writeFileSync(path.join(outDir, file), content);
    console.log(`[SWIBE-OPENCLAW] ${file}`);
  }

  return result;
}
