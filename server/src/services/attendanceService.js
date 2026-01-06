const db = require('../config/database');

const logAttendance = (userId, sessionId, type, image) => {
    const stmt = db.prepare('INSERT INTO attendance (user_id, session_id, type, image) VALUES (?, ?, ?, ?)');
    const info = stmt.run(userId, sessionId, type, image);
    return info.lastInsertRowid;
};

const checkDuplicate = (userId, sessionId, type) => {
    if (!sessionId) return false;
    const stmt = db.prepare('SELECT id FROM attendance WHERE user_id = ? AND session_id = ? AND type = ?');
    return !!stmt.get(userId, sessionId, type);
};

const getAttendanceLogs = (search) => {
    let query = `
    SELECT a.id, strftime('%Y-%m-%dT%H:%M:%SZ', a.timestamp) as timestamp, a.type, a.image, u.name, u.matric_no, u.level, u.department, s.name as session_name
    FROM attendance a 
    JOIN users u ON a.user_id = u.id 
    LEFT JOIN sessions s ON a.session_id = s.id
  `;

    const params = [];
    if (search) {
        query += ' WHERE u.name LIKE ? OR u.matric_no LIKE ? OR date(a.timestamp) = ?';
        params.push(`%${search}%`, `%${search}%`, search);
    }

    query += ' ORDER BY a.timestamp DESC';
    const stmt = db.prepare(query);
    return stmt.all(...params);
};

const deleteAttendance = (id) => {
    const stmt = db.prepare('DELETE FROM attendance WHERE id = ?');
    return stmt.run(id);
};

const deleteAttendanceByDate = (dateStr) => {
    const stmt = db.prepare("DELETE FROM attendance WHERE date(timestamp) = ?");
    return stmt.run(dateStr);
};

module.exports = {
    logAttendance,
    checkDuplicate,
    getAttendanceLogs,
    deleteAttendance,
    deleteAttendanceByDate
};
