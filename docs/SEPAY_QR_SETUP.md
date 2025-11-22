# Sepay QR Code Setup Guide

## 🎯 Overview

Hệ thống sử dụng **Sepay QR Code Service** để tạo mã QR thanh toán ngân hàng Việt Nam. Service này hoàn toàn miễn phí và không cần đăng ký.

**Official URL**: https://qr.sepay.vn

## 📋 Cách Hoạt Động

### 1. URL Format

```
https://qr.sepay.vn/img?acc=SO_TAI_KHOAN&bank=NGAN_HANG&amount=SO_TIEN&des=NOI_DUNG&template=TEMPLATE
```

### 2. Parameters

| Parameter  | Required | Description            | Example              |
| ---------- | -------- | ---------------------- | -------------------- |
| `acc`      | ✅ Yes   | Số tài khoản ngân hàng | `0349337240`         |
| `bank`     | ✅ Yes   | Mã ngân hàng           | `OCB`, `VCB`, `BIDV` |
| `amount`   | ✅ Yes   | Số tiền (VND)          | `720000`             |
| `des`      | ✅ Yes   | Nội dung chuyển khoản  | `ND9645161669`       |
| `template` | ❌ No    | Template hiển thị      | `compact2` (default) |
| `download` | ❌ No    | Download ảnh           | `true`               |

### 3. Templates

Sepay hỗ trợ các template sau:

- **`compact`**: Gọn nhẹ, chỉ QR + thông tin cơ bản
- **`compact2`**: Gọn nhẹ v2, có thêm logo ngân hàng ⭐ (Recommended)
- **`print`**: Đầy đủ thông tin, dễ in ấn
- **`qr_only`**: Chỉ có mã QR, không có text

## 🔧 Configuration

### Environment Variables

Thêm vào file `.env.local`:

```bash
# Bank Transfer Configuration
BANK_CODE=OCB
BANK_ACCOUNT=0349337240
BANK_QR_URL=https://qr.sepay.vn/img
```

### Bank Codes (Vietnam)

Các mã ngân hàng phổ biến:

| Ngân hàng   | Code       |
| ----------- | ---------- |
| VietcomBank | `VCB`      |
| BIDV        | `BIDV`     |
| VietinBank  | `ICB`      |
| Techcombank | `TCB`      |
| ACB         | `ACB`      |
| OCB         | `OCB`      |
| MB Bank     | `MB`       |
| Agribank    | `Agribank` |
| Sacombank   | `STB`      |
| TPBank      | `TPB`      |
| VPBank      | `VPB`      |

**Full list**: [Xem danh sách đầy đủ](https://api.vietqr.io/v2/banks)

## 💻 Implementation

### Current Implementation

File: `lib/wallet/payment-gateways.ts`

```typescript
export class BankTransferService {
  private config: BankTransferConfig = {
    bank: process.env.BANK_CODE || "OCB",
    account: process.env.BANK_ACCOUNT || "0349337240",
    baseUrl: process.env.BANK_QR_URL || "https://qr.sepay.vn/img",
  };

  generateQRCode(params: {
    amount: number;
    content: string;
    template?: "compact" | "compact2" | "print" | "qr_only";
  }): string {
    const { amount, content, template = "compact2" } = params;

    const queryParams = new URLSearchParams({
      acc: this.config.account,
      bank: this.config.bank,
      amount: amount.toString(),
      des: content,
      template: template,
    });

    return `${this.config.baseUrl}?${queryParams.toString()}`;
  }
}
```

### Example Usage

```typescript
const bankService = createBankTransferService();

const qrUrl = bankService.generateQRCode({
  amount: 720000, // VND
  content: "ND9645161669",
  template: "compact2", // Optional
});

// Result:
// https://qr.sepay.vn/img?acc=0349337240&bank=OCB&amount=720000&des=ND9645161669&template=compact2
```

## 🎨 QR Code Display

### In DepositModal

File: `components/wallet/DepositModal.tsx`

```tsx
<QRCode
  value={bankDeposit.qr_code_url}
  size={256}
  style={{ margin: "0 auto" }}
/>
```

### Generated URL Example

```
https://qr.sepay.vn/img?acc=0349337240&bank=OCB&amount=720000&des=ND9645161669&template=compact2
```

This URL returns an **image** (PNG) that can be:

- Displayed directly in `<img>` tag
- Used in QRCode component
- Downloaded by users
- Scanned by banking apps

## ✅ Advantages

### 1. Miễn Phí & Không Cần Đăng Ký

- Không cần tạo tài khoản
- Không có API key
- Không giới hạn request

### 2. Tương Thích Tất Cả Ngân Hàng

- Hỗ trợ tất cả ngân hàng Việt Nam
- QR Code chuẩn VietQR
- Quét được bằng mọi app banking

### 3. Dễ Dàng Sử Dụng

- Chỉ cần gọi URL với params
- Nhận ảnh QR trực tiếp
- Không cần xử lý phức tạp

### 4. Nhanh & Ổn Định

- CDN toàn cầu
- Uptime cao
- Response time < 100ms

## 🔐 Security

### Transfer Content Format

Hệ thống tạo mã unique cho mỗi giao dịch:

```typescript
generateTransferContent(): string {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `ND${timestamp}${random}`;
}

// Example: ND9645161669
```

Format:

- `ND` - Prefix (Nạp Deposit)
- `964516` - Timestamp (6 digits)
- `1669` - Random (4 digits)

**Total: 12 characters**, unique for each transaction.

## 📱 Mobile Scanning Flow

1. User clicks "Deposit" → Enter amount
2. System generates:
   - Unique transfer content (e.g., `ND9645161669`)
   - Sepay QR URL with parameters
3. QR Code displayed in modal
4. User opens banking app → Scan QR
5. Banking app auto-fills:
   - Bank: OCB
   - Account: 0349337240
   - Amount: 720.000 VND
   - Content: ND9645161669
6. User confirms transfer
7. Webhook receives notification
8. System credits wallet automatically

## 🔄 Alternative QR Services

Nếu cần, có thể chuyển sang các service khác:

### 1. VietQR API

```bash
https://api.vietqr.io/v2/generate
```

- Cần API key
- Có tính phí
- Nhiều tính năng hơn

### 2. Custom QR Generator

- Tự host QR generator
- Full control
- Tốn resource

## 📝 Notes

1. **Amount**: Phải là số nguyên VND (không có phần thập phân)
2. **Content**: Tối đa 25 ký tự, không dấu
3. **Template**: Default là `compact2` (đẹp nhất)
4. **Caching**: Browser tự cache ảnh QR, không cần cache backend

## 🆘 Troubleshooting

### QR không hiển thị

- ✅ Check internet connection
- ✅ Verify bank code đúng
- ✅ Verify account number đúng
- ✅ Check amount > 0

### QR quét không được

- ✅ Đảm bảo content không có dấu
- ✅ Check bank code khớp với ngân hàng thật
- ✅ Verify account number chính xác

### Webhook không nhận

- ✅ Check transfer content khớp chính xác
- ✅ Verify amount trong khoảng tolerance
- ✅ Check deposit chưa expired

## 🔗 References

- **Sepay QR**: https://qr.sepay.vn
- **VietQR Standard**: https://vietqr.io
- **VietQR API**: https://api.vietqr.io/docs

---

**Last Updated**: November 17, 2025  
**Version**: 1.0.0  
**Status**: ✅ Production Ready
