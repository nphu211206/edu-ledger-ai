// File: server/index.js
// PHIÊN BẢN HOÀN THIỆN - ĐÃ CHỈNH SỬA VÀ THỐNG NHẤT

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { poolPromise } = require('./config/db');

// Thống nhất cú pháp require cho tất cả các routes
const authRoutes = require('./routes/auth.routes');
const apiRoutes = require('./routes/api.routes');
const jobRoutes = require('./routes/jobs.routes');

const app = express();

// Thống nhất cổng server là 3800, client là 3001
const allowedOrigins = ['http://localhost:3001']; 
const corsOptions = {
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
app.use(express.json());

// Thống nhất cấu trúc API endpoint
app.use('/auth', authRoutes);
app.use('/api', apiRoutes);
app.use('/api/jobs', jobRoutes); // Endpoint cho việc làm

const PORT = process.env.PORT || 3800; // Đảm bảo server chạy đúng cổng trong .env

const startServer = async () => {
    try {
        await poolPromise; 
        app.listen(PORT, '0.0.0.0', () => {
            console.log(`🚀 Máy chủ EduLedger AI đã cất cánh tại http://localhost:${PORT}`);
            console.log(`✅ Client được phép kết nối từ: ${allowedOrigins.join(', ')}`);
        });
    } catch (error) {
        console.error('❌ KHÔNG THỂ KHỞI ĐỘNG SERVER.', error);
        process.exit(1);
    }
};

startServer();