-- ============================================================================
-- Migration: 002_complete_schema.sql
-- Complete Postgres Schema for DarkTunes Charts replacing Prisma
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- ENUMS
-- ============================================================================

CREATE TYPE role_enum AS ENUM ('ADMIN', 'EDITOR', 'USER', 'LABEL', 'AR');
CREATE TYPE tier_enum AS ENUM ('MICRO', 'EMERGING', 'ESTABLISHED', 'INTERNATIONAL', 'MACRO');
CREATE TYPE vote_type_enum AS ENUM ('FAN', 'DJ', 'PEER');
CREATE TYPE alert_type_enum AS ENUM ('VELOCITY', 'NEW_ACCOUNTS', 'IP_CLUSTER', 'PATTERN');
CREATE TYPE severity_enum AS ENUM ('LOW', 'MEDIUM', 'HIGH');
CREATE TYPE alert_status_enum AS ENUM ('FLAGGED', 'REVIEWING', 'CLEARED', 'CONFIRMED_FRAUD');
CREATE TYPE mandate_status_enum AS ENUM ('PENDING', 'ACTIVE', 'REVOKED');
CREATE TYPE achievement_pillar_enum AS ENUM ('FAN', 'BAND', 'DJ', 'LABEL');
CREATE TYPE achievement_rarity_enum AS ENUM ('COMMON', 'RARE', 'EPIC', 'LEGENDARY');
CREATE TYPE label_member_role_enum AS ENUM ('ADMIN', 'MEMBER');
CREATE TYPE market_data_source_enum AS ENUM ('SPOTIFY', 'YOUTUBE', 'BANDCAMP', 'WEBRADIO');
CREATE TYPE promo_status_enum AS ENUM ('PENDING', 'REVIEWED', 'SELECTED', 'REJECTED');
CREATE TYPE dj_inbox_status_enum AS ENUM ('UNREAD', 'READ', 'PLAYED', 'PASSED');
CREATE TYPE ad_slot_type_enum AS ENUM ('NEU_HOT', 'GENRE_PAGE', 'SIDEBAR');
CREATE TYPE ad_booking_status_enum AS ENUM ('RESERVED', 'PENDING_PAYMENT', 'ACTIVE', 'EXPIRED', 'CANCELLED');

-- ============================================================================
-- TABLES
-- ============================================================================

CREATE TABLE users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  role role_enum NOT NULL DEFAULT 'USER',
  avatar_url TEXT,
  is_dj_verified BOOLEAN NOT NULL DEFAULT FALSE,
  credits INTEGER NOT NULL DEFAULT 100,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE bands (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  country TEXT,
  city TEXT,
  tier tier_enum NOT NULL DEFAULT 'MICRO',
  description TEXT,
  image_url TEXT,
  spotify_id TEXT,
  monthly_listeners INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE releases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  band_id UUID NOT NULL REFERENCES bands(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  release_date TIMESTAMPTZ NOT NULL,
  release_type TEXT NOT NULL,
  cover_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE tracks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  band_id UUID NOT NULL REFERENCES bands(id) ON DELETE CASCADE,
  release_id UUID REFERENCES releases(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  duration_ms INTEGER,
  preview_url TEXT,
  spotify_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE voting_periods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE fan_votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  voter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  track_id UUID NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
  period_id UUID NOT NULL REFERENCES voting_periods(id) ON DELETE CASCADE,
  credits_spent INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE dj_ballots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  voter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  period_id UUID NOT NULL REFERENCES voting_periods(id) ON DELETE CASCADE,
  ranked_track_ids UUID[] NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(voter_id, period_id)
);

CREATE TABLE chart_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  period_id UUID NOT NULL REFERENCES voting_periods(id) ON DELETE CASCADE,
  track_id UUID NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
  rank INTEGER NOT NULL,
  total_score FLOAT NOT NULL,
  fan_score FLOAT NOT NULL,
  dj_score FLOAT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(period_id, track_id)
);

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE transparency_log_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  track_id UUID NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  vote_type vote_type_enum NOT NULL,
  raw_votes INTEGER NOT NULL,
  credits_spent INTEGER,
  weight FLOAT NOT NULL,
  final_contribution FLOAT NOT NULL,
  reason TEXT
);

CREATE TABLE bot_detection_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  track_id UUID NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
  band_id UUID NOT NULL REFERENCES bands(id) ON DELETE CASCADE,
  alert_type alert_type_enum NOT NULL,
  severity severity_enum NOT NULL,
  votes_count INTEGER NOT NULL,
  time_window INTEGER NOT NULL,
  suspicious_ips TEXT[] NOT NULL,
  new_account_ratio FLOAT,
  status alert_status_enum NOT NULL DEFAULT 'FLAGGED',
  reviewed_by_id UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ
);

CREATE TABLE band_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  band_id UUID NOT NULL REFERENCES bands(id) ON DELETE CASCADE,
  period_id UUID NOT NULL REFERENCES voting_periods(id) ON DELETE CASCADE,
  free_category TEXT NOT NULL,
  paid_categories TEXT[] NOT NULL,
  total_cost FLOAT NOT NULL DEFAULT 0,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(band_id, period_id)
);

CREATE TABLE ai_predictions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  band_id UUID NOT NULL REFERENCES bands(id) ON DELETE CASCADE,
  confidence_score FLOAT NOT NULL,
  predicted_tier tier_enum NOT NULL,
  vote_velocity FLOAT NOT NULL,
  genre_momentum FLOAT NOT NULL,
  stream_growth FLOAT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE label_band_mandates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  label_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  band_id UUID NOT NULL REFERENCES bands(id) ON DELETE CASCADE,
  status mandate_status_enum NOT NULL DEFAULT 'PENDING',
  granted_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(label_id, band_id)
);

CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  venue TEXT NOT NULL,
  city TEXT NOT NULL,
  country TEXT NOT NULL,
  date TIMESTAMPTZ NOT NULL,
  description TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE event_intents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(event_id, user_id)
);

CREATE TABLE spotlights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  band_id UUID NOT NULL REFERENCES bands(id) ON DELETE CASCADE,
  date TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE awards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  band_id UUID REFERENCES bands(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  award_type TEXT NOT NULL,
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  is_automatic BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE dj_ranking_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  predictive_accuracy FLOAT NOT NULL DEFAULT 0,
  participation_rate FLOAT NOT NULL DEFAULT 0,
  total_score FLOAT NOT NULL DEFAULT 0,
  computed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE dj_feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dj_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  band_id UUID NOT NULL REFERENCES bands(id) ON DELETE CASCADE,
  track_id UUID REFERENCES tracks(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE achievement_definitions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,
  pillar achievement_pillar_enum NOT NULL,
  rarity achievement_rarity_enum NOT NULL DEFAULT 'COMMON',
  title_de TEXT NOT NULL,
  title_en TEXT NOT NULL,
  desc_de TEXT NOT NULL,
  desc_en TEXT NOT NULL,
  icon_key TEXT NOT NULL DEFAULT 'award',
  requires_kyc BOOLEAN NOT NULL DEFAULT FALSE,
  is_automatic BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE user_achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES achievement_definitions(id) ON DELETE CASCADE,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB,
  UNIQUE(user_id, achievement_id)
);

CREATE TABLE labels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  website_url TEXT,
  contact_email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE label_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  label_id UUID NOT NULL REFERENCES labels(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role label_member_role_enum NOT NULL DEFAULT 'MEMBER',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(label_id, user_id)
);

-- Note: we need to alter band table to optionally link directly to labels
ALTER TABLE bands ADD COLUMN label_id UUID REFERENCES labels(id) ON DELETE SET NULL;

CREATE TABLE market_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  band_id UUID NOT NULL REFERENCES bands(id) ON DELETE CASCADE,
  source market_data_source_enum NOT NULL,
  value FLOAT NOT NULL,
  metadata JSONB,
  snapshot_date TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE promo_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  submitted_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  band_id UUID NOT NULL REFERENCES bands(id) ON DELETE CASCADE,
  release_id UUID REFERENCES releases(id) ON DELETE CASCADE,
  message TEXT,
  status promo_status_enum NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE dj_inbox_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  promo_submission_id UUID NOT NULL REFERENCES promo_submissions(id) ON DELETE CASCADE,
  dj_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status dj_inbox_status_enum NOT NULL DEFAULT 'UNREAD',
  feedback_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(promo_submission_id, dj_user_id)
);

CREATE TABLE ad_slots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slot_type ad_slot_type_enum NOT NULL,
  week_start TIMESTAMPTZ NOT NULL,
  is_available BOOLEAN NOT NULL DEFAULT TRUE,
  max_bookings INTEGER NOT NULL DEFAULT 1,
  price_eur FLOAT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(slot_type, week_start)
);

CREATE TABLE ad_bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ad_slot_id UUID NOT NULL REFERENCES ad_slots(id) ON DELETE CASCADE,
  band_id UUID NOT NULL REFERENCES bands(id) ON DELETE CASCADE,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  week_count INTEGER NOT NULL,
  status ad_booking_status_enum NOT NULL DEFAULT 'RESERVED',
  stripe_session_id TEXT UNIQUE,
  stripe_payment_intent_id TEXT,
  asset_url TEXT,
  headline TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- USER KV STORE (Replaces LocalStorage & Redis)
-- ============================================================================

CREATE TABLE user_kv_store (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE, -- can be null for anonymous session id
  session_id TEXT, -- fallback for unauthenticated users
  key TEXT NOT NULL,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, key),
  UNIQUE(session_id, key)
);

-- Enable RLS for kv store
ALTER TABLE user_kv_store ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own kv store"
  ON user_kv_store FOR ALL
  USING (
    auth.uid() = user_id OR
    (auth.uid() IS NULL AND session_id IS NOT NULL)
  );

-- ============================================================================
-- SUPABASE AUTH SYNCHRONIZATION
-- ============================================================================

-- Automatically create a public.users row when a user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, name, avatar_url)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Add remaining RLS from schema
ALTER TABLE releases ENABLE ROW LEVEL SECURITY;
ALTER TABLE voting_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE chart_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE bot_detection_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE band_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_intents ENABLE ROW LEVEL SECURITY;
ALTER TABLE spotlights ENABLE ROW LEVEL SECURITY;
ALTER TABLE awards ENABLE ROW LEVEL SECURITY;
ALTER TABLE dj_ranking_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievement_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE label_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE promo_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE dj_inbox_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_bookings ENABLE ROW LEVEL SECURITY;

-- Additional simple policies
CREATE POLICY "Public read access for most tables" ON releases FOR SELECT USING (true);
CREATE POLICY "Public read access for most tables" ON voting_periods FOR SELECT USING (true);
CREATE POLICY "Public read access for most tables" ON chart_results FOR SELECT USING (true);
CREATE POLICY "Public read access for most tables" ON events FOR SELECT USING (true);
CREATE POLICY "Public read access for most tables" ON spotlights FOR SELECT USING (true);
CREATE POLICY "Public read access for most tables" ON awards FOR SELECT USING (true);
CREATE POLICY "Public read access for most tables" ON achievement_definitions FOR SELECT USING (true);
CREATE POLICY "Public read access for most tables" ON labels FOR SELECT USING (true);
CREATE POLICY "Public read access for most tables" ON ad_slots FOR SELECT USING (true);
