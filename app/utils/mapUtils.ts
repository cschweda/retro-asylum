import type { MapItem } from '../types/items'

export interface LevelData {
  width: number
  height: number
  start_facing: 'N' | 'E' | 'S' | 'W'
  map: (0 | 1 | 'S' | 'E')[][]
  items?: MapItem[]
  name?: string
  createdAt?: string
}

export function validateMap(data: any): data is LevelData {
  if (!data || typeof data !== 'object') return false
  if (typeof data.width !== 'number' || data.width < 1) return false
  if (typeof data.height !== 'number' || data.height < 1) return false
  if (!['N', 'E', 'S', 'W'].includes(data.start_facing)) return false
  if (!Array.isArray(data.map)) return false
  if (data.map.length !== data.height) return false
  if (!data.map.every((row: any) => Array.isArray(row) && row.length === data.width)) return false

  // Check for exactly one Start and one Exit
  let startCount = 0
  let exitCount = 0
  for (const row of data.map) {
    for (const cell of row) {
      if (cell === 'S') startCount++
      if (cell === 'E') exitCount++
    }
  }

  if (startCount !== 1) return false
  if (exitCount !== 1) return false

  return true
}

export function createEmptyMap(width: number, height: number, startFacing: 'N' | 'E' | 'S' | 'W' = 'N'): LevelData {
  const map: (0 | 1 | 'S' | 'E')[][] = []
  
  // Create walls around perimeter
  for (let y = 0; y < height; y++) {
    const row: (0 | 1 | 'S' | 'E')[] = []
    for (let x = 0; x < width; x++) {
      if (x === 0 || x === width - 1 || y === 0 || y === height - 1) {
        row.push(1) // Wall
      } else {
        row.push(0) // Empty
      }
    }
    map.push(row)
  }

  // Place start and exit
  map[1][1] = 'S'
  map[height - 2][width - 2] = 'E'

  return {
    width,
    height,
    start_facing: startFacing,
    map,
    items: [],
  }
}

export function generateRandomMaze(
  width: number = 16,
  height: number = 16,
  complexity: number = 0.3
): LevelData {
  // Use recursive backtracking algorithm
  const map: (0 | 1 | 'S' | 'E')[][] = []
  
  // Initialize with all walls
  for (let y = 0; y < height; y++) {
    const row: (0 | 1 | 'S' | 'E')[] = []
    for (let x = 0; x < width; x++) {
      row.push(1)
    }
    map.push(row)
  }

  // Recursive backtracking maze generation
  const stack: [number, number][] = []
  const visited = new Set<string>()

  function getNeighbors(x: number, y: number): [number, number][] {
    const neighbors: [number, number][] = []
    const directions = [
      [0, -2], // North
      [2, 0],  // East
      [0, 2],  // South
      [-2, 0], // West
    ]

    for (const [dx, dy] of directions) {
      const nx = x + dx
      const ny = y + dy
      if (nx > 0 && nx < width - 1 && ny > 0 && ny < height - 1) {
        const key = `${nx},${ny}`
        if (!visited.has(key)) {
          neighbors.push([nx, ny])
        }
      }
    }
    return neighbors
  }

  // Start from a random odd position
  const startX = 1 + Math.floor(Math.random() * Math.floor((width - 2) / 2)) * 2
  const startY = 1 + Math.floor(Math.random() * Math.floor((height - 2) / 2)) * 2

  stack.push([startX, startY])
  visited.add(`${startX},${startY}`)
  map[startY][startX] = 0

  while (stack.length > 0) {
    const [x, y] = stack[stack.length - 1]
    const neighbors = getNeighbors(x, y)

    if (neighbors.length > 0) {
      const [nx, ny] = neighbors[Math.floor(Math.random() * neighbors.length)]
      const key = `${nx},${ny}`
      visited.add(key)

      // Carve path
      const midX = (x + nx) / 2
      const midY = (y + ny) / 2
      map[midY][midX] = 0
      map[ny][nx] = 0

      stack.push([nx, ny])
    } else {
      stack.pop()
    }
  }

  // Add some random walls for complexity
  const wallCount = Math.floor(width * height * complexity)
  for (let i = 0; i < wallCount; i++) {
    const x = Math.floor(Math.random() * (width - 2)) + 1
    const y = Math.floor(Math.random() * (height - 2)) + 1
    if (map[y][x] === 0) {
      map[y][x] = 1
    }
  }

  // Find start and exit positions (opposite corners)
  let startPos: [number, number] | null = null
  let exitPos: [number, number] | null = null

  // Find start (top-left area)
  for (let y = 1; y < Math.floor(height / 2); y++) {
    for (let x = 1; x < Math.floor(width / 2); x++) {
      if (map[y][x] === 0) {
        startPos = [x, y]
        break
      }
    }
    if (startPos) break
  }

  // Find exit (bottom-right area)
  for (let y = height - 2; y > Math.floor(height / 2); y--) {
    for (let x = width - 2; x > Math.floor(width / 2); x--) {
      if (map[y][x] === 0) {
        exitPos = [x, y]
        break
      }
    }
    if (exitPos) break
  }

  if (startPos) {
    map[startPos[1]][startPos[0]] = 'S'
  } else {
    map[1][1] = 'S'
  }

  if (exitPos) {
    map[exitPos[1]][exitPos[0]] = 'E'
  } else {
    map[height - 2][width - 2] = 'E'
  }

  return {
    width,
    height,
    start_facing: 'E',
    map,
    items: [],
  }
}

export function serializeMap(map: LevelData): string {
  return JSON.stringify(map, null, 2)
}

export function deserializeMap(json: string): LevelData | null {
  try {
    const data = JSON.parse(json)
    if (validateMap(data)) {
      return data
    }
    return null
  } catch {
    return null
  }
}

export function downloadMap(map: LevelData, filename?: string) {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    console.warn('downloadMap can only be called in the browser')
    return
  }
  const json = serializeMap(map)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename || `${map.name || 'map'}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

