// File: /client/src/pages/RecruiterDashboardPage.jsx
// PHIÊN BẢN CUỐI CÙNG - TÍCH HỢP DỮ LIỆU THẬT
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';

import { getRecruiterStats, getRecruiterJobs, getApplicantsForJob, searchStudents } from '../services/api';
import { useAuth } from '../hooks/useAuth';

// --- ICONS ---
const SearchIcon = (props) => <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>;
const PlusIcon = (props) => <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>;
const TrashIcon = (props) => <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;
const GithubIcon = (props) => <svg {...props} viewBox="0 0 16 16" fill="currentColor"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.28.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21-.15.46-.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"></path></svg>;
const BriefcaseIcon = (props) => <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>;
const UsersIcon = (props) => <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21a6 6 0 00-9-5.197M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;

// --- COMPONENT TIỆN ÍCH CHUNG ---
const Spinner = ({ size = 'h-8 w-8' }) => <div className="flex justify-center items-center"><div className={`animate-spin rounded-full border-b-2 border-blue-400 ${size}`}></div></div>;
const ErrorMessage = ({ message }) => <div className="bg-red-900 border border-red-700 text-red-300 px-4 py-3 rounded-lg" role="alert"><strong className="font-bold">Lỗi! </strong><span className="block sm:inline">{message}</span></div>;
const EmptyState = ({ icon, title, message, button }) => ( <div className="text-center py-20 px-6 bg-gray-800 rounded-xl border-2 border-dashed border-gray-700 flex flex-col items-center"><div className="text-gray-500 mb-4">{icon}</div><h3 className="text-xl font-semibold text-white">{title}</h3><p className="mt-2 text-gray-400 max-w-sm">{message}</p>{button && <div className="mt-6">{button}</div>}</div>);

// --- CÁC COMPONENT CON CHO CÁC TAB ---
// SearchTab và StudentResultCard giữ nguyên, không cần thay đổi.
const StudentResultCard = ({ student }) => ( <div className="bg-gray-800 p-5 rounded-xl border border-gray-700 transition-all duration-300 hover:border-blue-500 hover:shadow-2xl hover:-translate-y-1"> <div className="flex items-start gap-4"> <img src={student.avatarUrl} alt={student.name} className="w-16 h-16 rounded-full border-2 border-gray-600" /> <div className="flex-1"> <div className="flex justify-between items-start"> <div> <h3 className="text-lg font-bold text-white">{student.name || student.githubUsername}</h3> <a href={`https://github.com/${student.githubUsername}`} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-400 hover:underline flex items-center gap-1"> <GithubIcon className="w-4 h-4" /> {student.githubUsername} </a> </div> <Link to={`/profile/${student.githubUsername}`} className="bg-gray-700 text-white text-xs font-bold py-1 px-3 rounded-full hover:bg-blue-600 transition"> Xem Hồ sơ </Link> </div> <p className="text-sm text-gray-400 mt-2 line-clamp-2">{student.bio || "Chưa có tiểu sử trên GitHub."}</p> </div> </div> </div> );
const SearchTab = ({ onSearch, isSearching, searchError, searchResults }) => { const [searchCriteria, setSearchCriteria] = useState([{ name: '', minScore: '70' }]); const handleCriteriaChange = (index, event) => { const values = [...searchCriteria]; values[index][event.target.name] = event.target.value; setSearchCriteria(values); }; const handleAddCriterion = () => setSearchCriteria([...searchCriteria, { name: '', minScore: '70' }]); const handleRemoveCriterion = (index) => { if (searchCriteria.length <= 1) return; const values = [...searchCriteria]; values.splice(index, 1); setSearchCriteria(values); }; const handleSubmit = (e) => { e.preventDefault(); onSearch(searchCriteria); }; return ( <div className="grid grid-cols-1 lg:grid-cols-12 gap-8"> <aside className="lg:col-span-4 xl:col-span-3"> <div className="sticky top-24 bg-gray-800 p-6 rounded-xl border border-gray-700"> <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><SearchIcon className="w-6 h-6" /> Tìm kiếm tài năng</h2> <form onSubmit={handleSubmit} className="space-y-4"> {searchCriteria.map((criterion, index) => ( <div className="flex items-end gap-2" key={index}> <div className="flex-grow"> <label className="text-xs text-gray-400">Kỹ năng</label> <input type="text" placeholder="VD: React, Node.js" name="name" value={criterion.name} onChange={e => handleCriteriaChange(index, e)} className="w-full mt-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500" /> </div> <div> <label className="text-xs text-gray-400">Điểm &ge;</label> <input type="number" name="minScore" value={criterion.minScore} onChange={e => handleCriteriaChange(index, e)} min="0" max="100" className="w-20 mt-1 px-2 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500" /> </div> <button type="button" onClick={() => handleRemoveCriterion(index)} disabled={searchCriteria.length <= 1} className="p-2 text-gray-500 hover:text-red-400 disabled:opacity-50 disabled:cursor-not-allowed"> <TrashIcon className="w-5 h-5" /> </button> </div> ))} <button type="button" onClick={handleAddCriterion} className="w-full flex items-center justify-center gap-2 text-sm py-2 text-blue-400 hover:bg-gray-700 rounded-md transition"><PlusIcon className="w-5 h-5" /> Thêm tiêu chí</button> <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition disabled:bg-gray-600 flex justify-center" disabled={isSearching}>{isSearching ? <Spinner size="h-5 w-5" /> : 'Tìm kiếm ứng viên'}</button> </form> </div> </aside> <main className="lg:col-span-8 xl:col-span-9"> {isSearching ? <div className="flex justify-center py-20"><Spinner size="h-12 w-12" /></div> : searchError ? <ErrorMessage message={searchError} /> : searchResults === null ? <EmptyState icon={<SearchIcon className="w-16 h-16" />} title="Bắt đầu tìm kiếm" message="Sử dụng bộ lọc bên trái để tìm các ứng viên có kỹ năng đã được AI xác thực." /> : searchResults.length === 0 ? <EmptyState icon={<UsersIcon className="w-16 h-16" />} title="Không tìm thấy kết quả" message="Hãy thử điều chỉnh hoặc giảm bớt các tiêu chí tìm kiếm của bạn." /> : ( <div className="space-y-4"> <h2 className="text-xl font-bold">Tìm thấy {searchResults.length} ứng viên phù hợp</h2> {searchResults.map(student => ( <StudentResultCard key={student.id} student={student} /> ))} </div> )} </main> </div> ); };


// --- COMPONENT TAB QUẢN LÝ TIN TUYỂN DỤNG - NÂNG CẤP VỚI DỮ LIỆU THẬT ---

const ApplicantsModal = ({ job, onClose }) => {
    const [applicants, setApplicants] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchApplicants = async () => {
            if (!job) return;
            setIsLoading(true);
            try {
                const data = await getApplicantsForJob(job.id);
                setApplicants(data);
            } catch (err) {
                setError("Không thể tải danh sách ứng viên.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchApplicants();
    }, [job]);

    const getStatusBadge = (status) => {
        switch (status) {
            case 'Pending': return 'bg-yellow-800 text-yellow-300';
            case 'Reviewed': return 'bg-blue-800 text-blue-300';
            case 'Rejected': return 'bg-red-800 text-red-300';
            default: return 'bg-gray-600 text-gray-300';
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4" onClick={onClose}>
            <motion.div initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -50, opacity: 0 }} className="bg-gray-800 rounded-xl border border-gray-700 w-full max-w-3xl text-white" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-gray-700">
                    <h2 className="text-2xl font-bold">Ứng viên cho vị trí</h2>
                    <p className="text-lg text-blue-400">{job.title}</p>
                </div>
                <div className="p-2 md:p-6 max-h-[70vh] overflow-y-auto">
                    {isLoading ? <div className="flex justify-center py-10"><Spinner/></div> :
                     error ? <ErrorMessage message={error}/> :
                     applicants.length === 0 ? <p className="text-center text-gray-400 py-10">Chưa có ứng viên nào cho vị trí này.</p> :
                     (
                        <div className="space-y-4">
                            {applicants.map(applicant => (
                                <div key={applicant.id} className="bg-gray-700 p-4 rounded-lg flex items-center justify-between hover:bg-gray-600 transition">
                                    <div className="flex items-center gap-4">
                                        <img src={applicant.avatarUrl} alt={applicant.name} className="w-12 h-12 rounded-full"/>
                                        <div>
                                            <p className="font-bold text-white">{applicant.name}</p>
                                            <a href={`https://github.com/${applicant.githubUsername}`} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-400 hover:underline">@{applicant.githubUsername}</a>
                                        </div>
                                    </div>
                                    <Link to={`/profile/${applicant.githubUsername}`} className="bg-blue-600 text-white text-sm font-bold py-2 px-4 rounded-lg hover:bg-blue-500 transition">Xem Hồ sơ</Link>
                                </div>
                            ))}
                        </div>
                     )
                    }
                </div>
                 <div className="p-4 border-t border-gray-700 flex justify-end">
                    <button onClick={onClose} className="py-2 px-6 bg-gray-600 rounded-md hover:bg-gray-500 transition text-white font-semibold">Đóng</button>
                </div>
            </motion.div>
        </div>
    );
};

// --- COMPONENT TAB QUẢN LÝ TIN TUYỂN DỤNG - NÂNG CẤP ĐẲNG CẤP ---
const JobsManagementTab = ({ jobs, isLoading, error, onJobClick }) => {
    if (isLoading) return <div className="flex justify-center py-20"><Spinner /></div>;
    if (error) return <ErrorMessage message={error} />;
    if (jobs.length === 0) return <EmptyState icon={<BriefcaseIcon className="w-16 h-16" />} title="Bạn chưa đăng tin tuyển dụng nào" message="Hãy bắt đầu tạo tin tuyển dụng đầu tiên để thu hút những tài năng xuất sắc nhất." button={<Link to="/recruiter/jobs/new" className="bg-blue-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-700 transition">Đăng tin ngay</Link>} />;

    return (
        <div className="bg-gray-800 rounded-xl border border-gray-700">
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-400">
                    <thead className="text-xs text-gray-300 uppercase bg-gray-700"><tr><th scope="col" className="p-4">Vị trí</th><th scope="col" className="p-4">Trạng thái</th><th scope="col" className="p-4 text-center">Ứng viên</th><th scope="col" className="p-4 text-center">Ngày đăng</th></tr></thead>
                    <tbody>
                        {jobs.map(job => (
                            <tr key={job.id} onClick={() => onJobClick(job)} className="border-b border-gray-700 hover:bg-gray-700/50 cursor-pointer transition">
                                <td className="p-4"><p className="font-bold text-white">{job.title}</p><p className="text-xs text-gray-400">{job.jobType}</p></td>
                                <td className="p-4"><span className={`px-2 py-1 text-xs font-semibold rounded-full ${job.status === 'Active' ? 'bg-green-800 text-green-300' : 'bg-gray-600 text-gray-300'}`}>{job.status}</span></td>
                                <td className="p-4 text-center"><span className={`font-mono text-lg ${job.applicants > 0 ? 'text-blue-400 font-bold' : 'text-white'}`}>{job.applicants}</span></td>
                                <td className="p-4 text-center">{new Date(job.createdAt).toLocaleDateString('vi-VN')}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// --- COMPONENT CHÍNH CỦA TRANG DASHBOARD ---
export default function RecruiterDashboardPage() {
    const { user: authUser, isLoading: isAuthLoading } = useAuth();
    const [isLoadingPage, setIsLoadingPage] = useState(true);
    const [activeTab, setActiveTab] = useState('jobs');
    const [stats, setStats] = useState({ totalStudents: 0, postedJobs: 0, totalApplicants: 0 });
    const [jobs, setJobs] = useState([]);
    const [searchResults, setSearchResults] = useState(null);
    const [isLoadingStats, setIsLoadingStats] = useState(true);
    const [isLoadingJobs, setIsLoadingJobs] = useState(true);
    const [isSearching, setIsSearching] = useState(false);
    const [pageError, setPageError] = useState('');
    const [searchError, setSearchError] = useState('');
    const [viewingApplicantsFor, setViewingApplicantsFor] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        if (isAuthLoading) return;
        if (!authUser || authUser.role !== 'recruiter') { navigate('/recruiter/login'); return; }
        
        const fetchDashboardData = async () => {
            try {
                const [statsRes, jobsRes] = await Promise.all([ getRecruiterStats(), getRecruiterJobs() ]);
                setStats(statsRes);
                setJobs(jobsRes);
            } catch (error) {
                console.error("Lỗi nghiêm trọng khi tải dữ liệu Dashboard:", error);
                setPageError('Không thể tải dữ liệu. Vui lòng đăng nhập lại.');
            } finally {
                setIsLoadingPage(false);
                setIsLoadingStats(false);
                setIsLoadingJobs(false);
            }
        };
        fetchDashboardData();
    }, [navigate, authUser, isAuthLoading]);

    const handleSearch = useCallback(async (searchCriteria) => {
        setIsSearching(true); setSearchResults(null); setSearchError('');
        const validCriteria = searchCriteria.filter(c => c.name.trim() !== '').map(c => ({ name: c.name.trim(), minScore: parseInt(c.minScore, 10) || 0 }));
        if (validCriteria.length === 0) { setSearchError('Vui lòng nhập ít nhất một kỹ năng để tìm kiếm.'); setIsSearching(false); return; }
        try {
            // --- SỬA LỖI TẠI ĐÂY ---
            const response = await searchStudents(validCriteria);
            setSearchResults(response);
        } catch (err) { setSearchError(err.message || 'Tìm kiếm thất bại. Vui lòng thử lại.');
        } finally { setIsSearching(false); }
    }, []);
    
    const tabs = useMemo(() => [
        { id: 'jobs', label: 'Quản lý Tin tuyển dụng', component: <JobsManagementTab jobs={jobs} isLoading={isLoadingJobs} error={pageError} onJobClick={setViewingApplicantsFor} /> },
        { id: 'search', label: 'Tìm kiếm Ứng viên', component: <SearchTab onSearch={handleSearch} isSearching={isSearching} searchError={searchError} searchResults={searchResults} /> },
    ], [jobs, isLoadingJobs, pageError, handleSearch, isSearching, searchError, searchResults]);

    if (isLoadingPage || isAuthLoading) {
        return <div className="bg-gray-900 min-h-screen flex items-center justify-center"><Spinner size="h-12 w-12" /></div>;
    }
    
    return (
        <>
            <Helmet><title>Dashboard Nhà tuyển dụng | EduLedger AI</title></Helmet>
            <div className="bg-gray-900 min-h-screen text-white">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-8">
                        <div><h1 className="text-4xl font-bold text-white mb-2">Chào mừng, {authUser?.name}!</h1><p className="text-gray-400">Đây là trung tâm chỉ huy của bạn để tìm kiếm và quản lý tài năng.</p></div>
                        <Link to="/recruiter/jobs/new" className="bg-blue-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-700 transition-all duration-300 flex items-center justify-center gap-2 shadow-lg w-full md:w-auto"><PlusIcon className="w-5 h-5" /> Đăng tin tuyển dụng</Link>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">{isLoadingStats ? <Spinner size="h-8 w-8"/> : <p className="text-3xl font-bold text-blue-400">{stats.totalStudents.toLocaleString('vi-VN')}</p>}<p className="mt-1 text-gray-400">Hồ sơ sinh viên</p></div>
                        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">{isLoadingStats ? <Spinner size="h-8 w-8"/> : <p className="text-3xl font-bold text-green-400">{stats.postedJobs.toLocaleString('vi-VN')}</p>}<p className="mt-1 text-gray-400">Tin đã đăng</p></div>
                        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">{isLoadingStats ? <Spinner size="h-8 w-8"/> : <p className="text-3xl font-bold text-purple-400">{stats.totalApplicants.toLocaleString('vi-VN')}</p>}<p className="mt-1 text-gray-400">Lượt ứng tuyển</p></div>
                    </div>
                    <div className="border-b border-gray-700 mb-8"><nav className="-mb-px flex space-x-8" aria-label="Tabs">{tabs.map(tab => ( <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`${ activeTab === tab.id ? 'border-blue-500 text-blue-400' : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500' } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors focus:outline-none`}>{tab.label}</button>))} </nav></div>
                    <AnimatePresence mode="wait"><motion.div key={activeTab} initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -10, opacity: 0 }} transition={{ duration: 0.2 }}>{tabs.find(tab => tab.id === activeTab)?.component}</motion.div></AnimatePresence>
                </div>
            </div>
            <AnimatePresence>
                {viewingApplicantsFor && <ApplicantsModal job={viewingApplicantsFor} onClose={() => setViewingApplicantsFor(null)} />}
            </AnimatePresence>
        </>
    );
}