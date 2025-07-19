import { ipcMain } from 'electron'
import robot from '@jitsi/robotjs'

class RobotService {
  constructor() {
    this.setupIpcHandlers()
  }

  private setupIpcHandlers(): void {
    // Handle key simulation requests
    ipcMain.handle('simulateKeyPress', (_event, key: string) => {
      try {
        this.simulateKeyPress(key)
        return { success: true }
      } catch (error) {
        console.error('Failed to simulate key press:', { key }, error)
        return { success: false, error: error.message }
      }
    })

    // Handle key tap requests
    ipcMain.handle('tapKey', (_event, key: string) => {
      try {
        robot.keyTap(key)
        return { success: true }
      } catch (error) {
        console.error('Failed to tap key:', error)
        return { success: false, error: error.message }
      }
    })

    // Handle key toggle requests
    ipcMain.handle('toggleKey', (_event, key: string, down: boolean) => {
      try {
        if (down) {
          robot.keyToggle(key, 'down')
        } else {
          robot.keyToggle(key, 'up')
        }
        return { success: true }
      } catch (error) {
        console.error('Failed to toggle key:', error)
        return { success: false, error: error.message }
      }
    })
  }

  private simulateKeyPress(keyBinding: string): void {
    const keys = keyBinding.toLowerCase().split('+')

    // For modifier key combinations (e.g., 'ctrl+c')
    if (keys.length > 1) {
      const modifiers = keys.slice(0, -1)
      const mainKey = keys[keys.length - 1]

      // Press all modifier keys
      modifiers.forEach((modifier) => {
        robot.keyToggle(modifier, 'down')
      })

      // Press and release the main key
      robot.keyTap(mainKey)

      // Release all modifier keys
      modifiers.forEach((modifier) => {
        robot.keyToggle(modifier, 'up')
      })
    } else {
      // For single keys
      robot.keyTap(keyBinding)
    }
  }
}

export const robotService = new RobotService()
