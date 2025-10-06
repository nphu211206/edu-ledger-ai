// /client/src/pages/ProfilePage.jsx
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

const SERVER_URL = 'http://localhost:3000';

const Spinner = () => <div className="spinner"></div>;

export default function ProfilePage() {
    const { username } = useParams(); // Lấy username từ URL, ví dụ: /profile/githubuser
    const [data, setData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchProfile = async () => {
            setIsLoading(true);
            setError('');
            try {
                const response = await axios.get(`${SERVER_URL}/api/profile/${username}`);
                setData(response.data);
            } catch (err) {
                setError(err.response?.data || 'Không thể tải hồ sơ.');
                console.error("Lỗi khi lấy hồ sơ:", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchProfile();
    }, [username]); // Chạy lại mỗi khi username trên URL thay đổi

    if (isLoading) {
        return <div className="app-container"><Spinner /></div>;
    }

    if (error) {
        return <div className="app-container"><p className="error-message">{error}</p></div>;
    }

    if (!data) {
        return null; // Trường hợp không có lỗi nhưng cũng không có data
    }

    const { profile, skills } = data;

    return (
        <div className="profile-page-container">
            <aside className="profile-sidebar">
                <div className="profile-card">
                    <img src={profile.avatarUrl} alt="Avatar" className="profile-avatar" />
                    <div className="profile-name">{profile.name}</div>
                    <div className="profile-login">@{profile.username}</div>
                    <p className="profile-bio">{profile.bio || "Chưa có bio."}</p>
                    <a 
                        href={`https://github.com/${profile.username}`} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="github-link-btn"
                    >
                        Xem trên GitHub
                    </a>
                </div>
            </aside>
            <main className="profile-main-content">
                <div className="profile-section">
                    <h2>Kỹ năng đã được AI xác thực</h2>
                    <p>Các kỹ năng dưới đây được phân tích và chấm điểm tự động bởi EduLedger AI dựa trên các dự án công khai trên GitHub.</p>
                    <div className="skills-grid">
                        {skills.map((skill, index) => (
                            <div key={index} className="skill-card">
                                <div className="skill-card-header">
                                    <span className="skill-card-name">{skill.name}</span>
                                    <span className="skill-card-score">{skill.verifiedScore}</span>
                                </div>
                                <div className="skill-card-progress-bar">
                                    <div 
                                        className="skill-card-progress" 
                                        style={{ width: `${skill.verifiedScore}%` }}
                                    ></div>
                                </div>
                                <div className="skill-card-source">
                                    Nguồn: {skill.verifiedSource}
                                </div>
                            </div>
                        ))}
                    </div>
                     {skills.length === 0 && <p>Người dùng này chưa có kỹ năng nào được xác thực.</p>}
                </div>
                {/* Có thể thêm các section khác ở đây sau: Kinh nghiệm, Học vấn... */}
            </main>
        </div>
    );
}