// /client/src/App.jsx
// PHIÊN BẢN v3.1 - KÍCH HOẠT "ĐẠI LỘ ĐẤU TRƯỜNG"

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider } from './context/AuthContext';

// Layouts
import MainLayout from './layouts/MainLayout'; // Layout chính (Header/Footer)

// Components
import ProtectedRoute from './components/ProtectedRoute';

// Pages (Auth & Fullscreen)
import StudentLoginPage from './pages/StudentLoginPage';
import RecruiterRegisterPage from './pages/RecruiterRegisterPage';
import RecruiterLoginPage from './pages/RecruiterLoginPage';
import GitHubCallback from './pages/GitHubCallback';
// ===>>> IMPORT "ĐẤU TRƯỜNG" (v3.1) <<<===
import InterviewPage from './pages/student/InterviewPage'; 

const LoginErrorPage = () => <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white text-xl"><h1>Đăng nhập thất bại. Vui lòng thử lại.</h1></div>;
const NotFoundPage = () => <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white text-xl"><h1>404 - Không tìm thấy trang</h1></div>;


// Pages (Bên trong MainLayout)
import HomePage from './pages/HomePage';
import JobsPage from './pages/JobsPage';
import JobDetailPage from './pages/JobDetailPage';
import CompanyListPage from './pages/CompanyListPage';
import CompanyProfilePage from './pages/CompanyProfilePage';
import DashboardPage from './pages/DashboardPage';
import ProfilePage from './pages/ProfilePage';
import RecruiterDashboardPage from './pages/RecruiterDashboardPage';
import CreateJobPage from './pages/recruiter/CreateJobPage';
import EditCompanyProfilePage from './pages/recruiter/EditCompanyProfilePage';

function App() {
    return (
        <HelmetProvider>
            <AuthProvider>
                <Router>
                    <Routes>
                        {/* === TUYẾN 1: CÁC TRANG CÓ LAYOUT CHUNG (HEADER/FOOTER) === */}
                        <Route path="/" element={<MainLayout />}>
                            
                            {/* --- Các trang Public --- */}
                            <Route index element={<HomePage />} />
                            <Route path="jobs" element={<JobsPage />} />
                            <Route path="jobs/:id" element={<JobDetailPage />} />
                            <Route path="companies" element={<CompanyListPage />} />
                            <Route path="companies/:slug" element={<CompanyProfilePage />} />

                            {/* --- Các trang Protected (Yêu cầu đăng nhập) --- */}
                            <Route element={<ProtectedRoute />}>
                                {/* Sinh viên */}
                                <Route path="dashboard" element={<DashboardPage />} />
                                <Route path="profile/:username" element={<ProfilePage />} />
                                
                                {/* Nhà tuyển dụng */}
                                <Route path="recruiter/dashboard" element={<RecruiterDashboardPage />} />
                                <Route path="recruiter/jobs/new" element={<CreateJobPage />} />
                                <Route path="recruiter/company/edit" element={<EditCompanyProfilePage />} />
                                
                                {/* (Tương lai: Route xem kết quả phỏng vấn của SV) */}
                                {/* <Route path="interview/results/:submissionId" element={<InterviewResultPage />} /> */}
                            </Route>
                        </Route>

                        {/* === TUYẾN 2: CÁC TRANG ĐỘC LẬP (KHÔNG LAYOUT CHUNG) === */}
                        
                        {/* --- Auth Pages --- */}
                        <Route path="/login" element={<StudentLoginPage />} />
                        <Route path="/recruiter/register" element={<RecruiterRegisterPage />} />
                        <Route path="/recruiter/login" element={<RecruiterLoginPage />} />
                        <Route path="/auth/github/callback" element={<GitHubCallback />} />
                        <Route path="/login-error" element={<LoginErrorPage />} />

                        {/* ===>>> "ĐẠI LỘ ĐẤU TRƯỜNG" (v3.1) <<<=== */}
                        {/* (Fullscreen, Protected) */}
                        <Route 
                            path="/interview/take/:interviewId" 
                            element={
                                <ProtectedRoute>
                                    <InterviewPage />
                                </ProtectedRoute>
                            } 
                        />

                        {/* --- Route 404 (Bắt tất cả) --- */}
                        <Route path="*" element={<NotFoundPage />} />
                    </Routes>
                </Router>
            </AuthProvider>
        </HelmetProvider>
    );
}

export default App;