const db = require('../config/database');

const createSession = (name, type = 'in') => {
    // Deactivate all other sessions first
    db.prepare('UPDATE sessions SET is_active = 0').run();
    const stmt = db.prepare('INSERT INTO sessions (name, type) VALUES (?, ?)');
    const info = stmt.run(name, type);
    return { id: info.lastInsertRowid, name, type, is_active: 1 };
};

const getActiveSession = () => {
    const stmt = db.prepare('SELECT * FROM sessions WHERE is_active = 1 ORDER BY id DESC LIMIT 1');
    return stmt.get();
};

const getSessionHistory = () => {
    const stmt = db.prepare('SELECT * FROM sessions ORDER BY start_time DESC LIMIT 50');
    return stmt.all();
};

const deleteSession = (id) => {
    const stmt = db.prepare('DELETE FROM sessions WHERE id = ?');
    return stmt.run(id);
};

const toggleSession = (id, isActive) => {
    if (isActive) {
        db.prepare('UPDATE sessions SET is_active = 0').run();
    }
    const stmt = db.prepare('UPDATE sessions SET is_active = ? WHERE id = ?');
    stmt.run(isActive ? 1 : 0, id);
};

const toggleSessionType = (id) => {
    const session = db.prepare('SELECT type FROM sessions WHERE id = ?').get(id);
    if (session) {
        const newType = session.type === 'in' ? 'out' : 'in';
        db.prepare('UPDATE sessions SET type = ? WHERE id = ?').run(newType, id);
        return newType;
    }
    return null;
};

const getSessionStats = (sessionId) => {
    const stats = db.prepare(`
    SELECT 
      COUNT(DISTINCT user_id) as total_students,
      SUM(CASE WHEN type = 'in' THEN 1 ELSE 0 END) as total_in,
      SUM(CASE WHEN type = 'out' THEN 1 ELSE 0 END) as total_out
    FROM attendance 
    WHERE session_id = ?
  `).get(sessionId);
    return stats;
};

module.exports = {
    createSession,
    getActiveSession,
    getSessionHistory,
    deleteSession,
    toggleSession,
    toggleSessionType,
    getSessionStats
};
