/**
 * GET /api/cron/expire-fire-boosts
 * Cron job to automatically expire Fire boosts
 * Runs every hour
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { FireService } from '@/lib/fire/service';

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret (Vercel cron jobs send a secret header)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || 'dev-secret';

    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Create Supabase admin client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Expire boosts
    const fireService = new FireService(supabase);
    const expiredCount = await fireService.expireBoosts();

    console.log(`[Cron] Expired ${expiredCount} Fire boosts`);

    return NextResponse.json({
      success: true,
      expired_count: expiredCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[Cron] Error expiring Fire boosts:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
