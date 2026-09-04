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
  stocks: BiomedicalSupplyStock[]
  createdAt: string
  updatedAt: string
}

export interface BiomedicalSupplyStock {
  ubicacionId: number
  cantidad: number
}

export type BiomedicalSupplyInput = Pick<BiomedicalSupply, 'name' | 'expirationDate' | 'stocks'>

interface EntityTimestamps {
  createdAt: string
  updatedAt: string
}

export interface NamedEntity extends EntityTimestamps {
  id: number
  name: string
}

export type Grupo = NamedEntity
export type Marca = NamedEntity
export interface Dosis extends NamedEntity {
  presentacionId: number
}
export type DosisInput = Pick<Dosis, 'name' | 'presentacionId'>
export type NamedEntityInput = Pick<NamedEntity, 'name'>

export type Presentacion = NamedEntity
export type PresentacionInput = Pick<Presentacion, 'name'>

export interface Ubicacion extends EntityTimestamps {
  id: number
  nombre: string
}
export type UbicacionInput = Pick<Ubicacion, 'nombre'>

export interface Droga extends NamedEntity {
  grupoId: number
}
export type DrogaInput = Pick<Droga, 'name' | 'grupoId'>

export interface Medicamento extends EntityTimestamps {
  id: number
  drogaId: number
  cantidad: number
  fechaVencimiento: string
  marcaId: number
  presentacionId: number
  dosisId: number
  stocks: MedicamentoStock[]
}
export interface MedicamentoStock {
  ubicacionId: number
  cantidad: number
}
export type MedicamentoInput = Pick<Medicamento, 'drogaId' | 'fechaVencimiento' | 'marcaId' | 'presentacionId' | 'dosisId' | 'stocks'>

export type ApiResult<T> =
  | { ok: true; data: T }
  | {
      ok: false
      error: {
        code: string
        message: string
        details?: Record<string, string>
      }
    }
