import { useState } from "react";
import type {
  Medication,
  MedicationInput,
} from "../../../shared/types/entities";
import { medicationInputSchema } from "../../../shared/validation/schemas";
import { EntityForm, type Field } from "../components/EntityForm";
import {
  Button,
  Card,
  Center,
  Header,
  Message,
  Page,
  Table,
} from "../components/ui";
import { useCrud } from "../hooks/useCrud";
const empty: MedicationInput = {
  group: "",
  drug: "",
  dose: "",
  presentation: "",
  commercialBrand: "",
  quantity: 0,
  expirationDate: "",
  acquisition: "",
  location: "",
};
const fields: Field<MedicationInput>[] = [
  { key: "group", label: "Grupo" },
  { key: "drug", label: "Droga" },
  { key: "dose", label: "Dosis" },
  { key: "presentation", label: "Presentación" },
  { key: "commercialBrand", label: "Marca comercial" },
  { key: "quantity", label: "Cantidad", type: "number" },
  { key: "expirationDate", label: "Fecha de vencimiento", type: "date" },
  { key: "acquisition", label: "Adquisición" },
  { key: "location", label: "Ubicación" },
];
export function MedicationsPage() {
  const api = window.api.medications;
  const crud = useCrud<Medication, MedicationInput>(api);
  const [editing, setEditing] = useState<Medication | true | null>(null);
  async function remove(item: Medication) {
    if (confirm(`¿Eliminar ${item.drug} ${item.dose}?`))
      await crud.remove(item.id);
  }
  return (
    <Page>
      <Header>
        <div>
          <h1>Medicamentos</h1>
          <p>Administración del stock de medicamentos.</p>
        </div>
        <Button onClick={() => setEditing(true)}>Nuevo medicamento</Button>
      </Header>
      {crud.error && <Message $error>{crud.error}</Message>}
      {crud.notice && <Message>{crud.notice}</Message>}
      <Card>
        {crud.loading ? (
          <Center>Cargando…</Center>
        ) : !crud.items.length ? (
          <Center>No hay medicamentos cargados.</Center>
        ) : (
          <Table>
            <thead>
              <tr>
                {fields.map((f) => (
                  <th key={String(f.key)}>{f.label}</th>
                ))}
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {crud.items.map((item) => (
                <tr key={item.id}>
                  {fields.map((f) => (
                    <td key={String(f.key)}>
                      {String(item[f.key as keyof Medication])}
                    </td>
                  ))}
                  <td className="actions">
                    <Button $secondary onClick={() => setEditing(item)}>
                      Editar
                    </Button>
                    <Button $danger onClick={() => void remove(item)}>
                      Eliminar
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
      {editing && (
        <EntityForm
          title={editing === true ? "Nuevo medicamento" : "Editar medicamento"}
          fields={fields}
          initial={
            editing === true
              ? empty
              : (Object.fromEntries(
                  Object.keys(empty).map((k) => [
                    k,
                    editing[k as keyof Medication],
                  ]),
                ) as unknown as MedicationInput)
          }
          schema={medicationInputSchema}
          onClose={() => setEditing(null)}
          onSave={async (v) => {
            await crud.save(editing === true ? undefined : editing.id, v);
          }}
        />
      )}
    </Page>
  );
}
