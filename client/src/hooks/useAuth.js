// File: client/src/hooks/useAuth.js
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export const useAuth = () => {
    const context = useContext(AuthContext);
    const navigate = useNavigate();

    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }

    // Gói gọn hàm logout với navigate
    const logoutAndRedirect = () => {
        context.logout();
        navigate('/');
    };

    return { ...context, logout: logoutAndRedirect };
};