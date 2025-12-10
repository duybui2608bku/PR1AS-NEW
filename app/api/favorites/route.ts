/**
 * Favorites API
 * Endpoints for managing worker favorites
 */

import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth/middleware";
import { successResponse } from "@/lib/http/response";
import { withErrorHandling } from "@/lib/http/errors";

/**
 * GET /api/favorites
 * Get user's favorite workers
 */
export const GET = withErrorHandling(async (request: NextRequest) => {
  const { user, supabase } = await requireAuth(request);
  const { searchParams } = new URL(request.url);
  
  // Optional: Get worker IDs to check if they're favorited
  const workerIds = searchParams.get("worker_ids");
  
  let query = supabase
    .from("worker_favorites")
    .select(
      `
      id,
      worker_profile_id,
      created_at,
      worker_profile:worker_profiles!inner(
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
          service:services!inner(id, name_key, slug),
          pricing:worker_service_prices(price_usd, is_active)
        )
      )
    `
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  // If worker_ids provided, filter by them
  if (workerIds) {
    const ids = workerIds.split(",").filter(Boolean);
    if (ids.length > 0) {
      query = query.in("worker_profile_id", ids);
    }
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  // If checking specific workers, return just IDs
  if (workerIds) {
    const favoritedIds = (data || []).map((fav: any) => fav.worker_profile_id);
    return successResponse({
      favorited_worker_ids: favoritedIds,
    });
  }

  // Return full favorite data
  return successResponse({
    favorites: data || [],
    count: data?.length || 0,
  });
});

/**
 * POST /api/favorites
 * Add a worker to favorites
 */
export const POST = withErrorHandling(async (request: NextRequest) => {
  const { user, supabase } = await requireAuth(request);
  const body = await request.json();
  const { worker_profile_id } = body;

  if (!worker_profile_id) {
    return new Response(
      JSON.stringify({ error: "worker_profile_id is required" }),
      { status: 400 }
    );
  }

  // Verify worker profile exists and is published
  const { data: workerProfile, error: workerError } = await supabase
    .from("worker_profiles")
    .select("id, profile_status")
    .eq("id", worker_profile_id)
    .single();

  if (workerError || !workerProfile) {
    return new Response(
      JSON.stringify({ error: "Worker profile not found" }),
      { status: 404 }
    );
  }

  if (workerProfile.profile_status !== "published") {
    return new Response(
      JSON.stringify({ error: "Worker profile is not published" }),
      { status: 400 }
    );
  }

  // Insert favorite (or ignore if already exists due to UNIQUE constraint)
  const { data, error } = await supabase
    .from("worker_favorites")
    .insert({
      user_id: user.id,
      worker_profile_id,
    })
    .select()
    .single();

  if (error) {
    // Check if it's a unique constraint violation
    if (error.code === "23505") {
      return successResponse({
        message: "Worker already in favorites",
        favorite: null,
      });
    }
    throw error;
  }

  return successResponse({
    message: "Worker added to favorites",
    favorite: data,
  });
});

/**
 * DELETE /api/favorites
 * Remove a worker from favorites
 */
export const DELETE = withErrorHandling(async (request: NextRequest) => {
  const { user, supabase } = await requireAuth(request);
  const { searchParams } = new URL(request.url);
  const worker_profile_id = searchParams.get("worker_profile_id");

  if (!worker_profile_id) {
    return new Response(
      JSON.stringify({ error: "worker_profile_id is required" }),
      { status: 400 }
    );
  }

  const { error } = await supabase
    .from("worker_favorites")
    .delete()
    .eq("user_id", user.id)
    .eq("worker_profile_id", worker_profile_id);

  if (error) {
    throw error;
  }

  return successResponse({
    message: "Worker removed from favorites",
  });
});

