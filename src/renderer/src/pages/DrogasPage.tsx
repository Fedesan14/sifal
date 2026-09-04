import { useMemo, useState } from "react";
import type {
  Medicamento,
  MedicamentoInput,
} from "../../../shared/types/entities";
import { medicamentoInputSchema } from "../../../shared/validation/schemas";
import { formatExpirationMonthInput } from "../../../shared/formatters";
import { CrudPage } from "../components/CrudPage";
import {
  QuickCreateRelated,
  type QuickCreateRequest,
  type QuickEntityKind,
} from "../components/QuickCreateRelated";
import { useReferenceList } from "../hooks/useReferenceList";

export function MedicamentosPage() {
  const grupos = useReferenceList(window.api.grupos);
  const drogas = useReferenceList(window.api.drogas);
  const marcas = useReferenceList(window.api.marcas);
  const dosis = useReferenceList(window.api.dosis);
  const presentaciones = useReferenceList(window.api.presentaciones);
  const ubicaciones = useReferenceList(window.api.ubicaciones);
  const [quickCreate, setQuickCreate] = useState<QuickCreateRequest | null>(
    null,
  );

  const grupoNames = useMemo(
    () => new Map(grupos.items.map((item) => [item.id, item.name])),
    [grupos.items],
  );
  const drogaById = useMemo(
    () => new Map(drogas.items.map((item) => [item.id, item])),
    [drogas.items],
  );
  const marcaNames = useMemo(
    () => new Map(marcas.items.map((item) => [item.id, item.name])),
    [marcas.items],
  );
  const presentacionNames = useMemo(
    () => new Map(presentaciones.items.map((item) => [item.id, item.name])),
    [presentaciones.items],
  );
  const dosisNames = useMemo(
    () => new Map(dosis.items.map((item) => [item.id, item.name])),
    [dosis.items],
  );
  const ubicacionNames = useMemo(
    () => new Map(ubicaciones.items.map((item) => [item.id, item.nombre])),
    [ubicaciones.items],
  );
  const requiredLists = [drogas, marcas, presentaciones];
  const referencesLoading = requiredLists.some((list) => list.loading);
  const missingReferences = requiredLists.some(
    (list) => list.items.length === 0,
  );
  const referenceError = requiredLists.map((list) => list.error).find(Boolean);
  const catalogMessage =
    referenceError ||
    (!referencesLoading && missingReferences
      ? "Faltan datos relacionados. Podés crearlos desde los botones junto a cada selector del formulario."
      : undefined);
  const quickAction = (kind: QuickEntityKind, label: string) => ({
    label,
    onClick: (select: (value: string | number) => void) =>
      setQuickCreate({ kind, select: (id) => select(id) }),
  });
  const empty: MedicamentoInput = {
    drogaId: drogas.items[0]?.id ?? Number.NaN,
    fechaVencimiento: "",
    marcaId: marcas.items[0]?.id ?? Number.NaN,
    presentacionId: presentaciones.items[0]?.id ?? Number.NaN,
    dosisId:
      dosis.items.find(
        (item) => item.presentacionId === presentaciones.items[0]?.id,
      )?.id ?? Number.NaN,
    stocks: [],
  };

  return (
    <>
      <CrudPage<Medicamento, MedicamentoInput>
        title="Medicamentos"
        description="Administración del stock de medicamentos. El grupo se determina por la droga seleccionada."
        newLabel="Nuevo medicamento"
        emptyMessage="No hay medicamentos cargados."
        api={window.api.medicamentos}
        schema={medicamentoInputSchema}
        emptyInput={empty}
        createDisabledMessage={catalogMessage}
        formFields={[
          {
            key: "drogaId",
            label: "Droga",
            type: "select",
            numeric: true,
            actions: [quickAction("droga", "+ Crear droga")],
            options: drogas.items.map((item) => ({
              value: item.id,
              label: `${item.name}`,
            })),
          },
          {
            key: "grupo",
            label: "Grupo de la droga",
            type: "display",
            displayValue: (value) => {
              const droga = drogaById.get(value.drogaId);
              return droga
                ? (grupoNames.get(droga.grupoId) ?? "Grupo sin cargar")
                : "Seleccioná una droga";
            },
          },
          {
            key: "fechaVencimiento",
            label: "Mes de vencimiento (MM/YYYY)",
            type: "text",
            placeholder: "MM/YYYY",
            formatInput: formatExpirationMonthInput,
          },
          {
            key: "marcaId",
            label: "Marca",
            type: "select",
            numeric: true,
            actions: [quickAction("marca", "+ Crear marca")],
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
            actions: [quickAction("presentacion", "+ Crear presentación")],
            onChange: (value, raw) => {
              const presentacionId = Number(raw);
              return {
                ...value,
                presentacionId,
                dosisId:
                  dosis.items.find(
                    (item) => item.presentacionId === presentacionId,
                  )?.id ?? Number.NaN,
              };
            },
            options: presentaciones.items.map((item) => ({
              value: item.id,
              label: item.name,
            })),
          },
          {
            key: "dosisId",
            label: "Dosis",
            type: "select",
            numeric: true,
            actions: [{
              label: "+ Crear dosis para esta presentación",
              onClick: (select, current) => setQuickCreate({
                kind: "dosis",
                presentacionId: current.presentacionId,
                select: (id) => select(id),
              }),
            }],
            options: (current) => dosis.items
              .filter((item) => item.presentacionId === current.presentacionId)
              .map((item) => ({ value: item.id, label: item.name })),
          },
          {
            key: "stocks",
            label: "Stock por ubicación (opcional)",
            type: "location-stock",
            actions: [quickAction("ubicacion", "+ Crear ubicación")],
            options: ubicaciones.items.map((item) => ({
              value: item.id,
              label: item.nombre,
            })),
          },
        ]}
        tableFields={[
          {
            key: "droga",
            label: "Medicamento",
            render: (item) =>
              drogaById.get(item.drogaId)?.name ?? `#${item.drogaId}`,
          },
          {
            key: "grupo",
            label: "Grupo",
            render: (item) => {
              const droga = drogaById.get(item.drogaId);
              return droga
                ? (grupoNames.get(droga.grupoId) ?? `#${droga.grupoId}`)
                : "—";
            },
          },
          {
            key: "cantidad",
            label: "Cantidad",
            render: (item) => item.cantidad,
          },
          {
            key: "fecha",
            label: "Vencimiento",
            render: (item) => item.fechaVencimiento,
          },
          {
            key: "marca",
            label: "Marca",
            render: (item) =>
              marcaNames.get(item.marcaId) ?? `#${item.marcaId}`,
          },
          {
            key: "presentacion",
            label: "Presentación",
            render: (item) =>
              presentacionNames.get(item.presentacionId) ??
              `#${item.presentacionId}`,
          },
          {
            key: "ubicaciones",
            label: "Stock por ubicación",
            render: (item) =>
              item.stocks
                .map(
                  (stock) =>
                    `${ubicacionNames.get(stock.ubicacionId) ?? `#${stock.ubicacionId}`}: ${stock.cantidad}`,
                )
                .join(", ") || "Sin stock asignado",
          },
          {
            key: "dosis",
            label: "Dosis",
            render: (item) => dosisNames.get(item.dosisId) ?? `#${item.dosisId}`,
          },
        ]}
        toInput={(item) => ({
          drogaId: item.drogaId,
          fechaVencimiento: item.fechaVencimiento,
          marcaId: item.marcaId,
          presentacionId: item.presentacionId,
          dosisId: item.dosisId,
          stocks: item.stocks,
        })}
        itemName={(item) =>
          drogaById.get(item.drogaId)?.name ?? `#${item.drogaId}`
        }
      />
      {quickCreate && (
        <QuickCreateRelated
          request={quickCreate}
          onClose={() => setQuickCreate(null)}
          grupos={grupos}
          drogas={drogas}
          marcas={marcas}
          dosis={dosis}
          presentaciones={presentaciones}
          ubicaciones={ubicaciones}
        />
      )}
    </>
  );
}
