// deploy.js - Helper script for Vercel deployment
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// Configuration
const config = {
  branch: 'vercel-deploy-fix', // The branch to deploy
  vercelProjectName: 'showyourbits', // Your Vercel project name
};

console.log('🚀 Starting deployment process...');

// Ensure we're on the correct branch
try {
  const currentBranch = execSync('git branch --show-current').toString().trim();
  console.log(`Current branch: ${currentBranch}`);
  
  if (currentBranch !== config.branch) {
    console.log(`Switching to ${config.branch} branch...`);
    execSync(`git checkout ${config.branch}`);
    console.log(`Successfully switched to ${config.branch} branch`);
  }
} catch (error) {
  console.error('Error checking/switching git branch:', error.message);
  process.exit(1);
}

// Check for uncommitted changes to tracked files only
try {
  // This checks only for modified tracked files, not untracked files
  const status = execSync('git status -uno --porcelain').toString();
  if (status.trim()) {
    console.log('Uncommitted changes to tracked files detected:');
    console.log(status);
    console.log('Please commit these changes before deploying');
    process.exit(1);
  }
  console.log('✅ No uncommitted changes to tracked files detected');
} catch (error) {
  console.error('Error checking git status:', error.message);
  process.exit(1);
}

// Push to GitHub
try {
  console.log(`Pushing ${config.branch} to GitHub...`);
  execSync(`git push origin ${config.branch}`);
  console.log('✅ Successfully pushed to GitHub');
} catch (error) {
  console.error('Error pushing to GitHub:', error.message);
  process.exit(1);
}

// Deploy to Vercel
try {
  console.log(`Deploying ${config.branch} to Vercel...`);
  console.log('To deploy to Vercel, run:');
  console.log(`npx vercel --prod`);
  console.log('Or visit your Vercel dashboard to deploy the latest changes from GitHub');
  console.log(`https://vercel.com/${config.vercelProjectName}`);
} catch (error) {
  console.error('Error deploying to Vercel:', error.message);
  process.exit(1);
}

console.log('🎉 Deployment process completed!');
