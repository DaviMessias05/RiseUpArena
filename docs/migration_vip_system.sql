-- ============================================
-- MIGRATION: Sistema VIP
-- Bronze (R$24,90), Silver (R$50), Premium (R$75)
-- ============================================

-- 1. Adicionar campos VIP na tabela profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS vip_tier VARCHAR(20) DEFAULT NULL
  CHECK (vip_tier IN ('bronze', 'silver', 'premium'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS vip_expires_at TIMESTAMPTZ DEFAULT NULL;

-- 2. Tabela de planos VIP
CREATE TABLE IF NOT EXISTS vip_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tier VARCHAR(20) NOT NULL UNIQUE CHECK (tier IN ('bronze', 'silver', 'premium')),
  name VARCHAR(50) NOT NULL,
  price_cents INTEGER NOT NULL,
  match_discount NUMERIC(5,2) DEFAULT 0,
  tournament_discount NUMERIC(5,2) DEFAULT 0,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inserir planos
INSERT INTO vip_plans (tier, name, price_cents, match_discount, tournament_discount, description) VALUES
  ('bronze', 'VIP Bronze', 2490, 0, 0, 'Badge VIP Bronze, avatar exclusivo, torneios VIP, prioridade matchmaking, destaque no ranking'),
  ('silver', 'VIP Silver', 5000, 2.5, 0, 'Todos benefícios Bronze + 2,5% desconto em partidas'),
  ('premium', 'VIP Premium', 7500, 5, 5, 'Todos benefícios Silver + borda de perfil, 5% desconto em partidas e campeonatos')
ON CONFLICT (tier) DO NOTHING;

-- 3. Tabela de assinaturas VIP (histórico)
CREATE TABLE IF NOT EXISTS vip_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  plan_tier VARCHAR(20) NOT NULL CHECK (plan_tier IN ('bronze', 'silver', 'premium')),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired')),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vip_sub_user ON vip_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_vip_sub_status ON vip_subscriptions(status);

-- 4. RLS policies
ALTER TABLE vip_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "VIP plans viewable by everyone" ON vip_plans FOR SELECT USING (true);
CREATE POLICY "Only admins manage VIP plans" ON vip_plans FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

ALTER TABLE vip_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own subscriptions" ON vip_subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all subscriptions" ON vip_subscriptions FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "System manages subscriptions" ON vip_subscriptions FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
