// Deploy script for Render
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

console.log('Preparing QuickChat for Render deployment...');

// 1. Copy the render-package.json to package.json when deploying
try {
  console.log('Setting up package.json for Render...');
  if (fs.existsSync('./render-package.json')) {
    fs.copyFileSync('./render-package.json', './package.json');
    console.log('✅ package.json set up for Render');
  } else {
    console.error('❌ render-package.json not found!');
    process.exit(1);
  }
} catch (error) {
  console.error('Error setting up package.json:', error);
  process.exit(1);
}

// 2. Set up the build environment
console.log('Building the application for production...');
try {
  // Run the build process
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✅ Build successful');
} catch (error) {
  console.error('❌ Build failed:', error);
  process.exit(1);
}

console.log('✨ Deployment preparation complete!');
console.log('Your app is ready to be deployed to Render.');
console.log('Follow these steps:');
console.log('1. Make sure your code is pushed to your Git repository');
console.log('2. Connect your repository to Render');
console.log('3. Use these settings:');
console.log('   - Build Command: node deploy-to-render.js && npm run build');
console.log('   - Start Command: npm run start');

// Additional instructions
console.log('\nIMPORTANT: For Render deployment:');
console.log('- Use Node.js version 18 or higher');
console.log('- Environment variables needed: NODE_ENV=production');
console.log('- You may need to add DATABASE_URL if you set up a database');