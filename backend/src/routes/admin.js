const express = require('express');
const router = express.Router();
const { supabase } = require('../lib/supabase');
const { authenticate, requireAuth, requireAdmin } = require('../middleware/auth');

// All admin routes require authentication and admin role
router.use(authenticate, requireAuth, requireAdmin);

// GET /api/admin/users — List all users with pagination
router.get('/users', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const perPage = Math.min(parseInt(req.query.per_page) || 20, 100);
    const search = req.query.search || null;

    const from = (page - 1) * perPage;
    const to = from + perPage - 1;

    let query = supabase
      .from('profiles')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (search) {
      query = query.or(`username.ilike.%${search}%,email.ilike.%${search}%`);
    }

    const { data, error, count } = await query;

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({
      users: data,
      pagination: {
        page,
        per_page: perPage,
        total: count,
        total_pages: Math.ceil(count / perPage),
      },
    });
  } catch (err) {
    console.error('List users error:', err);
    res.status(500).json({ error: 'Failed to fetch users.' });
  }
});

// PUT /api/admin/users/:id/role — Change user role
router.put('/users/:id/role', async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    const validRoles = ['user', 'moderator', 'admin'];
    if (!role || !validRoles.includes(role)) {
      return res.status(400).json({
        error: `Invalid role. Must be one of: ${validRoles.join(', ')}`,
      });
    }

    const { data, error } = await supabase
      .from('profiles')
      .update({ role })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    if (!data) {
      return res.status(404).json({ error: 'User not found.' });
    }

    res.json(data);
  } catch (err) {
    console.error('Change role error:', err);
    res.status(500).json({ error: 'Failed to change user role.' });
  }
});

// GET /api/admin/stats — Dashboard stats
router.get('/stats', async (_req, res) => {
  try {
    // Total users
    const { count: userCount, error: userError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    // Total matches
    const { count: matchCount, error: matchError } = await supabase
      .from('matches')
      .select('*', { count: 'exact', head: true });

    // Active matches
    const { count: activeMatchCount, error: activeMatchError } = await supabase
      .from('matches')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'in_progress');

    // Total tournaments
    const { count: tournamentCount, error: tournamentError } = await supabase
      .from('tournaments')
      .select('*', { count: 'exact', head: true });

    // Active lobbies
    const { count: activeLobbyCount, error: lobbyError } = await supabase
      .from('lobbies')
      .select('*', { count: 'exact', head: true })
      .in('status', ['waiting', 'ready']);

    // Total orders
    const { count: orderCount, error: orderError } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true });

    // Active games
    const { count: gameCount, error: gameError } = await supabase
      .from('games')
      .select('*', { count: 'exact', head: true })
      .eq('active', true);

    res.json({
      users: userError ? 0 : userCount,
      matches: matchError ? 0 : matchCount,
      active_matches: activeMatchError ? 0 : activeMatchCount,
      tournaments: tournamentError ? 0 : tournamentCount,
      active_lobbies: lobbyError ? 0 : activeLobbyCount,
      orders: orderError ? 0 : orderCount,
      games: gameError ? 0 : gameCount,
    });
  } catch (err) {
    console.error('Dashboard stats error:', err);
    res.status(500).json({ error: 'Failed to fetch dashboard stats.' });
  }
});

module.exports = router;
