import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { gestureDetectionService } from '../services/GestureDetectionService'

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
  isGestureServiceActive: boolean
  setActiveProfile: (profile: string) => void
  addBinding: (binding: Keybinding) => void
  updateBinding: (binding: Keybinding) => void
  deleteBinding: (id: number | string) => void
  toggleBinding: (id: number | string) => void
  addProfile: (name: string) => void
  deleteProfile: (name: string) => void
  setSearchQuery: (query: string) => void
  initGestureService: () => void
  toggleGestureService: () => void
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
      isGestureServiceActive: false,

      setActiveProfile: (profile) => {
        const bindings = get().profiles[profile] || []
        // When changing profiles, update the gesture detection service
        gestureDetectionService.updateActiveBindings(bindings)
        gestureDetectionService.start()

        set({
          activeProfile: profile,
          keybindings: bindings
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

        // Update gesture service with new bindings
        gestureDetectionService.updateActiveBindings(updatedBindings)
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

        // Update gesture service with modified bindings
        gestureDetectionService.updateActiveBindings(updatedBindings)
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

        // Update gesture service with remaining bindings
        gestureDetectionService.updateActiveBindings(updatedBindings)
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

        // Update gesture service with modified bindings
        gestureDetectionService.updateActiveBindings(updatedBindings)
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
          const { [name]: removedProfile, ...restProfiles } = state.profiles
          const isActiveProfile = state.activeProfile === name

          if (isActiveProfile) {
            // If deleting active profile, deactivate gesture service
            gestureDetectionService.stop()
          }

          const newState = {
            profiles: restProfiles,
            activeProfile: isActiveProfile ? 'Gaming' : state.activeProfile,
            keybindings: isActiveProfile ? [] : state.keybindings
          }

          if (isActiveProfile) {
            // If switching to Gaming profile, update gesture service
            gestureDetectionService.updateActiveBindings(newState.keybindings)
            gestureDetectionService.start()
          }

          return newState
        })
      },

      setSearchQuery: (query) => set({ searchQuery: query }),

      initGestureService: () => {
        const { isGestureServiceActive, activeProfile } = get()
        if (isGestureServiceActive) {
          const bindings = get().profiles[activeProfile] || []
          // When changing profiles, update the gesture detection service
          gestureDetectionService.updateActiveBindings(bindings)
          gestureDetectionService.start() // gestureDetectionService.start()
        } else {
          gestureDetectionService.stop()
        }
      },

      toggleGestureService: () => {
        const state = get()
        const newIsActive = !state.isGestureServiceActive
        if (newIsActive) {
          gestureDetectionService.start()
        } else {
          gestureDetectionService.stop()
        }
        set({ isGestureServiceActive: newIsActive })
      }
    }),
    {
      name: 'gesture-storage',
      storage: createJSONStorage(() => localStorage)
    }
  )
)
