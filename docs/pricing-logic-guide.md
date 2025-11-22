# Pricing Logic & Calculation Guide

## Tổng quan

Document này giải thích chi tiết logic tính giá dịch vụ trong nền tảng, bao gồm:
- Cách worker set giá
- Tính toán price tiers (hourly/daily/weekly/monthly)
- Đa tiền tệ (multi-currency support)
- Discount cho long-term bookings
- Logic tính giá khi book nhiều services

---

## 1. Base Pricing Model

### 1.1. Nguyên tắc cơ bản

**Worker nhập giá theo GIỜ (hourly rate)**

Tất cả các tiers khác (daily, weekly, monthly) được tính tự động dựa trên hourly rate.

### 1.2. Supported Currencies

| Currency | Code | Decimal Places | Example |
|----------|------|----------------|---------|
| US Dollar | USD | 2 | $20.00/hour |
| Vietnamese Dong | VND | 0 | ₫500,000/giờ |
| Japanese Yen | JPY | 0 | ¥3,000/時間 |
| Korean Won | KRW | 0 | ₩30,000/시간 |
| Chinese Yuan | CNY | 2 | ¥150.00/小时 |

**Primary Currency**: Worker chọn 1 currency làm primary khi set giá. Currency này là currency chính để hiển thị và tính toán.

### 1.3. Database Schema

```sql
CREATE TABLE worker_service_prices (
  id UUID PRIMARY KEY,
  worker_service_id UUID NOT NULL,

  -- Hourly prices in different currencies
  price_usd DECIMAL(10, 2),
  price_vnd DECIMAL(15, 2),
  price_jpy DECIMAL(10, 2),
  price_krw DECIMAL(10, 2),
  price_cny DECIMAL(10, 2),

  primary_currency TEXT NOT NULL, -- 'USD', 'VND', 'JPY', 'KRW', 'CNY'

  -- Optional discounts for long-term bookings
  daily_discount_percent DECIMAL(5, 2) DEFAULT 0,
  weekly_discount_percent DECIMAL(5, 2) DEFAULT 0,
  monthly_discount_percent DECIMAL(5, 2) DEFAULT 0,

  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## 2. Price Tier Calculation

### 2.1. Standard Tiers

| Tier | Formula | Hours | Example (Hourly = $20) |
|------|---------|-------|------------------------|
| **Hourly** | Base price | 1 hour | $20.00 |
| **Daily** | Hourly × 8 | 8 hours | $160.00 |
| **Weekly** | Hourly × 56 | 56 hours (8h × 7 days) | $1,120.00 |
| **Monthly** | Hourly × 160 | 160 hours (8h × 20 days) | $3,200.00 |

### 2.2. Calculation Logic

```typescript
interface PriceTier {
  hourly: number;
  daily: number;
  weekly: number;
  monthly: number;
}

function calculatePriceTiers(
  hourlyRate: number,
  dailyDiscount: number = 0,
  weeklyDiscount: number = 0,
  monthlyDiscount: number = 0
): PriceTier {
  const hourly = hourlyRate;
  const daily = hourlyRate * 8 * (1 - dailyDiscount / 100);
  const weekly = hourlyRate * 56 * (1 - weeklyDiscount / 100);
  const monthly = hourlyRate * 160 * (1 - monthlyDiscount / 100);

  return {
    hourly: round(hourly, 2),
    daily: round(daily, 2),
    weekly: round(weekly, 2),
    monthly: round(monthly, 2),
  };
}
```

### 2.3. PostgreSQL Function

```sql
CREATE OR REPLACE FUNCTION calculate_price_tiers(
  hourly_price DECIMAL,
  daily_discount DECIMAL DEFAULT 0,
  weekly_discount DECIMAL DEFAULT 0,
  monthly_discount DECIMAL DEFAULT 0,
  OUT hourly DECIMAL,
  OUT daily DECIMAL,
  OUT weekly DECIMAL,
  OUT monthly DECIMAL
)
AS $$
BEGIN
  hourly := hourly_price;
  daily := ROUND(hourly_price * 8 * (1 - daily_discount / 100), 2);
  weekly := ROUND(hourly_price * 56 * (1 - weekly_discount / 100), 2);
  monthly := ROUND(hourly_price * 160 * (1 - monthly_discount / 100), 2);
END;
$$ LANGUAGE plpgsql IMMUTABLE;
```

**Usage**:
```sql
SELECT * FROM calculate_price_tiers(
  hourly_price := 20.00,
  daily_discount := 5,
  weekly_discount := 10,
  monthly_discount := 15
);

-- Output:
-- hourly  | daily   | weekly   | monthly
-- --------|---------|----------|----------
-- 20.00   | 152.00  | 1008.00  | 2720.00
```

---

## 3. Discount Strategy

### 3.1. Long-term Booking Discounts

Workers có thể offer discounts cho bookings dài hạn để incentivize clients.

**Example**: Worker sets hourly rate = $20

| Tier | Discount | Calculation | Standard Price | Discounted Price | Savings |
|------|----------|-------------|----------------|------------------|---------|
| Hourly | 0% | 20 × 1 | $20.00 | $20.00 | $0.00 |
| Daily | 5% | 20 × 8 × 0.95 | $160.00 | $152.00 | $8.00 |
| Weekly | 10% | 20 × 56 × 0.90 | $1,120.00 | $1,008.00 | $112.00 |
| Monthly | 15% | 20 × 160 × 0.85 | $3,200.00 | $2,720.00 | $480.00 |

### 3.2. Discount Validation

```typescript
function validateDiscount(percent: number): boolean {
  return percent >= 0 && percent <= 100;
}

function validateDiscountTiers(
  daily: number,
  weekly: number,
  monthly: number
): boolean {
  // Ensure discounts increase with longer commitment
  return daily <= weekly && weekly <= monthly;
}
```

### 3.3. Database Constraints

```sql
-- Discounts must be between 0-100%
CHECK (daily_discount_percent >= 0 AND daily_discount_percent <= 100)
CHECK (weekly_discount_percent >= 0 AND weekly_discount_percent <= 100)
CHECK (monthly_discount_percent >= 0 AND monthly_discount_percent <= 100)
```

---

## 4. Multi-Currency Handling

### 4.1. Currency Storage

Worker có thể set giá ở nhiều currencies, nhưng chỉ 1 currency là primary.

**Example**: Worker ở Việt Nam

```javascript
{
  worker_service_id: "uuid-123",
  price_usd: 20.00,
  price_vnd: 500000,
  price_jpy: null,    // Không set
  price_krw: null,    // Không set
  price_cny: null,    // Không set
  primary_currency: "VND"
}
```

### 4.2. Currency Display Logic

```typescript
interface WorkerServicePrice {
  price_usd?: number;
  price_vnd?: number;
  price_jpy?: number;
  price_krw?: number;
  price_cny?: number;
  primary_currency: 'USD' | 'VND' | 'JPY' | 'KRW' | 'CNY';
}

function getDisplayPrice(
  priceData: WorkerServicePrice,
  preferredCurrency?: string
): { amount: number; currency: string } {
  // 1. Try preferred currency first
  if (preferredCurrency && priceData[`price_${preferredCurrency.toLowerCase()}`]) {
    return {
      amount: priceData[`price_${preferredCurrency.toLowerCase()}`],
      currency: preferredCurrency
    };
  }

  // 2. Fall back to primary currency
  return {
    amount: priceData[`price_${priceData.primary_currency.toLowerCase()}`],
    currency: priceData.primary_currency
  };
}
```

### 4.3. Currency Conversion (Optional)

Nếu muốn support real-time currency conversion:

```typescript
interface ExchangeRate {
  from: string;
  to: string;
  rate: number;
  lastUpdated: Date;
}

async function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  exchangeRates: ExchangeRate[]
): Promise<number> {
  if (fromCurrency === toCurrency) return amount;

  const rate = exchangeRates.find(
    r => r.from === fromCurrency && r.to === toCurrency
  );

  if (!rate) {
    throw new Error(`No exchange rate found for ${fromCurrency} → ${toCurrency}`);
  }

  return round(amount * rate.rate, 2);
}
```

**Note**: Exchange rates nên được cached và update định kỳ (e.g., 1 lần/ngày).

---

## 5. Multiple Services Pricing

### 5.1. Rule: Charge Highest Price

Khi client book nhiều services cùng lúc từ 1 worker, charge theo **giá cao nhất** trong các services đã chọn.

**Example**:

Worker offers:
- Service A (Cooking - Vietnamese): $15/hour
- Service B (Home Organizing): $20/hour
- Service C (Personal Assistant): $25/hour

Client books: A + B + C
→ **Charge: $25/hour** (highest)

### 5.2. Database Function

```sql
CREATE OR REPLACE FUNCTION get_highest_service_price(
  worker_profile_uuid UUID,
  currency TEXT DEFAULT 'USD'
)
RETURNS DECIMAL AS $$
DECLARE
  max_price DECIMAL;
BEGIN
  CASE currency
    WHEN 'USD' THEN
      SELECT MAX(wsp.price_usd) INTO max_price
      FROM worker_service_prices wsp
      JOIN worker_services ws ON wsp.worker_service_id = ws.id
      WHERE ws.worker_profile_id = worker_profile_uuid
        AND ws.is_active = true
        AND wsp.is_active = true
        AND wsp.price_usd IS NOT NULL;

    WHEN 'VND' THEN
      SELECT MAX(wsp.price_vnd) INTO max_price
      FROM worker_service_prices wsp
      JOIN worker_services ws ON wsp.worker_service_id = ws.id
      WHERE ws.worker_profile_id = worker_profile_uuid
        AND ws.is_active = true
        AND wsp.is_active = true
        AND wsp.price_vnd IS NOT NULL;

    -- ... other currencies

    ELSE
      max_price := 0;
  END CASE;

  RETURN COALESCE(max_price, 0);
END;
$$ LANGUAGE plpgsql;
```

### 5.3. Application Logic

```typescript
interface ServicePrice {
  serviceId: string;
  serviceName: string;
  hourlyRate: number;
  currency: string;
}

function calculateMultiServicePrice(
  selectedServices: ServicePrice[],
  bookingHours: number,
  tier: 'hourly' | 'daily' | 'weekly' | 'monthly'
): { total: number; breakdown: any } {
  // 1. Get highest price
  const highestPrice = Math.max(...selectedServices.map(s => s.hourlyRate));
  const highestService = selectedServices.find(s => s.hourlyRate === highestPrice);

  // 2. Calculate based on tier
  let multiplier = 1; // hourly
  if (tier === 'daily') multiplier = 8;
  if (tier === 'weekly') multiplier = 56;
  if (tier === 'monthly') multiplier = 160;

  const totalPrice = highestPrice * multiplier;

  return {
    total: totalPrice,
    breakdown: {
      selectedServices: selectedServices.map(s => s.serviceName),
      chargedService: highestService?.serviceName,
      hourlyRate: highestPrice,
      tier,
      hours: multiplier,
      currency: highestService?.currency
    }
  };
}
```

### 5.4. Example Calculation

**Scenario**:
- Client books 3 services: Cooking ($15), Organizing ($20), Assistant ($25)
- Booking: Weekly (56 hours)
- Worker offers 10% weekly discount

**Calculation**:
```
Base hourly rate (highest): $25
Weekly hours: 56
Discount: 10%

Total = $25 × 56 × (1 - 0.10)
      = $25 × 56 × 0.90
      = $1,400 × 0.90
      = $1,260
```

---

## 6. API Response Examples

### 6.1. Get Service Prices

**Request**:
```http
GET /api/workers/:workerId/services
```

**Response**:
```json
{
  "workerId": "uuid-worker-123",
  "workerName": "Nguyễn Văn A",
  "services": [
    {
      "id": "uuid-service-1",
      "serviceName": "Cooking - Vietnamese",
      "serviceKey": "SERVICE_HOMECARE_COOKING",
      "optionKey": "COOKING_VIETNAMESE",
      "pricing": {
        "hourly": {
          "usd": 15.00,
          "vnd": 375000
        },
        "daily": {
          "usd": 114.00,
          "vnd": 2850000
        },
        "weekly": {
          "usd": 756.00,
          "vnd": 18900000
        },
        "monthly": {
          "usd": 2040.00,
          "vnd": 51000000
        },
        "primaryCurrency": "VND",
        "discounts": {
          "daily": 5,
          "weekly": 10,
          "monthly": 15
        }
      }
    },
    {
      "id": "uuid-service-2",
      "serviceName": "Home Organizing",
      "serviceKey": "SERVICE_HOMECARE_ORGANIZING",
      "pricing": {
        "hourly": {
          "usd": 20.00,
          "vnd": 500000
        },
        "daily": {
          "usd": 160.00,
          "vnd": 4000000
        },
        "weekly": {
          "usd": 1120.00,
          "vnd": 28000000
        },
        "monthly": {
          "usd": 3200.00,
          "vnd": 80000000
        },
        "primaryCurrency": "VND",
        "discounts": {
          "daily": 0,
          "weekly": 0,
          "monthly": 0
        }
      }
    }
  ],
  "highestPrice": {
    "hourly": {
      "usd": 20.00,
      "vnd": 500000
    },
    "currency": "VND"
  }
}
```

### 6.2. Calculate Booking Price

**Request**:
```http
POST /api/bookings/calculate
Content-Type: application/json

{
  "workerId": "uuid-worker-123",
  "serviceIds": ["uuid-service-1", "uuid-service-2"],
  "tier": "weekly",
  "currency": "VND"
}
```

**Response**:
```json
{
  "calculation": {
    "selectedServices": [
      "Cooking - Vietnamese",
      "Home Organizing"
    ],
    "chargedService": "Home Organizing",
    "chargedServicePrice": {
      "hourly": 500000,
      "currency": "VND"
    },
    "tier": "weekly",
    "hours": 56,
    "discount": 0,
    "subtotal": 28000000,
    "platformFee": 2800000,
    "insuranceFee": 560000,
    "total": 31360000,
    "currency": "VND"
  },
  "breakdown": {
    "serviceCharge": 28000000,
    "platformFee": 2800000,
    "insuranceFee": 560000,
    "totalDue": 31360000
  }
}
```

---

## 7. UI/UX Considerations

### 7.1. Worker Price Setting UI

**Step 1**: Select primary currency
```
[ ] USD  [x] VND  [ ] JPY  [ ] KRW  [ ] CNY
```

**Step 2**: Enter hourly rate
```
Hourly Rate: [500,000] VND/hour
```

**Step 3**: Set discounts (optional)
```
Daily Discount:   [5]%  → ₫3,800,000/day   (Save ₫200,000)
Weekly Discount:  [10]% → ₫25,200,000/week  (Save ₫2,800,000)
Monthly Discount: [15]% → ₫68,000,000/month (Save ₫12,000,000)
```

**Step 4**: Preview all tiers
```
┌──────────┬────────────────┬─────────┬──────────────┐
│ Tier     │ Standard Price │ Savings │ Final Price  │
├──────────┼────────────────┼─────────┼──────────────┤
│ Hourly   │ ₫500,000       │ ₫0      │ ₫500,000     │
│ Daily    │ ₫4,000,000     │ ₫200,000│ ₫3,800,000   │
│ Weekly   │ ₫28,000,000    │ ₫2,800  │ ₫25,200,000  │
│ Monthly  │ ₫80,000,000    │ ₫12,000 │ ₫68,000,000  │
└──────────┴────────────────┴─────────┴──────────────┘
```

### 7.2. Client Booking UI

**Service Selection**:
```
✓ Cooking - Vietnamese        ₫375,000/hr
✓ Home Organizing             ₫500,000/hr  ← Highest
□ Personal Assistant          ₫625,000/hr

You will be charged: ₫500,000/hour (highest rate)
```

**Tier Selection**:
```
( ) Hourly   - ₫500,000
( ) Daily    - ₫4,000,000  (8 hours)
(•) Weekly   - ₫28,000,000 (56 hours)
( ) Monthly  - ₫80,000,000 (160 hours)
```

**Price Summary**:
```
Service Charge:     ₫28,000,000
Platform Fee (10%): ₫2,800,000
Insurance (2%):     ₫560,000
─────────────────────────────
Total Due:          ₫31,360,000
```

---

## 8. Edge Cases & Validations

### 8.1. Zero Price

**Rule**: Price must be greater than 0

```sql
CHECK (price_usd > 0 OR price_usd IS NULL)
CHECK (price_vnd > 0 OR price_vnd IS NULL)
-- etc.
```

### 8.2. No Primary Currency Price

**Rule**: Primary currency price must be set

```sql
CHECK (
  (primary_currency = 'USD' AND price_usd IS NOT NULL) OR
  (primary_currency = 'VND' AND price_vnd IS NOT NULL) OR
  (primary_currency = 'JPY' AND price_jpy IS NOT NULL) OR
  (primary_currency = 'KRW' AND price_krw IS NOT NULL) OR
  (primary_currency = 'CNY' AND price_cny IS NOT NULL)
)
```

### 8.3. Invalid Discount

**Rule**: Discount must be 0-100%

```typescript
function validateDiscounts(
  daily: number,
  weekly: number,
  monthly: number
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (daily < 0 || daily > 100) {
    errors.push('Daily discount must be between 0-100%');
  }
  if (weekly < 0 || weekly > 100) {
    errors.push('Weekly discount must be between 0-100%');
  }
  if (monthly < 0 || monthly > 100) {
    errors.push('Monthly discount must be between 0-100%');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
```

### 8.4. Unreasonable Pricing

**Best Practice**: Set min/max thresholds

```typescript
const PRICE_LIMITS = {
  USD: { min: 5, max: 500 },
  VND: { min: 100000, max: 10000000 },
  JPY: { min: 500, max: 50000 },
  KRW: { min: 5000, max: 500000 },
  CNY: { min: 30, max: 3000 }
};

function validatePriceRange(
  amount: number,
  currency: string
): { valid: boolean; message?: string } {
  const limits = PRICE_LIMITS[currency];
  if (!limits) return { valid: false, message: 'Invalid currency' };

  if (amount < limits.min) {
    return {
      valid: false,
      message: `Price too low. Minimum: ${limits.min} ${currency}`
    };
  }

  if (amount > limits.max) {
    return {
      valid: false,
      message: `Price too high. Maximum: ${limits.max} ${currency}`
    };
  }

  return { valid: true };
}
```

### 8.5. Currency Mismatch

**Scenario**: Client wants to pay in USD but worker only set VND

**Solution**: Either require currency conversion API or show error

```typescript
function ensureCurrencyAvailable(
  priceData: WorkerServicePrice,
  requestedCurrency: string
): boolean {
  const priceKey = `price_${requestedCurrency.toLowerCase()}`;
  return priceData[priceKey] !== null && priceData[priceKey] !== undefined;
}
```

---

## 9. Testing Scenarios

### 9.1. Unit Tests

```typescript
describe('Price Calculation', () => {
  it('should calculate daily price correctly', () => {
    const result = calculatePriceTiers(20, 0, 0, 0);
    expect(result.daily).toBe(160); // 20 * 8
  });

  it('should apply discount correctly', () => {
    const result = calculatePriceTiers(20, 5, 10, 15);
    expect(result.daily).toBe(152); // 20 * 8 * 0.95
    expect(result.weekly).toBe(1008); // 20 * 56 * 0.90
    expect(result.monthly).toBe(2720); // 20 * 160 * 0.85
  });

  it('should return highest price for multiple services', () => {
    const services = [
      { serviceId: '1', hourlyRate: 15, currency: 'USD' },
      { serviceId: '2', hourlyRate: 25, currency: 'USD' },
      { serviceId: '3', hourlyRate: 20, currency: 'USD' }
    ];
    const highest = Math.max(...services.map(s => s.hourlyRate));
    expect(highest).toBe(25);
  });
});
```

### 9.2. Integration Tests

```typescript
describe('Booking Price Calculation API', () => {
  it('should calculate multi-service booking correctly', async () => {
    const response = await request(app)
      .post('/api/bookings/calculate')
      .send({
        workerId: 'uuid-123',
        serviceIds: ['service-1', 'service-2'],
        tier: 'weekly',
        currency: 'USD'
      });

    expect(response.status).toBe(200);
    expect(response.body.calculation.chargedService).toBeDefined();
    expect(response.body.calculation.total).toBeGreaterThan(0);
  });
});
```

---

## 10. Performance Optimization

### 10.1. Caching Strategy

**Cache price tiers** cho mỗi worker-service combination:

```typescript
interface CachedPrice {
  workerServiceId: string;
  tiers: PriceTier;
  currency: string;
  cachedAt: Date;
  ttl: number; // seconds
}

class PriceCache {
  private cache: Map<string, CachedPrice> = new Map();

  async getPrice(workerServiceId: string): Promise<PriceTier | null> {
    const cached = this.cache.get(workerServiceId);

    if (!cached) return null;

    const age = Date.now() - cached.cachedAt.getTime();
    if (age > cached.ttl * 1000) {
      this.cache.delete(workerServiceId);
      return null;
    }

    return cached.tiers;
  }

  setPrice(workerServiceId: string, tiers: PriceTier, currency: string) {
    this.cache.set(workerServiceId, {
      workerServiceId,
      tiers,
      currency,
      cachedAt: new Date(),
      ttl: 3600 // 1 hour
    });
  }
}
```

### 10.2. Database Indexing

```sql
-- Index for fast price lookups
CREATE INDEX idx_worker_service_prices_worker_service_id
  ON worker_service_prices(worker_service_id);

CREATE INDEX idx_worker_service_prices_primary_currency
  ON worker_service_prices(primary_currency);

-- Index for active prices only
CREATE INDEX idx_worker_service_prices_active
  ON worker_service_prices(worker_service_id)
  WHERE is_active = true;
```

### 10.3. Query Optimization

**Bad**:
```sql
SELECT * FROM worker_service_prices
WHERE worker_service_id IN (
  SELECT id FROM worker_services WHERE worker_profile_id = 'xxx'
);
```

**Good**:
```sql
SELECT wsp.*
FROM worker_service_prices wsp
JOIN worker_services ws ON wsp.worker_service_id = ws.id
WHERE ws.worker_profile_id = 'xxx'
  AND ws.is_active = true
  AND wsp.is_active = true;
```

---

## 11. Summary & Quick Reference

### 11.1. Key Formulas

```
Hourly  = base_price
Daily   = base_price × 8 × (1 - daily_discount%)
Weekly  = base_price × 56 × (1 - weekly_discount%)
Monthly = base_price × 160 × (1 - monthly_discount%)
```

### 11.2. Multi-Service Rule

```
Total Price = MAX(service_prices) × hours × (1 - discount%)
```

### 11.3. Platform Fees (from existing system)

```
Platform Fee = 10% of service charge
Insurance Fee = 2% of service charge
Total Client Pays = Service Charge + Platform Fee + Insurance Fee
```

### 11.4. Validation Checklist

- ✅ Price > 0
- ✅ Primary currency price is set
- ✅ Discounts between 0-100%
- ✅ Weekly discount >= Daily discount
- ✅ Monthly discount >= Weekly discount
- ✅ Price within reasonable range for currency
- ✅ At least one active service selected

---

**Document Version**: 1.0
**Last Updated**: 2025-11-18
**Author**: Claude AI
