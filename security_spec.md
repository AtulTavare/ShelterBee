# Security Specification for ShelterBee Firestore

## 1. Data Invariants
- A **Booking** must belong to an existing **Property** and have a valid **visitorId** and **ownerId**.
- A **Booking** status can only be updated by the owner (to accept/reject/complete) or by the visitor (to cancel).
- A **Wallet** balance can only be updated via transactions.
- **Transactions** must be immutable once created (by admins or system logic).
- **Reviews** can only be created by users who had a completed booking (business logic check, or simplified for MVP).
- **Admin** access is restricted to a hardcoded email and users with the 'admin' role.

## 2. The "Dirty Dozen" Payloads (Red Team Tests)

### T1: Identity Spoofing (Property)
- **Goal**: Create a property listing for someone else.
- **Payload**: `{ "title": "Scam Villa", "ownerId": "target_user_id", "status": "Approved" }`
- **Result**: `PERMISSION_DENIED` (ownerId must match auth.uid).

### T2: Privilege Escalation (User)
- **Goal**: Change own role to admin.
- **Payload**: `{ "role": "admin" }` (on existing user doc)
- **Result**: `PERMISSION_DENIED` (role field should be immutable/admin-only).

### T3: State Shortcutting (Booking)
- **Goal**: Mark a booking as confirmed without owner approval.
- **Payload**: `{ "status": "confirmed" }` (by visitor)
- **Result**: `PERMISSION_DENIED` (status 'confirmed' requires owner/admin).

### T4: Financial Theft (Wallet)
- **Goal**: Manually increase own availableBalance.
- **Payload**: `{ "availableBalance": 999999 }`
- **Result**: `PERMISSION_DENIED` (wallets should only be updated via specific logic or admin).

### T5: Orphaned Resource (Booking)
- **Goal**: Create a booking for a non-existent property ID.
- **Payload**: `{ "propertyId": "fake_id", "visitorId": "my_id" }`
- **Result**: `PERMISSION_DENIED` (exists() check on propertyId).

### T6: Resource Poisoning (Property ID)
- **Goal**: Inject a massive string as a document ID.
- **Payload**: `collection('properties').doc('A'.repeat(1500)).set(...)`
- **Result**: `PERMISSION_DENIED` (isValidId check).

### T7: PII Leak (User)
- **Goal**: Read another user's private info (email/phone).
- **Payload**: `getDoc(doc(db, 'users', 'other_user_id'))`
- **Result**: `PERMISSION_DENIED` (restricted to self/admin).

### T8: Ghost Field Injection (Review)
- **Goal**: Add extra fields to a review document.
- **Payload**: `{ "rating": 5, "comment": "Nice", "isVerified": true, "extraData": "..." }`
- **Result**: `PERMISSION_DENIED` (keys().hasOnly() validation).

### T9: Implicit Query Scraping (Booking)
- **Goal**: List all bookings in the system.
- **Payload**: `getDocs(collection(db, 'bookings'))`
- **Result**: `PERMISSION_DENIED` (lists must be filtered or restricted).

### T10: Temporal Poisoning (Timestamp)
- **Goal**: Set a fake createdAt date in the future.
- **Payload**: `{ "createdAt": "2030-01-01T00:00:00Z" }`
- **Result**: `PERMISSION_DENIED` (serverTimestamp validation).

### T11: Withdrawal Fraud (Wallet)
- **Goal**: Update a withdrawal request to 'approved' by self.
- **Payload**: `{ "status": "approved" }`
- **Result**: `PERMISSION_DENIED` (admin-only for status updates).

### T12: Negative Balance Attack (Wallet)
- **Goal**: Withdraw more than available balance.
- **Payload**: `{ "amount": 10000 }` (when balance is 0)
- **Result**: `PERMISSION_DENIED` (validation check in rules or transaction).

## 3. Test Runner Recommendation
Use `firestore-debug-server` or `firebase emulators:exec "npm test"` with `@firebase/rules-unit-testing`.
