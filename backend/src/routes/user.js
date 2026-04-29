const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db/database');
const auth = require('../middleware/auth');

const router = express.Router();
router.use(auth);

// GET /api/user/settings
router.get('/settings', (req, res) => {
  try {
    const user = db.prepare(
      'SELECT id, email, daily_target, default_break, stagger_days FROM users WHERE id = ?'
    ).get(req.userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({ user });
  } catch (err) {
    console.error('Get settings error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/user/settings
router.put('/settings', async (req, res) => {
  const { daily_target, default_break, stagger_days, password } = req.body;

  const fields = [];
  const values = [];

  if (daily_target !== undefined) {
    if (!Number.isInteger(daily_target) || daily_target < 0) {
      return res.status(400).json({ error: 'daily_target must be a non-negative integer' });
    }
    fields.push('daily_target = ?');
    values.push(daily_target);
  }

  if (default_break !== undefined) {
    if (!Number.isInteger(default_break) || default_break < 0) {
      return res.status(400).json({ error: 'default_break must be a non-negative integer' });
    }
    fields.push('default_break = ?');
    values.push(default_break);
  }

  if (stagger_days !== undefined) {
    if (!Number.isInteger(stagger_days) || stagger_days < 0) {
      return res.status(400).json({ error: 'stagger_days must be a non-negative integer' });
    }
    fields.push('stagger_days = ?');
    values.push(stagger_days);
  }

  if (password !== undefined) {
    if (typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }
    const hashed = await bcrypt.hash(password, 10);
    fields.push('password = ?');
    values.push(hashed);
  }

  if (fields.length === 0) {
    return res.status(400).json({ error: 'No valid fields to update' });
  }

  try {
    values.push(req.userId);
    db.prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`).run(...values);

    const user = db.prepare(
      'SELECT id, email, daily_target, default_break, stagger_days FROM users WHERE id = ?'
    ).get(req.userId);

    return res.json({ user });
  } catch (err) {
    console.error('Update settings error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
