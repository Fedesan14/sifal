import { desc, eq } from 'drizzle-orm'
import type { BiomedicalSupplyInput } from '../../shared/types/entities'
import { getDatabase, type StockDatabase } from '../database/database'
import { biomedicalSupplies, biomedicalSuppliesStock } from '../database/schema'

export class BiomedicalSupplyRepository {
  constructor(private readonly db: StockDatabase = getDatabase()) {}
  private hydrate(row: typeof biomedicalSupplies.$inferSelect) {
    const stocks = this.db.select({ ubicacionId: biomedicalSuppliesStock.ubicacionId, cantidad: biomedicalSuppliesStock.cantidad }).from(biomedicalSuppliesStock).where(eq(biomedicalSuppliesStock.biomedicalSupplyId, row.id)).all()
    return { ...row, quantity: stocks.reduce((total, stock) => total + stock.cantidad, 0), stocks }
  }
  list() { return this.db.select().from(biomedicalSupplies).orderBy(desc(biomedicalSupplies.id)).all().map((row) => this.hydrate(row)) }
  get(id: number) { const row = this.db.select().from(biomedicalSupplies).where(eq(biomedicalSupplies.id, id)).get(); return row ? this.hydrate(row) : undefined }
  create(input: BiomedicalSupplyInput) {
    return this.db.transaction((tx) => {
      const timestamp = new Date().toISOString()
      const { stocks, ...supply } = input
      const row = tx.insert(biomedicalSupplies).values({ ...supply, createdAt: timestamp, updatedAt: timestamp }).returning().get()
      if (stocks.length > 0) tx.insert(biomedicalSuppliesStock).values(stocks.map((stock) => ({ ...stock, biomedicalSupplyId: row.id }))).run()
      return { ...row, quantity: stocks.reduce((total, stock) => total + stock.cantidad, 0), stocks }
    })
  }
  update(id: number, input: BiomedicalSupplyInput) {
    return this.db.transaction((tx) => {
      const { stocks, ...supply } = input
      const row = tx.update(biomedicalSupplies).set({ ...supply, updatedAt: new Date().toISOString() }).where(eq(biomedicalSupplies.id, id)).returning().get()
      tx.delete(biomedicalSuppliesStock).where(eq(biomedicalSuppliesStock.biomedicalSupplyId, id)).run()
      if (stocks.length > 0) tx.insert(biomedicalSuppliesStock).values(stocks.map((stock) => ({ ...stock, biomedicalSupplyId: id }))).run()
      return row ? { ...row, quantity: stocks.reduce((total, stock) => total + stock.cantidad, 0), stocks } : undefined
    })
  }
  delete(id: number) { return this.db.delete(biomedicalSupplies).where(eq(biomedicalSupplies.id, id)).returning().get() }
}
