import { ref, computed } from 'vue'
import type { LevelData } from '../utils/mapUtils'
import { validateMap, deserializeMap } from '../utils/mapUtils'

const STORAGE_KEY = 'retro-asylum-maps'

export function useMaps() {
  const builtInMaps = ref<LevelData[]>([])
  const userMaps = ref<LevelData[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const allMaps = computed(() => [...builtInMaps.value, ...userMaps.value])

  const loadBuiltInMaps = async () => {
    loading.value = true
    error.value = null
    try {
      // Try to load level1.json
      try {
        const response = await fetch('/maps/level1.json')
        if (response.ok) {
          const data = await response.json()
          if (validateMap(data)) {
            builtInMaps.value = [data]
          }
        }
      } catch (e) {
        console.warn('Could not load built-in maps:', e)
      }

      // Could extend to load multiple maps from /maps/ directory
      // For now, we just load level1.json
    } catch (e) {
      error.value = 'Failed to load built-in maps'
      console.error(e)
    } finally {
      loading.value = false
    }
  }

  const loadUserMaps = () => {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return
    }
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed)) {
          userMaps.value = parsed.filter((map: any) => validateMap(map))
        }
      }
    } catch (e) {
      console.error('Failed to load user maps:', e)
      error.value = 'Failed to load user maps'
    }
  }

  const saveUserMap = (map: LevelData) => {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return false
    }
    try {
      if (!validateMap(map)) {
        throw new Error('Invalid map data')
      }

      const mapToSave = {
        ...map,
        createdAt: map.createdAt || new Date().toISOString(),
      }

      const existing = userMaps.value.findIndex(m => m.name === mapToSave.name)
      if (existing >= 0) {
        userMaps.value[existing] = mapToSave
      } else {
        userMaps.value.push(mapToSave)
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(userMaps.value))
      return true
    } catch (e) {
      console.error('Failed to save map:', e)
      error.value = 'Failed to save map'
      return false
    }
  }

  const deleteUserMap = (mapName: string) => {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return false
    }
    try {
      userMaps.value = userMaps.value.filter(m => m.name !== mapName)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(userMaps.value))
      return true
    } catch (e) {
      console.error('Failed to delete map:', e)
      error.value = 'Failed to delete map'
      return false
    }
  }

  const getUserMap = (name: string): LevelData | null => {
    return userMaps.value.find(m => m.name === name) || null
  }

  const getMap = (name: string): LevelData | null => {
    return allMaps.value.find(m => m.name === name) || null
  }

  const importMap = (json: string): LevelData | null => {
    const map = deserializeMap(json)
    if (map) {
      return map
    }
    return null
  }

  // Initialize only on client side
  if (typeof window !== 'undefined') {
    loadUserMaps()
  }

  return {
    builtInMaps: computed(() => builtInMaps.value),
    userMaps: computed(() => userMaps.value),
    allMaps,
    loading: computed(() => loading.value),
    error: computed(() => error.value),
    loadBuiltInMaps,
    loadUserMaps,
    saveUserMap,
    deleteUserMap,
    getUserMap,
    getMap,
    importMap,
  }
}

