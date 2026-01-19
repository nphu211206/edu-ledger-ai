// File: client/src/components/recruiter/modals/SendInterviewModal.jsx
// PHIÊN BẢN v3.2 - "HOÀN HẢO HÓA ĐƯỜNG DẪN" (Fix ../../../)

import React, { useState, useMemo, memo } from 'react';
import { motion } from 'framer-motion';
import { LoadingSpinner, ErrorDisplay } from "../../../components/common/FeedbackComponents";
import { X, Send } from 'lucide-react';

// ... (Toàn bộ logic bên trong component này giữ nguyên) ...
// (Animation variants, const SendInterviewModal = ..., defaultMessage, handleSubmit, JSX...)
const modalFadeVariant = { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } };
const modalSlideVariant = { initial: { y: 50, opacity: 0 }, animate: { y: 0, opacity: 1 }, exit: { y: 50, opacity: 0 }, transition: { type: "spring", stiffness: 300, damping: 30 } };

const SendInterviewModal = ({ applicant, templates, onClose, onSubmit }) => {
    const [selectedTemplateId, setSelectedTemplateId] = useState('');
    const defaultMessage = useMemo(() => (
        `Chào ${applicant.student.name || applicant.student.githubUsername},\n\n` +
        `Công ty chúng tôi đã xem xét hồ sơ của bạn cho vị trí "${applicant.jobTitle || 'ứng tuyển'}" và rất ấn tượng. Chúng tôi trân trọng mời bạn tham gia một bài phỏng vấn ngắn (được chấm bằng AI) để hiểu rõ hơn về kỹ năng của bạn.\n\n` +
        `Bài kiểm tra sẽ bao gồm một số câu hỏi kỹ thuật và tình huống. Vui lòng hoàn thành trong thời gian sớm nhất.\n\n` +
        `Chúc bạn may mắn!\nTrân trọng,\nBộ phận Tuyển dụng.`
    ), [applicant]);
    const [message, setMessage] = useState(defaultMessage);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedTemplateId) { setError("Vui lòng chọn một mẫu phỏng vấn."); return; }
        setIsLoading(true); setError('');
        try {
            await onSubmit(applicant.id, parseInt(selectedTemplateId), message);
        } catch (err) {
            setError(err.message || "Gửi lời mời thất bại. Vui lòng thử lại.");
            setIsLoading(false); 
        }
    };
    return (
        <motion.div variants={modalFadeVariant} initial="initial" animate="animate" exit="exit" className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-[120] p-4 backdrop-blur-md" onClick={onClose}>
            <motion.div variants={modalSlideVariant} className="bg-gray-800 rounded-xl border border-gray-700 w-full max-w-2xl text-white flex flex-col overflow-hidden shadow-2xl max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <form onSubmit={handleSubmit}>
                    {/* Header */}
                    <div className="p-5 border-b border-gray-700 flex justify-between items-center flex-shrink-0">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
                            <Send className="w-6 h-6 text-purple-400"/> Gửi Lời mời Phỏng vấn AI
                        </h2>
                        <button type="button" onClick={onClose} className="text-gray-400 hover:text-white transition rounded-full p-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800"> <X className="w-6 h-6" /> </button>
                    </div>
                    {/* Body */}
                    <div className="p-6 space-y-5 overflow-y-auto styled-scrollbar">
                        {error && <ErrorDisplay message={error} />}
                        {/* Thông tin SV */}
                        <div className="mb-4 p-4 border border-gray-700 rounded-lg flex items-center gap-3 bg-gray-900/30">
                            <img src={applicant.student.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(applicant.student.name || applicant.student.githubUsername)}&background=random&color=ffffff&size=64`} alt="Avatar" className="w-10 h-10 rounded-full object-cover"/>
                            <div>
                                <p className="font-semibold text-gray-200">{applicant.student.name || applicant.student.githubUsername}</p>
                                <p className="text-xs text-gray-400">Ứng tuyển cho: {applicant.jobTitle || '(Không rõ Job Title)'}</p>
                            </div>
                        </div>
                        {/* Chọn Mẫu Test */}
                        <div>
                            <label htmlFor="templateId" className="block text-sm font-medium text-gray-300 mb-1.5">Chọn Mẫu Phỏng vấn *</label>
                            <select id="templateId" value={selectedTemplateId} onChange={(e) => setSelectedTemplateId(e.target.value)} className="w-full p-2.5 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                                <option value="">-- Chọn mẫu đã tạo --</option>
                                {templates.length > 0 ? (
                                    templates.map(t => <option key={t.id} value={t.id}>{t.title} ({t.timeLimitMinutes} phút)</option>)
                                ) : (
                                    <option disabled>Bạn chưa tạo mẫu nào (Vào tab Phỏng vấn AI)</option>
                                )}
                            </select>
                        </div>
                        {/* Lời nhắn */}
                        <div>
                            <label htmlFor="message" className="block text-sm font-medium text-gray-300 mb-1.5">Lời nhắn gửi Ứng viên (tùy chọn)</label>
                            <textarea id="message" value={message} onChange={(e) => setMessage(e.target.value)} rows="6" className="w-full p-2.5 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"></textarea>
                        </div>
                    </div>
                    {/* Footer */}
                    <div className="p-4 border-t border-gray-700 flex justify-end gap-3 bg-gray-800/80 backdrop-blur-sm flex-shrink-0">
                        <button type="button" onClick={onClose} className="py-2 px-5 bg-gray-600 rounded-md hover:bg-gray-500 transition duration-200 text-white font-semibold text-sm">Hủy</button>
                        <button type="submit" disabled={isLoading || !selectedTemplateId} className="py-2 px-6 bg-blue-600 rounded-md hover:bg-blue-500 transition duration-200 text-white font-semibold text-sm disabled:opacity-50">
                            {isLoading ? <LoadingSpinner size="sm" text="Đang gửi..." /> : 'Gửi Lời mời'}
                        </button>
                    </div>
                </form>
            </motion.div>
        </motion.div>
    );
};

export default memo(SendInterviewModal);