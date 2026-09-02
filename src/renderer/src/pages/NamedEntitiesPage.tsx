import type {
  NamedEntity,
  NamedEntityInput,
} from "../../../shared/types/entities";
import type { CrudApi } from "../../../shared/types/api";
import { namedEntityInputSchema } from "../../../shared/validation/schemas";
import { CrudPage } from "../components/CrudPage";

function NamedEntitiesPage({
  title,
  description,
  newLabel,
  emptyMessage,
  api,
}: {
  title: string;
  description: string;
  newLabel: string;
  emptyMessage: string;
  api: CrudApi<NamedEntity, NamedEntityInput>;
}) {
  return (
    <CrudPage
      title={title}
      description={description}
      newLabel={newLabel}
      emptyMessage={emptyMessage}
      api={api}
      schema={namedEntityInputSchema}
      emptyInput={{ name: "" }}
      formFields={[{ key: "name", label: "Nombre" }]}
      tableFields={[
        { key: "name", label: "Nombre", render: (item) => item.name },
      ]}
      toInput={(item) => ({ name: item.name })}
      itemName={(item) => item.name}
    />
  );
}

export function GruposPage() {
  return (
    <NamedEntitiesPage
      title="Grupos"
      newLabel="Nuevo grupo"
      emptyMessage="No hay grupos cargados."
      description="Clasificación terapéutica de los medicamentos."
      api={window.api.grupos}
    />
  );
}
export function MarcasPage() {
  return (
    <NamedEntitiesPage
      title="Marcas"
      newLabel="Nueva marca"
      emptyMessage="No hay marcas cargadas."
      description="Marcas comerciales disponibles."
      api={window.api.marcas}
    />
  );
}
