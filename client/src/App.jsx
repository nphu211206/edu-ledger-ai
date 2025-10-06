// /client/src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Layouts
import MainLayout from './layouts/MainLayout';

// Components
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import HomePage from './pages/HomePage';
import StudentLoginPage from './pages/StudentLoginPage';
import RecruiterRegisterPage from './pages/RecruiterRegisterPage';
import RecruiterLoginPage from './pages/RecruiterLoginPage';
import GitHubCallback from './pages/GitHubCallback';
import DashboardPage from './pages/DashboardPage';
import RecruiterDashboardPage from './pages/RecruiterDashboardPage';

// Component cho các trang lỗi hoặc chưa tạo
const NotFoundPage = () => <div className="text-center p-10"><h1>404 - Không tìm thấy trang</h1></div>;
const LoginErrorPage = () => <div className="text-center p-10"><h1>Đăng nhập thất bại. Vui lòng thử lại.</h1></div>;

function App() {
    return (
        <Router>
            <Routes>
                {/* --- CÁC ROUTE CÔNG KHAI (Không cần đăng nhập) --- */}
                <Route path="/" element={<HomePage />} />
                <Route path="/login" element={<StudentLoginPage />} />
                <Route path="/recruiter/register" element={<RecruiterRegisterPage />} />
                <Route path="/recruiter/login" element={<RecruiterLoginPage />} />
                <Route path="/auth/github/callback" element={<GitHubCallback />} />
                <Route path="/login-error" element={<LoginErrorPage />} />

                {/* --- CÁC ROUTE CẦN ĐĂNG NHẬP (Sẽ có Layout chung) --- */}
                <Route element={<MainLayout />}>
                    <Route element={<ProtectedRoute />}>
                        {/* Tất cả các Route đặt trong đây đều được bảo vệ và có Header */}
                        <Route path="/dashboard" element={<DashboardPage />} />
                        <Route path="/recruiter/dashboard" element={<RecruiterDashboardPage />} />
                        {/* Thêm các trang cần đăng nhập khác ở đây, ví dụ: /profile, /settings... */}
                    </Route>
                </Route>
                
                {/* --- ROUTE CUỐI CÙNG (Nếu không khớp với các route trên) --- */}
                <Route path="*" element={<NotFoundPage />} />
            </Routes>
        </Router>
    );
}

export default App;