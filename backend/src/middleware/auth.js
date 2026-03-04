const { supabase } = require('../lib/supabase');

/**
 * Extract the Bearer token from the Authorization header,
 * verify it with Supabase, and attach the user object to req.user.
 * Does NOT reject unauthenticated requests — use requireAuth for that.
 */
async function authenticate(req, _res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.user = null;
    return next();
  }

  const token = authHeader.split(' ')[1];
  try {
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) {
      req.user = null;
      return next();
    }
    req.user = data.user;
    req.accessToken = token;
    next();
  } catch {
    req.user = null;
    next();
  }
}

/**
 * Require an authenticated user. Returns 401 if not authenticated.
 */
function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required.' });
  }
  next();
}

/**
 * Require the authenticated user to have an admin role.
 * Must be used after authenticate and requireAuth.
 */
async function requireAdmin(req, res, next) {
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', req.user.id)
      .single();

    if (error || !profile) {
      return res.status(403).json({ error: 'Unable to verify user role.' });
    }

    if (profile.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required.' });
    }

    req.userRole = profile.role;
    next();
  } catch (err) {
    return res.status(500).json({ error: 'Failed to verify admin status.' });
  }
}

/**
 * Require the authenticated user to have a verified email address.
 * Checks the email_verified field on the profiles table.
 * Must be used after authenticate and requireAuth.
 */
async function requireVerifiedEmail(req, res, next) {
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('email_verified')
      .eq('id', req.user.id)
      .single();

    if (error || !profile) {
      return res.status(403).json({ error: 'Unable to verify email status.' });
    }

    if (!profile.email_verified) {
      return res.status(403).json({ error: 'Email verification required.' });
    }

    next();
  } catch (err) {
    return res.status(500).json({ error: 'Failed to verify email status.' });
  }
}

module.exports = { authenticate, requireAuth, requireAdmin, requireVerifiedEmail };
