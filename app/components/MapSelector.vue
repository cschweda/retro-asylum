<template>
  <div class="map-selector">
    <div class="map-selector-header">
      <h3>Maps</h3>
      <button @click="handleNewMap" class="new-map-btn">New Map</button>
    </div>
    <div class="map-list">
      <div
        v-for="map in maps"
        :key="map.name || 'unnamed'"
        class="map-item"
        :class="{ active: selectedMap?.name === map.name }"
        @click="selectMap(map)"
      >
        <div class="map-preview">
          <canvas
            :ref="el => setPreviewCanvas(el, map)"
            :width="64"
            :height="64"
            class="preview-canvas"
          />
        </div>
        <div class="map-info">
          <div class="map-name">{{ map.name || 'Unnamed Map' }}</div>
          <div class="map-details">
            {{ map.width }}x{{ map.height }}
            <span v-if="map.createdAt" class="map-date">
              {{ formatDate(map.createdAt) }}
            </span>
          </div>
        </div>
        <div class="map-actions">
          <button @click.stop="handleLoad(map)" class="action-btn load">Load</button>
          <button
            v-if="isUserMap(map)"
            @click.stop="handleDelete(map)"
            class="action-btn delete"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { LevelData } from '../utils/mapUtils'

interface Props {
  maps: LevelData[]
  userMaps: LevelData[]
  selectedMap: LevelData | null
}

interface Emits {
  (e: 'select', map: LevelData): void
  (e: 'load', map: LevelData): void
  (e: 'delete', map: LevelData): void
  (e: 'new-map'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const canvasRefs = new Map<string, HTMLCanvasElement>()

const setPreviewCanvas = (el: any, map: LevelData) => {
  if (el && el instanceof HTMLCanvasElement) {
    canvasRefs.set(map.name || 'unnamed', el)
    drawPreview(el, map)
  }
}

const drawPreview = (canvas: HTMLCanvasElement, map: LevelData) => {
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const cellSize = canvas.width / map.width
  const scale = Math.min(canvas.width / map.width, canvas.height / map.height)

  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  for (let y = 0; y < map.height; y++) {
    for (let x = 0; x < map.width; x++) {
      const tile = map.map[y][x]
      const px = x * scale
      const py = y * scale

      if (tile === 1) {
        ctx.fillStyle = '#333'
      } else if (tile === 'S') {
        ctx.fillStyle = '#0f0'
      } else if (tile === 'E') {
        ctx.fillStyle = '#f00'
      } else {
        ctx.fillStyle = '#666'
      }

      ctx.fillRect(px, py, scale, scale)
    }
  }

  // Draw items
  if (map.items) {
    for (const item of map.items) {
      const px = item.x * scale
      const py = item.y * scale
      ctx.fillStyle = '#FFD700'
      ctx.fillRect(px, py, scale * 0.5, scale * 0.5)
    }
  }
}

const selectMap = (map: LevelData) => {
  emit('select', map)
}

const handleLoad = (map: LevelData) => {
  emit('load', map)
}

const handleDelete = (map: LevelData) => {
  if (confirm(`Delete map "${map.name}"?`)) {
    emit('delete', map)
  }
}

const isUserMap = (map: LevelData): boolean => {
  return props.userMaps.some(um => um.name === map.name)
}

const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString()
  } catch {
    return ''
  }
}

const handleNewMap = () => {
  emit('new-map')
}
</script>

<style scoped>
.map-selector {
  padding: 16px;
}

.map-selector-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

h3 {
  color: #0f0;
  margin: 0;
  font-size: 16px;
  font-family: 'Courier New', Courier, monospace;
}

.new-map-btn {
  padding: 6px 12px;
  background: #333;
  color: #0f0;
  border: 1px solid #444;
  border-radius: 2px;
  cursor: pointer;
  font-family: 'Courier New', Courier, monospace;
  font-size: 11px;
}

.new-map-btn:hover {
  background: #444;
}

.map-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 400px;
  overflow-y: auto;
}

.map-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px;
  background: #222;
  border: 1px solid #444;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.2s;
}

.map-item:hover {
  background: #333;
}

.map-item.active {
  background: #2a2a2a;
  border-color: #0f0;
}

.map-preview {
  flex-shrink: 0;
}

.preview-canvas {
  width: 64px;
  height: 64px;
  image-rendering: pixelated;
  border: 1px solid #444;
}

.map-info {
  flex: 1;
  min-width: 0;
}

.map-name {
  color: #0f0;
  font-weight: bold;
  font-size: 14px;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.map-details {
  color: #888;
  font-size: 11px;
}

.map-date {
  margin-left: 8px;
}

.map-actions {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}

.action-btn {
  padding: 4px 8px;
  background: #333;
  color: #0f0;
  border: 1px solid #444;
  border-radius: 2px;
  cursor: pointer;
  font-family: 'Courier New', Courier, monospace;
  font-size: 11px;
}

.action-btn:hover {
  background: #444;
}

.action-btn.delete {
  color: #f00;
}

.action-btn.delete:hover {
  background: #422;
}
</style>

