<template>
  <div class="game-wrapper">
    <TextParser
      :get-current-tile-items="getCurrentTileItems"
      :execute-command="handleTextCommand"
    />
    
    <div class="sidebar" :class="{ open: sidebarOpen }">
      <button class="sidebar-toggle" @click="sidebarOpen = !sidebarOpen">
        {{ sidebarOpen ? '◄' : '►' }}
      </button>
      <div v-if="sidebarOpen" class="sidebar-content">
        <div class="sidebar-tabs">
          <button
            :class="['tab-btn', { active: activeTab === 'selector' }]"
            @click="activeTab = 'selector'"
          >
            Maps
          </button>
          <button
            :class="['tab-btn', { active: activeTab === 'editor' }]"
            @click="activeTab = 'editor'"
          >
            Editor
          </button>
        </div>
        <div v-if="activeTab === 'selector'" class="tab-content">
          <MapSelector
            :maps="maps.allMaps.value"
            :user-maps="maps.userMaps.value"
            :selected-map="currentMap"
            @select="handleMapSelect"
            @load="handleMapLoad"
            @delete="handleMapDelete"
            @new-map="handleNewMap"
          />
        </div>
        <div v-if="activeTab === 'editor'" class="tab-content">
          <MapEditor
            :map="editingMap"
            @update:map="handleMapUpdate"
            @save="handleMapSave"
          />
        </div>
      </div>
    </div>

    <div class="game-container">
      <canvas
        ref="canvasRef"
        id="screen"
        width="160"
        height="100"
        class="game-canvas"
      />
    </div>

    <Inventory
      :items="items.inventory.value"
      @use="handleItemUse"
      @examine="handleItemExamine"
      @drop="handleItemDrop"
    />

    <div class="hud">
      <p>ARROWS to Move & Turn</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useGame } from "./composables/useGame";
import { useMaps } from "./composables/useMaps";
import { useItems } from "./composables/useItems";
import { useTextParser, type Verb, type CommandResponse } from "./composables/useTextParser";
import TextParser from "./components/TextParser.vue";
import MapSelector from "./components/MapSelector.vue";
import MapEditor from "./components/MapEditor.vue";
import Inventory from "./components/Inventory.vue";
import type { LevelData } from "./utils/mapUtils";
import type { MapItem } from "./types/items";

const canvasRef = ref<HTMLCanvasElement | null>(null);
const sidebarOpen = ref(false);
const activeTab = ref<'selector' | 'editor'>('selector');
const currentMap = ref<LevelData | null>(null);
const editingMap = ref<LevelData | null>(null);

const maps = useMaps();
const items = useItems();

// Initialize game with item command handler
const game = useGame(
  canvasRef,
  null,
  async (verb: Verb, object: string | null, itemsOnTile: MapItem[]) => {
    return await items.executeItemCommand(verb, object, itemsOnTile);
  }
);

// Load built-in maps on mount
onMounted(async () => {
  await maps.loadBuiltInMaps();
  if (maps.allMaps.value.length > 0) {
    currentMap.value = maps.allMaps.value[0];
    game.switchMap(currentMap.value);
  }
});

const getCurrentTileItems = (): MapItem[] => {
  return game.getCurrentTileItems();
};

const handleTextCommand = async (
  verb: Verb,
  object: string | null,
  itemsOnTile: MapItem[]
): Promise<CommandResponse> => {
  // Execute item command
  const response = await items.executeItemCommand(verb, object, itemsOnTile) as CommandResponse & { item?: MapItem };
  
  // If item was picked up, remove it from map
  if (response.success && (verb === 'get' || verb === 'take') && response.item) {
    if (currentMap.value?.items) {
      const index = currentMap.value.items.findIndex(i => i.id === response.item!.id);
      if (index >= 0) {
        currentMap.value.items.splice(index, 1);
        // Update the map in the game to refresh rendering
        game.switchMap(currentMap.value);
      }
    }
  }
  
  // Return just the CommandResponse part
  return { success: response.success, message: response.message };
};

const handleMapSelect = (map: LevelData) => {
  currentMap.value = map;
  editingMap.value = null;
};

const handleMapLoad = (map: LevelData) => {
  currentMap.value = map;
  game.switchMap(map);
  sidebarOpen.value = false;
};

const handleMapDelete = (map: LevelData) => {
  if (map.name) {
    maps.deleteUserMap(map.name);
    if (currentMap.value?.name === map.name) {
      currentMap.value = null;
    }
  }
};

const handleNewMap = () => {
  editingMap.value = null;
  activeTab.value = 'editor';
};

const handleMapUpdate = (map: LevelData) => {
  editingMap.value = map;
};

const handleMapSave = (map: LevelData) => {
  if (!map.name) {
    map.name = prompt('Enter map name:') || `Map ${Date.now()}`;
  }
  maps.saveUserMap(map);
  editingMap.value = null;
  if (!currentMap.value) {
    currentMap.value = map;
    game.switchMap(map);
  }
};

const handleItemUse = (item: MapItem) => {
  // Handle item use from inventory
  const itemsOnTile = getCurrentTileItems();
  items.executeItemCommand('use', item.name, itemsOnTile);
};

const handleItemExamine = (item: MapItem) => {
  const itemsOnTile = getCurrentTileItems();
  items.executeItemCommand('look', item.name, itemsOnTile);
};

const handleItemDrop = (item: MapItem) => {
  items.removeFromInventory(item.id);
  // Add item back to map at current position
  if (currentMap.value) {
    if (!currentMap.value.items) {
      currentMap.value.items = [];
    }
    const tileX = Math.floor(game.getPlayerPosition().x);
    const tileY = Math.floor(game.getPlayerPosition().y);
    const droppedItem: MapItem = {
      ...item,
      x: tileX,
      y: tileY,
    };
    currentMap.value.items.push(droppedItem);
    game.switchMap(currentMap.value);
  }
};
</script>

<style scoped>
.game-wrapper {
  background-color: #222;
  color: #ddd;
  font-family: "Courier New", Courier, monospace;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  margin: 0;
  overflow: hidden;
  position: relative;
}

.sidebar {
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  width: 0;
  background: rgba(0, 0, 0, 0.95);
  border-right: 2px solid #444;
  z-index: 100;
  transition: width 0.3s ease;
  overflow: hidden;
}

.sidebar.open {
  width: 400px;
}

.sidebar-toggle {
  position: absolute;
  left: 100%;
  top: 50%;
  transform: translateY(-50%);
  width: 30px;
  height: 60px;
  background: #333;
  border: 2px solid #444;
  border-left: none;
  border-radius: 0 4px 4px 0;
  color: #0f0;
  cursor: pointer;
  font-size: 16px;
  z-index: 101;
}

.sidebar-toggle:hover {
  background: #444;
}

.sidebar-content {
  width: 400px;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.sidebar-tabs {
  display: flex;
  border-bottom: 1px solid #444;
}

.tab-btn {
  flex: 1;
  padding: 12px;
  background: #222;
  color: #0f0;
  border: none;
  border-right: 1px solid #444;
  cursor: pointer;
  font-family: "Courier New", Courier, monospace;
  font-size: 12px;
}

.tab-btn:last-child {
  border-right: none;
}

.tab-btn:hover {
  background: #333;
}

.tab-btn.active {
  background: #2a2a2a;
  color: #0f0;
}

.tab-content {
  flex: 1;
  overflow: auto;
}

.game-container {
  position: relative;
  border: 20px solid #444;
  border-radius: 10px;
  box-shadow: 0 0 30px rgba(0, 0, 0, 0.8);
  background: #000;
}

.game-canvas {
  display: block;
  image-rendering: pixelated;
  image-rendering: crisp-edges;
  width: 800px;
  height: 500px;
  background-color: #fff;
}

.hud {
  margin-top: 10px;
  text-align: center;
  font-size: 14px;
  color: #888;
}
</style>
