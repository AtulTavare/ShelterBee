-- Supabase PostgreSQL schema migrated from Firestore (Users/Profiles, Properties, Bookings)
-- Note: This is the initial schema for production; adapt as needed for your data volume.
-- Requires pgcrypto extension for gen_random_uuid()

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Profiles (users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID UNIQUE, -- optional mapping to Supabase/External user id
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('visitor','owner','admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  terms_accepted BOOLEAN NOT NULL,
  email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  last_login_at TIMESTAMPTZ,
  locale TEXT,
  phone TEXT,
  first_name TEXT,
  last_name TEXT,
  display_name TEXT,
  photo_url TEXT,
  mobile TEXT,
  whatsapp TEXT,
  dob TEXT,
  age INTEGER,
  gender TEXT,
  property_name TEXT,
  property_holder_name TEXT
);

-- Properties
CREATE TABLE properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES profiles(id),
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('Room','PG','Full Flat','Full Property')),
  area TEXT,
  address TEXT,
  price_per_day NUMERIC NOT NULL CHECK (price_per_day >= 0),
  photos JSONB,
  amenities JSONB,
  external_url TEXT,
  rental_terms TEXT,
  description TEXT,
  status TEXT NOT NULL CHECK (status IN ('Pending','Approved','Rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Bookings
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES properties(id),
  visitor_id UUID REFERENCES profiles(id),
  owner_id UUID REFERENCES profiles(id),
  visitor_name TEXT,
  visitor_contact TEXT,
  is_whatsapp BOOLEAN,
  check_in TIMESTAMPTZ,
  check_out TIMESTAMPTZ,
  nights INTEGER NOT NULL CHECK (nights >= 0),
  estimated_cost NUMERIC NOT NULL,
  platform_fee NUMERIC NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending','confirmed','cancelled','completed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ,
  payment_method TEXT,
  cancellation_policy TEXT,
  notes TEXT,
  guest_count INTEGER
);

-- Optional wallets (if used)
CREATE TABLE wallets (
  user_id UUID REFERENCES profiles(id) PRIMARY KEY,
  balance NUMERIC NOT NULL DEFAULT 0,
  last_updated_at TIMESTAMPTZ
);

CREATE TABLE support_inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT,
  email TEXT,
  subject TEXT,
  message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  amount NUMERIC NOT NULL,
  type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  note TEXT
);

CREATE TABLE withdrawal_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  amount NUMERIC NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending','approved','rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Optional OTP codes for server-side OTP handling (if you move OTP storage server-side)
CREATE TABLE otp_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN NOT NULL DEFAULT FALSE
);

-- Indexes (optional but recommended)
CREATE INDEX idx_profiles_email ON profiles (email);
CREATE INDEX idx_properties_owner ON properties (owner_id);
CREATE INDEX idx_bookings_property ON bookings (property_id);
