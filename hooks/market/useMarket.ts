/**
 * React Query hooks for Market/Worker search
 * Provides type-safe marketplace operations with caching
 */

"use client";

import { useQuery } from "@tanstack/react-query";
import { marketAPI } from "@/lib/market/api-client";
import type { WorkerFilters, WorkersResponse } from "@/lib/market/types";

/**
 * Query keys for market operations
 */
export const marketKeys = {
  all: ["market"] as const,
  workers: () => [...marketKeys.all, "workers"] as const,
  workersList: (filters?: WorkerFilters) =>
    [...marketKeys.workers(), { filters }] as const,
};

/**
 * Fetch workers with filters
 * Auto-caches based on filter parameters
 */
export function useWorkers(filters?: WorkerFilters) {
  return useQuery({
    queryKey: marketKeys.workersList(filters),
    queryFn: () => marketAPI.getWorkers(filters || {}),
    staleTime: 3 * 60 * 1000, // 3 minutes - marketplace data can be cached longer
    // Enable query by default, can be disabled with enabled: false option
  });
}

/**
 * Fetch workers with search query
 * Convenience hook for search functionality
 */
export function useSearchWorkers(
  searchQuery: string,
  additionalFilters?: Omit<WorkerFilters, "search">
) {
  return useWorkers({
    ...additionalFilters,
    search: searchQuery,
  });
}

/**
 * Fetch workers by service
 */
export function useWorkersByService(
  serviceId: string,
  additionalFilters?: Omit<WorkerFilters, "service_id">
) {
  return useWorkers({
    ...additionalFilters,
    service_id: serviceId,
  });
}

/**
 * Fetch workers by category
 */
export function useWorkersByCategory(
  categoryId: string,
  additionalFilters?: Omit<WorkerFilters, "category_id">
) {
  return useWorkers({
    ...additionalFilters,
    category_id: categoryId,
  });
}
