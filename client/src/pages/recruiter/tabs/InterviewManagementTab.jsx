// File: client/src/components/recruiter/tabs/InterviewManagementTab.jsx
// PHIÊN BẢN v3.2 - "HOÀN HẢO HÓA ĐƯỜNG DẪN" (Fix ../../../ và ../)

import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getInterviewResults, gradeInterviewAI, getInterviewResultDetail } from '../../../services/api'; // <<<=== SỬA
import { LoadingSpinner, ErrorDisplay, EmptyState } from '../../../components/common/FeedbackComponents';
import InterviewResultDetailModal from '../modals/InterviewResultDetailModal'; // <<<=== SỬA
import { 
    BookCopy, UserRoundCheck, RefreshCw, Bot, CheckSquare, Clock, Eye, FileText, 
    Send, XCircle, UserCheck, HelpCircle, X, BrainCircuit, Medal, ThumbsUp, ThumbsDown, Trash2,
    Sparkles 
} from 'lucide-react';

// ... (Toàn bộ logic bên trong component này giữ nguyên) ...
// (Animation variants, InterviewTemplateList, InterviewResultList, InterviewManagementTab...)
const tabContentVariant = { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -10 }, transition: { duration: 0.2 } };
const listItemVariant = { initial: { opacity: 0, x: -20 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: 20 } };

const InterviewTemplateList = memo(({ templates, isLoading }) => {
    if (isLoading) { return <LoadingSpinner text="Đang tải danh sách mẫu..." />; }
    if (templates.length === 0) { return <EmptyState icon={BookCopy} title="Chưa có Mẫu Phỏng vấn nào" message="Hãy nhấn 'Tạo Mẫu Phỏng vấn (AI)' để AI tự động tạo bộ câu hỏi dựa trên tin tuyển dụng của bạn."/>; }
    return (
        <div className="bg-gray-800/70 rounded-xl border border-gray-700/80 overflow-hidden shadow-lg backdrop-blur-sm">
            <table className="w-full text-sm text-left text-gray-400 min-w-[700px]">
                <thead className="text-xs text-gray-300 uppercase bg-gray-700/60">
                    <tr>
                        <th scope="col" className="p-4 w-[35%]">Tên Mẫu Phỏng vấn</th>
                        <th scope="col" className="p-4 w-[35%]">Tin Tuyển dụng Gốc</th>
                        <th scope="col" className="p-4 text-center">Thời gian</th>
                        <th scope="col" className="p-4 text-center">Ngày tạo</th>
                    </tr>
                </thead>
                <motion.tbody layout>
                    <AnimatePresence>
                        {templates.map(template => (
                            <motion.tr key={template.id} variants={listItemVariant} initial="initial" animate="animate" exit="exit" className="border-b border-gray-700/80 hover:bg-gray-700/50">
                                <td className="p-4 font-semibold text-white">{template.title}</td>
                                <td className="p-4 text-blue-400">{template.jobTitle || '(Không có)'}</td>
                                <td className="p-4 text-center font-mono">{template.timeLimitMinutes} phút</td>
                                <td className="p-4 text-center">{new Date(template.createdAt).toLocaleDateString('vi-VN')}</td>
                            </motion.tr>
                        ))}
                    </AnimatePresence>
                </motion.tbody>
            </table>
        </div>
    );
});
InterviewTemplateList.displayName = 'InterviewTemplateList';

const InterviewResultList = memo(() => {
    const [results, setResults] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [gradingId, setGradingId] = useState(null); 
    const [viewingResult, setViewingResult] = useState(null); 
    const [isDetailLoading, setIsDetailLoading] = useState(false); 
    const fetchResults = useCallback(async (showLoading = true) => {
        if (showLoading) setIsLoading(true); 
        setError('');
        try {
            const data = await getInterviewResults();
            setResults(data || []);
        } catch (err) { setError(err.message || "Lỗi tải kết quả phỏng vấn."); }
        finally { if (showLoading) setIsLoading(false); }
    }, []);
    useEffect(() => { fetchResults(); }, [fetchResults]);
    const handleGradeInterview = useCallback(async (interviewId) => {
        if (gradingId) return; 
        setGradingId(interviewId);
        try {
            await gradeInterviewAI(interviewId);
            setResults(prev => prev.map(r => r.studentInterviewId === interviewId ? { ...r, status: 'Grading' } : r));
            alert("Đã gửi yêu cầu chấm bài cho AI. Trạng thái sẽ tự động cập nhật sau vài phút (yêu cầu làm mới danh sách).");
            setTimeout(() => fetchResults(false), 60000); 
        } catch (err) {
            alert(`Lỗi khi yêu cầu AI chấm bài: ${err.message}`);
        } finally {
            setGradingId(null);
        }
    }, [gradingId, fetchResults]);
    const handleViewResult = useCallback(async (interviewId) => {
        setIsDetailLoading(true); 
        try {
            const data = await getInterviewResultDetail(interviewId);
            setViewingResult(data); 
        } catch (err) {
            alert(`Lỗi tải chi tiết kết quả: ${err.message}`);
        } finally {
            setIsDetailLoading(false);
        }
    }, []);
    const handleCloseResultDetail = () => setViewingResult(null);
    if (isLoading && results.length === 0) { return <LoadingSpinner text="Đang tải kết quả phỏng vấn..." />; }
    if (error) { return <ErrorDisplay message={error} onRetry={() => fetchResults(true)} />; }
    const getResultStatusClass = (status) => {
        switch (status) {
            case 'Submitted': return 'text-yellow-400 bg-yellow-900/50';
            case 'Grading': return 'text-purple-400 bg-purple-900/50 animate-pulse';
            case 'Graded': return 'text-green-400 bg-green-900/50';
            default: return 'text-gray-400 bg-gray-700/50';
        }
    };
    return (
        <>
            <div className="flex justify-end mb-4">
                <button 
                    onClick={() => fetchResults(true)} 
                    disabled={isLoading}
                    className="flex items-center gap-2 text-xs text-gray-400 hover:text-white bg-gray-700/50 hover:bg-gray-700 px-3 py-1.5 rounded-md transition"
                >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                    Làm mới Danh sách
                </button>
            </div>
            {results.length === 0 ? (
                <EmptyState icon={UserRoundCheck} title="Chưa có kết quả phỏng vấn" message="Khi sinh viên nộp bài phỏng vấn, kết quả sẽ xuất hiện tại đây để bạn chấm điểm."/>
            ) : (
                <div className="bg-gray-800/70 rounded-xl border border-gray-700/80 overflow-hidden shadow-lg backdrop-blur-sm">
                    <table className="w-full text-sm text-left text-gray-400 min-w-[800px]">
                        <thead className="text-xs text-gray-300 uppercase bg-gray-700/60">
                            <tr>
                                <th scope="col" className="p-4 w-[25%]">Ứng viên</th>
                                <th scope="col" className="p-4 w-[25%]">Vị trí Ứng tuyển</th>
                                <th scope="col" className="p-4 text-center">Trạng thái</th>
                                <th scope="col" className="p-4 text-center">Điểm số (AI)</th>
                                <th scope="col" className="p-4 text-center">Ngày nộp</th>
                                <th scope="col" className="p-4 text-center w-[15%]">Actions</th>
                            </tr>
                        </thead>
                        <motion.tbody layout>
                            <AnimatePresence>
                                {results.map(result => (
                                    <motion.tr key={result.studentInterviewId} variants={listItemVariant} initial="initial" animate="animate" exit="exit" className="border-b border-gray-700/80 hover:bg-gray-700/50">
                                        <td className="p-4 font-semibold text-white flex items-center gap-3">
                                            <img src={result.studentAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(result.studentName || result.githubUsername)}&background=random&color=ffffff&size=64`} alt="avatar" className="w-8 h-8 rounded-full bg-gray-600 object-cover"/>
                                            {result.studentName || result.githubUsername}
                                        </td>
                                        <td className="p-4 text-blue-400">{result.jobTitle || 'N/A'}</td>
                                        <td className="p-4 text-center">
                                            <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${getResultStatusClass(result.status)}`}>{result.status}</span>
                                        </td>
                                        <td className={`p-4 text-center font-mono text-lg ${result.overallScore > 80 ? 'text-green-400' : (result.overallScore > 60 ? 'text-yellow-400' : 'text-red-500')}`}>
                                            {result.status === 'Graded' ? `${result.overallScore || 0}/100` : '...'}
                                        </td>
                                        <td className="p-4 text-center">{new Date(result.timeSubmitted).toLocaleDateString('vi-VN')}</td>
                                        <td className="p-4 text-center">
                                            {result.status === 'Submitted' && (
                                                <button onClick={() => handleGradeInterview(result.studentInterviewId)} disabled={gradingId === result.studentInterviewId} className="text-sm font-medium text-purple-400 hover:text-purple-300 disabled:opacity-50 disabled:cursor-wait">
                                                    {gradingId === result.studentInterviewId ? 'Đang gửi...' : 'Chấm điểm (AI)'}
                                                </button>
                                            )}
                                            {result.status === 'Graded' && (
                                                <button onClick={() => handleViewResult(result.studentInterviewId)} className="text-sm font-medium text-green-400 hover:text-green-300">
                                                    Xem Chi tiết
                                                </button>
                                            )}
                                            {result.status === 'Grading' && (
                                                <span className="text-sm text-purple-400 italic animate-pulse">AI Đang chấm...</span>
                                            )}
                                        </td>
                                    </motion.tr>
                                ))}
                            </AnimatePresence>
                        </motion.tbody>
                    </table>
                </div>
            )}
            
            <AnimatePresence>
                {isDetailLoading && (
                    <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-[125] p-4 backdrop-blur-md">
                        <LoadingSpinner text="Đang tải chi tiết bài làm..." size="lg" />
                    </div>
                )}
                {viewingResult && !isDetailLoading && (
                    <InterviewResultDetailModal
                        resultData={viewingResult}
                        onClose={handleCloseResultDetail}
                    />
                )}
            </AnimatePresence>
        </>
    );
});
InterviewResultList.displayName = 'InterviewResultList';

const InterviewManagementTab = ({ onOpenCreateTemplateModal, templates, isLoading, onRefreshTemplates }) => {
    const [subTab, setSubTab] = useState('templates'); 
    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                {/* Thanh chuyển tab con */}
                <div className="flex items-center gap-2 rounded-lg bg-gray-800 p-1.5 border border-gray-700">
                    <button
                        onClick={() => setSubTab('templates')}
                        className={`py-1.5 px-4 rounded-md text-sm font-semibold transition ${subTab === 'templates' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-400 hover:text-white'}`}
                    >
                        <BookCopy className="w-4 h-4 inline mr-1.5"/> Quản lý Mẫu Phỏng vấn
                    </button>
                    <button
                        onClick={() => setSubTab('results')}
                        className={`py-1.5 px-4 rounded-md text-sm font-semibold transition ${subTab === 'results' ? 'bg-green-600 text-white shadow-sm' : 'text-gray-400 hover:text-white'}`}
                    >
                        <UserRoundCheck className="w-4 h-4 inline mr-1.5"/> Kết quả của Ứng viên
                    </button>
                </div>
                {/* Nút Tạo Mẫu Mới */}
                <AnimatePresence>
                {subTab === 'templates' && (
                    <motion.div initial={{opacity: 0, width: 0}} animate={{opacity: 1, width: 'auto'}} exit={{opacity: 0, width: 0}} className="flex gap-2">
                        <motion.button
                            onClick={onRefreshTemplates}
                            title="Làm mới danh sách mẫu"
                            className="flex items-center justify-center p-2.5 bg-gray-700 text-gray-300 font-bold rounded-lg hover:bg-gray-600 transition duration-300"
                            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                        >
                            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
                        </motion.button>
                        <motion.button
                            onClick={onOpenCreateTemplateModal}
                            className="flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold py-2.5 px-5 rounded-lg hover:shadow-lg hover:opacity-90 transition duration-300 transform hover:-translate-y-0.5"
                            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}
                        >
                            <Sparkles className="w-5 h-5" /> Tạo Mẫu Phỏng vấn (AI)
                        </motion.button>
                    </motion.div>
                )}
                </AnimatePresence>
            </div>
            {/* Hiển thị nội dung tab con */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={subTab} 
                    variants={tabContentVariant}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                >
                    {subTab === 'templates' ? (
                        <InterviewTemplateList templates={templates} isLoading={isLoading} />
                    ) : (
                        <InterviewResultList /> 
                    )}
                </motion.div>
            </AnimatePresence>
        </div>
    );
};

export default memo(InterviewManagementTab);