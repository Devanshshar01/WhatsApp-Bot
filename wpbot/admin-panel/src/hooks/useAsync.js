import { useCallback, useState } from 'react';

export function useAsync(asyncFn, { immediate = true, initialData = null } = {}) {
  const [data, setData] = useState(initialData);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(immediate);

  const execute = useCallback(
    async (...args) => {
      setLoading(true);
      setError(null);
      try {
        const result = await asyncFn(...args);
        setData(result);
        return { data: result, error: null };
      } catch (err) {
        setError(err);
        return { data: null, error: err };
      } finally {
        setLoading(false);
      }
    },
    [asyncFn]
  );

  return { data, error, loading, execute, setData, setError, setLoading };
}
