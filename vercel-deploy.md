# Vercel Deployment Guide

This guide will help you deploy your Show Your Bits application to Vercel and resolve the sync issues between your local environment and Vercel deployment.

## Step 1: Deploy to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New..." → "Project"
3. Import your GitHub repository (`jmanasco1/showyourbits`)
4. Select the `deployment-sync` branch
5. Configure the project with these settings:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
6. Add your environment variables from `.env` to the Vercel project
7. Click "Deploy"

## Step 2: Set as Production Branch

1. After deployment completes, go to your project settings in Vercel
2. Navigate to "Git" section
3. Under "Production Branch", select `deployment-sync`
4. Save changes

## Step 3: Update Local Environment

After successful deployment, run these commands locally:

```bash
# Switch to main branch
git checkout main

# Merge deployment-sync branch into main
git merge deployment-sync

# Push changes to GitHub
git push origin main

# Now your local main branch is synced with Vercel deployment
```

## Troubleshooting

If you encounter any issues:

1. **Firebase Connection Issues**: Check your Firebase security rules and make sure your environment variables are correctly set in Vercel
2. **Deployment Failures**: Check the Vercel deployment logs for specific errors
3. **Local Development Issues**: Run `npm run dev` to test locally before pushing changes

## Future Updates

For future updates, always:

1. Make changes on the `main` branch
2. Test locally with `npm run dev`
3. When ready to deploy, merge changes to `deployment-sync` branch
4. Push `deployment-sync` branch to GitHub
5. Vercel will automatically deploy the changes

This workflow ensures your local environment stays in sync with your Vercel deployment.

## Deployment Documentation

### Vercel Deployment Process

#### Deployment Issues Fixed

##### March 5, 2025

1. **Import Compatibility Issue**
   - Problem: Build failed due to mismatched import/export styles between local code and Vercel build
   - Error: `"Write" is not exported by "src/components/Write.tsx", imported by "src/App.tsx"`
   - Solution: Modified components to support both default and named exports
   - Files modified:
     - `src/components/Write.tsx`
     - `src/components/IdeaBank.tsx`
   - Changes:
     - Added named exports alongside default exports
     - Renamed component functions for clarity
     - Maintained backward compatibility with both import styles

2. **Deployment Branch**
   - Using `deployment-sync` branch for Vercel deployments
   - Latest commit: Added both default and named exports for components

#### Next Steps

1. Verify the deployment succeeds on Vercel
2. Test the application functionality
3. Consider standardizing import/export patterns across the codebase

#### Previous Improvements

1. Enhanced error handling for Firebase initialization
2. Improved client-side payment verification
3. Added subscription management capabilities
