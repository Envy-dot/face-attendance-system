const express = require('express');
const router = express.Router();
const attendanceService = require('../services/attendanceService');
const sessionService = require('../services/sessionService');
const xlsx = require('xlsx');
const userService = require('../services/userService');
const db = require('../config/database');
const multer = require('multer');
const auth = require('../middleware/auth');

// Configure Multer
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }
});

// Log attendance (Scan Face)
router.post('/', upload.any(), async (req, res) => {
    // userId is NO LONGER required in body if image is provided
    let { userId, faceLandmarks } = req.body;

    // Find any image file
    const file = req.files ? req.files.find(f => f.mimetype.startsWith('image/')) : null;

    try {
        if (faceLandmarks) {
            // VERIFY FACE
            console.log(`Verifying face from provided landmarks...`);
            let descriptor = faceLandmarks;
            if (typeof descriptor === 'string') {
                try {
                    descriptor = JSON.parse(descriptor);
                } catch (e) {
                    return res.status(400).json({ error: 'Invalid faceLandmarks payload' });
                }
            }

            const recognizedUserId = await attendanceService.verifyFace(descriptor);

            if (!recognizedUserId) {
                return res.status(401).json({ error: 'Face not recognized' });
            }
            userId = recognizedUserId;
        }

        if (!userId) {
            return res.status(400).json({ error: 'UserId or faceLandmarks is required' });
        }

        const activeSession = sessionService.getActiveSession();

        if (!activeSession) {
            return res.status(403).json({ error: 'No active session. Please wait for lecturer to start a session.' });
        }

        const sessionMode = activeSession.type;
        const sessionId = activeSession.id;

        // Class Enrollment Restriction
        if (activeSession.class_id) {
            const isEnrolled = db.prepare('SELECT 1 FROM enrollments WHERE user_id = ? AND class_id = ?').get(userId, activeSession.class_id);
            if (!isEnrolled) {
                return res.status(403).json({ error: 'You are not enrolled in this class session' });
            }
        }

        // Duplicate check
        if (attendanceService.checkDuplicate(userId, sessionId, sessionMode)) {
            const user = db.prepare('SELECT name, matric_no FROM users WHERE id = ?').get(userId);
            return res.status(200).json({ success: true, duplicate: true, user, message: 'Already marked for this session' });
        }

        // We can save the scanned image if we want audit trails.
        // For now, pass 'null' or a placeholder if we don't save the file to disk.
        // current DB schema has 'image' column (TEXT?). 
        // We will skip saving the actual image blob to DB to save space, unless required.
        const entryId = attendanceService.logAttendance(userId, sessionId, sessionMode, null);

        // Fetch user details to return
        const user = db.prepare('SELECT name, matric_no FROM users WHERE id = ?').get(userId);

        res.json({ success: true, entryId, session: activeSession, user });
    } catch (err) {
        console.error("Attendance error:", err);
        res.status(500).json({ error: err.message });
    }
});

// Get attendance logs
router.get('/', auth, (req, res) => {
    try {
        const { search, sessionId } = req.query;
        const logs = attendanceService.getAttendanceLogs(search, sessionId);
        res.json(logs);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.delete('/bulk', auth, (req, res) => {
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

router.delete('/:id', auth, (req, res) => {
    try {
        attendanceService.deleteAttendance(req.params.id);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Export Matrix Excel
router.get('/export-matrix', auth, (req, res) => {
    try {
        const { sessionName, classId } = req.query;

        if (classId) {
            const result = attendanceService.getAttendanceMatrix(classId);
            const { sessions, data } = result;

            if (sessions.length === 0) return res.status(404).json({ error: 'No sessions found for this class' });

            const headers = ['Matric No', 'Name'];
            sessions.forEach(s => headers.push(`${s.name} (${s.date})`));

            const excelRows = data.map(row => {
                const r = {
                    'Matric No': row.matric_no || 'N/A',
                    'Name': row.name
                };
                sessions.forEach(s => {
                    r[`${s.name} (${s.date})`] = row.attendance[s.id];
                });
                return r;
            });

            const wb = xlsx.utils.book_new();
            const ws = xlsx.utils.json_to_sheet(excelRows);
            xlsx.utils.book_append_sheet(wb, ws, 'Attendance Matrix');

            const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
            res.setHeader('Content-Disposition', `attachment; filename="class_matrix_${classId}.xlsx"`);
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.send(buffer);
            return;
        }

        if (!sessionName) return res.status(400).json({ error: 'sessionName or classId is required' });

        const users = userService.getAllUsers();
        const sessions = db.prepare('SELECT id, date(start_time) as date FROM sessions WHERE name = ? ORDER BY start_time ASC').all(sessionName);

        if (sessions.length === 0) return res.status(404).json({ error: 'No sessions found with this name' });

        const dates = [...new Set(sessions.map(s => s.date))];
        const sessionIdsByDate = {};
        dates.forEach(d => {
            sessionIdsByDate[d] = sessions.filter(s => s.date === d).map(s => s.id);
        });

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
