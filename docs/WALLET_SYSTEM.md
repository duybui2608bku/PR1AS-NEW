# Wallet System Documentation

Complete wallet and payment system for PR1AS platform supporting USD transactions, escrow holds, and multiple payment methods.

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Database Schema](#database-schema)
4. [API Endpoints](#api-endpoints)
5. [Payment Flow](#payment-flow)
6. [Integration Guide](#integration-guide)
7. [Admin Operations](#admin-operations)
8. [Security](#security)

---

## Overview

The wallet system provides:

- **Digital Wallets**: Each user (worker/employer) has a USD wallet
- **Escrow System**: Payments held in escrow with cooling period (3-7 days)
- **Payment Methods**:
  - Bank transfer (Vietnam - QR code via Sepay)
  - PayPal (deposits and withdrawals)
- **Fee Management**: Configurable platform fees and insurance fund
- **Complaint Handling**: Dispute resolution system for payments
- **Auto-release**: Automatic payment release after cooling period

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Client Layer                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Employer   │  │    Worker    │  │    Admin     │     │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │
└─────────┼──────────────────┼──────────────────┼─────────────┘
          │                  │                  │
          │  Wallet API Client (lib/wallet/api-client.ts)
          │                  │                  │
┌─────────▼──────────────────▼──────────────────▼─────────────┐
│                    API Routes Layer                          │
│  /api/wallet/*          /api/admin/wallet/*                 │
│  - balance              - stats                              │
│  - deposit              - settings                           │
│  - withdraw             - escrow/release                     │
│  - payment              - escrow/resolve                     │
│  - transactions                                              │
│  - escrow                                                    │
└──────────────────────────┬───────────────────────────────────┘
                           │
┌──────────────────────────▼───────────────────────────────────┐
│                   Service Layer                              │
│  WalletService (lib/wallet/service.ts)                      │
│  - Business logic                                            │
│  - Fee calculations                                          │
│  - Escrow management                                         │
│  - Transaction handling                                      │
└──────────────────────────┬───────────────────────────────────┘
                           │
┌──────────────────────────▼───────────────────────────────────┐
│              Payment Gateways Layer                          │
│  BankTransferService | PayPalService                        │
│  - QR code generation    - Order creation                    │
│  - Webhook processing    - Payout processing                 │
└──────────────────────────┬───────────────────────────────────┘
                           │
┌──────────────────────────▼───────────────────────────────────┐
│                  Database (Supabase)                         │
│  - wallets              - escrow_holds                       │
│  - transactions         - bank_deposits                      │
│  - platform_settings                                         │
└──────────────────────────────────────────────────────────────┘
```

---

## Database Schema

### Tables

#### 1. **wallets**

User wallet balances and statistics.

```sql
- id: UUID (PK)
- user_id: UUID (FK to auth.users)
- balance_usd: DECIMAL (available balance)
- pending_usd: DECIMAL (locked in escrow/withdrawals)
- total_earned_usd: DECIMAL
- total_spent_usd: DECIMAL
- currency: TEXT (always 'USD')
- status: TEXT (active/frozen/suspended)
- created_at, updated_at: TIMESTAMP
```

#### 2. **transactions**

All financial movements in the system.

```sql
- id: UUID (PK)
- user_id: UUID (FK)
- wallet_id: UUID (FK)
- type: TEXT (deposit, withdrawal, payment, earning, etc.)
- amount_usd: DECIMAL
- balance_before_usd, balance_after_usd: DECIMAL
- payment_method: TEXT (paypal, bank_transfer, escrow, internal)
- payment_gateway_id: TEXT (external reference)
- status: TEXT (pending, processing, completed, failed, cancelled)
- escrow_id, job_id, related_user_id: UUID
- description: TEXT
- metadata: JSONB
- created_at, completed_at, failed_at: TIMESTAMP
```

#### 3. **escrow_holds**

Payments held in escrow during cooling period.

```sql
- id: UUID (PK)
- employer_id, worker_id: UUID (FK)
- job_id: UUID
- total_amount_usd: DECIMAL (original payment)
- platform_fee_usd: DECIMAL
- insurance_fee_usd: DECIMAL
- worker_amount_usd: DECIMAL (after fees)
- status: TEXT (held, released, refunded, disputed, cancelled)
- payment_transaction_id, release_transaction_id: UUID
- cooling_period_days: INTEGER
- hold_until: TIMESTAMP (auto-release date)
- has_complaint: BOOLEAN
- complaint_description, resolution_notes: TEXT
- complaint_filed_at, resolved_by: ...
- created_at, released_at, updated_at: TIMESTAMP
```

#### 4. **bank_deposits**

Bank transfer deposits waiting for confirmation.

```sql
- id: UUID (PK)
- user_id: UUID (FK)
- amount_usd, amount_vnd: DECIMAL
- qr_code_url: TEXT
- bank_account, bank_name: TEXT
- transfer_content: TEXT (unique code like ND73333)
- status: TEXT (pending, verifying, completed, expired, failed)
- webhook_received: BOOLEAN
- webhook_data: JSONB
- bank_reference_code: TEXT
- bank_transaction_id: BIGINT
- transaction_id: UUID (FK)
- created_at, expires_at, verified_at, completed_at: TIMESTAMP
```

#### 5. **platform_settings**

Platform-wide configuration.

```sql
- id: UUID (PK)
- key: TEXT (unique)
- value: JSONB
- description: TEXT
- updated_by: UUID (FK)
- created_at, updated_at: TIMESTAMP
```

**Default Settings:**

- `payment_fees_enabled`: true
- `platform_fee_percentage`: 10 (10%)
- `insurance_fund_percentage`: 2 (2%)
- `escrow_cooling_period_days`: 7
- `minimum_deposit_usd`: 10
- `minimum_withdrawal_usd`: 20

---

## API Endpoints

### User APIs

#### Wallet Balance

```
GET /api/wallet/balance
Headers: Authorization: Bearer {token}
Response: { wallet, summary }
```

#### Deposit

```
POST /api/wallet/deposit
Headers: Authorization: Bearer {token}
Body: {
  amount_usd: number,
  payment_method: "bank_transfer" | "paypal",
  metadata?: object
}
Response: { deposit, qr_code_url } or { paypal.approval_url }
```

#### Withdraw

```
POST /api/wallet/withdraw
Headers: Authorization: Bearer {token}
Body: {
  amount_usd: number,
  payment_method: "bank_transfer" | "paypal",
  destination: {
    paypal_email?: string,
    bank_account?: string,
    bank_name?: string,
    account_holder?: string
  }
}
Response: { transaction }
```

#### Transactions

```
GET /api/wallet/transactions?page=1&limit=20&type=deposit,earning
Headers: Authorization: Bearer {token}
Response: { transactions[], pagination }
```

#### Payment (Employer → Worker)

```
POST /api/wallet/payment
Headers: Authorization: Bearer {token}
Body: {
  worker_id: string,
  job_id?: string,
  amount_usd: number,
  description?: string,
  cooling_period_days?: number
}
Response: { escrow, transaction }
```

#### Escrows

```
GET /api/wallet/escrow?status=held,disputed
Headers: Authorization: Bearer {token}
Response: { escrows[], pagination }
```

#### File Complaint

```
POST /api/wallet/escrow/complaint
Headers: Authorization: Bearer {token}
Body: {
  escrow_id: string,
  description: string
}
Response: { escrow }
```

#### Calculate Fees

```
GET /api/wallet/fees?amount=100
Response: { calculation: { total_amount, platform_fee, insurance_fee, worker_amount } }
```

### Admin APIs

#### Statistics

```
GET /api/admin/wallet/stats
Headers: Authorization: Bearer {admin_token}
Response: { stats: { total_wallets, total_balance, platform_revenue, ... } }
```

#### Settings

```
GET /api/admin/wallet/settings
PUT /api/admin/wallet/settings
Headers: Authorization: Bearer {admin_token}
Body: { key: string, value: any }
Response: { settings }
```

#### Release Escrow

```
POST /api/admin/wallet/escrow/release
Headers: Authorization: Bearer {admin_token}
Body: { escrow_id: string }
Response: { transaction }
```

#### Resolve Complaint

```
POST /api/admin/wallet/escrow/resolve
Headers: Authorization: Bearer {admin_token}
Body: {
  escrow_id: string,
  action: "release_to_worker" | "refund_to_employer" | "partial_refund",
  worker_amount?: number,
  employer_refund?: number,
  resolution_notes: string
}
Response: { escrow }
```

### Webhook

#### Bank Transfer Webhook

```
POST /api/wallet/webhook/bank
Body: {
  gateway: "OCB",
  transactionDate: "2025-06-15 00:09:00",
  accountNumber: "0349337240",
  content: "ND73333",
  transferType: "in",
  transferAmount: 240000,
  referenceCode: "FT251673K4TV",
  id: 14966645
}
Response: { success: true, depositId, transactionId }
```

---

## Payment Flow

### 1. Employer Books & Pays

```
┌──────────────────────────────────────────────────────────┐
│ Employer pays 500 USD                                    │
└───────────────────┬──────────────────────────────────────┘
                    │
                    ▼
┌──────────────────────────────────────────────────────────┐
│ Platform Account (Escrow)                                │
│ ├─ Platform Fee:    50 USD (10%)                        │
│ ├─ Insurance Fund:  10 USD (2%)                         │
│ └─ Pending Worker: 440 USD                              │
└──────────────────────────────────────────────────────────┘
                    │
                    ▼ Deduct from employer wallet
┌──────────────────────────────────────────────────────────┐
│ Employer Wallet: -500 USD                                │
└──────────────────────────────────────────────────────────┘
```

**Code:**

```typescript
const result = await walletAPI.makePayment({
  worker_id: "worker-uuid",
  job_id: "job-123",
  amount_usd: 500,
  description: "Payment for job completion",
});
// result: { escrow, transaction }
```

### 2. Cooling Period

```
┌──────────────────────────────────────────────────────────┐
│ Job Completed                                            │
└───────────────────┬──────────────────────────────────────┘
                    │
                    ▼ Wait 3-7 days
┌──────────────────────────────────────────────────────────┐
│ Cooling Period                                           │
│ ├─ No complaint? ✅ → Auto-release to worker           │
│ └─ Complaint? ⚠️ → Hold for admin review              │
└──────────────────────────────────────────────────────────┘
```

### 3. Release or Dispute

**No Complaint (Auto-release):**

```
Cron job checks: escrow.hold_until <= NOW()
→ Release 440 USD to worker wallet
```

**With Complaint:**

```typescript
// User files complaint
await walletAPI.fileComplaint(escrowId, "Work not completed properly");

// Admin resolves
await adminWalletAPI.resolveComplaint({
  escrow_id: escrowId,
  action: "partial_refund",
  worker_amount: 200,
  employer_refund: 300,
  resolution_notes: "Partial work completed",
});
```

---

## Integration Guide

### 1. Setup Environment Variables

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# PayPal (optional)
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_secret
PAYPAL_MODE=sandbox # or live

# Cron security
CRON_SECRET=your_random_secret

# App URL
NEXT_PUBLIC_APP_URL=https://yourapp.com
```

### 2. Run Database Migration

```bash
# Connect to your Supabase project and run:
psql -h your-db-host -U postgres -d postgres < lib/supabase/migrations/create_wallet_system.sql
```

### 3. Setup Cron Jobs

**Option A: Vercel Cron**

Create `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/release-escrows",
      "schedule": "0 * * * *"
    },
    {
      "path": "/api/cron/expire-deposits",
      "schedule": "*/30 * * * *"
    }
  ]
}
```

**Option B: External Cron Service**

Use services like cron-job.org or EasyCron:

- URL: `https://yourapp.com/api/cron/release-escrows`
- Schedule: Every hour
- Header: `Authorization: Bearer YOUR_CRON_SECRET`

### 4. Client Integration

```typescript
import { walletAPI, walletHelpers } from "@/lib/wallet/api-client";

// Get balance
const { wallet, summary } = await walletAPI.getBalance();
console.log(walletHelpers.formatUSD(wallet.balance_usd));

// Deposit with bank transfer
const deposit = await walletAPI.depositBankTransfer(100, 2400000); // 100 USD = 2.4M VND
// Show QR code: deposit.qr_code_url

// Make payment
const payment = await walletAPI.makePayment({
  worker_id: workerId,
  amount_usd: 500,
  job_id: jobId,
});

// View transactions
const { transactions } = await walletAPI.getTransactions({
  type: ["earning", "payment"],
  page: 1,
  limit: 20,
});
```

---

## Admin Operations

### Fee Configuration

```typescript
import { adminWalletAPI } from "@/lib/wallet/api-client";

// Disable fees
await adminWalletAPI.updateSetting("payment_fees_enabled", false);

// Update fee percentages
await adminWalletAPI.updateSetting("platform_fee_percentage", 8); // 8%
await adminWalletAPI.updateSetting("insurance_fund_percentage", 1); // 1%

// Update cooling period
await adminWalletAPI.updateSetting("escrow_cooling_period_days", 5); // 5 days
```

### Monitor Platform

```typescript
const stats = await adminWalletAPI.getStats();
console.log({
  totalWallets: stats.total_wallets,
  totalBalance: walletHelpers.formatUSD(stats.total_balance),
  platformRevenue: walletHelpers.formatUSD(stats.platform_revenue),
  activeEscrows: stats.total_escrows_active,
  complaints: stats.total_complaints,
});
```

### Resolve Disputes

```typescript
// Release to worker
await adminWalletAPI.resolveComplaint({
  escrow_id: escrowId,
  action: "release_to_worker",
  resolution_notes: "Work verified as complete",
});

// Refund to employer
await adminWalletAPI.resolveComplaint({
  escrow_id: escrowId,
  action: "refund_to_employer",
  resolution_notes: "Worker did not complete work",
});

// Partial refund (split)
await adminWalletAPI.resolveComplaint({
  escrow_id: escrowId,
  action: "partial_refund",
  worker_amount: 300,
  employer_refund: 200,
  resolution_notes: "Partial completion agreed",
});
```

---

## Security

### 1. Authentication

- All wallet APIs require valid JWT token
- Admin APIs require admin role verification
- Webhook endpoints use secret verification

### 2. Authorization

- Users can only access their own wallets
- Employers can only pay workers
- Workers can only receive payments
- Admins have full access

### 3. RLS Policies

- Supabase Row Level Security enforces access control
- Users see only their own transactions
- Escrows visible to involved parties only

### 4. Validation

- Minimum deposit/withdrawal amounts
- Balance checks before payments
- Fee calculations server-side only
- Webhook payload verification

### 5. Audit Trail

- All transactions recorded with metadata
- Balance before/after tracking
- Admin actions logged with resolver ID

---

## Testing

### Test Bank Deposit Flow

1. Create deposit request:

```bash
curl -X POST http://localhost:3000/api/wallet/deposit \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"amount_usd": 100, "payment_method": "bank_transfer"}'
```

2. Simulate webhook:

```bash
curl -X POST http://localhost:3000/api/wallet/webhook/bank \
  -H "Content-Type: application/json" \
  -d '{
    "gateway": "OCB",
    "transactionDate": "2025-11-17 10:00:00",
    "accountNumber": "0349337240",
    "content": "ND123456",
    "transferType": "in",
    "transferAmount": 2400000,
    "referenceCode": "TEST123",
    "id": 999999
  }'
```

### Test Payment Flow

```typescript
// 1. Employer pays worker
const payment = await walletAPI.makePayment({
  worker_id: workerUserId,
  amount_usd: 100,
  job_id: "test-job-123",
});

// 2. Check escrow created
const { escrows } = await walletAPI.getEscrows({ status: ["held"] });

// 3. Manually trigger release (as admin)
await adminWalletAPI.releaseEscrow(payment.escrow.id);

// 4. Verify worker received payment
const { wallet } = await walletAPI.getBalance();
```

---

## Troubleshooting

### Issue: Webhook not receiving data

- Verify Sepay webhook URL is configured correctly
- Check webhook logs in Supabase
- Test with manual curl request

### Issue: Escrow not auto-releasing

- Verify cron job is running (`/api/cron/release-escrows`)
- Check `escrow_holds.hold_until` date
- Ensure no complaints filed (`has_complaint = false`)

### Issue: Insufficient balance

- Check `wallets.balance_usd` vs `pending_usd`
- Verify transaction completed successfully
- Check for failed transactions

---

## Support

For issues or questions:

1. Check logs in Supabase Dashboard
2. Review transaction history
3. Contact platform support with transaction ID

---

**Version:** 1.0.0  
**Last Updated:** November 17, 2025
