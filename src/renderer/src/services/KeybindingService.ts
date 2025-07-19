import { Keybinding } from '../store/useGestureStore'

class KeybindingService {
  private activeKeybindings: Map<string, Keybinding> = new Map()
  private keyPressListeners: Set<(keyBinding: string) => void> = new Set()
  private isRecording = false
  private recordCallback: ((keys: string) => void) | null = null

  constructor() {
    this.setupKeyListener()
  }

  private setupKeyListener(): void {
    // This is a simplified version. In a real app, you'd want to use a more sophisticated
    // key detection system, possibly with native node modules or electron IPC
    document.addEventListener('keydown', (e) => {
      if (this.isRecording) {
        this.handleRecordingKeyPress(e)
        return
      }

      const keyCombo = this.formatKeyCombo(e)
      this.notifyKeyPressListeners(keyCombo)
    })
  }

  private formatKeyCombo(e: KeyboardEvent): string {
    const keys: string[] = []

    if (e.ctrlKey) keys.push('ctrl')
    if (e.altKey) keys.push('alt')
    if (e.shiftKey) keys.push('shift')
    if (e.metaKey) keys.push('cmd')

    if (e.key !== 'Control' && e.key !== 'Alt' && e.key !== 'Shift' && e.key !== 'Meta') {
      keys.push(e.key.toLowerCase())
    }

    return keys.join('+')
  }

  private handleRecordingKeyPress(e: KeyboardEvent): void {
    e.preventDefault()
    const keyCombo = this.formatKeyCombo(e)

    if (this.recordCallback) {
      this.recordCallback(keyCombo)
      this.stopRecording()
    }
  }

  startRecording(callback: (keys: string) => void): void {
    this.isRecording = true
    this.recordCallback = callback
  }

  stopRecording(): void {
    this.isRecording = false
    this.recordCallback = null
  }

  updateBindings(bindings: Keybinding[]): void {
    this.activeKeybindings.clear()
    bindings.forEach((binding) => {
      if (binding.enabled) {
        this.activeKeybindings.set(binding.keyBinding, binding)
      }
    })
  }

  addKeyPressListener(callback: (keyBinding: string) => void): () => void {
    this.keyPressListeners.add(callback)
    return () => {
      this.keyPressListeners.delete(callback)
    }
  }

  private notifyKeyPressListeners(keyCombo: string): void {
    this.keyPressListeners.forEach((listener) => listener(keyCombo))
  }

  async simulateKeyPress(keyBinding: string): Promise<void> {
    console.log(`Simulating key press for: ${keyBinding}`)
    try {
      const result = await window.electron.ipcRenderer.invoke('simulateKeyPress', keyBinding)
      if (!result.success) {
        console.error('Failed to simulate key press:', result.error)
      }
    } catch (error) {
      console.error('Error simulating key press:', error)
    }
  }
}

export const keybindingService = new KeybindingService()
