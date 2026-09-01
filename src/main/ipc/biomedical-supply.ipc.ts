import { ipcMain } from 'electron'
import { biomedicalSupplyInputSchema, idSchema } from '../../shared/validation/schemas'
import { BiomedicalSupplyService } from '../services/biomedical-supply.service'
import { safeHandler } from './handler'

export function registerBiomedicalSupplyIpc(service = new BiomedicalSupplyService()): void {
  ipcMain.handle('biomedical-supplies:list', () => safeHandler(() => service.list()))
  ipcMain.handle('biomedical-supplies:get', (_event, id) => safeHandler(() => service.get(idSchema.parse(id))))
  ipcMain.handle('biomedical-supplies:create', (_event, input) => safeHandler(() => service.create(biomedicalSupplyInputSchema.parse(input))))
  ipcMain.handle('biomedical-supplies:update', (_event, id, input) => safeHandler(() => service.update(idSchema.parse(id), biomedicalSupplyInputSchema.parse(input))))
  ipcMain.handle('biomedical-supplies:delete', (_event, id) => safeHandler(() => service.delete(idSchema.parse(id))))
}
