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
import { logger } from "@/lib/utils/logger";
import {
  calculateCompletedSteps,
  validateStepState,
  recalculateCompletedSteps,
} from "./data-consistency";

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
   * Uses batch operations for atomic updates
   * Supports optimistic locking with version field
   */
  async saveWorkerProfile(
    userId: string,
    data: WorkerProfileStep1Request,
    expectedVersion?: number
  ): Promise<WorkerProfile> {
    logger.logWorkerProfileOperation("saveWorkerProfile", userId, undefined, {
      hasExpectedVersion: expectedVersion !== undefined,
    });

    // Declare outside try block so it's accessible in catch block
    let existingProfile: {
      id: string;
      profile_status: string;
      profile_completed_steps: number;
      version?: number;
    } | null = null;

    try {
      // Check if profile exists and get current status, completed steps, and version
      const { data: fetchedProfile, error: fetchError } = await this.supabase
        .from("worker_profiles")
        .select("id, profile_status, profile_completed_steps, version")
        .eq("user_id", userId)
        .single();

      // Handle error: if it's "no rows found" (PGRST116), that's fine - profile doesn't exist yet
      // Otherwise, log and rethrow
      if (fetchError) {
        // PGRST116 means no rows found - this is expected for new profiles
        if (fetchError.code === "PGRST116") {
          existingProfile = null;
        } else {
          // Any other error is unexpected - log and throw
          logger.logWorkerProfileError("saveWorkerProfile", fetchError, userId);
          throw new WorkerServiceError(
            `Failed to check existing profile: ${
              fetchError.message || fetchError.code || "Unknown error"
            }`,
            "FETCH_ERROR",
            500
          );
        }
      } else {
        // No error - profile exists
        existingProfile = fetchedProfile;
      }

      // Optimistic locking check
      if (existingProfile && expectedVersion !== undefined) {
        const currentVersion = existingProfile.version || 1;
        if (currentVersion !== expectedVersion) {
          logger.warn("Optimistic lock conflict detected", {
            userId,
            profileId: existingProfile.id,
            expectedVersion,
            currentVersion,
          });
          throw new WorkerServiceError(
            "Profile was modified by another operation. Please refresh and try again.",
            "CONCURRENT_UPDATE_ERROR",
            409
          );
        }
      }

      // Calculate completed steps: preserve step 2 completion if updating step 1
      // Use recalculate function to ensure consistency
      let completedSteps = 1; // Step 1 is being completed
      if (existingProfile) {
        // If step 2 was already completed (bit 2 set), preserve it
        // Bitmask: 1 = step1, 2 = step2, 3 = both (1 | 2)
        if (existingProfile.profile_completed_steps >= 2) {
          completedSteps = 3; // Both steps completed
        }
      }

      // After update, recalculate to ensure consistency
      // This will be done after the profile is saved

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
        profile_completed_steps: completedSteps,
        // Ensure profile_status is set (default is 'draft' but explicit is better)
        profile_status:
          existingProfile?.profile_status || WorkerProfileStatus.DRAFT,
      };

      // Increment version for optimistic locking
      if (existingProfile) {
        const currentVersion = existingProfile.version || 1;
        profileData.version = currentVersion + 1;
      } else {
        profileData.version = 1;
      }

      // If profile was approved or published, set status to pending for re-review
      if (existingProfile) {
        const currentStatus = existingProfile.profile_status;
        if (
          currentStatus === WorkerProfileStatus.APPROVED ||
          currentStatus === WorkerProfileStatus.PUBLISHED
        ) {
          profileData.profile_status = WorkerProfileStatus.PENDING;
          logger.info("Profile status reset to pending for re-review", {
            userId,
            profileId: existingProfile.id,
            previousStatus: currentStatus,
          });
        }
      }

      // Use batch operations for atomic updates
      const profileId = existingProfile?.id;

      let profile: WorkerProfile;

      if (existingProfile) {
        // Update existing profile with version check
        const { data: updated, error } = await this.supabase
          .from("worker_profiles")
          .update(profileData)
          .eq("user_id", userId)
          .eq("version", existingProfile.version || 1) // Optimistic lock check
          .select()
          .single();

        if (error) {
          // Check if it's a version conflict (no rows updated)
          if (error.code === "PGRST116" || error.message.includes("0 rows")) {
            logger.warn("Optimistic lock conflict - no rows updated", {
              userId,
              profileId: existingProfile.id,
            });
            throw new WorkerServiceError(
              "Profile was modified by another operation. Please refresh and try again.",
              "CONCURRENT_UPDATE_ERROR",
              409
            );
          }
          logger.logWorkerProfileError(
            "saveWorkerProfile",
            error,
            userId,
            existingProfile.id
          );
          throw new WorkerServiceError(
            "Failed to update profile",
            "UPDATE_ERROR",
            500
          );
        }

        profile = updated as WorkerProfile;
        logger.info("Profile updated successfully", {
          userId,
          profileId: profile.id,
          version: profile.version,
        });

        // Update tags and availabilities in batch
        const updatePromises: Promise<void>[] = [];
        if (data.tags) {
          updatePromises.push(this.updateWorkerTags(profile.id, data.tags));
        }
        if (data.availabilities) {
          updatePromises.push(
            this.updateWorkerAvailabilities(profile.id, data.availabilities)
          );
        }

        // Execute all updates
        await Promise.all(updatePromises);
        logger.debug("Tags and availabilities updated", {
          userId,
          profileId: profile.id,
        });
      } else {
        // Create new profile
        // Ensure required fields are present
        if (!data.full_name || !data.age) {
          throw new WorkerServiceError(
            "Full name and age are required",
            "VALIDATION_ERROR",
            400
          );
        }

        const { data: created, error } = await this.supabase
          .from("worker_profiles")
          .insert(profileData)
          .select()
          .single();

        if (error) {
          logger.logWorkerProfileError("saveWorkerProfile", error, userId);
          // Include detailed error message for debugging
          const errorMessage = error.message || error.code || "Unknown error";
          const errorDetails = error.details || "";
          logger.error("Failed to create worker profile", {
            userId,
            error: errorMessage,
            details: errorDetails,
            code: error.code,
            profileData: {
              ...profileData,
              // Don't log sensitive data, just structure
              full_name: profileData.full_name ? "[REDACTED]" : undefined,
            },
          });
          throw new WorkerServiceError(
            `Failed to create profile: ${errorMessage}${
              errorDetails ? ` (${errorDetails})` : ""
            }`,
            "CREATE_ERROR",
            500
          );
        }

        profile = created as WorkerProfile;
        logger.info("Profile created successfully", {
          userId,
          profileId: profile.id,
          version: profile.version,
        });

        // Add tags and availabilities in batch
        const insertPromises: Promise<void>[] = [];
        if (data.tags) {
          insertPromises.push(this.updateWorkerTags(profile.id, data.tags));
        }
        if (data.availabilities) {
          insertPromises.push(
            this.updateWorkerAvailabilities(profile.id, data.availabilities)
          );
        }

        // Execute all inserts
        await Promise.all(insertPromises);
        logger.debug("Tags and availabilities created", {
          userId,
          profileId: profile.id,
        });
      }

      return profile;
    } catch (error) {
      // If any operation fails, throw error (partial updates are prevented)
      if (error instanceof WorkerServiceError) {
        logger.logWorkerProfileError(
          "saveWorkerProfile",
          error,
          userId,
          existingProfile?.id
        );
        throw error;
      }
      logger.logWorkerProfileError(
        "saveWorkerProfile",
        error,
        userId,
        existingProfile?.id
      );
      throw new WorkerServiceError("Failed to save profile", "SAVE_ERROR", 500);
    }
  }

  /**
   * Get worker profile by user ID
   * Automatically validates and fixes step state inconsistencies
   */
  async getWorkerProfile(
    userId: string,
    autoFixInconsistencies: boolean = true
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

    // Validate step state consistency
    const inconsistencies = validateStepState(profile);
    if (inconsistencies.length > 0) {
      logger.warn("Profile step state inconsistencies detected", {
        userId,
        profileId: profile.id,
        inconsistencies,
      });

      // Auto-fix if enabled
      if (autoFixInconsistencies) {
        try {
          await recalculateCompletedSteps(this.supabase, profile.id);
          // Reload profile to get updated steps
          const { data: updatedData } = await this.supabase
            .from("worker_profiles")
            .select("profile_completed_steps")
            .eq("id", profile.id)
            .single();

          if (updatedData) {
            profile.profile_completed_steps =
              updatedData.profile_completed_steps;
          }
        } catch (fixError) {
          logger.error("Failed to auto-fix step inconsistencies", {
            userId,
            profileId: profile.id,
            error: fixError,
          });
        }
      }
    }

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

    // -------------------------------------------------------------------------
    // TÍNH TOÁN CÁC NGÀY ĐÃ ĐƯỢC BOOK (ĐÃ XÁC NHẬN) CHO WORKER
    // -------------------------------------------------------------------------
    // bookings.worker_id = user_profiles.id (user id), trong khi profile.id là worker_profiles.id
    // nên ở đây dùng profile.user_id để truy vấn.
    const { data: bookings } = await this.supabase
      .from("bookings")
      .select("start_date, end_date, status")
      .eq("worker_id", profile.user_id)
      .in("status", [
        "worker_confirmed",
        "in_progress",
        "worker_completed",
        "client_completed",
      ]);

    if (bookings && bookings.length > 0) {
      const bookedDatesSet = new Set<string>();

      for (const booking of bookings as {
        start_date: string;
        end_date?: string | null;
      }[]) {
        const start = new Date(booking.start_date);
        const end = booking.end_date ? new Date(booking.end_date) : start;

        // Chuẩn hóa: bỏ phần time, chỉ giữ ngày
        start.setHours(0, 0, 0, 0);
        end.setHours(0, 0, 0, 0);

        // Lặp từng ngày từ start -> end (bao gồm cả end)
        for (
          let d = new Date(start.getTime());
          d.getTime() <= end.getTime();
          d.setDate(d.getDate() + 1)
        ) {
          const year = d.getFullYear();
          const month = (d.getMonth() + 1).toString().padStart(2, "0");
          const day = d.getDate().toString().padStart(2, "0");
          bookedDatesSet.add(`${year}-${month}-${day}`);
        }
      }

      profile.booked_dates = Array.from(bookedDatesSet);
    }

    return profile;
  }

  /**
   * Submit profile for review
   */
  async submitProfileForReview(userId: string): Promise<void> {
    logger.logWorkerProfileOperation("submitProfileForReview", userId);

    try {
      // Check if profile is complete
      const profile = await this.getWorkerProfile(userId);
      if (!profile) {
        logger.warn("Profile not found for submission", { userId });
        throw new WorkerServiceError("Profile not found", "NOT_FOUND", 404);
      }

      // Validate profile completeness
      const hasAvatar = profile.images?.some(
        (img) => img.image_type === "avatar"
      );
      const hasServices = profile.services && profile.services.length > 0;

      if (!hasAvatar) {
        logger.warn("Profile submission failed: no avatar", {
          userId,
          profileId: profile.id,
        });
        throw new WorkerServiceError(
          "Profile must have an avatar",
          "VALIDATION_ERROR",
          400
        );
      }

      if (!hasServices) {
        logger.warn("Profile submission failed: no services", {
          userId,
          profileId: profile.id,
        });
        throw new WorkerServiceError(
          "Profile must have at least one service",
          "VALIDATION_ERROR",
          400
        );
      }

      // Update status to pending with version increment
      const currentVersion = profile.version || 1;
      const { error } = await this.supabase
        .from("worker_profiles")
        .update({
          profile_status: WorkerProfileStatus.PENDING,
          profile_completed_steps: 3, // Both steps completed
          version: currentVersion + 1,
        })
        .eq("user_id", userId)
        .eq("version", currentVersion); // Optimistic lock check

      if (error) {
        logger.logWorkerProfileError(
          "submitProfileForReview",
          error,
          userId,
          profile.id
        );
        throw new WorkerServiceError(
          "Failed to submit profile",
          "UPDATE_ERROR",
          500
        );
      }

      logger.info("Profile submitted for review successfully", {
        userId,
        profileId: profile.id,
        version: currentVersion + 1,
      });
    } catch (error) {
      if (error instanceof WorkerServiceError) {
        throw error;
      }
      logger.logWorkerProfileError("submitProfileForReview", error, userId);
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
   * Validates image data before insertion
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
    logger.logWorkerProfileOperation("addWorkerImage", "", profileId, {
      imageType: imageData.image_type,
    });

    try {
      // Validate image URL format
      if (!imageData.image_url || typeof imageData.image_url !== "string") {
        logger.warn("Image validation failed: URL required", {
          profileId,
          imageType: imageData.image_type,
        });
        throw new WorkerServiceError(
          "Image URL is required",
          "VALIDATION_ERROR",
          400
        );
      }

      try {
        new URL(imageData.image_url);
      } catch {
        throw new WorkerServiceError(
          "Invalid image URL format",
          "VALIDATION_ERROR",
          400
        );
      }

      // Validate file size if provided
      if (imageData.file_size_bytes !== undefined) {
        const MAX_SIZE = 5 * 1024 * 1024; // 5MB
        if (imageData.file_size_bytes > MAX_SIZE) {
          throw new WorkerServiceError(
            "Image file size exceeds maximum allowed (5MB)",
            "VALIDATION_ERROR",
            400
          );
        }
        if (imageData.file_size_bytes < 0) {
          throw new WorkerServiceError(
            "Invalid file size",
            "VALIDATION_ERROR",
            400
          );
        }
      }

      // Validate MIME type if provided
      if (imageData.mime_type !== undefined) {
        const VALID_TYPES = [
          "image/jpeg",
          "image/jpg",
          "image/png",
          "image/webp",
          "image/gif",
        ];
        if (!VALID_TYPES.includes(imageData.mime_type)) {
          throw new WorkerServiceError(
            `Invalid image type. Allowed types: ${VALID_TYPES.join(", ")}`,
            "VALIDATION_ERROR",
            400
          );
        }
      }

      // Validate dimensions if provided
      if (imageData.width_px !== undefined) {
        if (!Number.isInteger(imageData.width_px) || imageData.width_px < 1) {
          throw new WorkerServiceError(
            "Invalid image width",
            "VALIDATION_ERROR",
            400
          );
        }
      }

      if (imageData.height_px !== undefined) {
        if (!Number.isInteger(imageData.height_px) || imageData.height_px < 1) {
          throw new WorkerServiceError(
            "Invalid image height",
            "VALIDATION_ERROR",
            400
          );
        }
      }

      // If adding avatar, remove existing avatar
      if (imageData.image_type === "avatar") {
        await this.supabase
          .from("worker_images")
          .delete()
          .eq("worker_profile_id", profileId)
          .eq("image_type", "avatar");
        logger.debug("Removed existing avatar", { profileId });
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
        logger.logWorkerProfileError(
          "addWorkerImage",
          error,
          undefined,
          profileId
        );
        throw new WorkerServiceError(
          "Failed to add image",
          "CREATE_ERROR",
          500
        );
      }

      // Reset profile status to pending if approved/published
      await this.resetProfileStatusIfNeeded(profileId);

      logger.info("Image added successfully", {
        profileId,
        imageId: data.id,
        imageType: imageData.image_type,
      });

      return data as WorkerImage;
    } catch (error) {
      if (error instanceof WorkerServiceError) {
        throw error;
      }
      logger.logWorkerProfileError(
        "addWorkerImage",
        error,
        undefined,
        profileId
      );
      throw new WorkerServiceError("Failed to add image", "CREATE_ERROR", 500);
    }
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

    // Note: Don't update completed_steps here - it should only be updated when:
    // - Step 1 is completed (in saveWorkerProfile)
    // - Step 2 is completed (when submitting for review)
    // This prevents overwriting step completion status when just adding a service

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
  async removeWorkerService(
    workerServiceId: string,
    profileId: string
  ): Promise<void> {
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
