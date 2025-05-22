// Basic start script to help with Render deployment
import { spawn } from 'child_process';

// This will run the start command from package.json
const child = spawn('npm', ['run', 'start'], { 
  stdio: 'inherit',
  env: { ...process.env, NODE_ENV: 'production' }
});

child.on('error', (error) => {
  console.error('Failed to start the application:', error);
  process.exit(1);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('Gracefully shutting down...');
  child.kill('SIGINT');
});

// Add a startup message
console.log('Starting QuickChat application in production mode...');