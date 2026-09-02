import type { Ubicacion, UbicacionInput } from "../../../shared/types/entities";
import { ubicacionInputSchema } from "../../../shared/validation/schemas";
import { CrudPage } from "../components/CrudPage";

export function UbicacionesPage() {
  return (
    <CrudPage<Ubicacion, UbicacionInput>
      title="Ubicaciones"
      description="Lugares donde se almacena el stock."
      newLabel="Nueva ubicación"
      emptyMessage="No hay ubicaciones cargadas."
      api={window.api.ubicaciones}
      schema={ubicacionInputSchema}
      emptyInput={{ nombre: "" }}
      formFields={[{ key: "nombre", label: "Nombre" }]}
      tableFields={[
        { key: "nombre", label: "Nombre", render: (item) => item.nombre },
      ]}
      toInput={(item) => ({ nombre: item.nombre })}
      itemName={(item) => `la ubicación ${item.nombre}`}
    />
  );
}
