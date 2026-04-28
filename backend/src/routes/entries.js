const express = require('express');
const db = require('../db/database');
const auth = require('../middleware/auth');

const router = express.Router();
router.use(auth);

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

function nowTime() {
  return new Date().toTimeString().slice(0, 5); // HH:mm
}

/** Parse HH:mm to minutes since midnight */
function toMinutes(hhmm) {
  if (!hhmm) return null;
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

/** Calculate total_minutes and daily_balance when all four times are set */
function calculateTotals(entry, daily_target) {
  const startMin = toMinutes(entry.start_time);
  const lunchStartMin = toMinutes(entry.lunch_start);
  const lunchEndMin = toMinutes(entry.lunch_end);
  const endMin = toMinutes(entry.end_time);

  if (startMin === null || lunchStartMin === null || lunchEndMin === null || endMin === null) {
    return { total_minutes: null, daily_balance: null };
  }

  const total_minutes = (lunchStartMin - startMin) + (endMin - lunchEndMin);
  const daily_balance = total_minutes - daily_target;
  return { total_minutes, daily_balance };
}

/** Cumulative balance for all entries before a given month */
function getCumulativeBalance(userId, year, month) {
  const prefix = `${year}-${String(month).padStart(2, '0')}`;
  const row = db.prepare(
    `SELECT COALESCE(SUM(daily_balance), 0) AS balance
     FROM work_entries
     WHERE user_id = ? AND day_date < ?`
  ).get(userId, `${prefix}-01`);
  return row ? row.balance : 0;
}

// GET /api/entries/today
router.get('/today', (req, res) => {
  try {
    const entry = db.prepare(
      'SELECT * FROM work_entries WHERE user_id = ? AND day_date = ?'
    ).get(req.userId, todayDate());

    return res.json({ entry: entry || null });
  } catch (err) {
    console.error('Get today error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/entries/:year/:month
router.get('/:year/:month', (req, res) => {
  const { year, month } = req.params;

  if (!/^\d{4}$/.test(year) || !/^\d{2}$/.test(month) || +month < 1 || +month > 12) {
    return res.status(400).json({ error: 'Invalid year or month format' });
  }

  try {
    const prefix = `${year}-${month}`;
    // Compute the first day of the next month for a range query (avoids LIKE)
    const nextMonth = +month === 12
      ? `${+year + 1}-01-01`
      : `${year}-${String(+month + 1).padStart(2, '0')}-01`;

    const entries = db.prepare(
      `SELECT * FROM work_entries
       WHERE user_id = ? AND day_date >= ? AND day_date < ?
       ORDER BY day_date ASC`
    ).all(req.userId, `${prefix}-01`, nextMonth);

    const cumulative_balance = getCumulativeBalance(req.userId, year, parseInt(month, 10));

    return res.json({ entries, cumulative_balance });
  } catch (err) {
    console.error('Get entries error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/entries/action - advance today's entry to the next state
router.post('/action', (req, res) => {
  try {
    const user = db.prepare(
      'SELECT daily_target FROM users WHERE id = ?'
    ).get(req.userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const today = todayDate();
    const now = nowTime();
    let entry = db.prepare(
      'SELECT * FROM work_entries WHERE user_id = ? AND day_date = ?'
    ).get(req.userId, today);

    if (!entry) {
      // State 1: No entry yet — set start_time
      db.prepare(
        'INSERT INTO work_entries (user_id, day_date, start_time) VALUES (?, ?, ?)'
      ).run(req.userId, today, now);
    } else if (!entry.lunch_start) {
      // State 2: start_time set — set lunch_start
      db.prepare(
        'UPDATE work_entries SET lunch_start = ? WHERE id = ?'
      ).run(now, entry.id);
    } else if (!entry.lunch_end) {
      // State 3: lunch_start set — set lunch_end
      db.prepare(
        'UPDATE work_entries SET lunch_end = ? WHERE id = ?'
      ).run(now, entry.id);
    } else if (!entry.end_time) {
      // State 4: lunch_end set — set end_time and calculate totals
      const updated = { ...entry, end_time: now };
      const { total_minutes, daily_balance } = calculateTotals(updated, user.daily_target);
      db.prepare(
        `UPDATE work_entries
         SET end_time = ?, total_minutes = ?, daily_balance = ?
         WHERE id = ?`
      ).run(now, total_minutes, daily_balance, entry.id);
    } else {
      return res.status(409).json({
        error: 'Entry for today is already complete',
        entry,
      });
    }

    const updatedEntry = db.prepare(
      'SELECT * FROM work_entries WHERE user_id = ? AND day_date = ?'
    ).get(req.userId, today);

    return res.json({ entry: updatedEntry });
  } catch (err) {
    console.error('Action error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/entries/:id - manually update an entry
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { start_time, lunch_start, lunch_end, end_time } = req.body;

  try {
    const entry = db.prepare(
      'SELECT * FROM work_entries WHERE id = ? AND user_id = ?'
    ).get(id, req.userId);

    if (!entry) {
      return res.status(404).json({ error: 'Entry not found' });
    }

    const user = db.prepare('SELECT daily_target FROM users WHERE id = ?').get(req.userId);

    const updated = {
      start_time: start_time !== undefined ? start_time : entry.start_time,
      lunch_start: lunch_start !== undefined ? lunch_start : entry.lunch_start,
      lunch_end: lunch_end !== undefined ? lunch_end : entry.lunch_end,
      end_time: end_time !== undefined ? end_time : entry.end_time,
    };

    const { total_minutes, daily_balance } = calculateTotals(updated, user.daily_target);

    db.prepare(
      `UPDATE work_entries
       SET start_time = ?, lunch_start = ?, lunch_end = ?, end_time = ?,
           total_minutes = ?, daily_balance = ?
       WHERE id = ?`
    ).run(
      updated.start_time, updated.lunch_start, updated.lunch_end, updated.end_time,
      total_minutes, daily_balance,
      id
    );

    const result = db.prepare('SELECT * FROM work_entries WHERE id = ?').get(id);
    return res.json({ entry: result });
  } catch (err) {
    console.error('Update entry error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/entries/:id
router.delete('/:id', (req, res) => {
  try {
    const entry = db.prepare(
      'SELECT * FROM work_entries WHERE id = ? AND user_id = ?'
    ).get(req.params.id, req.userId);

    if (!entry) {
      return res.status(404).json({ error: 'Entry not found' });
    }

    db.prepare('DELETE FROM work_entries WHERE id = ?').run(req.params.id);
    return res.json({ message: 'Entry deleted' });
  } catch (err) {
    console.error('Delete entry error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
