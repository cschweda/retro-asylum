<template>
  <div class="text-parser">
    <div class="parser-input-container">
      <div class="prompt">&gt;</div>
      <input
        ref="inputRef"
        v-model="parser.currentInput.value"
        type="text"
        class="parser-input"
        placeholder="Type a command (e.g., 'open chest', 'get key')..."
        @keydown="handleKeyDown"
        @input="handleInput"
        @focus="handleFocus"
      />
      <div v-if="parser.suggestions.value.length > 0" class="suggestions">
        <div
          v-for="(suggestion, index) in parser.suggestions.value"
          :key="index"
          class="suggestion"
        >
          {{ suggestion }}
        </div>
      </div>
    </div>
    <div class="parser-response" :class="{ error: parser.lastResponse.value && !parser.lastResponse.value.success, ready: !parser.lastResponse.value }">
      <span v-if="parser.lastResponse.value">{{ parser.lastResponse.value.message }}</span>
      <span v-else class="ready-text">Ready...</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import { useTextParser, type Verb, type CommandResponse } from '../composables/useTextParser'
import type { MapItem } from '../types/items'

interface Props {
  getCurrentTileItems: () => MapItem[]
  executeCommand: (verb: Verb, object: string | null, items: MapItem[]) => Promise<CommandResponse>
}

const props = defineProps<Props>()

const inputRef = ref<HTMLInputElement | null>(null)
const parser = useTextParser(props.getCurrentTileItems, props.executeCommand)

const handleKeyDown = async (e: KeyboardEvent) => {
  if (e.key === 'Enter') {
    e.preventDefault()
    const input = parser.currentInput.value
    if (input.trim()) {
      await parser.execute(input)
      parser.clearInput()
      await nextTick()
      inputRef.value?.focus()
    }
  } else if (e.key === 'Escape') {
    parser.clearInput()
    inputRef.value?.blur()
  }
}

const handleInput = () => {
  parser.updateSuggestions(parser.currentInput.value)
}

const handleFocus = () => {
  // Keep focus on input
}

onMounted(() => {
  // Auto-focus on mount
  nextTick(() => {
    inputRef.value?.focus()
  })
})

defineExpose({
  focus: () => inputRef.value?.focus(),
})
</script>

<style scoped>
.text-parser {
  position: fixed;
  top: 10px;
  left: 50%;
  transform: translateX(-50%);
  width: 600px;
  max-width: 90vw;
  z-index: 1000;
  background: rgba(0, 0, 0, 0.9);
  border: 2px solid #444;
  border-radius: 4px;
  padding: 8px;
  font-family: 'Courier New', Courier, monospace;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.parser-input-container {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
}

.prompt {
  color: #0f0;
  font-weight: bold;
  user-select: none;
}

.parser-input {
  flex: 1;
  background: #000;
  color: #0f0;
  border: 1px solid #444;
  padding: 4px 8px;
  font-family: 'Courier New', Courier, monospace;
  font-size: 14px;
  outline: none;
}

.parser-input:focus {
  border-color: #0f0;
}

.parser-input::placeholder {
  color: #666;
}

.suggestions {
  position: absolute;
  top: 100%;
  left: 20px;
  right: 0;
  background: rgba(0, 0, 0, 0.95);
  border: 1px solid #444;
  border-top: none;
  max-height: 150px;
  overflow-y: auto;
  z-index: 1001;
}

.suggestion {
  padding: 4px 8px;
  color: #aaa;
  font-size: 12px;
  cursor: pointer;
}

.suggestion:hover {
  background: #222;
  color: #0f0;
}

.parser-response {
  padding: 6px 8px;
  color: #0f0;
  font-size: 12px;
  min-height: 20px;
  background: rgba(0, 0, 0, 0.5);
  border: 1px solid #333;
  border-radius: 2px;
  word-wrap: break-word;
  flex-shrink: 0;
}

.parser-response.error {
  color: #f00;
}

.parser-response.ready {
  color: #666;
}

.ready-text {
  font-style: italic;
}
</style>

