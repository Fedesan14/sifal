import type { BiomedicalSupplyInput } from '../../shared/types/entities'
import { BiomedicalSupplyRepository } from '../repositories/biomedical-supply.repository'

export class BiomedicalSupplyService {
  constructor(private readonly repository = new BiomedicalSupplyRepository()) {}
  list() { return this.repository.list() }
  get(id: number) { const item = this.repository.get(id); if (!item) throw new Error('NOT_FOUND'); return item }
  create(input: BiomedicalSupplyInput) { return this.repository.create(input) }
  update(id: number, input: BiomedicalSupplyInput) { if (!this.repository.get(id)) throw new Error('NOT_FOUND'); return this.repository.update(id, input) }
  delete(id: number) { if (!this.repository.delete(id)) throw new Error('NOT_FOUND') }
}
