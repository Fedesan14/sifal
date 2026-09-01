import { useMemo } from "react";
import type {
  Presentacion,
  PresentacionInput,
} from "../../../shared/types/entities";
import { presentacionInputSchema } from "../../../shared/validation/schemas";
import { CrudPage } from "../components/CrudPage";
import { useReferenceList } from "../hooks/useReferenceList";

export function PresentacionesPage() {
  const dosis = useReferenceList(window.api.dosis);
  const names = useMemo(
    () => new Map(dosis.items.map((item) => [item.id, item.name])),
    [dosis.items],
  );
  const empty: PresentacionInput = {
    name: "",
    dosisId: dosis.items[0]?.id ?? Number.NaN,
  };

  return (
    <CrudPage<Presentacion, PresentacionInput>
      title="Presentaciones"
      description="Formatos de medicamento asociados a una dosis."
      newLabel="Nueva presentación"
      emptyMessage="No hay presentaciones cargadas."
      api={window.api.presentaciones}
      schema={presentacionInputSchema}
      emptyInput={empty}
      createDisabled={dosis.loading || dosis.items.length === 0}
      createDisabledMessage={
        dosis.error ||
        (!dosis.loading && dosis.items.length === 0
          ? "Creá una dosis antes de agregar una presentación."
          : undefined)
      }
      formFields={[
        { key: "name", label: "Nombre" },
        {
          key: "dosisId",
          label: "Dosis",
          type: "select",
          numeric: true,
          options: dosis.items.map((item) => ({
            value: item.id,
            label: item.name,
          })),
        },
      ]}
      tableFields={[
        { key: "name", label: "Presentación", render: (item) => item.name },
        {
          key: "dosis",
          label: "Dosis",
          render: (item) => names.get(item.dosisId) ?? `#${item.dosisId}`,
        },
      ]}
      toInput={(item) => ({ name: item.name, dosisId: item.dosisId })}
      itemName={(item) => item.name}
    />
  );
}
