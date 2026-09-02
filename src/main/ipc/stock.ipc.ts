import { ipcMain } from 'electron'
import type { z } from 'zod'
import type { DosisInput, DrogaInput, MedicamentoInput, NamedEntityInput, PresentacionInput, UbicacionInput } from '../../shared/types/entities'
import { dosisInputSchema, drogaInputSchema, idSchema, medicamentoInputSchema, namedEntityInputSchema, presentacionInputSchema, ubicacionInputSchema } from '../../shared/validation/schemas'
import { DosisService, DrogaService, GrupoService, MarcaService, MedicamentoService, PresentacionService, UbicacionService } from '../services/stock.service'
import { safeHandler } from './handler'

interface CrudService<TInput> {
  list(): unknown
  get(id: number): unknown
  create(input: TInput): unknown
  update(id: number, input: TInput): unknown
  delete(id: number): unknown
}

function registerCrud<TInput>(resource: string, schema: z.ZodType<TInput>, service: CrudService<TInput>): void {
  ipcMain.handle(`${resource}:list`, () => safeHandler(() => service.list()))
  ipcMain.handle(`${resource}:get`, (_event, id) => safeHandler(() => service.get(idSchema.parse(id))))
  ipcMain.handle(`${resource}:create`, (_event, input) => safeHandler(() => service.create(schema.parse(input))))
  ipcMain.handle(`${resource}:update`, (_event, id, input) => safeHandler(() => service.update(idSchema.parse(id), schema.parse(input))))
  ipcMain.handle(`${resource}:delete`, (_event, id) => safeHandler(() => service.delete(idSchema.parse(id))))
}

export function registerStockIpc(): void {
  registerCrud<NamedEntityInput>('grupos', namedEntityInputSchema, new GrupoService())
  registerCrud<NamedEntityInput>('marcas', namedEntityInputSchema, new MarcaService())
  registerCrud<DosisInput>('dosis', dosisInputSchema, new DosisService())
  registerCrud<PresentacionInput>('presentaciones', presentacionInputSchema, new PresentacionService())
  registerCrud<UbicacionInput>('ubicaciones', ubicacionInputSchema, new UbicacionService())
  registerCrud<DrogaInput>('drogas', drogaInputSchema, new DrogaService())
  registerCrud<MedicamentoInput>('medicamentos', medicamentoInputSchema, new MedicamentoService())
}
