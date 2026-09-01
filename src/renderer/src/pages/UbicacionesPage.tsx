import type { Ubicacion, UbicacionInput } from "../../../shared/types/entities";
import { ubicacionInputSchema } from "../../../shared/validation/schemas";
import { CrudPage } from "../components/CrudPage";
import type { Field } from "../components/EntityForm";

const fields: Field<UbicacionInput>[] = [
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

export function UbicacionesPage() {
  return (
    <CrudPage<Ubicacion, UbicacionInput>
      title="Ubicaciones"
      description="Taquillas y pañoles donde se almacena el stock."
      newLabel="Nueva ubicación"
      emptyMessage="No hay ubicaciones cargadas."
      api={window.api.ubicaciones}
      schema={ubicacionInputSchema}
      emptyInput={{ tipo: "TAQUILLA", nombre: "", numero: Number.NaN }}
      formFields={fields}
      tableFields={[
        {
          key: "tipo",
          label: "Tipo",
          render: (item) => (item.tipo === "TAQUILLA" ? "Taquilla" : "Pañol"),
        },
        { key: "nombre", label: "Nombre", render: (item) => item.nombre },
        {
          key: "numero",
          label: "Número",
          render: (item) => (item.tipo === "TAQUILLA" ? item.numero : "—"),
        },
      ]}
      toInput={(item) =>
        item.tipo === "TAQUILLA"
          ? { tipo: "TAQUILLA", nombre: item.nombre, numero: item.numero }
          : { tipo: "PANOL", nombre: item.nombre }
      }
      itemName={(item) =>
        item.tipo === "TAQUILLA"
          ? `la taquilla ${item.nombre} N.º ${item.numero}`
          : `el pañol ${item.nombre}`
      }
    />
  );
}
