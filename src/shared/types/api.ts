import type { ApiResult, BiomedicalSupply, BiomedicalSupplyInput, Medication, MedicationInput } from './entities'

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
}
