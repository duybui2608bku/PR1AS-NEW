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
  ApiResponse,
  ServiceWithPrice,
  WorkerImage,
  WorkerService,
  WorkerServicePrice,
} from './types';

// =============================================================================
// SERVICES API (PUBLIC)
// =============================================================================

export const servicesAPI = {
  /**
   * Get all service categories
   */
  async getCategories(): Promise<ServiceCategory[]> {
    const response = await fetch('/api/services/categories', {
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch categories');
    }

    const data = await response.json();
    return data.data;
  },

  /**
   * Get all services (optionally filtered by category)
   */
  async getServices(categoryId?: string): Promise<Service[]> {
    const url = categoryId
      ? `/api/services?category_id=${categoryId}`
      : '/api/services';

    const response = await fetch(url, {
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch services');
    }

    const data = await response.json();
    return data.data;
  },

  /**
   * Get service by ID
   */
  async getServiceById(serviceId: string): Promise<Service> {
    const response = await fetch(`/api/services/${serviceId}`, {
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch service');
    }

    const data = await response.json();
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
    const response = await fetch('/api/worker/profile', {
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch profile');
    }

    const data = await response.json();
    return data.data;
  },

  /**
   * Create or update worker profile (Step 1)
   */
  async saveProfile(profileData: WorkerProfileStep1Request): Promise<WorkerProfile> {
    const response = await fetch('/api/worker/profile', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(profileData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to save profile');
    }

    const data = await response.json();
    return data.data;
  },

  /**
   * Submit profile for review
   */
  async submitForReview(): Promise<void> {
    const response = await fetch('/api/worker/profile/submit', {
      method: 'PATCH',
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to submit profile');
    }
  },

  /**
   * Publish profile
   */
  async publish(): Promise<void> {
    const response = await fetch('/api/worker/profile/publish', {
      method: 'PATCH',
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to publish profile');
    }
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
    const response = await fetch('/api/worker/services', {
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch services');
    }

    const data = await response.json();
    return data.data;
  },

  /**
   * Add service to worker profile (Step 2)
   */
  async addService(
    serviceData: AddWorkerServiceRequest
  ): Promise<{ service: WorkerService; pricing: WorkerServicePrice }> {
    const response = await fetch('/api/worker/services', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(serviceData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to add service');
    }

    const data = await response.json();
    return data.data;
  },

  /**
   * Update service pricing
   */
  async updatePrice(
    workerServiceId: string,
    priceData: UpdateServicePriceRequest
  ): Promise<WorkerServicePrice> {
    const response = await fetch(`/api/worker/services/${workerServiceId}/price`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(priceData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update price');
    }

    const data = await response.json();
    return data.data;
  },

  /**
   * Remove service from worker profile
   */
  async removeService(workerServiceId: string): Promise<void> {
    const response = await fetch(`/api/worker/services/${workerServiceId}`, {
      method: 'DELETE',
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to remove service');
    }
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
    const response = await fetch('/api/worker/images', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(imageData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to add image');
    }

    const data = await response.json();
    return data.data;
  },

  /**
   * Delete image
   */
  async deleteImage(imageId: string): Promise<void> {
    const response = await fetch(`/api/worker/images/${imageId}`, {
      method: 'DELETE',
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete image');
    }
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
    USD: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }),
    VND: new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }),
    JPY: new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }),
    KRW: new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }),
    CNY: new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY' }),
  };

  return formatters[currency]?.format(amount) || `${amount} ${currency}`;
}
