import type { Presentacion, PresentacionInput } from "../../../shared/types/entities";
import { presentacionInputSchema } from "../../../shared/validation/schemas";
import { CrudPage } from "../components/CrudPage";

export function PresentacionesPage() {
  return <CrudPage<Presentacion, PresentacionInput>
    title="Presentaciones" description="Tipos de presentación disponibles para los medicamentos."
    newLabel="Nueva presentación" emptyMessage="No hay presentaciones cargadas."
    api={window.api.presentaciones} schema={presentacionInputSchema} emptyInput={{ name: "" }}
    formFields={[{ key: "name", label: "Nombre" }]}
    tableFields={[{ key: "name", label: "Presentación", render: (item) => item.name }]}
    toInput={(item) => ({ name: item.name })} itemName={(item) => item.name}
  />;
}
