<template>
  <div class="map-editor">
    <div class="editor-toolbar">
      <div class="toolbar-section">
        <label>Tile Tools:</label>
        <button
          v-for="tool in tileTools"
          :key="tool.value"
          :class="['tool-btn', { active: selectedTool === tool.value }]"
          @click="selectedTool = tool.value"
        >
          {{ tool.label }}
        </button>
      </div>
      <div class="toolbar-section">
        <label>Item Tools:</label>
        <button
          v-for="itemType in itemTypes"
          :key="itemType"
          :class="['tool-btn', { active: selectedItemType === itemType }]"
          @click="selectedItemType = itemType; selectedTool = 'item'"
        >
          {{ itemType }}
        </button>
      </div>
      <div class="toolbar-section">
        <label>Actions:</label>
        <button @click="handleGenerateRandom" class="tool-btn">Generate Random</button>
        <button @click="handleResize" class="tool-btn">Resize</button>
        <button @click="handleUndo" :disabled="!canUndo" class="tool-btn">Undo</button>
        <button @click="handleRedo" :disabled="!canRedo" class="tool-btn">Redo</button>
        <button @click="handleSave" class="tool-btn">Save</button>
        <button @click="handleDownload" class="tool-btn">Download</button>
      </div>
      <div class="toolbar-section">
        <label>Start Facing:</label>
        <select v-model="currentMap.start_facing" class="select-input">
          <option value="N">North</option>
          <option value="E">East</option>
          <option value="S">South</option>
          <option value="W">West</option>
        </select>
      </div>
    </div>
    <div class="editor-content">
      <div class="canvas-container">
        <canvas
          ref="canvasRef"
          :width="canvasWidth"
          :height="canvasHeight"
          class="editor-canvas"
          @mousedown="handleMouseDown"
          @mousemove="handleMouseMove"
          @mouseup="handleMouseUp"
          @contextmenu.prevent="handleRightClick"
        />
      </div>
      <div v-if="selectedItem" class="item-properties">
        <h4>Item Properties</h4>
        <div class="property-group">
          <label>Name:</label>
          <input v-model="selectedItem.name" type="text" class="property-input" />
        </div>
        <div v-if="selectedItem.type === 'chest' || selectedItem.type === 'door'" class="property-group">
          <label>
            <input v-model="selectedItem.properties!.locked" type="checkbox" />
            Locked
          </label>
        </div>
        <div v-if="selectedItem.properties?.locked" class="property-group">
          <label>Key ID:</label>
          <input v-model="selectedItem.properties!.keyId" type="text" class="property-input" />
        </div>
        <div v-if="selectedItem.type === 'bed' || selectedItem.type === 'food'" class="property-group">
          <label>Health Restore:</label>
          <input
            v-model.number="selectedItem.properties!.healthRestore"
            type="number"
            class="property-input"
          />
        </div>
        <div class="property-group">
          <label>Description:</label>
          <textarea
            v-model="selectedItem.properties!.description"
            class="property-textarea"
            rows="3"
          />
        </div>
        <button @click="selectedItem = null" class="tool-btn">Close</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import type { LevelData } from '../utils/mapUtils'
import { createEmptyMap, generateRandomMaze, downloadMap } from '../utils/mapUtils'
import { createItem, type ItemType } from '../types/items'

interface Props {
  map: LevelData | null
}

interface Emits {
  (e: 'update:map', map: LevelData): void
  (e: 'save', map: LevelData): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const canvasRef = ref<HTMLCanvasElement | null>(null)
const selectedTool = ref<'wall' | 'empty' | 'start' | 'exit' | 'item'>('empty')
const selectedItemType = ref<ItemType>('key')
const isDrawing = ref(false)
const selectedItem = ref<any>(null)

const tileTools = [
  { value: 'empty', label: 'Empty' },
  { value: 'wall', label: 'Wall' },
  { value: 'start', label: 'Start' },
  { value: 'exit', label: 'Exit' },
]

const itemTypes: ItemType[] = ['key', 'chest', 'door', 'bed', 'food', 'weapon', 'trap', 'switch']

const currentMap = ref<LevelData>(
  props.map || createEmptyMap(16, 16)
)

const history = ref<LevelData[]>([JSON.parse(JSON.stringify(currentMap.value))])
const historyIndex = ref(0)

const canUndo = computed(() => historyIndex.value > 0)
const canRedo = computed(() => historyIndex.value < history.value.length - 1)

const canvasWidth = computed(() => Math.min(600, currentMap.value.width * 20))
const canvasHeight = computed(() => Math.min(600, currentMap.value.height * 20))

const cellWidth = computed(() => canvasWidth.value / currentMap.value.width)
const cellHeight = computed(() => canvasHeight.value / currentMap.value.height)

watch(() => props.map, (newMap) => {
  if (newMap) {
    currentMap.value = JSON.parse(JSON.stringify(newMap))
    history.value = [JSON.parse(JSON.stringify(currentMap.value))]
    historyIndex.value = 0
    nextTick(() => draw())
  }
}, { immediate: true })

const saveState = () => {
  // Remove future history if we're not at the end
  if (historyIndex.value < history.value.length - 1) {
    history.value = history.value.slice(0, historyIndex.value + 1)
  }
  history.value.push(JSON.parse(JSON.stringify(currentMap.value)))
  if (history.value.length > 50) {
    history.value.shift()
  } else {
    historyIndex.value++
  }
}

const handleUndo = () => {
  if (canUndo.value) {
    historyIndex.value--
    currentMap.value = JSON.parse(JSON.stringify(history.value[historyIndex.value]))
    emit('update:map', currentMap.value)
    nextTick(() => draw())
  }
}

const handleRedo = () => {
  if (canRedo.value) {
    historyIndex.value++
    currentMap.value = JSON.parse(JSON.stringify(history.value[historyIndex.value]))
    emit('update:map', currentMap.value)
    nextTick(() => draw())
  }
}

const getCellFromMouse = (e: MouseEvent): [number, number] | null => {
  if (!canvasRef.value) return null
  const rect = canvasRef.value.getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top
  const cellX = Math.floor(x / cellWidth.value)
  const cellY = Math.floor(y / cellHeight.value)
  if (cellX >= 0 && cellX < currentMap.value.width && cellY >= 0 && cellY < currentMap.value.height) {
    return [cellX, cellY]
  }
  return null
}

const handleMouseDown = (e: MouseEvent) => {
  const cell = getCellFromMouse(e)
  if (!cell) return
  isDrawing.value = true
  handleCellClick(cell[0], cell[1], e.button === 2)
}

const handleMouseMove = (e: MouseEvent) => {
  if (!isDrawing.value) return
  const cell = getCellFromMouse(e)
  if (!cell) return
  handleCellClick(cell[0], cell[1], false)
}

const handleMouseUp = () => {
  if (isDrawing.value) {
    isDrawing.value = false
    saveState()
    emit('update:map', currentMap.value)
  }
}

const handleRightClick = (e: MouseEvent) => {
  e.preventDefault()
  const cell = getCellFromMouse(e)
  if (!cell) return
  const [x, y] = cell
  
  // Remove item at this position
  if (currentMap.value.items) {
    const index = currentMap.value.items.findIndex(item => item.x === x && item.y === y)
    if (index >= 0) {
      currentMap.value.items.splice(index, 1)
      saveState()
      emit('update:map', currentMap.value)
      nextTick(() => draw())
    }
  }
}

const handleCellClick = (x: number, y: number, isRightClick: boolean) => {
  if (selectedTool.value === 'item') {
    if (!isRightClick) {
      // Place item
      if (!currentMap.value.items) {
        currentMap.value.items = []
      }
      const item = createItem(selectedItemType.value, x, y)
      currentMap.value.items.push(item)
      selectedItem.value = item
    }
  } else {
    // Place tile
    if (selectedTool.value === 'start') {
      // Remove old start
      for (let py = 0; py < currentMap.value.height; py++) {
        for (let px = 0; px < currentMap.value.width; px++) {
          if (currentMap.value.map[py][px] === 'S') {
            currentMap.value.map[py][px] = 0
          }
        }
      }
      currentMap.value.map[y][x] = 'S'
    } else if (selectedTool.value === 'exit') {
      // Remove old exit
      for (let py = 0; py < currentMap.value.height; py++) {
        for (let px = 0; px < currentMap.value.width; px++) {
          if (currentMap.value.map[py][px] === 'E') {
            currentMap.value.map[py][px] = 0
          }
        }
      }
      currentMap.value.map[y][x] = 'E'
    } else {
      currentMap.value.map[y][x] = selectedTool.value === 'wall' ? 1 : 0
    }
  }
  draw()
}

const draw = () => {
  if (!canvasRef.value) return
  const ctx = canvasRef.value.getContext('2d')
  if (!ctx) return

  const cw = cellWidth.value
  const ch = cellHeight.value

  ctx.clearRect(0, 0, canvasWidth.value, canvasHeight.value)

  // Draw grid
  for (let y = 0; y < currentMap.value.height; y++) {
    for (let x = 0; x < currentMap.value.width; x++) {
      const tile = currentMap.value.map[y][x]
      const px = x * cw
      const py = y * ch

      // Background
      if (tile === 1) {
        ctx.fillStyle = '#333'
      } else if (tile === 'S') {
        ctx.fillStyle = '#0f0'
      } else if (tile === 'E') {
        ctx.fillStyle = '#f00'
      } else {
        ctx.fillStyle = '#666'
      }
      ctx.fillRect(px, py, cw, ch)

      // Border
      ctx.strokeStyle = '#444'
      ctx.lineWidth = 1
      ctx.strokeRect(px, py, cw, ch)
    }
  }

  // Draw items
  if (currentMap.value.items) {
    for (const item of currentMap.value.items) {
      const px = item.x * cw
      const py = item.y * ch
      ctx.fillStyle = '#FFD700'
      ctx.fillRect(px + cw * 0.25, py + ch * 0.25, cw * 0.5, ch * 0.5)
      ctx.fillStyle = '#000'
      ctx.font = '8px monospace'
      ctx.fillText(item.type[0].toUpperCase(), px + cw * 0.35, py + ch * 0.6)
    }
  }
}

const handleGenerateRandom = () => {
  currentMap.value = generateRandomMaze(16, 16, 0.3)
  if (!currentMap.value.name) {
    currentMap.value.name = `Random Map ${Date.now()}`
  }
  history.value = [JSON.parse(JSON.stringify(currentMap.value))]
  historyIndex.value = 0
  emit('update:map', currentMap.value)
  nextTick(() => draw())
}

const handleResize = () => {
  const width = prompt('Width:', currentMap.value.width.toString())
  const height = prompt('Height:', currentMap.value.height.toString())
  if (width && height) {
    const newWidth = parseInt(width)
    const newHeight = parseInt(height)
    if (newWidth > 0 && newHeight > 0) {
      const newMap = createEmptyMap(newWidth, newHeight, currentMap.value.start_facing)
      newMap.name = currentMap.value.name
      // Copy items that fit
      if (currentMap.value.items) {
        newMap.items = currentMap.value.items.filter(
          item => item.x < newWidth && item.y < newHeight
        )
      }
      currentMap.value = newMap
      saveState()
      emit('update:map', currentMap.value)
      nextTick(() => draw())
    }
  }
}

const handleSave = () => {
  emit('save', currentMap.value)
}

const handleDownload = () => {
  downloadMap(currentMap.value)
}

onMounted(() => {
  draw()
})

watch(currentMap, () => {
  nextTick(() => draw())
}, { deep: true })
</script>

<style scoped>
.map-editor {
  display: flex;
  flex-direction: column;
  height: 100%;
  font-family: 'Courier New', Courier, monospace;
}

.editor-toolbar {
  padding: 8px;
  background: #222;
  border-bottom: 1px solid #444;
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  font-size: 11px;
}

.toolbar-section {
  display: flex;
  align-items: center;
  gap: 4px;
}

.toolbar-section label {
  color: #0f0;
  margin-right: 4px;
}

.tool-btn {
  padding: 4px 8px;
  background: #333;
  color: #0f0;
  border: 1px solid #444;
  border-radius: 2px;
  cursor: pointer;
  font-family: 'Courier New', Courier, monospace;
  font-size: 11px;
}

.tool-btn:hover:not(:disabled) {
  background: #444;
}

.tool-btn.active {
  background: #0f0;
  color: #000;
}

.tool-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.select-input {
  padding: 4px;
  background: #333;
  color: #0f0;
  border: 1px solid #444;
  border-radius: 2px;
  font-family: 'Courier New', Courier, monospace;
  font-size: 11px;
}

.editor-content {
  flex: 1;
  display: flex;
  gap: 16px;
  padding: 16px;
  overflow: auto;
}

.canvas-container {
  flex: 1;
}

.editor-canvas {
  border: 2px solid #444;
  cursor: crosshair;
  image-rendering: pixelated;
}

.item-properties {
  width: 250px;
  padding: 16px;
  background: #222;
  border: 1px solid #444;
  border-radius: 4px;
}

.item-properties h4 {
  color: #0f0;
  margin: 0 0 12px 0;
  font-size: 14px;
}

.property-group {
  margin-bottom: 12px;
}

.property-group label {
  display: block;
  color: #0f0;
  margin-bottom: 4px;
  font-size: 11px;
}

.property-input,
.property-textarea {
  width: 100%;
  padding: 4px;
  background: #333;
  color: #0f0;
  border: 1px solid #444;
  border-radius: 2px;
  font-family: 'Courier New', Courier, monospace;
  font-size: 11px;
}

.property-textarea {
  resize: vertical;
}
</style>

