// /client/src/hooks/useAuth.js
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

export const useAuth = () => {
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                // Giải mã token để lấy thông tin user (id, role, và có thể là name, avatar)
                const decodedToken = jwtDecode(token);

                // Kiểm tra xem token đã hết hạn chưa
                const currentTime = Date.now() / 1000;
                if (decodedToken.exp < currentTime) {
                    // Token đã hết hạn
                    localStorage.removeItem('token');
                    setUser(null);
                    setIsAuthenticated(false);
                } else {
                    // Token hợp lệ, set thông tin user
                    setUser(decodedToken);
                    setIsAuthenticated(true);
                }
            } catch (error) {
                console.error("Lỗi giải mã token:", error);
                // Token không hợp lệ, xóa nó đi
                localStorage.removeItem('token');
                setUser(null);
                setIsAuthenticated(false);
            }
        }
    }, []); // Chỉ chạy 1 lần khi component được mount

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
        setIsAuthenticated(false);
        // Sau khi logout, đưa người dùng về trang chủ
        navigate('/');
    };

    // Trả về các thông tin và hàm cần thiết cho component nào dùng hook này
    return { user, isAuthenticated, logout };
};