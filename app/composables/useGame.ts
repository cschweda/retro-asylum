import { ref, onMounted, onUnmounted } from 'vue'

interface LevelData {
  width: number
  height: number
  start_facing: string
  map: (number | string)[][]
}

export const useGame = (canvasRef: any) => {
  const levelData = ref<LevelData | null>(null)
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
    Space: false,
  }

  const loadMap = async () => {
    const response = await fetch('/maps/level1.json')
    levelData.value = await response.json()
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

  const render = () => {
    if (!canvasRef.value || !levelData.value) return

    const canvas = canvasRef.value
    const ctx = canvas.getContext('2d', { alpha: false })
    const SCREEN_W = canvas.width
    const SCREEN_H = canvas.height

    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(0, 0, SCREEN_W, SCREEN_H)

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

      ctx.fillStyle = '#000000'
      if (side === 1) ctx.fillStyle = '#222222'

      ctx.fillRect(x, drawStart, 1, drawEnd - drawStart)
    }

    let mx = Math.floor(posX)
    let my = Math.floor(posY)
    if (levelData.value.map[my][mx] === 'E') {
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

    if (keys.ArrowUp || keys.Space) {
      let newX = posX + dirX * moveSpeed
      let newY = posY + dirY * moveSpeed

      let gridX = Math.floor(newX)
      let gridY = Math.floor(posY)
      if (levelData.value?.map[gridY][gridX] !== 1) posX = newX

      gridX = Math.floor(posX)
      gridY = Math.floor(newY)
      if (levelData.value?.map[gridY][gridX] !== 1) posY = newY

      moved = true
    }

    if (keys.ArrowDown) {
      let newX = posX - dirX * moveSpeed
      let newY = posY - dirY * moveSpeed

      let gridX = Math.floor(newX)
      let gridY = Math.floor(posY)
      if (levelData.value?.map[gridY][gridX] !== 1) posX = newX

      gridX = Math.floor(posX)
      gridY = Math.floor(newY)
      if (levelData.value?.map[gridY][gridX] !== 1) posY = newY

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
  }
}

