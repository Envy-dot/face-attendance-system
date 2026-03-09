const express = require('express');
const router = express.Router();
const sessionService = require('../services/sessionService');
const auth = require('../middleware/auth');

router.post('/', auth, (req, res) => {
    const { name, type, action, id, duration, class_id } = req.body;
    try {
        if (action === 'create') {
            const parsedClassId = class_id ? parseInt(class_id, 10) : null;
            const session = sessionService.createSession(name, type || 'in', duration || 0, parsedClassId);
            res.json(session);
        } else if (action === 'toggle') {
            sessionService.toggleSession(id, req.body.isActive);
            res.json({ success: true });
        } else {
            res.status(400).json({ error: 'Invalid action' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/active', (req, res) => {
    try {
        const session = sessionService.getActiveSession();
        res.json(session || null);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/history', auth, (req, res) => {
    try {
        const sessions = sessionService.getSessionHistory();
        res.json(sessions);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.delete('/:id', auth, (req, res) => {
    try {
        sessionService.deleteSession(req.params.id);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put('/:id/type', auth, (req, res) => {
    try {
        const newType = sessionService.toggleSessionType(req.params.id);
        res.json({ success: true, newType });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/:id/stats', auth, (req, res) => {
    try {
        const stats = sessionService.getSessionStats(req.params.id);
        res.json(stats);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
