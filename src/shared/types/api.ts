import type { ApiResult, BiomedicalSupply, BiomedicalSupplyInput, Dosis, Droga, DrogaInput, Grupo, Marca, Medication, MedicationInput, NamedEntityInput, Presentacion, PresentacionInput, Ubicacion, UbicacionInput } from './entities'

export interface CrudApi<T, TInput> {
  list(): Promise<ApiResult<T[]>>
  get(id: number): Promise<ApiResult<T>>
  create(input: TInput): Promise<ApiResult<T>>
  update(id: number, input: TInput): Promise<ApiResult<T>>
  delete(id: number): Promise<ApiResult<void>>
}

export interface DesktopApi {
  medications: CrudApi<Medication, MedicationInput>
  biomedicalSupplies: CrudApi<BiomedicalSupply, BiomedicalSupplyInput>
  grupos: CrudApi<Grupo, NamedEntityInput>
  marcas: CrudApi<Marca, NamedEntityInput>
  dosis: CrudApi<Dosis, NamedEntityInput>
  presentaciones: CrudApi<Presentacion, PresentacionInput>
  ubicaciones: CrudApi<Ubicacion, UbicacionInput>
  drogas: CrudApi<Droga, DrogaInput>
}
