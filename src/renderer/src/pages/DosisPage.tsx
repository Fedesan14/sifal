import { useMemo } from "react";
import type { Dosis, DosisInput } from "../../../shared/types/entities";
import { dosisInputSchema } from "../../../shared/validation/schemas";
import { CrudPage } from "../components/CrudPage";
import { useReferenceList } from "../hooks/useReferenceList";

export function DosisPage() {
  const presentaciones = useReferenceList(window.api.presentaciones);
  const names = useMemo(() => new Map(presentaciones.items.map((item) => [item.id, item.name])), [presentaciones.items]);
  return <CrudPage<Dosis, DosisInput>
    title="Dosis" description="Dosis independientes para cada tipo de presentación."
    newLabel="Nueva dosis" emptyMessage="No hay dosis cargadas."
    api={window.api.dosis} schema={dosisInputSchema}
    emptyInput={{ name: "", presentacionId: presentaciones.items[0]?.id ?? Number.NaN }}
    createDisabled={presentaciones.loading || presentaciones.items.length === 0}
    createDisabledMessage={!presentaciones.loading && !presentaciones.items.length ? "Creá una presentación antes de agregar una dosis." : presentaciones.error}
    formFields={[{ key: "name", label: "Dosis" }, { key: "presentacionId", label: "Presentación", type: "select", numeric: true, options: presentaciones.items.map((item) => ({ value: item.id, label: item.name })) }]}
    tableFields={[{ key: "name", label: "Dosis", render: (item) => item.name }, { key: "presentacion", label: "Presentación", render: (item) => names.get(item.presentacionId) ?? `#${item.presentacionId}` }]}
    toInput={(item) => ({ name: item.name, presentacionId: item.presentacionId })} itemName={(item) => item.name}
  />;
}
