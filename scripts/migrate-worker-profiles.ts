/**
 * Migration Script: Fix Worker Profile Data Consistency
 * 
 * This script:
 * 1. Recalculates completed_steps for all profiles
 * 2. Cleans up orphaned tags and availabilities
 * 3. Validates and reports inconsistencies
 * 
 * Usage:
 *   npx tsx scripts/migrate-worker-profiles.ts
 * 
 * Or with options:
 *   npx tsx scripts/migrate-worker-profiles.ts --dry-run
 *   npx tsx scripts/migrate-worker-profiles.ts --fix-all
 */

import { createClient } from "@supabase/supabase-js";
import {
  recalculateAllCompletedSteps,
  cleanupAllOrphanedData,
  validateStepState,
} from "../lib/worker/data-consistency";
import { WorkerProfileService } from "../lib/worker/service";

// Load environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const service = new WorkerProfileService(supabase);

interface MigrationOptions {
  dryRun: boolean;
  fixAll: boolean;
  cleanupOrphaned: boolean;
}

async function main() {
  const args = process.argv.slice(2);
  const options: MigrationOptions = {
    dryRun: args.includes("--dry-run"),
    fixAll: args.includes("--fix-all"),
    cleanupOrphaned: args.includes("--cleanup") || args.includes("--fix-all"),
  };

  console.log("=".repeat(60));
  console.log("Worker Profile Data Consistency Migration");
  console.log("=".repeat(60));
  console.log(`Mode: ${options.dryRun ? "DRY RUN (no changes)" : "LIVE"}`);
  console.log(`Options:`, options);
  console.log("=".repeat(60));
  console.log();

  try {
    // Step 1: Recalculate completed steps
    if (options.fixAll || args.includes("--recalculate")) {
      console.log("Step 1: Recalculating completed steps for all profiles...");
      
      if (options.dryRun) {
        console.log("  [DRY RUN] Would recalculate all profiles");
      } else {
        const result = await recalculateAllCompletedSteps(supabase);
        console.log(`  ✓ Processed: ${result.processed} profiles`);
        console.log(`  ✓ Updated: ${result.updated} profiles`);
        if (result.errors.length > 0) {
          console.log(`  ✗ Errors: ${result.errors.length}`);
          result.errors.forEach((err) => {
            console.log(`    - Profile ${err.profileId}: ${err.error}`);
          });
        }
      }
      console.log();
    }

    // Step 2: Cleanup orphaned data
    if (options.cleanupOrphaned) {
      console.log("Step 2: Cleaning up orphaned tags and availabilities...");
      
      if (options.dryRun) {
        console.log("  [DRY RUN] Would cleanup orphaned data");
      } else {
        const result = await cleanupAllOrphanedData(supabase);
        console.log(`  ✓ Tags deleted: ${result.tags.deleted}`);
        if (result.tags.errors.length > 0) {
          console.log(`  ✗ Tag errors: ${result.tags.errors.length}`);
        }
        console.log(`  ✓ Availabilities deleted: ${result.availabilities.deleted}`);
        if (result.availabilities.errors.length > 0) {
          console.log(`  ✗ Availability errors: ${result.availabilities.errors.length}`);
        }
      }
      console.log();
    }

    // Step 3: Validate all profiles
    console.log("Step 3: Validating all profiles...");
    const { data: profiles } = await supabase
      .from("worker_profiles")
      .select("id, user_id, profile_completed_steps");

    if (!profiles || profiles.length === 0) {
      console.log("  No profiles found");
    } else {
      let inconsistentCount = 0;
      const inconsistencies: Array<{
        profileId: string;
        userId: string;
        issues: string[];
      }> = [];

      for (const profile of profiles) {
        const fullProfile = await service.getWorkerProfileById(profile.id);
        if (fullProfile) {
          const issues = validateStepState(fullProfile);
          if (issues.length > 0) {
            inconsistentCount++;
            inconsistencies.push({
              profileId: profile.id,
              userId: profile.user_id,
              issues: issues.map((i) => i.message),
            });
          }
        }
      }

      console.log(`  ✓ Total profiles: ${profiles.length}`);
      console.log(`  ${inconsistentCount > 0 ? "✗" : "✓"} Inconsistent profiles: ${inconsistentCount}`);

      if (inconsistencies.length > 0 && !options.dryRun) {
        console.log("\n  Inconsistencies found:");
        inconsistencies.slice(0, 10).forEach((inc) => {
          console.log(`    - Profile ${inc.profileId} (User: ${inc.userId}):`);
          inc.issues.forEach((issue) => {
            console.log(`      • ${issue}`);
          });
        });
        if (inconsistencies.length > 10) {
          console.log(`    ... and ${inconsistencies.length - 10} more`);
        }
      }
    }

    console.log();
    console.log("=".repeat(60));
    console.log("Migration completed!");
    console.log("=".repeat(60));
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

// Run migration
main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});

