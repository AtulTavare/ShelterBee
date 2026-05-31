# ShelterBee - Project Update & Context

## Project Overview

ShelterBee is a property booking platform connecting guests with property owners. Recently expanded to include a **Partner Program** allowing businesses/organizations to earn commissions by referring bookings.

---

## Changes Made

### 1. Partner Program - Registration Flow

**Files:** `src/pages/Auth.tsx` (modified), `src/contexts/AuthContext.tsx` (modified)

**What changed:**

- Added "I'M A PARTNER" button to the role toggle (alongside Guest and Owner)
- Partner registration is a 3-step process:
  - Step 1: Identity details (name, email, mobile, gender, password)
  - Step 2: Business details (business name, address, type, WhatsApp, website, contact person)
  - Step 3: Review policies & submit
- Added ~50 business types dropdown (Travel Agency, Hotel, Real Estate, etc.)
- When a partner registers, their `role` is set to `'partner'`, status is `'pending'`, and a unique `partnerCode` is generated (e.g., `PRT-XXXX`)
- After registration, user is redirected to `/partner-pending` page
- AuthContext types updated: added `'partner'` to UserRole, added `partnerStatus` and `partnerCode` to UserProfile

### 2. Partner Pending Page

**File:** `src/pages/PartnerPending.tsx` — **New file**

**What changed:**

- Shows "Application Under Review" message after partner registration
- Explains the 3-step review process (team reviews → email notification → access dashboard)
- Button to go back to home

### 3. Partner Dashboard

**File:** `src/pages/PartnerDashboard.tsx` — **New file**

**What changed:**

- Shows partner's referral link that can be copied with one click
- Displays stats: Total Referrals, Completed Bookings, Total Commission, Pending Commission
- Shows partner info: Business Name, Business Type, Status, Commission Rate (up to 5%)

### 4. Admin Partner Management

**Files:** `src/pages/admin/AdminPartners.tsx` (new), `src/components/admin/AdminLayout.tsx` (modified)

**What changed:**

- New "Partners" tab in admin sidebar with Handshake icon
- Admin can view all partner applications in a table with search and status filter
- Approve or Reject partner applications with one click
- Shows business name, contact info, business type, partner code, registration date, status

### 5. Backend Service - Partner Management

**File:** `src/services/partnerService.ts` — **New file**

**What changed:**

- CRUD operations for partners collection in Firestore
- `getPartnerStats()` — returns referral count, completed bookings, commission totals
- `approvePartner()` / `rejectPartner()` — updates both `users` and `partners` collections
- `recordCommission()` — creates commission records in `partnerCommissions` collection

### 6. Wallet - Partner Commission Split

**File:** `src/services/walletService.ts` (modified)

**What changed:**

- `processBookingWallet()` now accepts optional `partnerId` parameter
- When a partner referred the booking, the split is: Partner 5%, Owner 80%, Admin 15%
- Without a partner: Owner 80%, Admin 20%
- Partner commission is credited to partner's wallet with its own transaction record

### 7. Booking - Referral Tracking

**Files:** `src/services/bookingService.ts` (modified), `src/pages/BookingPage.tsx` (modified)

**What changed:**

- Added `referredBy` field to Booking interface
- Added `getPartnerIdFromCode()` helper to resolve referral code to partner ID
- When a booking is created, referral code is read from localStorage
- Partner ID is passed to `processBookingWallet()` for commission split
- BookingPage reads `shelterbee_referral` from localStorage when creating a booking

### 8. Referral Link Tracking

**File:** `src/App.tsx` (modified)

**What changed:**

- Added `ReferrerCapture` component that reads `?ref=CODE` from URL on every page load
- Stores the referral code in localStorage as `shelterbee_referral`
- New routes added: `/partner-pending`, `/partner-dashboard`, `/admin-secret-dashboard/partners`

### 9. Firestore Security Rules

**File:** `firestore.rules` (modified)

**What changed:**

- Added rules for `partners` collection (read/write by owner and admin)
- Added rules for `partnerCommissions` collection (read by partner/admin, create by anyone authenticated)

### 10. Smooth Scroll & Page Transitions

**Files:** `src/index.css` (modified), `src/App.tsx` (modified)

**What changed:**

- Added `html { scroll-behavior: smooth }` for smooth scrolling site-wide
- Wrapped Routes with AnimatePresence and motion.div for slide-in/out page transitions
- Old page slides left and fades out, new page slides in from right (0.2s duration)

---

## Current System State

### User Roles

- **visitor** — Regular guest who books properties
- **owner** — Property owner who lists and manages properties
- **partner** — Business/organization that refers bookings for commission
- **admin** — Platform administrator

### Partner Program Flow

1. User signs up as Partner → 3-step form → Account created with `role: 'partner'`, `partnerStatus: 'pending'`
2. User sees "Application Under Review" page (`/partner-pending`)
3. Admin reviews in Admin → Partners tab → Approves or Rejects
4. On approval, user's `partnerStatus` becomes `'approved'` and `role` stays `'partner'`
5. Partner logs in, sees Partner Dashboard (`/partner-dashboard`) with referral link: `https://site.com/?ref=PRT-XXXX`
6. Anyone clicking that link gets the code stored in their browser's localStorage
7. When they make a booking, the code is detected → partner ID resolved → 5% commission goes to partner's wallet

### Wallet Split Logic

- **Without referral**: Owner 80%, Admin 20%
- **With partner referral**: Partner 5%, Owner 80%, Admin 15%

### Known Pre-existing TypeScript Errors (Not caused by our changes)

- `src/pages/BookingPage.tsx:1043` — Operator `>` cannot be applied to `string | number` and `number`
- `src/pages/Profile.tsx` — Property `toDate` does not exist on type `Date` (multiple lines)

---

## How to Test

### Partner Registration

1. Go to `/auth` → Click "I'M A PARTNER"
2. Fill Step 1 (identity) → Continue
3. Fill Step 2 (business details) → Review & Submit
4. Accept policies → Verify OTP → See "Under Review" page

### Admin Approval

1. Login as admin → Go to Admin Dashboard → Partners tab
2. See pending partner application → Click "Approve" or "Reject"

### Partner Dashboard

1. Login as approved partner → Go to `/partner-dashboard`
2. Copy referral link and share it

### Referral Flow

1. Open referral link `/?ref=PRT-XXXX` in incognito
2. Browse and book a property
3. Partner gets 5% commission in their wallet
