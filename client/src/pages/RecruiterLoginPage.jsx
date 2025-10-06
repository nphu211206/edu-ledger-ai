// /client/src/pages/RecruiterLoginPage.jsx
import React, { useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';

// --- Các Component con dùng chung (có thể tách ra file riêng sau này) ---
const AuthGraphicPanel = () => (
    <div className="hidden lg:flex flex-col items-center justify-center bg-gray-800 p-12 text-white text-center">
        <h1 className="text-4xl font-bold">
            <span className="text-blue-400">Edu</span>
            <span className="text-purple-400">Ledger</span> AI
        </h1>
        <p className="mt-4 text-lg text-gray-300">Xưởng đúc tài năng công nghệ thế hệ mới.</p>
        <p className="mt-2 text-gray-400">Nơi năng lực được xác thực, không chỉ là lời nói.</p>
    </div>
);

const FormInput = ({ id, label, error, ...props }) => (
    <div className="w-full">
        <label htmlFor={id} className="block text-sm font-medium text-gray-300 mb-1">{label}</label>
        <input id={id} className={`w-full px-3 py-2 bg-gray-700 border rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 ${error ? 'border-red-500' : 'border-gray-600'}`} {...props} />
        {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
    </div>
);

const Spinner = () => <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>;

const Alert = ({ message }) => (
    <div className="bg-red-900 border border-red-700 text-red-300 px-4 py-3 rounded-lg text-center">{message}</div>
);

// --- Component chính ---
export default function RecruiterLoginPage() {
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError(''); // Xóa lỗi khi người dùng bắt đầu nhập lại
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.email || !formData.password) {
            return setError('Vui lòng nhập đầy đủ email và mật khẩu.');
        }
        setIsLoading(true);
        setError('');

        try {
            const response = await axios.post(`http://localhost:3800/auth/recruiter/login`, formData);
            const { token } = response.data;

            // **QUAN TRỌNG: Lưu token vào Local Storage**
            localStorage.setItem('token', token);

            // Chuyển hướng đến trang dashboard của nhà tuyển dụng
            navigate('/recruiter/dashboard'); 

        } catch (err) {
            const message = err.response?.data?.message || 'Đã có lỗi không xác định xảy ra.';
            setError(message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center">
            <div className="max-w-4xl w-full mx-auto rounded-xl shadow-2xl overflow-hidden md:grid md:grid-cols-2">
                <AuthGraphicPanel />
                <div className="p-8 bg-gray-800">
                    <h2 className="text-2xl font-bold text-center text-white">Đăng nhập Nhà tuyển dụng</h2>
                    <p className="mt-2 text-center text-sm text-gray-400">
                        Chưa có tài khoản?{' '}
                        <Link to="/recruiter/register" className="font-medium text-blue-400 hover:text-blue-300">
                            Tạo tài khoản mới
                        </Link>
                    </p>

                    <form onSubmit={handleSubmit} className="mt-8 space-y-6">
                        {error && <Alert message={error} />}
                        <FormInput
                            id="email"
                            name="email"
                            type="email"
                            label="Email"
                            placeholder="your.email@company.com"
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />
                        <FormInput
                            id="password"
                            name="password"
                            type="password"
                            label="Mật khẩu"
                            placeholder="••••••••"
                            value={formData.password}
                            onChange={handleChange}
                            required
                        />
                        <div>
                            <button 
                                type="submit"
                                disabled={isLoading}
                                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-500 disabled:cursor-not-allowed"
                            >
                                {isLoading ? <Spinner /> : 'Đăng nhập'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}