import { useMemo } from "react";
import type { Droga, DrogaInput } from "../../../shared/types/entities";
import { drogaInputSchema } from "../../../shared/validation/schemas";
import { CrudPage } from "../components/CrudPage";
import { useReferenceList } from "../hooks/useReferenceList";

export function DrogasPage() {
  const grupos = useReferenceList(window.api.grupos);
  const marcas = useReferenceList(window.api.marcas);
  const presentaciones = useReferenceList(window.api.presentaciones);
  const ubicaciones = useReferenceList(window.api.ubicaciones);
  const grupoNames = useMemo(
    () => new Map(grupos.items.map((item) => [item.id, item.name])),
    [grupos.items],
  );
  const marcaNames = useMemo(
    () => new Map(marcas.items.map((item) => [item.id, item.name])),
    [marcas.items],
  );
  const presentacionNames = useMemo(
    () => new Map(presentaciones.items.map((item) => [item.id, item.name])),
    [presentaciones.items],
  );
  const ubicacionNames = useMemo(
    () =>
      new Map(
        ubicaciones.items.map((item) => [
          item.id,
          item.tipo === "TAQUILLA"
            ? `${item.nombre} · Taquilla ${item.numero}`
            : `${item.nombre} · Pañol`,
        ]),
      ),
    [ubicaciones.items],
  );
  const referenceLists = [grupos, marcas, presentaciones, ubicaciones];
  const referencesLoading = referenceLists.some((list) => list.loading);
  const missingReferences = referenceLists.some(
    (list) => list.items.length === 0,
  );
  const referenceError = referenceLists.map((list) => list.error).find(Boolean);
  const disabledMessage =
    referenceError ||
    (!referencesLoading && missingReferences
      ? "Para cargar medicamentos necesitás al menos un grupo, una marca, una presentación y una ubicación."
      : undefined);
  const empty: DrogaInput = {
    name: "",
    cantidad: 0,
    fechaVencimiento: "",
    grupoId: grupos.items[0]?.id ?? Number.NaN,
    marcaId: marcas.items[0]?.id ?? Number.NaN,
    presentacionId: presentaciones.items[0]?.id ?? Number.NaN,
    ubicacionId: ubicaciones.items[0]?.id ?? Number.NaN,
  };

  return (
    <CrudPage<Droga, DrogaInput>
      title="Medicamentos"
      description="Administración del stock normalizado de medicamentos."
      newLabel="Nuevo medicamento"
      emptyMessage="No hay medicamentos cargados."
      api={window.api.drogas}
      schema={drogaInputSchema}
      emptyInput={empty}
      createDisabled={referencesLoading || missingReferences}
      createDisabledMessage={disabledMessage}
      formFields={[
        { key: "name", label: "Nombre" },
        { key: "cantidad", label: "Cantidad", type: "number", min: 0 },
        {
          key: "fechaVencimiento",
          label: "Fecha de vencimiento",
          type: "date",
        },
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
        {
          key: "marcaId",
          label: "Marca",
          type: "select",
          numeric: true,
          options: marcas.items.map((item) => ({
            value: item.id,
            label: item.name,
          })),
        },
        {
          key: "presentacionId",
          label: "Presentación",
          type: "select",
          numeric: true,
          options: presentaciones.items.map((item) => ({
            value: item.id,
            label: item.name,
          })),
        },
        {
          key: "ubicacionId",
          label: "Ubicación",
          type: "select",
          numeric: true,
          options: ubicaciones.items.map((item) => ({
            value: item.id,
            label: ubicacionNames.get(item.id) ?? item.nombre,
          })),
        },
      ]}
      tableFields={[
        { key: "name", label: "Medicamento", render: (item) => item.name },
        { key: "cantidad", label: "Cantidad", render: (item) => item.cantidad },
        {
          key: "fecha",
          label: "Vencimiento",
          render: (item) => item.fechaVencimiento,
        },
        {
          key: "grupo",
          label: "Grupo",
          render: (item) => grupoNames.get(item.grupoId) ?? `#${item.grupoId}`,
        },
        {
          key: "marca",
          label: "Marca",
          render: (item) => marcaNames.get(item.marcaId) ?? `#${item.marcaId}`,
        },
        {
          key: "presentacion",
          label: "Presentación",
          render: (item) =>
            presentacionNames.get(item.presentacionId) ??
            `#${item.presentacionId}`,
        },
        {
          key: "ubicacion",
          label: "Ubicación",
          render: (item) =>
            ubicacionNames.get(item.ubicacionId) ?? `#${item.ubicacionId}`,
        },
      ]}
      toInput={(item) => ({
        name: item.name,
        cantidad: item.cantidad,
        fechaVencimiento: item.fechaVencimiento,
        grupoId: item.grupoId,
        marcaId: item.marcaId,
        presentacionId: item.presentacionId,
        ubicacionId: item.ubicacionId,
      })}
      itemName={(item) => item.name}
    />
  );
}
