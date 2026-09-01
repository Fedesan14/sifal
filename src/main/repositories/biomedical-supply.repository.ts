import { desc, eq } from 'drizzle-orm'
import type { BiomedicalSupplyInput } from '../../shared/types/entities'
import { getDatabase } from '../database/database'
import { biomedicalSupplies } from '../database/schema'

export class BiomedicalSupplyRepository {
  list() { return getDatabase().select().from(biomedicalSupplies).orderBy(desc(biomedicalSupplies.id)).all() }
  get(id: number) { return getDatabase().select().from(biomedicalSupplies).where(eq(biomedicalSupplies.id, id)).get() }
  create(input: BiomedicalSupplyInput) {
    const now = new Date().toISOString()
    return getDatabase().insert(biomedicalSupplies).values({ ...input, createdAt: now, updatedAt: now }).returning().get()
  }
  update(id: number, input: BiomedicalSupplyInput) {
    return getDatabase().update(biomedicalSupplies).set({ ...input, updatedAt: new Date().toISOString() }).where(eq(biomedicalSupplies.id, id)).returning().get()
  }
  delete(id: number) { return getDatabase().delete(biomedicalSupplies).where(eq(biomedicalSupplies.id, id)).returning().get() }
}
