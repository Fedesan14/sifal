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
export type Dosis = NamedEntity
export type NamedEntityInput = Pick<NamedEntity, 'name'>

export interface Presentacion extends NamedEntity {
  dosisId: number
}
export type PresentacionInput = Pick<Presentacion, 'name' | 'dosisId'>

interface UbicacionBase extends EntityTimestamps {
  id: number
  nombre: string
}
export interface Taquilla extends UbicacionBase {
  tipo: 'TAQUILLA'
  numero: number
}
export interface Panol extends UbicacionBase {
  tipo: 'PANOL'
}
export type Ubicacion = Taquilla | Panol
export type UbicacionInput =
  | { tipo: 'TAQUILLA'; nombre: string; numero: number }
  | { tipo: 'PANOL'; nombre: string }

export interface Droga extends NamedEntity {
  grupoId: number
}
export type DrogaInput = Pick<Droga, 'name' | 'grupoId'>

export interface Medicamento extends EntityTimestamps {
  id: number
  name: string
  drogaId: number
  cantidad: number
  fechaVencimiento: string
  marcaId: number
  presentacionId: number
  ubicacionId: number
}
export type MedicamentoInput = Pick<Medicamento, 'name' | 'drogaId' | 'cantidad' | 'fechaVencimiento' | 'marcaId' | 'presentacionId' | 'ubicacionId'>

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
