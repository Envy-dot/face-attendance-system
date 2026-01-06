const Database = require('better-sqlite3');
const path = require('path');

// We keep the DB file in the server root for now to avoid moving the existing file, 
// but we'll use an environment variable in the future.
const dbPath = path.resolve(__dirname, '../../', process.env.DB_PATH || 'attendance.db');
const db = new Database(dbPath, { verbose: console.log });

// Initializing Schema
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    matric_no TEXT,
    level TEXT,
    department TEXT,
    course TEXT,
    photo TEXT,
    descriptor TEXT NOT NULL,
    section TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT DEFAULT 'in', 
    start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP,
    is_active INTEGER DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS attendance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    session_id INTEGER,
    type TEXT DEFAULT 'in',
    image TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(session_id) REFERENCES sessions(id)
  );
`);

module.exports = db;
