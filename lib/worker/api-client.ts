/**
 * Worker API Client
 * Client-side API wrapper for worker profile operations
 */

import {
  Service,
  ServiceCategory,
  WorkerProfile,
  WorkerProfileComplete,
  WorkerProfileStep1Request,
  AddWorkerServiceRequest,
  UpdateServicePriceRequest,
  UploadImageRequest,
  ServiceWithPrice,
  WorkerImage,
  WorkerService,
  WorkerServicePrice,
  SetAvailabilityRequest,
} from "./types";
import { axiosClient } from "@/lib/http/axios-client";

// =============================================================================
// SERVICES API (PUBLIC)
// =============================================================================

export const servicesAPI = {
  /**
   * Get all service categories
   */
  async getCategories(): Promise<ServiceCategory[]> {
    const { data } = await axiosClient.get<{ data: ServiceCategory[] }>(
      "/services/categories"
    );
    return data.data;
  },

  /**
   * Get all services (optionally filtered by category)
   */
  async getServices(categoryId?: string): Promise<Service[]> {
    const url = categoryId
      ? `/services?category_id=${categoryId}`
      : "/services";

    const { data } = await axiosClient.get<{ data: Service[] }>(url);
    return data.data;
  },

  /**
   * Get service by ID
   */
  async getServiceById(serviceId: string): Promise<Service> {
    const { data } = await axiosClient.get<{ data: Service }>(
      `/services/${serviceId}`
    );
    return data.data;
  },
};

// =============================================================================
// WORKER PROFILE API
// =============================================================================

export const workerProfileAPI = {
  /**
   * Get worker's own profile
   */
  async getProfile(): Promise<WorkerProfileComplete> {
    const { data } = await axiosClient.get<{ data: WorkerProfileComplete }>(
      "/worker/profile"
    );
    return data.data;
  },

  /**
   * Create or update worker profile (Step 1)
   */
  async saveProfile(
    profileData: WorkerProfileStep1Request
  ): Promise<WorkerProfile> {
    const { data } = await axiosClient.post<{ data: WorkerProfile }>(
      "/worker/profile",
      profileData
    );
    return data.data;
  },

  /**
   * Submit profile for review
   */
  async submitForReview(): Promise<void> {
    await axiosClient.patch("/worker/profile/submit");
  },

  /**
   * Publish profile
   */
  async publish(): Promise<void> {
    await axiosClient.patch("/worker/profile/publish");
  },
};

// =============================================================================
// WORKER SERVICES API
// =============================================================================

export const workerServicesAPI = {
  /**
   * Get worker's services with pricing
   */
  async getServices(): Promise<ServiceWithPrice[]> {
    const { data } = await axiosClient.get<{ data: ServiceWithPrice[] }>(
      "/worker/services"
    );
    return data.data;
  },

  /**
   * Add service to worker profile (Step 2)
   */
  async addService(
    serviceData: AddWorkerServiceRequest
  ): Promise<{ service: WorkerService; pricing: WorkerServicePrice }> {
    const { data } = await axiosClient.post<{
      data: { service: WorkerService; pricing: WorkerServicePrice };
    }>("/worker/services", serviceData);
    return data.data;
  },

  /**
   * Update service pricing
   */
  async updatePrice(
    workerServiceId: string,
    priceData: UpdateServicePriceRequest
  ): Promise<WorkerServicePrice> {
    const { data } = await axiosClient.patch<{ data: WorkerServicePrice }>(
      `/worker/services/${workerServiceId}/price`,
      priceData
    );
    return data.data;
  },

  /**
   * Remove service from worker profile
   */
  async removeService(workerServiceId: string): Promise<void> {
    await axiosClient.delete(`/worker/services/${workerServiceId}`);
  },
};

// =============================================================================
// WORKER IMAGES API
// =============================================================================

export const workerImagesAPI = {
  /**
   * Add image to worker profile
   */
  async addImage(imageData: UploadImageRequest): Promise<WorkerImage> {
    const { data } = await axiosClient.post<{ data: WorkerImage }>(
      "/worker/images",
      imageData
    );
    return data.data;
  },

  /**
   * Delete image
   */
  async deleteImage(imageId: string): Promise<void> {
    await axiosClient.delete(`/worker/images/${imageId}`);
  },
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Calculate price tiers from hourly rate
 */
export function calculatePriceTiers(
  hourlyRate: number,
  dailyDiscount = 0,
  weeklyDiscount = 0,
  monthlyDiscount = 0
) {
  const daily = hourlyRate * 8 * (1 - dailyDiscount / 100);
  const weekly = hourlyRate * 56 * (1 - weeklyDiscount / 100);
  const monthly = hourlyRate * 160 * (1 - monthlyDiscount / 100);

  return {
    hourly: Math.round(hourlyRate * 100) / 100,
    daily: Math.round(daily * 100) / 100,
    weekly: Math.round(weekly * 100) / 100,
    monthly: Math.round(monthly * 100) / 100,
  };
}

/**
 * Format currency
 */
export function formatCurrency(amount: number, currency: string): string {
  const formatters: Record<string, Intl.NumberFormat> = {
    USD: new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }),
    VND: new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }),
    JPY: new Intl.NumberFormat("ja-JP", { style: "currency", currency: "JPY" }),
    KRW: new Intl.NumberFormat("ko-KR", { style: "currency", currency: "KRW" }),
    CNY: new Intl.NumberFormat("zh-CN", { style: "currency", currency: "CNY" }),
  };

  return formatters[currency]?.format(amount) || `${amount} ${currency}`;
}

// =============================================================================
// COMBINED WORKER API (for convenience)
// =============================================================================

/**
 * Combined Worker API
 * Provides a unified interface for all worker-related operations
 */
export const workerAPI = {
  // Profile operations
  async getProfile(): Promise<WorkerProfileComplete> {
    return workerProfileAPI.getProfile();
  },

  async getPublicProfile(workerId: string): Promise<WorkerProfileComplete> {
    const { data } = await axiosClient.get<{ data: WorkerProfileComplete }>(
      `/workers/${workerId}`
    );
    return data.data;
  },

  async updateProfile(
    update: WorkerProfileStep1Request
  ): Promise<WorkerProfileComplete> {
    const { data } = await axiosClient.patch<{ data: WorkerProfileComplete }>(
      "/worker/profile",
      update
    );
    return data.data;
  },

  async publishProfile(): Promise<void> {
    return workerProfileAPI.publish();
  },

  async unpublishProfile(): Promise<void> {
    await axiosClient.patch("/worker/profile/unpublish");
  },

  // Service operations
  async getServiceCategories(): Promise<ServiceCategory[]> {
    return servicesAPI.getCategories();
  },

  async updateServicePricing(
    serviceId: string,
    pricing: UpdateServicePriceRequest
  ): Promise<WorkerServicePrice> {
    return workerServicesAPI.updatePrice(serviceId, pricing);
  },

  // Availability operations
  async updateAvailability(
    availability: SetAvailabilityRequest
  ): Promise<void> {
    await axiosClient.patch("/worker/availability", availability);
  },
};