const express = require('express');
const router = express.Router();
const { supabase } = require('../lib/supabase');
const { authenticate, requireAuth } = require('../middleware/auth');
const { verifyCaptcha } = require('../middleware/captcha');

// POST /api/auth/verify-email — Resend verification email
router.post('/verify-email', authenticate, requireAuth, async (req, res) => {
  try {
    const email = req.user.email;
    if (!email) {
      return res.status(400).json({ error: 'No email associated with this account.' });
    }

    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ message: 'Verification email sent successfully.' });
  } catch (err) {
    console.error('Resend verification error:', err);
    res.status(500).json({ error: 'Failed to resend verification email.' });
  }
});

// POST /api/auth/captcha-verify — Verify captcha token for frontend validation
router.post('/captcha-verify', verifyCaptcha, (_req, res) => {
  res.json({ success: true, message: 'CAPTCHA verified successfully.' });
});

module.exports = router;
