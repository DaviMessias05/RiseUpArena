const { supabase } = require('./supabase');

/**
 * Calculate new ELO ratings for winner and loser.
 * Uses the standard ELO formula with a configurable K-factor.
 */
function calculateElo(winnerRating, loserRating, kFactor = 32) {
  const expectedWinner = 1 / (1 + Math.pow(10, (loserRating - winnerRating) / 400));
  const expectedLoser = 1 / (1 + Math.pow(10, (winnerRating - loserRating) / 400));

  const newWinnerRating = Math.round(winnerRating + kFactor * (1 - expectedWinner));
  const newLoserRating = Math.round(loserRating + kFactor * (0 - expectedLoser));

  return { newWinnerRating, newLoserRating };
}

/**
 * Determine the rank tier based on rating.
 */
function getRankTier(rating) {
  if (rating >= 2200) return 'legend';
  if (rating >= 2000) return 'master';
  if (rating >= 1800) return 'diamond';
  if (rating >= 1500) return 'platinum';
  if (rating >= 1200) return 'gold';
  if (rating >= 900) return 'silver';
  return 'bronze';
}

/**
 * Full ranking update: fetch current ratings, calculate new ones,
 * and upsert the rankings table for a specific game.
 */
async function updateRankings(gameId, winnerId, loserId, client = supabase) {
  // Fetch current rankings for both players in this game
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

  const winnerCurrentRating = winnerRanking ? winnerRanking.rating : 1000;
  const loserCurrentRating = loserRanking ? loserRanking.rating : 1000;

  const winnerWins = (winnerRanking?.wins || 0) + 1;
  const winnerLosses = winnerRanking?.losses || 0;
  const winnerMatches = (winnerRanking?.matches_played || 0) + 1;
  const winnerStreak = (winnerRanking?.win_streak || 0) + 1;
  const winnerBestStreak = Math.max(winnerRanking?.best_streak || 0, winnerStreak);

  const loserWins = loserRanking?.wins || 0;
  const loserLosses = (loserRanking?.losses || 0) + 1;
  const loserMatches = (loserRanking?.matches_played || 0) + 1;

  const { newWinnerRating, newLoserRating } = calculateElo(winnerCurrentRating, loserCurrentRating);

  const winnerTier = getRankTier(newWinnerRating);
  const loserTier = getRankTier(newLoserRating);

  // Upsert winner ranking
  const { error: winnerError } = await client
    .from('rankings')
    .upsert({
      user_id: winnerId,
      game_id: gameId,
      rating: newWinnerRating,
      rank_tier: winnerTier,
      wins: winnerWins,
      losses: winnerLosses,
      matches_played: winnerMatches,
      win_streak: winnerStreak,
      best_streak: winnerBestStreak,
    }, { onConflict: 'user_id,game_id' });

  if (winnerError) {
    throw new Error(`Failed to update winner ranking: ${winnerError.message}`);
  }

  // Upsert loser ranking
  const { error: loserError } = await client
    .from('rankings')
    .upsert({
      user_id: loserId,
      game_id: gameId,
      rating: newLoserRating,
      rank_tier: loserTier,
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
    winner: { rating: newWinnerRating, tier: winnerTier },
    loser: { rating: newLoserRating, tier: loserTier },
  };
}

module.exports = { calculateElo, getRankTier, updateRankings };
