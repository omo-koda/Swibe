#!/usr/bin/env node
import { deployToOpenClaw } from './index.js';
import fs from 'node:fs';

const file = process.argv[2];
const outDir = process.argv[3] || './openclaw-out';

if (!file) {
  console.error('Usage: swibe-openclaw <file.swibe> [outdir]');
  process.exit(1);
}

const source = fs.readFileSync(file, 'utf-8');
await deployToOpenClaw(source, outDir);
console.log('[SWIBE-OPENCLAW] Done. Run: openclaw skill install ' + outDir);
