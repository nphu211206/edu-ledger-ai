// File: server/index.js
// PHIÊN BẢN TỐI THƯỢNG - ĐÃ SỬA LỖI PathError

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { poolPromise } = require('./config/db');

// --- Import các nhánh route ---
// (Giữ nguyên các import routes)
const authRoutes = require('./routes/auth.routes');
const publicApiRoutes = require('./routes/publicApi.routes');
const userApiRoutes = require('./routes/user.routes');
const profileRoutes = require('./routes/profile.routes');
const jobsApiRoutes = require('./routes/jobs.routes');
const companyManagementRoutes = require('./routes/company.management.routes');
const applicationsRoutes = require('./routes/applications.routes');
const app = express();
const PORT = process.env.PORT || 3800;

// --- Cấu hình CORS (Rất quan trọng - Đặt trước mọi thứ khác) ---
const allowedOrigins = ['http://localhost:3001']; // Chỉ client này được phép
const corsOptions = {
    origin: function (origin, callback) {
        // Cho phép các request không có origin (VD: Postman, mobile apps) hoặc từ các origin trong danh sách
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            console.log(`CORS allowed origin: ${origin || 'N/A'}`); // Log origin được chấp nhận
            callback(null, true);
        } else {
            console.error(`CORS blocked origin: ${origin}`); // Log origin bị chặn
            callback(new Error(`Origin '${origin}' not allowed by CORS`)); // Thông báo lỗi rõ ràng hơn
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'], // Cho phép các method cần thiết (thêm PATCH)
    allowedHeaders: ['Content-Type', 'Authorization'], // Các header được phép
    credentials: true, // Quan trọng nếu frontend cần gửi cookie hoặc Authorization header
    optionsSuccessStatus: 204 // Trả về 204 No Content cho preflight requests thành công
};

// *** ÁP DỤNG CORS MIDDLEWARE CHO TẤT CẢ CÁC REQUEST ***
// Nó sẽ tự động xử lý OPTIONS (preflight) requests.
app.use(cors(corsOptions));

// --- Middleware Cơ bản ---
app.use(express.json({ limit: '1mb' })); // Middleware để parse JSON body, giới hạn kích thước payload
app.use(express.urlencoded({ extended: true, limit: '1mb' })); // Middleware để parse URL-encoded body

// --- Middleware Logging Request (Tùy chọn nhưng hữu ích) ---
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
    next();
});
app.get('/', (req, res) => {
    res.status(200).json({
        message: '🚀 EduLedger AI API is soaring!',
        status: 'OK',
        timestamp: new Date().toISOString(),
        documentation: '/api-docs' // Gợi ý: Sau này có thể thêm trang tài liệu API
    });
});

// --- Gắn các Nhánh Route Chính ---
// Thứ tự gắn route có thể quan trọng nếu có path trùng lặp (nhưng các prefix đã khác nhau)
app.use('/auth', authRoutes);                   // Prefix: /auth/...
app.use('/api/public', publicApiRoutes);        // Prefix: /api/public/...
app.use('/api/user', userApiRoutes);            // Prefix: /api/user/... (Protected)
app.use('/api/profile', profileRoutes);         // Prefix: /api/profile/... (Protected)
app.use('/api/jobs', jobsApiRoutes);            // Prefix: /api/jobs/... (POST protected)
app.use('/api/company-management', companyManagementRoutes); // Prefix: /api/company-management/... (Protected)
app.use('/api/applications', applicationsRoutes); // Gắn route mới
// --- Xử lý Route không khớp (404 Not Found) ---
// Đặt sau tất cả các route hợp lệ
app.use((req, res, next) => {
    res.status(404).json({ message: `Endpoint not found: ${req.method} ${req.originalUrl}` });
});

// --- Middleware Xử lý Lỗi Cuối cùng (Error Handler) ---
// Phải có 4 tham số (err, req, res, next) để Express nhận diện là Error Handler
app.use((err, req, res, next) => {
    console.error("❌ Unhandled Application Error:", err.stack || err);

    // Xử lý lỗi CORS đặc biệt nếu middleware cors() ném lỗi
    if (err.message.includes('not allowed by CORS')) {
        return res.status(403).json({ message: err.message || 'Access denied by CORS policy.' });
    }

    // Các lỗi khác trả về 500 Internal Server Error
    res.status(err.status || 500).json({
        message: err.message || 'Internal Server Error',
        // Chỉ gửi stack trace trong môi trường development
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});

// --- Khởi động Server ---
const startServer = async () => {
    try {
        console.log("Attempting to connect to database...");
        await poolPromise; // Đảm bảo kết nối CSDL thành công
        console.log("Database connection successful.");

        app.listen(PORT, '0.0.0.0', () => { // Lắng nghe trên mọi IP address của máy chủ
            console.log(`🚀 EduLedger AI Server (Tối Thượng - Fixed) взлетел и готов к бою на http://localhost:${PORT}`);
            console.log(`✅ Разрешенные источники CORS: ${allowedOrigins.join(', ')}`);
            console.log(`Node.js version: ${process.version}`);
            console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
        });
    } catch (error) {
        console.error('❌ CRITICAL SERVER STARTUP FAILED.', error);
        process.exit(1); // Thoát ứng dụng nếu không thể khởi động
    }
};

startServer(); // Gọi hàm khởi động

console.log("✅ server/index.js (Tối Thượng - Fixed) loaded.");