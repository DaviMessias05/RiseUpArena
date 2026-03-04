const express = require('express');
const router = express.Router();
const { supabase } = require('../lib/supabase');
const { authenticate, requireAuth, requireAdmin, requireVerifiedEmail } = require('../middleware/auth');

// GET /api/store/products — List active products
router.get('/products', async (_req, res) => {
  try {
    const { data, error } = await supabase
      .from('store_products')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch products.' });
    }

    res.json(data);
  } catch (err) {
    console.error('List products error:', err);
    res.status(500).json({ error: 'Failed to fetch products.' });
  }
});

// POST /api/store/order — Create order (auth, verified email) — deduct credits
router.post('/order', authenticate, requireAuth, requireVerifiedEmail, async (req, res) => {
  try {
    const userId = req.user.id;
    const { product_id, quantity } = req.body;

    if (!product_id) {
      return res.status(400).json({ error: 'product_id is required.' });
    }

    const orderQuantity = quantity || 1;

    // Fetch the product
    const { data: product, error: productError } = await supabase
      .from('store_products')
      .select('*')
      .eq('id', product_id)
      .eq('is_active', true)
      .single();

    if (productError || !product) {
      return res.status(404).json({ error: 'Product not found or inactive.' });
    }

    const totalCost = product.price_credits * orderQuantity;

    // Check stock if applicable (-1 means unlimited)
    if (product.stock >= 0 && product.stock < orderQuantity) {
      return res.status(400).json({ error: 'Insufficient stock.' });
    }

    // Atomic credit deduction using RPC to prevent double-spend
    const { data: deductResult, error: deductError } = await supabase
      .rpc('deduct_credits', { p_user_id: userId, p_amount: totalCost });

    if (deductError) {
      if (deductError.message.includes('Insufficient credits')) {
        return res.status(400).json({ error: 'Insufficient credits.' });
      }
      return res.status(500).json({ error: 'Failed to deduct credits.' });
    }

    // Atomic stock deduction if tracked
    if (product.stock >= 0) {
      const { error: stockError } = await supabase
        .rpc('deduct_stock', { p_product_id: product_id, p_amount: orderQuantity });

      if (stockError) {
        // Refund credits atomically
        await supabase.rpc('add_credits', { p_user_id: userId, p_amount: totalCost });
        return res.status(400).json({ error: 'Insufficient stock.' });
      }
    }

    // Create order record
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: userId,
        product_id,
        quantity: orderQuantity,
        total_credits: totalCost,
        status: 'completed',
      })
      .select()
      .single();

    if (orderError) {
      // Refund credits atomically on order creation failure
      await supabase.rpc('add_credits', { p_user_id: userId, p_amount: totalCost });
      if (product.stock >= 0) {
        await supabase.rpc('add_stock', { p_product_id: product_id, p_amount: orderQuantity });
      }
      return res.status(500).json({ error: 'Failed to create order.' });
    }

    res.status(201).json(order);
  } catch (err) {
    console.error('Create order error:', err);
    res.status(500).json({ error: 'Failed to process order.' });
  }
});

// GET /api/store/orders — Get user's order history (auth)
router.get('/orders', authenticate, requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;

    const { data, error } = await supabase
      .from('orders')
      .select('*, store_products(name, image_url)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch orders.' });
    }

    res.json(data);
  } catch (err) {
    console.error('Get orders error:', err);
    res.status(500).json({ error: 'Failed to fetch orders.' });
  }
});

// POST /api/store/products — Create product (admin only)
router.post('/products', authenticate, requireAuth, requireAdmin, async (req, res) => {
  try {
    const { name, description, price_credits, image_url, category, stock, is_active } = req.body;

    if (!name || price_credits === undefined) {
      return res.status(400).json({ error: 'Name and price_credits are required.' });
    }

    const { data, error } = await supabase
      .from('store_products')
      .insert({
        name,
        description: description || null,
        price_credits,
        image_url: image_url || null,
        category: category || 'general',
        stock: stock !== undefined ? stock : -1,
        is_active: is_active !== undefined ? is_active : true,
      })
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: 'Failed to create product.' });
    }

    res.status(201).json(data);
  } catch (err) {
    console.error('Create product error:', err);
    res.status(500).json({ error: 'Failed to create product.' });
  }
});

// PUT /api/store/products/:id — Update product (admin only)
router.put('/products/:id', authenticate, requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price_credits, image_url, category, stock, is_active } = req.body;

    const updates = {};
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (price_credits !== undefined) updates.price_credits = price_credits;
    if (image_url !== undefined) updates.image_url = image_url;
    if (category !== undefined) updates.category = category;
    if (stock !== undefined) updates.stock = stock;
    if (is_active !== undefined) updates.is_active = is_active;

    const { data, error } = await supabase
      .from('store_products')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: 'Failed to update product.' });
    }

    if (!data) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    res.json(data);
  } catch (err) {
    console.error('Update product error:', err);
    res.status(500).json({ error: 'Failed to update product.' });
  }
});

module.exports = router;
