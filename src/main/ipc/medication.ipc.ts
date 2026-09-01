import { ipcMain } from 'electron'
import { idSchema, medicationInputSchema } from '../../shared/validation/schemas'
import { MedicationService } from '../services/medication.service'
import { safeHandler } from './handler'

export function registerMedicationIpc(service = new MedicationService()): void {
  ipcMain.handle('medications:list', () => safeHandler(() => service.list()))
  ipcMain.handle('medications:get', (_event, id) => safeHandler(() => service.get(idSchema.parse(id))))
  ipcMain.handle('medications:create', (_event, input) => safeHandler(() => service.create(medicationInputSchema.parse(input))))
  ipcMain.handle('medications:update', (_event, id, input) => safeHandler(() => service.update(idSchema.parse(id), medicationInputSchema.parse(input))))
  ipcMain.handle('medications:delete', (_event, id) => safeHandler(() => service.delete(idSchema.parse(id))))
}
