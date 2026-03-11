/**
 * Middleware to verify a Google reCAPTCHA v3 token.
 * Expects req.body.captchaToken to contain the client-side token.
 * Rejects the request with 403 if verification fails or score is below 0.5.
 */
async function verifyCaptcha(req, res, next) {
  const captchaToken = req.body.captchaToken || req.body.token;

  if (!captchaToken) {
    return res.status(403).json({ error: 'CAPTCHA token is required.' });
  }

  const secretKey = process.env.RECAPTCHA_SECRET_KEY;
  if (!secretKey) {
    console.error('RECAPTCHA_SECRET_KEY is not configured.');
    return res.status(500).json({ error: 'Server CAPTCHA configuration error.' });
  }

  try {
    const params = new URLSearchParams({
      secret: secretKey,
      response: captchaToken,
    });

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    const data = await response.json();

    if (!data.success || data.score < 0.5) {
      return res.status(403).json({
        error: 'CAPTCHA verification failed.',
      });
    }

    next();
  } catch (err) {
    console.error('CAPTCHA verification error:', err);
    return res.status(500).json({ error: 'Failed to verify CAPTCHA.' });
  }
}

module.exports = { verifyCaptcha };
