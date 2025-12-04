/**
 * Worker Profile System Types
 *
 * This file contains all TypeScript types for the worker profile system,
 * including services, worker profiles, images, availabilities, and pricing.
 */

import {
  WorkerProfileStatus,
  AvailabilityType,
  WorkerImageType,
  TagType,
  Currency,
  DayOfWeek,
} from "@/lib/utils/enums";

// =============================================================================
// SERVICE SYSTEM TYPES
// =============================================================================

/**
 * Service Category
 */
export interface ServiceCategory {
  id: string;
  name_key: string; // i18n key (e.g., 'CATEGORY_HOMECARE')
  slug: string;
  description?: string;
  icon?: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Service
 */
export interface Service {
  id: string;
  category_id: string;
  name_key: string; // i18n key (e.g., 'SERVICE_HOMECARE_COOKING')
  slug: string;
  description?: string;
  icon?: string;
  has_options: boolean; // Whether service has additional options
  parent_service_id?: string;
  display_order: number;
  is_active: boolean;
  requires_certification: boolean;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;

  // Populated fields (from joins)
  category?: ServiceCategory;
  options?: ServiceOption[];
}

/**
 * Service Option (e.g., cooking cuisine, language pair)
 */
export interface ServiceOption {
  id: string;
  service_id: string;
  option_key: string; // i18n key (e.g., 'COOKING_VIETNAMESE')
  option_type: string; // e.g., 'cuisine', 'language_pair', 'haircare_type'
  option_value: string; // e.g., 'vietnamese', 'EN_TO_JA'
  display_order: number;
  is_active: boolean;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;

  // Populated fields
  service?: Service;
}

// =============================================================================
// WORKER PROFILE TYPES
// =============================================================================

/**
 * Worker Profile (extended user information)
 */
export interface WorkerProfile {
  id: string;
  user_id: string;

  // Basic information (Step 1)
  full_name: string;
  nickname?: string;
  age: number;
  height_cm?: number;
  weight_kg?: number;
  zodiac_sign?: string;
  lifestyle?: string; // i18n key
  personal_quote?: string;
  bio?: string;

  // Profile status
  profile_status: WorkerProfileStatus;
  profile_completed_steps: number; // Bitmask (1=step1, 2=step2, 3=both)

  // Admin review
  reviewed_by?: string;
  reviewed_at?: string;
  rejection_reason?: string;

  // Metadata
  metadata?: Record<string, unknown>;

  created_at: string;
  updated_at: string;

  // Populated fields (from joins)
  tags?: WorkerTag[];
  availabilities?: WorkerAvailability[];
  images?: WorkerImage[];
  services?: WorkerService[];
}

/**
 * Worker Tag (interests, hobbies, skills)
 */
export interface WorkerTag {
  id: string;
  worker_profile_id: string;
  tag_key: string; // Tag identifier
  tag_value: string; // Display value
  tag_type: TagType;
  created_at: string;
}

/**
 * Worker Availability (weekly schedule)
 */
export interface WorkerAvailability {
  id: string;
  worker_profile_id: string;
  day_of_week: DayOfWeek;
  availability_type: AvailabilityType;
  start_time?: string; // HH:MM:SS format
  end_time?: string; // HH:MM:SS format
  notes?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Worker Image (avatar and gallery)
 */
export interface WorkerImage {
  id: string;
  worker_profile_id: string;
  image_url: string;
  image_type: WorkerImageType;
  display_order: number;

  // Image metadata
  file_name?: string;
  file_size_bytes?: number;
  mime_type?: string;
  width_px?: number;
  height_px?: number;

  // Admin approval
  is_approved: boolean;
  approved_by?: string;
  approved_at?: string;

  created_at: string;
  updated_at: string;
}

/**
 * Worker Service (many-to-many with services)
 */
export interface WorkerService {
  id: string;
  worker_profile_id: string;
  service_id: string;
  service_option_id?: string; // If service has options
  is_active: boolean;
  is_featured: boolean;
  created_at: string;
  updated_at: string;

  // Populated fields
  service?: Service;
  service_option?: ServiceOption;
  pricing?: WorkerServicePrice;
}

/**
 * Worker Service Price (multi-currency pricing)
 */
export interface WorkerServicePrice {
  id: string;
  worker_service_id: string;

  // Hourly prices in different currencies
  price_usd?: number;
  price_vnd?: number;
  price_jpy?: number;
  price_krw?: number;
  price_cny?: number;

  primary_currency: Currency;

  // Discounts for long-term bookings
  daily_discount_percent: number;
  weekly_discount_percent: number;
  monthly_discount_percent: number;

  is_active: boolean;
  notes?: string;
  metadata?: Record<string, unknown>;

  created_at: string;
  updated_at: string;
}

// =============================================================================
// CALCULATED TYPES
// =============================================================================

/**
 * Price tiers calculated from hourly rate
 */
export interface PriceTiers {
  hourly: number;
  daily: number;
  weekly: number;
  monthly: number;
  currency: Currency;
}

/**
 * Complete service with pricing
 */
export interface ServiceWithPrice extends Service {
  worker_service?: WorkerService;
  pricing?: WorkerServicePrice;
  price_tiers?: PriceTiers;
}

/**
 * Worker profile with all related data
 */
export interface WorkerProfileComplete extends WorkerProfile {
  tags: WorkerTag[];
  availabilities: WorkerAvailability[];
  images: WorkerImage[];
  services: WorkerService[];
  avatar?: WorkerImage;
  gallery_images?: WorkerImage[];
  /**
   * Ngày đã được worker xác nhận booking (dùng cho lịch public).
   * Format: 'YYYY-MM-DD'.
   */
  booked_dates?: string[];
}

// =============================================================================
// API REQUEST/RESPONSE TYPES
// =============================================================================

/**
 * Create/Update Worker Profile Request (Step 1)
 */
export interface WorkerProfileStep1Request {
  full_name: string;
  nickname?: string;
  age: number;
  height_cm?: number;
  weight_kg?: number;
  zodiac_sign?: string;
  lifestyle?: string;
  personal_quote?: string;
  bio?: string;
  tags?: Array<{
    tag_key: string;
    tag_value: string;
    tag_type: TagType;
  }>;
  availabilities?: Array<{
    day_of_week: DayOfWeek;
    availability_type: AvailabilityType;
    start_time?: string;
    end_time?: string;
    notes?: string;
  }>;
}

/**
 * Add Service Request (Step 2)
 */
export interface AddWorkerServiceRequest {
  service_id: string;
  service_option_id?: string;
  pricing: {
    hourly_rate: number;
    primary_currency: Currency;
    daily_discount_percent?: number;
    weekly_discount_percent?: number;
    monthly_discount_percent?: number;
  };
}

/**
 * Update Service Price Request
 */
export interface UpdateServicePriceRequest {
  hourly_rate: number;
  currency?: Currency;
  daily_discount_percent?: number;
  weekly_discount_percent?: number;
  monthly_discount_percent?: number;
}

/**
 * Upload Image Request
 */
export interface UploadImageRequest {
  image_url: string;
  file_path: string;
  image_type: WorkerImageType;
  file_name?: string;
  file_size_bytes?: number;
  mime_type?: string;
  width_px?: number;
  height_px?: number;
}

/**
 * Set Availability Request
 */
export interface SetAvailabilityRequest {
  availabilities: Array<{
    id?: string; // For updates
    day_of_week: DayOfWeek;
    availability_type: AvailabilityType;
    start_time?: string;
    end_time?: string;
    notes?: string;
  }>;
}

/**
 * Generic API Response
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Paginated Response
 */
export interface PaginatedResponse<T = unknown> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

// =============================================================================
// FORM TYPES
// =============================================================================

/**
 * Step 1 Form Values
 */
export interface Step1FormValues {
  full_name: string;
  nickname?: string;
  age: number;
  height_cm?: number;
  weight_kg?: number;
  zodiac_sign?: string;
  lifestyle?: string;
  personal_quote?: string;
  bio?: string;
  tags: string[]; // Tag keys
  availabilities: {
    [key in DayOfWeek]?: {
      type: AvailabilityType;
      start_time?: string;
      end_time?: string;
      notes?: string;
    };
  };
}

/**
 * Step 2 Form Values
 */
export interface Step2FormValues {
  avatar?: string;
  gallery_images: string[];
  services: Array<{
    service_id: string;
    service_option_id?: string;
    hourly_rate: number;
    primary_currency: Currency;
    daily_discount?: number;
    weekly_discount?: number;
    monthly_discount?: number;
  }>;
}

// =============================================================================
// HELPER TYPES
// =============================================================================

/**
 * Service with category and options (for display)
 */
export interface ServiceWithDetails extends Service {
  category: ServiceCategory;
  options: ServiceOption[];
}

/**
 * Worker search/filter params
 */
export interface WorkerSearchParams {
  service_ids?: string[];
  min_price?: number;
  max_price?: number;
  currency?: Currency;
  availability_day?: DayOfWeek;
  search?: string; // Search by name/bio
  page?: number;
  limit?: number;
}

/**
 * Price calculation result
 */
export interface PriceCalculation {
  selected_services: string[];
  charged_service: string;
  charged_service_price: {
    hourly: number;
    currency: Currency;
  };
  tier: "hourly" | "daily" | "weekly" | "monthly";
  hours: number;
  discount: number;
  subtotal: number;
  platform_fee: number;
  insurance_fee: number;
  total: number;
  currency: Currency;
}
