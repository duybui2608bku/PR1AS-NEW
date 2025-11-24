# Fire Points System Documentation

## Overview

The Fire Points system is a gamification feature that allows Workers to earn and spend "Fire" points to boost their visibility on the platform.

## Features

### 1. Earning Fire

- **Daily Login Reward**: +1 Fire per day for logging in
- **Purchase Fire**: Buy Fire using wallet balance (1 USD = 1 Fire)

### 2. Using Fire (Boosts)

- **Featured Recommendation Boost**:
  - Cost: 1 Fire
  - Duration: 12 hours
  - Effect: Priority placement in featured/recommended worker lists

- **Top Profile Boost**:
  - Cost: 1 Fire
  - Duration: 2 hours
  - Effect: Priority placement in search results

### 3. Boost Behavior

- Workers can activate multiple boosts simultaneously
- Activating a boost while one is already active will **extend** the duration (not reset)
- Boosts automatically expire after their duration ends (via cron job)

## Database Schema

### Tables Created

1. **worker_fires** - Stores worker's Fire balance
   - total_fires: Current available Fire
   - lifetime_fires_earned: Total Fire earned
   - lifetime_fires_spent: Total Fire spent

2. **daily_login_rewards** - Tracks daily login rewards (prevents duplicates)
   - worker_profile_id
   - login_date (unique per worker per day)
   - fires_awarded

3. **fire_transactions** - Complete transaction history
   - transaction_type: purchase | daily_login | boost_featured | boost_top_profile | admin_adjustment | refund
   - fires_amount: +/- Fire amount
   - fires_before/after: Balance tracking

4. **fire_boosts** - Active and historical boosts
   - boost_type: featured_recommendation | top_profile
   - fires_cost
   - started_at / expires_at
   - is_active

## Setup Instructions

### 1. Run Database Migration

Execute the SQL migration in Supabase:

```bash
# Open Supabase Dashboard → SQL Editor
# Run: lib/supabase/migrations/create_fire_points_system.sql
```

This will create:
- 4 new tables with RLS policies
- Helper functions (expire_fire_boosts, get_active_boosts, etc.)
- Triggers for auto-initialization
- Platform settings for Fire configuration

### 2. Deploy Application

The application includes:
- ✅ Backend APIs (6 routes)
- ✅ Frontend UI (Worker dashboard at /worker/fire)
- ✅ Cron job (auto-expire boosts every hour)
- ✅ Multi-language support (vi, en, ko, zh)

### 3. Configure Cron Job

The cron job is already configured in `vercel.json`:

```json
{
  "path": "/api/cron/expire-fire-boosts",
  "schedule": "0 * * * *"  // Runs every hour
}
```

Set environment variable for cron authentication:
```
CRON_SECRET=your-secret-key
```

## API Endpoints

### Worker APIs

1. **GET /api/fire/balance** - Get Fire balance and active boosts
2. **POST /api/fire/purchase** - Purchase Fire with wallet
   ```json
   { "amount": 10 }
   ```

3. **POST /api/fire/daily-login** - Claim daily login reward

4. **POST /api/fire/boost** - Activate boost
   ```json
   { "boost_type": "featured_recommendation" | "top_profile" }
   ```

5. **GET /api/fire/boosts/active** - Get active boosts

6. **GET /api/fire/transactions** - Get transaction history
   - Query params: page, per_page, type

### Cron API

7. **GET /api/cron/expire-fire-boosts** - Auto-expire old boosts
   - Requires: `Authorization: Bearer {CRON_SECRET}` header

## Configuration

Default settings (can be modified in `platform_settings` table):

```json
{
  "fire_purchase_rate": 1.0,          // 1 USD = 1 Fire
  "fire_daily_login_reward": 1,       // +1 Fire/day
  "fire_boost_featured_cost": 1,      // 1 Fire for featured boost
  "fire_boost_featured_hours": 12,    // 12 hours duration
  "fire_boost_profile_cost": 1,       // 1 Fire for profile boost
  "fire_boost_profile_hours": 2       // 2 hours duration
}
```

## UI Components

### Worker Dashboard

Navigate to **Dashboard → Boost Profile** (/worker/fire)

Components:
- **FireBalance** - Shows current Fire balance, earned/spent stats
- **Daily Login Card** - Claim daily reward button
- **Boost Cards** - Activate featured/top profile boosts
- **Transaction History** - View all Fire transactions

### Integration Points

The Fire system integrates with:
- Worker profile system (requires active worker_profile)
- Wallet system (for purchasing Fire)
- Transaction system (payment records)

## Workflow Examples

### Example 1: Daily Login Flow

```
1. Worker logs in → opens /worker/fire
2. Clicks "Claim Reward" button
3. System checks daily_login_rewards for today
4. If not claimed: +1 Fire, create reward record
5. If already claimed: show "Already claimed" message
```

### Example 2: Purchase Fire Flow

```
1. Worker opens purchase modal
2. Enters amount (e.g., 50 Fire)
3. System validates wallet balance ($50 required)
4. Deduct $50 from wallet
5. Add 50 Fire to worker_fires
6. Create fire_transaction record (type: purchase)
7. Create wallet transaction record
```

### Example 3: Activate Boost Flow

```
1. Worker clicks "Activate Featured Boost"
2. System checks: balance >= 1 Fire?
3. If yes: Deduct 1 Fire
4. Create fire_boosts record (expires_at = now + 12h)
5. Create fire_transaction (type: boost_featured)
6. Show countdown timer
7. After 12h: Cron job sets is_active = false
```

### Example 4: Extend Boost Flow

```
1. Worker has active featured boost (8h remaining)
2. Clicks "Extend" button (costs 1 Fire)
3. System: expires_at += 12h (total: 20h remaining)
4. Deduct 1 Fire, create new boost record
5. Both boosts show as active with combined time
```

## Testing Checklist

- [ ] Run database migration successfully
- [ ] Create worker profile
- [ ] Claim daily login reward
- [ ] Purchase Fire with wallet balance
- [ ] Activate featured boost
- [ ] Activate top profile boost
- [ ] Extend active boost
- [ ] View transaction history
- [ ] Wait for boost to expire (or manually trigger cron)
- [ ] Test insufficient Fire error
- [ ] Test insufficient wallet error
- [ ] Test duplicate daily login (should fail gracefully)

## Implementation Status

✅ Database schema and migrations
✅ Backend service layer (FireService)
✅ API routes (6 endpoints)
✅ API client helpers
✅ Cron job for auto-expiry
✅ UI components
✅ Worker dashboard page
✅ Navigation integration
✅ Multi-language translations (vi, en, ko, zh)
⚠️ Worker ranking algorithm (TODO: implement boost priority in worker list APIs)

## Next Steps

1. **Deploy to production**
   - Run database migration
   - Deploy Next.js app
   - Verify cron job is running

2. **Update Worker List APIs**
   - Modify `/api/workers` endpoint
   - Add ordering: boosted workers → regular workers
   - Filter by boost type (featured vs top_profile)

3. **Analytics (Optional)**
   - Track boost effectiveness
   - Monitor Fire purchase conversion
   - Daily active users (claiming rewards)

## Troubleshooting

### Boosts not expiring

Check:
- Cron job is configured in Vercel
- CRON_SECRET is set
- Check cron logs: `/api/cron/expire-fire-boosts`

### Daily login not working

Check:
- System timezone is consistent
- daily_login_rewards table has UNIQUE constraint
- Check for existing reward: `SELECT * FROM daily_login_rewards WHERE login_date = CURRENT_DATE`

### Purchase Fire fails

Check:
- Worker has sufficient wallet balance
- Wallet status is 'active' (not frozen/suspended)
- Transaction limits are not exceeded

## Security Considerations

- ✅ RLS policies enabled on all Fire tables
- ✅ Worker can only view/modify their own Fire balance
- ✅ Cron job requires secret token authentication
- ✅ Purchase validation prevents negative amounts
- ✅ Daily login uses UNIQUE constraint to prevent duplicates
- ✅ All transactions are logged for audit trail

## Support

For issues or questions:
- Check server logs: `/var/log/` or Vercel logs
- Check database: Supabase dashboard → Table Editor
- Check API responses: Browser DevTools → Network tab

---

**Last Updated**: 2025-11-24
**Version**: 1.0.0
