// File: server/index.js
// PHIÊN BẢN v3.1 - "HOÀN HẢO" - Đã đặt dotenv ở đầu

require('dotenv').config(); // <-- Dòng này phải ở đầu tiên

const express = require('express');
const cors = require('cors');
const { poolPromise } = require('./config/db.js');

// --- Import các nhánh route ---
const authRoutes = require('./routes/auth.routes');
const publicApiRoutes = require('./routes/publicApi.routes');
const userApiRoutes = require('./routes/user.routes');
const profileRoutes = require('./routes/profile.routes');
const jobsApiRoutes = require('./routes/jobs.routes');
const companyManagementRoutes = require('./routes/company.management.routes');
const applicationsRoutes = require('./routes/applications.routes');
const interviewRoutes = require('./routes/interview.routes.js'); 

const app = express();
const PORT = process.env.PORT || 3800;

// --- Cấu hình CORS và Middleware ---
const allowedOrigins = ['http://localhost:3001'];
const corsOptions = {
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error(`Origin '${origin}' not allowed by CORS`)); 
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    optionsSuccessStatus: 204
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Logger
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
    next();
});

// Route cơ bản
app.get('/', (req, res) => {
    res.status(200).json({
        message: '🚀 EduLedger AI API is soaring! (v3.1 Separated Routes)',
        status: 'OK',
        timestamp: new Date().toISOString(),
    });
});

// --- Gắn các Nhánh Route Chính ---
app.use('/auth', authRoutes);
app.use('/api/public', publicApiRoutes);
app.use('/api/user', userApiRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/jobs', jobsApiRoutes);
app.use('/api/company-management', companyManagementRoutes);
app.use('/api/applications', applicationsRoutes);
app.use('/api/interviews', interviewRoutes);

// --- Xử lý 404 và Error Handler ---
app.use((req, res, next) => {
    res.status(404).json({ message: `Endpoint not found: ${req.method} ${req.originalUrl}` });
});

app.use((err, req, res, next) => {
    console.error("❌ Unhandled Application Error:", err.stack || err);
    if (err.message.includes('not allowed by CORS')) {
        return res.status(403).json({ message: err.message || 'Access denied by CORS policy.' });
    }
    res.status(err.status || 500).json({
        message: err.message || 'Internal Server Error',
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});

// --- Khởi động Server ---
const startServer = async () => {
    try {
        await poolPromise; 
        console.log("Database connection successful.");
        app.listen(PORT, '0.0.0.0', () => { 
            console.log(`🚀 EduLedger AI Server (Tối Thượng v3.1) взлетел и готов к бою на http://localhost:${PORT}`);
            console.log(`✅ Разрешенные источники CORS: ${allowedOrigins.join(', ')}`);
        });
    } catch (error) {
        console.error('❌ CRITICAL SERVER STARTUP FAILED.', error);
        process.exit(1); 
    }
};

startServer();

console.log("✅ server/index.js (Tối Thượng v3.1 - Interview Routes v3.1) loaded.");