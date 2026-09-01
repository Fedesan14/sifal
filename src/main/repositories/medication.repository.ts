import { desc, eq } from 'drizzle-orm'
import type { MedicationInput } from '../../shared/types/entities'
import { getDatabase } from '../database/database'
import { medications } from '../database/schema'

export class MedicationRepository {
  list() { return getDatabase().select().from(medications).orderBy(desc(medications.id)).all() }
  get(id: number) { return getDatabase().select().from(medications).where(eq(medications.id, id)).get() }
  create(input: MedicationInput) {
    const now = new Date().toISOString()
    return getDatabase().insert(medications).values({ ...input, createdAt: now, updatedAt: now }).returning().get()
  }
  update(id: number, input: MedicationInput) {
    return getDatabase().update(medications).set({ ...input, updatedAt: new Date().toISOString() }).where(eq(medications.id, id)).returning().get()
  }
  delete(id: number) { return getDatabase().delete(medications).where(eq(medications.id, id)).returning().get() }
}
