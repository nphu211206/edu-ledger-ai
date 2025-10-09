// /server/index.js
// PHIÊN BẢN ĐÃ ĐƯỢC TÁI CẤU TRÚC VÀ SỬA LỖI

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { poolPromise } = require('./config/db');

// --- SỬA 1: THỐNG NHẤT CÚ PHÁP REQUIRE VÀ ĐÚNG ĐƯỜNG DẪN ---
const authRoutes = require('./routes/auth.routes');
const apiRoutes = require('./routes/api.routes');
const jobRoutes = require('./routes/jobs.routes'); // Sửa lại đường dẫn và bỏ dòng import thừa

const app = express();

// --- SỬA 2: CẤU HÌNH CORS LINH HOẠT HƠN CHO MÔI TRƯỜNG DEV ---
// Cho phép cả port 3001 (nếu bạn tự cấu hình) và 5173 (mặc định của Vite)
const allowedOrigins = ['http://localhost:3001', 'http://localhost:5173']; 
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

// --- SỬA 3: XÓA ROUTE TRÙNG LẶP, GIỮ LẠI ĐÚNG CHUẨN /api ---
app.use('/auth', authRoutes); // Giữ nguyên endpoint này cho auth
app.use('/api', apiRoutes);   // Giữ nguyên cho các api khác
app.use('/api/jobs', jobRoutes); // Chỉ sử dụng endpoint này cho jobs

const PORT = process.env.PORT || 3000;

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