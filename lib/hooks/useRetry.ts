import { useState, useCallback } from "react";

interface RetryOptions {
  maxRetries?: number;
  retryDelay?: number;
  onRetry?: (attempt: number) => void;
}

/**
 * Retry hook for async operations
 * @param fn - Async function to retry
 * @param options - Retry options
 * @returns Object with execute function and loading state
 */
export function useRetry<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options: RetryOptions = {}
) {
  const { maxRetries = 3, retryDelay = 1000, onRetry } = options;
  const [loading, setLoading] = useState(false);
  const [attempt, setAttempt] = useState(0);

  const execute = useCallback(
    async (...args: Parameters<T>): Promise<ReturnType<T>> => {
      let lastError: Error | null = null;

      for (let i = 0; i <= maxRetries; i++) {
        setAttempt(i);
        try {
          setLoading(true);
          const result = await fn(...args);
          setLoading(false);
          return result;
        } catch (error) {
          lastError = error as Error;
          if (i < maxRetries) {
            if (onRetry) {
              onRetry(i + 1);
            }
            await new Promise((resolve) => setTimeout(resolve, retryDelay));
          }
        } finally {
          if (i === maxRetries) {
            setLoading(false);
          }
        }
      }

      throw lastError || new Error("Failed after retries");
    },
    [fn, maxRetries, retryDelay, onRetry]
  );

  return { execute, loading, attempt };
}

