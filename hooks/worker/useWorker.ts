/**
 * React Query hooks for Worker operations
 * Worker API already uses Axios, these hooks add React Query caching
 */

"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { workerAPI } from "@/lib/worker/api-client";
import { showMessage } from "@/lib/utils/toast";
import type {
  WorkerProfileStep1Request,
  UpdateServicePriceRequest,
  SetAvailabilityRequest,
} from "@/lib/worker/types";

/**
 * Query keys for worker operations
 */
export const workerKeys = {
  all: ["worker"] as const,
  profile: () => [...workerKeys.all, "profile"] as const,
  publicProfile: (workerId: string) =>
    [...workerKeys.all, "publicProfile", workerId] as const,
  services: () => [...workerKeys.all, "services"] as const,
  categories: () => [...workerKeys.all, "categories"] as const,
  availability: () => [...workerKeys.all, "availability"] as const,
};

/**
 * Get worker's own profile
 */
export function useWorkerProfile() {
  return useQuery({
    queryKey: workerKeys.profile(),
    queryFn: () => workerAPI.getProfile(),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Get public worker profile
 */
export function usePublicWorkerProfile(workerId: string) {
  return useQuery({
    queryKey: workerKeys.publicProfile(workerId),
    queryFn: () => workerAPI.getPublicProfile(workerId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!workerId,
  });
}

/**
 * Get service categories
 */
export function useServiceCategories() {
  return useQuery({
    queryKey: workerKeys.categories(),
    queryFn: () => workerAPI.getServiceCategories(),
    staleTime: 30 * 60 * 1000, // 30 minutes - categories rarely change
  });
}

/**
 * Update worker profile
 */
export function useUpdateWorkerProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (update: WorkerProfileStep1Request) =>
      workerAPI.updateProfile(update),
    onSuccess: (data) => {
      // Update profile in cache
      queryClient.setQueryData(workerKeys.profile(), data);
      showMessage.success("Profile updated successfully");
    },
    onError: (error: Error) => {
      showMessage.error(error.message || "Failed to update profile");
    },
  });
}

/**
 * Update service pricing
 */
export function useUpdateServicePricing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      serviceId,
      pricing,
    }: {
      serviceId: string;
      pricing: UpdateServicePriceRequest;
    }) => workerAPI.updateServicePricing(serviceId, pricing),
    onSuccess: () => {
      // Invalidate profile to refetch with new pricing
      queryClient.invalidateQueries({ queryKey: workerKeys.profile() });
      queryClient.invalidateQueries({ queryKey: workerKeys.services() });
      showMessage.success("Pricing updated successfully");
    },
    onError: (error: Error) => {
      showMessage.error(error.message || "Failed to update pricing");
    },
  });
}

/**
 * Update availability
 */
export function useUpdateAvailability() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (availability: SetAvailabilityRequest) =>
      workerAPI.updateAvailability(availability),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workerKeys.profile() });
      queryClient.invalidateQueries({ queryKey: workerKeys.availability() });
      showMessage.success("Availability updated successfully");
    },
    onError: (error: Error) => {
      showMessage.error(error.message || "Failed to update availability");
    },
  });
}

/**
 * Publish worker profile
 */
export function usePublishProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => workerAPI.publishProfile(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workerKeys.profile() });
      showMessage.success("Profile published successfully!");
    },
    onError: (error: Error) => {
      showMessage.error(error.message || "Failed to publish profile");
    },
  });
}

/**
 * Unpublish worker profile
 */
export function useUnpublishProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => workerAPI.unpublishProfile(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workerKeys.profile() });
      showMessage.success("Profile unpublished");
    },
    onError: (error: Error) => {
      showMessage.error(error.message || "Failed to unpublish profile");
    },
  });
}
