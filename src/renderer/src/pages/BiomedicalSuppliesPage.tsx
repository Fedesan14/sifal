import { useState } from "react";
import type {
  BiomedicalSupply,
  BiomedicalSupplyInput,
} from "../../../shared/types/entities";
import { biomedicalSupplyInputSchema } from "../../../shared/validation/schemas";
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
const empty: BiomedicalSupplyInput = {
  name: "",
  quantity: 0,
  expirationDate: "",
  location: "",
};
const fields: Field<BiomedicalSupplyInput>[] = [
  { key: "name", label: "Biomédico" },
  { key: "quantity", label: "Cantidad", type: "number" },
  { key: "expirationDate", label: "Fecha de vencimiento", type: "date" },
  { key: "location", label: "Ubicación" },
];
export function BiomedicalSuppliesPage() {
  const api = window.api.biomedicalSupplies;
  const crud = useCrud<BiomedicalSupply, BiomedicalSupplyInput>(api);
  const [editing, setEditing] = useState<BiomedicalSupply | true | null>(null);
  async function remove(item: BiomedicalSupply) {
    if (confirm(`¿Eliminar ${item.name}?`)) await crud.remove(item.id);
  }
  return (
    <Page>
      <Header>
        <div>
          <h1>Biomédicos</h1>
          <p>Administración del stock de insumos biomédicos.</p>
        </div>
        <Button onClick={() => setEditing(true)}>Nuevo biomédico</Button>
      </Header>
      {crud.error && <Message $error>{crud.error}</Message>}
      {crud.notice && <Message>{crud.notice}</Message>}
      <Card>
        {crud.loading ? (
          <Center>Cargando…</Center>
        ) : !crud.items.length ? (
          <Center>No hay insumos biomédicos cargados.</Center>
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
                    <td key={String(f.key)}>{String(item[f.key])}</td>
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
          title={editing === true ? "Nuevo biomédico" : "Editar biomédico"}
          fields={fields}
          initial={
            editing === true
              ? empty
              : (Object.fromEntries(
                  Object.keys(empty).map((k) => [
                    k,
                    editing[k as keyof BiomedicalSupply],
                  ]),
                ) as unknown as BiomedicalSupplyInput)
          }
          schema={biomedicalSupplyInputSchema}
          onClose={() => setEditing(null)}
          onSave={async (v) => {
            await crud.save(editing === true ? undefined : editing.id, v);
            setEditing(null);
          }}
        />
      )}
    </Page>
  );
}
