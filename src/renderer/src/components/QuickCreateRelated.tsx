import { z } from "zod";
import type {
  Dosis,
  Droga,
  NamedEntity,
  NamedEntityInput,
  Presentacion,
  Ubicacion,
  UbicacionInput,
} from "../../../shared/types/entities";
import {
  idSchema,
  namedEntityInputSchema,
  ubicacionInputSchema,
} from "../../../shared/validation/schemas";
import { EntityForm, type Field } from "./EntityForm";

export type QuickEntityKind =
  "grupo" | "marca" | "dosis" | "droga" | "presentacion" | "ubicacion";

export interface QuickCreateRequest {
  kind: QuickEntityKind;
  select?: (id: number) => void;
}

interface ReferenceState<T> {
  items: T[];
  add(item: T): void;
}

const quickPresentationSchema = z
  .object({
    name: z.string().trim().min(1, "Este campo es obligatorio"),
    dosisId: z.union([idSchema, z.nan()]),
    nuevaDosis: z.string(),
  })
  .refine(
    (value) => Number.isFinite(value.dosisId) || value.nuevaDosis.trim(),
    { path: ["dosisId"], message: "Seleccioná o creá una dosis" },
  );

type QuickPresentationInput = z.infer<typeof quickPresentationSchema>;

const quickDrugSchema = z
  .object({
    name: z.string().trim().min(1, "Este campo es obligatorio"),
    grupoId: z.union([idSchema, z.nan()]),
    nuevoGrupo: z.string(),
  })
  .refine(
    (value) => Number.isFinite(value.grupoId) || value.nuevoGrupo.trim(),
    { path: ["grupoId"], message: "Seleccioná o creá un grupo" },
  );

type QuickDrugInput = z.infer<typeof quickDrugSchema>;

const ubicacionFields: Field<UbicacionInput>[] = [
  { key: "nombre", label: "Nombre" },
];

async function requireCreated<T extends { id: number }>(
  operation: Promise<
    { ok: true; data: T } | { ok: false; error: { message: string } }
  >,
): Promise<T> {
  const result = await operation;
  if (!result.ok) throw new Error(result.error.message);
  return result.data;
}

export function QuickCreateRelated({
  request,
  onClose,
  grupos,
  drogas,
  marcas,
  dosis,
  presentaciones,
  ubicaciones,
}: {
  request: QuickCreateRequest;
  onClose: () => void;
  grupos: ReferenceState<NamedEntity>;
  drogas: ReferenceState<Droga>;
  marcas: ReferenceState<NamedEntity>;
  dosis: ReferenceState<Dosis>;
  presentaciones: ReferenceState<Presentacion>;
  ubicaciones: ReferenceState<Ubicacion>;
}) {
  const selectCreated = (id: number) => request.select?.(id);

  if (
    request.kind === "grupo" ||
    request.kind === "marca" ||
    request.kind === "dosis"
  ) {
    const config = {
      grupo: { title: "Nuevo grupo", api: window.api.grupos, state: grupos },
      marca: { title: "Nueva marca", api: window.api.marcas, state: marcas },
      dosis: { title: "Nueva dosis", api: window.api.dosis, state: dosis },
    }[request.kind];
    return (
      <EntityForm<NamedEntityInput>
        title={config.title}
        fields={[{ key: "name", label: "Nombre" }]}
        initial={{ name: "" }}
        schema={namedEntityInputSchema}
        onClose={onClose}
        onSave={async (input) => {
          const created = await requireCreated(config.api.create(input));
          config.state.add(created);
          selectCreated(created.id);
        }}
      />
    );
  }

  if (request.kind === "ubicacion") {
    return (
      <EntityForm<UbicacionInput>
        title="Nueva ubicación"
        fields={ubicacionFields}
        initial={{ nombre: "" }}
        schema={ubicacionInputSchema}
        onClose={onClose}
        onSave={async (input) => {
          const created = await requireCreated(
            window.api.ubicaciones.create(input),
          );
          ubicaciones.add(created);
          selectCreated(created.id);
        }}
      />
    );
  }

  if (request.kind === "droga") {
    const drugFields: Field<QuickDrugInput>[] = [
      { key: "name", label: "Droga" },
      {
        key: "grupoId",
        label: "Grupo existente",
        type: "select",
        numeric: true,
        options: grupos.items.map((item) => ({
          value: item.id,
          label: item.name,
        })),
      },
      { key: "nuevoGrupo", label: "O crear un grupo nuevo" },
    ];
    return (
      <EntityForm<QuickDrugInput>
        title="Nueva droga"
        fields={drugFields}
        initial={{
          name: "",
          grupoId: grupos.items[0]?.id ?? Number.NaN,
          nuevoGrupo: "",
        }}
        schema={quickDrugSchema}
        onClose={onClose}
        onSave={async (input) => {
          let grupoId = input.grupoId;
          if (input.nuevoGrupo.trim()) {
            const createdGroup = await requireCreated(
              window.api.grupos.create({ name: input.nuevoGrupo }),
            );
            grupos.add(createdGroup);
            grupoId = createdGroup.id;
          }
          const created = await requireCreated(
            window.api.drogas.create({ name: input.name, grupoId }),
          );
          drogas.add(created);
          selectCreated(created.id);
        }}
      />
    );
  }

  const presentationFields: Field<QuickPresentationInput>[] = [
    { key: "name", label: "Presentación" },
    {
      key: "dosisId",
      label: "Dosis existente",
      type: "select",
      numeric: true,
      options: dosis.items.map((item) => ({
        value: item.id,
        label: item.name,
      })),
    },
    {
      key: "nuevaDosis",
      label: "O crear una dosis nueva",
    },
  ];
  return (
    <EntityForm<QuickPresentationInput>
      title="Nueva presentación"
      fields={presentationFields}
      initial={{
        name: "",
        dosisId: dosis.items[0]?.id ?? Number.NaN,
        nuevaDosis: "",
      }}
      schema={quickPresentationSchema}
      onClose={onClose}
      onSave={async (input) => {
        let dosisId = input.dosisId;
        if (input.nuevaDosis.trim()) {
          const createdDosis = await requireCreated(
            window.api.dosis.create({ name: input.nuevaDosis }),
          );
          dosis.add(createdDosis);
          dosisId = createdDosis.id;
        }
        const created = await requireCreated(
          window.api.presentaciones.create({ name: input.name, dosisId }),
        );
        presentaciones.add(created);
        selectCreated(created.id);
      }}
    />
  );
}
