# Netlify Deployment Fix

## Problem

Netlify deployment was failing during the dependency installation phase with:

```
WARNING: The environment variable 'NODE_ENV' is set to 'production'.
Any 'devDependencies' in package.json will not be installed
Failed during stage 'Install dependencies': dependency_installation script returned non-zero exit code: 1
```

## Root Cause

The `netlify.toml` configuration had `NODE_ENV = "production"` which prevented Yarn from installing dev dependencies. However, Nuxt requires dev dependencies (like TypeScript, ESLint, etc.) to build successfully.

## Solution Applied

### 1. Updated `netlify.toml`

**Before:**

```toml
[build]
  command = "yarn build"
  publish = ".output/public"

[build.environment]
  NODE_VERSION = "20.11.0"
  NODE_ENV = "production"
  NITRO_PRERENDER = "false"
```

**After:**

```toml
[build]
  command = "yarn install && yarn build"
  publish = ".output/public"
  functions = ".output/server"

[build.environment]
  NODE_VERSION = "20.11.0"
  NITRO_PRERENDER = "false"
```

**Changes:**

- ✅ Added explicit `yarn install` to build command
- ✅ Added `functions` directory for Netlify Functions
- ✅ **REMOVED `NODE_ENV = "production"`** (this was blocking dev dependencies!)
- ✅ Kept explicit Node version specification
- ✅ Disabled prerendering (not needed for this SPA)

### 2. Updated `nuxt.config.ts`

Added Nitro prerender configuration to prevent unnecessary prerendering:

```typescript
nitro: {
  prerender: {
    crawlLinks: false,
    routes: ['/sitemap.xml', '/robots.txt'],
    ignore: ['/admin']
  }
}
```

### 3. Verified Files

All required files are in place:

- ✅ `.nvmrc` - Node version 20.11.0
- ✅ `yarn.lock` - Dependency lock file
- ✅ `package.json` - Dependencies and scripts
- ✅ `.gitignore` - Git ignore rules
- ✅ `netlify.toml` - Netlify configuration

## Deployment Command

The exact command Netlify will run:

```bash
yarn install && yarn build
```

## Build Output

- **Publish Directory**: `.output/public`
- **Functions Directory**: `.output/server`
- **Node Version**: 20.11.0
- **Package Manager**: Yarn 1.22.22

## Testing

Build tested locally and confirmed working:

```bash
yarn build
# ✔ Client built in 1087ms
# ✔ Server built in 390ms
# ✔ Nuxt Nitro server built
# Done in 8.07s
```

## Next Steps

1. Commit all changes to git
2. Push to GitHub
3. Netlify will automatically detect `netlify.toml`
4. Build should complete successfully
5. Site will be live at your Netlify domain

## Troubleshooting

If deployment still fails:

1. Check the full Netlify build log (not just the excerpt)
2. Look for errors after "Running build command"
3. Verify all files are committed (especially `yarn.lock`)
4. Run `yarn build` locally to reproduce any errors
