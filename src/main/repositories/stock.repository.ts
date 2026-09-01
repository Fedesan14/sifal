import { desc, eq } from 'drizzle-orm'
import type { DrogaInput, NamedEntityInput, PresentacionInput, Ubicacion, UbicacionInput } from '../../shared/types/entities'
import { getDatabase, type StockDatabase } from '../database/connection'
import { dosis, drogas, grupos, marcas, presentaciones, ubicaciones } from '../database/schema'

const now = () => new Date().toISOString()

export class GrupoRepository {
  constructor(private readonly db: StockDatabase = getDatabase()) {}
  list() { return this.db.select().from(grupos).orderBy(desc(grupos.id)).all() }
  get(id: number) { return this.db.select().from(grupos).where(eq(grupos.id, id)).get() }
  create(input: NamedEntityInput) { const timestamp = now(); return this.db.insert(grupos).values({ ...input, createdAt: timestamp, updatedAt: timestamp }).returning().get() }
  update(id: number, input: NamedEntityInput) { return this.db.update(grupos).set({ ...input, updatedAt: now() }).where(eq(grupos.id, id)).returning().get() }
  delete(id: number) { return this.db.delete(grupos).where(eq(grupos.id, id)).returning().get() }
  isUsed(id: number) { return Boolean(this.db.select({ id: drogas.id }).from(drogas).where(eq(drogas.grupoId, id)).get()) }
}

export class MarcaRepository {
  constructor(private readonly db: StockDatabase = getDatabase()) {}
  list() { return this.db.select().from(marcas).orderBy(desc(marcas.id)).all() }
  get(id: number) { return this.db.select().from(marcas).where(eq(marcas.id, id)).get() }
  create(input: NamedEntityInput) { const timestamp = now(); return this.db.insert(marcas).values({ ...input, createdAt: timestamp, updatedAt: timestamp }).returning().get() }
  update(id: number, input: NamedEntityInput) { return this.db.update(marcas).set({ ...input, updatedAt: now() }).where(eq(marcas.id, id)).returning().get() }
  delete(id: number) { return this.db.delete(marcas).where(eq(marcas.id, id)).returning().get() }
  isUsed(id: number) { return Boolean(this.db.select({ id: drogas.id }).from(drogas).where(eq(drogas.marcaId, id)).get()) }
}

export class DosisRepository {
  constructor(private readonly db: StockDatabase = getDatabase()) {}
  list() { return this.db.select().from(dosis).orderBy(desc(dosis.id)).all() }
  get(id: number) { return this.db.select().from(dosis).where(eq(dosis.id, id)).get() }
  create(input: NamedEntityInput) { const timestamp = now(); return this.db.insert(dosis).values({ ...input, createdAt: timestamp, updatedAt: timestamp }).returning().get() }
  update(id: number, input: NamedEntityInput) { return this.db.update(dosis).set({ ...input, updatedAt: now() }).where(eq(dosis.id, id)).returning().get() }
  delete(id: number) { return this.db.delete(dosis).where(eq(dosis.id, id)).returning().get() }
  isUsed(id: number) { return Boolean(this.db.select({ id: presentaciones.id }).from(presentaciones).where(eq(presentaciones.dosisId, id)).get()) }
}

export class PresentacionRepository {
  constructor(private readonly db: StockDatabase = getDatabase()) {}
  list() { return this.db.select().from(presentaciones).orderBy(desc(presentaciones.id)).all() }
  get(id: number) { return this.db.select().from(presentaciones).where(eq(presentaciones.id, id)).get() }
  create(input: PresentacionInput) { const timestamp = now(); return this.db.insert(presentaciones).values({ ...input, createdAt: timestamp, updatedAt: timestamp }).returning().get() }
  update(id: number, input: PresentacionInput) { return this.db.update(presentaciones).set({ ...input, updatedAt: now() }).where(eq(presentaciones.id, id)).returning().get() }
  delete(id: number) { return this.db.delete(presentaciones).where(eq(presentaciones.id, id)).returning().get() }
  isUsed(id: number) { return Boolean(this.db.select({ id: drogas.id }).from(drogas).where(eq(drogas.presentacionId, id)).get()) }
}

function asUbicacion(row: typeof ubicaciones.$inferSelect): Ubicacion {
  const base = { id: row.id, nombre: row.nombre, createdAt: row.createdAt, updatedAt: row.updatedAt }
  if (row.tipo === 'TAQUILLA') return { ...base, tipo: 'TAQUILLA', numero: row.numero as number }
  return { ...base, tipo: 'PANOL' }
}

export class UbicacionRepository {
  constructor(private readonly db: StockDatabase = getDatabase()) {}
  list() { return this.db.select().from(ubicaciones).orderBy(desc(ubicaciones.id)).all().map(asUbicacion) }
  get(id: number) { const row = this.db.select().from(ubicaciones).where(eq(ubicaciones.id, id)).get(); return row ? asUbicacion(row) : undefined }
  create(input: UbicacionInput) { const timestamp = now(); const row = this.db.insert(ubicaciones).values({ ...input, numero: input.tipo === 'TAQUILLA' ? input.numero : null, createdAt: timestamp, updatedAt: timestamp }).returning().get(); return asUbicacion(row) }
  update(id: number, input: UbicacionInput) { const row = this.db.update(ubicaciones).set({ ...input, numero: input.tipo === 'TAQUILLA' ? input.numero : null, updatedAt: now() }).where(eq(ubicaciones.id, id)).returning().get(); return row ? asUbicacion(row) : undefined }
  delete(id: number) { const row = this.db.delete(ubicaciones).where(eq(ubicaciones.id, id)).returning().get(); return row ? asUbicacion(row) : undefined }
  isUsed(id: number) { return Boolean(this.db.select({ id: drogas.id }).from(drogas).where(eq(drogas.ubicacionId, id)).get()) }
}

export class DrogaRepository {
  constructor(private readonly db: StockDatabase = getDatabase()) {}
  list() { return this.db.select().from(drogas).orderBy(desc(drogas.id)).all() }
  get(id: number) { return this.db.select().from(drogas).where(eq(drogas.id, id)).get() }
  create(input: DrogaInput) { const timestamp = now(); return this.db.insert(drogas).values({ ...input, createdAt: timestamp, updatedAt: timestamp }).returning().get() }
  update(id: number, input: DrogaInput) { return this.db.update(drogas).set({ ...input, updatedAt: now() }).where(eq(drogas.id, id)).returning().get() }
  delete(id: number) { return this.db.delete(drogas).where(eq(drogas.id, id)).returning().get() }
}
