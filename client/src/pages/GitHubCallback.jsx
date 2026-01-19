// File: client/src/pages/GitHubCallback.jsx
// PHIÊN BẢN SỬA LỖI RACE CONDITION

import React, { useEffect, useContext } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const GitHubCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useContext(AuthContext); // Lấy hàm login từ context

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      login(token); // <-- SỬ DỤNG HÀM LOGIN
      navigate('/dashboard'); 
    } else {
      navigate('/login-error');
    }
  }, [searchParams, navigate, login]);


  return (
    <div className="bg-gray-900 min-h-screen flex flex-col items-center justify-center text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400"></div>
        <p className="mt-4 text-lg">Đang xác thực và chuyển hướng...</p>
    </div>
  );
};

export default GitHubCallback;