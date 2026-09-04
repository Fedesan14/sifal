import { desc, eq } from 'drizzle-orm'
import type { DosisInput, DrogaInput, MedicamentoInput, NamedEntityInput, PresentacionInput, UbicacionInput } from '../../shared/types/entities'
import { getDatabase, type StockDatabase } from '../database/connection'
import { biomedicalSuppliesStock, dosis, drogas, grupos, marcas, medicamentos, medicamentosStock, presentaciones, ubicaciones } from '../database/schema'

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
  isUsed(id: number) { return Boolean(this.db.select({ id: medicamentos.id }).from(medicamentos).where(eq(medicamentos.marcaId, id)).get()) }
}

export class DosisRepository {
  constructor(private readonly db: StockDatabase = getDatabase()) {}
  list() { return this.db.select().from(dosis).orderBy(desc(dosis.id)).all() }
  get(id: number) { return this.db.select().from(dosis).where(eq(dosis.id, id)).get() }
  create(input: DosisInput) { const timestamp = now(); return this.db.insert(dosis).values({ ...input, createdAt: timestamp, updatedAt: timestamp }).returning().get() }
  update(id: number, input: DosisInput) { return this.db.update(dosis).set({ ...input, updatedAt: now() }).where(eq(dosis.id, id)).returning().get() }
  delete(id: number) { return this.db.delete(dosis).where(eq(dosis.id, id)).returning().get() }
  isUsed(id: number) { return Boolean(this.db.select({ id: medicamentos.id }).from(medicamentos).where(eq(medicamentos.dosisId, id)).get()) }
}

export class PresentacionRepository {
  constructor(private readonly db: StockDatabase = getDatabase()) {}
  list() { return this.db.select().from(presentaciones).orderBy(desc(presentaciones.id)).all() }
  get(id: number) { return this.db.select().from(presentaciones).where(eq(presentaciones.id, id)).get() }
  create(input: PresentacionInput) { const timestamp = now(); return this.db.insert(presentaciones).values({ ...input, createdAt: timestamp, updatedAt: timestamp }).returning().get() }
  update(id: number, input: PresentacionInput) { return this.db.update(presentaciones).set({ ...input, updatedAt: now() }).where(eq(presentaciones.id, id)).returning().get() }
  delete(id: number) { return this.db.delete(presentaciones).where(eq(presentaciones.id, id)).returning().get() }
  isUsed(id: number) { return Boolean(this.db.select({ id: dosis.id }).from(dosis).where(eq(dosis.presentacionId, id)).get()) }
}

export class UbicacionRepository {
  constructor(private readonly db: StockDatabase = getDatabase()) {}
  list() { return this.db.select().from(ubicaciones).orderBy(desc(ubicaciones.id)).all() }
  get(id: number) { return this.db.select().from(ubicaciones).where(eq(ubicaciones.id, id)).get() }
  create(input: UbicacionInput) { const timestamp = now(); return this.db.insert(ubicaciones).values({ ...input, createdAt: timestamp, updatedAt: timestamp }).returning().get() }
  update(id: number, input: UbicacionInput) { return this.db.update(ubicaciones).set({ ...input, updatedAt: now() }).where(eq(ubicaciones.id, id)).returning().get() }
  delete(id: number) { return this.db.delete(ubicaciones).where(eq(ubicaciones.id, id)).returning().get() }
  isUsed(id: number) { return Boolean(this.db.select({ id: medicamentosStock.medicamentoId }).from(medicamentosStock).where(eq(medicamentosStock.ubicacionId, id)).get() || this.db.select({ id: biomedicalSuppliesStock.biomedicalSupplyId }).from(biomedicalSuppliesStock).where(eq(biomedicalSuppliesStock.ubicacionId, id)).get()) }
}

export class DrogaRepository {
  constructor(private readonly db: StockDatabase = getDatabase()) {}
  list() { return this.db.select().from(drogas).orderBy(desc(drogas.id)).all() }
  get(id: number) { return this.db.select().from(drogas).where(eq(drogas.id, id)).get() }
  create(input: DrogaInput) { const timestamp = now(); return this.db.insert(drogas).values({ ...input, createdAt: timestamp, updatedAt: timestamp }).returning().get() }
  update(id: number, input: DrogaInput) { return this.db.update(drogas).set({ ...input, updatedAt: now() }).where(eq(drogas.id, id)).returning().get() }
  delete(id: number) { return this.db.delete(drogas).where(eq(drogas.id, id)).returning().get() }
  isUsed(id: number) { return Boolean(this.db.select({ id: medicamentos.id }).from(medicamentos).where(eq(medicamentos.drogaId, id)).get()) }
}

export class MedicamentoRepository {
  constructor(private readonly db: StockDatabase = getDatabase()) {}
  private hydrate(row: typeof medicamentos.$inferSelect) {
    const stocks = this.db.select({ ubicacionId: medicamentosStock.ubicacionId, cantidad: medicamentosStock.cantidad }).from(medicamentosStock).where(eq(medicamentosStock.medicamentoId, row.id)).all()
    return { ...row, cantidad: stocks.reduce((total, stock) => total + stock.cantidad, 0), stocks }
  }
  list() { return this.db.select().from(medicamentos).orderBy(desc(medicamentos.id)).all().map((row) => this.hydrate(row)) }
  get(id: number) { const row = this.db.select().from(medicamentos).where(eq(medicamentos.id, id)).get(); return row ? this.hydrate(row) : undefined }
  create(input: MedicamentoInput) {
    return this.db.transaction((tx) => {
      const timestamp = now()
      const { stocks, ...medicamento } = input
      const row = tx.insert(medicamentos).values({ ...medicamento, createdAt: timestamp, updatedAt: timestamp }).returning().get()
      if (stocks.length > 0) tx.insert(medicamentosStock).values(stocks.map((stock) => ({ ...stock, medicamentoId: row.id }))).run()
      return { ...row, cantidad: stocks.reduce((total, stock) => total + stock.cantidad, 0), stocks }
    })
  }
  update(id: number, input: MedicamentoInput) {
    return this.db.transaction((tx) => {
      const { stocks, ...medicamento } = input
      const row = tx.update(medicamentos).set({ ...medicamento, updatedAt: now() }).where(eq(medicamentos.id, id)).returning().get()
      tx.delete(medicamentosStock).where(eq(medicamentosStock.medicamentoId, id)).run()
      if (stocks.length > 0) tx.insert(medicamentosStock).values(stocks.map((stock) => ({ ...stock, medicamentoId: id }))).run()
      return row ? { ...row, cantidad: stocks.reduce((total, stock) => total + stock.cantidad, 0), stocks } : undefined
    })
  }
  delete(id: number) { return this.db.delete(medicamentos).where(eq(medicamentos.id, id)).returning().get() }
}
