#!/usr/bin/env node

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const scriptPath = resolve(__dirname, 'seed-db-normalized.ts');

const child = spawn('npx', ['ts-node', '--esm', scriptPath], {
  stdio: 'inherit',
  shell: true
});

child.on('error', (error) => {
  console.error('Failed to start script:', error);
  process.exit(1);
});

child.on('close', (code) => {
  process.exit(code ?? 0);
});