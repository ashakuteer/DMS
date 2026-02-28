#!/usr/bin/env node
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

console.log('Starting NGO Donor Management System...');

// Start NestJS API
const api = spawn('npx', ['ts-node', '-r', 'tsconfig-paths/register', 'src/main.ts'], {
  cwd: join(__dirname, 'apps/api'),
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, NODE_ENV: 'development' }
});

// Wait a bit then start Next.js
setTimeout(() => {
  const web = spawn('npx', ['next', 'dev', '-p', '5000'], {
    cwd: join(__dirname, 'apps/web'),
    stdio: 'inherit',
    shell: true,
    env: { ...process.env, NODE_ENV: 'development' }
  });

  web.on('error', (err) => {
    console.error('Web app error:', err);
  });
}, 3000);

api.on('error', (err) => {
  console.error('API error:', err);
});

process.on('SIGINT', () => {
  console.log('Shutting down...');
  process.exit(0);
});
