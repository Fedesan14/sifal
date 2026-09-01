import { useState, type ReactNode } from "react";
import type { ZodType } from "zod";
import type { CrudApi } from "../../../shared/types/api";
import { EntityForm, type Field } from "./EntityForm";
import { Button, Card, Center, Header, Message, Page, Table } from "./ui";
import { useCrud } from "../hooks/useCrud";

export interface TableField<T> {
  key: string;
  label: string;
  render: (item: T) => ReactNode;
}

export function CrudPage<T extends { id: number }, TInput extends object>({
  title,
  description,
  newLabel,
  emptyMessage,
  api,
  schema,
  emptyInput,
  formFields,
  tableFields,
  toInput,
  itemName,
  createDisabled = false,
  createDisabledMessage,
}: {
  title: string;
  description: string;
  newLabel: string;
  emptyMessage: string;
  api: CrudApi<T, TInput>;
  schema: ZodType<TInput>;
  emptyInput: TInput;
  formFields: Field<TInput>[];
  tableFields: TableField<T>[];
  toInput: (item: T) => TInput;
  itemName: (item: T) => string;
  createDisabled?: boolean;
  createDisabledMessage?: string;
}) {
  const crud = useCrud<T, TInput>(api);
  const [editing, setEditing] = useState<T | true | null>(null);

  async function remove(item: T) {
    if (confirm(`¿Eliminar ${itemName(item)}?`)) await crud.remove(item.id);
  }

  return (
    <Page>
      <Header>
        <div>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
        <Button disabled={createDisabled} onClick={() => setEditing(true)}>
          {newLabel}
        </Button>
      </Header>
      {createDisabled && createDisabledMessage && (
        <Message>{createDisabledMessage}</Message>
      )}
      {crud.error && <Message $error>{crud.error}</Message>}
      {crud.notice && <Message>{crud.notice}</Message>}
      <Card>
        {crud.loading ? (
          <Center>Cargando…</Center>
        ) : !crud.items.length ? (
          <Center>{emptyMessage}</Center>
        ) : (
          <Table>
            <thead>
              <tr>
                {tableFields.map((field) => (
                  <th key={field.key}>{field.label}</th>
                ))}
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {crud.items.map((item) => (
                <tr key={item.id}>
                  {tableFields.map((field) => (
                    <td key={field.key}>{field.render(item)}</td>
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
          title={editing === true ? newLabel : `Editar ${itemName(editing)}`}
          fields={formFields}
          initial={editing === true ? emptyInput : toInput(editing)}
          schema={schema}
          allowMultiple={editing === true}
          onClose={() => setEditing(null)}
          onSave={(value) =>
            crud.save(editing === true ? undefined : editing.id, value)
          }
        />
      )}
    </Page>
  );
}
