export interface Medication {
  id: number
  group: string
  drug: string
  dose: string
  presentation: string
  commercialBrand: string
  quantity: number
  expirationDate: string
  acquisition: string
  location: string
  createdAt: string
  updatedAt: string
}

export type MedicationInput = Omit<Medication, 'id' | 'createdAt' | 'updatedAt'>

export interface BiomedicalSupply {
  id: number
  name: string
  quantity: number
  expirationDate: string
  location: string
  createdAt: string
  updatedAt: string
}

export type BiomedicalSupplyInput = Omit<BiomedicalSupply, 'id' | 'createdAt' | 'updatedAt'>

export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: { code: string; message: string } }
