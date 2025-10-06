import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const SERVER_URL = 'http://localhost:3000';

// Component nhỏ để hiển thị loading spinner
const Spinner = () => <div className="spinner"></div>;

// Component nhỏ để hiển thị thẻ kết quả phân tích
const AnalysisResultCard = ({ result }) => (
    <div className="analysis-card">
        <h3>Kết quả Phân tích AI</h3>
        <p className="summary">"{result.summary}"</p>
        <div className="score-circle">
            {result.overall_score}
            <span>Overall</span>
        </div>
        <div className="details-grid">
            <div className="detail-box strengths">
                <h4>Điểm mạnh</h4>
                <ul>{result.strengths.map((item, i) => <li key={i}>{item}</li>)}</ul>
            </div>
            <div className="detail-box weaknesses">
                <h4>Cần cải thiện</h4>
                <ul>{result.weaknesses.map((item, i) => <li key={i}>{item}</li>)}</ul>
            </div>
        </div>
        <h4>Kỹ năng đã xác thực</h4>
        <div className="skills-container">
            {result.detected_skills.map((skill, i) => (
                <div key={i} className="skill-tag">
                    {skill.skill_name} <span className="skill-score">{skill.score}</span>
                </div>
            ))}
        </div>
    </div>
);

export default function DashboardPage() {
    const [user, setUser] = useState(null);
    const [repos, setRepos] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const token = localStorage.getItem('jwt_token');

    useEffect(() => {
        if (!token) {
            navigate('/login');
            return;
        }

        const fetchData = async () => {
            setIsLoading(true);
            setError('');
            const config = { headers: { 'Authorization': `Bearer ${token}` } };
            try {
                const [userRes, reposRes] = await Promise.all([
                    axios.get(`${SERVER_URL}/api/me`, config),
                    axios.get(`${SERVER_URL}/api/repos`, config)
                ]);
                setUser(userRes.data);
                setRepos(reposRes.data);
            } catch (err) {
                setError("Không thể tải dữ liệu. Vui lòng đăng nhập lại.");
                console.error("Lỗi khi lấy dữ liệu:", err);
                localStorage.removeItem('jwt_token'); // Xóa token hỏng
                navigate('/login');
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [token, navigate]);

    if (isLoading) {
        return <div className="text-center p-10">Đang tải dữ liệu...</div>;
    }

    if (error) {
        return <div className="text-center p-10 text-red-500">{error}</div>;
    }

    return (
        <div className="bg-gray-900 min-h-screen text-white p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Cột trái: Thông tin cá nhân & Hồ sơ năng lực */}
                <aside className="lg:col-span-1 space-y-8">
                    {user && (
                        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                            <div className="flex flex-col items-center text-center">
                                <img src={user.avatarUrl} alt="Avatar" className="w-24 h-24 rounded-full border-4 border-gray-600 mb-4" />
                                <h1 className="text-2xl font-bold">{user.name}</h1>
                                <p className="text-gray-400">@{user.githubUsername}</p>
                                <p className="mt-4 text-gray-300 text-sm">{user.bio || "Chưa có tiểu sử."}</p>
                            </div>
                        </div>
                    )}
                    <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                        <h2 className="text-xl font-semibold mb-4">Hồ sơ năng lực</h2>
                        <p className="text-gray-400">Các kỹ năng đã được AI xác thực sẽ hiển thị ở đây dưới dạng biểu đồ đẹp mắt.</p>
                        {/* Nơi để các biểu đồ kỹ năng trong tương lai */}
                    </div>
                </aside>

                {/* Cột phải: Dự án và Phân tích */}
                <main className="lg:col-span-2 bg-gray-800 p-6 rounded-xl border border-gray-700">
                    <h2 className="text-2xl font-bold mb-2">Dự án GitHub của bạn</h2>
                    <p className="text-gray-400 mb-6">Chọn một dự án để AI của chúng tôi phân tích và xác thực kỹ năng.</p>
                    <div className="space-y-4">
                        {repos.map(repo => (
                            <div key={repo.id} className="bg-gray-700 p-4 rounded-lg flex justify-between items-center transition hover:bg-gray-600">
                                <div>
                                    <a href={repo.html_url} target="_blank" rel="noopener noreferrer" className="font-semibold text-blue-400 hover:underline">{repo.full_name}</a>
                                    <p className="text-gray-300 text-sm mt-1">{repo.description || "Không có mô tả."}</p>
                                </div>
                                <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition">
                                    Phân tích
                                </button>
                            </div>
                        ))}
                    </div>
                </main>

            </div>
        </div>
    );
}