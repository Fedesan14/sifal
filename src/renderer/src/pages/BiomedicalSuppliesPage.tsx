import { useMemo } from "react";
import type { BiomedicalSupply, BiomedicalSupplyInput } from "../../../shared/types/entities";
import { biomedicalSupplyInputSchema } from "../../../shared/validation/schemas";
import { CrudPage } from "../components/CrudPage";
import { useReferenceList } from "../hooks/useReferenceList";

export function BiomedicalSuppliesPage() {
  const ubicaciones = useReferenceList(window.api.ubicaciones);
  const ubicacionNames = useMemo(
    () => new Map(ubicaciones.items.map((item) => [item.id, item.nombre])),
    [ubicaciones.items],
  );
  const empty: BiomedicalSupplyInput = { name: "", expirationDate: "", stocks: [] };

  return (
    <CrudPage<BiomedicalSupply, BiomedicalSupplyInput>
      title="Biomédicos"
      description="Administración del stock de insumos biomédicos por ubicación."
      newLabel="Nuevo biomédico"
      emptyMessage="No hay insumos biomédicos cargados."
      api={window.api.biomedicalSupplies}
      schema={biomedicalSupplyInputSchema}
      emptyInput={empty}
      createDisabledMessage={ubicaciones.error || undefined}
      formFields={[
        { key: "name", label: "Nombre" },
        { key: "expirationDate", label: "Fecha de vencimiento", type: "date" },
        {
          key: "stocks", label: "Stock por ubicación (opcional)", type: "location-stock",
          options: ubicaciones.items.map((item) => ({ value: item.id, label: item.nombre })),
        },
      ]}
      tableFields={[
        { key: "name", label: "Biomédico", render: (item) => item.name },
        { key: "quantity", label: "Cantidad", render: (item) => item.quantity },
        { key: "expirationDate", label: "Vencimiento", render: (item) => item.expirationDate },
        {
          key: "locations", label: "Stock por ubicación",
          render: (item) => item.stocks.map((stock) => `${ubicacionNames.get(stock.ubicacionId) ?? `#${stock.ubicacionId}`}: ${stock.cantidad}`).join(", ") || "Sin stock asignado",
        },
      ]}
      toInput={(item) => ({ name: item.name, expirationDate: item.expirationDate, stocks: item.stocks })}
      itemName={(item) => item.name}
    />
  );
}
