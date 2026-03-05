-- ============================================
-- MIGRATION 004 — Squad / Grupo System
-- Run this in: Supabase Dashboard > SQL Editor
-- ============================================

-- ============================================
-- Tabela principal do squad
-- ============================================
CREATE TABLE IF NOT EXISTS squads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  leader_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Membros do squad (inclui o líder)
-- Cada usuário pode estar em apenas 1 squad
-- ============================================
CREATE TABLE IF NOT EXISTS squad_members (
  squad_id UUID NOT NULL REFERENCES squads(id) ON DELETE CASCADE,
  user_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (squad_id, user_id)
);

-- Garante que um usuário não pode estar em dois squads ao mesmo tempo
CREATE UNIQUE INDEX IF NOT EXISTS idx_squad_members_user ON squad_members(user_id);

-- ============================================
-- Convites pendentes
-- ============================================
CREATE TABLE IF NOT EXISTS squad_invites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  squad_id   UUID NOT NULL REFERENCES squads(id) ON DELETE CASCADE,
  inviter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  invitee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(squad_id, invitee_id)
);

-- ============================================
-- RLS
-- ============================================
ALTER TABLE squads ENABLE ROW LEVEL SECURITY;
ALTER TABLE squad_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE squad_invites ENABLE ROW LEVEL SECURITY;

-- squads: visível apenas para membros do squad
CREATE POLICY "Squad members can view squad"
  ON squads FOR SELECT USING (
    id IN (SELECT squad_id FROM squad_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can create squads"
  ON squads FOR INSERT WITH CHECK (auth.uid() = leader_id);

CREATE POLICY "Leader can delete squad"
  ON squads FOR DELETE USING (auth.uid() = leader_id);

-- squad_members: membros do mesmo squad podem ver uns aos outros
CREATE POLICY "Squad members can view each other"
  ON squad_members FOR SELECT USING (
    squad_id IN (SELECT squad_id FROM squad_members sm WHERE sm.user_id = auth.uid())
  );

CREATE POLICY "Users can join squad (accept invite)"
  ON squad_members FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Usuário pode sair OU líder pode kickar
CREATE POLICY "Members can leave or be kicked"
  ON squad_members FOR DELETE USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM squads WHERE id = squad_id AND leader_id = auth.uid())
  );

-- squad_invites
CREATE POLICY "View own invites"
  ON squad_invites FOR SELECT USING (
    auth.uid() = invitee_id OR auth.uid() = inviter_id
  );

CREATE POLICY "Squad members can invite"
  ON squad_invites FOR INSERT WITH CHECK (
    auth.uid() = inviter_id AND
    EXISTS (SELECT 1 FROM squad_members WHERE squad_id = squad_invites.squad_id AND user_id = auth.uid())
  );

CREATE POLICY "Invitee or inviter can delete invite"
  ON squad_invites FOR DELETE USING (
    auth.uid() = invitee_id OR auth.uid() = inviter_id
  );

-- ============================================
-- Realtime nas 3 tabelas
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE squads;
ALTER PUBLICATION supabase_realtime ADD TABLE squad_members;
ALTER PUBLICATION supabase_realtime ADD TABLE squad_invites;
