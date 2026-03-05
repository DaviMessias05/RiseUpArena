const express = require('express');
const router = express.Router();
const { supabase } = require('../lib/supabase');
const { authenticate, requireAuth, requireAdmin } = require('../middleware/auth');
const { verifyCaptcha } = require('../middleware/captcha');
const { updateRankings } = require('../lib/elo');
const { generateBracket } = require('../lib/bracketGenerator');

// GET /api/tournaments — List tournaments with filters
router.get('/', async (req, res) => {
  try {
    const { game_id, status } = req.query;

    let query = supabase
      .from('tournaments')
      .select('*, games(name, slug)')
      .order('created_at', { ascending: false });

    if (game_id) {
      query = query.eq('game_id', game_id);
    }
    if (status) {
      query = query.eq('status', status);
    }

    const { data: tournaments, error } = await query;

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch tournaments.' });
    }

    // Fetch participant counts for each tournament
    const tournamentIds = tournaments.map((t) => t.id);
    const { data: participants, error: partError } = await supabase
      .from('tournament_participants')
      .select('tournament_id')
      .in('tournament_id', tournamentIds.length > 0 ? tournamentIds : ['00000000-0000-0000-0000-000000000000']);

    const countMap = {};
    if (!partError && participants) {
      for (const p of participants) {
        countMap[p.tournament_id] = (countMap[p.tournament_id] || 0) + 1;
      }
    }

    const result = tournaments.map((t) => ({
      ...t,
      participant_count: countMap[t.id] || 0,
    }));

    res.json(result);
  } catch (err) {
    console.error('List tournaments error:', err);
    res.status(500).json({ error: 'Failed to fetch tournaments.' });
  }
});

// GET /api/tournaments/:id — Get tournament details with bracket/matches
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data: tournament, error: tError } = await supabase
      .from('tournaments')
      .select('*, games(name, slug)')
      .eq('id', id)
      .single();

    if (tError || !tournament) {
      return res.status(404).json({ error: 'Tournament not found.' });
    }

    // Fetch participants
    const { data: participants, error: pError } = await supabase
      .from('tournament_participants')
      .select('*, profiles(username, avatar_url)')
      .eq('tournament_id', id);

    // Fetch matches for this tournament
    const { data: matches, error: mError } = await supabase
      .from('matches')
      .select('*, match_players(*, profiles(username, avatar_url))')
      .eq('tournament_id', id)
      .order('round', { ascending: true });

    res.json({
      ...tournament,
      participants: pError ? [] : participants,
      matches: mError ? [] : matches,
    });
  } catch (err) {
    console.error('Get tournament error:', err);
    res.status(500).json({ error: 'Failed to fetch tournament.' });
  }
});

// POST /api/tournaments — Create tournament (admin only, captcha verify)
router.post('/', authenticate, requireAuth, requireAdmin, verifyCaptcha, async (req, res) => {
  try {
    const {
      name, description, game_id, max_participants,
      start_date, end_date, prize_pool, rules, format,
    } = req.body;

    if (!name || !game_id) {
      return res.status(400).json({ error: 'Name and game_id are required.' });
    }

    const { data, error } = await supabase
      .from('tournaments')
      .insert({
        name,
        description: description || null,
        game_id,
        max_participants: max_participants || null,
        start_date: start_date || null,
        end_date: end_date || null,
        prize_pool: prize_pool || null,
        rules: rules || null,
        format: format || 'single_elimination',
        status: 'upcoming',
        created_by: req.user.id,
      })
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: 'Failed to create tournament.' });
    }

    res.status(201).json(data);
  } catch (err) {
    console.error('Create tournament error:', err);
    res.status(500).json({ error: 'Failed to create tournament.' });
  }
});

// POST /api/tournaments/:id/register — Register for tournament (auth required)
router.post('/:id/register', authenticate, requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check tournament exists and is open for registration
    const { data: tournament, error: tError } = await supabase
      .from('tournaments')
      .select('*')
      .eq('id', id)
      .single();

    if (tError || !tournament) {
      return res.status(404).json({ error: 'Tournament not found.' });
    }

    if (tournament.status !== 'upcoming') {
      return res.status(400).json({ error: 'Tournament is not open for registration.' });
    }

    // Check if already registered
    const { data: existing, error: existError } = await supabase
      .from('tournament_participants')
      .select('id')
      .eq('tournament_id', id)
      .eq('user_id', userId)
      .maybeSingle();

    if (existing) {
      return res.status(400).json({ error: 'Already registered for this tournament.' });
    }

    // Check max participants
    if (tournament.max_participants) {
      const { count, error: countError } = await supabase
        .from('tournament_participants')
        .select('*', { count: 'exact', head: true })
        .eq('tournament_id', id);

      if (!countError && count >= tournament.max_participants) {
        return res.status(400).json({ error: 'Tournament is full.' });
      }
    }

    const { data, error } = await supabase
      .from('tournament_participants')
      .insert({
        tournament_id: id,
        user_id: userId,
      })
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: 'Failed to register for tournament.' });
    }

    res.status(201).json(data);
  } catch (err) {
    console.error('Register tournament error:', err);
    res.status(500).json({ error: 'Failed to register for tournament.' });
  }
});

// PUT /api/tournaments/:id — Update tournament (admin only)
router.put('/:id', authenticate, requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name, description, max_participants, start_date,
      end_date, prize_pool, rules, format, status,
    } = req.body;

    const updates = {};
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (max_participants !== undefined) updates.max_participants = max_participants;
    if (start_date !== undefined) updates.start_date = start_date;
    if (end_date !== undefined) updates.end_date = end_date;
    if (prize_pool !== undefined) updates.prize_pool = prize_pool;
    if (rules !== undefined) updates.rules = rules;
    if (format !== undefined) updates.format = format;
    if (status !== undefined) updates.status = status;

    const { data, error } = await supabase
      .from('tournaments')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: 'Failed to update tournament.' });
    }

    if (!data) {
      return res.status(404).json({ error: 'Tournament not found.' });
    }

    res.json(data);
  } catch (err) {
    console.error('Update tournament error:', err);
    res.status(500).json({ error: 'Failed to update tournament.' });
  }
});

// POST /api/tournaments/:id/start — Generate bracket and start tournament (admin only)
router.post('/:id/start', authenticate, requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const { data: tournament } = await supabase.from('tournaments').select('*').eq('id', id).single();
    if (!tournament) return res.status(404).json({ error: 'Torneio não encontrado.' });
    if (tournament.status === 'in_progress' || tournament.status === 'finished')
      return res.status(400).json({ error: 'Torneio já iniciado.' });

    // Admin manual start: use all registered participants
    const { data: participants } = await supabase
      .from('tournament_participants').select('user_id').eq('tournament_id', id);
    if (!participants || participants.length < 2)
      return res.status(400).json({ error: 'Mínimo de 2 participantes necessário.' });

    const userIds = participants.map(p => p.user_id);
    const result = await generateBracket(id, userIds);
    res.json({ success: true, ...result });
  } catch (err) {
    console.error('Start tournament error:', err);
    res.status(500).json({ error: err.message || 'Erro ao iniciar torneio.' });
  }
});

// PATCH /api/tournaments/:id/bracket/:matchId/result — Record bracket match result (admin only)
router.patch('/:id/bracket/:matchId/result', authenticate, requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id, matchId } = req.params;
    const { winner_id, score_player1 = 0, score_player2 = 0 } = req.body;
    if (!winner_id) return res.status(400).json({ error: 'winner_id obrigatório.' });

    const { data: match } = await supabase
      .from('tournament_matches').select('*').eq('id', matchId).eq('tournament_id', id).single();
    if (!match) return res.status(404).json({ error: 'Partida não encontrada.' });
    if (match.status === 'finished') return res.status(400).json({ error: 'Partida já finalizada.' });
    if (winner_id !== match.player1_id && winner_id !== match.player2_id)
      return res.status(400).json({ error: 'Vencedor inválido.' });

    await supabase.from('tournament_matches').update({
      winner_id, score_player1, score_player2, status: 'finished',
    }).eq('id', matchId);

    if (match.next_match_id) {
      const { data: next } = await supabase
        .from('tournament_matches').select('player1_id, player2_id').eq('id', match.next_match_id).single();
      if (next) {
        const field = next.player1_id ? 'player2_id' : 'player1_id';
        const bothNowFilled = !!next.player1_id || !!next.player2_id; // one slot was already filled
        await supabase.from('tournament_matches').update({
          [field]: winner_id,
          status: bothNowFilled ? 'in_progress' : 'pending',
        }).eq('id', match.next_match_id);
      }
    } else {
      // Grand final concluded
      await supabase.from('tournaments').update({ status: 'finished' }).eq('id', id);
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Bracket result error:', err);
    res.status(500).json({ error: 'Erro ao registrar resultado.' });
  }
});

// POST /api/tournaments/:id/matches/:matchId/result — Record match result (admin only)
router.post('/:id/matches/:matchId/result', authenticate, requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id, matchId } = req.params;
    const { winner_id, loser_id, score } = req.body;

    if (!winner_id || !loser_id) {
      return res.status(400).json({ error: 'winner_id and loser_id are required.' });
    }

    // Verify the match belongs to this tournament
    const { data: match, error: matchError } = await supabase
      .from('matches')
      .select('*, games:game_id(id)')
      .eq('id', matchId)
      .eq('tournament_id', id)
      .single();

    if (matchError || !match) {
      return res.status(404).json({ error: 'Match not found in this tournament.' });
    }

    // Update match result
    const { data: updatedMatch, error: updateError } = await supabase
      .from('matches')
      .update({
        winner_id,
        status: 'completed',
        score: score || null,
      })
      .eq('id', matchId)
      .select()
      .single();

    if (updateError) {
      return res.status(400).json({ error: 'Failed to record match result.' });
    }

    // Update match_players results
    await supabase
      .from('match_players')
      .update({ result: 'win' })
      .eq('match_id', matchId)
      .eq('user_id', winner_id);

    await supabase
      .from('match_players')
      .update({ result: 'loss' })
      .eq('match_id', matchId)
      .eq('user_id', loser_id);

    // Update ELO rankings
    let eloResult = null;
    try {
      eloResult = await updateRankings(match.game_id, winner_id, loser_id);
    } catch (eloErr) {
      console.error('ELO update error:', eloErr);
    }

    res.json({
      match: updatedMatch,
      elo: eloResult,
    });
  } catch (err) {
    console.error('Record tournament match result error:', err);
    res.status(500).json({ error: 'Failed to record match result.' });
  }
});

module.exports = router;
