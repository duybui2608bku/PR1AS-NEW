# 🔥 Hệ Thống Điểm Fire - Hướng Dẫn Cài Đặt & Sử Dụng

## Tổng Quan

Hệ thống điểm Fire cho phép Worker tăng thứ hạng hiển thị trên nền tảng thông qua 2 loại boost:
- **Top Đề Xuất** (12 giờ) - Ưu tiên xuất hiện trên danh sách đề xuất
- **Top Hồ Sơ** (2 giờ) - Ưu tiên hiển thị ở đầu trang tìm kiếm

## 📋 Yêu Cầu

- PostgreSQL database (Supabase)
- Node.js 18+
- Next.js 16+

## 🚀 Cài Đặt

### Bước 1: Chạy Database Migrations

Kết nối đến Supabase dashboard và chạy migration sau:

```bash
# Trong Supabase SQL Editor, chạy file:
/lib/supabase/migrations/create_fire_system.sql
```

Migration này sẽ tạo:
- ✅ 5 bảng mới (worker_fire_balances, fire_transactions, fire_purchases, daily_login_rewards, worker_boosts)
- ✅ RLS policies
- ✅ Database functions (get_active_boosts, can_claim_daily_login, expire_old_boosts, etc.)
- ✅ Triggers tự động
- ✅ Indexes để tối ưu performance
- ✅ Platform settings cho Fire

### Bước 2: Cấu Hình Environment Variables (Tùy Chọn)

Thêm vào `.env.local` nếu muốn sử dụng cron job:

```bash
# Cron secret để bảo mật endpoint expire-boosts
CRON_SECRET=your_random_secret_here
```

### Bước 3: Cài Đặt Dependencies

Tất cả dependencies đã có sẵn trong project. Không cần cài thêm.

### Bước 4: Restart Development Server

```bash
npm run dev
```

## 📁 Cấu Trúc Code

### Database Layer
```
/lib/supabase/migrations/
└── create_fire_system.sql          # Migration file
```

### Backend Layer
```
/lib/fire/
├── types.ts                        # TypeScript types & interfaces
├── service.ts                      # FireService class (business logic)
├── api-client.ts                   # Client-side API wrapper
└── auth-helper.ts                  # Authentication helper

/app/api/fire/
├── balance/route.ts                # GET: Lấy số Fire hiện có
├── purchase/route.ts               # POST: Mua Fire
├── daily-login/route.ts            # POST: Nhận Fire từ đăng nhập
├── transactions/route.ts           # GET: Lịch sử giao dịch Fire
└── boost/
    ├── activate/route.ts           # POST: Kích hoạt boost
    └── status/route.ts             # GET: Kiểm tra trạng thái boost

/app/api/cron/
└── expire-boosts/route.ts          # POST: Cron job xóa boost hết hạn
```

### Frontend Layer
```
/components/fire/
├── FireBalance.tsx                 # Hiển thị số Fire
├── BoostButton.tsx                 # Nút kích hoạt boost
├── BoostTimer.tsx                  # Đồng hồ đếm ngược
├── DailyLoginButton.tsx            # Nút nhận Fire hàng ngày
├── PurchaseFireModal.tsx           # Modal mua Fire
├── FireDashboard.tsx               # Dashboard chính
└── index.ts                        # Export all components
```

### Integration
```
/app/worker/dashboard/page.tsx      # Worker dashboard (đã tích hợp FireDashboard)
/app/api/market/workers/route.ts    # Worker search (đã ưu tiên workers có boost)
```

## 🎯 Cách Sử Dụng

### 1. Kiếm Fire

#### a. Đăng Nhập Hàng Ngày
- Worker đăng nhập mỗi ngày → nhận +1 Fire
- Chỉ được nhận 1 lần/ngày theo múi giờ hệ thống

**API:**
```typescript
POST /api/fire/daily-login
```

**Frontend:**
```typescript
import { fireAPI } from '@/lib/fire/api-client';

const claimDaily = async () => {
  const result = await fireAPI.claimDailyLogin();
  console.log(result.message); // "+1 Fire! Come back tomorrow for more!"
};
```

#### b. Mua Fire Bằng Tiền
- Tỉ lệ: **1 USD = 5 Fire**
- Tự động quy đổi với VND, JPY, KRW, CNY
- Hỗ trợ thanh toán qua Wallet, PayPal, Bank Transfer

**API:**
```typescript
POST /api/fire/purchase
Body: {
  "fire_amount": 10,
  "currency": "USD",
  "payment_method": "wallet"
}
```

**Frontend:**
```typescript
import { fireAPI } from '@/lib/fire/api-client';

const purchaseFire = async () => {
  const result = await fireAPI.purchaseFire({
    fire_amount: 10,
    currency: 'USD',
    payment_method: 'wallet'
  });
  console.log(result.newBalance); // Updated balance
};
```

### 2. Sử Dụng Fire

#### a. Đẩy Top Đề Xuất (12 giờ)
- Tiêu hao: **1 Fire**
- Thời gian: **12 giờ**
- Tác dụng: Xuất hiện đầu tiên trong danh sách đề xuất

**API:**
```typescript
POST /api/fire/boost/activate
Body: {
  "boost_type": "recommendation"
}
```

**Frontend:**
```typescript
import { fireAPI } from '@/lib/fire/api-client';

const activateRecommendation = async () => {
  const result = await fireAPI.activateRecommendationBoost();
  console.log(result.message); // "recommendation boost activated for 12 hours!"
};
```

#### b. Đẩy Top Hồ Sơ (2 giờ)
- Tiêu hao: **1 Fire**
- Thời gian: **2 giờ**
- Tác dụng: Xuất hiện đầu tiên trong trang tìm kiếm hồ sơ

**API:**
```typescript
POST /api/fire/boost/activate
Body: {
  "boost_type": "profile"
}
```

**Frontend:**
```typescript
import { fireAPI } from '@/lib/fire/api-client';

const activateProfile = async () => {
  const result = await fireAPI.activateProfileBoost();
  console.log(result.message); // "profile boost activated for 2 hours!"
};
```

### 3. Kiểm Tra Trạng Thái

#### Lấy Fire Balance
```typescript
import { fireAPI } from '@/lib/fire/api-client';

const checkBalance = async () => {
  const data = await fireAPI.getBalance();
  console.log(data.balance.fire_balance); // Current Fire
  console.log(data.canClaimDailyLogin); // true/false
  console.log(data.activeBoosts); // Array of active boosts
};
```

#### Kiểm Tra Boost Status
```typescript
import { fireAPI } from '@/lib/fire/api-client';

const checkBoosts = async () => {
  const status = await fireAPI.getBoostStatus();
  console.log(status.recommendationBoost); // Active recommendation boost or undefined
  console.log(status.profileBoost); // Active profile boost or undefined
};
```

### 4. Xem Lịch Sử Giao Dịch

```typescript
import { fireAPI } from '@/lib/fire/api-client';

const viewHistory = async () => {
  const history = await fireAPI.getTransactions({
    limit: 20,
    offset: 0,
    type: 'purchase' // Optional filter
  });
  console.log(history.transactions);
  console.log(history.total);
  console.log(history.hasMore);
};
```

## ⚙️ Cron Job - Expire Old Boosts

Để tự động xóa các boost hết hạn, cần setup cron job gọi endpoint sau:

### URL:
```
POST /api/cron/expire-boosts
Header: x-cron-secret: YOUR_CRON_SECRET
```

### Cách Setup:

#### Option 1: Vercel Cron (Recommended)
Thêm vào `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/expire-boosts",
      "schedule": "*/10 * * * *"
    }
  ]
}
```

#### Option 2: GitHub Actions
Tạo file `.github/workflows/cron-expire-boosts.yml`:
```yaml
name: Expire Boosts Cron

on:
  schedule:
    - cron: '*/10 * * * *' # Every 10 minutes

jobs:
  expire-boosts:
    runs-on: ubuntu-latest
    steps:
      - name: Call expire boosts endpoint
        run: |
          curl -X POST https://your-domain.com/api/cron/expire-boosts \
            -H "x-cron-secret: ${{ secrets.CRON_SECRET }}"
```

#### Option 3: External Cron Service
Sử dụng dịch vụ như cron-job.org, EasyCron, hoặc UptimeRobot.

## 🔒 Bảo Mật

### RLS (Row Level Security)
Tất cả bảng Fire đều có RLS policies:
- ✅ Workers chỉ xem được Fire của mình
- ✅ Admins xem được tất cả
- ✅ Không ai có thể sửa trực tiếp Fire balance (phải qua API)

### Authentication
Tất cả API routes yêu cầu:
- ✅ Valid JWT token (từ Supabase Auth)
- ✅ User phải có role = 'worker'
- ✅ Token được verify qua service role key

### Cron Job Security
- ✅ Endpoint `/api/cron/expire-boosts` yêu cầu header `x-cron-secret`
- ✅ Secret được lưu trong environment variable

## 📊 Database Schema

### worker_fire_balances
- Lưu số Fire hiện có của mỗi worker
- Tự động tạo khi worker profile được tạo

### fire_transactions
- Lịch sử mọi giao dịch Fire (kiếm/tiêu)
- Audit trail với balance_before và balance_after

### fire_purchases
- Lịch sử mua Fire bằng tiền
- Link đến wallet transactions

### daily_login_rewards
- Theo dõi đăng nhập hàng ngày
- Constraint unique (user_id, reward_date) để tránh duplicate

### worker_boosts
- Lịch sử và trạng thái boost
- Status: active, expired, cancelled
- Tự động expire thông qua cron job

## 🧪 Testing

### Test Manual

1. **Test Daily Login:**
   ```bash
   # Worker dashboard -> Click "Claim Daily Fire (+1)"
   # Kiểm tra: Fire balance tăng 1
   # Kiểm tra: Nút chuyển thành "Already Claimed Today"
   ```

2. **Test Purchase Fire:**
   ```bash
   # Worker dashboard -> Click "Purchase Fire"
   # Nhập số lượng Fire muốn mua
   # Chọn currency và payment method
   # Kiểm tra: Fire balance tăng đúng số lượng
   ```

3. **Test Activate Boost:**
   ```bash
   # Worker dashboard -> Click "Top Recommendation - 1 Fire" hoặc "Top Profile - 1 Fire"
   # Confirm popup
   # Kiểm tra: Fire balance giảm 1
   # Kiểm tra: Hiển thị countdown timer
   # Kiểm tra: Worker xuất hiện đầu tiên trong market search
   ```

4. **Test Boost Expiration:**
   ```bash
   # Đợi boost hết hạn (hoặc chạy cron job manual)
   # Kiểm tra: Timer về 00:00:00
   # Kiểm tra: Status chuyển thành "expired"
   # Kiểm tra: Worker không còn ưu tiên trong search
   ```

### Test API với cURL

```bash
# Get Fire balance
curl http://localhost:3000/api/fire/balance \
  -H "Cookie: sb-access-token=YOUR_TOKEN"

# Claim daily login
curl -X POST http://localhost:3000/api/fire/daily-login \
  -H "Cookie: sb-access-token=YOUR_TOKEN"

# Activate boost
curl -X POST http://localhost:3000/api/fire/boost/activate \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-access-token=YOUR_TOKEN" \
  -d '{"boost_type":"recommendation"}'

# Run cron job (manual)
curl -X POST http://localhost:3000/api/cron/expire-boosts \
  -H "x-cron-secret: YOUR_SECRET"
```

## 🐛 Troubleshooting

### Lỗi: "Only workers can access Fire system"
- **Nguyên nhân:** User không có role = 'worker'
- **Giải pháp:** Kiểm tra user_profiles table, đảm bảo role = 'worker'

### Lỗi: "Daily login reward already claimed today"
- **Nguyên nhân:** Đã claim rồi trong ngày hôm nay
- **Giải pháp:** Đợi sang ngày mai (theo múi giờ server)

### Lỗi: "Insufficient Fire balance"
- **Nguyên nhân:** Không đủ Fire để kích hoạt boost
- **Giải pháp:** Mua thêm Fire hoặc claim daily login

### Boost không expire tự động
- **Nguyên nhân:** Cron job chưa được setup
- **Giải pháp:** Setup cron job theo hướng dẫn ở trên

### Worker không xuất hiện đầu tiên dù có boost
- **Nguyên nhân:** Cache hoặc query chưa refresh
- **Giải pháp:** Reload trang market/workers

## 📈 Monitoring & Analytics

### Xem Thống Kê (Admin Only)

File service có sẵn function `getAdminStats()`:
```typescript
const stats = await fireService.getAdminStats();
console.log(stats.total_fire_in_circulation);
console.log(stats.total_fire_purchased);
console.log(stats.active_recommendation_boosts);
console.log(stats.active_profile_boosts);
```

### Queries Hữu Ích

```sql
-- Top workers có nhiều Fire nhất
SELECT user_id, fire_balance, total_earned, total_spent
FROM worker_fire_balances
ORDER BY fire_balance DESC
LIMIT 10;

-- Số lượng boost đang active
SELECT boost_type, COUNT(*)
FROM worker_boosts
WHERE status = 'active' AND expires_at > NOW()
GROUP BY boost_type;

-- Doanh thu từ Fire (theo ngày)
SELECT
  DATE(created_at) as date,
  SUM(amount_usd) as revenue,
  SUM(fire_amount) as fire_sold
FROM fire_purchases
WHERE status = 'completed'
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Workers chưa bao giờ dùng Fire
SELECT wp.user_id, wp.full_name
FROM worker_profiles wp
LEFT JOIN worker_fire_balances wfb ON wp.user_id = wfb.user_id
WHERE wfb.total_spent = 0 OR wfb.total_spent IS NULL;
```

## 🎨 Customization

### Thay Đổi Tỉ Lệ Fire
Sửa trong `platform_settings` table hoặc constant:
```sql
UPDATE platform_settings
SET value = '10' -- 1 USD = 10 Fire
WHERE key = 'fire_usd_rate';
```

### Thay Đổi Thời Gian Boost
Sửa trong `platform_settings` table:
```sql
UPDATE platform_settings
SET value = '24' -- 24 hours
WHERE key = 'fire_boost_recommendation_hours';
```

### Thay Đổi Chi Phí Boost
Sửa trong `platform_settings` table:
```sql
UPDATE platform_settings
SET value = '2' -- 2 Fire
WHERE key = 'fire_boost_recommendation_cost';
```

## 📞 Support

Nếu gặp vấn đề, hãy kiểm tra:
1. ✅ Migrations đã chạy thành công chưa
2. ✅ RLS policies đã enable chưa
3. ✅ User có role = 'worker' chưa
4. ✅ Token authentication hoạt động chưa
5. ✅ Cron job đã setup chưa

## 📝 Changelog

### v1.0.0 (2025-11-24)
- ✅ Initial release
- ✅ Fire balance tracking
- ✅ Daily login rewards
- ✅ Fire purchases
- ✅ Boost system (recommendation & profile)
- ✅ Worker search ranking
- ✅ Full UI dashboard
- ✅ API endpoints
- ✅ Cron job for expiring boosts
- ✅ RLS policies
- ✅ Audit trail

---

Chúc bạn thành công với hệ thống Fire Points! 🔥🚀
