const db = require('../config/database');

const registerUser = (user) => {
    const { name, matric_no, level, department, course, photo, descriptor, section, classIds } = user;

    // Check if user already exists by matric_no
    const existingUser = db.prepare('SELECT id, descriptor FROM users WHERE matric_no = ?').get(matric_no);

    let userId;
    if (existingUser) {
        let descriptors = [];
        try {
            const parsed = JSON.parse(existingUser.descriptor);
            // Support both old format (array) and new format (array of arrays)
            descriptors = Array.isArray(parsed[0]) ? parsed : [parsed];
        } catch (e) {
            descriptors = [];
        }

        // Append new descriptors
        if (Array.isArray(descriptor) && Array.isArray(descriptor[0])) {
            // It's an array of embeddings
            descriptors.push(...descriptor);
        } else {
            // It's a single embedding
            descriptors.push(descriptor);
        }

        // Keep only last 5 descriptors to prevent bloat but maintain accuracy
        if (descriptors.length > 5) descriptors.shift();

        const stmt = db.prepare('UPDATE users SET name = ?, level = ?, department = ?, course = ?, photo = ?, descriptor = ?, section = ?, is_active = 1 WHERE id = ?');
        stmt.run(name, level, department, course, photo, JSON.stringify(descriptors), section, existingUser.id);
        userId = existingUser.id;
    } else {
        // New user: store as array of arrays. 
        // If descriptor is already an array of arrays (from multi-upload), use it.
        // If it's a single descriptor array, wrap it.
        const initialDescriptors = (Array.isArray(descriptor) && Array.isArray(descriptor[0])) ? descriptor : [descriptor];

        const stmt = db.prepare('INSERT INTO users (name, matric_no, level, department, course, photo, descriptor, section) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
        const info = stmt.run(name, matric_no, level, department, course, photo, JSON.stringify(initialDescriptors), section);
        userId = info.lastInsertRowid;
    }

    // Handle Class Enrollment
    if (classIds && Array.isArray(classIds)) {
        const insertClass = db.prepare('INSERT OR IGNORE INTO enrollments (user_id, class_id) VALUES (?, ?)');
        classIds.forEach(cId => {
            try {
                insertClass.run(userId, cId);
            } catch (e) { /* ignore */ }
        });
    }

    return { userId, created: !existingUser };
};

const getAllUsers = (search, sort, page = 1, limit = 10) => {
    let query = `
        SELECT u.id, u.name, u.matric_no, u.level, u.department, u.course, u.photo, u.descriptor, u.section, u.is_active,
        strftime('%Y-%m-%dT%H:%M:%SZ', u.created_at) as created_at,
        GROUP_CONCAT(c.code, ', ') as enrolled_classes
        FROM users u
        LEFT JOIN enrollments e ON u.id = e.user_id
        LEFT JOIN classes c ON e.class_id = c.id
        WHERE u.is_active = 1
    `;
    let countQuery = `SELECT COUNT(DISTINCT u.id) as total FROM users u WHERE u.is_active = 1`;
    const params = [];

    if (search) {
        const searchClause = ' AND (u.name LIKE ? OR u.matric_no LIKE ?)';
        query += searchClause;
        countQuery += searchClause;
        params.push(`%${search}%`, `%${search}%`);
    }

    query += ' GROUP BY u.id';

    if (sort === 'matric') {
        query += ' ORDER BY u.matric_no ASC';
    } else if (sort === 'name') {
        query += ' ORDER BY u.name ASC';
    } else {
        query += ' ORDER BY u.created_at DESC';
    }

    // Pagination
    const offset = (page - 1) * limit;
    query += ` LIMIT ? OFFSET ?`;

    const dataParams = [...params, limit, offset];

    const stmt = db.prepare(query);
    const data = stmt.all(...dataParams);

    const countStmt = db.prepare(countQuery);
    const totalResult = countStmt.get(...params);

    return {
        data,
        total: totalResult ? totalResult.total : 0
    };
};


const deleteUser = (id) => {
    // Perform Soft Delete
    const stmt = db.prepare('UPDATE users SET is_active = 0 WHERE id = ?');
    return stmt.run(id);
};

module.exports = {
    registerUser,
    getAllUsers,
    deleteUser
};

