const db = require('../config/database');
const faceService = require('./faceService');

const THRESHOLD = 0.9; // Strictness for ArcFace

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

const verifyFace = async (descriptor) => {
    // The match logic is now entirely handled by faceService.findMatchingFace
    // which compares the incoming 128D array against all stored descriptors.
    const match = faceService.findMatchingFace(descriptor);

    if (match) {
        return match.userId;
    }

    return null;
};

const getAttendanceLogs = (search, sessionIdParam = null) => {
    let query = `
    SELECT a.id, strftime('%Y-%m-%dT%H:%M:%SZ', a.timestamp) as timestamp, a.type, a.image, u.name, u.matric_no, u.level, u.department, s.name as session_name
    FROM attendance a 
    JOIN users u ON a.user_id = u.id 
    LEFT JOIN sessions s ON a.session_id = s.id
  `;

    const params = [];
    const conditions = [];

    if (search) {
        conditions.push('(u.name LIKE ? OR u.matric_no LIKE ? OR date(a.timestamp) = ?)');
        params.push(`%${search}%`, `%${search}%`, search);
    }

    if (sessionIdParam) {
        conditions.push('a.session_id = ?');
        params.push(sessionIdParam);
    }

    if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY a.timestamp DESC';
    const stmt = db.prepare(query);
    return stmt.all(...params);
};

const deleteAttendance = (id) => {
    const stmt = db.prepare('DELETE FROM attendance WHERE id = ?');
    return stmt.run(id);
};

const deleteAttendanceByDate = (date) => {
    const stmt = db.prepare('DELETE FROM attendance WHERE date(timestamp) = ?');
    return stmt.run(date);
};

const getAttendanceMatrix = (classId) => {
    // 1. Get all sessions for this class
    let sessionQuery = 'SELECT id, name, date(start_time) as date FROM sessions WHERE 1=1';
    const params = [];

    if (classId) {
        sessionQuery += ' AND class_id = ?';
        params.push(classId);
    }
    sessionQuery += ' ORDER BY start_time ASC';
    const sessions = db.prepare(sessionQuery).all(...params);

    if (sessions.length === 0) return { sessions: [], data: [] };

    // 2. Get all students explicitly enrolled (including soft deleted since we want historical matrix accuracy)
    let userQuery = `
        SELECT u.id, u.name, u.matric_no
        FROM users u
        ${classId ? 'JOIN enrollments e ON u.id = e.user_id WHERE e.class_id = ?' : ''}
        ORDER BY u.name ASC
    `;
    const users = db.prepare(userQuery).all(...(classId ? [classId] : []));

    // 3. Get all attendance records for these sessions
    const sessionIds = sessions.map(s => s.id);
    if (sessionIds.length === 0) return { sessions, data: [] };

    const attendanceQuery = `
        SELECT user_id, session_id 
        FROM attendance 
        WHERE session_id IN (${sessionIds.join(',')}) AND type = 'in'
    `;
    const attendanceRecords = db.prepare(attendanceQuery).all();

    // 4. Build Matrix
    const attendanceMap = {};
    attendanceRecords.forEach(r => {
        attendanceMap[`${r.user_id}_${r.session_id}`] = true;
    });

    const matrix = users.map((user, index) => {
        const row = {
            'S/N': index + 1,
            name: user.name,
            matric_no: user.matric_no,
            attendance: {}
        };
        sessions.forEach(session => {
            row.attendance[session.id] = attendanceMap[`${user.id}_${session.id}`] ? 1 : 0;
        });
        return row;
    });

    return { sessions, data: matrix };
};

module.exports = {
    logAttendance,
    checkDuplicate,
    verifyFace,
    getAttendanceLogs,
    deleteAttendance,
    deleteAttendanceByDate,
    getAttendanceMatrix
};
