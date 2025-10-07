// /client/src/components/Header.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const UserMenu = ({ user, onLogout }) => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const dashboardLink = user.role === 'student' ? '/dashboard' : '/recruiter/dashboard';

    return (
        <div className="relative" ref={menuRef}>
            <button onClick={() => setIsOpen(!isOpen)} className="flex items-center gap-2">
                <img src={user.avatarUrl || `https://ui-avatars.com/api/?name=${user.name}&background=random`} alt="User Avatar" className="w-10 h-10 rounded-full border-2 border-gray-300" />
                <span className="hidden md:block font-semibold text-gray-700">{user.name}</span>
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
                    <NavLink to={dashboardLink} className={({ isActive }) => `block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 ${isActive ? 'bg-gray-100' : ''}`} onClick={() => setIsOpen(false)}>
                        Dashboard
                    </NavLink>
                    <NavLink to={`/profile/${user.githubUsername}`} className={({ isActive }) => `block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 ${isActive ? 'bg-gray-100' : ''}`} onClick={() => setIsOpen(false)}>
                        Hồ sơ của tôi
                    </NavLink>
                    <div className="border-t border-gray-200 my-1"></div>
                    <button onClick={onLogout} className="w-full text-left block px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                        Đăng xuất
                    </button>
                </div>
            )}
        </div>
    );
};


export default function Header() {
    const { isAuthenticated, user, logout } = useAuth();

    return (
        <header className="bg-white shadow-md sticky top-0 z-50">
            <div className="container mx-auto px-6 py-3 flex justify-between items-center">
                
                {/* Logo */}
                <Link to="/" className="text-2xl font-bold text-gray-800">
                    <span className="text-blue-600">Edu</span>
                    <span className="text-purple-600">Ledger</span> AI
                </Link>

                {/* Navigation Links */}
                <nav className="hidden md:flex items-center space-x-8 text-gray-600 font-semibold">
                    <NavLink to="/jobs" className={({ isActive }) => `hover:text-blue-600 transition-colors ${isActive ? 'text-blue-600' : ''}`}>
                        Việc làm
                    </NavLink>
                    <NavLink to="/companies" className={({ isActive }) => `hover:text-blue-600 transition-colors ${isActive ? 'text-blue-600' : ''}`}>
                        Công ty
                    </NavLink>
                </nav>

                {/* Action Buttons / User Menu */}
                <div className="flex items-center space-x-4">
                    {isAuthenticated && user ? (
                        <UserMenu user={user} onLogout={logout} />
                    ) : (
                        <>
                            <Link to="/recruiter/login" className="text-gray-600 font-semibold hover:text-blue-600 transition-colors">
                                Nhà Tuyển Dụng
                            </Link>
                            <Link to="/login" className="bg-blue-600 text-white font-bold py-2 px-6 rounded-full hover:bg-blue-700 transition-all duration-300 shadow-lg">
                                Đăng nhập
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
}