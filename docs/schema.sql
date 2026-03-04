-- ============================================
-- RISE UP - Esports Platform
-- Supabase PostgreSQL Schema
-- ============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- PROFILES
-- ============================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username VARCHAR(30) UNIQUE NOT NULL,
  display_name VARCHAR(60),
  email VARCHAR(255) NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin', 'moderator')),
  credits INTEGER DEFAULT 0 CHECK (credits >= 0),
  email_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_profiles_username ON profiles(username);
CREATE INDEX idx_profiles_role ON profiles(role);

-- ============================================
-- GAMES
-- ============================================
CREATE TABLE games (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  icon_url TEXT,
  banner_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  max_team_size INTEGER DEFAULT 5,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_games_slug ON games(slug);
CREATE INDEX idx_games_active ON games(is_active);

-- Seed initial games
INSERT INTO games (name, slug, description, max_team_size) VALUES
  ('Valorant', 'valorant', 'Tactical 5v5 shooter by Riot Games', 5),
  ('Counter-Strike 2', 'cs2', 'Legendary competitive FPS by Valve', 5),
  ('Rainbow Six Siege', 'r6-siege', 'Tactical FPS by Ubisoft', 5);

-- ============================================
-- TOURNAMENTS
-- ============================================
CREATE TABLE tournaments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  banner_url TEXT,
  format VARCHAR(30) NOT NULL CHECK (format IN ('single_elimination', 'double_elimination')),
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'open', 'ongoing', 'finished')),
  max_participants INTEGER NOT NULL DEFAULT 16,
  prize_description TEXT,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tournaments_game ON tournaments(game_id);
CREATE INDEX idx_tournaments_status ON tournaments(status);
CREATE INDEX idx_tournaments_start ON tournaments(start_date);

-- ============================================
-- TOURNAMENT PARTICIPANTS
-- ============================================
CREATE TABLE tournament_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  seed INTEGER,
  status VARCHAR(20) DEFAULT 'registered' CHECK (status IN ('registered', 'checked_in', 'eliminated', 'winner')),
  registered_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tournament_id, user_id)
);

CREATE INDEX idx_tp_tournament ON tournament_participants(tournament_id);
CREATE INDEX idx_tp_user ON tournament_participants(user_id);

-- ============================================
-- TOURNAMENT MATCHES
-- ============================================
CREATE TABLE tournament_matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  round INTEGER NOT NULL,
  match_order INTEGER NOT NULL,
  player1_id UUID REFERENCES profiles(id),
  player2_id UUID REFERENCES profiles(id),
  winner_id UUID REFERENCES profiles(id),
  score_player1 INTEGER DEFAULT 0,
  score_player2 INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'finished')),
  bracket_type VARCHAR(20) DEFAULT 'winners' CHECK (bracket_type IN ('winners', 'losers', 'grand_final')),
  next_match_id UUID REFERENCES tournament_matches(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tm_tournament ON tournament_matches(tournament_id);
CREATE INDEX idx_tm_round ON tournament_matches(tournament_id, round);

-- ============================================
-- LOBBIES
-- ============================================
CREATE TABLE lobbies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  created_by UUID NOT NULL REFERENCES profiles(id),
  status VARCHAR(20) DEFAULT 'waiting' CHECK (status IN ('waiting', 'ready', 'in_match', 'finished')),
  max_players INTEGER DEFAULT 10,
  is_private BOOLEAN DEFAULT FALSE,
  invite_code VARCHAR(10) UNIQUE,
  map VARCHAR(100),
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_lobbies_game ON lobbies(game_id);
CREATE INDEX idx_lobbies_status ON lobbies(status);
CREATE INDEX idx_lobbies_code ON lobbies(invite_code);
CREATE INDEX idx_lobbies_created_by ON lobbies(created_by);

-- ============================================
-- LOBBY PLAYERS
-- ============================================
CREATE TABLE lobby_players (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lobby_id UUID NOT NULL REFERENCES lobbies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  team INTEGER CHECK (team IN (1, 2)),
  is_ready BOOLEAN DEFAULT FALSE,
  is_captain BOOLEAN DEFAULT FALSE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(lobby_id, user_id)
);

CREATE INDEX idx_lp_lobby ON lobby_players(lobby_id);
CREATE INDEX idx_lp_user ON lobby_players(user_id);

-- ============================================
-- MATCHES
-- ============================================
CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  lobby_id UUID REFERENCES lobbies(id),
  tournament_match_id UUID REFERENCES tournament_matches(id),
  map VARCHAR(100),
  score_team1 INTEGER DEFAULT 0,
  score_team2 INTEGER DEFAULT 0,
  winner_team INTEGER CHECK (winner_team IN (1, 2)),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'finished', 'cancelled')),
  duration_seconds INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  finished_at TIMESTAMPTZ
);

CREATE INDEX idx_matches_game ON matches(game_id);
CREATE INDEX idx_matches_lobby ON matches(lobby_id);
CREATE INDEX idx_matches_status ON matches(status);
CREATE INDEX idx_matches_created ON matches(created_at DESC);

-- ============================================
-- MATCH PLAYERS
-- ============================================
CREATE TABLE match_players (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  team INTEGER NOT NULL CHECK (team IN (1, 2)),
  kills INTEGER DEFAULT 0,
  deaths INTEGER DEFAULT 0,
  assists INTEGER DEFAULT 0,
  score INTEGER DEFAULT 0,
  mvp BOOLEAN DEFAULT FALSE,
  rating_change INTEGER DEFAULT 0,
  UNIQUE(match_id, user_id)
);

CREATE INDEX idx_mp_match ON match_players(match_id);
CREATE INDEX idx_mp_user ON match_players(user_id);

-- ============================================
-- RANKINGS
-- ============================================
CREATE TABLE rankings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  rating INTEGER DEFAULT 1000,
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  matches_played INTEGER DEFAULT 0,
  win_streak INTEGER DEFAULT 0,
  best_streak INTEGER DEFAULT 0,
  rank_tier VARCHAR(20) DEFAULT 'bronze' CHECK (rank_tier IN ('bronze', 'silver', 'gold', 'platinum', 'diamond', 'master', 'legend')),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, game_id)
);

CREATE INDEX idx_rankings_game_rating ON rankings(game_id, rating DESC);
CREATE INDEX idx_rankings_user ON rankings(user_id);
CREATE INDEX idx_rankings_tier ON rankings(game_id, rank_tier);

-- ============================================
-- PLAYER STATS
-- ============================================
CREATE TABLE player_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  total_kills INTEGER DEFAULT 0,
  total_deaths INTEGER DEFAULT 0,
  total_assists INTEGER DEFAULT 0,
  total_matches INTEGER DEFAULT 0,
  total_wins INTEGER DEFAULT 0,
  total_losses INTEGER DEFAULT 0,
  total_mvps INTEGER DEFAULT 0,
  avg_score NUMERIC(8,2) DEFAULT 0,
  kd_ratio NUMERIC(5,2) DEFAULT 0,
  win_rate NUMERIC(5,2) DEFAULT 0,
  playtime_seconds BIGINT DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, game_id)
);

CREATE INDEX idx_ps_user ON player_stats(user_id);
CREATE INDEX idx_ps_game ON player_stats(game_id);

-- ============================================
-- STORE PRODUCTS
-- ============================================
CREATE TABLE store_products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(200) NOT NULL,
  description TEXT,
  image_url TEXT,
  price_credits INTEGER NOT NULL CHECK (price_credits > 0),
  category VARCHAR(50) DEFAULT 'general',
  is_active BOOLEAN DEFAULT TRUE,
  stock INTEGER DEFAULT -1, -- -1 means unlimited
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_products_active ON store_products(is_active);
CREATE INDEX idx_products_category ON store_products(category);

-- ============================================
-- ORDERS
-- ============================================
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES store_products(id),
  quantity INTEGER DEFAULT 1 CHECK (quantity > 0),
  total_credits INTEGER NOT NULL CHECK (total_credits > 0),
  status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'cancelled', 'refunded')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_product ON orders(product_id);
CREATE INDEX idx_orders_created ON orders(created_at DESC);

-- ============================================
-- CHAT MESSAGES
-- ============================================
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  channel_type VARCHAR(20) NOT NULL CHECK (channel_type IN ('lobby', 'match', 'tournament', 'global')),
  channel_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(content) <= 1000),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_chat_channel ON chat_messages(channel_type, channel_id);
CREATE INDEX idx_chat_created ON chat_messages(created_at DESC);
CREATE INDEX idx_chat_user ON chat_messages(user_id);

-- ============================================
-- UPDATED_AT TRIGGER FUNCTION
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to relevant tables
CREATE TRIGGER tr_profiles_updated BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_games_updated BEFORE UPDATE ON games FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_tournaments_updated BEFORE UPDATE ON tournaments FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_lobbies_updated BEFORE UPDATE ON lobbies FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_matches_updated BEFORE UPDATE ON tournament_matches FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_rankings_updated BEFORE UPDATE ON rankings FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_player_stats_updated BEFORE UPDATE ON player_stats FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_products_updated BEFORE UPDATE ON store_products FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- ELO CALCULATION FUNCTION
-- ============================================
CREATE OR REPLACE FUNCTION calculate_elo(
  winner_rating INTEGER,
  loser_rating INTEGER,
  k_factor INTEGER DEFAULT 32
)
RETURNS TABLE(new_winner_rating INTEGER, new_loser_rating INTEGER) AS $$
DECLARE
  expected_winner NUMERIC;
  expected_loser NUMERIC;
BEGIN
  expected_winner := 1.0 / (1.0 + POWER(10, (loser_rating - winner_rating)::NUMERIC / 400));
  expected_loser := 1.0 - expected_winner;

  new_winner_rating := winner_rating + ROUND(k_factor * (1 - expected_winner));
  new_loser_rating := GREATEST(100, loser_rating + ROUND(k_factor * (0 - expected_loser)));

  RETURN NEXT;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================
-- RANK TIER FUNCTION
-- ============================================
CREATE OR REPLACE FUNCTION get_rank_tier(rating INTEGER)
RETURNS VARCHAR(20) AS $$
BEGIN
  RETURN CASE
    WHEN rating >= 2200 THEN 'legend'
    WHEN rating >= 2000 THEN 'master'
    WHEN rating >= 1800 THEN 'diamond'
    WHEN rating >= 1500 THEN 'platinum'
    WHEN rating >= 1200 THEN 'gold'
    WHEN rating >= 900 THEN 'silver'
    ELSE 'bronze'
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- ============================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, username, display_name, avatar_url, email_verified)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', SPLIT_PART(NEW.email, '@', 1) || '_' || SUBSTR(NEW.id::TEXT, 1, 6)),
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'full_name', SPLIT_PART(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NULL),
    COALESCE(NEW.email_confirmed_at IS NOT NULL, FALSE)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- PROFILES
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- GAMES
ALTER TABLE games ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Games are viewable by everyone"
  ON games FOR SELECT USING (true);

CREATE POLICY "Only admins can manage games"
  ON games FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- TOURNAMENTS
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tournaments are viewable by everyone"
  ON tournaments FOR SELECT USING (true);

CREATE POLICY "Only admins can create tournaments"
  ON tournaments FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Only admins can update tournaments"
  ON tournaments FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- TOURNAMENT PARTICIPANTS
ALTER TABLE tournament_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tournament participants viewable by everyone"
  ON tournament_participants FOR SELECT USING (true);

CREATE POLICY "Authenticated users can register for tournaments"
  ON tournament_participants FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own participation"
  ON tournament_participants FOR UPDATE USING (auth.uid() = user_id);

-- TOURNAMENT MATCHES
ALTER TABLE tournament_matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tournament matches viewable by everyone"
  ON tournament_matches FOR SELECT USING (true);

CREATE POLICY "Only admins can manage tournament matches"
  ON tournament_matches FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- LOBBIES
ALTER TABLE lobbies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active lobbies are viewable by everyone"
  ON lobbies FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create lobbies"
  ON lobbies FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Lobby creator or admin can update lobby"
  ON lobbies FOR UPDATE USING (
    auth.uid() = created_by OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- LOBBY PLAYERS
ALTER TABLE lobby_players ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lobby players viewable by everyone"
  ON lobby_players FOR SELECT USING (true);

CREATE POLICY "Users can join lobbies"
  ON lobby_players FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own lobby status"
  ON lobby_players FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can leave lobbies"
  ON lobby_players FOR DELETE USING (auth.uid() = user_id);

-- MATCHES
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Matches viewable by everyone"
  ON matches FOR SELECT USING (true);

CREATE POLICY "Only admins or system can create matches"
  ON matches FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Only admins can update matches"
  ON matches FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- MATCH PLAYERS
ALTER TABLE match_players ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Match players viewable by everyone"
  ON match_players FOR SELECT USING (true);

CREATE POLICY "Only admins can manage match players"
  ON match_players FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- RANKINGS
ALTER TABLE rankings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Rankings viewable by everyone"
  ON rankings FOR SELECT USING (true);

CREATE POLICY "System manages rankings"
  ON rankings FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- PLAYER STATS
ALTER TABLE player_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Player stats viewable by everyone"
  ON player_stats FOR SELECT USING (true);

CREATE POLICY "System manages player stats"
  ON player_stats FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- STORE PRODUCTS
ALTER TABLE store_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active products viewable by everyone"
  ON store_products FOR SELECT USING (is_active = true);

CREATE POLICY "Only admins can manage products"
  ON store_products FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ORDERS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own orders"
  ON orders FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own orders"
  ON orders FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all orders"
  ON orders FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- CHAT MESSAGES
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Chat messages viewable by everyone"
  ON chat_messages FOR SELECT USING (true);

CREATE POLICY "Authenticated users can send messages"
  ON chat_messages FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================
-- ENABLE REALTIME
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE lobbies;
ALTER PUBLICATION supabase_realtime ADD TABLE lobby_players;
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE matches;
ALTER PUBLICATION supabase_realtime ADD TABLE tournament_matches;
