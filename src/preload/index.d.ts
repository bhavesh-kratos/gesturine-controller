import { ElectronAPI } from '@electron-toolkit/preload'

interface RobotApi {
  simulateKeyPress(key: string): Promise<{ success: boolean; error?: string }>
  tapKey(key: string): Promise<{ success: boolean; error?: string }>
  toggleKey(key: string, down: boolean): Promise<{ success: boolean; error?: string }>
}

interface Api {
  robot: RobotApi
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: Api
  }
}
