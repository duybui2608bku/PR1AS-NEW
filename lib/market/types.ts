/**
 * Market Types
 */

export interface WorkerMarketProfile {
  id: string;
  full_name: string;
  nickname: string | null;
  age: number;
  bio: string | null;
  profile_status: string;
  created_at: string;
  avatar?: {
    image_url: string;
  };
  services: WorkerServiceInfo[];
  min_price?: number;
  max_price?: number;
}

export interface WorkerServiceInfo {
  id: string;
  service_id: string;
  service: {
    id: string;
    name_key: string;
    slug: string;
  };
  service_option: {
    id: string;
    option_key: string;
    option_value: string;
  } | null;
  pricing: {
    price_usd: number;
    primary_currency: string;
    daily_discount_percent: number;
    weekly_discount_percent: number;
    monthly_discount_percent: number;
  } | null;
}

export interface WorkerFilters {
  age_min?: number;
  age_max?: number;
  service_id?: string;
  category_id?: string;
  price_min?: number;
  price_max?: number;
  search?: string;
  page?: number;
  limit?: number;
}

export interface WorkersResponse {
  workers: WorkerMarketProfile[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
  filters: WorkerFilters;
}
