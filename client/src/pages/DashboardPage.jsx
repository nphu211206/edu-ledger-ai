// client/src/pages/DashboardPage.jsx
// PHIÊN BẢN V2.2 - Sửa lỗi Import 'Award' và Lỗi Biểu đồ
// Đảm bảo trải nghiệm "đẳng cấp", "hoàn hảo", "mượt mà"

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
// === SỬA LỖI IMPORT ===
// 1. XÓA 'Award' khỏi dòng import recharts
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend, Tooltip as RechartsTooltip } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
const listItemVariant = { 
    initial: { opacity: 0, x: -20 }, 
    animate: { opacity: 1, x: 0, transition: { duration: 0.3, ease: "easeOut" } }, 
    exit: { opacity: 0, x: 20, transition: { duration: 0.2, ease: "easeIn" } } 
};

// 2. THÊM import 'lucide-react' (bao gồm cả 'Award' và các icon khác)
import { 
    Award, Briefcase as BriefcaseIcon, Users as UsersIcon, 
    // ===>>> ICON MỚI CHO STATUS & HÀNH ĐỘNG
    Clock, Eye, Send, BrainCircuit, FileText, CheckSquare, XCircle, UserCheck, HelpCircle, CheckCircle, ExternalLink 
} from 'lucide-react';
import { getStudentDashboardData, analyzeRepo, getMySkills } from '../services/api';
import { useAuth } from '../hooks/useAuth';

// --- CÁC COMPONENT CON ĐỂ TÁI SỬ DỤNG ---
// (Đã import icon ở trên, không cần định nghĩa lại SVG)

// Component Spinner cho trạng thái loading
const Spinner = ({ size = 'h-8 w-8' }) => <div className="flex justify-center items-center"><div className={`animate-spin rounded-full border-b-2 border-blue-400 ${size}`}></div></div>;
const EmptyState = ({ icon: IconComponent, title, message, actionButton }) => ( <div className="text-center py-20 px-6 bg-gray-800 rounded-xl border-2 border-dashed border-gray-700 flex flex-col items-center"> {IconComponent && ( <div className="text-gray-500 mb-4"> <IconComponent className="w-16 h-16" strokeWidth={1} /> </div> )} <h3 className="text-xl font-semibold text-white">{title}</h3> <p className="mt-2 text-gray-400 max-w-sm">{message}</p> {actionButton && <div className="mt-6">{actionButton}</div>} </div>);
const ErrorMessage = ({ message }) => ( <div className="bg-red-900 border border-red-700 text-red-300 px-4 py-3 rounded-lg relative" role="alert"><strong className="font-bold">Lỗi! </strong><span className="block sm:inline">{message}</span></div>);

// Component Card thông tin người dùng
const UserProfileCard = ({ user }) => (
    <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg">
        <div className="flex flex-col items-center text-center">
            <img 
                src={user.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || user.githubUsername)}&background=random&color=ffffff&size=128`} 
                alt="Avatar" 
                className="w-28 h-28 rounded-full border-4 border-gray-600 mb-4 shadow-md bg-gray-700" 
            />
            <h1 className="text-2xl font-bold text-white">{user.name || user.githubUsername}</h1>
            <a href={`https://github.com/${user.githubUsername}`} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">@{user.githubUsername}</a>
            <p className="mt-4 text-gray-400 text-sm">{user.bio || "Người dùng này chưa có tiểu sử trên GitHub."}</p>
        </div>
    </div>
);

// Component Biểu đồ kỹ năng (ĐÃ SỬA LỖI ĐẲNG CẤP)
const SkillsRadarChart = ({ skills }) => {
    // Sắp xếp skills theo alphabet
    const sortedSkills = useMemo(() => skills ? [...skills].sort((a, b) => (a.skill_name || '').localeCompare(b.skill_name || '')) : [], [skills]);
    
    // Kiểm tra skills có phải là mảng, có phần tử và có đủ 3 phần tử không
    const isValidSkillsData = Array.isArray(sortedSkills) && sortedSkills.length >= 3;

    if (!sortedSkills || sortedSkills.length === 0) {
        return <p className="text-gray-500 text-center italic text-sm py-10">Chưa có dữ liệu kỹ năng. Hãy phân tích một dự án để bắt đầu.</p>;
    }

    // Nếu có skills nhưng ít hơn 3
    if (sortedSkills.length > 0 && sortedSkills.length < 3) {
         return (
             <div className="text-center py-10">
                  {/* 3. SỬ DỤNG Icon 'Award' ĐÃ IMPORT ĐÚNG */}
                  <Award className="w-10 h-10 text-gray-600 mx-auto mb-3" strokeWidth={1.5}/>
                  <p className="text-gray-500 italic text-sm">Cần ít nhất 3 kỹ năng được xác thực để vẽ biểu đồ năng lực.</p>
                  <p className="text-xs text-gray-600 mt-1">(Hiện tại có: {sortedSkills.length})</p>
             </div>
         );
    }

    // Chỉ render biểu đồ khi có đủ 3 skills trở lên
    if (isValidSkillsData) {
        return (
            <ResponsiveContainer width="100%" height={300}>
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={sortedSkills}>
                    <PolarGrid stroke="#555" />
                    <PolarAngleAxis dataKey="skill_name" stroke="#ccc" tick={{ fontSize: 10, fill: '#D1D5DB' }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#555" tick={false} axisLine={false} />
                    <Radar name="Điểm kỹ năng" dataKey="score" stroke="#38BDF8" fill="#38BDF8" fillOpacity={0.6} />
                    <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                    <RechartsTooltip contentStyle={{backgroundColor: 'rgba(31, 41, 55, 0.8)', border: '1px solid #4B5563', borderRadius: '8px'}} itemStyle={{color: '#E5E7EB'}} labelStyle={{color: '#9CA3AF'}}/>
                </RadarChart>
            </ResponsiveContainer>
        );
    }

    // Fallback nếu lỗi
    return <p className="text-red-500 text-center italic text-sm py-10">Lỗi: Xử lý dữ liệu không hợp lệ để vẽ biểu đồ.</p>;
};

// Component Card kết quả phân tích AI
const AnalysisResultCard = ({ result }) => (
    <div className="bg-gray-700 p-6 rounded-xl border border-blue-500 shadow-2xl animate-fade-in">
        <h3 className="text-xl font-bold text-white mb-4">Kết quả Phân tích AI</h3>
        {result.summary && <p className="text-gray-300 italic mb-4">"{result.summary}"</p>}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="md:col-span-1 flex flex-col items-center justify-center bg-gray-800 p-4 rounded-lg">
                <div className="text-5xl font-bold text-blue-400">{result.overall_score || 0}</div>
                <div className="text-gray-400">Overall Score</div>
            </div>
            <div className="md:col-span-2 grid grid-cols-2 gap-4">
                <div className="bg-gray-800 p-4 rounded-lg">
                    <h4 className="font-semibold text-green-400 mb-2">Điểm mạnh</h4>
                    <ul className="list-disc list-inside text-gray-300 text-sm space-y-1">
                        {Array.isArray(result.strengths) && result.strengths.length > 0 ? result.strengths.map((item, i) => <li key={i}>{item}</li>) : <li>Không có.</li>}
                    </ul>
                </div>
                <div className="bg-gray-800 p-4 rounded-lg">
                    <h4 className="font-semibold text-yellow-400 mb-2">Cần cải thiện</h4>
                    <ul className="list-disc list-inside text-gray-300 text-sm space-y-1">
                        {Array.isArray(result.weaknesses) && result.weaknesses.length > 0 ? result.weaknesses.map((item, i) => <li key={i}>{item}</li>) : <li>Không có.</li>}
                    </ul>
                </div>
            </div>
        </div>
        <h4 className="font-semibold text-white mb-2">Các kỹ năng đã xác thực</h4>
        <div className="flex flex-wrap gap-2">
            {Array.isArray(result.detected_skills) && result.detected_skills.length > 0 ? (
                result.detected_skills.map((skill, i) => (
                    <div key={i} className="bg-blue-900 text-blue-300 text-xs font-semibold px-3 py-1 rounded-full flex items-center">
                        {skill.skill_name}
                        <span className="ml-2 bg-blue-400 text-gray-900 text-xs font-bold rounded-full px-2 py-0.5">{skill.score}</span>
                    </div>
                ))
            ) : (
                <p className="text-gray-500 text-xs italic">Không có kỹ năng nào được phát hiện từ phân tích này.</p>
            )}
        </div>
    </div>
);

// Component Tab Phân tích AI
const AiAnalysisTab = ({ repos, onAnalyze, analyzingRepoId, analysisResult, analysisError }) => (
    <div className="space-y-6">
        {analysisError && <ErrorMessage message={analysisError} />}
        {analysisResult && <AnalysisResultCard result={analysisResult} />}
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg">
            <h2 className="text-2xl font-bold mb-2 text-white">Dự án GitHub của bạn</h2>
            <p className="text-gray-400 mb-6">Chọn một dự án để AI của chúng tôi phân tích và xác thực kỹ năng.</p>
            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                {Array.isArray(repos) && repos.length > 0 ? repos.map(repo => (
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
                    <p className="text-gray-500 text-center italic py-4">Không thể tìm thấy bất kỳ dự án nào.</p>
                )}
            </div>
        </div>
    </div>
);

// --- COMPONENT TAB 2: HÀNH TRÌNH ỨNG TUYỂN ---
const ApplicationTrackingTab = ({ applications, isLoading }) => {

    // ===>>> BƯỚC 2: "BÙNG NỔ" HÀM getStatusBadge <<<===
    // Thêm tất cả các trạng thái phỏng vấn mới cho "hoàn hảo"
    const getStatusBadge = (status) => {
        switch (status) {
            case 'Pending': 
                return { text: 'Chờ duyệt', icon: Clock, className: 'bg-yellow-800 text-yellow-300' };
            case 'Reviewed': 
                return { text: 'Đã xem', icon: Eye, className: 'bg-blue-800 text-blue-300' };
            
            // --- TRẠNG THÁI MỚI "ĐẲNG CẤP" ---
            case 'Interview_Sent': 
                return { text: 'Đã mời PV', icon: Send, className: 'bg-purple-800 text-purple-300' };
            case 'Started': 
                return { text: 'Đang làm bài', icon: BrainCircuit, className: 'bg-purple-800 text-purple-300 animate-pulse' };
            case 'Submitted': 
                return { text: 'Đã nộp bài', icon: FileText, className: 'bg-indigo-800 text-indigo-300' };
            case 'Grading': 
                return { text: 'Đang chấm', icon: Bot, className: 'bg-indigo-800 text-indigo-300 animate-pulse' };
            case 'Graded': 
                return { text: 'Đã có điểm', icon: CheckSquare, className: 'bg-cyan-800 text-cyan-300' };
            
            // --- TRẠNG THÁI CUỐI CÙNG ---
            case 'Offered':
                return { text: 'Đã Offer', icon: CheckCircle, className: 'bg-green-800 text-green-300' };
            case 'Hired':
                return { text: 'Đã Tuyển', icon: UserCheck, className: 'bg-emerald-700 text-emerald-200' };
            case 'Rejected': 
                return { text: 'Từ chối', icon: XCircle, className: 'bg-red-800 text-red-300' };
            case 'Withdrawn':
                return { text: 'Đã rút', icon: X, className: 'bg-gray-700 text-gray-400' };
            default: 
                return { text: status, icon: HelpCircle, className: 'bg-gray-600 text-gray-300' };
        }
    };

    if (isLoading) return <div className="flex justify-center py-20"><Spinner /></div>;
    
    if (!Array.isArray(applications) || applications.length === 0) {
        return <EmptyState 
            icon={BriefcaseIcon} 
            title="Chưa có hoạt động ứng tuyển" 
            message="Hãy bắt đầu khám phá và ứng tuyển các cơ hội việc làm để theo dõi hành trình của bạn tại đây."
            actionButton={
                <Link to="/jobs" className="mt-6 inline-flex items-center gap-2 bg-blue-600 text-white font-bold py-2.5 px-6 rounded-lg hover:bg-blue-700 transition duration-300">
                    <Search className="w-5 h-5" /> Tìm việc ngay
                </Link>
            }
        />;
    }

    return (
        <div className="bg-gray-800 rounded-xl border border-gray-700 shadow-lg">
            <div className="overflow-x-auto styled-scrollbar">
                <table className="w-full text-sm text-left text-gray-400 min-w-[700px]">
                    <thead className="text-xs text-gray-300 uppercase bg-gray-700/60">
                        <tr>
                            <th scope="col" className="p-4 w-[35%]">Vị trí</th>
                            <th scope="col" className="p-4 w-[25%]">Công ty</th>
                            <th scope="col" className="p-4 w-[15%]">Ngày ứng tuyển</th>
                            <th scope="col" className="p-4 text-center w-[15%]">Trạng thái</th>
                            {/* ===>>> BƯỚC 3: THÊM CỘT "HÀNH ĐỘNG" <<<=== */}
                            <th scope="col" className="p-4 text-center w-[10%]">Hành động</th>
                        </tr>
                    </thead>
                    <motion.tbody layout>
                        <AnimatePresence>
                        {applications.map(app => {
                            // Lấy thông tin trạng thái "đẳng cấp"
                            const statusInfo = getStatusBadge(app.status);
                            
                            return (
                                <motion.tr 
                                    key={app.id} 
                                    variants={listItemVariant} 
                                    initial="initial" 
                                    animate="animate" 
                                    exit="exit" 
                                    layout
                                    className="border-b border-gray-700/80 hover:bg-gray-700/50"
                                >
                                    <td className="p-4 font-semibold text-white">
                                        <Link to={`/jobs/${app.job.id}`} className="hover:text-blue-400 transition line-clamp-2">
                                            {app.title || app.job?.title || 'N/A'}
                                        </Link>
                                    </td>
                                    <td className="p-4">
                                        <Link to={`/companies/${app.job?.company?.slug}`} className="hover:text-gray-200 transition">
                                            {app.companyName || app.job?.company?.name || 'N/A'}
                                        </Link>
                                    </td>
                                    <td className="p-4">{new Date(app.appliedAt).toLocaleDateString('vi-VN')}</td>
                                    <td className="p-4 text-center">
                                        <span 
                                            title={statusInfo.text}
                                            className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full ${statusInfo.className}`}
                                        >
                                            <statusInfo.icon className="w-3.5 h-3.5" />
                                            {statusInfo.text}
                                        </span>
                                    </td>
                                    {/* ===>>> BƯỚC 4: RENDER NÚT BẤM "BẤT TỬ" <<<=== */}
                                    <td className="p-4 text-center">
                                        {app.status === 'Interview_Sent' && app.studentInterviewId ? (
                                            <motion.div initial={{opacity: 0, scale: 0.8}} animate={{opacity: 1, scale: 1}} transition={{delay: 0.1}}>
                                                <Link 
                                                    to={`/interview/take/${app.studentInterviewId}`}
                                                    title="Bắt đầu làm bài phỏng vấn AI"
                                                    className="inline-flex items-center justify-center gap-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold py-1.5 px-3 rounded-md transition-all duration-300 shadow-lg hover:shadow-purple-500/30 transform hover:scale-105 text-xs whitespace-nowrap"
                                                >
                                                    <BrainCircuit className="w-4 h-4" /> Làm bài
                                                </Link>
                                            </motion.div>
                                        ) : app.status === 'Graded' && app.studentInterviewId ? (
                                            <motion.div initial={{opacity: 0, scale: 0.8}} animate={{opacity: 1, scale: 1}} transition={{delay: 0.1}}>
                                                <Link 
                                                    to={`/interview/results/${app.studentInterviewId}`} // (Route này chưa tạo, nhưng để sẵn)
                                                    title="Xem kết quả phỏng vấn"
                                                    className="inline-flex items-center justify-center gap-1.5 bg-cyan-700 text-white font-semibold py-1.5 px-3 rounded-md transition-all duration-300 hover:bg-cyan-600 transform hover:scale-105 text-xs whitespace-nowrap"
                                                >
                                                    <ExternalLink className="w-4 h-4" /> Xem điểm
                                                </Link>
                                            </motion.div>
                                        ) : (
                                            <span className="text-gray-600 text-lg">-</span>
                                        )}
                                    </td>
                                </motion.tr>
                            )
                        })}
                        </AnimatePresence>
                    </motion.tbody>
                </table>
            </div>
        </div>
    );
};


// --- COMPONENT CHÍNH CỦA TRANG (Đã sửa lỗi Import) ---
export default function DashboardPage() {
    const { user: authUser, isLoading: isAuthLoading } = useAuth();
    const [activeTab, setActiveTab] = useState('analysis');
    const [user, setUser] = useState(null);
    const [repos, setRepos] = useState([]);
    const [skills, setSkills] = useState([]);
    const [applications, setApplications] = useState([]);
    const [isLoadingPage, setIsLoadingPage] = useState(true);
    const [pageError, setPageError] = useState('');
    const [analyzingRepoId, setAnalyzingRepoId] = useState(null);
    const [analysisResult, setAnalysisResult] = useState(null);
    const [analysisError, setAnalysisError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        if (isAuthLoading) {
            console.log("[DashboardPage] Waiting for authUser load...");
            return;
        }

        if (authUser && authUser.role === 'student') {
            const fetchInitialData = async () => {
                setIsLoadingPage(true);
                try {
                    console.log("[DashboardPage] Fetching initial dashboard data for student...");
                    // ===>>> BƯỚC 5: HÀM NÀY GIỜ ĐÃ TRẢ VỀ studentInterviewId "BẤT TỬ" <<<===
                    const data = await getStudentDashboardData();
                    
                    console.log("[DashboardPage] Data received from getStudentDashboardData (v3.0):", JSON.parse(JSON.stringify(data)));

                    setUser(data.user || null);
                    setRepos(data.repos || []);
                    setSkills(data.skills || []);
                    setApplications(data.applications || []); // Dữ liệu application giờ đã có studentInterviewId
                    
                    console.log("[DashboardPage] Initial data state updated.");
                } catch (err) {
                    console.error("[DashboardPage] Error fetching initial data:", err);
                    setPageError("Không thể tải dữ liệu Dashboard. Vui lòng thử đăng nhập lại.");
                } finally {
                    setIsLoadingPage(false);
                }
            };
            fetchInitialData();
        } else if (!authUser) {
            console.warn("[DashboardPage] No authenticated user, redirecting to login.");
            navigate('/login');
        } else if (authUser.role !== 'student') {
            console.warn("[DashboardPage] Non-student user detected, redirecting.");
            navigate('/');
        }
    }, [navigate, authUser, isAuthLoading]);

    // Hàm xử lý phân tích repo (Giữ nguyên)
    const handleAnalyzeRepo = useCallback(async (repoName, repoId) => {
        if (analyzingRepoId) return;
        setAnalyzingRepoId(repoId);
        setAnalysisResult(null);
        setAnalysisError('');
        try {
            console.log(`[DashboardPage] Calling analyzeRepo for: ${repoName}`);
            const result = await analyzeRepo(repoName);
            setAnalysisResult(result);
            console.log(`[DashboardPage] Analysis successful for ${repoName}. Refreshing skills...`);
            
            try {
                const updatedSkills = await getMySkills(); 
                setSkills(updatedSkills || []);
                console.log("[DashboardPage] Local skills state updated after analysis.", updatedSkills);
            } catch (skillFetchError) {
                console.error("[DashboardPage] Failed to refresh skills after analysis:", skillFetchError);
                setAnalysisError("Phân tích thành công, nhưng không thể cập nhật biểu đồ kỹ năng ngay lập tức.");
            }
        } catch (error) {
            console.error(`[DashboardPage] Error analyzing ${repoName}:`, error);
            setAnalysisError(error.message || 'Phân tích thất bại. Vui lòng thử lại.');
        } finally {
            setAnalyzingRepoId(null);
        }
    }, [analyzingRepoId]);

    // --- (Phần Render chính giữ nguyên) ---
    if (isAuthLoading || (isLoadingPage && !user)) {
        return <div className="bg-gray-900 min-h-screen flex items-center justify-center"><Spinner size="h-12 w-12"/> <span className="ml-4 text-white">Đang tải Trung tâm Sự nghiệp...</span></div>;
    }
    if (pageError) {
        return <div className="bg-gray-900 min-h-screen flex items-center justify-center p-4"><ErrorMessage message={pageError} /></div>;
    }
    if (!user) {
        return <div className="bg-gray-900 min-h-screen flex items-center justify-center p-4"><ErrorMessage message="Dữ liệu người dùng không hợp lệ. Đang chuyển hướng..." /></div>;
    }
    const tabs = [
        { id: 'analysis', label: 'Tổng quan & Phân tích AI' },
        { id: 'applications', label: 'Hành trình Ứng tuyển' },
    ];
    return (
        <div className="bg-gray-900 min-h-screen text-white p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
                <aside className="lg:col-span-1 space-y-8 sticky top-24 self-start">
                    <UserProfileCard user={user} />
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
                            {/* ===>>> COMPONENT ĐÃ ĐƯỢC NÂNG CẤP "BẤT TỬ" <<<=== */}
                            {activeTab === 'applications' && <ApplicationTrackingTab applications={applications} isLoading={isLoadingPage} />}
                        </motion.div>
                    </AnimatePresence>
                </main>
            </div>
            {/* CSS nội bộ cho scrollbar (nếu bạn chưa có ở index.css) */}
            <style jsx global>{`
                .styled-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
                .styled-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .styled-scrollbar::-webkit-scrollbar-thumb { background-color: rgba(107, 114, 128, 0.5); border-radius: 20px; border: transparent; }
                .styled-scrollbar::-webkit-scrollbar-thumb:hover { background-color: rgba(156, 163, 175, 0.6); }
            `}</style>
        </div>
    );
}