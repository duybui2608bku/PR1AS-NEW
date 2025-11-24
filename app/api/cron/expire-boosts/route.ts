/**
 * Cron Job: Expire Boosts
 * POST /api/cron/expire-boosts - Expire old boosts (should be called by a cron service)
 *
 * This endpoint should be called periodically (e.g., every 5-10 minutes) by a cron service
 * like Vercel Cron, GitHub Actions, or any external cron service.
 *
 * Security: Add API key validation in production
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { FireService } from '@/lib/fire/service';
import { getErrorMessage } from '@/lib/utils/common';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: NextRequest) {
  try {
    // Optional: Validate cron secret for security
    const cronSecret = request.headers.get('x-cron-secret');
    const expectedSecret = process.env.CRON_SECRET;

    if (expectedSecret && cronSecret !== expectedSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Create admin client (bypass RLS)
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Expire old boosts
    const fireService = new FireService(supabase);
    const result = await fireService.expireOldBoosts();

    return NextResponse.json({
      success: true,
      message: `Expired ${result.expired_count} boosts`,
      expired_count: result.expired_count,
      expired_boosts: result.boosts.map((b) => ({
        id: b.id,
        user_id: b.user_id,
        boost_type: b.boost_type,
        expires_at: b.expires_at,
      })),
    });
  } catch (error: unknown) {
    const errorMessage = getErrorMessage(error, 'Failed to expire boosts');
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}

// Allow GET for health check
export async function GET() {
  return NextResponse.json({
    message: 'Expire boosts cron job endpoint',
    status: 'healthy',
  });
}
