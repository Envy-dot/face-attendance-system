require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const userRoutes = require('./src/routes/userRoutes');
const attendanceRoutes = require('./src/routes/attendanceRoutes');
const sessionRoutes = require('./src/routes/sessionRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));

// Routes
app.use('/api/users', userRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/sessions', sessionRoutes);

// Optional: Global Export Route (if you want to keep it at /api/export)
// But it's now inside attendanceRoutes at /api/attendance/export
// I'll add a redirect or just update the frontend later.
app.get('/api/export', (req, res) => {
    res.redirect('/api/attendance/export');
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

