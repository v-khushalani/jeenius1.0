import { useEffect, useState, useCallback } from 'react';
import { logger } from '@/utils/logger';

interface UseQueryOptions {
  enabled?: boolean;
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
}

export function useQuery<T>(
  queryFn: () => Promise<T>,
  deps: any[] = [],
  options: UseQueryOptions = {}
) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(true);
  const { enabled = true, onSuccess, onError } = options;

  const refetch = useCallback(async () => {
    if (!enabled) return;
    
    setLoading(true);
    setError(null);

    try {
      const result = await queryFn();
      setData(result);
      onSuccess?.(result);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      onError?.(error);
      logger.error('Query error:', error);
    } finally {
      setLoading(false);
    }
  }, [enabled, queryFn, onSuccess, onError, ...deps]);

  useEffect(() => {
    let mounted = true;

    if (!enabled) {
      setLoading(false);
      return;
    }

    queryFn()
      .then(result => {
        if (mounted) {
          setData(result);
          onSuccess?.(result);
        }
      })
      .catch(err => {
        if (mounted) {
          const error = err instanceof Error ? err : new Error('Unknown error');
          setError(error);
          onError?.(error);
          logger.error('Query error:', error);
        }
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [enabled, queryFn, onSuccess, onError, ...deps]);

  return { data, error, loading, refetch };
}
