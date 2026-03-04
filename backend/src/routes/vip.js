const express = require('express');
const router = express.Router();
const { supabase } = require('../lib/supabase');
const { authenticate, requireAuth, requireAdmin } = require('../middleware/auth');

// GET /api/vip/plans — Lista planos VIP disponíveis
router.get('/plans', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('vip_plans')
      .select('*')
      .eq('is_active', true)
      .order('price_cents', { ascending: true });

    if (error) {
      return res.status(500).json({ error: 'Falha ao buscar planos VIP.' });
    }

    res.json(data);
  } catch (err) {
    console.error('List VIP plans error:', err);
    res.status(500).json({ error: 'Falha ao buscar planos VIP.' });
  }
});

// GET /api/vip/status — Status VIP do usuário logado
router.get('/status', authenticate, requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('vip_tier, vip_expires_at')
      .eq('id', userId)
      .single();

    if (error) {
      return res.status(500).json({ error: 'Falha ao buscar status VIP.' });
    }

    const isActive = profile.vip_tier && profile.vip_expires_at &&
      new Date(profile.vip_expires_at) > new Date();

    res.json({
      vip_tier: isActive ? profile.vip_tier : null,
      vip_expires_at: isActive ? profile.vip_expires_at : null,
      is_active: isActive,
    });
  } catch (err) {
    console.error('VIP status error:', err);
    res.status(500).json({ error: 'Falha ao buscar status VIP.' });
  }
});

// POST /api/vip/subscribe — Assinar plano VIP (admin atribui manualmente por enquanto)
router.post('/subscribe', authenticate, requireAuth, requireAdmin, async (req, res) => {
  try {
    const { user_id, tier, duration_days = 30 } = req.body;

    if (!user_id || !tier) {
      return res.status(400).json({ error: 'user_id e tier são obrigatórios.' });
    }

    if (!['bronze', 'silver', 'premium'].includes(tier)) {
      return res.status(400).json({ error: 'Tier inválido. Use: bronze, silver ou premium.' });
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + duration_days);

    // Criar registro de assinatura
    const { error: subError } = await supabase
      .from('vip_subscriptions')
      .insert({
        user_id,
        plan_tier: tier,
        status: 'active',
        expires_at: expiresAt.toISOString(),
      });

    if (subError) {
      return res.status(400).json({ error: 'Falha ao criar assinatura.' });
    }

    // Atualizar perfil do usuário
    const { data: updatedProfile, error: profileError } = await supabase
      .from('profiles')
      .update({
        vip_tier: tier,
        vip_expires_at: expiresAt.toISOString(),
      })
      .eq('id', user_id)
      .select('id, username, vip_tier, vip_expires_at')
      .single();

    if (profileError) {
      return res.status(400).json({ error: 'Falha ao atualizar perfil VIP.' });
    }

    res.json({
      success: true,
      subscription: {
        user_id,
        tier,
        expires_at: expiresAt.toISOString(),
      },
      profile: updatedProfile,
    });
  } catch (err) {
    console.error('VIP subscribe error:', err);
    res.status(500).json({ error: 'Falha ao processar assinatura VIP.' });
  }
});

// POST /api/vip/cancel — Cancelar VIP de um usuário (admin)
router.post('/cancel', authenticate, requireAuth, requireAdmin, async (req, res) => {
  try {
    const { user_id } = req.body;

    if (!user_id) {
      return res.status(400).json({ error: 'user_id é obrigatório.' });
    }

    // Cancelar assinaturas ativas
    await supabase
      .from('vip_subscriptions')
      .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
      .eq('user_id', user_id)
      .eq('status', 'active');

    // Remover VIP do perfil
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ vip_tier: null, vip_expires_at: null })
      .eq('id', user_id);

    if (profileError) {
      return res.status(400).json({ error: 'Falha ao remover VIP.' });
    }

    res.json({ success: true });
  } catch (err) {
    console.error('VIP cancel error:', err);
    res.status(500).json({ error: 'Falha ao cancelar VIP.' });
  }
});

module.exports = router;
