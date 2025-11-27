# Deployment Guide

## Netlify Configuration

This project is configured for **static site deployment** on Netlify. No serverless functions or database are required - everything runs client-side.

### Build Command

```bash
yarn generate
```

This runs `nuxt generate` which prerenders the app as a static site.

### Publish Directory

```
.output/public
```

### Node Version

```
22
```

## Netlify.toml

The `netlify.toml` file contains all deployment configuration:

```toml
[build]
  command = "yarn generate"
  publish = ".output/public"

[build.environment]
  NODE_VERSION = "22"
```

## Deployment Steps

1. **Push to GitHub**

   ```bash
   git add .
   git commit -m "Deploy to Netlify"
   git push origin main
   ```

2. **Connect to Netlify**

   - Go to https://app.netlify.com
   - Click "New site from Git"
   - Select your GitHub repository
   - Netlify will auto-detect `netlify.toml`
   - Click "Deploy site"

3. **Verify Deployment**
   - Check the Netlify deploy log
   - Ensure build completes successfully
   - Test the live site

## Local Testing

Test the production build locally:

```bash
yarn generate
yarn preview
```

Then visit `http://localhost:3000` to verify the build works.

## Static Site Features

This app is fully static and client-side:
- ✅ **No serverless functions needed** - All logic runs in the browser
- ✅ **No database needed** - User maps stored in localStorage
- ✅ **Built-in maps** - Served from `/public/maps/` directory
- ✅ **Fully static** - Can be deployed to any static hosting

## Troubleshooting

### Build Fails on Netlify

1. Check the full build log in Netlify dashboard
2. Verify `yarn.lock` is committed (dependencies)
3. Run `yarn generate` locally to reproduce the error
4. Check that all required files are committed to git

### localStorage Not Working

- localStorage only works in the browser (not during SSR)
- The app handles this automatically with browser checks
- User maps will only be available after the page loads in the browser

## Environment

- **Framework**: Nuxt 4
- **Package Manager**: Yarn
- **Node Version**: 22
- **Build Tool**: Vite
- **Deployment**: Static Site (no server required)
