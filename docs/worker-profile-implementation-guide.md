# Worker Profile System - Implementation Guide

## Overview

Complete full-stack implementation of the worker profile system with:
- ✅ Database schema (9 tables with migrations)
- ✅ Service layer with business logic
- ✅ RESTful API endpoints (11 routes)
- ✅ Client API wrappers
- ✅ UI components with Ant Design
- ✅ 2-step profile setup wizard
- ✅ Multi-currency pricing system
- ✅ Image upload integration

---

## Files Created

### Database (Already Run)
```
lib/supabase/migrations/
├── create_service_system.sql           # Services, categories, options
└── create_worker_profile_system.sql    # Worker profiles, tags, images, pricing
```

### Backend Layer
```
lib/
├── utils/
│   └── enums.ts                        # Added worker enums
├── worker/
│   ├── types.ts                        # TypeScript definitions
│   ├── service.ts                      # WorkerProfileService class
│   └── api-client.ts                   # Frontend API wrapper

app/api/
├── services/
│   ├── route.ts                        # GET /api/services
│   ├── categories/route.ts             # GET /api/services/categories
│   └── [id]/route.ts                   # GET /api/services/:id
├── worker/
│   ├── profile/
│   │   ├── route.ts                    # GET/POST /api/worker/profile
│   │   ├── submit/route.ts             # PATCH /api/worker/profile/submit
│   │   └── publish/route.ts            # PATCH /api/worker/profile/publish
│   ├── services/
│   │   ├── route.ts                    # GET/POST /api/worker/services
│   │   ├── [id]/route.ts               # DELETE /api/worker/services/:id
│   │   └── [id]/price/route.ts         # PATCH /api/worker/services/:id/price
│   └── images/
│       ├── route.ts                    # POST /api/worker/images
│       └── [id]/route.ts               # DELETE /api/worker/images/:id
```

### Frontend Layer
```
app/worker/profile/setup/
└── page.tsx                            # Main profile setup wizard

components/worker/
├── Step1BasicInfo.tsx                  # Step 1: Basic information form
├── Step2ServicesAndPricing.tsx         # Step 2: Services & pricing
├── ServiceSelector.tsx                 # Modal for selecting services
└── ServiceCard.tsx                     # Display service with pricing
```

---

## Quick Start

### 1. Migrations Already Run ✅

The database tables have been created with the following structure:

**Service System:**
- `service_categories` - 4 categories (Homecare, Grooming, Assistance, Companionship)
- `services` - 30+ services with i18n keys
- `service_options` - Options (cuisines, language pairs, haircare types, etc.)

**Worker Profile System:**
- `worker_profiles` - Extended user information
- `worker_tags` - Interests and hobbies
- `worker_availabilities` - Weekly schedule
- `worker_images` - Avatar and gallery
- `worker_services` - Many-to-many worker ↔ services
- `worker_service_prices` - Multi-currency pricing

### 2. Add i18n Translation Keys

Add the following keys to your translation files:

**English (`public/locales/en/common.json`):**
```json
{
  "worker": {
    "profile": {
      "setupTitle": "Setup Your Worker Profile",
      "step1Title": "Basic Information",
      "step1Desc": "Tell us about yourself",
      "step2Title": "Services & Pricing",
      "step2Desc": "Add services and set prices",
      "submitTitle": "Submit for Review",
      "submitDesc": "Review and submit",

      "basicInfoTitle": "Basic Information",
      "basicInfoDesc": "Please fill in your personal information",
      "personalInfo": "Personal Information",
      "aboutYou": "About You",

      "fullName": "Full Name",
      "fullNameRequired": "Full name is required",
      "fullNamePlaceholder": "Enter your full name",
      "nickname": "Nickname",
      "nicknamePlaceholder": "Enter a nickname (optional)",
      "age": "Age",
      "ageRequired": "Age is required",
      "ageRange": "Age must be between 18 and 100",
      "height": "Height",
      "weight": "Weight",
      "zodiacSign": "Zodiac Sign",
      "zodiacSignPlaceholder": "Select your zodiac sign",
      "lifestyle": "Lifestyle",
      "lifestylePlaceholder": "Select your lifestyle",
      "personalQuote": "Personal Quote",
      "personalQuotePlaceholder": "A quote that represents you",
      "bio": "Bio",
      "bioPlaceholder": "Tell us about yourself...",
      "interestsAndHobbies": "Interests & Hobbies",
      "addTagPlaceholder": "Add a tag",

      "servicesAndPricingTitle": "Services & Pricing",
      "servicesAndPricingDesc": "Add services you offer and set your prices",
      "imagesSection": "Profile Images",
      "avatar": "Avatar",
      "avatarHint": "Upload a professional photo of yourself",
      "avatarRequired": "Avatar is required",
      "avatarUploaded": "Avatar uploaded successfully",
      "gallery": "Gallery",
      "galleryHint": "Add more photos to showcase yourself",
      "imageAdded": "Image added successfully",

      "servicesSection": "Services",
      "addService": "Add Service",
      "addFirstService": "Add Your First Service",
      "noServicesYet": "No services added yet",
      "atLeastOneService": "Please add at least one service",
      "selectService": "Select a Service",
      "selectServiceHint": "Choose a service and set your price",
      "service": "Service",
      "serviceRequired": "Please select a service",
      "selectServicePlaceholder": "Search and select a service",
      "serviceOption": "Service Option",
      "serviceOptionRequired": "Please select an option",
      "selectOptionPlaceholder": "Select an option",

      "pricing": "Pricing",
      "hourlyRate": "Hourly Rate",
      "hourlyRateRequired": "Hourly rate is required",
      "hourlyRateMin": "Hourly rate must be at least 1",
      "currency": "Currency",
      "optionalDiscounts": "Optional Discounts (for long-term bookings)",
      "dailyDiscount": "Daily Discount",
      "weeklyDiscount": "Weekly Discount",
      "monthlyDiscount": "Monthly Discount",
      "pricePreview": "Price Preview",
      "hourly": "Hourly",
      "daily": "Daily",
      "weekly": "Weekly",
      "monthly": "Monthly",

      "serviceAddedSuccess": "Service added successfully",
      "serviceRemoved": "Service removed successfully",
      "confirmRemoveService": "Are you sure you want to remove this service?",

      "readyToSubmit": "Ready to Submit!",
      "readyToSubmitDesc": "Your profile is complete. Submit it for admin review to get started.",
      "submitForReview": "Submit for Review",
      "submitSuccess": "Profile submitted successfully! We'll review it soon.",

      "underReview": "Profile Under Review",
      "underReviewDesc": "Your profile is being reviewed by our team. We'll notify you once it's approved.",
      "approved": "Profile Approved",
      "approvedDesc": "Your profile has been approved! You can now publish it.",
      "published": "Profile Published",
      "publishedDesc": "Your profile is live and visible to clients!",
      "rejected": "Profile Rejected",
      "rejectedDesc": "Your profile was rejected. Please review the feedback and make necessary changes.",
      "editProfile": "Edit Profile",

      "step1SaveSuccess": "Basic information saved successfully"
    },
    "lifestyle": {
      "LIFESTYLE_ACTIVE": "Active",
      "LIFESTYLE_RELAXED": "Relaxed",
      "LIFESTYLE_ADVENTUROUS": "Adventurous",
      "LIFESTYLE_HOMEBODY": "Homebody",
      "LIFESTYLE_SOCIAL": "Social",
      "LIFESTYLE_INDEPENDENT": "Independent"
    }
  },
  "services": {
    "CATEGORY_HOMECARE": "Homecare",
    "CATEGORY_GROOMING": "Grooming",
    "CATEGORY_ASSISTANCE": "Assistance",
    "CATEGORY_COMPANIONSHIP": "Companionship",

    "SERVICE_HOMECARE_ORGANIZING": "Home Organizing",
    "SERVICE_HOMECARE_COOKING": "Cooking",
    "SERVICE_GROOMING_NAIL": "Nail Care",
    "SERVICE_GROOMING_FACIAL": "Facial Care",
    "SERVICE_GROOMING_BODY": "Body Care",
    "SERVICE_GROOMING_HAIRCARE": "Hair Care",
    "SERVICE_ASSISTANCE_PERSONAL": "Personal Assistant",
    "SERVICE_ASSISTANCE_ONSITE": "On-site Assistant",
    "SERVICE_ASSISTANCE_VIRTUAL": "Virtual Assistant",
    "SERVICE_ASSISTANCE_TOUR_GUIDE": "Tour Guide",
    "SERVICE_ASSISTANCE_INTERPRETER": "Interpreter",
    "SERVICE_COMPANIONSHIP_LEVEL_1": "Companionship - Level 1",
    "SERVICE_COMPANIONSHIP_LEVEL_2": "Companionship - Level 2",
    "SERVICE_COMPANIONSHIP_LEVEL_3": "Companionship - Level 3",

    "options": {
      "COOKING_VIETNAMESE": "Vietnamese Cuisine",
      "COOKING_KOREAN": "Korean Cuisine",
      "COOKING_JAPANESE": "Japanese Cuisine",
      "COOKING_CHINESE": "Chinese Cuisine",
      "COOKING_WESTERN": "Western Cuisine",
      "HAIRCARE_NON_CHEMICAL": "Non-chemical Hair Care",
      "HAIRCARE_CHEMICAL": "Chemical Hair Care",
      "INTERPRETER_VI_TO_EN": "Vietnamese → English",
      "INTERPRETER_EN_TO_VI": "English → Vietnamese"
    }
  },
  "common": {
    "add": "Add",
    "remove": "Remove",
    "back": "Back",
    "continue": "Continue",
    "saveAndContinue": "Save & Continue",
    "cancel": "Cancel",
    "yes": "Yes",
    "no": "No",
    "backToDashboard": "Back to Dashboard"
  }
}
```

**Vietnamese (`public/locales/vi/common.json`):**
Add Vietnamese translations following the same structure.

### 3. Test the Flow

1. **Run migrations** (already done):
   ```bash
   # Migrations already applied
   ```

2. **Start development server**:
   ```bash
   npm run dev
   ```

3. **Access worker profile setup**:
   - Login as a worker
   - Navigate to `/worker/profile/setup`

4. **Complete the 2-step wizard**:
   - **Step 1**: Fill in basic information, add tags
   - **Step 2**: Upload avatar, add services with pricing
   - **Step 3**: Review and submit for approval

### 4. Admin Workflow (Future)

For admin approval workflow, you'll need to create:
- Admin panel for reviewing pending profiles
- Approve/reject actions
- Email notifications

---

## API Documentation

### Public APIs (No Auth Required)

#### Get Service Categories
```http
GET /api/services/categories
```
**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name_key": "CATEGORY_HOMECARE",
      "slug": "homecare",
      "is_active": true
    }
  ]
}
```

#### Get Services
```http
GET /api/services?category_id=uuid (optional)
```
**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "category_id": "uuid",
      "name_key": "SERVICE_HOMECARE_COOKING",
      "slug": "homecare-cooking",
      "has_options": true,
      "options": [...]
    }
  ]
}
```

### Worker APIs (Auth Required)

#### Get Worker Profile
```http
GET /api/worker/profile
Authorization: Bearer {token} or Cookie
```
**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "user_id": "uuid",
    "full_name": "John Doe",
    "age": 25,
    "profile_status": "draft",
    "tags": [...],
    "availabilities": [...],
    "images": [...],
    "services": [...]
  }
}
```

#### Save Profile (Step 1)
```http
POST /api/worker/profile
Authorization: Bearer {token} or Cookie
Content-Type: application/json

{
  "full_name": "John Doe",
  "nickname": "JD",
  "age": 25,
  "height_cm": 175,
  "weight_kg": 70,
  "zodiac_sign": "Aries",
  "lifestyle": "LIFESTYLE_ACTIVE",
  "personal_quote": "Live life to the fullest",
  "bio": "I'm a dedicated professional...",
  "tags": [
    {
      "tag_key": "sports",
      "tag_value": "sports",
      "tag_type": "interest"
    }
  ],
  "availabilities": [...]
}
```

#### Add Service
```http
POST /api/worker/services
Authorization: Bearer {token} or Cookie
Content-Type: application/json

{
  "service_id": "uuid",
  "service_option_id": "uuid",
  "pricing": {
    "hourly_rate": 25,
    "primary_currency": "USD",
    "daily_discount_percent": 5,
    "weekly_discount_percent": 10,
    "monthly_discount_percent": 15
  }
}
```

#### Add Image
```http
POST /api/worker/images
Authorization: Bearer {token} or Cookie
Content-Type: application/json

{
  "image_url": "https://...",
  "file_path": "worker-avatars/...",
  "image_type": "avatar",
  "file_name": "avatar.jpg",
  "mime_type": "image/jpeg"
}
```

#### Submit for Review
```http
PATCH /api/worker/profile/submit
Authorization: Bearer {token} or Cookie
```

---

## Pricing Logic

### Price Tiers Calculation

**Hourly Rate**: Base price set by worker

**Daily Rate**: `hourly_rate × 8 × (1 - daily_discount% / 100)`

**Weekly Rate**: `hourly_rate × 56 × (1 - weekly_discount% / 100)`

**Monthly Rate**: `hourly_rate × 160 × (1 - monthly_discount% / 100)`

### Example

Hourly rate: $25
- Daily discount: 5%
- Weekly discount: 10%
- Monthly discount: 15%

**Calculated Prices:**
- Hourly: $25
- Daily: $25 × 8 × 0.95 = $190
- Weekly: $25 × 56 × 0.90 = $1,260
- Monthly: $25 × 160 × 0.85 = $3,400

### Multi-Service Booking

When a client books multiple services from one worker:
- **Charge the HIGHEST hourly rate** among selected services
- Example: If worker offers Cooking ($15/h), Organizing ($20/h), and Assistant ($25/h)
- Client books all 3 → Charged $25/hour

---

## Profile Status Workflow

```
draft → pending → approved → published
                     ↓
                rejected → edit → pending
```

**Draft**: Worker is editing profile
**Pending**: Submitted for admin review
**Approved**: Admin approved, worker can publish
**Rejected**: Admin rejected with feedback
**Published**: Live and visible to clients

---

## Database Schema Overview

### Service System (3 tables)

**service_categories** → **services** → **service_options**

- Categories: Homecare, Grooming, Assistance, Companionship
- Services: 30+ services with i18n keys
- Options: Cuisines, language pairs, haircare types, etc.

### Worker Profile System (6 tables)

**worker_profiles** (main)
- ↓ has many → **worker_tags** (interests)
- ↓ has many → **worker_availabilities** (schedule)
- ↓ has many → **worker_images** (avatar + gallery)
- ↓ has many → **worker_services** (offered services)
  - ↓ has one → **worker_service_prices** (pricing)

---

## Next Steps

### Immediate (Required for Production)

1. **Add i18n translation keys** (see above)
2. **Test the full flow** from registration to profile setup
3. **Add input validation** for image file types/sizes
4. **Add error boundaries** for better error handling

### Short-term (Nice to Have)

1. **Admin approval UI**
   - Create `/app/admin/workers/page.tsx`
   - List pending profiles
   - Approve/reject actions with feedback

2. **Email notifications**
   - Notify worker when profile is approved/rejected
   - Notify admin when new profile is submitted

3. **Enhanced availability picker**
   - Visual weekly calendar
   - Multiple time slots per day
   - Drag-and-drop interface

4. **Profile preview**
   - Show how profile will look to clients
   - Preview before submitting

### Long-term (Future Features)

1. **Worker search/browse for clients**
   - Filter by service, price, availability
   - Pagination and sorting
   - Ratings and reviews

2. **Booking system**
   - Book worker services
   - Calendar integration
   - Payment processing

3. **Messaging system**
   - Client-worker chat
   - Booking confirmation
   - Service updates

4. **Analytics dashboard**
   - View count
   - Booking requests
   - Earnings statistics

---

## Troubleshooting

### Issue: Migrations fail
**Solution**: Check Supabase connection and ensure you have proper permissions

### Issue: Images don't upload
**Solution**: Check Supabase storage policies and bucket configuration

### Issue: Translation keys not found
**Solution**: Ensure all keys from section 2 are added to your i18n files

### Issue: API returns 401 Unauthorized
**Solution**: Check authentication cookies or headers are being sent

### Issue: Services not showing in selector
**Solution**: Verify migrations ran successfully and data was seeded

---

## Support

For issues or questions:
1. Check the documentation files in `/docs`
2. Review database schema: `docs/database-schema-design.md`
3. Review pricing logic: `docs/pricing-logic-guide.md`
4. Check existing code patterns in similar features (wallet system)

---

## Summary

✅ **Backend Complete**: Types, Service Layer, API Routes, Client API
✅ **Frontend Complete**: Wizard, Forms, Components, Image Upload
✅ **Database Complete**: Migrations, Tables, Relationships, RLS

**Status**: Ready for translation keys and testing
**Estimated remaining work**: 2-4 hours (i18n + testing + admin UI)

---

**Last Updated**: 2025-11-18
**Version**: 1.0
