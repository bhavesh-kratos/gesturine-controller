import { contextBridge } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  // Robot functions
  robot: {
    simulateKeyPress: (key: string): Promise<{ success: boolean; error?: string }> => {
      return window.electron.ipcRenderer.invoke('simulateKeyPress', key)
    },
    tapKey: (key: string): Promise<{ success: boolean; error?: string }> => {
      return window.electron.ipcRenderer.invoke('tapKey', key)
    },
    toggleKey: (key: string, down: boolean): Promise<{ success: boolean; error?: string }> => {
      return window.electron.ipcRenderer.invoke('toggleKey', key, down)
    }
  }
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
