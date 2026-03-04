const express = require('express');
const router = express.Router();
const { supabase } = require('../lib/supabase');

// GET /api/rankings — Get rankings by game slug, sorted by rating desc, limit 100
router.get('/', async (req, res) => {
  try {
    const { game } = req.query;

    if (!game) {
      return res.status(400).json({ error: 'Query parameter "game" (slug) is required.' });
    }

    // Resolve game slug to game id
    const { data: gameData, error: gameError } = await supabase
      .from('games')
      .select('id, name, slug')
      .eq('slug', game)
      .single();

    if (gameError || !gameData) {
      return res.status(404).json({ error: 'Game not found.' });
    }

    const { data: rankings, error } = await supabase
      .from('rankings')
      .select('*, profiles(username, avatar_url)')
      .eq('game_id', gameData.id)
      .order('rating', { ascending: false })
      .limit(100);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({
      game: gameData,
      rankings: rankings.map((r, index) => ({
        position: index + 1,
        ...r,
      })),
    });
  } catch (err) {
    console.error('Get rankings error:', err);
    res.status(500).json({ error: 'Failed to fetch rankings.' });
  }
});

module.exports = router;
