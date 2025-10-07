// /client/src/pages/ProfilePage.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';

// --- CÁC COMPONENT CON ---
const Spinner = ({ size = 'h-12 w-12' }) => <div className={`animate-spin rounded-full border-b-2 border-blue-400 ${size}`}></div>;
const ErrorMessage = ({ message }) => <div className="text-center text-red-400 p-4 bg-red-900 bg-opacity-30 rounded-lg">{message}</div>;

const UserProfileCard = ({ profile }) => (
    <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 text-center">
        <img src={profile.avatarUrl} alt="Avatar" className="w-32 h-32 rounded-full border-4 border-gray-600 mx-auto mb-4" />
        <h1 className="text-3xl font-bold text-white">{profile.name || profile.githubUsername}</h1>
        <a href={`https://github.com/${profile.githubUsername}`} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">@{profile.githubUsername}</a>
        <p className="mt-4 text-gray-400">{profile.bio || "Chưa có tiểu sử trên GitHub."}</p>
    </div>
);

const SkillsRadarChart = ({ skills }) => (
    <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
        <h2 className="text-xl font-semibold text-white mb-4">Hồ sơ năng lực AI-Verified</h2>
        {skills && skills.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={skills}>
                    <PolarGrid stroke="#555" />
                    <PolarAngleAxis dataKey="skill_name" stroke="#ccc" />
                    <Radar name="Điểm kỹ năng" dataKey="score" stroke="#38BDF8" fill="#38BDF8" fillOpacity={0.6} />
                </RadarChart>
            </ResponsiveContainer>
        ) : (
            <p className="text-gray-500 text-center italic">Chưa có kỹ năng nào được xác thực.</p>
        )}
    </div>
);

const RepoCard = ({ repo, onClick }) => (
    <button onClick={onClick} className="text-left w-full bg-gray-800 p-4 rounded-xl border border-gray-700 transition transform hover:scale-105 hover:border-blue-500">
        <div className="font-semibold text-lg text-blue-400">{repo.name}</div>
        <p className="text-gray-400 text-sm mt-1 h-10 overflow-hidden">{repo.description || "Không có mô tả."}</p>
        <div className="mt-4 text-xs text-gray-500">
            <span>{repo.language || 'N/A'}</span>
            <span className="mx-2">•</span>
            <span>Cập nhật: {new Date(repo.updated_at).toLocaleDateString()}</span>
        </div>
    </button>
);

const AnalysisResultCard = ({ result }) => ( <div className="bg-gray-800 p-6 rounded-lg text-left"> <h3 className="text-xl font-bold text-white mb-4">Kết quả Phân tích AI</h3> <p className="text-gray-300 italic mb-4">"{result.summary}"</p> <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4"> <div className="md:col-span-1 flex flex-col items-center justify-center bg-gray-900 p-4 rounded-lg"> <div className="text-5xl font-bold text-blue-400">{result.overall_score}</div> <div className="text-gray-400">Overall Score</div> </div> <div className="md:col-span-2 grid grid-cols-2 gap-4"> <div className="bg-gray-900 p-4 rounded-lg"> <h4 className="font-semibold text-green-400 mb-2">Điểm mạnh</h4> <ul className="list-disc list-inside text-gray-300 text-sm space-y-1">{result.strengths.map((item, i) => <li key={i}>{item}</li>)}</ul> </div> <div className="bg-gray-900 p-4 rounded-lg"> <h4 className="font-semibold text-yellow-400 mb-2">Cần cải thiện</h4> <ul className="list-disc list-inside text-gray-300 text-sm space-y-1">{result.weaknesses.map((item, i) => <li key={i}>{item}</li>)}</ul> </div> </div> </div> <h4 className="font-semibold text-white mb-2">Các kỹ năng đã xác thực</h4> <div className="flex flex-wrap gap-2"> {result.detected_skills.map((skill, i) => ( <div key={i} className="bg-blue-900 text-blue-300 text-xs font-semibold px-3 py-1 rounded-full flex items-center"> {skill.skill_name} <span className="ml-2 bg-blue-400 text-gray-900 text-xs font-bold rounded-full px-2 py-0.5">{skill.score}</span> </div> ))} </div> </div> );

const AnalysisModal = ({ repo, onClose, onAnalyze, analysisResult, isAnalyzing, analysisError }) => {
    useEffect(() => {
        onAnalyze();
    }, [onAnalyze]);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4" onClick={onClose}>
            <div className="bg-gray-800 rounded-xl border border-gray-700 w-full max-w-3xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-gray-700 flex justify-between items-center sticky top-0 bg-gray-800 z-10">
                    <h2 className="text-2xl font-bold text-white">{repo.name}</h2>
                    <button onClick={onClose} className="text-gray-400 text-3xl hover:text-white">&times;</button>
                </div>
                <div className="p-6">
                    {isAnalyzing && <div className="flex flex-col items-center gap-4 py-10"><Spinner /> <p>AI đang phân tích...</p></div>}
                    {analysisError && <ErrorMessage message={analysisError} />}
                    {analysisResult && <AnalysisResultCard result={analysisResult} />}
                </div>
            </div>
        </div>
    );
};

// --- COMPONENT CHÍNH ---
export default function ProfilePage() {
    const { username } = useParams();
    const [data, setData] = useState(null);
    const [isLoading, setIsLoading] = useState(true); // <--- DÒNG BỊ THIẾU ĐÂY
    const [error, setError] = useState('');
    
    const [selectedRepo, setSelectedRepo] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState(null);
    const [analysisError, setAnalysisError] = useState('');

    const handleAnalyzeRepo = useCallback(async () => {
        if (!selectedRepo) return;
        setIsAnalyzing(true);
        setAnalysisResult(null);
        setAnalysisError('');
        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(
                `http://localhost:3800/api/analyze-repo`,
                { repoFullName: selectedRepo.full_name },
                { headers: { 'Authorization': `Bearer ${token}` } }
            );
            setAnalysisResult(response.data);
        } catch (error) {
            setAnalysisError(error.response?.data?.message || 'Phân tích thất bại.');
        } finally {
            setIsAnalyzing(false);
        }
    }, [selectedRepo]);

    useEffect(() => {
        const fetchProfile = async () => {
            setIsLoading(true);
            setError('');
            const token = localStorage.getItem('token');
            if (!token) return;

            try {
                const config = { headers: { 'Authorization': `Bearer ${token}` } };
                const response = await axios.get(`http://localhost:3800/api/profile/${username}`, config);
                setData(response.data);
            } catch (err) {
                setError(err.response?.data?.message || 'Không thể tải hồ sơ này.');
                console.error("Lỗi khi lấy hồ sơ:", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchProfile();
    }, [username]);

    if (isLoading) {
        return <div className="min-h-screen bg-gray-900 flex items-center justify-center"><Spinner /></div>;
    }

    if (error) {
        return <div className="min-h-screen bg-gray-900 flex items-center justify-center p-6"><ErrorMessage message={error} /></div>;
    }

    if (!data) return null;

    const { profile, skills, repos } = data;

    return (
        <div className="bg-gray-900 text-white min-h-screen">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <aside className="lg:col-span-1 space-y-8">
                        <UserProfileCard profile={profile} />
                        <SkillsRadarChart skills={skills} />
                    </aside>
                    <main className="lg:col-span-2">
                        <div className="border-b border-gray-700 mb-6">
                            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                                <a href="#" className="border-blue-500 text-blue-400 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm">Dự án GitHub</a>
                                <a href="#" className="border-transparent text-gray-500 hover:text-gray-300 hover:border-gray-300 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm">Kinh nghiệm</a>
                                <a href="#" className="border-transparent text-gray-500 hover:text-gray-300 hover:border-gray-300 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm">Học vấn</a>
                            </nav>
                        </div>

                        <h2 className="text-2xl font-bold text-white mb-2">Các dự án nổi bật</h2>
                        <p className="text-gray-400 mb-6">Nhấn vào một dự án để xem chi tiết phân tích từ AI.</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {repos.map(repo => <RepoCard key={repo.id} repo={repo} onClick={() => setSelectedRepo(repo)} />)}
                        </div>
                    </main>
                </div>
                {selectedRepo && (
                    <AnalysisModal 
                        repo={selectedRepo} 
                        onClose={() => setSelectedRepo(null)} 
                        onAnalyze={handleAnalyzeRepo}
                        analysisResult={analysisResult}
                        isAnalyzing={isAnalyzing}
                        analysisError={analysisError}
                    />
                )}
            </div>
        </div>
    );
}