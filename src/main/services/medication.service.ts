import type { MedicationInput } from '../../shared/types/entities'
import { MedicationRepository } from '../repositories/medication.repository'

export class MedicationService {
  constructor(private readonly repository = new MedicationRepository()) {}
  list() { return this.repository.list() }
  get(id: number) { const item = this.repository.get(id); if (!item) throw new Error('NOT_FOUND'); return item }
  create(input: MedicationInput) { return this.repository.create(input) }
  update(id: number, input: MedicationInput) { if (!this.repository.get(id)) throw new Error('NOT_FOUND'); return this.repository.update(id, input) }
  delete(id: number) { if (!this.repository.delete(id)) throw new Error('NOT_FOUND') }
}
