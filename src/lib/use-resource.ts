"use client";
import { useCallback, useEffect, useState } from "react";
import type { z } from "zod";
import { message, read } from "./api";
export function useResource<T>(path: string, schema: z.ZodType<T>) {
  const [revision, setRevision] = useState(0);
  const [state, setState] = useState<{
    data: T | null;
    error: string;
    loading: boolean;
    revision: number;
  }>({ data: null, error: "", loading: true, revision: -1 });
  useEffect(() => {
    const controller = new AbortController();
    void read(path, schema, controller.signal)
      .then((data) => {
        if (!controller.signal.aborted)
          setState({ data, error: "", loading: false, revision });
      })
      .catch((error) => {
        if (!controller.signal.aborted)
          setState({
            data: null,
            error: message(error),
            loading: false,
            revision,
          });
      });
    return () => controller.abort();
  }, [path, schema, revision]);
  return {
    ...state,
    loading: state.revision !== revision || state.loading,
    reload: useCallback(() => setRevision((v) => v + 1), []),
  };
}
