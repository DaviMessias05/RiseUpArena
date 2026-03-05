-- ============================================
-- MIGRATION 003 — Direct Messages Privacy
-- Run this in: Supabase Dashboard > SQL Editor
-- ============================================

-- ============================================
-- Restringir visibilidade de mensagens diretas
-- channel_type = 'direct' só é visível para os
-- dois participantes da conversa.
-- channel_id = uuid1_uuid2 (ordenados)
-- ============================================
DROP POLICY IF EXISTS "Chat messages viewable by everyone" ON chat_messages;

CREATE POLICY "Chat messages viewable by everyone"
  ON chat_messages FOR SELECT
  USING (
    channel_type != 'direct'
    OR auth.uid()::text = split_part(channel_id, '_', 1)
    OR auth.uid()::text = split_part(channel_id, '_', 2)
  );
