// /client/src/pages/RecruiterRegisterPage.jsx
import React, { useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';

const SERVER_URL = 'http://localhost:3000';
const Spinner = () => <div className="spinner-small"></div>;

export default function RecruiterRegisterPage() {
    const [formData, setFormData] = useState({
        name: '',
        companyName: '', // Thêm trường này nếu cần
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        // --- Client-side Validation (đẳng cấp) ---
        if (!formData.name || !formData.email || !formData.password) {
            return setError('Vui lòng điền đầy đủ các trường bắt buộc.');
        }
        if (formData.password !== formData.confirmPassword) {
            return setError('Mật khẩu xác nhận không khớp.');
        }
        if (formData.password.length < 6) {
            return setError('Mật khẩu phải có ít nhất 6 ký tự.');
        }

        setLoading(true);
        try {
            const payload = {
                name: formData.name,
                email: formData.email,
                password: formData.password,
            };
            await axios.post(`${SERVER_URL}/auth/recruiter/register`, payload);
            setSuccess('Đăng ký thành công! Bạn sẽ được chuyển đến trang đăng nhập trong 3 giây.');
            
            // Tự động chuyển trang sau khi đăng ký thành công
            setTimeout(() => {
                navigate('/recruiter/login');
            }, 3000);

        } catch (err) {
            setError(err.response?.data || 'Đã có lỗi xảy ra. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-form-card">
                <h2>Tạo tài khoản Nhà tuyển dụng</h2>
                <p>Tìm kiếm và kết nối với những tài năng công nghệ đã được xác thực.</p>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="name">Họ và Tên</label>
                        <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                        <label htmlFor="email">Email Công ty</label>
                        <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                        <label htmlFor="password">Mật khẩu</label>
                        <input type="password" id="password" name="password" value={formData.password} onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                        <label htmlFor="confirmPassword">Xác nhận Mật khẩu</label>
                        <input type="password" id="confirmPassword" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required />
                    </div>

                    {error && <p className="error-message">{error}</p>}
                    {success && <p className="success-message">{success}</p>}

                    <button type="submit" className="auth-btn" disabled={loading}>
                        {loading ? <Spinner /> : 'Đăng ký'}
                    </button>
                </form>
                <div className="auth-switch">
                    Đã có tài khoản? <Link to="/recruiter/login">Đăng nhập ngay</Link>
                </div>
            </div>
        </div>
    );
}