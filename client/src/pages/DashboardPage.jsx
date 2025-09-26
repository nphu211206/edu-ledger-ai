// /client/src/pages/DashboardPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

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
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState(null);
    const [error, setError] = useState('');
    const token = localStorage.getItem('jwt_token');

    const fetchData = useCallback(async () => {
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
        } finally {
            setIsLoading(false);
        }
    }, [token]);

    useEffect(() => {
        if (token) {
            fetchData();
        } else {
            // Nếu không có token, không cần làm gì cả, ProtectedRoute sẽ xử lý
            setIsLoading(false);
        }
    }, [token, fetchData]);

    const handleAnalyzeRepo = async (repoFullName) => {
    setIsAnalyzing(true);
    setAnalysisResult(null);
    setError('');
    try {
        const config = { headers: { 'Authorization': `Bearer ${token}` } };
        
        // ======================= SỬA LỖI Ở ĐÂY ============================
        // Đổi `repoName` thành `repoFullName` để khớp với backend
        const response = await axios.post(`${SERVER_URL}/api/analyze-repo`, { repoFullName: repoFullName }, config);
        // =================================================================
        
        setAnalysisResult(response.data);
    } catch (err) {
        setError("Phân tích thất bại. Vui lòng thử lại.");
        console.error("Lỗi khi phân tích:", err);
    } finally {
        setIsAnalyzing(false);
    }
};

    if (isLoading) {
        return <div className="app-container"><Spinner /></div>;
    }

    if (error) {
        return <div className="app-container"><p className="error-message">{error}</p></div>;
    }
    
    // Check thêm trường hợp user không load được nhưng không có lỗi
    if (!user) {
        return <div className="app-container"><p>Không có thông tin người dùng. Đang điều hướng...</p></div>;
    }

    return (
        <div className="dashboard-container">
            <div className="profile-card dashboard-profile">
                <img src={user.avatarUrl} alt="Avatar" className="profile-avatar" />
                <div className="profile-name">{user.name}</div>
                <div className="profile-login">@{user.username}</div>
                <p className="profile-bio">{user.bio || "Chưa có bio."}</p>
            </div>

            <div className="main-content">
                <div className="repos-container">
                    <h2 className="repos-title">Xác thực Kỹ năng từ Dự án GitHub</h2>
                    <p>Chọn một dự án để AI của chúng tôi phân tích và xác thực các kỹ năng của bạn.</p>
                    {repos.map(repo => (
                        <div key={repo.id} className="repo-item interactive">
                            <div>
                                <a href={repo.html_url} target="_blank" rel="noopener noreferrer" className="repo-name">{repo.full_name}</a>
                                <p className="repo-description">{repo.description || "Không có mô tả."}</p>
                            </div>
                            <button 
                                onClick={() => handleAnalyzeRepo(repo.full_name)} 
                                disabled={isAnalyzing} 
                                className="analyze-btn"
                            >
                                {isAnalyzing ? 'Đang...' : 'Phân tích'}
                            </button>
                        </div>
                    ))}
                </div>

                <div className="analysis-section">
                    {isAnalyzing && <div className="analysis-loader"><Spinner /> Phân tích bằng AI...</div>}
                    {error && <p className="error-message">{error}</p>}
                    {analysisResult && <AnalysisResultCard result={analysisResult} />}
                </div>
            </div>
        </div>
    );
}