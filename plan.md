# Execution Plan: ShelterBee Partner Program

This document contains the step-by-step execution plan to implement the Partner Program. **DeepSeek v4 Flash**: Follow this plan strictly. Read all specified files first, then implement the changes sequentially. Do not stop until all 7 changes are complete.

## Overview of Indirect Effects & Edge Cases to Handle
1. **Wallet Reversals (Critical):** The prompt mentions updating `processBookingWallet`. However, if a booking is rejected or cancelled, the 5% partner commission MUST be reversed. You must update `processOwnerRejectionWallet` and `processCancellationWallet` to check if `booking.partnerCode` exists. If it does, reverse 5% from the partner, 15% from the admin, and 80% from the owner.
2. **Routing Optimization:** Fetching the `partners` collection on every route change is expensive. When creating the partner in `Auth.tsx`, save `partnerStatus: 'pending'` directly inside the `users` collection document as well. This allows `App.tsx` and `AuthContext.tsx` to route based on `profile.partnerStatus` without extra Firestore reads.
3. **Admin Approval Sync:** When an Admin approves a partner, they must update BOTH `partners/{uid}.status = 'approved'` AND `users/{uid}.partnerStatus = 'approved'`.

---

## STEP 1: Firestore Collections & Rules
Add the following blocks to `firestore.rules` (do not modify existing rules):
```javascript
match /partners/{partnerId} {
  allow read: if isSignedIn() && (request.auth.uid == partnerId || isAdmin());
  allow create: if isSignedIn() && request.auth.uid == partnerId;
  allow update: if isSignedIn() && (request.auth.uid == partnerId || isAdmin());
  allow delete: if isAdmin();
}
match /partnerCommissions/{commissionId} {
  allow read: if isSignedIn() && (resource.data.partnerId == request.auth.uid || isAdmin());
  allow create: if isSignedIn();
  allow update, delete: if isAdmin();
}
```

---

## STEP 2: Change 1 — Auth.tsx (Partner Signup Flow)
1. Add `'Partner / Business'` to the role selection.
2. Add a `partnerStep` state (1 or 2).
3. If role is partner, after the first step (Name, Email, Password, Gender), transition to Step 2.
4. **Step 2 Form Fields:** Business Name, Business Address, Contact Number, WhatsApp Number, Business Email, Website, Business Type (dropdown with the 50 specified options).
5. **Submission Logic:**
   - Generate `partnerCode`: `name.substring(0,4).toUpperCase() + Math.floor(1000 + Math.random() * 9000)`.
   - Create Firebase Auth User.
   - Create `users` doc: `{ ...existingFields, role: 'partner', partnerStatus: 'pending', partnerCode }`.
   - Create `partners` doc (ID = uid): `{ uid, displayName, email, phone, whatsappNumber, businessName, businessAddress, businessType, businessEmail, website, partnerCode, affiliateLink: "https://shelterbee.vercel.app/?ref=" + partnerCode, status: 'pending', totalEarnings: 0, totalBookings: 0, createdAt: serverTimestamp(), approvedAt: null }`.
   - Redirect to `/partner-pending`.

---

## STEP 3: Change 2 — Routing & Pending Screen
1. **Create `src/pages/PartnerPending.tsx`:** 
   - A simple UI centered card with the ShelterBee logo, stating: "Application Under Review... takes 1-2 business days." Include a Logout button.
2. **Update `App.tsx`:**
   - Add Protected Routes for partners.
   - If `profile?.role === 'partner'`:
     - If `profile.partnerStatus === 'pending'` or `'rejected'`, force redirect to `/partner-pending`.
     - If `profile.partnerStatus === 'approved'`, grant access to `/partner-dashboard`.

---

## STEP 4: Change 3 — Partner Dashboard
**Create `src/pages/PartnerDashboard.tsx`**:
- Ensure the route is `/partner-dashboard`.
- **Tab 1 (Profile):** Fetch from `partners` collection. Show Business details in a clean card. Allow editing of non-sensitive fields.
- **Tab 2 (Campaigns):** Show `affiliateLink`. Fetch `partnerCommissions` where `partnerId == user.uid`. Display stats (Total bookings, Total commission) and a table of bookings (ID, Date, Commission).
- **Tab 3 (Earnings):** Sum total earnings. Display the last 10 commissions from `partnerCommissions`.
- **Tab 4 (Wallet):** Replicate the owner wallet logic. Read from `wallets/{uid}`, show withdrawal history, and use the existing withdrawal APIs.

---

## STEP 5: Change 4 — Admin Dashboard (Partner Management)
1. **Create `src/pages/admin/AdminPartners.tsx`** and add the "Partners" tab to `AdminDashboard.tsx`.
2. **Pending Partners Section:**
   - Query `partners` where `status == 'pending'`.
   - Display details and Approve/Reject buttons.
   - **On Approve:** Update `partners/{uid}` (`status: 'approved', approvedAt: serverTimestamp()`), Update `users/{uid}` (`partnerStatus: 'approved'`), and trigger email notification.
   - **On Reject:** Update `status: 'rejected'` in both collections, send email.
3. **Approved Partners Section:**
   - Query `partners` where `status == 'approved'`. Read-only table showing stats.

---

## STEP 6: Change 5 & 6 — Affiliate Link Tracking & Booking Service
1. **Link Tracking (`App.tsx`):**
   - On app mount, check `new URLSearchParams(window.location.search).get('ref')`.
   - If present, validate it exists in `partners` and is approved (optional quick fetch, or just store it and validate during checkout).
   - Store in `localStorage` under `shelterBeePartnerRef` with `expiresAt = Date.now() + 7 days`.
2. **`bookingService.ts` (`createBooking`):**
   - Read `localStorage`. If `shelterBeePartnerRef` exists and `expiresAt > Date.now()`, attach `partnerCode` and `hasPartnerCommission: true` to the booking document.
   - Immediately after `addDoc('bookings')`, if a partner code was applied:
     - Query `partners` to get the `partnerId`.
     - Create a doc in `partnerCommissions` with 5% of `totalAmount`.
     - Clear the localStorage key.
   - Pass `partnerCode` as a new parameter to `walletService.processBookingWallet`.

---

## STEP 7: Change 7 — Wallet Splits & Reversals (walletService.ts)
1. **`processBookingWallet`:**
   - Add `partnerCode` parameter.
   - Within the `runTransaction` block:
     - If `partnerCode` exists, query the partner UID (do this *before* the transaction if needed to get the ID, then read inside transaction).
     - Split: Owner 80%, Partner 5%, Admin 15%.
     - Update Partner's `wallets` document (balance +5%).
     - Update Partner's `walletTransactions` (type: 'credit', description: 'Commission earned — Booking {bookingId}').
     - Update `partners/{uid}` (`totalEarnings += commission`, `totalBookings += 1`).
2. **`processOwnerRejectionWallet` (Indirect Effect):**
   - Check if the booking has a `partnerCode`.
   - If yes, reverse 5% from the Partner's wallet, 15% from Admin, and 80% from Owner.
3. **`processCancellationWallet` (Indirect Effect):**
   - If `partnerCode` exists, the owner loses 80%, the partner loses 5% (or partner keeps it? Usually partner loses it on cancellation. Assuming partner loses 5%), and admin gets remainder after visitor refund. Calculate carefully to balance the pool.
