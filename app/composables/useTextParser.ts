import { ref, computed } from 'vue'
import type { MapItem } from '../types/items'
import { matchesItemName } from '../types/items'

export type Verb = 
  | 'open' | 'close' | 'get' | 'take' | 'drop' | 'use' | 'look' | 'examine' 
  | 'go' | 'move' | 'unlock' | 'lock' | 'push' | 'pull' | 'eat' | 'drink' 
  | 'read' | 'give' | 'put' | 'inventory' | 'i'

export interface ParsedCommand {
  verb: Verb | null
  object: string | null
  raw: string
}

export interface CommandResponse {
  success: boolean
  message: string
}

const VERB_SYNONYMS: Record<string, Verb> = {
  'get': 'get',
  'take': 'get',
  'grab': 'get',
  'pick': 'get',
  'look': 'look',
  'examine': 'look',
  'inspect': 'look',
  'read': 'read',
  'i': 'inventory',
  'inv': 'inventory',
  'inventory': 'inventory',
  'open': 'open',
  'close': 'close',
  'shut': 'close',
  'use': 'use',
  'drop': 'drop',
  'unlock': 'unlock',
  'lock': 'lock',
  'go': 'go',
  'move': 'go',
  'walk': 'go',
  'push': 'push',
  'pull': 'pull',
  'eat': 'eat',
  'drink': 'drink',
  'give': 'give',
  'put': 'put',
}

const VERBS: Verb[] = [
  'open', 'close', 'get', 'drop', 'use', 'look', 'go', 'unlock', 'lock',
  'push', 'pull', 'eat', 'drink', 'read', 'give', 'put', 'inventory'
]

export function useTextParser(
  getCurrentTileItems: () => MapItem[],
  executeCommand: (verb: Verb, object: string | null, items: MapItem[]) => Promise<CommandResponse>
) {
  const currentInput = ref('')
  const lastResponse = ref<CommandResponse | null>(null)
  const suggestions = ref<string[]>([])

  const parseCommand = (input: string): ParsedCommand => {
    const trimmed = input.trim().toLowerCase()
    if (!trimmed) {
      return { verb: null, object: null, raw: input }
    }

    const parts = trimmed.split(/\s+/)
    if (parts.length === 0) {
      return { verb: null, object: null, raw: input }
    }

    // Check if first word is a verb
    const firstWord = parts[0]
    const verb = VERB_SYNONYMS[firstWord] || null

    if (verb === 'inventory' || verb === 'i') {
      return { verb, object: null, raw: input }
    }

    // Get object (rest of the command)
    const object = parts.length > 1 ? parts.slice(1).join(' ') : null

    return { verb, object, raw: input }
  }

  const findObject = (searchTerm: string | null, items: MapItem[]): MapItem | null => {
    if (!searchTerm) return null

    const normalized = searchTerm.toLowerCase().trim()
    
    // Try exact match first
    for (const item of items) {
      if (item.name.toLowerCase() === normalized) {
        return item
      }
      const aliases = item.properties?.aliases || []
      if (aliases.some(alias => alias.toLowerCase() === normalized)) {
        return item
      }
    }

    // Try partial match
    for (const item of items) {
      if (matchesItemName(item, normalized)) {
        return item
      }
    }

    return null
  }

  const execute = async (input: string): Promise<CommandResponse> => {
    if (!input.trim()) {
      return { success: false, message: '' }
    }

    const parsed = parseCommand(input)
    
    if (!parsed.verb) {
      return { success: false, message: "I don't understand that verb." }
    }

    const items = getCurrentTileItems()

    // Handle inventory command
    if (parsed.verb === 'inventory') {
      return executeCommand(parsed.verb, null, items)
    }

    // For commands that need an object
    if (parsed.verb !== 'inventory' && !parsed.object) {
      return { success: false, message: `What do you want to ${parsed.verb}?` }
    }

    // Find the object
    const targetItem = parsed.object ? findObject(parsed.object, items) : null

    if (parsed.object && !targetItem) {
      return { success: false, message: `I don't see a ${parsed.object} here.` }
    }

    // Execute the command
    const response = await executeCommand(parsed.verb, parsed.object, items)

    lastResponse.value = response
    return response
  }

  const updateSuggestions = (input: string) => {
    const trimmed = input.trim().toLowerCase()
    if (!trimmed) {
      suggestions.value = []
      return
    }

    const items = getCurrentTileItems()
    const parts = trimmed.split(/\s+/)
    
    if (parts.length === 1) {
      // Suggest verbs
      const verbSuggestions = VERBS.filter(v => v.startsWith(trimmed))
      suggestions.value = verbSuggestions.slice(0, 5)
    } else {
      // Suggest objects
      const objectPart = parts.slice(1).join(' ')
      const itemSuggestions = items
        .filter(item => matchesItemName(item, objectPart))
        .map(item => item.name)
        .slice(0, 5)
      suggestions.value = itemSuggestions
    }
  }

  return {
    currentInput,
    lastResponse,
    suggestions,
    execute,
    parseCommand,
    updateSuggestions,
    clearInput: () => {
      currentInput.value = ''
    },
  }
}

