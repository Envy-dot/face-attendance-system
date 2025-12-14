const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const db = require('./db');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json({ limit: '10mb' })); // Allow large payloads for base64 images/descriptors

const xlsx = require('xlsx');

// Register a new user with face descriptor
app.post('/api/register', (req, res) => {
    const { name, matric_no, level, department, course, photo, descriptor, section } = req.body;
    if (!name || !descriptor || !matric_no) { // Matric No is now required
        return res.status(400).json({ error: 'Name, Matric No, and descriptor are required' });
    }

    try {
        const userId = db.registerUser({ name, matric_no, level, department, course, photo, descriptor: JSON.stringify(descriptor), section });
        res.json({ success: true, userId });
    } catch (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
            return res.status(409).json({ error: 'User already exists' });
        }
        res.status(500).json({ error: err.message });
    }
});

// Load all users (for face matching on client) - Support search & sort
app.get('/api/users', (req, res) => {
    try {
        const { search, sort } = req.query;
        const users = db.getAllUsers(search, sort);
        // Parse descriptors back to arrays
        const usersWithDescriptors = users.map(u => ({
            ...u,
            descriptor: JSON.parse(u.descriptor)
        }));
        res.json(usersWithDescriptors);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/users/:id', (req, res) => {
    try {
        db.deleteUser(req.params.id);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// Sessions
app.post('/api/sessions', (req, res) => {
    const { name, type, action, id } = req.body;
    try {
        if (action === 'create') {
            const session = db.createSession(name, type || 'in');
            res.json(session);
        } else if (action === 'toggle') {
            db.toggleSession(id, req.body.isActive);
            res.json({ success: true });
        } else {
            res.status(400).json({ error: 'Invalid action' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/sessions/active', (req, res) => {
    try {
        const session = db.getActiveSession();
        res.json(session || null);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/sessions/history', (req, res) => {
    try {
        const sessions = db.getSessionHistory();
        res.json(sessions);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/sessions/:id', (req, res) => {
    try {
        db.deleteSession(req.params.id);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Log attendance
app.post('/api/attendance', (req, res) => {
    const { userId, type, image } = req.body;

    if (!userId) {
        return res.status(400).json({ error: 'UserId is required' });
    }

    try {
        const activeSession = db.getActiveSession();

        if (!activeSession) {
            return res.status(403).json({ error: 'No active session. Please wait for lecturer to start a session.' });
        }

        const sessionMode = activeSession.type;
        // Force the type to match the session type
        // The user request said "The sign in and sign out are all contained in a session"
        // And "Sign in and sign out should be toggled by the admin not the user"
        // So we strictly use the session's type.

        const sessionId = activeSession.id;

        // Duplicate check
        if (db.checkDuplicate(userId, sessionId, sessionMode)) {
            return res.status(409).json({ error: 'Already marked for this session' });
        }

        const entryId = db.logAttendance(userId, sessionId, sessionMode, image);
        res.json({ success: true, entryId, session: activeSession });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get attendance logs
app.get('/api/attendance', (req, res) => {
    try {
        const { search } = req.query;
        const logs = db.getAttendanceLogs(search);
        res.json(logs);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/attendance/bulk', (req, res) => {
    const { date } = req.body;
    try {
        if (date) {
            db.deleteAttendanceByDate(date);
            res.json({ success: true });
        } else {
            res.status(400).json({ error: 'Date is required' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/attendance/:id', (req, res) => {
    try {
        db.deleteAttendance(req.params.id);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/export', (req, res) => {
    try {
        const logs = db.getAttendanceLogs();

        // Group by Session + User to merge IN/OUT
        // Key: `${session_id}_${user_id}`
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
            // Format time
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

// V4: Session Type Toggle & Stats
app.put('/api/sessions/:id/type', (req, res) => {
    try {
        const newType = db.toggleSessionType(req.params.id);
        res.json({ success: true, newType });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/sessions/:id/stats', (req, res) => {
    try {
        const stats = db.getSessionStats(req.params.id);
        res.json(stats);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
