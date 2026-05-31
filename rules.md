SHELTERBEE — COMPLETE PLATFORM RULES REFERENCE

USER TYPES & CAPABILITIES
VISITOR
Can:

Browse all approved properties (logged out too)
Search by location, type, guests, gender
Book any approved property
Cancel their own bookings (per refund policy)
Rate & review a property (only after checkout date, only once per booking)
Add properties to favourites
Report a property or user
View their wallet (refunds only)
Request withdrawal from wallet
Submit support queries
View booking details including exact address and maps link (only after booking confirmed)

Cannot:

See property exact address before booking
See Google Maps link before booking confirmed
Rate same booking twice
Cancel after check-in date
See platform commission details in wallet
Access owner or admin dashboard
Book with same account as partner account
See other visitors' details

PROPERTY OWNER
Can:

List properties (5-step process)
Edit their own property details
Accept or reject incoming bookings
View their own bookings (new, confirmed, cancelled, past, rejected)
View their wallet (earnings, transactions, withdrawals)
Request withdrawal
Create coupon campaigns for their properties
Activate/deactivate coupons
Hide/unhide their approved properties
Resubmit rejected properties
Reply to reviews on their properties
View their property ratings and stats

Cannot:

Approve their own property listing
Change property status to Approved directly
See other owners' properties or earnings
Access visitor personal details beyond what's in booking
Have more than 3 booking rejections before account block
Create coupon codes with duplicate codes
Modify bookingAmount or wallet balances directly

PARTNER
Can:

Have one global affiliate link
View earnings and commissions
View their own wallet
Request withdrawal
Edit their business profile details
View booking stats from their link (booking ID, date, commission only — no visitor name, no property name)

Cannot:

Book properties with partner account
Access property owner dashboard
Access admin dashboard
Approve their own partner account
See visitor or owner personal details
Generate per-property links (one global link only)
Access platform until admin approves their account

ADMIN
Can:

Approve or reject property listings
Approve or reject partner applications
See all users, bookings, properties, wallets, transactions
Edit any property
Delete any booking, property, or user
Reset owner red flags manually
View all feedback, reports, support tickets
Mark support tickets as resolved
View all withdrawal requests and mark as paid
Manage coupons across platform
Block/unblock any user

Cannot:

Be blocked or red-flagged
Have wallet earning rules changed without code change

PROPERTY LISTING RULES
Status flow:
Draft → Pending (on submit)
Pending → Approved (admin approves)
Pending → Rejected (admin rejects)
Rejected → Pending (owner resubmits)
Approved → Hidden (owner hides)
Hidden → Approved (owner unhides)
Fixed rules:

Property address is ALWAYS private until booking confirmed
Google Maps link ALWAYS private until booking confirmed
KYC documents (Aadhaar front/back + property proof) mandatory
Admin must approve before property goes live
Resubmitted properties tagged "RESUBMISSION" in admin panel
Rejection reason must be shown to owner in dashboard alert
Owner cannot force-approve their own listing ever
Property visible in search only when status == Approved

BOOKING WORKFLOW RULES
Booking creation:

Status set to confirmed immediately (auto-confirmed)
Wallet credited immediately on booking creation (not on owner accept)
Minimum 1 night booking
Exact address revealed to visitor only after booking
Guest details collected at booking (name, age, gender, contact number)
Visitor phone for WhatsApp comes from guest details, NOT user profile

Booking status flow:
confirmed → cancelled (visitor cancels)
confirmed → rejected_by_owner (owner rejects)
confirmed → completed (after checkout date passes)
What visitor sees (display labels):

confirmed → "Confirmed"
rejected_by_owner → "Cancelled" (never show "rejected by owner")
cancelled → "Cancelled by you"
completed → "Completed"

Owner booking tabs:

New — incoming bookings (owner can accept/reject)
Confirmed — accepted bookings
Cancelled — visitor cancelled bookings
Rejected — owner rejected bookings
Past — completed stays

Cancel button rules:

Hidden on or after check-in date
Hidden for completed bookings
Hidden for already cancelled/rejected bookings

View Location button:

Only shows if property has valid Google Maps link
Only shows for confirmed or completed bookings
Opens in new tab

Host contact details:

Visible to visitor immediately after booking confirmed
Hidden for cancelled, rejected, completed

CANCELLATION & REFUND RULES (FIXED — DO NOT CHANGE)
Time Before Check-inVisitor RefundOwner LosesCompany Gets>24 hours75%100% of their shareRemainder24hrs to 6hrs50%100% of their shareRemainder<6hrs or after0%100% of their shareEverythingNo-show0%100% of their shareEverythingOwner rejects100%100% of their share0%Owner cancels confirmed100%100% of their share0%
Absolute rules:

Owner ALWAYS loses 100% of their wallet share, no exceptions, no scenarios change this
Refund calculated on amount visitor actually paid (discounted amount if coupon used)
Company NEVER loses money on visitor cancellations
Company DOES lose money when owner rejects (pays full refund from company share too)
Partner forfeits 5% commission on any cancellation, commission reversed back to company

WALLET RULES (FIXED)
Credits happen:

Owner: immediately when booking created
Partner: immediately when booking created (if via partner link)
Company/Admin: immediately when booking created
Visitor: ONLY on refund (cancellation or rejection)

Debits happen:

Owner: on cancellation (100% always) or on rejection (100% always)
Company: on owner rejection (full reversal), on visitor cancellation (sends refund)
Partner: on any cancellation (5% reversal)
Visitor wallet: on withdrawal request (instant deduction)

Wallet balance = single source of truth

Never calculate balance from transaction sum
Always use wallet document balance field

Withdrawal rules (ALL user types, no exceptions):

Max 2 per day
Minimum ₹100
Wallet deducted instantly on request
Bank transfer 3-4 working days
Status: Pending → Paid / Failed

Wallet visibility:

Owner sees: booking amount, commission deducted (20%), net received (80%), cancellation debits, withdrawal history
Visitor sees: refund credits only, withdrawal history, NO commission details
Partner sees: commission credits only, withdrawal history
Admin sees: everything

COUPON RULES (FIXED)
Creation:

Only property owner can create coupons
Created from Campaigns tab in owner dashboard
Each coupon must have unique code (globally unique across platform)
Multiple coupons per property allowed

Conditions owner sets:

Discount type: percentage OR fixed amount (one only)
Minimum guest count to unlock coupon
Eligibility: open to all / first booking on platform / first booking on property
Expiry: specific date OR no expiry (disable manually)
Which properties it applies to (from owner's own approved properties)

Display rules at booking:

Show in Step 3 (payment step) only
Show only coupons for that specific property
Hide coupon if guest count below minimum
Hide coupon if visitor already used it
Hide coupon if eligibility condition not met
Hide coupon if expired or inactive
Show "No coupons available" if none qualify

Application rules:

One coupon per booking only
Visitor can manually enter code OR click from list
Discount cannot make total go below ₹0
Once applied, refunds calculate on discounted amount

Discount absorption:

Owner bears 100% of discount
Company always gets 20% of discounted amount
Owner gets 80% of discounted amount (their discount, their loss)

PARTNER PROGRAM RULES (FIXED)
Signup:

2-step signup (basic info + business details)
Account pending until admin manually approves
Pending partners see only waiting screen on login
Rejected partners see rejection message only

Affiliate link:

One global link per partner
Works for ALL properties on platform
Format: shelterbee.vercel.app/?ref=PARTNERCODE
7-day attribution window (localStorage)
If visitor clicks link, doesn't book, returns within 7 days → partner still gets credit
After 7 days attribution expires → no credit

Commission:

5% of final booking amount (after any coupon discounts applied)
Credited immediately when booking wallet processed
Forfeited on any cancellation (visitor or owner)
Reversed back to company on cancellation

What partner can see in Campaigns tab:

Booking ID only (no visitor name, no property name, no visitor contact)
Date of booking
Commission earned per booking
Total bookings via link
Total commission earned

RED FLAG SYSTEM

Owner gets +1 red flag every time they reject a booking
3 red flags = account automatically blocked
Admin can manually reset red flags
Owner sees warning after each rejection
Blocked owner cannot list new properties or receive bookings

RATING & REVIEW RULES

Visitor can only rate after checkout date has passed
Only one review per booking (cannot re-rate)
Rating has sub-categories: cleanliness, safety, owner behavior, comfort
Owner can reply to reviews
Reviews visible to everyone (public)
averageRating and totalReviews auto-updated on property document

NOTIFICATION RULES
Email + WhatsApp sent on:

Visitor books → visitor gets confirmation, owner gets alert
Owner rejects → visitor gets apology notification
Admin approves property → owner notified
Admin rejects property → owner notified with reason
Partner approved → partner notified (WhatsApp template pending approval)

WhatsApp phone source:

Visitor notifications: phone from booking guest details (guests[0].contactNo)
Owner notifications: phone from owner user profile
Partner notifications: whatsapp number from partner business profile

SEO & PUBLIC ACCESS RULES

Approved properties readable by unauthenticated users
Property exact address NEVER in public data
Admin dashboard route never in sitemap
Profile, booking, API routes blocked in robots.txt
Dynamic page titles on every page

THINGS THAT ARE FIXED (NEVER CHANGE WITHOUT CLIENT APPROVAL)

80/20 split (owner/company)
5% partner commission from company share
Owner always loses 100% on cancellation
Refund tiers (75/50/0%)
Max 2 withdrawals/day
Min ₹100 withdrawal
7-day partner attribution window
Red flag limit = 3
1 review per booking
Coupon discount borne by owner only
Visitor phone from guest details not user profile

THINGS THAT CAN BE CONFIGURED

Coupon codes (owner controls)
Property availability dates (owner controls)
Property hidden/visible (owner controls)
Coupon active/inactive (owner controls)
Partner approved/rejected (admin controls)
Red flag reset (admin controls)
Withdrawal marked paid (admin controls)
Support ticket status (admin controls)
