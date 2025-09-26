// /client/src/App.jsx
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

// Import tất cả các trang
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ProfilePage from './pages/ProfilePage';
import RecruiterLoginPage from './pages/RecruiterLoginPage';
import RecruiterRegisterPage from './pages/RecruiterRegisterPage';
import RecruiterDashboardPage from './pages/RecruiterDashboardPage';
import ProtectedRoute from './components/ProtectedRoute';
import './App.css';

// Component này chỉ có một nhiệm vụ: bắt token từ URL và LƯU nó lại
function AuthCallback() {
    const navigate = useNavigate();

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const tokenFromUrl = urlParams.get('token');

        if (tokenFromUrl) {
            // Lưu token
            localStorage.setItem('jwt_token', tokenFromUrl);
            // Xóa token khỏi URL để thanh địa chỉ đẹp hơn
            window.history.replaceState(null, '', '/dashboard');
            // Điều hướng đến trang Dashboard
            navigate('/dashboard', { replace: true });
        } else {
            // Nếu không có token, điều hướng về trang đăng nhập
            navigate('/login-error', { replace: true });
        }
    }, [navigate]);

    return <div style={{ textAlign: 'center', padding: '50px' }}><h1>Đang xử lý xác thực...</h1></div>;
}


// Component Navbar để dùng chung cho các trang
function Navbar() {
    const token = localStorage.getItem('jwt_token');
    const navigate = useNavigate();
    let userRole = null;
    
    if (token) {
        try {
            const decodedToken = jwtDecode(token);
            userRole = decodedToken.role;
        } catch (error) {
            console.error("Token không hợp lệ:", error);
            localStorage.removeItem('jwt_token');
        }
    }

    const handleLogout = () => {
        localStorage.removeItem('jwt_token');
        navigate('/');
        window.location.reload();
    };

    return (
        <nav className="navbar">
            <Link to="/" className="nav-logo">EduLedger AI</Link>
            <div className="nav-links">
                {token ? (
                    <>
                        {userRole === 'student' && <Link to="/dashboard">Dashboard Sinh viên</Link>}
                        {userRole === 'recruiter' && <Link to="/recruiter/dashboard">Dashboard NTD</Link>}
                        <button onClick={handleLogout} className="nav-logout-btn">Đăng xuất</button>
                    </>
                ) : (
                    <>
                        <Link to="/login">Sinh viên</Link>
                        <Link to="/recruiter/login">Nhà tuyển dụng</Link>
                    </>
                )}
            </div>
        </nav>
    );
}

function App() {
  return (
    <Router>
        <Navbar />
        <main>
            <Routes>
                <Route path="/" element={<HomePage />} />
                
                {/* Public Routes */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/recruiter/login" element={<RecruiterLoginPage />} />
                <Route path="/recruiter/register" element={<RecruiterRegisterPage />} />

                {/* Đây là route quan trọng để "đón" token từ GitHub */}
                <Route path="/auth/github/callback" element={<AuthCallback />} />
                
                {/* Protected Routes (Các trang cần đăng nhập mới vào được) */}
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/recruiter/dashboard" element={<RecruiterDashboardPage />} />
                
                {/* Fallback & Error Routes */}
                <Route path="/login-error" element={<div style={{ textAlign: 'center', padding: '50px' }}><h1>Đăng nhập thất bại</h1><p>Vui lòng thử lại.</p></div>} />
                <Route path="*" element={<div style={{ textAlign: 'center', padding: '50px' }}><h1>404 - Không tìm thấy trang</h1></div>} />
            </Routes>
        </main>
    </Router>
  );
}

export default App;