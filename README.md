# Retro Asylum - 3D Maze Game

A Nuxt 4 application featuring a 3D raycasting maze game inspired by the classic TRS-80 "Asylum" game. Built with Vue 3, TypeScript, and Vite.

## Project Structure

```
retro-asylum/
├── app/
│   ├── app.vue                 # Main game component
│   └── composables/
│       └── useGame.ts          # Game logic composable
├── public/
│   └── maps/
│       └── level1.json         # Game map data
├── package.json                # Dependencies and scripts
├── nuxt.config.ts              # Nuxt configuration
├── netlify.toml                # Netlify deployment config
├── .nvmrc                       # Node version (20.11.0)
└── .gitignore                  # Git ignore rules
```

## Features

- **3D Raycasting Engine**: Wolfenstein 3D-style rendering
- **Retro Aesthetic**: Low-resolution (160x100) pixelated graphics
- **Map System**: JSON-based maze configuration in `public/maps/`
- **Vue 3 + TypeScript**: Modern, type-safe development
- **Nuxt 4**: Full-stack framework with SSR support
- **Yarn 1.22.22**: Package management

## Setup

Install dependencies with Yarn:

```bash
yarn install
```

## Development

Start the development server:

```bash
yarn dev
```

The app will be available at `http://localhost:3000` (or the next available port).

## Build

Build for production:

```bash
yarn build
```

Preview the production build locally:

```bash
yarn preview
```

## Deployment

### Netlify

The project includes a `netlify.toml` configuration for easy deployment to Netlify:

1. Push your code to GitHub
2. Connect your repository to Netlify
3. Netlify will automatically detect the `netlify.toml` and deploy using:
   - Build command: `yarn build`
   - Publish directory: `.output/public`
   - Node version: 20.11.0

### Environment

- **Node Version**: 20.11.0 (specified in `.nvmrc`)
- **Package Manager**: Yarn 1.22.22

## Game Controls

- **Arrow Keys**: Move and turn
- **Space**: Step forward

## Map System

Maps are stored as JSON files in `public/maps/`. Each map contains:

```json
{
  "width": 16,
  "height": 16,
  "start_facing": "E",
  "map": [
    [1, 1, 1, ...],
    ...
  ]
}
```

- `0` = Empty space
- `1` = Wall
- `"S"` = Start position
- `"E"` = Exit

## Future: Map Editor

The map system is designed to support a future 2D top-down map editor that will convert visual maps to the JSON format used by the 3D engine.

## Learn More

- [Nuxt Documentation](https://nuxt.com/docs)
- [Vue 3 Documentation](https://vuejs.org/)
