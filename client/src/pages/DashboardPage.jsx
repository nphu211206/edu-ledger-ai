// client/src/pages/DashboardPage.jsx

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend } from 'recharts';

// --- CÁC COMPONENT CON ĐỂ TÁI SỬ DỤNG ---

// Component Spinner cho trạng thái loading
const Spinner = () => (
    <div className="flex justify-center items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
    </div>
);

// Component hiển thị thông báo lỗi
const ErrorMessage = ({ message }) => (
    <div className="bg-red-900 border border-red-700 text-red-300 px-4 py-3 rounded-lg relative" role="alert">
        <strong className="font-bold">Lỗi! </strong>
        <span className="block sm:inline">{message}</span>
    </div>
);

// Component Card thông tin người dùng
const UserProfileCard = ({ user }) => (
    <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg">
        <div className="flex flex-col items-center text-center">
            <img src={user.avatarUrl} alt="Avatar" className="w-28 h-28 rounded-full border-4 border-gray-600 mb-4 shadow-md" />
            <h1 className="text-2xl font-bold text-white">{user.name}</h1>
            <a href={`https://github.com/${user.githubUsername}`} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">@{user.githubUsername}</a>
            <p className="mt-4 text-gray-400 text-sm">{user.bio || "Người dùng này chưa có tiểu sử trên GitHub."}</p>
        </div>
    </div>
);

// Component Biểu đồ kỹ năng
const SkillsRadarChart = ({ skills }) => {
    if (!skills || skills.length === 0) {
        return <p className="text-gray-500 text-center italic">Chưa có dữ liệu kỹ năng. Hãy phân tích một dự án để bắt đầu.</p>;
    }
    return (
        <ResponsiveContainer width="100%" height={300}>
            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={skills}>
                <PolarGrid stroke="#555" />
                <PolarAngleAxis dataKey="skill_name" stroke="#ccc" />
                <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#555" />
                <Radar name="Điểm kỹ năng" dataKey="score" stroke="#38BDF8" fill="#38BDF8" fillOpacity={0.6} />
                <Legend />
            </RadarChart>
        </ResponsiveContainer>
    );
};

// Component Card kết quả phân tích AI
const AnalysisResultCard = ({ result }) => (
    <div className="bg-gray-700 p-6 rounded-xl border border-blue-500 shadow-2xl animate-fade-in">
        <h3 className="text-xl font-bold text-white mb-4">Kết quả Phân tích AI</h3>
        <p className="text-gray-300 italic mb-4">"{result.summary}"</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="md:col-span-1 flex flex-col items-center justify-center bg-gray-800 p-4 rounded-lg">
                <div className="text-5xl font-bold text-blue-400">{result.overall_score}</div>
                <div className="text-gray-400">Overall Score</div>
            </div>
            <div className="md:col-span-2 grid grid-cols-2 gap-4">
                <div className="bg-gray-800 p-4 rounded-lg">
                    <h4 className="font-semibold text-green-400 mb-2">Điểm mạnh</h4>
                    <ul className="list-disc list-inside text-gray-300 text-sm space-y-1">
                        {result.strengths.map((item, i) => <li key={i}>{item}</li>)}
                    </ul>
                </div>
                <div className="bg-gray-800 p-4 rounded-lg">
                    <h4 className="font-semibold text-yellow-400 mb-2">Cần cải thiện</h4>
                    <ul className="list-disc list-inside text-gray-300 text-sm space-y-1">
                        {result.weaknesses.map((item, i) => <li key={i}>{item}</li>)}
                    </ul>
                </div>
            </div>
        </div>
        <h4 className="font-semibold text-white mb-2">Các kỹ năng đã xác thực</h4>
        <div className="flex flex-wrap gap-2">
            {result.detected_skills.map((skill, i) => (
                <div key={i} className="bg-blue-900 text-blue-300 text-xs font-semibold px-3 py-1 rounded-full flex items-center">
                    {skill.skill_name}
                    <span className="ml-2 bg-blue-400 text-gray-900 text-xs font-bold rounded-full px-2 py-0.5">{skill.score}</span>
                </div>
            ))}
        </div>
    </div>
);


// --- COMPONENT CHÍNH CỦA TRANG ---

export default function DashboardPage() {
    const [user, setUser] = useState(null);
    const [repos, setRepos] = useState([]);
    const [skills, setSkills] = useState([]);
    
    const [isLoadingPage, setIsLoadingPage] = useState(true);
    const [pageError, setPageError] = useState('');
    
    const [analyzingRepoId, setAnalyzingRepoId] = useState(null);
    const [analysisResult, setAnalysisResult] = useState(null);
    const [analysisError, setAnalysisError] = useState('');

    const navigate = useNavigate();

    const fetchSkills = useCallback(async (token) => {
        try {
            const config = { headers: { 'Authorization': `Bearer ${token}` } };
            const skillsRes = await axios.get(`http://localhost:3800/api/skills`, config);
            setSkills(skillsRes.data);
        } catch (err) {
            console.error("Không thể tải kỹ năng:", err);
            // Không set lỗi trang chính, chỉ là một phần phụ
        }
    }, []);

    useEffect(() => {
const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }

        const fetchInitialData = async () => {
            setIsLoadingPage(true);
            setPageError('');
            const config = { headers: { 'Authorization': `Bearer ${token}` } };
            try {
                const [userRes, reposRes] = await Promise.all([
                    axios.get(`http://localhost:3800/api/me`, config),
                    axios.get(`http://localhost:3800/api/repos`, config)
                ]);
                setUser(userRes.data);
                setRepos(reposRes.data);
                await fetchSkills(token); // Tải kỹ năng sau khi có thông tin người dùng
            } catch (err) {
                setPageError("Không thể tải dữ liệu. Vui lòng đăng nhập lại.");
                console.error("Lỗi khi lấy dữ liệu:", err);
                localStorage.removeItem('token');
                navigate('/login');
            } finally {
                setIsLoadingPage(false);
            }
        };

        fetchInitialData();
    }, [navigate, fetchSkills]);
    
    const handleAnalyzeRepo = async (repoName, repoId) => {
        if (analyzingRepoId) return;

        setAnalyzingRepoId(repoId);
        setAnalysisResult(null);
        setAnalysisError('');

        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(
                `http://localhost:3800/api/analyze-repo`,
                { repoFullName: repoName }, 
                { headers: { 'Authorization': `Bearer ${token}` } }
            );
            setAnalysisResult(response.data);
            await fetchSkills(token); // Cập nhật lại biểu đồ kỹ năng
        } catch (error) {
            console.error(`Lỗi khi phân tích repo ${repoName}:`, error);
            setAnalysisError(`Phân tích thất bại. ${error.response?.data?.message || 'Vui lòng thử lại.'}`);
        } finally {
            setAnalyzingRepoId(null);
        }
    };

    if (isLoadingPage) {
        return (
            <div className="bg-gray-900 min-h-screen flex items-center justify-center">
                <Spinner /> <span className="ml-4 text-white">Đang tải hồ sơ năng lực...</span>
            </div>
        );
    }

    if (pageError) {
        return (
            <div className="bg-gray-900 min-h-screen flex items-center justify-center p-4">
                <ErrorMessage message={pageError} />
            </div>
        );
    }

    return (
        <div className="bg-gray-900 min-h-screen text-white p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Cột trái: Thông tin cá nhân & Hồ sơ năng lực */}
                <aside className="lg:col-span-1 space-y-8">
                    {user && <UserProfileCard user={user} />}
                    <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg">
                        <h2 className="text-xl font-semibold mb-4 text-white">Hồ sơ năng lực</h2>
                        <SkillsRadarChart skills={skills} />
                    </div>
                </aside>

                {/* Cột phải: Dự án và Phân tích */}
                <main className="lg:col-span-2 space-y-6">
                    {analysisError && <ErrorMessage message={analysisError} />}
                    {analysisResult && <AnalysisResultCard result={analysisResult} />}

                    <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg">
                        <h2 className="text-2xl font-bold mb-2 text-white">Dự án GitHub của bạn</h2>
                        <p className="text-gray-400 mb-6">Chọn một dự án để AI của chúng tôi phân tích và xác thực kỹ năng.</p>
                        <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                            {repos.length > 0 ? repos.map(repo => (
                                <div key={repo.id} className="bg-gray-700 p-4 rounded-lg flex flex-col sm:flex-row justify-between sm:items-center transition hover:bg-gray-600 hover:shadow-md">
                                    <div>
                                        <a href={repo.html_url} target="_blank" rel="noopener noreferrer" className="font-semibold text-blue-400 hover:underline">{repo.full_name}</a>
                                        <p className="text-gray-300 text-sm mt-1">{repo.description || "Không có mô tả."}</p>
                                    </div>
                                    <button 
                                        onClick={() => handleAnalyzeRepo(repo.full_name, repo.id)}
                                        disabled={!!analyzingRepoId}
                                        className="mt-3 sm:mt-0 sm:ml-4 bg-blue-600 text-white font-bold py-2 px-5 rounded-lg transition-all duration-300 ease-in-out disabled:bg-gray-500 disabled:cursor-not-allowed hover:bg-blue-700 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 min-w-[120px]"
                                    >
                                        {analyzingRepoId === repo.id ? <Spinner /> : 'Phân tích'}
                                    </button>
                                </div>
                            )) : (
                                <p className="text-gray-500 text-center italic">Không tìm thấy dự án nào trên tài khoản GitHub của bạn.</p>
                            )}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}