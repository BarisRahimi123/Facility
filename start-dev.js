const { spawn } = require('child_process');
const path = require('path');

// Find the next binary
const nextBinPath = path.join(__dirname, 'node_modules', '.bin', 'next');

console.log(`Starting Next.js server with binary: ${nextBinPath}`);

// Spawn the next dev process
const nextProcess = spawn(nextBinPath, ['dev'], {
  stdio: 'inherit',
  env: {
    ...process.env,
    // Add some environment variables that might help
    DEBUG: '*',
    NODE_ENV: 'development',
    // Add polling for file system changes (helpful in some environments)
    WATCHPACK_POLLING: '500',
  },
});

// Handle process events
nextProcess.on('error', (err) => {
  console.error('Failed to start Next.js process:', err);
});

nextProcess.on('close', (code) => {
  console.log(`Next.js process exited with code ${code}`);
});

// Log some useful info
console.log('Next.js development server starting...');
console.log('Working directory:', process.cwd());
console.log('Node version:', process.version);

// Handle termination signals
process.on('SIGINT', () => {
  console.log('Received SIGINT signal, shutting down...');
  nextProcess.kill('SIGINT');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Received SIGTERM signal, shutting down...');
  nextProcess.kill('SIGTERM');
  process.exit(0);
}); 