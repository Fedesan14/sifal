import type { DrogaInput, MedicamentoInput, NamedEntity, NamedEntityInput, PresentacionInput, UbicacionInput } from '../../shared/types/entities'
import { DosisRepository, DrogaRepository, GrupoRepository, MarcaRepository, MedicamentoRepository, PresentacionRepository, UbicacionRepository } from '../repositories/stock.repository'

interface NamedRepository {
  list(): NamedEntity[]
  get(id: number): NamedEntity | undefined
  create(input: NamedEntityInput): NamedEntity
  update(id: number, input: NamedEntityInput): NamedEntity | undefined
  delete(id: number): NamedEntity | undefined
  isUsed(id: number): boolean
}

class NamedService {
  constructor(private readonly repository: NamedRepository) {}
  list() { return this.repository.list() }
  get(id: number) { const item = this.repository.get(id); if (!item) throw new Error('NOT_FOUND'); return item }
  create(input: NamedEntityInput) { return this.repository.create(input) }
  update(id: number, input: NamedEntityInput) { if (!this.repository.get(id)) throw new Error('NOT_FOUND'); return this.repository.update(id, input) as NamedEntity }
  delete(id: number) { if (!this.repository.get(id)) throw new Error('NOT_FOUND'); if (this.repository.isUsed(id)) throw new Error('IN_USE'); this.repository.delete(id) }
}

export class GrupoService extends NamedService { constructor(repository = new GrupoRepository()) { super(repository) } }
export class MarcaService extends NamedService { constructor(repository = new MarcaRepository()) { super(repository) } }
export class DosisService extends NamedService { constructor(repository = new DosisRepository()) { super(repository) } }

export class PresentacionService {
  constructor(private readonly repository = new PresentacionRepository(), private readonly dosisRepository = new DosisRepository()) {}
  list() { return this.repository.list() }
  get(id: number) { const item = this.repository.get(id); if (!item) throw new Error('NOT_FOUND'); return item }
  private assertReferences(input: PresentacionInput) { if (!this.dosisRepository.get(input.dosisId)) throw new Error('REFERENCE_NOT_FOUND') }
  create(input: PresentacionInput) { this.assertReferences(input); return this.repository.create(input) }
  update(id: number, input: PresentacionInput) { if (!this.repository.get(id)) throw new Error('NOT_FOUND'); this.assertReferences(input); return this.repository.update(id, input) }
  delete(id: number) { if (!this.repository.get(id)) throw new Error('NOT_FOUND'); if (this.repository.isUsed(id)) throw new Error('IN_USE'); this.repository.delete(id) }
}

export class UbicacionService {
  constructor(private readonly repository = new UbicacionRepository()) {}
  list() { return this.repository.list() }
  get(id: number) { const item = this.repository.get(id); if (!item) throw new Error('NOT_FOUND'); return item }
  create(input: UbicacionInput) { return this.repository.create(input) }
  update(id: number, input: UbicacionInput) { if (!this.repository.get(id)) throw new Error('NOT_FOUND'); return this.repository.update(id, input) }
  delete(id: number) { if (!this.repository.get(id)) throw new Error('NOT_FOUND'); if (this.repository.isUsed(id)) throw new Error('IN_USE'); this.repository.delete(id) }
}

export class DrogaService {
  constructor(
    private readonly repository = new DrogaRepository(),
    private readonly grupoRepository = new GrupoRepository()
  ) {}
  list() { return this.repository.list() }
  get(id: number) { const item = this.repository.get(id); if (!item) throw new Error('NOT_FOUND'); return item }
  private assertReferences(input: DrogaInput) { if (!this.grupoRepository.get(input.grupoId)) throw new Error('REFERENCE_NOT_FOUND') }
  create(input: DrogaInput) { this.assertReferences(input); return this.repository.create(input) }
  update(id: number, input: DrogaInput) { if (!this.repository.get(id)) throw new Error('NOT_FOUND'); this.assertReferences(input); return this.repository.update(id, input) }
  delete(id: number) { if (!this.repository.get(id)) throw new Error('NOT_FOUND'); if (this.repository.isUsed(id)) throw new Error('IN_USE'); this.repository.delete(id) }
}

export class MedicamentoService {
  constructor(
    private readonly repository = new MedicamentoRepository(),
    private readonly drogaRepository = new DrogaRepository(),
    private readonly marcaRepository = new MarcaRepository(),
    private readonly presentacionRepository = new PresentacionRepository(),
    private readonly ubicacionRepository = new UbicacionRepository()
  ) {}
  list() { return this.repository.list() }
  get(id: number) { const item = this.repository.get(id); if (!item) throw new Error('NOT_FOUND'); return item }
  private assertReferences(input: MedicamentoInput) {
    if (!this.drogaRepository.get(input.drogaId) || !this.marcaRepository.get(input.marcaId) || !this.presentacionRepository.get(input.presentacionId) || !this.ubicacionRepository.get(input.ubicacionId)) throw new Error('REFERENCE_NOT_FOUND')
  }
  create(input: MedicamentoInput) { this.assertReferences(input); return this.repository.create(input) }
  update(id: number, input: MedicamentoInput) { if (!this.repository.get(id)) throw new Error('NOT_FOUND'); this.assertReferences(input); return this.repository.update(id, input) }
  delete(id: number) { if (!this.repository.delete(id)) throw new Error('NOT_FOUND') }
}
