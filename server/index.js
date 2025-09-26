// /server/index.js
// PHIÊN BẢN HOÀN THIỆN CUỐI CÙNG - SỬA LỖI CORS DỨT ĐIỂM

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { poolPromise } = require('./config/db');

// Import các router
const authRoutes = require('./routes/auth.routes');
const apiRoutes = require('./routes/api.routes');

const app = express();

// =================================================================
// ĐÂY LÀ PHẦN QUAN TRỌNG NHẤT - CHIẾC CHÌA KHÓA SỬA LỖI
// Cấu hình CORS một cách chuyên nghiệp và an toàn
const corsOptions = {
    origin: 'http://localhost:3001', // Chỉ cho phép client này được truy cập
    methods: ['GET', 'POST', 'PUT', 'DELETE'], // Các phương thức được phép
    allowedHeaders: ['Content-Type', 'Authorization'], // Cho phép trình duyệt gửi kèm header Authorization
};

app.use(cors(corsOptions));
// =================================================================

app.use(express.json());

// Kết nối các Router
app.use('/auth', authRoutes);
app.use('/api', apiRoutes);

const PORT = process.env.PORT || 3000;

const startServer = async () => {
    try {
        await poolPromise; 
        app.listen(PORT, '0.0.0.0', () => {
            console.log(`🚀 Máy chủ EduLedger AI đã cất cánh tại http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('KHÔNG THỂ KHỞI ĐỘNG SERVER.', error);
        process.exit(1);
    }
};

startServer();