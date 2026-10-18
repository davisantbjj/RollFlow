'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from './api';
import { useAuth } from './auth';

/** Busca GET e refaz quando o path ou a academia selecionada mudam. Passe null para pausar. */
export function useFetch<T>(path: string | null) {
  const { academy } = useAuth();
  const academyId = academy?.id ?? '';
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(path !== null);
  const seq = useRef(0);

  const run = useCallback(async () => {
    if (path === null) return;
    const id = ++seq.current;
    setLoading(true);
    setError(null);
    try {
      const res = await api<T>(path);
      if (id === seq.current) setData(res);
    } catch (e) {
      if (id === seq.current) setError(e instanceof Error ? e.message : 'Erro inesperado');
    } finally {
      if (id === seq.current) setLoading(false);
    }
  }, [path, academyId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    run();
  }, [run]);

  return { data, error, loading, reload: run };
}

export const errMsg = (e: unknown) => (e instanceof Error ? e.message : 'Erro inesperado');
