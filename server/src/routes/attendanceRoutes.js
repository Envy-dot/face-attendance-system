const express = require('express');
const router = express.Router();
const attendanceService = require('../services/attendanceService');
const sessionService = require('../services/sessionService');
const xlsx = require('xlsx');

// Log attendance
router.post('/', (req, res) => {
    const { userId, image } = req.body;

    if (!userId) {
        return res.status(400).json({ error: 'UserId is required' });
    }

    try {
        const activeSession = sessionService.getActiveSession();

        if (!activeSession) {
            return res.status(403).json({ error: 'No active session. Please wait for lecturer to start a session.' });
        }

        const sessionMode = activeSession.type;
        const sessionId = activeSession.id;

        // Duplicate check
        if (attendanceService.checkDuplicate(userId, sessionId, sessionMode)) {
            return res.status(409).json({ error: 'Already marked for this session' });
        }

        const entryId = attendanceService.logAttendance(userId, sessionId, sessionMode, image);
        res.json({ success: true, entryId, session: activeSession });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get attendance logs
router.get('/', (req, res) => {
    try {
        const { search } = req.query;
        const logs = attendanceService.getAttendanceLogs(search);
        res.json(logs);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.delete('/bulk', (req, res) => {
    const { date } = req.body;
    try {
        if (date) {
            attendanceService.deleteAttendanceByDate(date);
            res.json({ success: true });
        } else {
            res.status(400).json({ error: 'Date is required' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.delete('/:id', (req, res) => {
    try {
        attendanceService.deleteAttendance(req.params.id);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Export Matrix Excel (Student vs Date)
router.get('/export-matrix', (req, res) => {
    try {
        const { sessionName } = req.query;
        if (!sessionName) return res.status(400).json({ error: 'sessionName is required' });

        const users = require('../services/userService').getAllUsers();

        // Get all sessions with this name
        const db = require('../config/database');
        const sessions = db.prepare('SELECT id, date(start_time) as date FROM sessions WHERE name = ? ORDER BY start_time ASC').all(sessionName);

        if (sessions.length === 0) return res.status(404).json({ error: 'No sessions found with this name' });

        // Build unique session dates
        const dates = [...new Set(sessions.map(s => s.date))];
        const sessionIdsByDate = {};
        dates.forEach(d => {
            sessionIdsByDate[d] = sessions.filter(s => s.date === d).map(s => s.id);
        });

        // Fetch all attendance for these sessions
        const sessionIds = sessions.map(s => s.id);
        const placeholders = sessionIds.map(() => '?').join(',');
        const attendance = db.prepare(`SELECT user_id, session_id FROM attendance WHERE session_id IN (${placeholders})`).all(...sessionIds);

        const matrixData = users.map(user => {
            const row = {
                'Matric No': user.matric_no || 'N/A',
                'Name': user.name,
                'Department': user.department || 'N/A',
                'Course': user.course || 'N/A'
            };

            dates.forEach(date => {
                const idsForDate = sessionIdsByDate[date];
                const wasPresent = attendance.some(a => a.user_id === user.id && idsForDate.includes(a.session_id));
                row[date] = wasPresent ? 1 : 0;
            });

            return row;
        });

        const wb = xlsx.utils.book_new();
        const ws = xlsx.utils.json_to_sheet(matrixData);
        xlsx.utils.book_append_sheet(wb, ws, 'Attendance Matrix');

        const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
        res.setHeader('Content-Disposition', `attachment; filename="attendance_matrix_${sessionName.replace(/\s+/g, '_')}.xlsx"`);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.send(buffer);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
