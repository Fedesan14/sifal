import type { BiomedicalSupplyInput } from '../../shared/types/entities'
import { BiomedicalSupplyRepository } from '../repositories/biomedical-supply.repository'
import { UbicacionRepository } from '../repositories/stock.repository'

export class BiomedicalSupplyService {
  constructor(private readonly repository = new BiomedicalSupplyRepository(), private readonly ubicacionRepository = new UbicacionRepository()) {}
  list() { return this.repository.list() }
  get(id: number) { const item = this.repository.get(id); if (!item) throw new Error('NOT_FOUND'); return item }
  private assertReferences(input: BiomedicalSupplyInput) { if (input.stocks.some((stock) => !this.ubicacionRepository.get(stock.ubicacionId))) throw new Error('REFERENCE_NOT_FOUND') }
  create(input: BiomedicalSupplyInput) { this.assertReferences(input); return this.repository.create(input) }
  update(id: number, input: BiomedicalSupplyInput) { if (!this.repository.get(id)) throw new Error('NOT_FOUND'); this.assertReferences(input); return this.repository.update(id, input) }
  delete(id: number) { if (!this.repository.delete(id)) throw new Error('NOT_FOUND') }
}
