const express = require('express');
const router = express.Router();
const { supabase } = require('../lib/supabase');
const { authenticate, requireAuth, requireVerifiedEmail } = require('../middleware/auth');

// GET /api/chat/messages — Get messages by channel_type and channel_id
router.get('/messages', async (req, res) => {
  try {
    const { channel_type, channel_id, limit: queryLimit, before } = req.query;

    if (!channel_type || !channel_id) {
      return res.status(400).json({ error: 'channel_type and channel_id are required.' });
    }

    const resultLimit = Math.min(parseInt(queryLimit) || 50, 200);

    let query = supabase
      .from('chat_messages')
      .select('*, profiles(username, avatar_url)')
      .eq('channel_type', channel_type)
      .eq('channel_id', channel_id)
      .order('created_at', { ascending: false })
      .limit(resultLimit);

    if (before) {
      query = query.lt('created_at', before);
    }

    const { data, error } = await query;

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch messages.' });
    }

    // Return in chronological order
    res.json(data.reverse());
  } catch (err) {
    console.error('Get messages error:', err);
    res.status(500).json({ error: 'Failed to fetch messages.' });
  }
});

// POST /api/chat/messages — Send message (auth, verified email)
router.post('/messages', authenticate, requireAuth, requireVerifiedEmail, async (req, res) => {
  try {
    const userId = req.user.id;
    const { channel_type, channel_id, content } = req.body;

    if (!channel_type || !channel_id || !content) {
      return res.status(400).json({ error: 'channel_type, channel_id, and content are required.' });
    }

    if (content.length > 1000) {
      return res.status(400).json({ error: 'Message content must be 1000 characters or fewer.' });
    }

    const { data, error } = await supabase
      .from('chat_messages')
      .insert({
        user_id: userId,
        channel_type,
        channel_id,
        content: content.trim(),
      })
      .select('*, profiles(username, avatar_url)')
      .single();

    if (error) {
      return res.status(400).json({ error: 'Failed to send message.' });
    }

    res.status(201).json(data);
  } catch (err) {
    console.error('Send message error:', err);
    res.status(500).json({ error: 'Failed to send message.' });
  }
});

module.exports = router;
