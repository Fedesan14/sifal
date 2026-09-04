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
  type?: "text" | "number" | "date" | "month" | "select" | "display" | "location-stock";
  options?: { value: string | number; label: string }[] | ((current: T) => { value: string | number; label: string }[]);
  numeric?: boolean;
  min?: number;
  placeholder?: string;
  formatInput?: (raw: string, previous: string) => string;
  visible?: (value: T) => boolean;
  onChange?: (value: T, raw: string) => T;
  displayValue?: (value: T) => string;
  actions?: {
    label: string;
    onClick: (selectValue: (value: string | number) => void, current: T) => void;
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
              const options = typeof field.options === "function" ? field.options(value) : field.options;
              const update = (raw: string) => {
                const formatted = field.formatInput ? field.formatInput(raw, displayValue) : raw;
                if (field.onChange) setValue(field.onChange(value, formatted));
                else {
                  const next =
                    field.type === "number" || field.numeric
                      ? formatted === ""
                        ? Number.NaN
                        : Number(formatted)
                      : formatted;
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
                            setValue((current) => {
                              if (field.type === "location-stock") {
                                const record = current as Record<string, unknown>;
                                const stocks = Array.isArray(record[field.key])
                                  ? (record[field.key] as {
                                      ubicacionId: number;
                                      cantidad: number;
                                    }[])
                                  : [];
                                const ubicacionId = Number(next);
                                return {
                                  ...current,
                                  [field.key]: stocks.some(
                                    (stock) =>
                                      stock.ubicacionId === ubicacionId,
                                  )
                                    ? stocks
                                    : [...stocks, { ubicacionId, cantidad: 0 }],
                                };
                              }
                              return { ...current, [field.key]: next };
                            });
                            setErrors((current) => ({
                              ...current,
                              [field.key]: "",
                            }));
                          }, value)
                        }
                      >
                        {action.label}
                      </button>
                    ))}
                  </span>
                  {field.type === "location-stock" ? (
                    <div className="location-stock-grid">
                      {options?.map((option) => {
                        const stocks = Array.isArray(rawValue)
                          ? (rawValue as {
                              ubicacionId: number;
                              cantidad: number;
                            }[])
                          : [];
                        const current = stocks.find(
                          (stock) => stock.ubicacionId === Number(option.value),
                        );
                        return (
                          <label key={option.value}>
                            <span>{option.label}</span>
                            <input
                              type="number"
                              min={0}
                              value={current?.cantidad ?? ""}
                              onChange={(event) => {
                                const ubicacionId = Number(option.value);
                                const next = stocks.filter(
                                  (stock) => stock.ubicacionId !== ubicacionId,
                                );
                                if (event.target.value !== "")
                                  next.push({
                                    ubicacionId,
                                    cantidad: Number(event.target.value),
                                  });
                                setValue({ ...value, [field.key]: next });
                                setErrors({ ...errors, [field.key]: "" });
                              }}
                            />
                          </label>
                        );
                      })}
                    </div>
                  ) : field.type === "display" ? (
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
                      {options?.map((option) => (
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
                      placeholder={field.placeholder}
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
