import { Keybinding } from '../store/useGestureStore'
import { keybindingService } from './KeybindingService'

class GestureDetectionService {
  private activeGesture: string | null = null
  private activeKeyInterval: NodeJS.Timeout | null = null
  private activeBindings: Map<string, Keybinding> = new Map()
  private isServiceActive: boolean = false

  constructor() {
    this.stopGestureKeyPress = this.stopGestureKeyPress.bind(this)
    this.handleGestureDetected = this.handleGestureDetected.bind(this)
  }

  updateActiveBindings(bindings: Keybinding[]): void {
    this.activeBindings.clear()
    bindings.forEach((binding) => {
      if (binding.enabled) {
        this.activeBindings.set(binding.gesture, binding)
      }
    })
  }

  start(): void {
    this.isServiceActive = true
  }

  stop(): void {
    this.isServiceActive = false
    this.stopGestureKeyPress()
  }

  private stopGestureKeyPress(): void {
    if (this.activeKeyInterval) {
      clearInterval(this.activeKeyInterval)
      this.activeKeyInterval = null
    }
    this.activeGesture = null
  }

  handleGestureDetected(gesture: string | null, hand: 'left' | 'right' | 'any' = 'any'): void {
    if (!this.isServiceActive) return

    // If no gesture is detected or it's the same as current, do nothing
    if (gesture === this.activeGesture) return

    // Stop any existing gesture key press
    this.stopGestureKeyPress()

    // If no gesture is detected, we're done
    if (!gesture) return

    // Find matching binding for the detected gesture
    const binding = this.activeBindings.get(gesture)
    if (!binding) return

    console.log(`Gesture detected: ${gesture}, Hand: ${hand}`)
    // Check if hand matches (if specified)
    if (binding.hand !== 'any' && binding.hand !== hand) return

    // Start continuous key press for the new gesture
    this.activeGesture = gesture
    this.activeKeyInterval = setInterval(() => {
      keybindingService.simulateKeyPress(binding.keyBinding)
    }, 100) // Adjust interval as needed
  }

  // Use this method to clean up when component unmounts
  destroy(): void {
    this.stop()
    this.activeBindings.clear()
  }
}

// Create a singleton instance
export const gestureDetectionService = new GestureDetectionService()
