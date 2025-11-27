import type { MapItem } from '../types/items'

export function renderItemSprite(
  ctx: CanvasRenderingContext2D,
  item: MapItem,
  screenX: number,
  screenY: number,
  distance: number,
  isOnCurrentTile: boolean = true
) {
  // Simple sprite rendering - draw a colored rectangle based on item type
  // Items on current tile are full size, adjacent tiles are smaller and faded
  const baseSize = isOnCurrentTile ? 10 : 6
  const size = Math.max(2, baseSize / (1 + distance * 0.1))
  
  ctx.save()
  
  // Color based on item type
  let color = '#888'
  switch (item.type) {
    case 'key':
      color = '#FFD700' // Gold
      break
    case 'chest':
      color = '#8B4513' // Brown
      break
    case 'door':
      color = '#654321' // Dark brown
      break
    case 'bed':
      color = '#4B0082' // Indigo
      break
    case 'food':
      color = '#FF6347' // Tomato
      break
    case 'weapon':
      color = '#C0C0C0' // Silver
      break
    case 'trap':
      color = '#FF0000' // Red
      break
    case 'switch':
      color = '#00FF00' // Green
      break
  }

  // Fade items on adjacent tiles (not interactable)
  if (!isOnCurrentTile) {
    ctx.globalAlpha = 0.5
  }

  ctx.fillStyle = color
  ctx.fillRect(screenX - size / 2, screenY - size / 2, size, size)
  
  // Draw border
  ctx.strokeStyle = '#000'
  ctx.lineWidth = 1
  ctx.strokeRect(screenX - size / 2, screenY - size / 2, size, size)
  
  ctx.restore()
}

export function renderItemLabel(
  ctx: CanvasRenderingContext2D,
  item: MapItem,
  screenX: number,
  screenY: number,
  distance: number
) {
  // Render text label below sprite
  const fontSize = Math.max(8, 12 / (1 + distance * 0.1))
  const labelY = screenY + 15
  
  ctx.save()
  ctx.font = `${fontSize}px monospace`
  ctx.fillStyle = '#000'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'top'
  
  // Draw text with outline for visibility
  ctx.strokeStyle = '#FFF'
  ctx.lineWidth = 2
  ctx.strokeText(item.name, screenX, labelY)
  ctx.fillText(item.name, screenX, labelY)
  
  ctx.restore()
}

export function getItemsOnTile(
  items: MapItem[],
  tileX: number,
  tileY: number
): MapItem[] {
  return items.filter(item => Math.floor(item.x) === tileX && Math.floor(item.y) === tileY)
}

export function calculateItemScreenPosition(
  itemX: number,
  itemY: number,
  playerX: number,
  playerY: number,
  dirX: number,
  dirY: number,
  planeX: number,
  planeY: number,
  screenWidth: number,
  screenHeight: number
): { x: number; y: number; distance: number } | null {
  // Calculate relative position
  const dx = itemX - playerX
  const dy = itemY - playerY
  
  // Transform to camera space (inverse of camera matrix)
  const invDet = 1.0 / (planeX * dirY - planeY * dirX)
  const transformX = invDet * (dirY * dx - dirX * dy)
  const transformY = invDet * (-planeY * dx + planeX * dy)
  
  if (transformY <= 0) return null // Behind player
  
  const distance = Math.sqrt(dx * dx + dy * dy)
  
  // Project to screen (center of screen, adjust for perspective)
  const screenX = screenWidth / 2 + (transformX / transformY) * (screenWidth / 2)
  const screenY = screenHeight / 2
  
  return { x: screenX, y: screenY, distance }
}

