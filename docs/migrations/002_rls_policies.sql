-- ============================================
-- MIGRATION 002 — RLS Policy Fixes
-- Run this in: Supabase Dashboard > SQL Editor
-- ============================================

-- ============================================
-- ISSUE #17: Corrigir políticas duplicadas de SELECT em orders
-- Duas políticas SELECT na mesma tabela causam avaliação por linha para ambas.
-- Combina em uma única política com OR.
-- ============================================
DROP POLICY IF EXISTS "Users can view own orders" ON orders;
DROP POLICY IF EXISTS "Admins can view all orders" ON orders;

CREATE POLICY "Users and admins can view orders"
  ON orders FOR SELECT
  USING (auth.uid() = user_id OR is_admin());

-- ============================================
-- ISSUE #15: Substituir subqueries manuais por is_admin()
-- nas políticas RLS de todas as tabelas (exceto orders, já corrigido acima).
-- Reduz de N subqueries por linha para 1 chamada de função STABLE.
-- ============================================

-- games
DROP POLICY IF EXISTS "Only admins can manage games" ON games;
CREATE POLICY "Only admins can manage games"
  ON games FOR ALL
  USING (is_admin());

-- tournaments
DROP POLICY IF EXISTS "Only admins can create tournaments" ON tournaments;
DROP POLICY IF EXISTS "Only admins can update tournaments" ON tournaments;

CREATE POLICY "Only admins can create tournaments"
  ON tournaments FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "Only admins can update tournaments"
  ON tournaments FOR UPDATE
  USING (is_admin());

-- tournament_matches
DROP POLICY IF EXISTS "Only admins can manage tournament matches" ON tournament_matches;
CREATE POLICY "Only admins can manage tournament matches"
  ON tournament_matches FOR ALL
  USING (is_admin());

-- lobbies (mantém a lógica de criador OU admin)
DROP POLICY IF EXISTS "Lobby creator or admin can update lobby" ON lobbies;
CREATE POLICY "Lobby creator or admin can update lobby"
  ON lobbies FOR UPDATE
  USING (auth.uid() = created_by OR is_admin());

-- matches
DROP POLICY IF EXISTS "Only admins or system can create matches" ON matches;
DROP POLICY IF EXISTS "Only admins can update matches" ON matches;

CREATE POLICY "Only admins or system can create matches"
  ON matches FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "Only admins can update matches"
  ON matches FOR UPDATE
  USING (is_admin());

-- match_players
DROP POLICY IF EXISTS "Only admins can manage match players" ON match_players;
CREATE POLICY "Only admins can manage match players"
  ON match_players FOR ALL
  USING (is_admin());

-- rankings
DROP POLICY IF EXISTS "System manages rankings" ON rankings;
CREATE POLICY "System manages rankings"
  ON rankings FOR ALL
  USING (is_admin());

-- player_stats
DROP POLICY IF EXISTS "System manages player stats" ON player_stats;
CREATE POLICY "System manages player stats"
  ON player_stats FOR ALL
  USING (is_admin());

-- store_products
DROP POLICY IF EXISTS "Only admins can manage products" ON store_products;
CREATE POLICY "Only admins can manage products"
  ON store_products FOR ALL
  USING (is_admin());

-- ============================================
-- ISSUE #8: Trigger para bloquear escalada de privilégio
-- Impede que usuários alterem role, credits ou email_verified
-- via updateProfile() no frontend (DevTools, etc.)
-- ============================================
CREATE OR REPLACE FUNCTION prevent_privilege_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Apenas admins podem alterar role
  IF NEW.role <> OLD.role AND NOT is_admin() THEN
    RAISE EXCEPTION 'Permission denied: cannot change role';
  END IF;

  -- Apenas o sistema (service role via backend) pode alterar credits
  -- auth.uid() é NULL quando chamado pelo service role
  IF NEW.credits <> OLD.credits AND auth.uid() IS NOT NULL AND NOT is_admin() THEN
    RAISE EXCEPTION 'Permission denied: cannot change credits';
  END IF;

  -- Apenas o sistema pode marcar email_verified
  IF NEW.email_verified <> OLD.email_verified AND auth.uid() IS NOT NULL AND NOT is_admin() THEN
    RAISE EXCEPTION 'Permission denied: cannot change email_verified';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_privilege_escalation ON profiles;
CREATE TRIGGER trg_prevent_privilege_escalation
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION prevent_privilege_escalation();
