// deploy.js - Script to help sync local environment with Vercel deployment
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

console.log(`${colors.bright}${colors.cyan}=== Show Your Bits Deployment Helper ===${colors.reset}\n`);

try {
  // Step 1: Ensure we're on the deployment-sync branch
  console.log(`${colors.yellow}Step 1: Checking current branch...${colors.reset}`);
  const currentBranch = execSync('git branch --show-current').toString().trim();
  
  if (currentBranch !== 'deployment-sync') {
    console.log(`${colors.yellow}Switching to deployment-sync branch...${colors.reset}`);
    execSync('git checkout deployment-sync');
  }
  console.log(`${colors.green}✓ Now on deployment-sync branch${colors.reset}\n`);

  // Step 2: Build the project
  console.log(`${colors.yellow}Step 2: Building project...${colors.reset}`);
  execSync('npm run build', { stdio: 'inherit' });
  console.log(`${colors.green}✓ Build completed successfully${colors.reset}\n`);

  // Step 3: Commit any changes
  console.log(`${colors.yellow}Step 3: Committing changes...${colors.reset}`);
  try {
    execSync('git add .');
    execSync('git commit -m "Sync with Vercel deployment"');
    console.log(`${colors.green}✓ Changes committed${colors.reset}\n`);
  } catch (e) {
    console.log(`${colors.yellow}No changes to commit or commit failed${colors.reset}\n`);
  }

  // Step 4: Push to GitHub
  console.log(`${colors.yellow}Step 4: Pushing to GitHub...${colors.reset}`);
  try {
    execSync('git push -u origin deployment-sync');
    console.log(`${colors.green}✓ Pushed to GitHub${colors.reset}\n`);
  } catch (e) {
    console.log(`${colors.red}Failed to push to GitHub. You may need to set up the remote.${colors.reset}\n`);
    console.log(`Try: git push --set-upstream origin deployment-sync\n`);
  }

  // Step 5: Provide instructions for Vercel deployment
  console.log(`${colors.bright}${colors.cyan}=== Next Steps for Vercel Deployment ===${colors.reset}\n`);
  console.log(`1. Go to your Vercel dashboard`);
  console.log(`2. Import your GitHub repository`);
  console.log(`3. Select the 'deployment-sync' branch`);
  console.log(`4. Deploy with the following settings:`);
  console.log(`   - Build Command: npm run build`);
  console.log(`   - Output Directory: dist`);
  console.log(`   - Install Command: npm install`);
  console.log(`\n${colors.green}Your project is now ready for deployment!${colors.reset}`);

} catch (error) {
  console.error(`${colors.red}Error: ${error.message}${colors.reset}`);
  process.exit(1);
}
