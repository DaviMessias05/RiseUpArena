const express = require('express');
const router = express.Router();
const { supabase } = require('../lib/supabase');
const { authenticate, requireAuth, requireAdmin } = require('../middleware/auth');

// GET /api/games — List all active games
router.get('/', async (_req, res) => {
  try {
    const { data, error } = await supabase
      .from('games')
      .select('*')
      .eq('active', true)
      .order('name', { ascending: true });

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch games.' });
    }

    res.json(data);
  } catch (err) {
    console.error('List games error:', err);
    res.status(500).json({ error: 'Failed to fetch games.' });
  }
});

// GET /api/games/:slug — Get game by slug with stats
router.get('/:slug', async (req, res) => {
  try {
    const { slug } = req.params;

    const { data: game, error: gameError } = await supabase
      .from('games')
      .select('*')
      .eq('slug', slug)
      .single();

    if (gameError || !game) {
      return res.status(404).json({ error: 'Game not found.' });
    }

    // Fetch player count for this game from rankings
    const { count: playerCount, error: playerError } = await supabase
      .from('rankings')
      .select('*', { count: 'exact', head: true })
      .eq('game_id', game.id);

    // Fetch match count for this game
    const { count: matchCount, error: matchError } = await supabase
      .from('matches')
      .select('*', { count: 'exact', head: true })
      .eq('game_id', game.id);

    // Fetch active tournament count
    const { count: tournamentCount, error: tournamentError } = await supabase
      .from('tournaments')
      .select('*', { count: 'exact', head: true })
      .eq('game_id', game.id)
      .in('status', ['upcoming', 'in_progress']);

    res.json({
      ...game,
      stats: {
        player_count: playerError ? 0 : playerCount,
        match_count: matchError ? 0 : matchCount,
        active_tournaments: tournamentError ? 0 : tournamentCount,
      },
    });
  } catch (err) {
    console.error('Get game error:', err);
    res.status(500).json({ error: 'Failed to fetch game.' });
  }
});

// POST /api/games — Create game (admin only)
router.post('/', authenticate, requireAuth, requireAdmin, async (req, res) => {
  try {
    const { name, slug, description, image_url, banner_url, active } = req.body;

    if (!name || !slug) {
      return res.status(400).json({ error: 'Name and slug are required.' });
    }

    const { data, error } = await supabase
      .from('games')
      .insert({
        name,
        slug,
        description: description || null,
        image_url: image_url || null,
        banner_url: banner_url || null,
        active: active !== undefined ? active : true,
      })
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: 'Failed to create game.' });
    }

    res.status(201).json(data);
  } catch (err) {
    console.error('Create game error:', err);
    res.status(500).json({ error: 'Failed to create game.' });
  }
});

// PUT /api/games/:id — Update game (admin only)
router.put('/:id', authenticate, requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, slug, description, image_url, banner_url, active } = req.body;

    const updates = {};
    if (name !== undefined) updates.name = name;
    if (slug !== undefined) updates.slug = slug;
    if (description !== undefined) updates.description = description;
    if (image_url !== undefined) updates.image_url = image_url;
    if (banner_url !== undefined) updates.banner_url = banner_url;
    if (active !== undefined) updates.active = active;

    const { data, error } = await supabase
      .from('games')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: 'Failed to update game.' });
    }

    if (!data) {
      return res.status(404).json({ error: 'Game not found.' });
    }

    res.json(data);
  } catch (err) {
    console.error('Update game error:', err);
    res.status(500).json({ error: 'Failed to update game.' });
  }
});

module.exports = router;
