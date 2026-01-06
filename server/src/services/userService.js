const db = require('../config/database');

const registerUser = (user) => {
    const { name, matric_no, level, department, course, photo, descriptor, section } = user;

    // Check if user already exists by matric_no
    const existingUser = db.prepare('SELECT id, descriptor FROM users WHERE matric_no = ?').get(matric_no);

    if (existingUser) {
        let descriptors = [];
        try {
            const parsed = JSON.parse(existingUser.descriptor);
            // Support both old format (array) and new format (array of arrays)
            descriptors = Array.isArray(parsed[0]) ? parsed : [parsed];
        } catch (e) {
            descriptors = [];
        }

        // Append new descriptor if it's not already a duplicate (basic check)
        descriptors.push(descriptor);

        // Keep only last 5 descriptors to prevent bloat but maintain accuracy
        if (descriptors.length > 5) descriptors.shift();

        const stmt = db.prepare('UPDATE users SET name = ?, level = ?, department = ?, course = ?, photo = ?, descriptor = ?, section = ? WHERE id = ?');
        stmt.run(name, level, department, course, photo, JSON.stringify(descriptors), section, existingUser.id);
        return { userId: existingUser.id, created: false };
    } else {
        // New user: store as array of arrays [[descriptor]]
        const stmt = db.prepare('INSERT INTO users (name, matric_no, level, department, course, photo, descriptor, section) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
        const info = stmt.run(name, matric_no, level, department, course, photo, JSON.stringify([descriptor]), section);
        return { userId: info.lastInsertRowid, created: true };
    }
};

const getAllUsers = (search, sort) => {
    let query = "SELECT id, name, matric_no, level, department, course, photo, descriptor, section, strftime('%Y-%m-%dT%H:%M:%SZ', created_at) as created_at FROM users";
    const params = [];

    if (search) {
        query += ' WHERE name LIKE ? OR matric_no LIKE ?';
        params.push(`%${search}%`, `%${search}%`);
    }

    if (sort === 'matric') {
        query += ' ORDER BY matric_no ASC';
    } else {
        query += ' ORDER BY name ASC';
    }

    const stmt = db.prepare(query);
    return stmt.all(...params);
};

const deleteUser = (id) => {
    // Delete attendance first to satisfy foreign key constraints (or logical cleanup)
    db.prepare('DELETE FROM attendance WHERE user_id = ?').run(id);
    const stmt = db.prepare('DELETE FROM users WHERE id = ?');
    return stmt.run(id);
};

module.exports = {
    registerUser,
    getAllUsers,
    deleteUser
};
