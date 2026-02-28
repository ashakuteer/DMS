import { spawn } from 'child_process';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

console.log('🚀 Starting NGO Donor Management System...');
console.log('📡 API will run on port 3001');
console.log('🌐 Web will run on port 5000');

// Start NestJS API
const apiProcess = spawn('npx', ['nest', 'start', '--watch'], {
  cwd: join(__dirname, 'apps', 'api'),
  stdio: 'inherit',
  shell: true,
  env: { ...process.env }
});

// Start Next.js after a short delay to let NestJS start first
setTimeout(() => {
  const webProcess = spawn('npx', ['next', 'dev', '-p', '5000', '-H', '0.0.0.0'], {
    cwd: join(__dirname, 'apps', 'web'),
    stdio: 'inherit',
    shell: true,
    env: { ...process.env }
  });

  webProcess.on('error', (err) => {
    console.error('❌ Web error:', err);
  });

  webProcess.on('close', (code) => {
    console.log(`Web process exited with code ${code}`);
    apiProcess.kill();
    process.exit(code);
  });
}, 2000);

apiProcess.on('error', (err) => {
  console.error('❌ API error:', err);
});

process.on('SIGINT', () => {
  console.log('\\n👋 Shutting down...');
  apiProcess.kill();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\\n👋 Shutting down...');
  apiProcess.kill();
  process.exit(0);
});
