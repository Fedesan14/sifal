import { z } from "zod";
import type { Dosis, DosisInput, Droga, NamedEntity, NamedEntityInput, Presentacion, Ubicacion, UbicacionInput } from "../../../shared/types/entities";
import { dosisInputSchema, idSchema, namedEntityInputSchema, ubicacionInputSchema } from "../../../shared/validation/schemas";
import { EntityForm, type Field } from "./EntityForm";

export type QuickEntityKind = "grupo" | "marca" | "dosis" | "droga" | "presentacion" | "ubicacion";
export interface QuickCreateRequest { kind: QuickEntityKind; select?: (id: number) => void; presentacionId?: number }
interface ReferenceState<T> { items: T[]; add(item: T): void }

const quickDrugSchema = z.object({ name: z.string().trim().min(1, "Este campo es obligatorio"), grupoId: z.union([idSchema, z.nan()]), nuevoGrupo: z.string() })
  .refine((value) => Number.isFinite(value.grupoId) || value.nuevoGrupo.trim(), { path: ["grupoId"], message: "Seleccioná o creá un grupo" });
type QuickDrugInput = z.infer<typeof quickDrugSchema>;

async function requireCreated<T extends { id: number }>(operation: Promise<{ ok: true; data: T } | { ok: false; error: { message: string } }>): Promise<T> {
  const result = await operation;
  if (!result.ok) throw new Error(result.error.message);
  return result.data;
}

export function QuickCreateRelated({ request, onClose, grupos, drogas, marcas, dosis, presentaciones, ubicaciones }: {
  request: QuickCreateRequest; onClose: () => void; grupos: ReferenceState<NamedEntity>; drogas: ReferenceState<Droga>;
  marcas: ReferenceState<NamedEntity>; dosis: ReferenceState<Dosis>; presentaciones: ReferenceState<Presentacion>; ubicaciones: ReferenceState<Ubicacion>;
}) {
  const selected = (id: number) => request.select?.(id);
  if (request.kind === "grupo" || request.kind === "marca") {
    const config = request.kind === "grupo" ? { title: "Nuevo grupo", api: window.api.grupos, state: grupos } : { title: "Nueva marca", api: window.api.marcas, state: marcas };
    return <EntityForm<NamedEntityInput> title={config.title} fields={[{ key: "name", label: "Nombre" }]} initial={{ name: "" }} schema={namedEntityInputSchema} onClose={onClose}
      onSave={async (input) => { const item = await requireCreated(config.api.create(input)); config.state.add(item); selected(item.id); }} />;
  }
  if (request.kind === "presentacion") {
    return <EntityForm<NamedEntityInput> title="Nueva presentación" fields={[{ key: "name", label: "Presentación" }]} initial={{ name: "" }} schema={namedEntityInputSchema} onClose={onClose}
      onSave={async (input) => { const item = await requireCreated(window.api.presentaciones.create(input)); presentaciones.add(item); selected(item.id); }} />;
  }
  if (request.kind === "dosis") {
    return <EntityForm<DosisInput> title="Nueva dosis" fields={[{ key: "name", label: "Dosis" }]} initial={{ name: "", presentacionId: request.presentacionId ?? Number.NaN }} schema={dosisInputSchema} onClose={onClose}
      onSave={async (input) => { const item = await requireCreated(window.api.dosis.create(input)); dosis.add(item); selected(item.id); }} />;
  }
  if (request.kind === "ubicacion") {
    const fields: Field<UbicacionInput>[] = [{ key: "nombre", label: "Nombre" }];
    return <EntityForm<UbicacionInput> title="Nueva ubicación" fields={fields} initial={{ nombre: "" }} schema={ubicacionInputSchema} onClose={onClose}
      onSave={async (input) => { const item = await requireCreated(window.api.ubicaciones.create(input)); ubicaciones.add(item); selected(item.id); }} />;
  }
  const fields: Field<QuickDrugInput>[] = [{ key: "name", label: "Droga" }, { key: "grupoId", label: "Grupo existente", type: "select", numeric: true, options: grupos.items.map((item) => ({ value: item.id, label: item.name })) }, { key: "nuevoGrupo", label: "O crear un grupo nuevo" }];
  return <EntityForm<QuickDrugInput> title="Nueva droga" fields={fields} initial={{ name: "", grupoId: grupos.items[0]?.id ?? Number.NaN, nuevoGrupo: "" }} schema={quickDrugSchema} onClose={onClose}
    onSave={async (input) => { let grupoId = input.grupoId; if (input.nuevoGrupo.trim()) { const group = await requireCreated(window.api.grupos.create({ name: input.nuevoGrupo })); grupos.add(group); grupoId = group.id; } const item = await requireCreated(window.api.drogas.create({ name: input.name, grupoId })); drogas.add(item); selected(item.id); }} />;
}
