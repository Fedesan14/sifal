import { useState, type FormEvent } from "react";
import type { ZodType } from "zod";
import { Button, Dialog, FormGrid, MultipleRegisterContainer, Overlay } from "./ui";

export interface Field<T> {
  key: keyof T;
  label: string;
  type?: "text" | "number" | "date";
}

export function EntityForm<T extends object>({
  title,
  fields,
  initial,
  schema,
  onSave,
  onClose,
}: {
  title: string;
  fields: Field<T>[];
  initial: T;
  schema: ZodType<T>;
  onSave: (value: T) => Promise<void>;
  onClose: () => void;
}) {
  const [value, setValue] = useState(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [isRegisterMultiple, setIsRegisterMultiple] = useState<boolean>(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const parsed = schema.safeParse(value);
    if (!parsed.success) {
      setErrors(
        Object.fromEntries(
          parsed.error.issues.map((i) => [String(i.path[0]), i.message]),
        ),
      );
      return;
    }

    setSaving(true);
    try {
      await onSave(parsed.data);
      if(!isRegisterMultiple) {
        onClose();
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <Overlay
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <Dialog role="dialog" aria-modal="true">
        <h2>{title}</h2>
        <FormGrid onSubmit={submit}>
          {fields.map((field) => (
            <label key={String(field.key)}>
              {field.label}
              <input
                autoFocus={field === fields[0]}
                type={field.type ?? "text"}
                min={field.type === "number" ? 0 : undefined}
                value={String(value[field.key])}
                onChange={(e) => {
                  const next =
                    field.type === "number"
                      ? Number(e.target.value)
                      : e.target.value;
                  setValue({ ...value, [field.key]: next });
                  setErrors({ ...errors, [String(field.key)]: "" });
                }}
              />
              {errors[String(field.key)] && (
                <span className="field-error">{errors[String(field.key)]}</span>
              )}
            </label>
          ))}
          <div className="buttons">
            <MultipleRegisterContainer>
              <label>
                Activar carga multiple
              </label>
              <input type="checkbox" checked={isRegisterMultiple} onChange={(value) => setIsRegisterMultiple(value.target.checked)} />
            </MultipleRegisterContainer>
            <Button type="button" $secondary onClick={onClose}>
              Cancelar
            </Button>
            <Button disabled={saving}>
              {saving ? "Guardando…" : "Guardar"}
            </Button>
          </div>
        </FormGrid>
      </Dialog>
    </Overlay>
  );
}
