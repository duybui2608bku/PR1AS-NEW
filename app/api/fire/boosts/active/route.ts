/**
 * GET /api/fire/boosts/active
 * Get worker's active Fire boosts
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { FireService } from '@/lib/fire/service';
import { GetActiveBoostsResponse, FireBoostType } from '@/lib/fire/types';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json<GetActiveBoostsResponse>(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get worker profile
    const { data: workerProfile, error: profileError } = await supabase
      .from('worker_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (profileError || !workerProfile) {
      return NextResponse.json<GetActiveBoostsResponse>(
        { success: false, error: 'Worker profile not found' },
        { status: 404 }
      );
    }

    // Get active boosts
    const fireService = new FireService(supabase);
    const activeBoosts = await fireService.getActiveBoosts(workerProfile.id);

    // Check which boost types are active
    const hasFeaturedBoost = activeBoosts.some(
      (boost) => boost.boost_type === FireBoostType.FEATURED_RECOMMENDATION
    );
    const hasProfileBoost = activeBoosts.some(
      (boost) => boost.boost_type === FireBoostType.TOP_PROFILE
    );

    return NextResponse.json<GetActiveBoostsResponse>({
      success: true,
      data: {
        active_boosts: activeBoosts,
        has_featured_boost: hasFeaturedBoost,
        has_profile_boost: hasProfileBoost,
      },
    });
  } catch (error: any) {
    console.error('Get active boosts error:', error);
    return NextResponse.json<GetActiveBoostsResponse>(
      { success: false, error: error.message || 'Failed to fetch active boosts' },
      { status: error.statusCode || 500 }
    );
  }
}
