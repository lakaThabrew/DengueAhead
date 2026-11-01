/**
 * Generic API query hook.
 * Fetches on mount and whenever `url` changes.
 * Returns typed ApiResult states.
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import type { ZodSchema } from 'zod';
import { apiFetch } from './api.js';

export interface UseApiQueryResult<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useApiQuery<T>(url: string | null, schema: ZodSchema<T>): UseApiQueryResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(url !== null);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const schemaRef = useRef(schema);
  schemaRef.current = schema;

  const fetchData = useCallback(
    async (signal?: AbortSignal) => {
      if (!url) {
        setData(null);
        setIsLoading(false);
        setError(null);
        return;
      }
      setIsLoading(true);
      setError(null);

      try {
        const result = await apiFetch(url, schemaRef.current);
        if (signal?.aborted) return;
        if (result.ok) {
          setData(result.data);
          setError(null);
        } else {
          setError(result.message);
          setData(null);
        }
      } finally {
        if (!signal?.aborted) {
          setIsLoading(false);
        }
      }
    },
    [url]
  );

  useEffect(() => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    void fetchData(controller.signal);
    return () => controller.abort();
  }, [fetchData]);

  const refetch = useCallback(() => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    void fetchData(controller.signal);
  }, [fetchData]);

  return { data, isLoading, error, refetch };
}
