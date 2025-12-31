#!/usr/bin/env node
/**
 * Lightweight dev runner to keep DOCX ingestion in watch mode alongside Vite.
 *
 * Uses the existing Python watcher so we don't need extra JS dependencies.
 */

import { spawn } from 'node:child_process';

const processes = [
  { name: 'ingest', command: 'npm', args: ['run', 'ingest:watch'] },
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

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

processes.forEach((_, idx) => startProcess(idx));
