import { useEffect, useState } from "react";
import type { CrudApi } from "../../../shared/types/api";

export function useReferenceList<T, TInput>(api: CrudApi<T, TInput>) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    api
      .list()
      .then((result) => {
        if (!active) return;
        if (result.ok) setItems(result.data);
        else setError(result.error.message);
        setLoading(false);
      })
      .catch(() => {
        if (active) {
          setError("No se pudieron cargar los datos relacionados.");
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [api]);

  function add(item: T) {
    setItems((current) => [item, ...current]);
  }

  return { items, loading, error, add };
}
