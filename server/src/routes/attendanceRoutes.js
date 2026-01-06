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

// Export Excel
router.get('/export', (req, res) => {
    try {
        const logs = attendanceService.getAttendanceLogs();

        const grouped = {};
        logs.forEach(log => {
            const key = `${log.session_name}_${log.matric_no}`;
            if (!grouped[key]) {
                grouped[key] = {
                    'Matric No': log.matric_no || 'N/A',
                    'Name': log.name,
                    'Department': log.department || 'N/A',
                    'Level': log.level || 'N/A',
                    'Course': log.course || 'N/A',
                    'Session': log.session_name || 'N/A',
                    'IN': '-',
                    'OUT': '-'
                };
            }
            const timeStr = new Date(log.timestamp).toLocaleString('en-GB', {
                timeZone: 'Africa/Lagos',
                hour: '2-digit', minute: '2-digit', second: '2-digit'
            });

            if (log.type === 'in') grouped[key]['IN'] = timeStr;
            if (log.type === 'out') grouped[key]['OUT'] = timeStr;
        });

        const data = Object.values(grouped);
        const wb = xlsx.utils.book_new();
        const ws = xlsx.utils.json_to_sheet(data);
        xlsx.utils.book_append_sheet(wb, ws, 'Attendance');

        const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
        res.setHeader('Content-Disposition', 'attachment; filename="attendance_grouped.xlsx"');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.send(buffer);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
