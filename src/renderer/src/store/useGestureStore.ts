import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export interface Keybinding {
  id: number | string
  gesture: string
  keyBinding: string
  description: string
  enabled: boolean
  hand: 'left' | 'right' | 'any'
}

export interface ProfileMap {
  [profile: string]: Keybinding[]
}

interface GestureState {
  activeProfile: string
  profiles: ProfileMap
  keybindings: Keybinding[]
  searchQuery: string
  setActiveProfile: (profile: string) => void
  addBinding: (binding: Keybinding) => void
  updateBinding: (binding: Keybinding) => void
  deleteBinding: (id: number | string) => void
  toggleBinding: (id: number | string) => void
  addProfile: (name: string) => void
  deleteProfile: (name: string) => void
  setSearchQuery: (query: string) => void
}

const DEFAULT_PROFILES: ProfileMap = {
  Gaming: [],
  Productivity: [],
  Custom: []
}

export const useGestureStore = create<GestureState>()(
  persist(
    (set, get) => ({
      activeProfile: 'Gaming',
      profiles: DEFAULT_PROFILES,
      keybindings: [],
      searchQuery: '',

      setActiveProfile: (profile) => {
        set({
          activeProfile: profile,
          keybindings: get().profiles[profile] || []
        })
      },

      addBinding: (binding) => {
        const { activeProfile, profiles } = get()
        const updatedBindings = [...(profiles[activeProfile] || []), binding]

        set((state) => ({
          keybindings: updatedBindings,
          profiles: {
            ...state.profiles,
            [activeProfile]: updatedBindings
          }
        }))
      },

      updateBinding: (binding) => {
        const { activeProfile, profiles } = get()
        const updatedBindings = profiles[activeProfile].map((b) =>
          b.id === binding.id ? binding : b
        )

        set((state) => ({
          keybindings: updatedBindings,
          profiles: {
            ...state.profiles,
            [activeProfile]: updatedBindings
          }
        }))
      },

      deleteBinding: (id) => {
        const { activeProfile, profiles } = get()
        const updatedBindings = profiles[activeProfile].filter((b) => b.id !== id)

        set((state) => ({
          keybindings: updatedBindings,
          profiles: {
            ...state.profiles,
            [activeProfile]: updatedBindings
          }
        }))
      },

      toggleBinding: (id) => {
        const { activeProfile, profiles } = get()
        const updatedBindings = profiles[activeProfile].map((b) =>
          b.id === id ? { ...b, enabled: !b.enabled } : b
        )

        set((state) => ({
          keybindings: updatedBindings,
          profiles: {
            ...state.profiles,
            [activeProfile]: updatedBindings
          }
        }))
      },

      addProfile: (name) => {
        set((state) => ({
          profiles: {
            ...state.profiles,
            [name]: []
          }
        }))
      },

      deleteProfile: (name) => {
        if (name === 'Gaming' || name === 'Productivity' || name === 'Custom') {
          return // Don't allow deleting default profiles
        }
        set((state) => {
          const { [name]: _, ...restProfiles } = state.profiles
          return {
            profiles: restProfiles,
            activeProfile: state.activeProfile === name ? 'Gaming' : state.activeProfile,
            keybindings: state.activeProfile === name ? [] : state.keybindings
          }
        })
      },

      setSearchQuery: (query) => set({ searchQuery: query })
    }),
    {
      name: 'gesture-storage',
      storage: createJSONStorage(() => localStorage)
    }
  )
)
