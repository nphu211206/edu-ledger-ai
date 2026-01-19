// File: client/src/components/recruiter/modals/InterviewResultDetailModal.jsx
// PHIÊN BẢN v3.2 - "HOÀN HẢO HÓA ĐƯỜNG DẪN" (Fix ../../../)

import React, { useMemo, memo } from 'react';
import { motion } from 'framer-motion';
import { LoadingSpinner } from '../../../components/common/FeedbackComponents';import { X, UserRoundCheck, Bot, Medal, ThumbsUp, ThumbsDown, HelpCircle } from 'lucide-react';

// ... (Toàn bộ logic bên trong component này giữ nguyên) ...
// (Animation variants, const InterviewResultDetailModal = ..., getScoreColor, getScoreIcon, JSX...)
const modalFadeVariant = { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } };
const modalSlideVariant = { initial: { y: 50, opacity: 0 }, animate: { y: 0, opacity: 1 }, exit: { y: 50, opacity: 0 }, transition: { type: "spring", stiffness: 300, damping: 30 } };

const InterviewResultDetailModal = ({ resultData, onClose }) => {
    const { interviewDetails, answersWithGrading } = resultData || {};
    const getScoreColor = (score) => {
        if (score === null || score === undefined) return 'text-gray-500';
        if (score >= 85) return 'text-green-400';
        if (score >= 70) return 'text-yellow-400';
        if (score >= 50) return 'text-orange-400';
        return 'text-red-500';
    };
    const getScoreIcon = (score) => {
        if (score === null || score === undefined) return <HelpCircle className="w-5 h-5 text-gray-500" />;
        if (score >= 85) return <Medal className="w-5 h-5 text-green-400" />;
        if (score >= 70) return <ThumbsUp className="w-5 h-5 text-yellow-400" />;
        return <ThumbsDown className="w-5 h-5 text-red-500" />;
    };
    return (
        <motion.div variants={modalFadeVariant} initial="initial" animate="animate" exit="exit" className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-[120] p-4 backdrop-blur-md" onClick={onClose}>
            <motion.div variants={modalSlideVariant} className="bg-gray-900 rounded-xl border border-gray-700 w-full max-w-6xl text-white flex flex-col overflow-hidden shadow-2xl max-h-[95vh]" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="p-5 border-b border-gray-700 flex justify-between items-center flex-shrink-0">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
                        <UserRoundCheck className="w-6 h-6 text-green-400"/> Kết quả Phỏng vấn AI
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition rounded-full p-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900"> <X className="w-6 h-6" /> </button>
                </div>
                {/* Body (Chia 2 cột) */}
                {!interviewDetails ? (
                    <div className="min-h-[60vh] flex items-center justify-center">
                        <LoadingSpinner text="Đang tải chi tiết..." />
                    </div>
                ) : (
                    <div className="flex flex-col md:flex-row flex-grow overflow-hidden min-h-[70vh]">
                        {/* Cột 1: Thông tin chung & Đánh giá tổng kết */}
                        <div className="w-full md:w-1/3 flex-shrink-0 p-6 space-y-6 border-b md:border-b-0 md:border-r border-gray-700 overflow-y-auto styled-scrollbar">
                            {/* Thông tin SV */}
                            <div className="flex items-center gap-3">
                                <img src={interviewDetails.studentAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(interviewDetails.studentName || interviewDetails.githubUsername)}&background=random&color=ffffff&size=64`} alt="Avatar" className="w-12 h-12 rounded-full object-cover"/>
                                <div>
                                    <p className="font-semibold text-lg text-blue-300">{interviewDetails.studentName}</p>
                                    <p className="text-sm text-gray-400">@{interviewDetails.githubUsername}</p>
                                </div>
                            </div>
                            {/* Thông tin Bài test */}
                            <div className="text-sm text-gray-400 space-y-2 border-t border-b border-gray-700/60 py-4">
                                <p><span className="font-semibold text-gray-300 w-24 inline-block">Vị trí:</span> {interviewDetails.jobTitle}</p>
                                <p><span className="font-semibold text-gray-300 w-24 inline-block">Mẫu test:</span> {interviewDetails.templateTitle}</p>
                                <p><span className="font-semibold text-gray-300 w-24 inline-block">Nộp bài:</span> {new Date(interviewDetails.timeSubmitted).toLocaleString('vi-VN')}</p>
                            </div>
                            {/* Điểm tổng kết */}
                            <div className="text-center bg-gray-800 p-6 rounded-lg border border-gray-700">
                                <p className="text-gray-400 text-xs uppercase tracking-widest font-medium">Điểm Tổng kết (AI)</p>
                                <p className={`text-7xl font-bold ${getScoreColor(interviewDetails.overallScore)}`}>
                                    {interviewDetails.overallScore !== null ? interviewDetails.overallScore : '?'}
                                    <span className="text-3xl text-gray-500 font-normal">/100</span>
                                </p>
                            </div>
                            {/* Nhận định chung */}
                            <div className="bg-gray-800 p-5 rounded-lg border border-gray-700">
                                <h4 className="font-semibold text-purple-300 mb-3 text-md flex items-center gap-2"><Bot className="w-5 h-5"/> Nhận định Chung của AI:</h4>
                                <p className="text-gray-300 text-sm whitespace-pre-line leading-relaxed">{interviewDetails.aiOverallEvaluation || "AI chưa có nhận định chung."}</p>
                            </div>
                        </div>
                        {/* Cột 2: So sánh Side-by-Side */}
                        <div className="w-full md:w-2/3 flex-grow p-6 overflow-y-auto styled-scrollbar space-y-5">
                            <h3 className="text-lg font-semibold text-gray-200">Chi tiết Bài làm ({answersWithGrading?.length || 0} câu)</h3>
                            {answersWithGrading && answersWithGrading.length > 0 ? (
                                answersWithGrading.map((item, index) => (
                                    <motion.div 
                                        key={item.questionId} 
                                        initial={{opacity: 0, y: 10}} animate={{opacity: 1, y: 0}} transition={{delay: index * 0.1}}
                                        className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden"
                                    >
                                        {/* (Phần JSX bên trong giữ nguyên) */}
                                        <div className="p-4 bg-gray-700/50 border-b border-gray-700">
                                            <p className="text-sm font-semibold text-blue-300 mb-1">Câu {item.questionOrder}:</p>
                                            <p className="text-gray-200">{item.questionText}</p>
                                        </div>
                                        <div className="p-4 border-b border-gray-700/50">
                                            <p className="text-xs font-semibold text-gray-400 mb-2">Sinh viên trả lời:</p>
                                            <p className="text-gray-300 text-sm whitespace-pre-line">{item.answerText || <span className="italic text-gray-500">(Bỏ trống)</span>}</p>
                                        </div>
                                        <details className="p-4 border-b border-gray-700/50">
                                            <summary className="cursor-pointer text-xs text-gray-500 hover:text-gray-300">Xem Barem điểm (Câu trả lời lý tưởng)</summary>
                                            <p className="text-gray-400 italic text-sm mt-2 p-3 bg-gray-900/50 rounded">{item.idealAnswer}</p>
                                        </details>
                                        <div className={`p-4 flex justify-between items-start gap-4 ${getScoreColor(item.aiScore)} bg-opacity-10`}>
                                            <div className="flex-grow">
                                                <p className="text-sm font-semibold mb-1 flex items-center gap-1.5">
                                                    {getScoreIcon(item.aiScore)}
                                                    Đánh giá của AI:
                                                </p>
                                                <p className="text-sm text-gray-300">{item.aiEvaluation || "Chưa có đánh giá."}</p>
                                            </div>
                                            <div className={`text-2xl font-bold ${getScoreColor(item.aiScore)} flex-shrink-0`}>
                                                {item.aiScore !== null ? `${item.aiScore}` : '?'}
                                                <span className="text-base text-gray-500">/100</span>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))
                            ) : (
                                <p className="text-gray-500 italic">Không tìm thấy chi tiết câu trả lời.</p>
                            )}
                        </div>
                    </div>
                )}
                {/* Footer */}
                <div className="p-4 border-t border-gray-700 flex justify-end bg-gray-800/80 backdrop-blur-sm flex-shrink-0">
                    <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }} onClick={onClose} className="py-2 px-6 bg-gray-600 rounded-md hover:bg-gray-500 transition duration-200 text-white font-semibold text-sm">Đóng</motion.button>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default memo(InterviewResultDetailModal);