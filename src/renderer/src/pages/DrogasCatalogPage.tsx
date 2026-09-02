import { useMemo } from "react";
import type { Droga, DrogaInput } from "../../../shared/types/entities";
import { drogaInputSchema } from "../../../shared/validation/schemas";
import { CrudPage } from "../components/CrudPage";
import { useReferenceList } from "../hooks/useReferenceList";

export function DrogasCatalogPage() {
  const grupos = useReferenceList(window.api.grupos);
  const grupoNames = useMemo(
    () => new Map(grupos.items.map((item) => [item.id, item.name])),
    [grupos.items],
  );
  const empty: DrogaInput = {
    name: "",
    grupoId: grupos.items[0]?.id ?? Number.NaN,
  };

  return (
    <CrudPage<Droga, DrogaInput>
      title="Drogas"
      description="Principios activos y su grupo correspondiente."
      newLabel="Nueva droga"
      emptyMessage="No hay drogas cargadas."
      api={window.api.drogas}
      schema={drogaInputSchema}
      emptyInput={empty}
      createDisabled={grupos.loading || grupos.items.length === 0}
      createDisabledMessage={
        grupos.error ||
        (!grupos.loading && grupos.items.length === 0
          ? "Creá un grupo antes de agregar una droga."
          : undefined)
      }
      formFields={[
        { key: "name", label: "Nombre" },
        {
          key: "grupoId",
          label: "Grupo",
          type: "select",
          numeric: true,
          options: grupos.items.map((item) => ({
            value: item.id,
            label: item.name,
          })),
        },
      ]}
      tableFields={[
        { key: "name", label: "Droga", render: (item) => item.name },
        {
          key: "grupo",
          label: "Grupo",
          render: (item) => grupoNames.get(item.grupoId) ?? `#${item.grupoId}`,
        },
      ]}
      toInput={(item) => ({ name: item.name, grupoId: item.grupoId })}
      itemName={(item) => item.name}
    />
  );
}
