const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Find the next binary
const nextBinPath = path.join(__dirname, 'node_modules', '.bin', 'next');

console.log(`Starting Next.js server on port 3000 with binary: ${nextBinPath}`);

// Check if the Next.js binary exists
if (!fs.existsSync(nextBinPath)) {
  console.error('Next.js binary not found at:', nextBinPath);
  console.log('Checking if npx is available...');
  
  // Use npx as fallback
  const npxProcess = spawn('npx', ['next', 'dev', '-p', '3000'], {
    stdio: 'inherit',
    env: {
      ...process.env,
      PORT: 3000,
      FORCE_COLOR: 1,
    },
  });
  
  npxProcess.on('error', (err) => {
    console.error('Failed to start Next.js process with npx:', err);
  });
  
  return;
}

// Spawn the next dev process with port 3000
const nextProcess = spawn(nextBinPath, ['dev', '-p', '3000'], {
  stdio: 'inherit',
  env: {
    ...process.env,
    PORT: 3000,
    FORCE_COLOR: 1,
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
console.log('Next.js development server starting on http://localhost:3000');
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