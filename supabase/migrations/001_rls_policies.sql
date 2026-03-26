-- ============================================================================
-- Migration: 001_rls_policies.sql
-- Row Level Security Policies — DarkTunes Charts (Spec §7.2)
-- ============================================================================
-- All tables use UUID primary keys aligned with Supabase auth.uid().
-- auth.uid() returns the UUID of the currently authenticated user.
-- ============================================================================

-- Enable RLS on all protected tables
ALTER TABLE users               ENABLE ROW LEVEL SECURITY;
ALTER TABLE bands               ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracks              ENABLE ROW LEVEL SECURITY;
ALTER TABLE fan_votes           ENABLE ROW LEVEL SECURITY;
ALTER TABLE dj_ballots          ENABLE ROW LEVEL SECURITY;
ALTER TABLE band_votes          ENABLE ROW LEVEL SECURITY;
ALTER TABLE label_band_mandates ENABLE ROW LEVEL SECURITY;
ALTER TABLE dj_feedback         ENABLE ROW LEVEL SECURITY;
ALTER TABLE transparency_log_entries ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- TABLE: users
-- ============================================================================

-- Users can read their own profile
CREATE POLICY "Users can read own profile"
  ON users FOR SELECT
  USING (auth.uid()::text = id);

-- Admins can read all profiles
CREATE POLICY "Admins can read all users"
  ON users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()::text
        AND u.role IN ('ADMIN', 'EDITOR')
    )
  );

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid()::text = id)
  WITH CHECK (auth.uid()::text = id);

-- ============================================================================
-- TABLE: bands
-- ============================================================================

-- Anyone can read public band information
CREATE POLICY "Bands are publicly readable"
  ON bands FOR SELECT
  USING (true);

-- Band owners can update their own band
CREATE POLICY "Band owners can update their band"
  ON bands FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()::text
        AND u.id = bands.owner_id
    )
  );

-- Labels können mandatierte Bands verwalten (Spec §7.2)
CREATE POLICY "Labels können mandatierte Bands verwalten"
  ON bands FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM label_band_mandates lbm
      JOIN users u ON u.id = auth.uid()::text
      WHERE lbm.band_id = bands.id
        AND lbm.label_id = u.id
        AND lbm.status = 'ACTIVE'
        AND u.role IN ('LABEL', 'AR')
    )
  );

-- ============================================================================
-- TABLE: tracks
-- ============================================================================

-- Tracks are publicly readable
CREATE POLICY "Tracks are publicly readable"
  ON tracks FOR SELECT
  USING (true);

-- Band owners and mandated labels can manage their tracks
CREATE POLICY "Band owners can manage tracks"
  ON tracks FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM bands b
      WHERE b.id = tracks.band_id
        AND b.owner_id = auth.uid()::text
    )
  );

CREATE POLICY "Mandated labels can manage tracks"
  ON tracks FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM label_band_mandates lbm
      JOIN users u ON u.id = auth.uid()::text
      WHERE lbm.band_id = tracks.band_id
        AND lbm.label_id = u.id
        AND lbm.status = 'ACTIVE'
        AND u.role IN ('LABEL', 'AR')
    )
  );

-- ============================================================================
-- TABLE: fan_votes
-- ============================================================================

-- Users can only read their own fan votes
CREATE POLICY "Fans can read own votes"
  ON fan_votes FOR SELECT
  USING (auth.uid()::text = voter_id);

-- Users can create their own fan votes
CREATE POLICY "Fans can create own votes"
  ON fan_votes FOR INSERT
  WITH CHECK (auth.uid()::text = voter_id);

-- Admins can read all fan votes (for audit purposes)
CREATE POLICY "Admins can read all fan votes"
  ON fan_votes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()::text
        AND u.role = 'ADMIN'
    )
  );

-- ============================================================================
-- TABLE: dj_ballots
-- ============================================================================

-- DJs can read their own ballots
CREATE POLICY "DJs can read own ballots"
  ON dj_ballots FOR SELECT
  USING (auth.uid()::text = voter_id);

-- DJs can create their own ballots
CREATE POLICY "DJs can create own ballots"
  ON dj_ballots FOR INSERT
  WITH CHECK (
    auth.uid()::text = voter_id
    AND EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()::text
        AND u.is_dj_verified = true
    )
  );

-- ============================================================================
-- TABLE: band_votes
-- ============================================================================

-- Bands can read their own votes
CREATE POLICY "Bands can read own peer votes"
  ON band_votes FOR SELECT
  USING (auth.uid()::text = voter_id);

-- Bands can create peer votes
CREATE POLICY "Bands can create peer votes"
  ON band_votes FOR INSERT
  WITH CHECK (
    auth.uid()::text = voter_id
    AND EXISTS (
      SELECT 1 FROM users u
      JOIN bands b ON b.owner_id = u.id
      WHERE u.id = auth.uid()::text
    )
  );

-- ============================================================================
-- TABLE: label_band_mandates
-- ============================================================================

-- Labels and band owners can view mandates they are party to
CREATE POLICY "Mandate parties can view mandates"
  ON label_band_mandates FOR SELECT
  USING (
    auth.uid()::text = label_id
    OR EXISTS (
      SELECT 1 FROM bands b
      WHERE b.id = label_band_mandates.band_id
        AND b.owner_id = auth.uid()::text
    )
  );

-- Labels can create mandate requests
CREATE POLICY "Labels can request mandates"
  ON label_band_mandates FOR INSERT
  WITH CHECK (
    auth.uid()::text = label_id
    AND EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()::text
        AND u.role IN ('LABEL', 'AR')
    )
  );

-- Band owners can update mandate status (accept/reject)
CREATE POLICY "Band owners can respond to mandates"
  ON label_band_mandates FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM bands b
      WHERE b.id = label_band_mandates.band_id
        AND b.owner_id = auth.uid()::text
    )
  );

-- ============================================================================
-- TABLE: dj_feedback
-- ============================================================================

-- DJs can read and write their own feedback
CREATE POLICY "DJs can manage own feedback"
  ON dj_feedback FOR ALL
  USING (auth.uid()::text = dj_id);

-- Bands can read feedback directed at them
CREATE POLICY "Bands can read feedback received"
  ON dj_feedback FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM bands b
      WHERE b.id = dj_feedback.band_id
        AND b.owner_id = auth.uid()::text
    )
  );

-- ============================================================================
-- TABLE: transparency_log_entries
-- ============================================================================

-- Transparency log is publicly readable (algorithmic transparency)
CREATE POLICY "Transparency log is publicly readable"
  ON transparency_log_entries FOR SELECT
  USING (true);

-- Only server-side actions (service role) can write to the log
CREATE POLICY "Only service role can write transparency log"
  ON transparency_log_entries FOR INSERT
  WITH CHECK (auth.role() = 'service_role');
