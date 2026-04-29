const Database = require('better-sqlite3');
const path = require('path');

const dbPath = process.env.DATABASE_PATH || './database.sqlite';

const db = new Database(path.resolve(dbPath));

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    daily_target INTEGER NOT NULL DEFAULT 450,
    default_break INTEGER NOT NULL DEFAULT 60,
    stagger_days INTEGER NOT NULL DEFAULT 5
  );

  CREATE TABLE IF NOT EXISTS work_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    day_date TEXT NOT NULL,
    start_time TEXT,
    lunch_start TEXT,
    lunch_end TEXT,
    end_time TEXT,
    total_minutes INTEGER,
    daily_balance INTEGER,
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE(user_id, day_date)
  );
`);

module.exports = db;
