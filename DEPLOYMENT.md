# Deployment Guide for Vercel

## Quick Deploy

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Initial commit: Complete ACM20 Research Platform"
   git push origin main
   ```

2. **Deploy on Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "Import Project"
   - Select your GitHub repository
   - Vercel will auto-detect Next.js settings
   - Click "Deploy"

## Manual Configuration (if needed)

If Vercel doesn't auto-detect, use these settings:
- **Framework Preset**: Next.js
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Install Command**: `npm install`

## Environment Variables

If you need to add environment variables:
1. Go to your Vercel project settings
2. Navigate to "Environment Variables"
3. Add any required variables (e.g., API keys)

## Post-Deployment

After deployment, your app will be available at:
- Production: `https://your-project.vercel.app`
- Preview: Each PR gets its own preview URL

## Troubleshooting

- **Build fails**: Check the build logs in Vercel dashboard
- **API routes not working**: Ensure all route files are in `app/api/` directory
- **Styles not loading**: Verify Tailwind CSS is configured correctly
