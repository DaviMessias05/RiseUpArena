const express = require('express');
const multer = require('multer');
const path = require('path');
const { authenticate, requireAuth } = require('../middleware/auth');
const { uploadToR2, deleteFromR2 } = require('../lib/r2');
const { supabase } = require('../lib/supabase');

const router = express.Router();

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_SIZE = 2 * 1024 * 1024; // 2MB

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_SIZE },
  fileFilter(_req, file, cb) {
    if (ALLOWED_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Formato inválido. Use JPG, PNG, WebP ou GIF.'));
    }
  },
});

// POST /api/upload/avatar
router.post(
  '/avatar',
  authenticate,
  requireAuth,
  (req, res, next) => {
    upload.single('avatar')(req, res, (err) => {
      if (err) {
        if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ error: 'Imagem muito grande. Máximo 2MB.' });
        }
        return res.status(400).json({ error: err.message || 'Erro no upload.' });
      }
      next();
    });
  },
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'Nenhuma imagem enviada.' });
      }

      // Get current avatar URL to delete the old file
      const { data: profile } = await supabase
        .from('profiles')
        .select('avatar_url')
        .eq('id', req.user.id)
        .single();

      const ext = path.extname(req.file.originalname).toLowerCase() || '.png';
      const key = `avatars/${req.user.id}/${Date.now()}${ext}`;

      const publicUrl = await uploadToR2(key, req.file.buffer, req.file.mimetype);

      // Update profile with new avatar URL
      const { error: dbError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', req.user.id);

      if (dbError) {
        console.error('Failed to update profile avatar_url:', dbError.message);
      }

      // Delete old avatar from R2 (fire-and-forget, don't block response)
      if (profile?.avatar_url && profile.avatar_url.includes('/avatars/')) {
        const oldKey = profile.avatar_url.split('/avatars/').pop();
        if (oldKey) {
          deleteFromR2(`avatars/${oldKey}`).catch((err) => {
            console.error('Failed to delete old avatar:', err.message);
          });
        }
      }

      return res.json({ url: publicUrl });
    } catch (err) {
      console.error('Avatar upload error:', err);
      return res.status(500).json({ error: 'Erro ao salvar imagem.' });
    }
  }
);

module.exports = router;
