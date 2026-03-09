const db = require('../config/database');

const createSession = (name, type = 'in', duration = 0, classId = null) => {
    // Deactivate all other sessions first
    db.prepare('UPDATE sessions SET is_active = 0').run();
    const stmt = db.prepare('INSERT INTO sessions (class_id, name, type, duration) VALUES (?, ?, ?, ?)');
    const info = stmt.run(classId, name, type, duration);
    return { id: info.lastInsertRowid, name, type, duration, class_id: classId, is_active: 1 };
};

const getActiveSession = () => {
    // 1. Fetch the raw active session
    const stmt = db.prepare(`
        SELECT s.*, c.code as class_code, c.name as class_name 
        FROM sessions s 
        LEFT JOIN classes c ON s.class_id = c.id 
        WHERE s.is_active = 1 
        ORDER BY s.id DESC LIMIT 1
    `);
    const session = stmt.get();

    if (session) {
        // SQLite CURRENT_TIMESTAMP is 'YYYY-MM-DD HH:MM:SS' (UTC)
        // We must append 'Z' to ensure JS parses it as UTC, not Local
        const utcString = session.start_time.replace(' ', 'T') + 'Z';
        session.start_time = new Date(utcString).toISOString();

        // 2. Auto-Termination Check
        const duration = parseInt(session.duration, 10) || 0;
        if (duration > 0) {
            const startTimeMs = new Date(session.start_time).getTime();
            const nowMs = Date.now();
            const expiryTimeMs = startTimeMs + (duration * 60000);

            if (nowMs >= expiryTimeMs) {
                console.log(`[Auto-Terminate] Session ${session.id} expired natively. Marking inactive.`);
                db.prepare('UPDATE sessions SET is_active = 0 WHERE id = ?').run(session.id);
                return null;
            }
        }
    }

    return session || null;
};

const getSessionHistory = () => {
    const stmt = db.prepare(`
        SELECT s.*, c.code as class_code 
        FROM sessions s 
        LEFT JOIN classes c ON s.class_id = c.id 
        ORDER BY s.start_time DESC LIMIT 50
    `);
    return stmt.all();
};

const deleteSession = (id) => {
    db.prepare('DELETE FROM attendance WHERE session_id = ?').run(id);
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
