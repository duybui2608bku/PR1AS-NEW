/**
 * Data Consistency Utilities
 * Functions to ensure data integrity and consistency in worker profiles
 */

import { SupabaseClient } from "@supabase/supabase-js";
import { WorkerProfileComplete } from "./types";
import { logger } from "@/lib/utils/logger";

/**
 * Calculate completed steps based on actual profile data
 * Step 1: Basic info (full_name, age required)
 * Step 2: Services & images (avatar and at least one service required)
 * 
 * Returns: Bitmask (1=step1, 2=step2, 3=both)
 */
export function calculateCompletedSteps(
  profile: WorkerProfileComplete | Partial<WorkerProfileComplete>
): number {
  let steps = 0;

  // Step 1: Basic info completed
  // Required: full_name and age
  if (profile.full_name && profile.age) {
    steps |= 1; // Set bit 1
  }

  // Step 2: Services & images completed
  // Required: avatar and at least one service
  const hasAvatar = profile.avatar !== undefined && profile.avatar !== null;
  const hasServices =
    profile.services !== undefined &&
    Array.isArray(profile.services) &&
    profile.services.length > 0;

  if (hasAvatar && hasServices) {
    steps |= 2; // Set bit 2
  }

  return steps;
}

/**
 * Validate that step state is consistent with actual data
 * Returns array of inconsistencies found
 */
export function validateStepState(
  profile: WorkerProfileComplete
): Array<{ field: string; expected: number; actual: number; message: string }> {
  const inconsistencies: Array<{
    field: string;
    expected: number;
    actual: number;
    message: string;
  }> = [];

  const calculatedSteps = calculateCompletedSteps(profile);
  const actualSteps = profile.profile_completed_steps;

  if (calculatedSteps !== actualSteps) {
    inconsistencies.push({
      field: "profile_completed_steps",
      expected: calculatedSteps,
      actual: actualSteps,
      message: `Step state mismatch: expected ${calculatedSteps} but got ${actualSteps}`,
    });
  }

  // Additional validations
  // Check if step 1 is marked complete but required fields are missing
  if ((actualSteps & 1) === 1) {
    if (!profile.full_name || !profile.age) {
      inconsistencies.push({
        field: "step1_data",
        expected: 1,
        actual: 0,
        message: "Step 1 marked complete but required fields (full_name, age) are missing",
      });
    }
  }

  // Check if step 2 is marked complete but required data is missing
  if ((actualSteps & 2) === 2) {
    const hasAvatar = profile.avatar !== undefined && profile.avatar !== null;
    const hasServices =
      profile.services !== undefined &&
      Array.isArray(profile.services) &&
      profile.services.length > 0;

    if (!hasAvatar || !hasServices) {
      inconsistencies.push({
        field: "step2_data",
        expected: 2,
        actual: 0,
        message: "Step 2 marked complete but required data (avatar or services) is missing",
      });
    }
  }

  return inconsistencies;
}

/**
 * Recalculate and update completed steps for a profile
 */
export async function recalculateCompletedSteps(
  supabase: SupabaseClient,
  profileId: string
): Promise<{ updated: boolean; oldSteps: number; newSteps: number }> {
  // Get full profile data
  const { data: profile, error: fetchError } = await supabase
    .from("worker_profiles")
    .select(
      `
      *,
      tags:worker_tags(*),
      availabilities:worker_availabilities(*),
      images:worker_images(*),
      services:worker_services(*)
    `
    )
    .eq("id", profileId)
    .single();

  if (fetchError || !profile) {
    throw new Error(`Failed to fetch profile: ${fetchError?.message}`);
  }

  const oldSteps = profile.profile_completed_steps;
  const newSteps = calculateCompletedSteps(profile as WorkerProfileComplete);

  if (oldSteps === newSteps) {
    return { updated: false, oldSteps, newSteps };
  }

  // Update completed steps
  const { error: updateError } = await supabase
    .from("worker_profiles")
    .update({ profile_completed_steps: newSteps })
    .eq("id", profileId);

  if (updateError) {
    throw new Error(`Failed to update completed steps: ${updateError.message}`);
  }

  logger.info("Recalculated completed steps", {
    profileId,
    oldSteps,
    newSteps,
  });

  return { updated: true, oldSteps, newSteps };
}

/**
 * Clean up orphaned tags (tags without a valid profile)
 */
export async function cleanupOrphanedTags(
  supabase: SupabaseClient
): Promise<{ deleted: number; errors: string[] }> {
  const errors: string[] = [];
  let deleted = 0;

  // Find orphaned tags (tags where profile_id doesn't exist)
  const { data: orphanedTags, error: fetchError } = await supabase
    .from("worker_tags")
    .select("id, profile_id")
    .not("profile_id", "is", null);

  if (fetchError) {
    throw new Error(`Failed to fetch tags: ${fetchError.message}`);
  }

  if (!orphanedTags || orphanedTags.length === 0) {
    return { deleted: 0, errors: [] };
  }

  // Check each tag's profile exists
  for (const tag of orphanedTags) {
    const { data: profile, error: checkError } = await supabase
      .from("worker_profiles")
      .select("id")
      .eq("id", tag.profile_id)
      .single();

    if (checkError || !profile) {
      // Profile doesn't exist, delete the tag
      const { error: deleteError } = await supabase
        .from("worker_tags")
        .delete()
        .eq("id", tag.id);

      if (deleteError) {
        errors.push(`Failed to delete tag ${tag.id}: ${deleteError.message}`);
      } else {
        deleted++;
      }
    }
  }

  logger.info("Cleaned up orphaned tags", { deleted, errors: errors.length });

  return { deleted, errors };
}

/**
 * Clean up orphaned availabilities (availabilities without a valid profile)
 */
export async function cleanupOrphanedAvailabilities(
  supabase: SupabaseClient
): Promise<{ deleted: number; errors: string[] }> {
  const errors: string[] = [];
  let deleted = 0;

  // Find orphaned availabilities
  const { data: orphanedAvailabilities, error: fetchError } = await supabase
    .from("worker_availabilities")
    .select("id, profile_id")
    .not("profile_id", "is", null);

  if (fetchError) {
    throw new Error(`Failed to fetch availabilities: ${fetchError.message}`);
  }

  if (!orphanedAvailabilities || orphanedAvailabilities.length === 0) {
    return { deleted: 0, errors: [] };
  }

  // Check each availability's profile exists
  for (const availability of orphanedAvailabilities) {
    const { data: profile, error: checkError } = await supabase
      .from("worker_profiles")
      .select("id")
      .eq("id", availability.profile_id)
      .single();

    if (checkError || !profile) {
      // Profile doesn't exist, delete the availability
      const { error: deleteError } = await supabase
        .from("worker_availabilities")
        .delete()
        .eq("id", availability.id);

      if (deleteError) {
        errors.push(
          `Failed to delete availability ${availability.id}: ${deleteError.message}`
        );
      } else {
        deleted++;
      }
    }
  }

  logger.info("Cleaned up orphaned availabilities", {
    deleted,
    errors: errors.length,
  });

  return { deleted, errors };
}

/**
 * Clean up all orphaned data (tags and availabilities)
 */
export async function cleanupAllOrphanedData(
  supabase: SupabaseClient
): Promise<{
  tags: { deleted: number; errors: string[] };
  availabilities: { deleted: number; errors: string[] };
}> {
  const [tagsResult, availabilitiesResult] = await Promise.all([
    cleanupOrphanedTags(supabase),
    cleanupOrphanedAvailabilities(supabase),
  ]);

  return {
    tags: tagsResult,
    availabilities: availabilitiesResult,
  };
}

/**
 * Recalculate completed steps for all profiles
 * Useful for migration or fixing inconsistent data
 */
export async function recalculateAllCompletedSteps(
  supabase: SupabaseClient
): Promise<{
  processed: number;
  updated: number;
  errors: Array<{ profileId: string; error: string }>;
}> {
  const errors: Array<{ profileId: string; error: string }> = [];
  let processed = 0;
  let updated = 0;

  // Get all profiles
  const { data: profiles, error: fetchError } = await supabase
    .from("worker_profiles")
    .select("id");

  if (fetchError) {
    throw new Error(`Failed to fetch profiles: ${fetchError.message}`);
  }

  if (!profiles || profiles.length === 0) {
    return { processed: 0, updated: 0, errors: [] };
  }

  // Process each profile
  for (const profile of profiles) {
    try {
      processed++;
      const result = await recalculateCompletedSteps(supabase, profile.id);
      if (result.updated) {
        updated++;
      }
    } catch (error) {
      errors.push({
        profileId: profile.id,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  logger.info("Recalculated all completed steps", {
    processed,
    updated,
    errors: errors.length,
  });

  return { processed, updated, errors };
}

/**
 * Validate and fix inconsistencies for a single profile
 */
export async function validateAndFixProfile(
  supabase: SupabaseClient,
  profileId: string
): Promise<{
  fixed: boolean;
  inconsistencies: Array<{
    field: string;
    expected: number;
    actual: number;
    message: string;
  }>;
  errors: string[];
}> {
  const errors: string[] = [];

  // Get full profile
  const { data: profile, error: fetchError } = await supabase
    .from("worker_profiles")
    .select(
      `
      *,
      tags:worker_tags(*),
      availabilities:worker_availabilities(*),
      images:worker_images(*),
      services:worker_services(*)
    `
    )
    .eq("id", profileId)
    .single();

  if (fetchError || !profile) {
    return {
      fixed: false,
      inconsistencies: [],
      errors: [`Failed to fetch profile: ${fetchError?.message}`],
    };
  }

  // Validate step state
  const inconsistencies = validateStepState(profile as WorkerProfileComplete);

  if (inconsistencies.length === 0) {
    return { fixed: false, inconsistencies: [], errors: [] };
  }

  // Fix inconsistencies
  try {
    const result = await recalculateCompletedSteps(supabase, profileId);
    if (result.updated) {
      return { fixed: true, inconsistencies, errors: [] };
    }
  } catch (error) {
    errors.push(
      error instanceof Error ? error.message : String(error)
    );
  }

  return { fixed: false, inconsistencies, errors };
}

