/**
 * Worker Service Layer
 * Handles all worker profile-related business logic and database operations
 */

import { SupabaseClient } from "@supabase/supabase-js";
import {
  WorkerProfile,
  WorkerProfileComplete,
  WorkerImage,
  WorkerService,
  WorkerServicePrice,
  Service,
  ServiceCategory,
  ServiceOption,
  WorkerProfileStep1Request,
  AddWorkerServiceRequest,
  UpdateServicePriceRequest,
  PriceTiers,
  ServiceWithPrice,
} from "./types";
import {
  WorkerProfileStatus,
  Currency,
  HOURS_PER_DAY,
  HOURS_PER_WEEK,
  HOURS_PER_MONTH,
} from "@/lib/utils/enums";

type WorkerServiceRow = WorkerService & {
  service: Service;
  service_option: ServiceOption | null;
  pricing: WorkerServicePrice | null;
};

type PriceFieldKey = Extract<keyof WorkerServicePrice, `price_${string}`>;

// =============================================================================
// CUSTOM ERRORS
// =============================================================================

export class WorkerServiceError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = "WorkerServiceError";
  }
}

// =============================================================================
// SERVICE CLASS
// =============================================================================

export class WorkerProfileService {
  constructor(private supabase: SupabaseClient) {}

  // ===========================================================================
  // SERVICES (PUBLIC - Get available services)
  // ===========================================================================

  /**
   * Get all service categories with services
   */
  async getServiceCategories(): Promise<ServiceCategory[]> {
    const { data, error } = await this.supabase
      .from("service_categories")
      .select("*")
      .eq("is_active", true)
      .order("display_order");

    if (error) {
      throw new WorkerServiceError(
        "Failed to fetch service categories",
        "FETCH_ERROR",
        500
      );
    }

    return data as ServiceCategory[];
  }

  /**
   * Get all services with categories and options
   */
  async getServices(categoryId?: string): Promise<Service[]> {
    let query = this.supabase
      .from("services")
      .select(
        `
        *,
        category:service_categories(*),
        options:service_options(*)
      `
      )
      .eq("is_active", true)
      .order("display_order");

    if (categoryId) {
      query = query.eq("category_id", categoryId);
    }

    const { data, error } = await query;

    if (error) {
      throw new WorkerServiceError(
        "Failed to fetch services",
        "FETCH_ERROR",
        500
      );
    }

    return data as Service[];
  }

  /**
   * Get service by ID with options
   */
  async getServiceById(serviceId: string): Promise<Service> {
    const { data, error } = await this.supabase
      .from("services")
      .select(
        `
        *,
        category:service_categories(*),
        options:service_options(*)
      `
      )
      .eq("id", serviceId)
      .eq("is_active", true)
      .single();

    if (error || !data) {
      throw new WorkerServiceError("Service not found", "NOT_FOUND", 404);
    }

    return data as Service;
  }

  /**
   * Get service options for a service
   */
  async getServiceOptions(serviceId: string): Promise<ServiceOption[]> {
    const { data, error } = await this.supabase
      .from("service_options")
      .select("*")
      .eq("service_id", serviceId)
      .eq("is_active", true)
      .order("display_order");

    if (error) {
      throw new WorkerServiceError(
        "Failed to fetch service options",
        "FETCH_ERROR",
        500
      );
    }

    return data as ServiceOption[];
  }

  // ===========================================================================
  // WORKER PROFILE - CRUD
  // ===========================================================================

  /**
   * Helper: Reset profile status to pending if approved/published
   * This is called when worker makes changes that require re-review
   */
  private async resetProfileStatusIfNeeded(profileId: string): Promise<void> {
    const { data: profile } = await this.supabase
      .from("worker_profiles")
      .select("profile_status")
      .eq("id", profileId)
      .single();

    if (profile) {
      const currentStatus = profile.profile_status;
      if (
        currentStatus === WorkerProfileStatus.APPROVED ||
        currentStatus === WorkerProfileStatus.PUBLISHED
      ) {
        await this.supabase
          .from("worker_profiles")
          .update({ profile_status: WorkerProfileStatus.PENDING })
          .eq("id", profileId);
      }
    }
  }

  /**
   * Create or update worker profile (Step 1)
   */
  async saveWorkerProfile(
    userId: string,
    data: WorkerProfileStep1Request
  ): Promise<WorkerProfile> {
    // Check if profile exists and get current status
    const { data: existingProfile } = await this.supabase
      .from("worker_profiles")
      .select("id, profile_status")
      .eq("user_id", userId)
      .single();

    const profileData: Record<string, unknown> = {
      user_id: userId,
      full_name: data.full_name,
      nickname: data.nickname,
      age: data.age,
      height_cm: data.height_cm,
      weight_kg: data.weight_kg,
      zodiac_sign: data.zodiac_sign,
      lifestyle: data.lifestyle,
      personal_quote: data.personal_quote,
      bio: data.bio,
      profile_completed_steps: 1, // Step 1 completed
    };

    // If profile was approved or published, set status to pending for re-review
    if (existingProfile) {
      const currentStatus = existingProfile.profile_status;
      if (
        currentStatus === WorkerProfileStatus.APPROVED ||
        currentStatus === WorkerProfileStatus.PUBLISHED
      ) {
        profileData.profile_status = WorkerProfileStatus.PENDING;
      }
    }

    if (existingProfile) {
      // Update existing profile
      const { data: updated, error } = await this.supabase
        .from("worker_profiles")
        .update(profileData)
        .eq("user_id", userId)
        .select()
        .single();

      if (error) {
        throw new WorkerServiceError(
          "Failed to update profile",
          "UPDATE_ERROR",
          500
        );
      }

      // Update tags and availabilities
      if (data.tags) {
        await this.updateWorkerTags(updated.id, data.tags);
      }
      if (data.availabilities) {
        await this.updateWorkerAvailabilities(updated.id, data.availabilities);
      }

      return updated as WorkerProfile;
    } else {
      // Create new profile
      const { data: created, error } = await this.supabase
        .from("worker_profiles")
        .insert(profileData)
        .select()
        .single();

      if (error) {
        throw new WorkerServiceError(
          "Failed to create profile",
          "CREATE_ERROR",
          500
        );
      }

      // Add tags and availabilities
      if (data.tags) {
        await this.updateWorkerTags(created.id, data.tags);
      }
      if (data.availabilities) {
        await this.updateWorkerAvailabilities(created.id, data.availabilities);
      }

      return created as WorkerProfile;
    }
  }

  /**
   * Get worker profile by user ID
   */
  async getWorkerProfile(
    userId: string
  ): Promise<WorkerProfileComplete | null> {
    const { data, error } = await this.supabase
      .from("worker_profiles")
      .select(
        `
        *,
        tags:worker_tags(*),
        availabilities:worker_availabilities(*),
        images:worker_images(*),
        services:worker_services(
          *,
          service:services(*),
          service_option:service_options(*),
          pricing:worker_service_prices(*)
        )
      `
      )
      .eq("user_id", userId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null; // Profile not found
      }
      throw new WorkerServiceError(
        "Failed to fetch profile",
        "FETCH_ERROR",
        500
      );
    }

    const profile = data as unknown as WorkerProfileComplete;

    // Separate avatar from gallery
    profile.avatar = profile.images?.find((img) => img.image_type === "avatar");
    profile.gallery_images = profile.images?.filter(
      (img) => img.image_type === "gallery"
    );

    return profile;
  }

  /**
   * Get worker profile by ID (for public viewing)
   */
  async getWorkerProfileById(
    profileId: string
  ): Promise<WorkerProfileComplete | null> {
    const { data, error } = await this.supabase
      .from("worker_profiles")
      .select(
        `
        *,
        tags:worker_tags(*),
        availabilities:worker_availabilities(*),
        images:worker_images(*),
        services:worker_services(
          *,
          service:services(*),
          service_option:service_options(*),
          pricing:worker_service_prices(*)
        )
      `
      )
      .eq("id", profileId)
      .eq("profile_status", WorkerProfileStatus.PUBLISHED)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null;
      }
      throw new WorkerServiceError(
        "Failed to fetch profile",
        "FETCH_ERROR",
        500
      );
    }

    const profile = data as unknown as WorkerProfileComplete;

    // Filter approved images only
    profile.images = profile.images?.filter((img) => img.is_approved) || [];
    profile.avatar = profile.images?.find((img) => img.image_type === "avatar");
    profile.gallery_images = profile.images?.filter(
      (img) => img.image_type === "gallery"
    );

    // Filter active services only
    profile.services = profile.services?.filter((svc) => svc.is_active) || [];

    return profile;
  }

  /**
   * Submit profile for review
   */
  async submitProfileForReview(userId: string): Promise<void> {
    // Check if profile is complete
    const profile = await this.getWorkerProfile(userId);
    if (!profile) {
      throw new WorkerServiceError("Profile not found", "NOT_FOUND", 404);
    }

    // Validate profile completeness
    const hasAvatar = profile.images?.some(
      (img) => img.image_type === "avatar"
    );
    const hasServices = profile.services && profile.services.length > 0;

    if (!hasAvatar) {
      throw new WorkerServiceError(
        "Profile must have an avatar",
        "VALIDATION_ERROR",
        400
      );
    }

    if (!hasServices) {
      throw new WorkerServiceError(
        "Profile must have at least one service",
        "VALIDATION_ERROR",
        400
      );
    }

    // Update status to pending
    const { error } = await this.supabase
      .from("worker_profiles")
      .update({
        profile_status: WorkerProfileStatus.PENDING,
        profile_completed_steps: 3, // Both steps completed
      })
      .eq("user_id", userId);

    if (error) {
      throw new WorkerServiceError(
        "Failed to submit profile",
        "UPDATE_ERROR",
        500
      );
    }
  }

  /**
   * Publish profile (after admin approval)
   */
  async publishProfile(userId: string): Promise<void> {
    const { error } = await this.supabase
      .from("worker_profiles")
      .update({ profile_status: WorkerProfileStatus.PUBLISHED })
      .eq("user_id", userId)
      .eq("profile_status", WorkerProfileStatus.APPROVED);

    if (error) {
      throw new WorkerServiceError(
        "Failed to publish profile",
        "UPDATE_ERROR",
        500
      );
    }
  }

  // ===========================================================================
  // WORKER TAGS
  // ===========================================================================

  private async updateWorkerTags(
    profileId: string,
    tags: Array<{ tag_key: string; tag_value: string; tag_type: string }>
  ): Promise<void> {
    // Delete existing tags
    await this.supabase
      .from("worker_tags")
      .delete()
      .eq("worker_profile_id", profileId);

    // Insert new tags
    if (tags.length > 0) {
      const { error } = await this.supabase.from("worker_tags").insert(
        tags.map((tag) => ({
          worker_profile_id: profileId,
          ...tag,
        }))
      );

      if (error) {
        throw new WorkerServiceError(
          "Failed to update tags",
          "UPDATE_ERROR",
          500
        );
      }
    }
  }

  // ===========================================================================
  // WORKER AVAILABILITIES
  // ===========================================================================

  private async updateWorkerAvailabilities(
    profileId: string,
    availabilities: Array<{
      day_of_week: number;
      availability_type: string;
      start_time?: string;
      end_time?: string;
      notes?: string;
    }>
  ): Promise<void> {
    // Delete existing availabilities
    await this.supabase
      .from("worker_availabilities")
      .delete()
      .eq("worker_profile_id", profileId);

    // Insert new availabilities
    if (availabilities.length > 0) {
      const { error } = await this.supabase
        .from("worker_availabilities")
        .insert(
          availabilities.map((avail) => ({
            worker_profile_id: profileId,
            ...avail,
          }))
        );

      if (error) {
        throw new WorkerServiceError(
          "Failed to update availabilities",
          "UPDATE_ERROR",
          500
        );
      }
    }
  }

  // ===========================================================================
  // WORKER IMAGES
  // ===========================================================================

  /**
   * Add image to worker profile
   */
  async addWorkerImage(
    profileId: string,
    imageData: {
      image_url: string;
      image_type: string;
      file_name?: string;
      file_size_bytes?: number;
      mime_type?: string;
      width_px?: number;
      height_px?: number;
    }
  ): Promise<WorkerImage> {
    // If adding avatar, remove existing avatar
    if (imageData.image_type === "avatar") {
      await this.supabase
        .from("worker_images")
        .delete()
        .eq("worker_profile_id", profileId)
        .eq("image_type", "avatar");
    }

    const { data, error } = await this.supabase
      .from("worker_images")
      .insert({
        worker_profile_id: profileId,
        display_order: 0,
        ...imageData,
      })
      .select()
      .single();

    if (error) {
      throw new WorkerServiceError("Failed to add image", "CREATE_ERROR", 500);
    }

    // Reset profile status to pending if approved/published
    await this.resetProfileStatusIfNeeded(profileId);

    return data as WorkerImage;
  }

  /**
   * Delete worker image
   */
  async deleteWorkerImage(imageId: string, profileId: string): Promise<void> {
    const { error } = await this.supabase
      .from("worker_images")
      .delete()
      .eq("id", imageId);

    if (error) {
      throw new WorkerServiceError(
        "Failed to delete image",
        "DELETE_ERROR",
        500
      );
    }

    // Reset profile status to pending if approved/published
    await this.resetProfileStatusIfNeeded(profileId);
  }

  // ===========================================================================
  // WORKER SERVICES & PRICING
  // ===========================================================================

  /**
   * Add service to worker profile (Step 2)
   */
  async addWorkerService(
    profileId: string,
    serviceData: AddWorkerServiceRequest
  ): Promise<{ service: WorkerService; pricing: WorkerServicePrice }> {
    // Check if service already exists
    const { data: existing } = await this.supabase
      .from("worker_services")
      .select("id")
      .eq("worker_profile_id", profileId)
      .eq("service_id", serviceData.service_id)
      .eq("service_option_id", serviceData.service_option_id || null)
      .single();

    if (existing) {
      throw new WorkerServiceError(
        "Service already added",
        "DUPLICATE_ERROR",
        400
      );
    }

    // Add service
    const { data: service, error: serviceError } = await this.supabase
      .from("worker_services")
      .insert({
        worker_profile_id: profileId,
        service_id: serviceData.service_id,
        service_option_id: serviceData.service_option_id,
        is_active: true,
      })
      .select()
      .single();

    if (serviceError) {
      throw new WorkerServiceError(
        "Failed to add service",
        "CREATE_ERROR",
        500
      );
    }

    // Add pricing
    const priceData = this.buildPriceData(
      service.id,
      serviceData.pricing.hourly_rate,
      serviceData.pricing.primary_currency,
      serviceData.pricing.daily_discount_percent,
      serviceData.pricing.weekly_discount_percent,
      serviceData.pricing.monthly_discount_percent
    );

    const { data: pricing, error: pricingError } = await this.supabase
      .from("worker_service_prices")
      .insert(priceData)
      .select()
      .single();

    if (pricingError) {
      // Rollback service creation
      await this.supabase.from("worker_services").delete().eq("id", service.id);
      throw new WorkerServiceError(
        "Failed to add pricing",
        "CREATE_ERROR",
        500
      );
    }

    // Update profile completed steps
    await this.supabase
      .from("worker_profiles")
      .update({ profile_completed_steps: 3 })
      .eq("id", profileId);

    // Reset profile status to pending if approved/published
    await this.resetProfileStatusIfNeeded(profileId);

    return {
      service: service as WorkerService,
      pricing: pricing as WorkerServicePrice,
    };
  }

  /**
   * Update service pricing
   */
  async updateWorkerServicePrice(
    workerServiceId: string,
    profileId: string,
    priceUpdate: UpdateServicePriceRequest
  ): Promise<WorkerServicePrice> {
    const priceData = this.buildPriceData(
      workerServiceId,
      priceUpdate.hourly_rate,
      priceUpdate.currency || Currency.USD,
      priceUpdate.daily_discount_percent,
      priceUpdate.weekly_discount_percent,
      priceUpdate.monthly_discount_percent
    );

    const { data, error } = await this.supabase
      .from("worker_service_prices")
      .update(priceData)
      .eq("worker_service_id", workerServiceId)
      .select()
      .single();

    if (error) {
      throw new WorkerServiceError(
        "Failed to update pricing",
        "UPDATE_ERROR",
        500
      );
    }

    // Reset profile status to pending if approved/published
    await this.resetProfileStatusIfNeeded(profileId);

    return data as WorkerServicePrice;
  }

  /**
   * Remove service from worker profile
   */
  async removeWorkerService(workerServiceId: string, profileId: string): Promise<void> {
    const { error } = await this.supabase
      .from("worker_services")
      .delete()
      .eq("id", workerServiceId);

    if (error) {
      throw new WorkerServiceError(
        "Failed to remove service",
        "DELETE_ERROR",
        500
      );
    }

    // Reset profile status to pending if approved/published
    await this.resetProfileStatusIfNeeded(profileId);
  }

  /**
   * Get services offered by worker with pricing
   */
  async getWorkerServices(profileId: string): Promise<ServiceWithPrice[]> {
    const { data, error } = await this.supabase
      .from("worker_services")
      .select(
        `
        *,
        service:services(*),
        service_option:service_options(*),
        pricing:worker_service_prices(*)
      `
      )
      .eq("worker_profile_id", profileId)
      .eq("is_active", true);

    if (error) {
      throw new WorkerServiceError(
        "Failed to fetch worker services",
        "FETCH_ERROR",
        500
      );
    }

    const rows = (data ?? []) as WorkerServiceRow[];

    return rows.map((ws) => ({
      ...ws.service,
      worker_service: ws,
      pricing: ws.pricing ?? undefined,
      price_tiers: ws.pricing
        ? this.calculatePriceTiers(ws.pricing)
        : undefined,
    })) as ServiceWithPrice[];
  }

  // ===========================================================================
  // PRICING HELPERS
  // ===========================================================================

  /**
   * Build price data for all currencies from hourly rate
   */
  private buildPriceData(
    workerServiceId: string,
    hourlyRate: number,
    primaryCurrency: Currency,
    dailyDiscount = 0,
    weeklyDiscount = 0,
    monthlyDiscount = 0
  ): Partial<WorkerServicePrice> {
    type PriceData = Partial<WorkerServicePrice> & {
      worker_service_id: string;
    };

    const priceData: PriceData = {
      worker_service_id: workerServiceId,
      primary_currency: primaryCurrency,
      daily_discount_percent: dailyDiscount,
      weekly_discount_percent: weeklyDiscount,
      monthly_discount_percent: monthlyDiscount,
      is_active: true,
    };

    // Set price in primary currency
    const currencyKey =
      `price_${primaryCurrency.toLowerCase()}` as PriceFieldKey;
    priceData[currencyKey] = hourlyRate;

    return priceData;
  }

  /**
   * Calculate price tiers from hourly rate
   */
  calculatePriceTiers(pricing: WorkerServicePrice): PriceTiers {
    // Get hourly rate from primary currency
    const currencyKey =
      `price_${pricing.primary_currency.toLowerCase()}` as keyof WorkerServicePrice;
    const hourlyRate = pricing[currencyKey] as number;

    if (!hourlyRate) {
      throw new WorkerServiceError(
        "No price set for primary currency",
        "VALIDATION_ERROR",
        400
      );
    }

    const daily =
      hourlyRate * HOURS_PER_DAY * (1 - pricing.daily_discount_percent / 100);
    const weekly =
      hourlyRate * HOURS_PER_WEEK * (1 - pricing.weekly_discount_percent / 100);
    const monthly =
      hourlyRate *
      HOURS_PER_MONTH *
      (1 - pricing.monthly_discount_percent / 100);

    return {
      hourly: Math.round(hourlyRate * 100) / 100,
      daily: Math.round(daily * 100) / 100,
      weekly: Math.round(weekly * 100) / 100,
      monthly: Math.round(monthly * 100) / 100,
      currency: pricing.primary_currency,
    };
  }

  /**
   * Get highest price among worker's services
   */
  async getHighestServicePrice(
    profileId: string,
    currency: Currency
  ): Promise<number> {
    const services = await this.getWorkerServices(profileId);

    let maxPrice = 0;
    for (const service of services) {
      if (service.pricing) {
        const currencyKey =
          `price_${currency.toLowerCase()}` as keyof WorkerServicePrice;
        const price = service.pricing[currencyKey] as number;
        if (price && price > maxPrice) {
          maxPrice = price;
        }
      }
    }

    return maxPrice;
  }
}
