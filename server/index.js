// File: server/index.js
// HÃY THAY THẾ TOÀN BỘ NỘI DUNG FILE NÀY

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { poolPromise } = require('./config/db');

// --- Import các nhánh route ---
const authRoutes = require('./routes/auth.routes');
const publicApiRoutes = require('./routes/publicApi.routes'); // Đổi tên file để rõ ràng hơn
const userApiRoutes = require('./routes/user.routes');
const profileRoutes = require('./routes/profile.routes');
const jobsRoutes = require('./routes/jobs.routes'); // Đảm bảo bạn đã import file này
const companiesRoutes = require('./routes/companies.routes'); // Đảm bảo bạn đã import file này

const app = express();

// --- Cấu hình CORS ---
const allowedOrigins = ['http://localhost:3001']; // Chỉ cho phép client ở port 3001
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
app.use(express.json()); // Middleware để parse JSON body

// --- Gắn các nhánh route vào ứng dụng ---
// Các route không cần xác thực token sẽ được gom vào /api/public
app.use('/auth', authRoutes);                   // Prefix: /auth/... (GitHub, Recruiter Login/Register)
app.use('/api/public', publicApiRoutes);        // Prefix: /api/public/... (Stats, Trending Skills, Public Jobs, Public Companies)

// Các route cần xác thực token sẽ nằm dưới các prefix riêng
app.use('/api/user', userApiRoutes);            // Prefix: /api/user/... (Me, Repos, Skills, Analyze, Applications, Recruiter Search/Stats/Jobs, Applicants)
app.use('/api/profile', profileRoutes);         // Prefix: /api/profile/... (Experience, Education - Đã có authenticateToken bên trong)
app.use('/api/jobs', jobsRoutes);               // Prefix: /api/jobs/... (POST /api/jobs, POST /api/jobs/:jobId/apply - Đã có authenticateToken bên trong cho POST)
app.use('/api/companies', companiesRoutes);     // Prefix: /api/companies/... (GET all, GET by slug - Public)

// --- Middleware xử lý lỗi chung (Tùy chọn nhưng nên có) ---
app.use((err, req, res, next) => {
    console.error("Unhandled error:", err.stack || err);
    res.status(500).json({ message: 'Internal Server Error' });
});

// --- Khởi động Server ---
const PORT = process.env.PORT || 3800;

const startServer = async () => {
    try {
        await poolPromise; // Đảm bảo kết nối CSDL thành công trước khi lắng nghe
        app.listen(PORT, '0.0.0.0', () => { // Lắng nghe trên tất cả các interface mạng
            console.log(`🚀 Máy chủ EduLedger AI đã cất cánh tại http://localhost:${PORT}`);
            console.log(`✅ Client được phép kết nối từ: ${allowedOrigins.join(', ')}`);
        });
    } catch (error) {
        console.error('❌ KHÔNG THỂ KHỞI ĐỘNG SERVER.', error);
        process.exit(1); // Thoát nếu không thể kết nối CSDL hoặc khởi động server
    }
};

startServer();