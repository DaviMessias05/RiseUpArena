-- ============================================
-- MIGRATION: Sistema de Ranking Points (RP)
-- Substitui ELO por RP fixo (+25 vitória, -15 derrota)
-- Níveis 1-10 baseados em faixas de RP
-- ============================================

-- 1. Alterar default de rating de 1000 para 0
ALTER TABLE rankings ALTER COLUMN rating SET DEFAULT 0;

-- 2. Remover constraint de rank_tier (valores antigos: bronze, silver, gold, etc.)
--    e permitir novos valores (level_1 a level_10)
ALTER TABLE rankings DROP CONSTRAINT IF EXISTS rankings_rank_tier_check;
ALTER TABLE rankings ADD CONSTRAINT rankings_rank_tier_check
  CHECK (rank_tier IN ('level_1', 'level_2', 'level_3', 'level_4', 'level_5',
                       'level_6', 'level_7', 'level_8', 'level_9', 'level_10'));

-- 3. Alterar default de rank_tier
ALTER TABLE rankings ALTER COLUMN rank_tier SET DEFAULT 'level_1';

-- 4. Atualizar função get_rank_tier para níveis 1-10
CREATE OR REPLACE FUNCTION get_rank_tier(rating INTEGER)
RETURNS VARCHAR(20) AS $$
BEGIN
  RETURN CASE
    WHEN rating >= 3000 THEN 'level_10'
    WHEN rating >= 2501 THEN 'level_9'
    WHEN rating >= 2101 THEN 'level_8'
    WHEN rating >= 1701 THEN 'level_7'
    WHEN rating >= 1301 THEN 'level_6'
    WHEN rating >= 901  THEN 'level_5'
    WHEN rating >= 601  THEN 'level_4'
    WHEN rating >= 301  THEN 'level_3'
    WHEN rating >= 101  THEN 'level_2'
    ELSE 'level_1'
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 5. Substituir função calculate_elo por calculate_rp
CREATE OR REPLACE FUNCTION calculate_rp(is_winner BOOLEAN)
RETURNS INTEGER AS $$
BEGIN
  IF is_winner THEN
    RETURN 25;
  ELSE
    RETURN -15;
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 6. Resetar rankings existentes para o novo sistema (rating = 0, level_1)
-- ATENÇÃO: Isso zera todos os rankings. Remova essas linhas se quiser preservar dados.
UPDATE rankings SET rating = 0, rank_tier = 'level_1';

-- 7. Adicionar coluna result em match_players se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'match_players' AND column_name = 'result'
  ) THEN
    ALTER TABLE match_players ADD COLUMN result VARCHAR(10)
      CHECK (result IN ('win', 'loss', 'draw'));
  END IF;
END $$;
