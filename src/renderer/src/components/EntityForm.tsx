import { useState, type FormEvent } from "react";
import type { ZodType } from "zod";
import {
  Button,
  Dialog,
  FormGrid,
  Message,
  MultipleRegisterContainer,
  Overlay,
} from "./ui";

export interface Field<T> {
  key: string;
  label: string;
  type?: "text" | "number" | "date" | "select" | "display";
  options?: { value: string | number; label: string }[];
  numeric?: boolean;
  min?: number;
  visible?: (value: T) => boolean;
  onChange?: (value: T, raw: string) => T;
  displayValue?: (value: T) => string;
  actions?: {
    label: string;
    onClick: (selectValue: (value: string | number) => void) => void;
  }[];
}

export function EntityForm<T extends object>({
  title,
  fields,
  initial,
  schema,
  onSave,
  onClose,
  allowMultiple = false,
}: {
  title: string;
  fields: Field<T>[];
  initial: T;
  schema: ZodType<T>;
  onSave: (value: T) => Promise<void>;
  onClose: () => void;
  allowMultiple?: boolean;
}) {
  const [value, setValue] = useState(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saveAnother, setSaveAnother] = useState(false);
  const [submitError, setSubmitError] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    const parsed = schema.safeParse(value);
    if (!parsed.success) {
      setErrors(
        Object.fromEntries(
          parsed.error.issues.map((i) => [String(i.path[0]), i.message]),
        ),
      );
      setSubmitError("Revisá los campos marcados antes de guardar.");
      return;
    }

    setSaving(true);
    setSubmitError("");
    try {
      await onSave(parsed.data);
      if (saveAnother) {
        setValue(initial);
        setErrors({});
      } else {
        onClose();
      }
    } catch (error) {
      const details =
        error instanceof Error &&
        "details" in error &&
        typeof error.details === "object"
          ? (error.details as Record<string, string>)
          : undefined;
      if (details) setErrors(details);
      setSubmitError(
        error instanceof Error
          ? error.message
          : "No se pudo guardar el registro.",
      );
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
        {submitError && <Message $error>{submitError}</Message>}
        <FormGrid onSubmit={submit}>
          {fields
            .filter((field) => !field.visible || field.visible(value))
            .map((field, index) => {
              const record = value as Record<string, unknown>;
              const rawValue = record[field.key];
              const displayValue =
                typeof rawValue === "number" && Number.isNaN(rawValue)
                  ? ""
                  : String(rawValue ?? "");
              const update = (raw: string) => {
                if (field.onChange) setValue(field.onChange(value, raw));
                else {
                  const next =
                    field.type === "number" || field.numeric
                      ? raw === ""
                        ? Number.NaN
                        : Number(raw)
                      : raw;
                  setValue({ ...value, [field.key]: next });
                }
                setErrors({ ...errors, [field.key]: "" });
                setSubmitError("");
              };
              return (
                <label key={String(field.key)}>
                  <span className="field-label-row">
                    <span>{field.label}</span>
                    {field.actions?.map((action) => (
                      <button
                        className="field-action"
                        key={action.label}
                        type="button"
                        onClick={() =>
                          action.onClick((next) => {
                            setValue((current) => ({
                              ...current,
                              [field.key]: next,
                            }));
                            setErrors((current) => ({
                              ...current,
                              [field.key]: "",
                            }));
                          })
                        }
                      >
                        {action.label}
                      </button>
                    ))}
                  </span>
                  {field.type === "display" ? (
                    <output className="field-display">
                      {field.displayValue?.(value) || "—"}
                    </output>
                  ) : field.type === "select" ? (
                    <select
                      autoFocus={index === 0}
                      value={displayValue}
                      onChange={(event) => update(event.target.value)}
                    >
                      <option value="">Seleccionar…</option>
                      {field.options?.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      autoFocus={index === 0}
                      type={field.type ?? "text"}
                      min={field.min}
                      value={displayValue}
                      onChange={(event) => update(event.target.value)}
                    />
                  )}
                  {errors[String(field.key)] && (
                    <span className="field-error">
                      {errors[String(field.key)]}
                    </span>
                  )}
                </label>
              );
            })}
          <div className="buttons">
            {allowMultiple && (
              <MultipleRegisterContainer>
                <input
                  id="save-another"
                  type="checkbox"
                  checked={saveAnother}
                  onChange={(event) => setSaveAnother(event.target.checked)}
                />
                <label htmlFor="save-another">Guardar y cargar otro</label>
              </MultipleRegisterContainer>
            )}
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
