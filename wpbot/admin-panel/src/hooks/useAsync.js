import { useCallback, useState, useEffect } from 'react';

export function useAsync(asyncFn, { immediate = true, initialData = null } = {}) {
  const [data, setData] = useState(initialData);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(immediate);
  const [cancelled, setCancelled] = useState(false);

  useEffect(() => {
    return () => {
      setCancelled(true);
    };
  }, []);

  const execute = useCallback(
    async (...args) => {
      if (cancelled) return { data: null, error: null };
      setLoading(true);
      setError(null);
      try {
        const result = await asyncFn(...args);
        if (cancelled) return { data: null, error: null };
        setData(result);
        return { data: result, error: null };
      } catch (err) {
        console.error('useAsync error:', err);
        if (cancelled) return { data: null, error: null };
        setError(err);
        return { data: null, error: err };
      } finally {
        if (!cancelled) setLoading(false);
      }
    },
    [asyncFn, cancelled]
  );

  return { data, error, loading, execute, setData, setError, setLoading };
}
