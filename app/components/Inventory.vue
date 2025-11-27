<template>
  <div class="inventory-panel" :class="{ open: isOpen }">
    <button class="inventory-toggle" @click="toggle">
      {{ isOpen ? '▼' : '▲' }} Inventory
    </button>
    <div v-if="isOpen" class="inventory-content">
      <div v-if="items.length === 0" class="empty-inventory">
        You are carrying nothing.
      </div>
      <div v-else class="inventory-items">
        <div
          v-for="item in items"
          :key="item.id"
          class="inventory-item"
          @mouseenter="hoveredItem = item"
          @mouseleave="hoveredItem = null"
        >
          <div class="item-name">{{ item.name }}</div>
          <div class="item-actions">
            <button @click="handleUse(item)" class="action-btn">Use</button>
            <button @click="handleExamine(item)" class="action-btn">Examine</button>
            <button @click="handleDrop(item)" class="action-btn">Drop</button>
          </div>
        </div>
      </div>
      <div v-if="hoveredItem" class="item-description">
        {{ hoveredItem.properties?.description || `A ${hoveredItem.name}.` }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { MapItem } from '../types/items'

interface Props {
  items: MapItem[]
}

interface Emits {
  (e: 'use', item: MapItem): void
  (e: 'examine', item: MapItem): void
  (e: 'drop', item: MapItem): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const isOpen = ref(true)
const hoveredItem = ref<MapItem | null>(null)

const toggle = () => {
  isOpen.value = !isOpen.value
}

const handleUse = (item: MapItem) => {
  emit('use', item)
}

const handleExamine = (item: MapItem) => {
  emit('examine', item)
}

const handleDrop = (item: MapItem) => {
  emit('drop', item)
}
</script>

<style scoped>
.inventory-panel {
  position: fixed;
  bottom: 10px;
  right: 10px;
  width: 250px;
  max-height: 400px;
  background: rgba(0, 0, 0, 0.9);
  border: 2px solid #444;
  border-radius: 4px;
  font-family: 'Courier New', Courier, monospace;
  z-index: 1000;
}

.inventory-toggle {
  width: 100%;
  padding: 8px;
  background: #333;
  color: #0f0;
  border: none;
  border-bottom: 1px solid #444;
  cursor: pointer;
  font-family: 'Courier New', Courier, monospace;
  font-size: 12px;
}

.inventory-toggle:hover {
  background: #444;
}

.inventory-content {
  padding: 8px;
  max-height: 350px;
  overflow-y: auto;
}

.empty-inventory {
  color: #888;
  text-align: center;
  padding: 20px;
  font-size: 12px;
}

.inventory-items {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.inventory-item {
  padding: 8px;
  background: #222;
  border: 1px solid #444;
  border-radius: 2px;
}

.item-name {
  color: #0f0;
  font-weight: bold;
  margin-bottom: 4px;
  font-size: 12px;
}

.item-actions {
  display: flex;
  gap: 4px;
}

.action-btn {
  flex: 1;
  padding: 4px;
  background: #333;
  color: #0f0;
  border: 1px solid #444;
  border-radius: 2px;
  cursor: pointer;
  font-family: 'Courier New', Courier, monospace;
  font-size: 10px;
}

.action-btn:hover {
  background: #444;
}

.item-description {
  margin-top: 8px;
  padding: 8px;
  background: #111;
  border: 1px solid #444;
  border-radius: 2px;
  color: #aaa;
  font-size: 11px;
  font-style: italic;
}
</style>

