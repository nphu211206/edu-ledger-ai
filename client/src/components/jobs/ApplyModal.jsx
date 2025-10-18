// File: client/src/components/jobs/ApplyModal.jsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth'; // <-- ĐÃ SỬA ĐƯỜNG DẪN
import { applyToJob } from '../../services/api';

const Spinner = () => <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>;

export const ApplyModal = ({ job, onClose, onApplySuccess }) => {
    const { user, isAuthenticated } = useAuth();
    const [coverLetter, setCoverLetter] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    // Không render modal nếu người dùng chưa đăng nhập hoặc không phải sinh viên
    if (!isAuthenticated || user?.role !== 'student') {
        return null; 
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        try {
            await applyToJob(job.id, coverLetter);
            onApplySuccess(job.id);
            onClose();
        } catch (err) {
            setError(err.message || "Đã có lỗi xảy ra. Vui lòng thử lại.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4" onClick={onClose}>
            <motion.div 
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -50, opacity: 0 }}
                className="bg-gray-800 rounded-xl border border-gray-700 w-full max-w-2xl text-white" 
                onClick={e => e.stopPropagation()}
            >
                <div className="p-6 border-b border-gray-700">
                    <h2 className="text-2xl font-bold">Ứng tuyển vị trí</h2>
                    <p className="text-lg text-blue-400">{job.title}</p>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="p-6 space-y-4">
                        {error && <div className="p-3 bg-red-900 text-red-300 rounded-md text-sm">{error}</div>}
                        <div>
                            <label htmlFor="coverLetter" className="block text-sm font-medium text-gray-300 mb-2">Lời giới thiệu (Tùy chọn)</label>
                            <textarea 
                                id="coverLetter" 
                                value={coverLetter}
                                onChange={(e) => setCoverLetter(e.target.value)}
                                rows="5"
                                placeholder={`Gửi lời chào đến nhà tuyển dụng tại ${job.company.name}...`}
                                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                            ></textarea>
                        </div>
                    </div>
                    <div className="p-6 border-t border-gray-700 flex justify-end gap-4">
                        <button type="button" onClick={onClose} className="py-2 px-6 bg-gray-600 rounded-md hover:bg-gray-500 transition text-white font-semibold">Hủy</button>
                        <button type="submit" disabled={isLoading} className="py-2 px-6 bg-blue-600 rounded-md hover:bg-blue-500 transition text-white font-bold flex items-center justify-center min-w-[120px]">
                            {isLoading ? <Spinner /> : 'Xác nhận'}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};