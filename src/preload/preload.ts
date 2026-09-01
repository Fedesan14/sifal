import { contextBridge, ipcRenderer } from 'electron'
import type { DesktopApi } from '../shared/types/api'

const api: DesktopApi = {
  medications: {
    list: () => ipcRenderer.invoke('medications:list'), get: (id) => ipcRenderer.invoke('medications:get', id),
    create: (input) => ipcRenderer.invoke('medications:create', input), update: (id, input) => ipcRenderer.invoke('medications:update', id, input),
    delete: (id) => ipcRenderer.invoke('medications:delete', id)
  },
  biomedicalSupplies: {
    list: () => ipcRenderer.invoke('biomedical-supplies:list'), get: (id) => ipcRenderer.invoke('biomedical-supplies:get', id),
    create: (input) => ipcRenderer.invoke('biomedical-supplies:create', input), update: (id, input) => ipcRenderer.invoke('biomedical-supplies:update', id, input),
    delete: (id) => ipcRenderer.invoke('biomedical-supplies:delete', id)
  }
}
contextBridge.exposeInMainWorld('api', api)
