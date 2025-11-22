# Wallet System - Client Guide

## Overview

The wallet system provides a complete financial management solution for both clients (employers) and workers on the platform. Users can deposit funds, withdraw earnings, and track all their transactions in one place.

## Features

### 🏦 Wallet Balance

- View available balance in USD
- Track pending transactions
- Monitor total earnings and spending
- See active escrow holds
- Real-time balance updates

### 💰 Deposit Money

- **Bank Transfer (Vietnam)**: Deposit via QR code with automatic confirmation
- **PayPal**: Quick deposit with instant redirection to PayPal
- Minimum deposit: $10 USD
- Auto-confirmation within 1-5 minutes for bank transfers

### 💸 Withdraw Money

- **Bank Transfer**: Withdraw to Vietnamese bank accounts
- **PayPal**: Withdraw to PayPal accounts
- Minimum withdrawal: $50 USD
- Processing time: 1-3 business days

### 📊 Transaction History

- View all transactions with filters
- Filter by type (deposit, withdrawal, payment, earning, etc.)
- Filter by status (pending, completed, failed, etc.)
- Filter by date range
- Export transaction history

## Pages Created

### Client Wallet Page

**Path**: `/client/wallet`

Features:

- Wallet balance overview
- Quick deposit button
- Quick withdraw button
- Complete transaction history
- Responsive design for mobile and desktop

### Worker Wallet Page

**Path**: `/worker/wallet`

Features:

- Same features as client wallet
- Focus on earnings tracking
- Withdraw earnings functionality

## Components

### 1. WalletBalance Component

Location: `components/wallet/WalletBalance.tsx`

Displays:

- Available balance
- Pending balance
- Total earned
- Total spent
- Active escrows
- Deposit/Withdraw buttons

Usage:

```tsx
import { WalletBalance } from "@/components/wallet";

<WalletBalance
  onDeposit={() => setDepositModalOpen(true)}
  onWithdraw={() => setWithdrawModalOpen(true)}
/>;
```

### 2. DepositModal Component

Location: `components/wallet/DepositModal.tsx`

Features:

- Two tabs: Bank Transfer and PayPal
- Bank Transfer: Generates QR code for scanning
- PayPal: Redirects to PayPal payment page
- Form validation
- Real-time feedback

Usage:

```tsx
import { DepositModal } from "@/components/wallet";

<DepositModal
  open={depositModalOpen}
  onClose={() => setDepositModalOpen(false)}
  onSuccess={handleDepositSuccess}
/>;
```

### 3. WithdrawModal Component

Location: `components/wallet/WithdrawModal.tsx`

Features:

- Two tabs: Bank Transfer and PayPal
- Bank Transfer: Collect bank account details
- PayPal: Collect PayPal email
- Form validation
- Minimum amount check

Usage:

```tsx
import { WithdrawModal } from "@/components/wallet";

<WithdrawModal
  open={withdrawModalOpen}
  onClose={() => setWithdrawModalOpen(false)}
  onSuccess={handleWithdrawSuccess}
/>;
```

### 4. TransactionHistory Component

Location: `components/wallet/TransactionHistory.tsx`

Features:

- Paginated table of transactions
- Multiple filters (type, status, date range)
- Sortable columns
- Responsive design
- Export functionality (coming soon)

Usage:

```tsx
import { TransactionHistory } from "@/components/wallet";

<TransactionHistory />;
```

## API Integration

All components use the wallet API client located at `lib/wallet/api-client.ts`:

### Available API Methods

```typescript
// Get wallet balance
await walletAPI.getBalance();

// Deposit via bank transfer
await walletAPI.depositBankTransfer(amountUsd, amountVnd);

// Deposit via PayPal
await walletAPI.depositPayPal(amountUsd);

// Withdraw to bank
await walletAPI.withdrawBank(amountUsd, bankAccount, bankName, accountHolder);

// Withdraw to PayPal
await walletAPI.withdrawPayPal(amountUsd, paypalEmail);

// Get transactions
await walletAPI.getTransactions(filters);

// Calculate fees
await walletAPI.calculateFees(amount);
```

## Navigation

Both client and worker layouts have been updated to include a "My Wallet" menu item:

- **Client**: Second item in the sidebar menu (after Dashboard)
- **Worker**: Second item in the sidebar menu (after Dashboard)

## Payment Flow

### Client Deposit Flow

1. Client clicks "Deposit" button on wallet page
2. DepositModal opens with two options:

   - **Bank Transfer**:
     - Enter amount in USD
     - System generates QR code
     - Client scans QR with banking app
     - Auto-confirmation within minutes
   - **PayPal**:
     - Enter amount in USD
     - Redirect to PayPal
     - Complete payment on PayPal
     - Auto-redirect back to platform

3. Balance updates automatically
4. Transaction appears in history

### Worker Withdrawal Flow

1. Worker clicks "Withdraw" button
2. WithdrawModal opens with two options:

   - **Bank Transfer**:
     - Enter amount, bank name, account number, account holder
     - Submit request
     - Processing within 1-3 business days
   - **PayPal**:
     - Enter amount and PayPal email
     - Submit request
     - Processing within 1-2 business days

3. Transaction status updates in real-time
4. Worker receives notification when complete

## Security Features

- 🔐 All transactions require authentication
- 🛡️ Escrow protection for payments
- 🔒 Secure payment gateway integration
- ✅ Transaction verification
- 📝 Complete audit trail

## Mobile Responsive

All wallet pages and components are fully responsive and optimized for:

- Mobile phones (< 576px)
- Tablets (576px - 992px)
- Desktop (> 992px)

## Error Handling

All components include comprehensive error handling:

- Network errors
- Authentication errors
- Validation errors
- Payment gateway errors
- User-friendly error messages

## Future Enhancements

- [ ] Multi-currency support
- [ ] Cryptocurrency deposits
- [ ] Automatic recurring payments
- [ ] Invoice generation
- [ ] Export transactions to CSV/PDF
- [ ] Email notifications for transactions
- [ ] SMS notifications for large transactions
- [ ] Two-factor authentication for withdrawals

## Testing

To test the wallet system:

1. **As a Client**:

   - Navigate to `/client/wallet`
   - Test deposit flow with small amount
   - Verify transaction appears in history
   - Test withdraw flow (requires balance)

2. **As a Worker**:
   - Navigate to `/worker/wallet`
   - Complete a job to earn money
   - Test withdraw flow
   - Verify transaction history

## Troubleshooting

### Deposit not showing up

- Wait 1-5 minutes for bank transfers
- Check transaction history for pending status
- Verify transfer content was correct
- Contact support if issue persists

### Withdrawal delayed

- Processing time is 1-3 business days
- Check transaction status in history
- Verify bank/PayPal details are correct
- Contact support if delayed beyond 3 days

### Balance not updating

- Click the "Refresh" button on wallet balance
- Check browser console for errors
- Verify authentication is valid
- Try logging out and back in

## Support

For issues or questions about the wallet system:

- Email: support@pr1as.com
- Help Center: https://help.pr1as.com
- Live Chat: Available on wallet page

---

**Last Updated**: November 17, 2025  
**Version**: 1.0.0
