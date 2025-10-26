# GitHub Pages Deployment Guide

This guide explains how to deploy the Babylon.js Car Game to GitHub Pages using automated CI/CD.

## Analysis Summary

### ✅ GitHub Pages Compatibility

**Good news!** Your app is already GitHub Pages compatible:

- ✅ All paths are relative (no absolute URLs)
- ✅ ES6 modules work on GitHub Pages
- ✅ CDN libraries load from external sources
- ✅ Asset paths use relative references:
  - `game/models/car.glb`
  - `game/textures/tire.png`
  - `./index.js`, `./vue-app.js`

**No code changes needed!**

## Automated Deployment Setup

### Step 1: Enable GitHub Pages

1. Push your code to GitHub (including the `.github/workflows/deploy.yml` file)
2. Go to your repository on GitHub
3. Click **Settings** → **Pages**
4. Under **Source**, select: **GitHub Actions**
5. Save the settings

### Step 2: Deploy

**Automatic deployment** happens on every push to `main` branch:

```bash
git add .
git commit -m "Your changes"
git push origin main
```

The GitHub Actions workflow will:
1. ✅ Check out your code
2. ✅ Verify required assets exist
3. ✅ Package the application
4. ✅ Deploy to GitHub Pages
5. ✅ Provide deployment URL

### Step 3: Access Your Game

After deployment completes (usually 1-2 minutes), your game will be available at:

```
https://<username>.github.io/<repository-name>/
```

Replace `<username>` with your GitHub username and `<repository-name>` with your repo name.

## Manual Deployment Trigger

You can also manually trigger deployment:

1. Go to **Actions** tab in your repository
2. Click **Deploy to GitHub Pages** workflow
3. Click **Run workflow**
4. Select `main` branch
5. Click **Run workflow**

## Monitoring Deployments

### Check Deployment Status

1. Go to **Actions** tab in your repository
2. Click on the latest workflow run
3. View logs for each step

### Troubleshooting

If deployment fails:

1. **Check workflow logs** in Actions tab
2. **Verify assets exist**:
   - `game/textures/tire.png` (required)
   - `game/models/car.glb` (optional, fallback exists)
3. **Check file permissions** - all files should be readable
4. **Verify branch name** - workflow triggers on `main` branch

## Local Testing Before Deployment

Always test locally before pushing:

```bash
# Start local server
npm start

# Open in browser
open http://localhost:8080
```

Test these items:
- ✅ Game loads without errors
- ✅ Car model appears (or fallback box)
- ✅ Controls work (keyboard/touch)
- ✅ Physics behaves correctly
- ✅ No console errors

## What Gets Deployed

The following files/folders are deployed to GitHub Pages:

```
index.html
index.js
vue-app.js
css/
components/
game/
  ├── controller/
  ├── modules/
  ├── testing/
  ├── models/
  ├── textures/
  └── babylon-game.js
.nojekyll (auto-generated)
```

## Files NOT Deployed

These are excluded from deployment (stay in source repo only):

```
node_modules/
temp/
docs/
.git/
.github/ (only workflows are used, not deployed)
package.json
CLAUDE.md
*.md files
test files
```

## GitHub Pages Limitations

Be aware of these GitHub Pages constraints:

- **File size limit**: 100 MB per file
- **Repository size**: Soft limit of 1 GB
- **Bandwidth**: 100 GB per month
- **Build time**: 10 minutes maximum
- **Static files only**: No server-side processing

Your current app is well within these limits.

## Custom Domain (Optional)

To use a custom domain:

1. Go to **Settings** → **Pages**
2. Enter your custom domain
3. Add DNS records (CNAME or A records) as shown
4. Enable HTTPS (recommended)

## Rollback

If you need to rollback a deployment:

1. Go to **Actions** tab
2. Find a previous successful deployment
3. Click **Re-run all jobs**

Or revert the git commit and push:

```bash
git revert HEAD
git push origin main
```

## Security Notes

- ✅ No secrets or API keys are exposed
- ✅ All assets served over HTTPS
- ✅ CDN libraries loaded from trusted sources
- ✅ No server-side code execution

## Performance Tips

For optimal GitHub Pages performance:

1. **Enable HTTPS** (automatic with GitHub Pages)
2. **CDN for libraries** (already implemented)
3. **Compress assets** - consider compressing large GLB models
4. **Browser caching** - GitHub Pages sets appropriate cache headers

## Support

If you encounter issues:

1. Check GitHub Actions logs
2. Review [GitHub Pages documentation](https://docs.github.com/en/pages)
3. Verify your repo is public (private repos require GitHub Pro)
4. Check GitHub Status page for service issues

---

**Quick Command Reference:**

```bash
# Local development
npm start                    # Start local server

# Deployment (automatic)
git push origin main         # Triggers auto-deployment

# View deployment
open https://<username>.github.io/<repo-name>/
```
