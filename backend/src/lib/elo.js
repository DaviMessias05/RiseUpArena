const { supabase } = require('./supabase');

const RP_WIN = 25;
const RP_LOSS = -15;

/**
 * Retorna o nível (1-10) baseado nos Ranking Points.
 */
function getRpLevel(rp) {
  if (rp >= 3000) return 10;
  if (rp >= 2501) return 9;
  if (rp >= 2101) return 8;
  if (rp >= 1701) return 7;
  if (rp >= 1301) return 6;
  if (rp >= 901) return 5;
  if (rp >= 601) return 4;
  if (rp >= 301) return 3;
  if (rp >= 101) return 2;
  return 1;
}

/**
 * Retorna o rank_tier string baseado no RP.
 */
function getRankTier(rp) {
  return `level_${getRpLevel(rp)}`;
}

/**
 * Atualiza rankings após uma partida.
 * Vencedor: +25 RP, Perdedor: -15 RP (mínimo 0).
 */
async function updateRankings(gameId, winnerId, loserId, client = supabase) {
  const { data: rankings, error: fetchError } = await client
    .from('rankings')
    .select('*')
    .eq('game_id', gameId)
    .in('user_id', [winnerId, loserId]);

  if (fetchError) {
    throw new Error(`Failed to fetch rankings: ${fetchError.message}`);
  }

  const winnerRanking = rankings.find((r) => r.user_id === winnerId);
  const loserRanking = rankings.find((r) => r.user_id === loserId);

  const winnerCurrentRp = winnerRanking ? winnerRanking.rating : 0;
  const loserCurrentRp = loserRanking ? loserRanking.rating : 0;

  const newWinnerRp = winnerCurrentRp + RP_WIN;
  const newLoserRp = Math.max(0, loserCurrentRp + RP_LOSS);

  const winnerChange = RP_WIN;
  const loserChange = newLoserRp - loserCurrentRp;

  const winnerWins = (winnerRanking?.wins || 0) + 1;
  const winnerLosses = winnerRanking?.losses || 0;
  const winnerMatches = (winnerRanking?.matches_played || 0) + 1;
  const winnerStreak = (winnerRanking?.win_streak || 0) + 1;
  const winnerBestStreak = Math.max(winnerRanking?.best_streak || 0, winnerStreak);

  const loserWins = loserRanking?.wins || 0;
  const loserLosses = (loserRanking?.losses || 0) + 1;
  const loserMatches = (loserRanking?.matches_played || 0) + 1;

  const { error: winnerError } = await client
    .from('rankings')
    .upsert({
      user_id: winnerId,
      game_id: gameId,
      rating: newWinnerRp,
      rank_tier: getRankTier(newWinnerRp),
      wins: winnerWins,
      losses: winnerLosses,
      matches_played: winnerMatches,
      win_streak: winnerStreak,
      best_streak: winnerBestStreak,
    }, { onConflict: 'user_id,game_id' });

  if (winnerError) {
    throw new Error(`Failed to update winner ranking: ${winnerError.message}`);
  }

  const { error: loserError } = await client
    .from('rankings')
    .upsert({
      user_id: loserId,
      game_id: gameId,
      rating: newLoserRp,
      rank_tier: getRankTier(newLoserRp),
      wins: loserWins,
      losses: loserLosses,
      matches_played: loserMatches,
      win_streak: 0,
      best_streak: loserRanking?.best_streak || 0,
    }, { onConflict: 'user_id,game_id' });

  if (loserError) {
    throw new Error(`Failed to update loser ranking: ${loserError.message}`);
  }

  return {
    winner: { rating: newWinnerRp, change: winnerChange, level: getRpLevel(newWinnerRp) },
    loser: { rating: newLoserRp, change: loserChange, level: getRpLevel(newLoserRp) },
  };
}

module.exports = { getRpLevel, getRankTier, updateRankings, RP_WIN, RP_LOSS };
