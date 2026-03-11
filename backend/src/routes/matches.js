const express = require('express');
const router = express.Router();
const { supabase } = require('../lib/supabase');
const { authenticate, requireAuth, requireAdmin } = require('../middleware/auth');
const { updateRankings } = require('../lib/elo');

// GET /api/matches — List recent matches with filters
router.get('/', async (req, res) => {
  try {
    const { game_id, status, user_id, limit: queryLimit } = req.query;
    const resultLimit = Math.min(parseInt(queryLimit) || 50, 100);

    let query = supabase
      .from('matches')
      .select('*, games(name, slug), match_players(user_id, team, result, profiles(username, avatar_url))')
      .order('created_at', { ascending: false })
      .limit(resultLimit);

    if (game_id) {
      query = query.eq('game_id', game_id);
    }
    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch matches.' });
    }

    // If user_id filter, post-filter matches that include this user
    let results = data;
    if (user_id) {
      results = data.filter((match) =>
        match.match_players?.some((mp) => mp.user_id === user_id)
      );
    }

    res.json(results);
  } catch (err) {
    console.error('List matches error:', err);
    res.status(500).json({ error: 'Failed to fetch matches.' });
  }
});

// GET /api/matches/:id — Get match details with players
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data: match, error } = await supabase
      .from('matches')
      .select('*, games(name, slug), match_players(*, profiles(username, avatar_url))')
      .eq('id', id)
      .single();

    if (error || !match) {
      return res.status(404).json({ error: 'Match not found.' });
    }

    res.json(match);
  } catch (err) {
    console.error('Get match error:', err);
    res.status(500).json({ error: 'Failed to fetch match.' });
  }
});

// PUT /api/matches/:id/result — Record result (admin only), update RP rankings, update player_stats
router.put('/:id/result', authenticate, requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { winner_id, loser_id, score } = req.body;

    if (!winner_id || !loser_id) {
      return res.status(400).json({ error: 'winner_id and loser_id are required.' });
    }

    // Fetch match
    const { data: match, error: matchError } = await supabase
      .from('matches')
      .select('*')
      .eq('id', id)
      .single();

    if (matchError || !match) {
      return res.status(404).json({ error: 'Match not found.' });
    }

    if (match.status === 'completed') {
      return res.status(400).json({ error: 'Match result has already been recorded.' });
    }

    // Update match
    const { data: updatedMatch, error: updateError } = await supabase
      .from('matches')
      .update({
        winner_id,
        status: 'completed',
        score: score || null,
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      return res.status(400).json({ error: 'Failed to record match result.' });
    }

    // Update match_players results
    await supabase
      .from('match_players')
      .update({ result: 'win' })
      .eq('match_id', id)
      .eq('user_id', winner_id);

    await supabase
      .from('match_players')
      .update({ result: 'loss' })
      .eq('match_id', id)
      .eq('user_id', loser_id);

    // Update player_stats for winner
    const { data: winnerStats } = await supabase
      .from('player_stats')
      .select('*')
      .eq('user_id', winner_id)
      .eq('game_id', match.game_id)
      .maybeSingle();

    if (winnerStats) {
      await supabase
        .from('player_stats')
        .update({
          wins: winnerStats.wins + 1,
          total_matches: winnerStats.total_matches + 1,
        })
        .eq('user_id', winner_id)
        .eq('game_id', match.game_id);
    } else {
      await supabase
        .from('player_stats')
        .insert({
          user_id: winner_id,
          game_id: match.game_id,
          wins: 1,
          losses: 0,
          total_matches: 1,
        });
    }

    // Update player_stats for loser
    const { data: loserStats } = await supabase
      .from('player_stats')
      .select('*')
      .eq('user_id', loser_id)
      .eq('game_id', match.game_id)
      .maybeSingle();

    if (loserStats) {
      await supabase
        .from('player_stats')
        .update({
          losses: loserStats.losses + 1,
          total_matches: loserStats.total_matches + 1,
        })
        .eq('user_id', loser_id)
        .eq('game_id', match.game_id);
    } else {
      await supabase
        .from('player_stats')
        .insert({
          user_id: loser_id,
          game_id: match.game_id,
          wins: 0,
          losses: 1,
          total_matches: 1,
        });
    }

    // Update RP rankings
    let rpResult = null;
    try {
      rpResult = await updateRankings(match.game_id, winner_id, loser_id);

      // Gravar rating_change no match_players
      if (rpResult) {
        await supabase
          .from('match_players')
          .update({ rating_change: rpResult.winner.change })
          .eq('match_id', id)
          .eq('user_id', winner_id);

        await supabase
          .from('match_players')
          .update({ rating_change: rpResult.loser.change })
          .eq('match_id', id)
          .eq('user_id', loser_id);
      }
    } catch (rpErr) {
      console.error('RP update error:', rpErr);
    }

    // If match came from a lobby, update lobby status
    if (match.lobby_id) {
      await supabase
        .from('lobbies')
        .update({ status: 'completed' })
        .eq('id', match.lobby_id);
    }

    res.json({
      match: updatedMatch,
      rp: rpResult,
    });
  } catch (err) {
    console.error('Record match result error:', err);
    res.status(500).json({ error: 'Failed to record match result.' });
  }
});

module.exports = router;
