// /client/src/pages/StudentLoginPage.jsx
import React from 'react';
import { Link } from 'react-router-dom';

// --- Các Component con ---

// Panel đồ họa & thương hiệu bên trái (Tái sử dụng từ trang đăng ký)
const AuthGraphicPanel = () => (
    <div className="hidden lg:flex flex-col items-center justify-center bg-gray-800 p-12 text-white text-center">
        <h1 className="text-4xl font-bold">
            <span className="text-blue-400">Edu</span>
            <span className="text-purple-400">Ledger</span> AI
        </h1>
        <p className="mt-4 text-lg text-gray-300">Gia nhập cộng đồng tài năng công nghệ.</p>
        <p className="mt-2 text-gray-400">Nơi dự án của bạn là bản CV mạnh mẽ nhất.</p>
    </div>
);

// Icon GitHub (dạng SVG để không cần file ảnh)
const GitHubIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.91 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"></path>
    </svg>
);


// --- Component chính ---

export default function StudentLoginPage() {

    const handleGitHubLogin = () => {
        // Chuyển hướng người dùng đến endpoint xác thực GitHub của backend
        window.location.href = 'http://localhost:3800/auth/github';
    };

    return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center">
            <div className="max-w-4xl w-full mx-auto rounded-xl shadow-2xl overflow-hidden md:grid md:grid-cols-2">
                <AuthGraphicPanel />

                <div className="p-8 bg-gray-800 flex flex-col justify-center">
                    <h2 className="text-3xl font-bold text-center text-white">Chào mừng trở lại!</h2>
                    <p className="mt-2 text-center text-gray-400">
                        Đăng nhập để quản lý hồ sơ năng lực của bạn.
                    </p>

                    <div className="mt-8">
                        <button
                            onClick={handleGitHubLogin}
                            className="w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-[#24292e] hover:bg-[#343a40] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 focus:ring-offset-gray-900 transition-all duration-300"
                        >
                            <GitHubIcon />
                            <span className="ml-3">Đăng nhập với GitHub</span>
                        </button>
                    </div>

                    <div className="mt-6 text-center text-sm">
                        <p className="text-gray-500">
                            Bằng việc đăng nhập, bạn đồng ý cho phép EduLedger AI truy cập vào các dự án public trên tài khoản GitHub của bạn.
                        </p>
                    </div>

                    <div className="mt-8 border-t border-gray-700 pt-6 text-center">
                         <Link to="/recruiter/login" className="text-sm font-medium text-blue-400 hover:text-blue-300">
                            Bạn là Nhà tuyển dụng?
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}