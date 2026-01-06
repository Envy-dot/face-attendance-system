const db = require('../config/database');

const registerUser = (user) => {
    const { name, matric_no, level, department, course, photo, descriptor, section } = user;
    const stmt = db.prepare('INSERT INTO users (name, matric_no, level, department, course, photo, descriptor, section) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
    const info = stmt.run(name, matric_no, level, department, course, photo, descriptor, section);
    return info.lastInsertRowid;
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
