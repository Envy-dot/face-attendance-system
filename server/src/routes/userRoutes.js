const express = require('express');
const router = express.Router();
const userService = require('../services/userService');
const validate = require('../middleware/validate');
const { registerSchema } = require('../validations/userSchema');
const multer = require('multer');
const faceService = require('../services/faceService');
const fs = require('fs');
const path = require('path');
const auth = require('../middleware/auth');

// Configure Multer (Memory Storage)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Middleware to parse JSON fields from FormData
const parseFormData = (req, res, next) => {
    if (req.body.classIds && typeof req.body.classIds === 'string') {
        try {
            req.body.classIds = JSON.parse(req.body.classIds);
        } catch (e) {
            req.body.classIds = [];
        }
    }
    next();
};

// Register a new user
router.post('/register', upload.any(), parseFormData, validate(registerSchema), async (req, res) => {
    console.log(`[UserRoute] Headers:`, req.headers['content-type']);
    console.log(`[UserRoute] Body Keys:`, Object.keys(req.body));
    console.log(`[UserRoute] Files:`, req.files ? req.files.map(f => `${f.fieldname} (${f.mimetype})`) : 'none');

    // Collect all uploaded images regardless of field name
    const images = req.files ? req.files.filter(f => f.mimetype.startsWith('image/')) : [];
    console.log(`[UserRoute] Found ${images.length} candidate images.`);

    // req.body contains text fields
    const { name, matric_no, level, department, course, section, classIds, faceLandmarks } = req.body;
    let { photo } = req.body;

    let descriptor = null;
    if (faceLandmarks) {
        try {
            descriptor = typeof faceLandmarks === 'string' ? JSON.parse(faceLandmarks) : faceLandmarks;
        } catch (error) {
            return res.status(400).json({ success: false, error: 'Invalid faceLandmarks' });
        }
    }

    if (images.length > 0) {
        if (!photo) photo = "server_processed_image";
    }

    // fallback if no image/descriptor
    if (!descriptor && !photo) {
        return res.status(400).json({ success: false, error: 'Biometric data required' });
    }

    // Handle incoming base64 photo for filesystem saving
    if (photo && photo.startsWith('data:image')) {
        try {
            // Remove header (e.g., data:image/jpeg;base64,)
            const base64Data = photo.replace(/^data:image\/\w+;base64,/, "");
            const uploadDir = path.join(__dirname, '../../uploads');

            // Create uploads directory if it doesn't exist just in case
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }

            const safeMatric = matric_no ? matric_no.replace(/\//g, '-') : 'unknown';
            const fileName = `user_${safeMatric}_${Date.now()}.jpg`;
            const filePath = path.join(uploadDir, fileName);

            // Write the file
            fs.writeFileSync(filePath, base64Data, { encoding: 'base64' });

            // Set the database reference to the relative static URL
            photo = `/uploads/${fileName}`;
        } catch (err) {
            console.error("WRITE DISK ERROR DETAILS:", err);
            return res.status(500).json({ success: false, error: `Failed to save student image: ${err.message}` });
        }
    }

    try {
        const result = userService.registerUser({
            name, matric_no, level, department, course,
            descriptor,
            section,
            classIds: classIds ? (Array.isArray(classIds) ? classIds : JSON.parse(classIds)) : []
        });
        res.json({ success: true, userId: result.userId, created: result.created });
    } catch (err) {
        console.error("Registration error:", err);
        if (err.message.includes('UNIQUE constraint failed')) {
            return res.status(409).json({ error: 'User already exists' });
        }
        res.status(500).json({ error: err.message });
    }
});

// Get all users (Paginated)
router.get('/', auth, (req, res) => {
    try {
        const { search, sort, page, limit } = req.query;
        const pageNum = parseInt(page) || 1;
        const limitNum = parseInt(limit) || 10;

        const result = userService.getAllUsers(search, sort, pageNum, limitNum);

        const usersWithDescriptors = result.data.map(u => ({
            ...u,
            descriptor: JSON.parse(u.descriptor)
        }));

        res.json({
            users: usersWithDescriptors,
            total: result.total,
            page: pageNum,
            limit: limitNum,
            totalPages: Math.ceil(result.total / limitNum)
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete user
router.delete('/:id', auth, (req, res) => {
    try {
        userService.deleteUser(req.params.id);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
