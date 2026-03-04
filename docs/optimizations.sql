-- ============================================
-- RISE UP ARENA - Security & Performance Optimizations
-- Run this in Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. ATOMIC CREDIT/STOCK FUNCTIONS (Fix double-spend)
-- ============================================

-- Atomic credit deduction - prevents double-spend
CREATE OR REPLACE FUNCTION deduct_credits(p_user_id UUID, p_amount INTEGER)
RETURNS INTEGER AS $$
DECLARE
  new_balance INTEGER;
BEGIN
  UPDATE profiles
  SET credits = credits - p_amount
  WHERE id = p_user_id AND credits >= p_amount
  RETURNING credits INTO new_balance;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Insufficient credits';
  END IF;

  RETURN new_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Atomic credit addition (for refunds)
CREATE OR REPLACE FUNCTION add_credits(p_user_id UUID, p_amount INTEGER)
RETURNS INTEGER AS $$
DECLARE
  new_balance INTEGER;
BEGIN
  UPDATE profiles
  SET credits = credits + p_amount
  WHERE id = p_user_id
  RETURNING credits INTO new_balance;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  RETURN new_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Atomic stock deduction
CREATE OR REPLACE FUNCTION deduct_stock(p_product_id UUID, p_amount INTEGER)
RETURNS INTEGER AS $$
DECLARE
  new_stock INTEGER;
BEGIN
  UPDATE store_products
  SET stock = stock - p_amount
  WHERE id = p_product_id AND stock >= p_amount
  RETURNING stock INTO new_stock;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Insufficient stock';
  END IF;

  RETURN new_stock;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Atomic stock addition (for refunds)
CREATE OR REPLACE FUNCTION add_stock(p_product_id UUID, p_amount INTEGER)
RETURNS INTEGER AS $$
DECLARE
  new_stock INTEGER;
BEGIN
  UPDATE store_products
  SET stock = stock + p_amount
  WHERE id = p_product_id
  RETURNING stock INTO new_stock;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Product not found';
  END IF;

  RETURN new_stock;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================
-- 2. CACHED is_admin() FUNCTION (Fix slow RLS policies)
-- ============================================

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

-- ============================================
-- 3. FIX handle_new_user search_path
-- ============================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, username, display_name, avatar_url, email_verified)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      LEFT(NEW.raw_user_meta_data->>'username', 30),
      SPLIT_PART(NEW.email, '@', 1) || '_' || SUBSTR(NEW.id::TEXT, 1, 6)
    ),
    COALESCE(
      NEW.raw_user_meta_data->>'display_name',
      NEW.raw_user_meta_data->>'full_name',
      SPLIT_PART(NEW.email, '@', 1)
    ),
    NEW.raw_user_meta_data->>'avatar_url',
    COALESCE(NEW.email_confirmed_at IS NOT NULL, FALSE)
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'handle_new_user failed for %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================
-- 4. PREVENT PRIVILEGE ESCALATION VIA DB TRIGGER
-- ============================================

CREATE OR REPLACE FUNCTION prevent_self_privilege_escalation()
RETURNS TRIGGER AS $$
BEGIN
  -- Only allow admins to change sensitive fields
  -- If the user is updating their own profile (not an admin updating someone else's)
  IF auth.uid() = NEW.id THEN
    -- Prevent self-modification of role, credits, email_verified
    NEW.role := OLD.role;
    NEW.credits := OLD.credits;
    NEW.email_verified := OLD.email_verified;
    NEW.email := OLD.email;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS tr_prevent_escalation ON profiles;
CREATE TRIGGER tr_prevent_escalation
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION prevent_self_privilege_escalation();

-- ============================================
-- 5. EMAIL VERIFICATION SYNC TRIGGER
-- ============================================

CREATE OR REPLACE FUNCTION handle_user_email_verified()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.email_confirmed_at IS NOT NULL AND OLD.email_confirmed_at IS NULL THEN
    UPDATE profiles SET email_verified = TRUE WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_email_verified ON auth.users;
CREATE TRIGGER on_auth_user_email_verified
  AFTER UPDATE OF email_confirmed_at ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_user_email_verified();

-- ============================================
-- 6. OPTIMIZE RLS POLICIES (replace subqueries with is_admin())
-- ============================================

-- Games
DROP POLICY IF EXISTS "Only admins can manage games" ON games;
CREATE POLICY "Only admins can manage games"
  ON games FOR ALL USING (is_admin());

-- Tournaments
DROP POLICY IF EXISTS "Only admins can create tournaments" ON tournaments;
CREATE POLICY "Only admins can create tournaments"
  ON tournaments FOR INSERT WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Only admins can update tournaments" ON tournaments;
CREATE POLICY "Only admins can update tournaments"
  ON tournaments FOR UPDATE USING (is_admin());

-- Tournament matches
DROP POLICY IF EXISTS "Only admins can manage tournament matches" ON tournament_matches;
CREATE POLICY "Only admins can manage tournament matches"
  ON tournament_matches FOR ALL USING (is_admin());

-- Lobbies (admin part)
DROP POLICY IF EXISTS "Lobby creator or admin can update lobby" ON lobbies;
CREATE POLICY "Lobby creator or admin can update lobby"
  ON lobbies FOR UPDATE USING (
    auth.uid() = created_by OR is_admin()
  );

-- Matches
DROP POLICY IF EXISTS "Only admins or system can create matches" ON matches;
CREATE POLICY "Only admins or system can create matches"
  ON matches FOR INSERT WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Only admins can update matches" ON matches;
CREATE POLICY "Only admins can update matches"
  ON matches FOR UPDATE USING (is_admin());

-- Match players
DROP POLICY IF EXISTS "Only admins can manage match players" ON match_players;
CREATE POLICY "Only admins can manage match players"
  ON match_players FOR ALL USING (is_admin());

-- Rankings
DROP POLICY IF EXISTS "System manages rankings" ON rankings;
CREATE POLICY "System manages rankings"
  ON rankings FOR ALL USING (is_admin());

-- Player stats
DROP POLICY IF EXISTS "System manages player stats" ON player_stats;
CREATE POLICY "System manages player stats"
  ON player_stats FOR ALL USING (is_admin());

-- Store products
DROP POLICY IF EXISTS "Only admins can manage products" ON store_products;
CREATE POLICY "Only admins can manage products"
  ON store_products FOR ALL USING (is_admin());

-- Orders (combine duplicate SELECT policies)
DROP POLICY IF EXISTS "Users can view own orders" ON orders;
DROP POLICY IF EXISTS "Admins can view all orders" ON orders;
CREATE POLICY "Users can view own orders or admins view all"
  ON orders FOR SELECT USING (
    auth.uid() = user_id OR is_admin()
  );

-- ============================================
-- 7. PERFORMANCE INDEXES for millions of users
-- ============================================

-- Partial indexes for common filtered queries
CREATE INDEX IF NOT EXISTS idx_lobbies_waiting ON lobbies(created_at DESC) WHERE status IN ('waiting', 'ready');
CREATE INDEX IF NOT EXISTS idx_matches_active ON matches(created_at DESC) WHERE status = 'in_progress';
CREATE INDEX IF NOT EXISTS idx_tournaments_open ON tournaments(start_date) WHERE status IN ('open', 'ongoing');

-- Profile lookups
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_created ON profiles(created_at DESC);

-- Chat message pagination
CREATE INDEX IF NOT EXISTS idx_chat_channel_time ON chat_messages(channel_type, channel_id, created_at DESC);

-- Match history per user
CREATE INDEX IF NOT EXISTS idx_mp_user_match ON match_players(user_id, match_id);

-- Tournament participant lookups
CREATE INDEX IF NOT EXISTS idx_tp_status ON tournament_participants(tournament_id, status);

-- Orders history
CREATE INDEX IF NOT EXISTS idx_orders_user_time ON orders(user_id, created_at DESC);

-- Store active products
CREATE INDEX IF NOT EXISTS idx_products_active_cat ON store_products(category, name) WHERE is_active = true;
