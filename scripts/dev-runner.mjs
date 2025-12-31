#!/usr/bin/env node
/**
 * Dev runner to build the vault once, then keep a watcher and Vite running.
 */

import { spawn, spawnSync } from 'node:child_process';

const processes = [
  { name: 'watch', command: 'npm', args: ['run', 'watch:vault'] },
  { name: 'vite', command: 'npm', args: ['run', 'dev:app'] },
];

const colors = ['\x1b[35m', '\x1b[36m'];
const reset = '\x1b[0m';

function log(name, color, message) {
  process.stdout.write(`${color}[${name}]${reset} ${message}`);
}

const children = [];

function startProcess(index) {
  const { name, command, args } = processes[index];
  const color = colors[index % colors.length];
  const child = spawn(command, args, { stdio: ['inherit', 'pipe', 'pipe'], env: process.env });
  children.push(child);

  child.stdout.on('data', chunk => log(name, color, chunk));
  child.stderr.on('data', chunk => log(name, color, chunk));

  child.on('exit', code => {
    log(name, color, `exited with code ${code ?? 'null'}\n`);
    shutdown();
  });
}

function shutdown() {
  while (children.length) {
    const child = children.pop();
    if (child && !child.killed) {
      child.kill('SIGTERM');
    }
  }
  process.exit(0);
}

function buildOnce() {
  const result = spawnSync('npm', ['run', 'build:vault'], { stdio: 'inherit', env: process.env });
  if (result.status !== 0) {
    console.error('Initial vault build failed. Exiting.');
    process.exit(result.status ?? 1);
  }
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

buildOnce();
processes.forEach((_, idx) => startProcess(idx));
