/*
  Firestore → Supabase data migration script (one-time).
  This script reads data from Firestore (users, properties, bookings)
  and inserts into Supabase Postgres tables (profiles, properties, bookings).
  It also creates a mapping from old Firestore user IDs to new Supabase profile IDs.
  Prerequisites:
  - Firestore service account credentials available (see FIREBASE_SERVICE_ACCOUNT_JSON or PATH)
  - Supabase URL and SERVICE ROLE KEY provided in env:
      SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
  - Node environment with firebase-admin and @supabase/supabase-js installed
*/

const admin = require('firebase-admin');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

require('dotenv').config();

// Initialize Firebase Admin
if (!admin.apps.length) {
  const sa = process.env.FIREBASE_SERVICE_ACCOUNT_JSON
    ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON)
    : require(process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
  admin.initializeApp({ credential: admin.credential.cert(sa) });
}
const db = admin.firestore();

// Initialize Supabase Admin client
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function migrateUsers() {
  const map = {}; // oldUid -> newProfileId
  const snapshot = await db.collection('users').get();
  const rows = [];
  snapshot.forEach((doc) => {
    const data = doc.data();
    rows.push({ oldUid: doc.id, ...data });
  });

  for (const r of rows) {
    const email = r.email;
    const isOwner = r.role === 'owner';
    // Insert into profiles; preserve existing fields
    const payload = {
      email,
      role: r.role,
      terms_accepted: !!r.termsAccepted,
      email_verified: !!(r.emailVerified),
      last_login_at: r.lastLoginAt ? new Date(r.lastLoginAt) : null,
      locale: r.locale || null,
      phone: r.phone || r.mobile || null,
      created_at: r.createdAt ? new Date(r.createdAt) : new Date(),
      first_name: r.firstName,
      last_name: r.lastName,
      display_name: r.displayName,
      photo_url: r.photoURL,
      mobile: r.mobile,
      whatsapp: r.whatsapp,
      dob: r.dob,
      age: r.age,
      gender: r.gender,
      property_name: r.propertyName,
      property_holder_name: r.propertyHolderName,
      auth_user_id: r.uid || null,
    };
    const { data: created, error } = await (async () => {
    const { data, error } = await supabase
      .from('profiles')
      .insert([payload], { returning: 'representation' })
      .select('id')
      .single();
      return { data, error };
    })();
    if (error) {
      console.error('Migration failed for user', email, error);
      continue;
    }
    const newId = created?.id;
    map[r.oldUid] = newId;
  }
  // Persist mapping for further steps (properties, bookings)
  fs.writeFileSync(path.join(__dirname, 'user_map.json'), JSON.stringify(map, null, 2));
  console.log('User migration complete. Mapped', Object.keys(map).length, 'users');
  return map;
}

async function migrateProperties(userMap) {
  const snapshot = await db.collection('properties').get();
  const rows = [];
  snapshot.forEach((doc) => {
    const d = doc.data();
    rows.push({ oldId: doc.id, ...d });
  });
  for (const r of rows) {
    const ownerNewId = userMap[r.ownerId];
    const payload = {
      owner_id: ownerNewId,
      title: r.title,
      type: r.type,
      area: r.area,
      address: r.address,
      price_per_day: r.pricePerDay,
      photos: r.photos,
      amenities: r.amenities,
      external_url: r.externalUrl,
      rental_terms: r.rentalTerms,
      description: r.description,
      status: r.status,
      created_at: r.createdAt ? new Date(r.createdAt) : new Date(),
    };
    const { data, error } = await supabase.from('properties').insert([payload]).select('id').single();
    if (error) console.error('Property migration error', r.title, error);
  }
  console.log('Property migration complete');
}

async function migrateBookings(userMap) {
  const snapshot = await db.collection('bookings').get();
  for (const doc of snapshot.docs) {
    const b = doc.data();
    const payload = {
      property_id: b.propertyId,
      visitor_id: userMap[b.visitorId],
      owner_id: userMap[b.ownerId],
      visitor_name: b.visitorName,
      visitor_contact: b.visitorContact,
      is_whatsapp: b.isWhatsapp,
      check_in: b.checkIn ? new Date(b.checkIn) : null,
      check_out: b.checkOut ? new Date(b.checkOut) : null,
      nights: b.nights,
      estimated_cost: b.estimatedCost,
      platform_fee: b.platformFee,
      status: b.status,
      created_at: b.createdAt ? new Date(b.createdAt) : new Date(),
      updated_at: b.updatedAt ? new Date(b.updatedAt) : null,
      payment_method: b.paymentMethod,
      cancellation_policy: b.cancellationPolicy,
      notes: b.notes,
      guest_count: b.guestCount || b.guest_count || null
    };
    await supabase.from('bookings').insert([payload]);
  }
  console.log('Bookings migration complete');
}

async function main() {
  console.log('Starting Firestore → Supabase migration...');
  const userMap = await migrateUsers();
  await migrateProperties(userMap);
  await migrateBookings(userMap);
  console.log('Migration finished.');
}

main().catch((e) => {
  console.error('Migration failed', e);
  process.exit(1);
});
