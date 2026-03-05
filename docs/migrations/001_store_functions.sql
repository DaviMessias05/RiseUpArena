-- ============================================
-- MIGRATION 001 — Store Atomic Functions
-- Run this in: Supabase Dashboard > SQL Editor
-- ============================================

-- ============================================
-- STORE: Deduct credits atomically
-- Raises exception if balance is insufficient
-- (prevents double-spend via concurrent requests)
-- ============================================
CREATE OR REPLACE FUNCTION deduct_credits(p_user_id UUID, p_amount INTEGER)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE profiles
  SET credits = credits - p_amount
  WHERE id = p_user_id AND credits >= p_amount;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Insufficient credits';
  END IF;
END;
$$;

-- ============================================
-- STORE: Add credits (refund / rollback)
-- ============================================
CREATE OR REPLACE FUNCTION add_credits(p_user_id UUID, p_amount INTEGER)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE profiles
  SET credits = credits + p_amount
  WHERE id = p_user_id;
END;
$$;

-- ============================================
-- STORE: Deduct stock atomically
-- Only decrements when stock >= amount (stock = -1 means unlimited)
-- ============================================
CREATE OR REPLACE FUNCTION deduct_stock(p_product_id UUID, p_amount INTEGER)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE store_products
  SET stock = stock - p_amount
  WHERE id = p_product_id AND stock >= p_amount;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Insufficient stock';
  END IF;
END;
$$;

-- ============================================
-- STORE: Add stock back (refund / rollback)
-- ============================================
CREATE OR REPLACE FUNCTION add_stock(p_product_id UUID, p_amount INTEGER)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE store_products
  SET stock = stock + p_amount
  WHERE id = p_product_id;
END;
$$;

-- ============================================
-- PERFORMANCE: is_admin() helper function
-- Replaces 12 per-row subqueries in RLS policies
-- with a single STABLE function call
-- ============================================
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$;

-- ============================================
-- SECURITY: Fix handle_new_user search_path
-- Prevents search_path injection on SECURITY DEFINER
-- ============================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, username, display_name, avatar_url, email_verified, cpf)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', SPLIT_PART(NEW.email, '@', 1) || '_' || SUBSTR(NEW.id::TEXT, 1, 6)),
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'full_name', SPLIT_PART(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NULL),
    COALESCE(NEW.email_confirmed_at IS NOT NULL, FALSE),
    NEW.raw_user_meta_data->>'cpf'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public;
