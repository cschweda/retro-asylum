export type ItemType = 'key' | 'chest' | 'door' | 'bed' | 'food' | 'weapon' | 'trap' | 'switch'

export interface MapItem {
  id: string // Unique identifier
  type: ItemType
  name: string // Display name (e.g., "locked chest", "brass key")
  x: number // Tile coordinate
  y: number // Tile coordinate
  properties?: {
    locked?: boolean
    keyId?: string // For doors/chests that require specific key
    healthRestore?: number // For beds/food
    damage?: number // For traps/weapons
    description?: string
    aliases?: string[] // For parser matching (e.g., ["chest", "box"])
    contents?: MapItem[] // For chests that contain items
    open?: boolean // For chests/doors
    // ... other type-specific properties
  }
}

export interface ItemDefinition {
  type: ItemType
  defaultName: string
  defaultDescription: string
  defaultAliases: string[]
  defaultProperties?: Partial<MapItem['properties']>
  sprite?: string // Sprite identifier or path
}

export const ITEM_DEFINITIONS: Record<ItemType, ItemDefinition> = {
  key: {
    type: 'key',
    defaultName: 'key',
    defaultDescription: 'A key',
    defaultAliases: ['key', 'keys'],
    defaultProperties: {},
  },
  chest: {
    type: 'chest',
    defaultName: 'chest',
    defaultDescription: 'A chest',
    defaultAliases: ['chest', 'box', 'trunk'],
    defaultProperties: {
      locked: false,
      open: false,
    },
  },
  door: {
    type: 'door',
    defaultName: 'door',
    defaultDescription: 'A door',
    defaultAliases: ['door', 'gate'],
    defaultProperties: {
      locked: false,
      open: false,
    },
  },
  bed: {
    type: 'bed',
    defaultName: 'bed',
    defaultDescription: 'A bed',
    defaultAliases: ['bed', 'cot'],
    defaultProperties: {
      healthRestore: 50,
    },
  },
  food: {
    type: 'food',
    defaultName: 'food',
    defaultDescription: 'Food',
    defaultAliases: ['food', 'rations', 'meal'],
    defaultProperties: {
      healthRestore: 25,
    },
  },
  weapon: {
    type: 'weapon',
    defaultName: 'weapon',
    defaultDescription: 'A weapon',
    defaultAliases: ['weapon', 'sword', 'knife'],
    defaultProperties: {
      damage: 10,
    },
  },
  trap: {
    type: 'trap',
    defaultName: 'trap',
    defaultDescription: 'A trap',
    defaultAliases: ['trap', 'pit'],
    defaultProperties: {
      damage: 20,
    },
  },
  switch: {
    type: 'switch',
    defaultName: 'switch',
    defaultDescription: 'A switch',
    defaultAliases: ['switch', 'button', 'lever'],
    defaultProperties: {},
  },
}

export function createItem(
  type: ItemType,
  x: number,
  y: number,
  name?: string,
  properties?: Partial<MapItem['properties']>
): MapItem {
  const definition = ITEM_DEFINITIONS[type]
  return {
    id: `${type}-${x}-${y}-${Date.now()}`,
    type,
    name: name || definition.defaultName,
    x,
    y,
    properties: {
      ...definition.defaultProperties,
      ...properties,
      aliases: properties?.aliases || definition.defaultAliases,
      description: properties?.description || definition.defaultDescription,
    },
  }
}

export function getItemAliases(item: MapItem): string[] {
  return item.properties?.aliases || ITEM_DEFINITIONS[item.type].defaultAliases
}

export function matchesItemName(item: MapItem, searchTerm: string): boolean {
  const normalized = searchTerm.toLowerCase().trim()
  const nameMatch = item.name.toLowerCase().includes(normalized)
  const aliasMatch = getItemAliases(item).some(
    (alias) => alias.toLowerCase() === normalized || alias.toLowerCase().includes(normalized)
  )
  return nameMatch || aliasMatch
}

