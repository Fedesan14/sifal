import { z } from "zod";
import type {
  Dosis,
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
  "grupo" | "marca" | "dosis" | "presentacion" | "ubicacion";

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

const ubicacionFields: Field<UbicacionInput>[] = [
  {
    key: "tipo",
    label: "Tipo",
    type: "select",
    options: [
      { value: "TAQUILLA", label: "Taquilla" },
      { value: "PANOL", label: "Pañol" },
    ],
    onChange: (value, tipo) =>
      tipo === "PANOL"
        ? { tipo: "PANOL", nombre: value.nombre }
        : {
            tipo: "TAQUILLA",
            nombre: value.nombre,
            numero: value.tipo === "TAQUILLA" ? value.numero : Number.NaN,
          },
  },
  { key: "nombre", label: "Nombre" },
  {
    key: "numero",
    label: "Número",
    type: "number",
    visible: (value) => value.tipo === "TAQUILLA",
  },
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
  marcas,
  dosis,
  presentaciones,
  ubicaciones,
}: {
  request: QuickCreateRequest;
  onClose: () => void;
  grupos: ReferenceState<NamedEntity>;
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
        initial={{ tipo: "TAQUILLA", nombre: "", numero: Number.NaN }}
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
