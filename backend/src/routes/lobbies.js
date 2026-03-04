const express = require('express');
const router = express.Router();
const { supabase } = require('../lib/supabase');
const { authenticate, requireAuth, requireVerifiedEmail } = require('../middleware/auth');
const { verifyCaptcha } = require('../middleware/captcha');

// GET /api/lobbies — List lobbies with filters
router.get('/', async (req, res) => {
  try {
    const { game_id, status } = req.query;

    let query = supabase
      .from('lobbies')
      .select('*, games(name, slug), profiles!lobbies_created_by_fkey(username, avatar_url)')
      .order('created_at', { ascending: false });

    if (game_id) {
      query = query.eq('game_id', game_id);
    }
    if (status) {
      query = query.eq('status', status);
    } else {
      query = query.in('status', ['waiting', 'ready']);
    }

    const { data, error } = await query;

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch lobbies.' });
    }

    res.json(data);
  } catch (err) {
    console.error('List lobbies error:', err);
    res.status(500).json({ error: 'Failed to fetch lobbies.' });
  }
});

// GET /api/lobbies/:id — Get lobby with players
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data: lobby, error: lobbyError } = await supabase
      .from('lobbies')
      .select('*, games(name, slug)')
      .eq('id', id)
      .single();

    if (lobbyError || !lobby) {
      return res.status(404).json({ error: 'Lobby not found.' });
    }

    const { data: players, error: playersError } = await supabase
      .from('lobby_players')
      .select('*, profiles(username, avatar_url)')
      .eq('lobby_id', id);

    res.json({
      ...lobby,
      players: playersError ? [] : players,
    });
  } catch (err) {
    console.error('Get lobby error:', err);
    res.status(500).json({ error: 'Failed to fetch lobby.' });
  }
});

// POST /api/lobbies — Create lobby (auth, verified email, captcha)
router.post('/', authenticate, requireAuth, requireVerifiedEmail, verifyCaptcha, async (req, res) => {
  try {
    const { name, game_id, max_players, mode } = req.body;

    if (!name || !game_id) {
      return res.status(400).json({ error: 'Name and game_id are required.' });
    }

    // Create the lobby
    const { data: lobby, error: lobbyError } = await supabase
      .from('lobbies')
      .insert({
        name,
        game_id,
        max_players: max_players || 10,
        mode: mode || 'competitive',
        status: 'waiting',
        created_by: req.user.id,
      })
      .select()
      .single();

    if (lobbyError) {
      return res.status(400).json({ error: 'Failed to create lobby.' });
    }

    // Auto-join the creator as a player on team 1
    const { error: joinError } = await supabase
      .from('lobby_players')
      .insert({
        lobby_id: lobby.id,
        user_id: req.user.id,
        team: 1,
        is_ready: false,
      });

    if (joinError) {
      console.error('Auto-join lobby error:', joinError);
    }

    res.status(201).json(lobby);
  } catch (err) {
    console.error('Create lobby error:', err);
    res.status(500).json({ error: 'Failed to create lobby.' });
  }
});

// POST /api/lobbies/:id/join — Join lobby
router.post('/:id/join', authenticate, requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check lobby exists and is open
    const { data: lobby, error: lobbyError } = await supabase
      .from('lobbies')
      .select('*')
      .eq('id', id)
      .single();

    if (lobbyError || !lobby) {
      return res.status(404).json({ error: 'Lobby not found.' });
    }

    if (lobby.status !== 'waiting') {
      return res.status(400).json({ error: 'Lobby is not accepting players.' });
    }

    // Check if already in the lobby
    const { data: existing } = await supabase
      .from('lobby_players')
      .select('id')
      .eq('lobby_id', id)
      .eq('user_id', userId)
      .maybeSingle();

    if (existing) {
      return res.status(400).json({ error: 'Already in this lobby.' });
    }

    // Check max players
    const { count, error: countError } = await supabase
      .from('lobby_players')
      .select('*', { count: 'exact', head: true })
      .eq('lobby_id', id);

    if (!countError && count >= lobby.max_players) {
      return res.status(400).json({ error: 'Lobby is full.' });
    }

    // Assign to team with fewer players
    const { data: teamCounts } = await supabase
      .from('lobby_players')
      .select('team')
      .eq('lobby_id', id);

    const team1Count = teamCounts ? teamCounts.filter((p) => p.team === 1).length : 0;
    const team2Count = teamCounts ? teamCounts.filter((p) => p.team === 2).length : 0;
    const assignedTeam = team1Count <= team2Count ? 1 : 2;

    const { data, error } = await supabase
      .from('lobby_players')
      .insert({
        lobby_id: id,
        user_id: userId,
        team: assignedTeam,
        is_ready: false,
      })
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: 'Failed to join lobby.' });
    }

    res.status(201).json(data);
  } catch (err) {
    console.error('Join lobby error:', err);
    res.status(500).json({ error: 'Failed to join lobby.' });
  }
});

// POST /api/lobbies/:id/leave — Leave lobby
router.post('/:id/leave', authenticate, requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const { error } = await supabase
      .from('lobby_players')
      .delete()
      .eq('lobby_id', id)
      .eq('user_id', userId);

    if (error) {
      return res.status(400).json({ error: 'Failed to leave lobby.' });
    }

    res.json({ message: 'Left the lobby successfully.' });
  } catch (err) {
    console.error('Leave lobby error:', err);
    res.status(500).json({ error: 'Failed to leave lobby.' });
  }
});

// POST /api/lobbies/:id/ready — Toggle ready status
router.post('/:id/ready', authenticate, requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Get current ready status
    const { data: player, error: playerError } = await supabase
      .from('lobby_players')
      .select('*')
      .eq('lobby_id', id)
      .eq('user_id', userId)
      .single();

    if (playerError || !player) {
      return res.status(404).json({ error: 'You are not in this lobby.' });
    }

    const { data, error } = await supabase
      .from('lobby_players')
      .update({ is_ready: !player.is_ready })
      .eq('lobby_id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: 'Failed to toggle ready status.' });
    }

    res.json(data);
  } catch (err) {
    console.error('Toggle ready error:', err);
    res.status(500).json({ error: 'Failed to toggle ready status.' });
  }
});

// POST /api/lobbies/:id/team — Switch team
router.post('/:id/team', authenticate, requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { team } = req.body;

    if (team !== 1 && team !== 2) {
      return res.status(400).json({ error: 'Team must be 1 or 2.' });
    }

    // Verify player is in the lobby
    const { data: player, error: playerError } = await supabase
      .from('lobby_players')
      .select('id')
      .eq('lobby_id', id)
      .eq('user_id', userId)
      .single();

    if (playerError || !player) {
      return res.status(404).json({ error: 'You are not in this lobby.' });
    }

    const { data, error } = await supabase
      .from('lobby_players')
      .update({ team })
      .eq('lobby_id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: 'Failed to switch team.' });
    }

    res.json(data);
  } catch (err) {
    console.error('Switch team error:', err);
    res.status(500).json({ error: 'Failed to switch team.' });
  }
});

// POST /api/lobbies/:id/start — Start match (lobby creator only, all players ready)
router.post('/:id/start', authenticate, requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Verify lobby exists and user is the creator
    const { data: lobby, error: lobbyError } = await supabase
      .from('lobbies')
      .select('*')
      .eq('id', id)
      .single();

    if (lobbyError || !lobby) {
      return res.status(404).json({ error: 'Lobby not found.' });
    }

    if (lobby.created_by !== userId) {
      return res.status(403).json({ error: 'Only the lobby creator can start the match.' });
    }

    if (lobby.status !== 'waiting') {
      return res.status(400).json({ error: 'Lobby is not in a startable state.' });
    }

    // Check all players are ready
    const { data: players, error: playersError } = await supabase
      .from('lobby_players')
      .select('*')
      .eq('lobby_id', id);

    if (playersError || !players || players.length < 2) {
      return res.status(400).json({ error: 'Need at least 2 players to start.' });
    }

    const allReady = players.every((p) => p.is_ready);
    if (!allReady) {
      return res.status(400).json({ error: 'Not all players are ready.' });
    }

    // Create a match record
    const { data: match, error: matchError } = await supabase
      .from('matches')
      .insert({
        game_id: lobby.game_id,
        lobby_id: lobby.id,
        status: 'in_progress',
        mode: lobby.mode,
      })
      .select()
      .single();

    if (matchError) {
      return res.status(500).json({ error: 'Failed to start match.' });
    }

    // Create match_players entries from lobby players
    const matchPlayers = players.map((p) => ({
      match_id: match.id,
      user_id: p.user_id,
      team: p.team,
    }));

    const { error: mpError } = await supabase
      .from('match_players')
      .insert(matchPlayers);

    if (mpError) {
      console.error('Create match players error:', mpError);
    }

    // Update lobby status
    await supabase
      .from('lobbies')
      .update({ status: 'in_progress' })
      .eq('id', id);

    res.status(201).json({
      message: 'Match started.',
      match,
    });
  } catch (err) {
    console.error('Start lobby error:', err);
    res.status(500).json({ error: 'Failed to start match.' });
  }
});

module.exports = router;
