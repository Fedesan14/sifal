import { useCallback, useEffect, useState } from "react";
import type { ApiResult } from "../../../shared/types/entities";

interface Crud<T, TInput> {
  list(): Promise<ApiResult<T[]>>;
  create(v: TInput): Promise<ApiResult<T>>;
  update(id: number, v: TInput): Promise<ApiResult<T>>;
  delete(id: number): Promise<ApiResult<void>>;
}
export function useCrud<T extends { id: number }, TInput>(
  api: Crud<T, TInput>,
) {
  const [items, setItems] = useState<T[]>([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  const load = useCallback(async () => {
    setLoading(true);
    const r = await api.list();
    if (r.ok) {
      setItems(r.data);
      setError("");
    } else setError(r.error.message);
    setLoading(false);
  }, [api]);
  // La carga inicial sincroniza el componente con la base SQLite a través de IPC.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);
  async function save(id: number | undefined, input: TInput) {
    const r = id ? await api.update(id, input) : await api.create(input);
    if (!r.ok) {
      const error = new Error(r.error.message) as Error & {
        details?: Record<string, string>;
      };
      error.details = r.error.details;
      throw error;
    }
    setNotice(id ? "Registro actualizado." : "Registro creado.");
    await load();
  }
  async function remove(id: number) {
    const r = await api.delete(id);
    if (!r.ok) {
      setError(r.error.message);
      return;
    }
    setNotice("Registro eliminado.");
    await load();
  }
  return { items, loading, error, notice, setNotice, save, remove };
}
