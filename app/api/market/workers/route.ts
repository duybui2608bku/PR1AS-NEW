/**
 * Market Workers API
 * Public endpoint to fetch published worker profiles with filtering
 */

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { WorkerProfileStatus, BoostType, BoostStatus } from "@/lib/utils/enums";

interface WorkerFilters {
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

interface WorkerMarketProfile {
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
  services: Array<{
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
  }>;
  min_price?: number;
  max_price?: number;
  has_recommendation_boost?: boolean;
  has_profile_boost?: boolean;
  boost_priority?: number; // Higher = better (2 = both boosts, 1 = one boost, 0 = no boost)
}

/**
 * GET /api/market/workers
 * Fetch published workers with filters
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    const { searchParams } = new URL(request.url);

    // Get workers with active boosts (for prioritization)
    const { data: boostedWorkers } = await supabase
      .from("worker_boosts")
      .select("user_id, boost_type")
      .eq("status", BoostStatus.ACTIVE)
      .gt("expires_at", new Date().toISOString());

    // Create map of boosted workers
    const boostMap = new Map<
      string,
      { hasRecommendation: boolean; hasProfile: boolean }
    >();
    boostedWorkers?.forEach((boost) => {
      const existing = boostMap.get(boost.user_id) || {
        hasRecommendation: false,
        hasProfile: false,
      };
      if (boost.boost_type === BoostType.RECOMMENDATION) {
        existing.hasRecommendation = true;
      } else if (boost.boost_type === BoostType.PROFILE) {
        existing.hasProfile = true;
      }
      boostMap.set(boost.user_id, existing);
    });

    // Parse filters
    const filters: WorkerFilters = {
      age_min: searchParams.get("age_min")
        ? parseInt(searchParams.get("age_min")!)
        : undefined,
      age_max: searchParams.get("age_max")
        ? parseInt(searchParams.get("age_max")!)
        : undefined,
      service_id: searchParams.get("service_id") || undefined,
      category_id: searchParams.get("category_id") || undefined,
      price_min: searchParams.get("price_min")
        ? parseFloat(searchParams.get("price_min")!)
        : undefined,
      price_max: searchParams.get("price_max")
        ? parseFloat(searchParams.get("price_max")!)
        : undefined,
      search: searchParams.get("search") || undefined,
      page: searchParams.get("page") ? parseInt(searchParams.get("page")!) : 1,
      limit: searchParams.get("limit")
        ? parseInt(searchParams.get("limit")!)
        : 12,
    };

    // Build query
    let query = supabase
      .from("worker_profiles")
      .select(
        `
        id,
        full_name,
        nickname,
        age,
        bio,
        profile_status,
        created_at,
        images:worker_images!inner(image_url, image_type),
        services:worker_services!inner(
          id,
          service_id,
          service:services!inner(
            id,
            name_key,
            slug,
            category_id
          ),
          service_option:service_options(
            id,
            option_key,
            option_value
          ),
          pricing:worker_service_prices(
            price_usd,
            primary_currency,
            daily_discount_percent,
            weekly_discount_percent,
            monthly_discount_percent
          )
        )
      `,
        { count: "exact" }
      )
      .eq("profile_status", WorkerProfileStatus.PUBLISHED)
      .eq("images.image_type", "avatar")
      .eq("images.is_approved", true)
      .eq("services.is_active", true);

    // Apply age filters
    if (filters.age_min !== undefined) {
      query = query.gte("age", filters.age_min);
    }
    if (filters.age_max !== undefined) {
      query = query.lte("age", filters.age_max);
    }

    // Apply search filter
    if (filters.search) {
      query = query.or(
        `full_name.ilike.%${filters.search}%,nickname.ilike.%${filters.search}%`
      );
    }

    // Apply service category filter
    if (filters.category_id) {
      query = query.eq("services.service.category_id", filters.category_id);
    }

    // Apply service filter
    if (filters.service_id) {
      query = query.eq("services.service_id", filters.service_id);
    }

    // Apply pagination
    const from = ((filters.page || 1) - 1) * (filters.limit || 12);
    const to = from + (filters.limit || 12) - 1;
    query = query.range(from, to);

    // Execute query
    const { data, error, count } = await query;

    if (error) {

      return NextResponse.json(
        { error: "Failed to fetch workers" },
        { status: 500 }
      );
    }

    // Process data
    let workers = (data || []).map((worker: any) => {
      // Get avatar
      const avatar = worker.images?.find(
        (img: any) => img.image_type === "avatar"
      );

      // Calculate price range
      let minPrice: number | undefined;
      let maxPrice: number | undefined;

      if (worker.services && worker.services.length > 0) {
        const prices = worker.services
          .map((s: any) => s.pricing?.[0]?.price_usd)
          .filter((p: any) => p !== undefined && p !== null);

        if (prices.length > 0) {
          minPrice = Math.min(...prices);
          maxPrice = Math.max(...prices);
        }
      }

      // Check if worker has boosts
      const boostInfo = boostMap.get(worker.user_id);
      const hasRecommendationBoost = boostInfo?.hasRecommendation || false;
      const hasProfileBoost = boostInfo?.hasProfile || false;
      const boostPriority =
        (hasRecommendationBoost ? 1 : 0) + (hasProfileBoost ? 1 : 0);

      return {
        id: worker.id,
        full_name: worker.full_name,
        nickname: worker.nickname,
        age: worker.age,
        bio: worker.bio,
        profile_status: worker.profile_status,
        created_at: worker.created_at,
        avatar: avatar
          ? {
              image_url: avatar.image_url,
            }
          : undefined,
        services: worker.services?.map((s: any) => ({
          id: s.id,
          service_id: s.service_id,
          service: s.service,
          service_option: s.service_option,
          pricing: s.pricing?.[0] || null,
        })),
        min_price: minPrice,
        max_price: maxPrice,
        has_recommendation_boost: hasRecommendationBoost,
        has_profile_boost: hasProfileBoost,
        boost_priority: boostPriority,
      };
    }) as WorkerMarketProfile[];

    // Sort by boost priority (boosted workers first)
    workers.sort((a, b) => {
      // Primary sort: boost priority (higher = better)
      if (b.boost_priority !== a.boost_priority) {
        return (b.boost_priority || 0) - (a.boost_priority || 0);
      }
      // Secondary sort: created_at (newer first)
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    // Apply price filters (post-processing since we need to calculate from services)
    if (filters.price_min !== undefined) {
      workers = workers.filter(
        (w) => w.min_price !== undefined && w.min_price >= filters.price_min!
      );
    }
    if (filters.price_max !== undefined) {
      workers = workers.filter(
        (w) => w.max_price !== undefined && w.max_price <= filters.price_max!
      );
    }

    // Calculate pagination
    const totalPages = Math.ceil((count || 0) / (filters.limit || 12));

    return NextResponse.json({
      workers,
      pagination: {
        page: filters.page || 1,
        limit: filters.limit || 12,
        total: count || 0,
        total_pages: totalPages,
      },
      filters,
    });
  } catch (error) {

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
