// /client/src/pages/RecruiterRegisterPage.jsx
import React, { useState, useCallback } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';

// --- CÁC COMPONENT CON ---

// Panel đồ họa & thương hiệu bên trái
const AuthGraphicPanel = () => (
    <div className="hidden lg:flex flex-col items-center justify-center bg-gray-800 p-12 text-white text-center">
        <h1 className="text-4xl font-bold">
            <span className="text-blue-400">Edu</span>
            <span className="text-purple-400">Ledger</span> AI
        </h1>
        <p className="mt-4 text-lg text-gray-300">Xưởng đúc tài năng công nghệ thế hệ mới.</p>
        <p className="mt-2 text-gray-400">Nơi năng lực được xác thực, không chỉ là lời nói.</p>
        {/* Có thể thêm ảnh minh họa hoặc icon ở đây */}
    </div>
);

// Component Input tái sử dụng với validation
const FormInput = ({ id, label, error, ...props }) => (
    <div className="w-full">
        <label htmlFor={id} className="block text-sm font-medium text-gray-300 mb-1">
            {label}
        </label>
        <input
            id={id}
            className={`w-full px-3 py-2 bg-gray-700 border rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 ${error ? 'border-red-500' : 'border-gray-600'}`}
            {...props}
        />
        {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
    </div>
);

// Component Spinner cho nút bấm
const Spinner = () => (
    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
);

// Component thông báo (lỗi hoặc thành công)
const Alert = ({ message, type }) => {
    const baseClasses = "px-4 py-3 rounded-lg text-center";
    const typeClasses = type === 'success'
        ? "bg-green-900 border border-green-700 text-green-300"
        : "bg-red-900 border border-red-700 text-red-300";
    return <div className={`${baseClasses} ${typeClasses}`}>{message}</div>;
};


// --- COMPONENT CHÍNH ---

export default function RecruiterRegisterPage() {
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    
    const [errors, setErrors] = useState({});
    const [apiError, setApiError] = useState('');
    const [apiSuccess, setApiSuccess] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    const navigate = useNavigate();

    // Hàm validate cho từng trường
    const validateField = (name, value) => {
        switch (name) {
            case 'fullName':
                return value.trim() ? '' : 'Họ và tên là bắt buộc.';
            case 'email':
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                return emailRegex.test(value) ? '' : 'Email không hợp lệ.';
            case 'password':
                return value.length >= 6 ? '' : 'Mật khẩu phải có ít nhất 6 ký tự.';
            case 'confirmPassword':
                return value === formData.password ? '' : 'Mật khẩu xác nhận không khớp.';
            default:
                return '';
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        // Xóa lỗi của trường đang nhập
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const handleBlur = (e) => {
        const { name, value } = e.target;
        const error = validateField(name, value);
        setErrors(prev => ({ ...prev, [name]: error }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setApiError('');
        setApiSuccess('');

        // Validate toàn bộ form trước khi gửi
        const formErrors = Object.keys(formData).reduce((acc, key) => {
            const error = validateField(key, formData[key]);
            if (error) acc[key] = error;
            return acc;
        }, {});

        if (Object.keys(formErrors).length > 0) {
            setErrors(formErrors);
            return;
        }

        setIsLoading(true);
        try {
            await axios.post(`http://localhost:3800/auth/recruiter/register`, {
                fullName: formData.fullName,
                email: formData.email,
                password: formData.password
            });
            
            setApiSuccess('Đăng ký thành công! Đang chuyển đến trang đăng nhập...');
            setTimeout(() => navigate('/recruiter/login'), 3000);

        } catch (err) {
            const message = err.response?.data?.message || 'Đã có lỗi không xác định xảy ra. Vui lòng thử lại.';
            setApiError(message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center">
            <div className="max-w-4xl w-full mx-auto rounded-xl shadow-2xl overflow-hidden md:grid md:grid-cols-2">
                <AuthGraphicPanel />
                <div className="p-8 bg-gray-800">
                    <h2 className="text-2xl font-bold text-center text-white">Tạo tài khoản Nhà tuyển dụng</h2>
                    <p className="mt-2 text-center text-sm text-gray-400">
                        Đã có tài khoản?{' '}
                        <Link to="/recruiter/login" className="font-medium text-blue-400 hover:text-blue-300">
                            Đăng nhập ngay
                        </Link>
                    </p>

                    <form onSubmit={handleSubmit} className="mt-8 space-y-6">
                        {apiError && <Alert message={apiError} type="error" />}
                        {apiSuccess && <Alert message={apiSuccess} type="success" />}

                        <FormInput
                            id="fullName"
                            name="fullName"
                            type="text"
                            label="Họ và Tên"
                            placeholder="Nguyễn Văn A"
                            value={formData.fullName}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            error={errors.fullName}
                            required
                        />
                        <FormInput
                            id="email"
                            name="email"
                            type="email"
                            label="Email Công ty"
                            placeholder="your.email@company.com"
                            value={formData.email}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            error={errors.email}
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
                            onBlur={handleBlur}
                            error={errors.password}
                            required
                        />
                        <FormInput
                            id="confirmPassword"
                            name="confirmPassword"
                            type="password"
                            label="Xác nhận Mật khẩu"
                            placeholder="••••••••"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            error={errors.confirmPassword}
                            required
                        />

                        <div>
                            <button 
                                type="submit"
                                disabled={isLoading}
                                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-500 disabled:cursor-not-allowed"
                            >
                                {isLoading ? <Spinner /> : 'Tạo tài khoản'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}