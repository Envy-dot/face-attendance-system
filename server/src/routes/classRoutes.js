const express = require('express');
const router = express.Router();
const classService = require('../services/classService');
const auth = require('../middleware/auth');

router.get('/', (req, res) => {
    try {
        const classes = classService.getAllClasses();
        res.json(classes);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/', auth, (req, res) => {
    try {
        const { name, code, department } = req.body;
        if (!name || !code) return res.status(400).json({ error: 'Name and Code are required' });
        const newClass = classService.createClass(name, code, department);
        res.json(newClass);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

router.delete('/:id', auth, (req, res) => {
    try {
        classService.deleteClass(req.params.id);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
