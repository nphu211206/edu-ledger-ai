// client/src/pages/GitHubCallback.jsx
import React, { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

const GitHubCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    // Lấy token từ URL, ví dụ: ?token=abcxyz
    const token = searchParams.get('token');

    if (token) {
      // Lưu token vào Local Storage để sử dụng cho các API call sau này
      localStorage.setItem('token', token);
      // Đăng nhập thành công, chuyển hướng người dùng đến trang Dashboard
      navigate('/dashboard'); 
    } else {
      // Nếu không có token, báo lỗi và chuyển về trang đăng nhập
      navigate('/login-error');
    }
  }, [searchParams, navigate]);

  // Hiển thị một thông báo tạm thời trong khi xử lý
  return <div>Đang xử lý đăng nhập...</div>;
};

export default GitHubCallback;