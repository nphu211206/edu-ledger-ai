// File: client/src/components/recruiter/modals/CreateInterviewTemplateModal.jsx
// PHIÊN BẢN v3.2 - "HOÀN HẢO HÓA ĐƯỜNG DẪN" (Fix ../../../)

import React, { useState, useEffect, useMemo, memo } from 'react';
import { motion } from 'framer-motion';
import { createInterviewTemplate } from '../../../services/api'; // <<<=== SỬA
import { LoadingSpinner, ErrorDisplay, EmptyState } from '../../../components/common/FeedbackComponents';import { X, Sparkles, Bot, FileQuestion } from 'lucide-react';

// ... (Toàn bộ logic bên trong component này giữ nguyên) ...
// (Animation variants, const CreateInterviewTemplateModal = ..., useEffect, handleGenerateByAI, handleComplete, JSX...)
const modalFadeVariant = { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } };
const modalSlideVariant = { initial: { y: 50, opacity: 0 }, animate: { y: 0, opacity: 1 }, exit: { y: 50, opacity: 0 }, transition: { type: "spring", stiffness: 300, damping: 30 } };
const CreateInterviewTemplateModal = ({ jobs = [], onClose, onSuccess }) => {
    const [selectedJobId, setSelectedJobId] = useState('');
    const [title, setTitle] = useState('');
    const [focusSkills, setFocusSkills] = useState('');
    const [questionCount, setQuestionCount] = useState(7);
    const [difficulty, setDifficulty] = useState('Junior');
    const [isLoading, setIsLoading] = useState(false); 
    const [error, setError] = useState('');
    const [aiResult, setAiResult] = useState(null); 
    useEffect(() => {
        if (selectedJobId) {
            const selectedJob = jobs.find(j => j.id === parseInt(selectedJobId));
            if (selectedJob) {
                setTitle(`Bài phỏng vấn cho: ${selectedJob.title}`);
                setFocusSkills(selectedJob.skills?.slice(0, 3).join(', ') || '');
                const exp = selectedJob.experienceLevel?.toLowerCase() || '';
                if (exp.includes('intern')) setDifficulty('Intern');
                else if (exp.includes('senior')) setDifficulty('Senior');
                else if (exp.includes('mid')) setDifficulty('Mid-level');
                else setDifficulty('Junior');
            }
        } else {
            setTitle(''); setFocusSkills(''); setDifficulty('Junior');
        }
    }, [selectedJobId, jobs]);
    const handleGenerateByAI = async () => {
        if (!selectedJobId) { setError("Vui lòng chọn một Tin Tuyển dụng để AI phân tích."); return; }
        if (!title.trim()) { setError("Vui lòng nhập Tên Mẫu Phỏng vấn."); return; }
        setIsLoading(true); setError(''); setAiResult(null);
        try {
            const result = await createInterviewTemplate({
                jobId: parseInt(selectedJobId),
                title: title.trim(),
                focusSkills: focusSkills.trim(),
                questionCount: parseInt(questionCount) || 7,
                difficulty: difficulty
            });
            setAiResult(result); 
        } catch (err) {
            setError(err.message || "Lỗi khi gọi AI tạo câu hỏi. (Có thể do AI bị quá tải, JD quá ngắn, hoặc lỗi cấu hình).");
        } finally {
            setIsLoading(false);
        }
    };
    const handleComplete = () => {
        if (aiResult) {
            onSuccess(aiResult); 
        } else {
            setError("Vui lòng tạo câu hỏi bằng AI trước khi hoàn tất.");
        }
    };
    return (
        <motion.div variants={modalFadeVariant} initial="initial" animate="animate" exit="exit" className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-[110] p-4 backdrop-blur-md" onClick={onClose}>
            <motion.div variants={modalSlideVariant} className="bg-gray-800 rounded-xl border border-gray-700 w-full max-w-4xl text-white flex flex-col overflow-hidden shadow-2xl max-h-[95vh]" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="p-5 border-b border-gray-700 flex justify-between items-center flex-shrink-0">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
                        <Sparkles className="w-6 h-6 text-purple-400"/> Tạo Mẫu Phỏng vấn (AI)
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition rounded-full p-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800"> <X className="w-6 h-6" /> </button>
                </div>
                {/* Body */}
                <div className="flex flex-col md:flex-row flex-grow overflow-hidden min-h-[60vh]">
                    {/* Cột 1: Cấu hình */}
                    <div className="w-full md:w-1/3 flex-shrink-0 p-6 space-y-5 border-b md:border-b-0 md:border-r border-gray-700 overflow-y-auto styled-scrollbar">
                        <h3 className="text-lg font-semibold text-gray-200">1. Cấu hình AI</h3>
                        {error && <ErrorDisplay message={error} />}
                        <div>
                            <label htmlFor="jobId" className="block text-sm font-medium text-gray-300 mb-1.5">Chọn Tin Tuyển dụng (Để AI phân tích) *</label>
                            <select id="jobId" value={selectedJobId} onChange={(e) => setSelectedJobId(e.target.value)} className="w-full p-2.5 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                                <option value="">-- Chọn một tin tuyển dụng --</option>
                                {jobs.map(job => <option key={job.id} value={job.id}>{job.title}</option>)}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-1.5">Tên Mẫu Phỏng vấn *</label>
                            <input type="text" id="title" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full p-2.5 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                        </div>
                        <div>
                            <label htmlFor="focusSkills" className="block text-sm font-medium text-gray-300 mb-1.5">Kỹ năng tập trung (cách nhau bằng dấu phẩy)</label>
                            <input type="text" id="focusSkills" value={focusSkills} onChange={(e) => setFocusSkills(e.target.value)} className="w-full p-2.5 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="VD: React Hooks, Redux"/>
                        </div>
                        <div className="flex gap-4">
                            <div className="flex-1">
                                <label htmlFor="questionCount" className="block text-sm font-medium text-gray-300 mb-1.5">Số câu hỏi</label>
                                <input type="number" id="questionCount" value={questionCount} onChange={(e) => setQuestionCount(e.target.value)} min="3" max="20" className="w-full p-2.5 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                            </div>
                            <div className="flex-1">
                                <label htmlFor="difficulty" className="block text-sm font-medium text-gray-300 mb-1.5">Cấp bậc</label>
                                <select id="difficulty" value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className="w-full p-2.5 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                                    <option value="Intern">Intern</option>
                                    <option value="Junior">Junior</option>
                                    <option value="Mid-level">Mid-level</option>
                                    <option value="Senior">Senior</option>
                                </select>
                            </div>
                        </div>
                        <button
                            onClick={handleGenerateByAI}
                            disabled={isLoading}
                            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-3 px-5 rounded-lg transition-all duration-300 hover:shadow-lg disabled:opacity-60"
                        >
                            {isLoading ? <LoadingSpinner size="sm" text="AI đang tạo..." /> : ( <><Bot className="w-5 h-5"/> AI Tạo Bộ câu hỏi</> )}
                        </button>
                    </div>
                    {/* Cột 2: Kết quả từ AI */}
                    <div className="w-full md:w-2/3 flex-grow p-6 overflow-y-auto styled-scrollbar">
                        <h3 className="text-lg font-semibold text-gray-200 mb-4">2. Kết quả (AI Đề xuất)</h3>
                        {isLoading && <LoadingSpinner text="AI đang suy nghĩ, vui lòng chờ 10-20 giây..." />}
                        {!isLoading && !aiResult && <EmptyState icon={FileQuestion} title="Chờ Tạo Câu hỏi" message="Sau khi cấu hình bên trái và nhấn nút, bộ câu hỏi do AI tạo ra sẽ xuất hiện tại đây để bạn xem trước." />}
                        {aiResult && (
                            <motion.div initial={{opacity: 0}} animate={{opacity: 1}} className="space-y-5">
                                <div className="text-center bg-gray-700/50 p-4 rounded-lg border border-gray-600">
                                    <p className="text-sm text-gray-400">Thời gian làm bài (AI đề xuất)</p>
                                    <p className="text-3xl font-bold text-yellow-400">{aiResult.timeLimitMinutes} phút</p>
                                </div>
                                <div className="space-y-4">
                                    {aiResult.questions.map((q, index) => (
                                        <div key={index} className="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
                                            <p className="text-sm font-semibold text-blue-300 mb-2">Câu {index + 1}: (Loại: {q.questionType || 'Kỹ thuật'})</p>
                                            <p className="text-gray-200 mb-3">{q.questionText}</p>
                                            <details className="text-xs">
                                                <summary className="cursor-pointer text-gray-500 hover:text-gray-300">Xem Barem điểm (Câu trả lời lý tưởng)</summary>
                                                <p className="text-gray-400 italic mt-2 p-3 bg-gray-800 rounded">{q.idealAnswer}</p>
                                            </details>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </div>
                </div>
                {/* Footer */}
                <div className="p-4 border-t border-gray-700 flex justify-between items-center bg-gray-800/80 backdrop-blur-sm flex-shrink-0">
                    <p className="text-xs text-gray-500 italic">Bước 1: Cấu hình. Bước 2: AI Tạo. Bước 3: Hoàn tất.</p>
                    <div className="flex gap-3">
                        <button onClick={onClose} className="py-2 px-5 bg-gray-600 rounded-md hover:bg-gray-500 transition duration-200 text-white font-semibold text-sm">Hủy</button>
                        <button
                            onClick={handleComplete}
                            disabled={!aiResult || isLoading} 
                            className="py-2 px-6 bg-green-600 rounded-md hover:bg-green-500 transition duration-200 text-white font-semibold text-sm disabled:opacity-50"
                        >
                            Hoàn tất & Lưu Mẫu
                        </button>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default memo(CreateInterviewTemplateModal);