// File: /client/src/pages/RecruiterDashboardPage.jsx
// PHIÊN BẢN v3.3 - ĐÃ SỬA CẢ 2 LỖI <style jsx>

import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart, Bar, ResponsiveContainer, Tooltip as RechartsTooltip, Cell } from 'recharts';

// --- API & Hooks ---
import {
    getRecruiterStats, getRecruiterJobs, getApplicantsForJob,
    updateApplicationStatus, deleteJob, changeJobStatus, updateJob,
    getInterviewTemplates, sendInterviewInvite,
} from '../services/api.js';
import { useAuth } from '../hooks/useAuth';

// --- Components ---
import { LoadingSpinner, ErrorDisplay, EmptyState } from '../components/common/FeedbackComponents';
import EditJobModal from '../components/jobs/EditJobModal';

// --- Modals & Tabs ---
import ApplicantsModal from './recruiter/modals/ApplicantsModal';
import CreateInterviewTemplateModal from './recruiter/modals/CreateInterviewTemplateModal';
import SendInterviewModal from './recruiter/modals/SendInterviewModal';

// --- Tabs ---
import JobsManagementTab from './recruiter/tabs/JobsManagementTab';
import SearchTabContent from './recruiter/tabs/SearchTabContent';
import InterviewManagementTab from './recruiter/tabs/InterviewManagementTab';

// --- Icons ---
import {
    LayoutDashboard, Briefcase, Users, Search, Plus, Trash2, Github, ExternalLink,
    Loader, AlertCircle, Eye, CalendarDays, CheckCircle, XCircle, Clock, Mail, ChevronRight, Edit, Settings,
    Check, X, Send, MessageSquare, HelpCircle, Filter, Activity, TrendingUp, Archive, ArchiveRestore, Info, Pencil, MapPin, UserCheck, DollarSign, Building,
    ClipboardCheck, FileText, Bot, FileQuestion, CheckSquare, BrainCircuit, BookCopy, Sparkles, AlertTriangle, UserRoundCheck, ThumbsDown, ThumbsUp, Medal, RefreshCw
} from 'lucide-react';

// --- Animation Variants ---
const cardVariant = { initial: { opacity: 0, y: 15, scale: 0.98 }, animate: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: [0.25, 1, 0.5, 1] } } };
const tabContentVariant = { initial: { y: 15, opacity: 0 }, animate: { y: 0, opacity: 1, transition: { duration: 0.3, ease: 'easeInOut' } }, exit: { y: -15, opacity: 0, transition: { duration: 0.2, ease: 'easeIn' } } };

// --- Components Con (Nội bộ của Dashboard) ---

/** CustomStatTooltip */
const CustomStatTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) { return ( <div className="bg-gray-700/80 backdrop-blur-sm border border-gray-600 rounded-md shadow-lg px-2 py-1 text-xs text-gray-200"> <p>{`Tuần ${label}: ${payload[0].value}`}</p> </div> ); }
    return null;
};
CustomStatTooltip.displayName = 'CustomStatTooltip';

/** StatCard */
const StatCard = memo(({ title, value = 0, icon: Icon, color = 'blue', data = [], dataKey = 'value', isLoading, detailLink }) => {
    const colorClasses = useMemo(() => ({
        blue: { bg: 'bg-blue-900/40 hover:bg-blue-900/60', border: 'border-blue-700/60', text: 'text-blue-400', bar: '#60A5FA' },
        green: { bg: 'bg-green-900/40 hover:bg-green-900/60', border: 'border-green-700/60', text: 'text-green-400', bar: '#34D399' },
        purple: { bg: 'bg-purple-900/40 hover:bg-purple-900/60', border: 'border-purple-700/60', text: 'text-purple-400', bar: '#A78BFA' },
    }), []);
    const classes = colorClasses[color] || colorClasses.blue;
    const cardContent = (
        <>
            <div className="flex justify-between items-start mb-3 relative z-10">
                <div className={`p-2.5 rounded-lg bg-gray-700/60 ${classes.text} shadow-inner transition-colors duration-300`}> <Icon className="w-5 h-5" /> </div>
            </div>
            {isLoading ? ( <div className="space-y-2 mt-1 mb-2"> <div className="h-9 w-1/2 bg-gray-700/80 rounded animate-pulse"></div> <div className="h-4 w-3/4 bg-gray-700/60 rounded animate-pulse"></div> </div>
            ) : ( <> <p className={`text-4xl font-bold ${classes.text} mb-1 transition-all duration-300 group-hover:scale-105`}>{value.toLocaleString('vi-VN')}</p> <p className="text-sm text-gray-400 relative z-10">{title}</p> </> )}
            {data.length > 1 && !isLoading && (
                <div className="w-full h-20 absolute bottom-0 left-0 opacity-15 group-hover:opacity-30 transition-opacity duration-400 overflow-hidden rounded-b-xl mask-gradient-b">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data} margin={{ top: 25, right: 0, left: 0, bottom: 0 }}>
                            <RechartsTooltip content={<CustomStatTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }}/>
                            <Bar dataKey={dataKey} radius={[3, 3, 0, 0]} barSize={6}> {data.map((entry, index) => ( <Cell key={`cell-${index}`} fill={classes.bar} fillOpacity={0.5 + (index / data.length) * 0.5}/> ))} </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}
            {/* ===>>> ĐÃ SỬA LỖI NÀY (Dòng 125) <<<=== */}
            
        </>
    );
    const CardWrapper = ({ children }) => ( <motion.div variants={cardVariant} className={`p-5 rounded-xl border backdrop-blur-sm relative overflow-hidden transition-all duration-300 group hover:shadow-xl hover:-translate-y-1 ${classes.bg} ${classes.border} ${detailLink ? 'hover:border-opacity-80 cursor-pointer' : ''}`}> {children} </motion.div> );
    return detailLink
        ? <Link to={detailLink} className="focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500 rounded-xl block"><CardWrapper>{cardContent}</CardWrapper></Link>
        : <CardWrapper>{cardContent}</CardWrapper>;
});
StatCard.displayName = 'StatCard';


// ==========================================================
// === COMPONENT CHÍNH CỦA TRANG DASHBOARD (MASTER v3.2) ===
// ==========================================================
export default function RecruiterDashboardPage() {
    // --- State & Hooks Cơ bản ---
    const { user: authUser, isLoading: isAuthLoading } = useAuth();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const [isLoadingPage, setIsLoadingPage] = useState(true);
    const [activeTab, setActiveTab] = useState(() => searchParams.get('tab') || 'jobs');
    const [pageError, setPageError] = useState('');

    // --- State Dữ liệu (Jobs, Stats) ---
    const [stats, setStats] = useState({ totalStudents: 0, postedJobs: 0, totalApplicants: 0 });
    const [jobs, setJobs] = useState([]);
    const [isLoadingStats, setIsLoadingStats] = useState(true);
    const [isLoadingJobs, setIsLoadingJobs] = useState(true);
    
    // --- State Modal Ứng viên (ApplicantsModal) ---
    const [viewingApplicantsFor, setViewingApplicantsFor] = useState(null); // Job đang xem
    const [applicantsData, setApplicantsData] = useState([]);
    const [isLoadingApplicants, setIsLoadingApplicants] = useState(false);
    const [applicantsError, setApplicantsError] = useState('');
    
    // --- State Modal Chỉnh sửa Job (v3.0) ---
    const [editingJob, setEditingJob] = useState(null); // Job đang được chỉnh sửa

    // ===>>> STATE PHỎNG VẤN (v3.1) <<<===
    const [interviewTemplates, setInterviewTemplates] = useState([]); // Danh sách mẫu phỏng vấn
    const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);
    const [isCreateTemplateModalOpen, setIsCreateTemplateModalOpen] = useState(false); // Mở/đóng modal Tạo Mẫu
    const [isSendInterviewModalOpen, setIsSendInterviewModalOpen] = useState(false); // Mở/đóng modal Gửi Lời mời
    const [selectedApplicant, setSelectedApplicant] = useState(null); // SV được chọn để mời PV

    const fakeChartData = useMemo(() => Array.from({ length: 7 }, (_, i) => ({ name: `Day ${i + 1}`, value: Math.floor(Math.random() * 25) })), []);

    // --- Đồng bộ Tab với URL ---
    useEffect(() => {
        const tabFromUrl = searchParams.get('tab');
        const validTabs = ['jobs', 'search', 'interviews'];
        if (tabFromUrl && validTabs.includes(tabFromUrl)) {
            if (tabFromUrl !== activeTab) { setActiveTab(tabFromUrl); }
        } else if (!tabFromUrl && activeTab !== 'jobs') {
            changeTab('jobs'); 
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams]);

    const changeTab = useCallback((tabId) => {
        if (tabId !== activeTab) {
            setActiveTab(tabId);
            const nextParams = new URLSearchParams(searchParams);
            nextParams.set('tab', tabId);
            setSearchParams(nextParams, { replace: true });
        }
    }, [activeTab, searchParams, setSearchParams]);

    // --- Data Fetching ---
    const fetchDashboardData = useCallback(async (showLoading = true) => {
        if (showLoading) { setIsLoadingPage(true); } 
        setPageError('');
        console.log("[RecruiterDashboard] Attempting to fetch ALL dashboard data (Stats, Jobs, Templates)...");
        
        setIsLoadingStats(true);
        setIsLoadingJobs(true);
        setIsLoadingTemplates(true);
        
        try {
            const [statsRes, jobsRes, templatesRes] = await Promise.allSettled([
                getRecruiterStats(),
                getRecruiterJobs(),
                getInterviewTemplates() 
            ]);

            if (statsRes.status === 'fulfilled') { setStats(statsRes.value || { totalStudents: 0, postedJobs: 0, totalApplicants: 0 }); }
            else { console.error("[RecruiterDashboard] Failed to fetch stats:", statsRes.reason); setPageError(prev => prev || (statsRes.reason?.message || 'Lỗi tải thống kê.')); }
            
            if (jobsRes.status === 'fulfilled') { setJobs(jobsRes.value || []); }
            else { console.error("[RecruiterDashboard] Failed to fetch jobs:", jobsRes.reason); setPageError(prev => prev || (jobsRes.reason?.message || 'Lỗi tải tin tuyển dụng.')); }

            if (templatesRes.status === 'fulfilled') { setInterviewTemplates(templatesRes.value || []); }
            else { console.error("[RecruiterDashboard] Failed to fetch interview templates:", templatesRes.reason); setPageError(prev => prev || (templatesRes.reason?.message || 'Lỗi tải mẫu phỏng vấn.')); }

        } catch (error) {
            console.error("[RecruiterDashboard] Unexpected error during dashboard data fetch:", error);
            setPageError('Đã có lỗi không mong muốn xảy ra khi tải dữ liệu.');
        } finally {
            setIsLoadingPage(false);
            setIsLoadingStats(false);
            setIsLoadingJobs(false);
            setIsLoadingTemplates(false);
        }
    }, []);

    const refreshTemplates = useCallback(async () => {
        setIsLoadingTemplates(true);
        try {
            const templatesRes = await getInterviewTemplates();
            setInterviewTemplates(templatesRes || []);
        } catch (error) {
            console.error("[RecruiterDashboard] Failed to refresh interview templates:", error);
            alert("Lỗi khi làm mới danh sách mẫu phỏng vấn."); 
        } finally {
            setIsLoadingTemplates(false);
        }
    }, []);

    useEffect(() => {
        if (isAuthLoading) { return; } 
        if (!authUser || authUser.role !== 'recruiter') { navigate('/recruiter/login', { replace: true }); return; }
        fetchDashboardData();
    }, [authUser, isAuthLoading, navigate, fetchDashboardData]);

    // --- Event Handlers (CRUD Job & Modals) ---
    
    const handleJobClick = useCallback(async (job) => {
        if (!job || !job.id) return;
        setViewingApplicantsFor(job); setApplicantsData([]); setApplicantsError(''); setIsLoadingApplicants(true);
        try { const data = await getApplicantsForJob(job.id); setApplicantsData(data || []); }
        catch (err) { setApplicantsError(err.message || "Lỗi khi tải danh sách ứng viên."); }
        finally { setIsLoadingApplicants(false); }
    }, []);
    const closeApplicantsModal = useCallback(() => { setViewingApplicantsFor(null); setSelectedApplicant(null); }, []);
    
    const handleEditJob = useCallback((job) => {
        setEditingJob(job);
    }, []);
    const handleCloseEditJobModal = useCallback(() => {
        setEditingJob(null);
    }, []);
    const handleSaveJobSuccess = useCallback((updatedJob) => {
        setJobs(prevJobs => prevJobs.map(job => 
            job.id === updatedJob.id ? { ...job, ...updatedJob } : job
        ));
    }, []);

    const handleDeleteJob = useCallback(async (jobId) => {
        const jobToDelete = jobs.find(j => j.id === jobId); if (!jobToDelete) return;
        if (window.confirm(`XÁC NHẬN XÓA VĨNH VIỄN\n\nBạn có chắc chắn muốn xóa tin:\n"${jobToDelete.title}"?`)) {
            const originalJobs = [...jobs]; setJobs(prev => prev.filter(j => j.id !== jobId)); 
            try { 
                await deleteJob(jobId); 
                setStats(prev => ({...prev, postedJobs: Math.max(0, prev.postedJobs - 1)})); 
            }
            catch (error) { alert(`Lỗi khi xóa job: ${error.message}`); setJobs(originalJobs); }
        }
    }, [jobs]);
    
    const handleChangeJobStatus = useCallback(async (jobId, newStatus) => {
        const jobToChange = jobs.find(j => j.id === jobId); if (!jobToChange) return;
        const actionText = newStatus === 'Active' ? 'hiển thị lại' : 'ẩn đi';
        if (window.confirm(`XÁC NHẬN\n\nBạn có muốn ${actionText} tin:\n"${jobToChange.title}" không?`)) {
            const originalStatus = jobToChange.status;
            setJobs(prev => prev.map(j => j.id === jobId ? {...j, status: newStatus} : j)); 
            try { 
                await changeJobStatus(jobId, newStatus); 
            }
            catch (error) { alert(`Lỗi khi đổi trạng thái: ${error.message}`); setJobs(prev => prev.map(j => j.id === jobId ? {...j, status: originalStatus} : j)); }
        }
    }, [jobs]);

    // --- Event Handlers Phỏng vấn ---
    
    const handleOpenSendInviteModal = useCallback((applicant) => {
        const relatedJob = viewingApplicantsFor || jobs.find(j => j.id === applicant.jobId);
        const applicantWithJobTitle = {
            ...applicant,
            jobTitle: relatedJob?.title || 'Vị trí đã ứng tuyển'
        };
        setSelectedApplicant(applicantWithJobTitle); 
        setIsSendInterviewModalOpen(true); 
        setViewingApplicantsFor(null); 
    }, [viewingApplicantsFor, jobs]);
    
    const handleCloseSendInviteModal = useCallback(() => {
        setIsSendInterviewModalOpen(false);
        setSelectedApplicant(null);
    }, []);
    
    const handleSendInviteSubmit = useCallback(async (applicationId, templateId, message) => {
        try {
            await sendInterviewInvite(applicationId, templateId, message);
            setApplicantsData(prev => prev.map(app => 
                app.id === applicationId ? { ...app, status: 'Interview_Sent' } : app
            ));
            handleCloseSendInviteModal();
            alert("Đã gửi lời mời phỏng vấn thành công!"); 
        } catch (error) {
            console.error("[RecruiterDashboard] Error sending interview invite:", error);
            throw error; 
        }
    }, [handleCloseSendInviteModal]);

    const handleOpenCreateTemplateModal = useCallback(() => {
        setIsCreateTemplateModalOpen(true);
    }, []);
    const handleCloseCreateTemplateModal = useCallback(() => {
        setIsCreateTemplateModalOpen(false);
    }, []);
    const handleCreateTemplateSuccess = useCallback((newTemplate) => {
        setInterviewTemplates(prev => [newTemplate, ...prev]);
        handleCloseCreateTemplateModal(); 
        alert("Tạo mẫu phỏng vấn mới thành công!"); 
    }, [handleCloseCreateTemplateModal]);

    // --- Tabs Configuration ---
    const tabs = useMemo(() => [
        { 
            id: 'jobs', 
            label: 'Quản lý Tin', 
            icon: Briefcase, 
            component: <JobsManagementTab 
                            jobs={jobs} 
                            isLoading={isLoadingJobs} 
                            error={pageError} 
                            onJobClick={handleJobClick} 
                            selectedJobId={viewingApplicantsFor?.id} 
                            onEditJob={handleEditJob} 
                            onDeleteJob={handleDeleteJob} 
                            onChangeJobStatus={handleChangeJobStatus} 
                        /> 
        },
        { 
            id: 'search', 
            label: 'Tìm kiếm Ứng viên', 
            icon: Search, 
            component: <SearchTabContent /> 
        },
        { 
            id: 'interviews', 
            label: 'Phỏng vấn AI', 
            icon: ClipboardCheck, 
            component: <InterviewManagementTab 
                            onOpenCreateTemplateModal={handleOpenCreateTemplateModal} 
                            templates={interviewTemplates} 
                            isLoading={isLoadingTemplates} 
                            onRefreshTemplates={refreshTemplates} 
                        /> 
        }
    ], [jobs, isLoadingJobs, pageError, handleJobClick, viewingApplicantsFor?.id, handleEditJob, handleDeleteJob, handleChangeJobStatus, interviewTemplates, isLoadingTemplates, handleOpenCreateTemplateModal, refreshTemplates]);


    // --- Render Logic ---
    if (isLoadingPage || isAuthLoading) { return <div className="bg-gray-900 min-h-screen flex items-center justify-center"><LoadingSpinner text="Đang tải Trung tâm Chỉ huy..." size="lg" /></div>; }
    if (pageError && (!Array.isArray(jobs) || jobs.length === 0)) { return <div className="bg-gray-900 min-h-screen flex items-center justify-center p-6"><ErrorDisplay message={pageError} details="Không thể tải dữ liệu dashboard." onRetry={fetchDashboardData} /></div>; }

    return (
        <>
            <Helmet> <title>Trung tâm Chỉ huy Tuyển dụng | EduLedger AI</title> </Helmet>
            <div className="bg-gradient-to-br from-gray-900 via-gray-900 to-indigo-900/20 min-h-screen text-white">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12 relative">
                    {/* ... (Header Section) ... */}
                    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-8 md:mb-10 relative z-10">
                        <div>
                            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-1.5 flex items-center gap-3"><LayoutDashboard className="text-blue-400"/> Trung tâm Chỉ huy</h1>
                            <p className="text-gray-400 text-base">Chào mừng, <span className="font-semibold text-gray-300">{authUser?.name || 'Nhà tuyển dụng'}</span>!</p>
                            {authUser?.companyName && <Link to="/recruiter/company/edit" className="text-xs text-gray-500 hover:text-blue-400 transition mt-1 flex items-center gap-1.5 w-fit"><Building className="w-3 h-3"/> {authUser.companyName} (Chỉnh sửa)</Link>}
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3 flex-shrink-0 mt-2 md:mt-0">
                            <Link to="/recruiter/company/edit" className="order-2 sm:order-1 bg-gray-700/80 text-white font-semibold py-2.5 px-5 rounded-lg hover:bg-gray-700 transition-all duration-300 flex items-center justify-center gap-2 shadow text-sm backdrop-blur-sm border border-gray-600/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-500"><Edit className="w-4 h-4" /> Hồ sơ Công ty</Link>
                            <Link to="/recruiter/jobs/new" className="order-1 sm:order-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-2.5 px-6 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 flex items-center justify-center gap-2 shadow-lg text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"><Plus className="w-5 h-5" /> Đăng tin mới</Link>
                        </div>
                    </motion.div>
                    
                    {/* ... (Stats Section) ... */}
                    <motion.div variants={{ visible: { transition: { staggerChildren: 0.1 } } }} initial="hidden" animate="visible" className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6 mb-10 md:mb-12 relative z-10">
                        <StatCard title="Hồ sơ Sinh viên (Toàn hệ thống)" value={stats.totalStudents} icon={Users} color="blue" isLoading={isLoadingStats} data={fakeChartData} detailLink={`/recruiter/dashboard?tab=search`} />
                        <StatCard title="Tin Tuyển dụng Đã đăng" value={stats.postedJobs} icon={Briefcase} color="green" isLoading={isLoadingStats} data={fakeChartData} detailLink={`/recruiter/dashboard?tab=jobs`}/>
                        <StatCard title="Tổng Lượt Ứng tuyển (Vào tin của bạn)" value={stats.totalApplicants} icon={TrendingUp} color="purple" isLoading={isLoadingStats} data={fakeChartData} />
                    </motion.div>
                    
                    {/* ... (Tab Navigation) ... */}
                    <div className="border-b border-gray-700/80 mb-8 sticky top-[calc(theme(spacing.16)-1px)] sm:top-[calc(theme(spacing.18)-1px)] bg-gray-900/80 backdrop-blur-md z-20 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 pb-px shadow-sm">
                        <nav className="-mb-px flex space-x-6 sm:space-x-8 overflow-x-auto scrollbar-hide" aria-label="Dashboard Tabs">
                            {tabs.map(tab => (
                                <button key={tab.id} onClick={() => changeTab(tab.id)} className={`whitespace-nowrap pt-4 pb-3 px-1 border-b-2 font-semibold text-sm transition-all duration-200 focus:outline-none flex items-center gap-2 group relative ${activeTab === tab.id ? 'border-blue-500 text-blue-400' : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500/50'}`} aria-current={activeTab === tab.id ? 'page' : undefined}>
                                    <tab.icon className={`w-4 h-4 transition-colors ${activeTab === tab.id ? 'text-blue-400' : 'text-gray-500 group-hover:text-gray-300'}`} /> {tab.label}
                                    {activeTab === tab.id && <motion.div className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-blue-500 rounded-t-full" layoutId="recruiterTabUnderline" transition={{ type: 'spring', stiffness: 350, damping: 30 }} />}
                                </button>
                            ))}
                        </nav>
                    </div>
                    
                    {/* ... (Tab Content) ... */}
                    <div className="relative z-10">
                        <AnimatePresence mode="wait">
                            <motion.div key={activeTab} variants={tabContentVariant} initial="initial" animate="animate" exit="exit">
                                {tabs.find(tab => tab.id === activeTab)?.component}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>
                
                {/* ===>>> ĐÃ SỬA LỖI NÀY (Dòng 319) <<<=== */}
                
            </div>

            {/* ===>>> MODALS "ĐẲNG CẤP" (v3.2) <<<=== */}
            <AnimatePresence>
                {/* Modal 1: Xem Ứng viên */}
                {viewingApplicantsFor && (
                    <ApplicantsModal
                        key={`modal-applicants-${viewingApplicantsFor.id}`}
                        job={viewingApplicantsFor}
                        onClose={closeApplicantsModal}
                        applicants={applicantsData}
                        isLoading={isLoadingApplicants}
                        error={applicantsError}
                        setApplicants={setApplicantsData}
                        onOpenSendInviteModal={handleOpenSendInviteModal}
                    />
                )}
                
                {/* Modal 2: Gửi Lời mời Phỏng vấn */}
                {isSendInterviewModalOpen && selectedApplicant && (
                    <SendInterviewModal
                        key="modal-send-invite"
                        applicant={selectedApplicant}
                        templates={interviewTemplates} 
                        onClose={handleCloseSendInviteModal}
                        onSubmit={handleSendInviteSubmit}
                    />
                )}
                
                {/* Modal 3: Tạo Mẫu Phỏng vấn AI */}
                {isCreateTemplateModalOpen && (
                    <CreateInterviewTemplateModal
                        key="modal-create-template"
                        jobs={jobs.filter(j => j.status === 'Active')} 
                        onClose={handleCloseCreateTemplateModal}
                        onSuccess={handleCreateTemplateSuccess}
                    />
                )}
                
                {/* Modal 4: Chỉnh sửa Job */}
                {editingJob && (
                    <EditJobModal
                        key={`modal-edit-job-${editingJob.id}`}
                        job={editingJob}
                        onClose={handleCloseEditJobModal}
                        onSaveSuccess={handleSaveJobSuccess}
                    />
                )}
            </AnimatePresence>
        </>
    );
}