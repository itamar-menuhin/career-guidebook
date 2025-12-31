#!/usr/bin/env node
import { spawn } from 'node:child_process';
import chokidar from 'chokidar';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const VAULT_ROOT = path.join(ROOT, 'vault');

let running = false;
let pending = false;

function runBuild() {
  if (running) {
    pending = true;
    return;
  }

  running = true;
  const child = spawn('npm', ['run', 'build:vault'], { stdio: 'inherit', env: process.env });
  child.on('exit', () => {
    running = false;
    if (pending) {
      pending = false;
      runBuild();
    }
  });
}

const watcher = chokidar.watch('**/*.md', {
  cwd: VAULT_ROOT,
  ignoreInitial: true,
  ignored: ['**/_Templates/**', '**/.obsidian/**'],
});

watcher.on('all', (event, filePath) => {
  console.log(`[vault] ${event}: ${filePath}`);
  runBuild();
});

console.log('Watching vault for changes...');
