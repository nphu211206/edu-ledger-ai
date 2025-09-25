import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = () => {
  const token = localStorage.getItem('jwt_token');
  // Nếu có token, cho phép truy cập vào các trang con (Dashboard)
  // Nếu không, điều hướng về trang đăng nhập
  return token ? <Outlet /> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;