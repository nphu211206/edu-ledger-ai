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
            // Lưu token "xịn" của chúng ta vào localStorage
            localStorage.setItem('jwt_token', tokenFromUrl);
            // Điều hướng đến trang Dashboard, trang này sẽ tự lấy token từ localStorage để fetch data
            navigate('/dashboard', { replace: true });
        } else {
            // Nếu không có token, có thể đã có lỗi
            navigate('/login', { replace: true });
        }
    }, [navigate]);

    return <div className="app-container"><h1>Đang xử lý xác thực...</h1></div>;
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
              
              {/* Student Routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/auth/github/callback" element={<AuthCallback />} />
              <Route path="/profile/:username" element={<ProfilePage />} />
              
              {/* Recruiter Routes */}
              <Route path="/recruiter/login" element={<RecruiterLoginPage />} />
              <Route path="/recruiter/register" element={<RecruiterRegisterPage />} />
              
              {/* Protected Routes */}
              <Route element={<ProtectedRoute />}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/recruiter/dashboard" element={<RecruiterDashboardPage />} />
              </Route>
              
              <Route path="/login-error" element={<div className="app-container"><h1>Đăng nhập thất bại</h1><p>Đã có lỗi xảy ra trong quá trình xác thực với GitHub. Vui lòng thử lại.</p></div>} />
              <Route path="*" element={<div className="app-container"><h1>404 - Không tìm thấy trang</h1></div>} />
            </Routes>
        </main>
    </Router>
  );
}

export default App;