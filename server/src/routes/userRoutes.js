const express = require('express');
const router = express.Router();
const userService = require('../services/userService');
const validate = require('../middleware/validate');
const { registerSchema } = require('../validations/userSchema');

// Register a new user
router.post('/register', validate(registerSchema), (req, res) => {
    const { name, matric_no, level, department, course, photo, descriptor, section } = req.body;

    try {
        const userId = userService.registerUser({
            name,
            matric_no,
            level,
            department,
            course,
            photo,
            descriptor: JSON.stringify(descriptor),
            section
        });
        res.json({ success: true, userId });
    } catch (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
            return res.status(409).json({ error: 'User already exists' });
        }
        res.status(500).json({ error: err.message });
    }
});

// Get all users
router.get('/', (req, res) => {
    try {
        const { search, sort } = req.query;
        const users = userService.getAllUsers(search, sort);
        const usersWithDescriptors = users.map(u => ({
            ...u,
            descriptor: JSON.parse(u.descriptor)
        }));
        res.json(usersWithDescriptors);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete user
router.delete('/:id', (req, res) => {
    try {
        userService.deleteUser(req.params.id);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
