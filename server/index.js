

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { poolPromise } = require('./config/db');

// Import các "nhánh" route theo từng tài nguyên
const authRoutes = require('./routes/auth.routes');
const publicApiRoutes = require('./routes/public.routes'); // <-- "NHÀ" MỚI CHO API CÔNG KHAI
const userApiRoutes = require('./routes/user.routes');
const app = express();

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


app.use('/auth', authRoutes);                   
app.use('/api/jobs', jobsRoutes);
app.use('/api/companies', companiesRoutes);
app.use('/api/profile', profileRoutes); // Mọi request /api/profile/* sẽ do file này xử lý
app.use('/api', miscApiRoutes);  // Các API còn lại (public stats, user-specific...)

const PORT = process.env.PORT || 3800;

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