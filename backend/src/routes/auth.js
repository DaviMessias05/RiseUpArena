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

// Validação estrutural de CPF (algoritmo dos dígitos verificadores)
function isValidCpfStructure(cpf) {
  const digits = cpf.replace(/\D/g, '');
  if (digits.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(digits)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(digits[i]) * (10 - i);
  let remainder = (sum * 10) % 11;
  if (remainder === 10) remainder = 0;
  if (remainder !== parseInt(digits[9])) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(digits[i]) * (11 - i);
  remainder = (sum * 10) % 11;
  if (remainder === 10) remainder = 0;
  if (remainder !== parseInt(digits[10])) return false;

  return true;
}

// POST /api/auth/validate-cpf — Validate CPF (structural + real verification)
router.post('/validate-cpf', async (req, res) => {
  try {
    const { cpf } = req.body;
    if (!cpf) {
      return res.status(400).json({ valid: false, error: 'CPF é obrigatório.' });
    }

    const digits = cpf.replace(/\D/g, '');

    // Nível 1: Validação estrutural
    if (!isValidCpfStructure(digits)) {
      return res.status(400).json({ valid: false, error: 'CPF inválido.' });
    }

    // Verificar duplicata no banco
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('cpf', digits)
      .maybeSingle();

    if (existing) {
      return res.status(409).json({ valid: false, error: 'Este CPF já está cadastrado.' });
    }

    // Nível 2: Verificação real de CPF via API externa
    // Para usar, configure a variável CPF_API_TOKEN no .env
    // Serviços sugeridos: BrasilAPI (grátis), InvertexTo, CPFConsulta
    if (process.env.CPF_API_TOKEN) {
      try {
        const response = await fetch(`https://brasilapi.com.br/api/cpf/v1/${digits}`);
        if (!response.ok) {
          return res.status(400).json({
            valid: false,
            error: 'CPF não encontrado na Receita Federal.',
          });
        }
        // CPF é real e existe na Receita Federal
      } catch (apiErr) {
        // Se a API externa falhar, aceita apenas com validação estrutural
        console.warn('CPF API verification failed, using structural validation only:', apiErr.message);
      }
    }

    res.json({ valid: true });
  } catch (err) {
    console.error('CPF validation error:', err);
    res.status(500).json({ valid: false, error: 'Erro ao validar CPF.' });
  }
});

// POST /api/auth/check-unique — Check if email/username/cpf are available
router.post('/check-unique', async (req, res) => {
  try {
    const { email, username, cpf } = req.body;
    const errors = {};

    if (email) {
      const { data } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .maybeSingle();
      if (data) errors.email = 'Este email já está cadastrado.';
    }

    if (username) {
      const { data } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', username)
        .maybeSingle();
      if (data) errors.username = 'Este nome de usuário já está em uso.';
    }

    if (cpf) {
      const digits = cpf.replace(/\D/g, '');
      const { data } = await supabase
        .from('profiles')
        .select('id')
        .eq('cpf', digits)
        .maybeSingle();
      if (data) errors.cpf = 'Este CPF já está cadastrado.';
    }

    if (Object.keys(errors).length > 0) {
      return res.status(409).json({ available: false, errors });
    }

    res.json({ available: true });
  } catch (err) {
    console.error('Check unique error:', err);
    res.status(500).json({ available: false, error: 'Erro ao verificar dados.' });
  }
});

// POST /api/auth/complete-profile — Complete profile after SSO login (CPF, username, display_name)
router.post('/complete-profile', authenticate, requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { cpf, username, display_name } = req.body;

    if (!cpf || !username) {
      return res.status(400).json({ error: 'CPF e nome de usuário são obrigatórios.' });
    }

    const digits = cpf.replace(/\D/g, '');

    // Validar CPF estruturalmente
    if (!isValidCpfStructure(digits)) {
      return res.status(400).json({ error: 'CPF inválido.' });
    }

    // Verificar se o perfil já tem CPF (evitar dupla submissão)
    const { data: currentProfile } = await supabase
      .from('profiles')
      .select('cpf')
      .eq('id', userId)
      .single();

    if (currentProfile?.cpf) {
      return res.status(400).json({ error: 'Perfil já possui CPF cadastrado.' });
    }

    // Verificar unicidade de CPF e username (excluindo o próprio usuário)
    const { data: cpfExists } = await supabase
      .from('profiles')
      .select('id')
      .eq('cpf', digits)
      .neq('id', userId)
      .maybeSingle();

    if (cpfExists) {
      return res.status(409).json({ error: 'Este CPF já está cadastrado.' });
    }

    // Validar username
    if (username.length < 3 || username.length > 20) {
      return res.status(400).json({ error: 'Nome de usuário deve ter entre 3 e 20 caracteres.' });
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return res.status(400).json({ error: 'Nome de usuário deve conter apenas letras, números e underline.' });
    }

    const { data: usernameExists } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username)
      .neq('id', userId)
      .maybeSingle();

    if (usernameExists) {
      return res.status(409).json({ error: 'Este nome de usuário já está em uso.' });
    }

    // Verificação real de CPF via API externa (se configurado)
    if (process.env.CPF_API_TOKEN) {
      try {
        const response = await fetch(`https://brasilapi.com.br/api/cpf/v1/${digits}`);
        if (!response.ok) {
          return res.status(400).json({ error: 'CPF não encontrado na Receita Federal.' });
        }
      } catch (apiErr) {
        console.warn('CPF API verification failed, using structural validation only:', apiErr.message);
      }
    }

    // Atualizar perfil
    const updates = { cpf: digits, username };
    if (display_name && display_name.trim().length >= 3) {
      updates.display_name = display_name.trim();
    }

    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (updateError) {
      console.error('Profile update error:', updateError);
      return res.status(500).json({ error: 'Erro ao atualizar perfil.' });
    }

    res.json({ success: true, profile: updatedProfile });
  } catch (err) {
    console.error('Complete profile error:', err);
    res.status(500).json({ error: 'Erro ao completar perfil.' });
  }
});

module.exports = router;
