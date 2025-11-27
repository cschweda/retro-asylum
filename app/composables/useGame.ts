import { ref, onMounted, onUnmounted } from 'vue'
import type { LevelData } from '../utils/mapUtils'
import type { MapItem } from '../types/items'
import { getItemsOnTile, renderItemSprite, renderItemLabel, calculateItemScreenPosition } from '../utils/itemRenderer'
import type { Verb, CommandResponse } from './useTextParser'

export const useGame = (
  canvasRef: any,
  initialMap?: LevelData | null,
  executeItemCommand?: (verb: Verb, object: string | null, items: MapItem[]) => Promise<CommandResponse>
) => {
  const levelData = ref<LevelData | null>(initialMap || null)
  const gameRunning = ref(false)

  // Game State
  let posX = 0
  let posY = 0
  let dirX = 0
  let dirY = 0
  let planeX = 0
  let planeY = 0

  const moveSpeed = 0.15
  const rotSpeed = 0.1

  const keys = {
    ArrowUp: false,
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false,
  }

  const loadMap = async () => {
    if (!initialMap) {
      const response = await fetch('/maps/level1.json')
      const data = await response.json()
      levelData.value = data
    } else {
      levelData.value = initialMap
    }
  }

  const setDirection = (cardinal: string) => {
    let rads = 0
    if (cardinal === 'E') rads = 0
    if (cardinal === 'S') rads = Math.PI / 2
    if (cardinal === 'W') rads = Math.PI
    if (cardinal === 'N') rads = -Math.PI / 2

    dirX = Math.cos(rads)
    dirY = Math.sin(rads)

    planeX = -dirY * 0.66
    planeY = dirX * 0.66
  }

  const switchMap = (newMap: LevelData) => {
    levelData.value = newMap
    initGame()
  }

  const initGame = () => {
    if (!levelData.value) return

    for (let y = 0; y < levelData.value.height; y++) {
      for (let x = 0; x < levelData.value.width; x++) {
        if (levelData.value.map[y][x] === 'S') {
          posX = x + 0.5
          posY = y + 0.5
        }
      }
    }

    setDirection(levelData.value.start_facing || 'N')
    render()
  }

  const getCurrentTileItems = (): MapItem[] => {
    if (!levelData.value || !levelData.value.items) return []
    const tileX = Math.floor(posX)
    const tileY = Math.floor(posY)
    return getItemsOnTile(levelData.value.items, tileX, tileY)
  }

  const render = () => {
    if (!canvasRef.value || !levelData.value) return

    const canvas = canvasRef.value
    const ctx = canvas.getContext('2d', { alpha: false })
    const SCREEN_W = canvas.width
    const SCREEN_H = canvas.height

    // TRS-80 style background - simple light background like the original games
    // The original games had a simple, uniform background
    ctx.fillStyle = '#E0E0E0'
    ctx.fillRect(0, 0, SCREEN_W, SCREEN_H)

    // Raycasting for walls
    for (let x = 0; x < SCREEN_W; x++) {
      let cameraX = (2 * x) / SCREEN_W - 1
      let rayDirX = dirX + planeX * cameraX
      let rayDirY = dirY + planeY * cameraX

      let mapX = Math.floor(posX)
      let mapY = Math.floor(posY)

      let sideDistX, sideDistY
      let deltaDistX = rayDirX === 0 ? 1e30 : Math.abs(1 / rayDirX)
      let deltaDistY = rayDirY === 0 ? 1e30 : Math.abs(1 / rayDirY)
      let perpWallDist

      let stepX, stepY
      let hit = 0
      let side

      if (rayDirX < 0) {
        stepX = -1
        sideDistX = (posX - mapX) * deltaDistX
      } else {
        stepX = 1
        sideDistX = (mapX + 1.0 - posX) * deltaDistX
      }
      if (rayDirY < 0) {
        stepY = -1
        sideDistY = (posY - mapY) * deltaDistY
      } else {
        stepY = 1
        sideDistY = (mapY + 1.0 - posY) * deltaDistY
      }

      while (hit === 0) {
        if (sideDistX < sideDistY) {
          sideDistX += deltaDistX
          mapX += stepX
          side = 0
        } else {
          sideDistY += deltaDistY
          mapY += stepY
          side = 1
        }

        if (
          mapX < 0 ||
          mapY < 0 ||
          mapX >= levelData.value.width ||
          mapY >= levelData.value.height
        ) {
          hit = 1
        } else {
          let tile = levelData.value.map[mapY][mapX]
          if (tile === 1 || tile === 'E') hit = 1
        }
      }

      if (side === 0) perpWallDist = sideDistX - deltaDistX
      else perpWallDist = sideDistY - deltaDistY

      let lineHeight = Math.floor(SCREEN_H / perpWallDist)
      let drawStart = -lineHeight / 2 + SCREEN_H / 2
      let drawEnd = lineHeight / 2 + SCREEN_H / 2

      if (drawStart < 0) drawStart = 0
      if (drawEnd >= SCREEN_H) drawEnd = SCREEN_H - 1

      // TRS-80 style wall rendering with authentic blocky texture
      const wallHeight = drawEnd - drawStart
      
      // Base colors - authentic TRS-80 palette
      // Side 0 = east/west walls (darker), Side 1 = north/south walls (lighter)
      // TRS-80 used darker, more muted colors
      const darkWall = side === 0 ? '#0f0f0f' : '#1f1f1f'
      const lightWall = side === 0 ? '#2a2a2a' : '#3a3a3a'
      
      // Distance-based shading for depth perception
      const brightness = Math.max(0.4, Math.min(1.0, 1.0 - perpWallDist * 0.12))
      
      // Calculate base wall color with distance shading
      const darkR = Math.floor(parseInt(darkWall.slice(1, 3), 16) * brightness)
      const darkG = Math.floor(parseInt(darkWall.slice(3, 5), 16) * brightness)
      const darkB = Math.floor(parseInt(darkWall.slice(5, 7), 16) * brightness)
      
      const lightR = Math.floor(parseInt(lightWall.slice(1, 3), 16) * brightness)
      const lightG = Math.floor(parseInt(lightWall.slice(3, 5), 16) * brightness)
      const lightB = Math.floor(parseInt(lightWall.slice(5, 7), 16) * brightness)
      
      // Draw TRS-80 style blocky texture pattern
      // Pattern repeats every 4 pixels for that authentic retro look
      const patternOffset = Math.floor(drawStart / 2) % 4
      
      for (let py = Math.floor(drawStart); py < Math.ceil(drawEnd); py++) {
        const patternY = (py + patternOffset) % 4
        const patternX = x % 2
        
        // Create a simple crosshatch/block pattern
        if ((patternX + patternY) % 2 === 0) {
          ctx.fillStyle = `rgb(${lightR},${lightG},${lightB})`
        } else {
          ctx.fillStyle = `rgb(${darkR},${darkG},${darkB})`
        }
        
        ctx.fillRect(x, py, 1, 1)
      }
    }

    // Render items
    if (levelData.value.items) {
      const currentTileX = Math.floor(posX)
      const currentTileY = Math.floor(posY)
      
      for (const item of levelData.value.items) {
        const itemTileX = Math.floor(item.x)
        const itemTileY = Math.floor(item.y)
        
        // Calculate distance in tiles
        const tileDistance = Math.max(Math.abs(itemTileX - currentTileX), Math.abs(itemTileY - currentTileY))
        
        // Only render items on visible tiles (same tile or adjacent)
        if (tileDistance <= 1) {
          const screenPos = calculateItemScreenPosition(
            item.x,
            item.y,
            posX,
            posY,
            dirX,
            dirY,
            planeX,
            planeY,
            SCREEN_W,
            SCREEN_H
          )

          if (screenPos && screenPos.distance < 5) {
            // Render items on current tile normally, adjacent tiles smaller/faded
            const isOnCurrentTile = tileDistance === 0
            renderItemSprite(ctx, item, screenPos.x, screenPos.y, screenPos.distance, isOnCurrentTile)
            if (isOnCurrentTile) {
              // Only show labels for items on current tile (interactable)
              renderItemLabel(ctx, item, screenPos.x, screenPos.y, screenPos.distance)
            }
          }
        }
      }
    }

    // Exit message
    let mx = Math.floor(posX)
    let my = Math.floor(posY)
    if (levelData.value.map[my] && levelData.value.map[my][mx] === 'E') {
      ctx.fillStyle = 'black'
      ctx.font = '20px monospace'
      ctx.fillText('EXIT FOUND', 40, 50)
    }
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    if (keys.hasOwnProperty(e.code)) {
      keys[e.code as keyof typeof keys] = true
      e.preventDefault()
    }
  }

  const handleKeyUp = (e: KeyboardEvent) => {
    if (keys.hasOwnProperty(e.code)) {
      keys[e.code as keyof typeof keys] = false
    }
  }

  const gameLoop = () => {
    if (!gameRunning.value) return

    let moved = false

    if (keys.ArrowLeft) {
      let oldDirX = dirX
      dirX = dirX * Math.cos(-rotSpeed) - dirY * Math.sin(-rotSpeed)
      dirY = oldDirX * Math.sin(-rotSpeed) + dirY * Math.cos(-rotSpeed)
      let oldPlaneX = planeX
      planeX = planeX * Math.cos(-rotSpeed) - planeY * Math.sin(-rotSpeed)
      planeY = oldPlaneX * Math.sin(-rotSpeed) + planeY * Math.cos(-rotSpeed)
      moved = true
    }
    if (keys.ArrowRight) {
      let oldDirX = dirX
      dirX = dirX * Math.cos(rotSpeed) - dirY * Math.sin(rotSpeed)
      dirY = oldDirX * Math.sin(rotSpeed) + dirY * Math.cos(rotSpeed)
      let oldPlaneX = planeX
      planeX = planeX * Math.cos(rotSpeed) - planeY * Math.sin(rotSpeed)
      planeY = oldPlaneX * Math.sin(rotSpeed) + planeY * Math.cos(rotSpeed)
      moved = true
    }

    if (keys.ArrowUp) {
      let newX = posX + dirX * moveSpeed
      let newY = posY + dirY * moveSpeed

      let gridX = Math.floor(newX)
      let gridY = Math.floor(posY)
      if (levelData.value?.map[gridY] && levelData.value.map[gridY][gridX] !== 1) posX = newX

      gridX = Math.floor(posX)
      gridY = Math.floor(newY)
      if (levelData.value?.map[gridY] && levelData.value.map[gridY][gridX] !== 1) posY = newY

      moved = true
    }

    if (keys.ArrowDown) {
      let newX = posX - dirX * moveSpeed
      let newY = posY - dirY * moveSpeed

      let gridX = Math.floor(newX)
      let gridY = Math.floor(posY)
      if (levelData.value?.map[gridY] && levelData.value.map[gridY][gridX] !== 1) posX = newX

      gridX = Math.floor(posX)
      gridY = Math.floor(newY)
      if (levelData.value?.map[gridY] && levelData.value.map[gridY][gridX] !== 1) posY = newY

      moved = true
    }

    if (moved) render()

    requestAnimationFrame(gameLoop)
  }

  onMounted(async () => {
    await loadMap()
    initGame()
    gameRunning.value = true
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    requestAnimationFrame(gameLoop)
  })

  onUnmounted(() => {
    gameRunning.value = false
    window.removeEventListener('keydown', handleKeyDown)
    window.removeEventListener('keyup', handleKeyUp)
  })

  return {
    levelData,
    switchMap,
    getCurrentTileItems,
    getPlayerPosition: () => ({ x: posX, y: posY }),
  }
}
