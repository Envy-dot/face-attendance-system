const Database = require('better-sqlite3');
const path = require('path');

// We keep the DB file in the server root for now to avoid moving the existing file, 
// but we'll use an environment variable in the future.
const dbPath = path.resolve(__dirname, '../../', process.env.DB_PATH || 'attendance.db');
const db = new Database(dbPath);

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

  CREATE TABLE IF NOT EXISTS classes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    department TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS user_classes (
    user_id INTEGER,
    class_id INTEGER,
    PRIMARY KEY (user_id, class_id),
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY(class_id) REFERENCES classes(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS enrollments (
    user_id INTEGER,
    class_id INTEGER,
    PRIMARY KEY (user_id, class_id),
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY(class_id) REFERENCES classes(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    class_id INTEGER,
    name TEXT NOT NULL,
    type TEXT DEFAULT 'in', 
    duration INTEGER DEFAULT 0,
    start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP,
    is_active INTEGER DEFAULT 1,
    FOREIGN KEY(class_id) REFERENCES classes(id)
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

// Schema Migration for existing databases
try {
  db.prepare('ALTER TABLE users ADD COLUMN is_active INTEGER DEFAULT 1').run();
} catch (error) {
  if (!error.message.includes('duplicate column name')) {
    // console.log('Schema migration check:', error.message);
  }
}

try {
  db.prepare('ALTER TABLE sessions ADD COLUMN class_id INTEGER REFERENCES classes(id)').run();
} catch (error) {
  if (!error.message.includes('duplicate column name')) {
    // console.log('Schema migration check:', error.message);
  }
}

try {
  db.prepare('ALTER TABLE sessions ADD COLUMN duration INTEGER DEFAULT 0').run();
} catch (error) {
  if (!error.message.includes('duplicate column name')) {
    // console.log('Schema migration check:', error.message);
  }
}

// Check if we need to auto-enroll legacy users into existing classes
try {
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  const classCount = db.prepare('SELECT COUNT(*) as count FROM classes').get().count;
  const enrollmentCount = db.prepare('SELECT COUNT(*) as count FROM enrollments').get().count;

  if (userCount > 0 && classCount > 0 && enrollmentCount === 0) {
    console.log('Migrating: Auto-enrolling existing users into all classes...');
    db.prepare(`
      INSERT INTO enrollments (user_id, class_id)
      SELECT u.id, c.id
      FROM users u
      CROSS JOIN classes c
    `).run();
    console.log('Auto-enrollment complete.');
  }
} catch (error) {
  console.error('Auto-enrollment migration failed:', error.message);
}

module.exports = db;

