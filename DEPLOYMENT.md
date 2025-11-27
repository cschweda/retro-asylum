# Deployment Guide

## Netlify Configuration

This project is configured for deployment on Netlify with the following settings:

### Build Command

```bash
yarn install && yarn build
```

### Publish Directory

```
.output/public
```

### Node Version

```
20.11.0
```

### Environment Variables

- `NODE_VERSION`: 20.11.0
- `NITRO_PRERENDER`: false

## Netlify.toml

The `netlify.toml` file contains all deployment configuration:

```toml
[build]
  command = "yarn install && yarn build"
  publish = ".output/public"
  functions = ".output/server"

[build.environment]
  NODE_VERSION = "20.11.0"
  NITRO_PRERENDER = "false"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
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
yarn build
yarn preview
```

Then visit `http://localhost:3000` to verify the build works.

## Troubleshooting

### Build Fails on Netlify

1. Check the full build log in Netlify dashboard
2. Verify `.nvmrc` is committed (Node version)
3. Verify `yarn.lock` is committed (dependencies)
4. Run `yarn build` locally to reproduce the error
5. Check that all required files are committed to git

### Sharp Binary Issues

The build includes sharp binaries for linux-x64. Ensure you're deploying to a compatible architecture.

## Environment

- **Framework**: Nuxt 4
- **Package Manager**: Yarn 1.22.22
- **Node Version**: 20.11.0
- **Build Tool**: Vite
- **Runtime**: Node.js (Netlify Functions)
