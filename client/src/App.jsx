// /client/src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import JobsPage from './pages/JobsPage';

// Layouts
import MainLayout from './layouts/MainLayout';

// Components
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import HomePage from './pages/HomePage';
import ProfilePage from './pages/ProfilePage';
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
                <Route path="/jobs" element={<JobsPage />} />

                {/* --- CÁC ROUTE CẦN ĐĂNG NHẬP (Sẽ có Layout chung) --- */}
                <Route element={<MainLayout />}>
                    <Route element={<ProtectedRoute />}>
    <Route path="/dashboard" element={<DashboardPage />} />
    <Route path="/recruiter/dashboard" element={<RecruiterDashboardPage />} />
    <Route path="/profile/:username" element={<ProfilePage />} /> {/* <-- THÊM ROUTE NÀY */}
</Route>
                </Route>
                
                {/* --- ROUTE CUỐI CÙNG (Nếu không khớp với các route trên) --- */}
                <Route path="*" element={<NotFoundPage />} />
            </Routes>
        </Router>
    );
}

export default App;