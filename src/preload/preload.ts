import { contextBridge, ipcRenderer } from 'electron'
import type { CrudApi, DesktopApi } from '../shared/types/api'

const crud = <T, TInput>(resource: string): CrudApi<T, TInput> => ({
  list: () => ipcRenderer.invoke(`${resource}:list`),
  get: (id) => ipcRenderer.invoke(`${resource}:get`, id),
  create: (input) => ipcRenderer.invoke(`${resource}:create`, input),
  update: (id, input) => ipcRenderer.invoke(`${resource}:update`, id, input),
  delete: (id) => ipcRenderer.invoke(`${resource}:delete`, id)
})

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
  },
  grupos: crud('grupos'),
  marcas: crud('marcas'),
  dosis: crud('dosis'),
  presentaciones: crud('presentaciones'),
  ubicaciones: crud('ubicaciones'),
  drogas: crud('drogas'),
  medicamentos: crud('medicamentos')
}
contextBridge.exposeInMainWorld('api', api)
