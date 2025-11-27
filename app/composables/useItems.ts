import { ref, computed } from 'vue'
import type { MapItem } from '../types/items'
import type { Verb, CommandResponse } from './useTextParser'

export function useItems() {
  const inventory = ref<MapItem[]>([])
  const playerHealth = ref(100)
  const maxHealth = ref(100)

  const addToInventory = (item: MapItem) => {
    // Create a copy for inventory (remove position)
    const inventoryItem: MapItem = {
      ...item,
      x: -1,
      y: -1,
    }
    inventory.value.push(inventoryItem)
  }

  const removeFromInventory = (itemId: string) => {
    const index = inventory.value.findIndex(item => item.id === itemId)
    if (index >= 0) {
      inventory.value.splice(index, 1)
      return true
    }
    return false
  }

  const hasItem = (itemId: string): boolean => {
    return inventory.value.some(item => item.id === itemId)
  }

  const findItemInInventory = (searchTerm: string): MapItem | null => {
    const normalized = searchTerm.toLowerCase().trim()
    for (const item of inventory.value) {
      if (item.name.toLowerCase() === normalized) return item
      if (item.properties?.aliases?.some(alias => alias.toLowerCase() === normalized)) return item
      if (item.name.toLowerCase().includes(normalized)) return item
    }
    return null
  }

  const restoreHealth = (amount: number) => {
    playerHealth.value = Math.min(maxHealth.value, playerHealth.value + amount)
  }

  const takeDamage = (amount: number) => {
    playerHealth.value = Math.max(0, playerHealth.value - amount)
  }

  const executeItemCommand = async (
    verb: Verb,
    object: string | null,
    items: MapItem[]
  ): Promise<CommandResponse & { item?: MapItem }> => {
    // Handle inventory command
    if (verb === 'inventory' || verb === 'i') {
      if (inventory.value.length === 0) {
        return { success: true, message: 'You are carrying nothing.' }
      }
      const itemsList = inventory.value.map(item => item.name).join(', ')
      return { success: true, message: `You are carrying: ${itemsList}` }
    }

    // Only items on the current tile can be interacted with
    // This is already filtered by getCurrentTileItems() in the parser, but double-check
    if (!object) {
      return { success: false, message: "What do you want to interact with?" }
    }
    
    if (items.length === 0) {
      return { success: false, message: "I don't see that here." }
    }

    // Find the item - improved matching
    const normalizedObject = object.toLowerCase().trim()
    const item = items.find(i => {
      const itemName = i.name.toLowerCase()
      // Exact match
      if (itemName === normalizedObject) return true
      // Alias match
      if (i.properties?.aliases?.some(alias => alias.toLowerCase() === normalizedObject)) return true
      // Partial match - check if object is contained in name
      if (itemName.includes(normalizedObject)) return true
      // Reverse - check if name is contained in object (for "get bread" matching "bread")
      if (normalizedObject.includes(itemName)) return true
      return false
    })

    if (!item) {
      return { success: false, message: `I don't see a ${object} here.` }
    }

    // Execute verb-specific logic
    switch (verb) {
      case 'get':
      case 'take':
        if (item.type === 'key' || item.type === 'food' || item.type === 'weapon') {
          addToInventory(item)
          return { success: true, message: `You take the ${item.name}.`, item }
        }
        return { success: false, message: `You can't take the ${item.name}.` }

      case 'look':
      case 'examine':
        const desc = item.properties?.description || `A ${item.name}.`
        return { success: true, message: desc, item }

      case 'open':
        if (item.type === 'chest') {
          if (item.properties?.locked) {
            return { success: false, message: 'The chest is locked.' }
          }
          if (item.properties?.open) {
            return { success: false, message: 'The chest is already open.' }
          }
          // Open chest logic would go here
          return { success: true, message: 'You open the chest.' }
        }
        if (item.type === 'door') {
          if (item.properties?.locked) {
            return { success: false, message: 'The door is locked.' }
          }
          return { success: true, message: 'You open the door.' }
        }
        return { success: false, message: `You can't open the ${item.name}.` }

      case 'close':
        if (item.type === 'door' || item.type === 'chest') {
          return { success: true, message: `You close the ${item.name}.` }
        }
        return { success: false, message: `You can't close the ${item.name}.` }

      case 'unlock':
        if (item.properties?.locked) {
          if (item.properties?.keyId) {
            // Check if player has the key
            const hasKey = inventory.value.some(invItem => invItem.id === item.properties?.keyId)
            if (!hasKey) {
              return { success: false, message: `The ${item.name} is locked and you don't have the key.` }
            }
            // Unlock it
            item.properties.locked = false
            return { success: true, message: `You unlock the ${item.name} with the key.` }
          }
          return { success: false, message: `The ${item.name} can't be unlocked.` }
        }
        return { success: false, message: `The ${item.name} is not locked.` }

      case 'use':
        if (item.type === 'bed') {
          const restore = item.properties?.healthRestore || 50
          restoreHealth(restore)
          return { success: true, message: `You rest on the bed and restore ${restore} health.` }
        }
        if (item.type === 'food') {
          const restore = item.properties?.healthRestore || 25
          restoreHealth(restore)
          return { success: true, message: `You eat the ${item.name} and restore ${restore} health.` }
        }
        return { success: false, message: `You can't use the ${item.name} that way.` }

      case 'eat':
        if (item.type === 'food') {
          const restore = item.properties?.healthRestore || 25
          restoreHealth(restore)
          return { success: true, message: `You eat the ${item.name} and restore ${restore} health.` }
        }
        return { success: false, message: `You can't eat the ${item.name}.` }

      case 'read':
        if (item.properties?.description) {
          return { success: true, message: item.properties.description }
        }
        return { success: false, message: `There's nothing to read on the ${item.name}.` }

      default:
        return { success: false, message: `I don't know how to ${verb} that.` }
    }
  }

  return {
    inventory: computed(() => inventory.value),
    playerHealth: computed(() => playerHealth.value),
    maxHealth: computed(() => maxHealth.value),
    addToInventory,
    removeFromInventory,
    hasItem,
    findItemInInventory,
    restoreHealth,
    takeDamage,
    executeItemCommand,
  }
}

