// /client/src/components/ProtectedRoute.jsx
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = () => {
    // Lấy token từ localStorage.
    // Chúng ta đã thống nhất dùng key là 'token' cho cả sinh viên và nhà tuyển dụng.
    const token = localStorage.getItem('token');

    // Nếu có token (đã đăng nhập), cho phép truy cập vào các trang con (Outlet).
    // Nếu không, điều hướng người dùng về trang đăng nhập sinh viên.
    return token ? <Outlet /> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;