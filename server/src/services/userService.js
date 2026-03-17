const pool = require('../config/database');
const cloudinary = require('../config/cloudinary');

const registerUser = async (user) => {
    let { name, matric_no, level, department, course, photo, descriptor, section, classIds } = user;

    // Handle Cloudinary Upload for Base64 photo
    if (photo && photo.startsWith('data:image')) {
        try {
            const uploadResponse = await cloudinary.uploader.upload(photo, {
                folder: 'student_faces',
                resource_type: 'image'
            });
            photo = uploadResponse.secure_url;
        } catch (err) {
            console.error("Cloudinary upload failed in service:", err);
            throw new Error(`Failed to upload student image: ${err.message}`);
        }
    }

    // Check if user already exists by matric_no
    const { rows: existingUsers } = await pool.query('SELECT id, descriptor FROM users WHERE matric_no = $1', [matric_no]);
    const existingUser = existingUsers[0];

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

        await pool.query(
            'UPDATE users SET name = $1, level = $2, department = $3, course = $4, photo = $5, descriptor = $6, section = $7, is_active = 1 WHERE id = $8',
            [name, level, department, course, photo, JSON.stringify(descriptors), section, existingUser.id]
        );
        userId = existingUser.id;
    } else {
        // New user: store as array of arrays. 
        // If descriptor is already an array of arrays (from multi-upload), use it.
        // If it's a single descriptor array, wrap it.
        const initialDescriptors = (Array.isArray(descriptor) && Array.isArray(descriptor[0])) ? descriptor : [descriptor];

        const { rows } = await pool.query(
            'INSERT INTO users (name, matric_no, level, department, course, photo, descriptor, section) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id',
            [name, matric_no, level, department, course, photo, JSON.stringify(initialDescriptors), section]
        );
        userId = rows[0].id;
    }

    // Handle Class Enrollment
    if (classIds && Array.isArray(classIds)) {
        for (const cId of classIds) {
            try {
                await pool.query('INSERT INTO enrollments (user_id, class_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [userId, cId]);
            } catch (e) { /* ignore */ }
        }
    }

    return { userId, created: !existingUser };
};

const getAllUsers = async (search, sort, page = 1, limit = 10) => {
    let query = `
        SELECT u.id, u.name, u.matric_no, u.level, u.department, u.course, u.photo, u.descriptor, u.section, u.is_active,
        to_char(u.created_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as created_at,
        STRING_AGG(c.code, ', ') as enrolled_classes
        FROM users u
        LEFT JOIN enrollments e ON u.id = e.user_id
        LEFT JOIN classes c ON e.class_id = c.id
        WHERE u.is_active = 1
    `;
    let countQuery = `SELECT COUNT(DISTINCT u.id) as total FROM users u WHERE u.is_active = 1`;
    const params = [];
    let paramIndex = 1;

    if (search) {
        const searchClause = ` AND (u.name ILIKE $${paramIndex} OR u.matric_no ILIKE $${paramIndex + 1})`;
        query += searchClause;
        countQuery += searchClause;
        params.push(`%${search}%`, `%${search}%`);
        paramIndex += 2;
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
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    
    const dataParams = [...params, limit, offset];

    const { rows: data } = await pool.query(query, dataParams);
    const { rows: countResult } = await pool.query(countQuery, params);

    return {
        data,
        total: countResult.length > 0 ? parseInt(countResult[0].total, 10) : 0
    };
};

const deleteUser = async (id) => {
    // Perform Soft Delete
    await pool.query('UPDATE users SET is_active = 0 WHERE id = $1', [id]);
};

module.exports = {
    registerUser,
    getAllUsers,
    deleteUser
};
