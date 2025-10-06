// client/src/components/Header.jsx
import React from 'react';
import { Link } from 'react-router-dom';

const Header = () => {
  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-6 py-4 flex justify-between items-center">
        
        {/* Logo */}
        <div className="text-2xl font-bold text-gray-800">
          <Link to="/">
            <span className="text-primary">Edu</span>
            <span className="text-secondary">Ledger</span> AI
          </Link>
        </div>

        {/* Navigation Links */}
        <nav className="hidden md:flex space-x-8 text-gray-600 font-medium">
          <Link to="/jobs" className="hover:text-primary transition-colors duration-300">Việc làm</Link>
          <Link to="/companies" className="hover:text-primary transition-colors duration-300">Công ty</Link>
          <Link to="/profile" className="hover:text-primary transition-colors duration-300">Hồ sơ năng lực</Link>
        </nav>

        {/* Action Buttons */}
        <div className="flex items-center space-x-4">
          <Link 
            to="/recruiter/login" 
            className="hidden sm:block text-gray-600 font-semibold hover:text-primary transition-colors duration-300"
          >
            Nhà Tuyển Dụng
          </Link>
          <Link 
            to="/login" 
            className="bg-primary text-white font-bold py-2 px-6 rounded-full hover:bg-sky-600 transition-all duration-300 shadow-lg"
          >
            Đăng nhập
          </Link>
        </div>

      </div>
    </header>
  );
};

export default Header;