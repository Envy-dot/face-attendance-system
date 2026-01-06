const express = require('express');
const router = express.Router();
const sessionService = require('../services/sessionService');

router.post('/', (req, res) => {
    const { name, type, action, id } = req.body;
    try {
        if (action === 'create') {
            const session = sessionService.createSession(name, type || 'in');
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

router.get('/history', (req, res) => {
    try {
        const sessions = sessionService.getSessionHistory();
        res.json(sessions);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.delete('/:id', (req, res) => {
    try {
        sessionService.deleteSession(req.params.id);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put('/:id/type', (req, res) => {
    try {
        const newType = sessionService.toggleSessionType(req.params.id);
        res.json({ success: true, newType });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/:id/stats', (req, res) => {
    try {
        const stats = sessionService.getSessionStats(req.params.id);
        res.json(stats);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
