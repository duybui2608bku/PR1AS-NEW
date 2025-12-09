/**
 * useAsyncAction Hook
 * Reusable hook for handling async actions with loading, error, and success states
 */

import { useState, useCallback } from "react";
import { showMessage } from "@/lib/utils/toast";

interface UseAsyncActionOptions {
  /**
   * Success message to show after action completes
   */
  successMessage?: string;
  /**
   * Error message to show if action fails
   * If not provided, the error message from the error object will be used
   */
  errorMessage?: string;
  /**
   * Callback to run on success
   */
  onSuccess?: () => void;
  /**
   * Callback to run on error
   */
  onError?: (error: Error) => void;
  /**
   * Whether to show success notification (default: false)
   */
  showSuccessNotification?: boolean;
  /**
   * Whether to show error notification (default: true)
   */
  showErrorNotification?: boolean;
}

interface UseAsyncActionReturn<T> {
  /**
   * Loading state
   */
  loading: boolean;
  /**
   * Error state
   */
  error: Error | null;
  /**
   * Execute the async action
   */
  execute: (...args: Parameters<T>) => Promise<void>;
  /**
   * Reset error state
   */
  reset: () => void;
}

/**
 * Custom hook for handling async actions with loading and error states
 *
 * @example
 * ```tsx
 * const { loading, error, execute } = useAsyncAction(
 *   async (id: string) => {
 *     await api.deleteItem(id);
 *   },
 *   {
 *     successMessage: "Item deleted successfully",
 *     errorMessage: "Failed to delete item",
 *     onSuccess: () => refetch(),
 *   }
 * );
 *
 * return (
 *   <button onClick={() => execute(itemId)} disabled={loading}>
 *     {loading ? "Deleting..." : "Delete"}
 *   </button>
 * );
 * ```
 */
export function useAsyncAction<T extends (...args: any[]) => Promise<any>>(
  action: T,
  options: UseAsyncActionOptions = {}
): UseAsyncActionReturn<T> {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const {
    successMessage,
    errorMessage,
    onSuccess,
    onError,
    showSuccessNotification = false,
    showErrorNotification = true,
  } = options;

  const execute = useCallback(
    async (...args: Parameters<T>) => {
      try {
        setLoading(true);
        setError(null);

        await action(...args);

        // Show success notification if configured
        if (showSuccessNotification && successMessage) {
          showMessage.success(successMessage);
        }

        // Call success callback
        if (onSuccess) {
          onSuccess();
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Unknown error");
        setError(error);

        // Show error notification if configured
        if (showErrorNotification) {
          const message = errorMessage || error.message;
          showMessage.error(message);
        }

        // Call error callback
        if (onError) {
          onError(error);
        }
      } finally {
        setLoading(false);
      }
    },
    [
      action,
      successMessage,
      errorMessage,
      onSuccess,
      onError,
      showSuccessNotification,
      showErrorNotification,
    ]
  );

  const reset = useCallback(() => {
    setError(null);
  }, []);

  return {
    loading,
    error,
    execute,
    reset,
  };
}

/**
 * Variant of useAsyncAction that returns data from the action
 */
interface UseAsyncActionWithDataReturn<T, R> extends UseAsyncActionReturn<T> {
  /**
   * Data returned from the action
   */
  data: R | null;
}

export function useAsyncActionWithData<
  T extends (...args: any[]) => Promise<R>,
  R
>(
  action: T,
  options: UseAsyncActionOptions = {}
): UseAsyncActionWithDataReturn<T, R> {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<R | null>(null);

  const {
    successMessage,
    errorMessage,
    onSuccess,
    onError,
    showSuccessNotification = false,
    showErrorNotification = true,
  } = options;

  const execute = useCallback(
    async (...args: Parameters<T>) => {
      try {
        setLoading(true);
        setError(null);

        const result = await action(...args);
        setData(result);

        // Show success notification if configured
        if (showSuccessNotification && successMessage) {
          showMessage.success(successMessage);
        }

        // Call success callback
        if (onSuccess) {
          onSuccess();
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Unknown error");
        setError(error);
        setData(null);

        // Show error notification if configured
        if (showErrorNotification) {
          const message = errorMessage || error.message;
          showMessage.error(message);
        }

        // Call error callback
        if (onError) {
          onError(error);
        }
      } finally {
        setLoading(false);
      }
    },
    [
      action,
      successMessage,
      errorMessage,
      onSuccess,
      onError,
      showSuccessNotification,
      showErrorNotification,
    ]
  );

  const reset = useCallback(() => {
    setError(null);
    setData(null);
  }, []);

  return {
    loading,
    error,
    data,
    execute,
    reset,
  };
}
