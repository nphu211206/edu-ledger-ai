// client/src/pages/DashboardPage.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { getStudentDashboardData, analyzeRepo } from '../services/api';
import { useAuth } from '../hooks/useAuth';
// --- CÁC COMPONENT CON ĐỂ TÁI SỬ DỤNG ---
const UsersIcon = (props) => <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21a6 6 0 00-9-5.197M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const BriefcaseIcon = (props) => <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>;

// Component Spinner cho trạng thái loading
const Spinner = ({ size = 'h-8 w-8' }) => <div className="flex justify-center items-center"><div className={`animate-spin rounded-full border-b-2 border-blue-400 ${size}`}></div></div>;
const EmptyState = ({ icon, title, message }) => ( <div className="text-center py-20 px-6 bg-gray-800 rounded-xl border-2 border-dashed border-gray-700 flex flex-col items-center"><div className="text-gray-500 mb-4">{icon}</div><h3 className="text-xl font-semibold text-white">{title}</h3><p className="mt-2 text-gray-400 max-w-sm">{message}</p></div>);


// Component hiển thị thông báo lỗi
const ErrorMessage = ({ message }) => ( <div className="bg-red-900 border border-red-700 text-red-300 px-4 py-3 rounded-lg relative" role="alert"><strong className="font-bold">Lỗi! </strong><span className="block sm:inline">{message}</span></div>);


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
const AiAnalysisTab = ({ repos, onAnalyze, analyzingRepoId, analysisResult, analysisError }) => (
    <div className="space-y-6">
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
                        <button onClick={() => onAnalyze(repo.full_name, repo.id)} disabled={!!analyzingRepoId} className="mt-3 sm:mt-0 sm:ml-4 bg-blue-600 text-white font-bold py-2 px-5 rounded-lg transition-all duration-300 ease-in-out disabled:bg-gray-500 disabled:cursor-not-allowed hover:bg-blue-700 min-w-[120px]">
                            {analyzingRepoId === repo.id ? <Spinner size="h-5 w-5"/> : 'Phân tích'}
                        </button>
                    </div>
                )) : (
                    <p className="text-gray-500 text-center italic">Không tìm thấy dự án nào.</p>
                )}
            </div>
        </div>
    </div>
);

// --- COMPONENT TAB 2: HÀNH TRÌNH ỨNG TUYỂN ---
const ApplicationTrackingTab = ({ applications, isLoading }) => {
    const getStatusBadge = (status) => {
        switch (status) {
            case 'Pending': return 'bg-yellow-800 text-yellow-300';
            case 'Reviewed': return 'bg-blue-800 text-blue-300';
            case 'Rejected': return 'bg-red-800 text-red-300';
            default: return 'bg-gray-600 text-gray-300';
        }
    };

    if (isLoading) return <div className="flex justify-center py-20"><Spinner /></div>;
    
    if (applications.length === 0) {
        return <EmptyState icon={<BriefcaseIcon className="w-16 h-16"/>} title="Chưa có hoạt động ứng tuyển" message="Hãy bắt đầu khám phá và ứng tuyển các cơ hội việc làm để theo dõi hành trình của bạn tại đây." />;
    }

    return (
        <div className="bg-gray-800 rounded-xl border border-gray-700">
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-400">
                    <thead className="text-xs text-gray-300 uppercase bg-gray-700">
                        <tr>
                            <th scope="col" className="p-4">Vị trí</th>
                            <th scope="col" className="p-4">Công ty</th>
                            <th scope="col" className="p-4">Ngày ứng tuyển</th>
                            <th scope="col" className="p-4 text-center">Trạng thái</th>
                        </tr>
                    </thead>
                    <tbody>
                        {applications.map(app => (
                            <tr key={app.jobId} className="border-b border-gray-700 hover:bg-gray-700/50">
                                <td className="p-4 font-semibold text-white">{app.title}</td>
                                <td className="p-4">{app.companyName}</td>
                                <td className="p-4">{new Date(app.appliedAt).toLocaleDateString('vi-VN')}</td>
                                <td className="p-4 text-center">
                                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusBadge(app.status)}`}>
                                        {app.status}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};



// --- COMPONENT CHÍNH CỦA TRANG ---

export default function DashboardPage() {
    const { user: authUser } = useAuth();
    const [activeTab, setActiveTab] = useState('analysis');

    // State cho toàn bộ dữ liệu trang
    const [user, setUser] = useState(null);
    const [repos, setRepos] = useState([]);
    const [skills, setSkills] = useState([]);
    const [applications, setApplications] = useState([]);
    
    // State quản lý trạng thái
    const [isLoadingPage, setIsLoadingPage] = useState(true);
    const [pageError, setPageError] = useState('');
    
    // State cho chức năng phân tích
    const [analyzingRepoId, setAnalyzingRepoId] = useState(null);
    const [analysisResult, setAnalysisResult] = useState(null);
    const [analysisError, setAnalysisError] = useState('');

    const navigate = useNavigate();


    useEffect(() => {
        if (authUser?.role !== 'student') { navigate('/'); return; }
        
        const fetchInitialData = async () => {
            try {
                const data = await getStudentDashboardData();
                setUser(data.user);
                setRepos(data.repos);
                setSkills(data.skills);
                setApplications(data.applications);
            } catch (err) {
                setPageError("Không thể tải dữ liệu. Vui lòng đăng nhập lại.");
                localStorage.removeItem('token');
                navigate('/login');
            } finally {
                setIsLoadingPage(false);
            }
        };

        fetchInitialData();
    }, [navigate, authUser]);
    
    // Hàm xử lý phân tích repo
    const handleAnalyzeRepo = useCallback(async (repoName, repoId) => {
        if (analyzingRepoId) return;
        setAnalyzingRepoId(repoId);
        setAnalysisResult(null);
        setAnalysisError('');
        try {
            const result = await analyzeRepo(repoName);
            setAnalysisResult(result);
            // Tải lại skills để cập nhật biểu đồ
            const updatedSkills = await getStudentDashboardData().then(data => data.skills);
            setSkills(updatedSkills);
        } catch (error) {
            setAnalysisError(error.message || 'Phân tích thất bại. Vui lòng thử lại.');
        } finally {
            setAnalyzingRepoId(null);
        }
    }, [analyzingRepoId]);

    if (isLoadingPage) {
        return <div className="bg-gray-900 min-h-screen flex items-center justify-center"><Spinner size="h-12 w-12"/> <span className="ml-4 text-white">Đang tải Trung tâm Sự nghiệp...</span></div>;
    }

    if (pageError) {
        return <div className="bg-gray-900 min-h-screen flex items-center justify-center p-4"><ErrorMessage message={pageError} /></div>;
    }
    
    const tabs = [
        { id: 'analysis', label: 'Tổng quan & Phân tích AI' },
        { id: 'applications', label: 'Hành trình Ứng tuyển' },
    ];

    return (
        <div className="bg-gray-900 min-h-screen text-white p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
                <aside className="lg:col-span-1 space-y-8 sticky top-24 self-start">
                    {user && <UserProfileCard user={user} />}
                    <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg">
                        <h2 className="text-xl font-semibold mb-4 text-white">Hồ sơ năng lực</h2>
                        <SkillsRadarChart skills={skills} />
                    </div>
                </aside>

                <main className="lg:col-span-2">
                    <div className="border-b border-gray-700 mb-6">
                        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                            {tabs.map(tab => (
                                <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`${activeTab === tab.id ? 'border-blue-500 text-blue-400' : 'border-transparent text-gray-500 hover:text-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}>
                                    {tab.label}
                                </button>
                            ))}
                        </nav>
                    </div>
                    <AnimatePresence mode="wait">
                        <motion.div key={activeTab} initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -10, opacity: 0 }} transition={{ duration: 0.2 }}>
                            {activeTab === 'analysis' && <AiAnalysisTab repos={repos} onAnalyze={handleAnalyzeRepo} analyzingRepoId={analyzingRepoId} analysisResult={analysisResult} analysisError={analysisError} />}
                            {activeTab === 'applications' && <ApplicationTrackingTab applications={applications} isLoading={isLoadingPage} />}
                        </motion.div>
                    </AnimatePresence>
                </main>
            </div>
        </div>
    );
}