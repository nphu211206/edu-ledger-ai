// File: client/src/components/recruiter/modals/ApplicantsModal.jsx
// PHIÊN BẢN v3.4 - ĐÃ SỬA LỖI CÚ PHÁP CHỮ 'E' VÀ LỖI NULL STUDENT

import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

// --- API & Hooks (Fix đường dẫn "chí mạng") ---
import { getApplicantsForJob, updateApplicationStatus } from '../../../services/api';
import { useAuth } from '../../../hooks/useAuth';

// --- Components (Fix đường dẫn "chí mạng") ---
import { LoadingSpinner, ErrorDisplay, EmptyState } from '../../../components/common/FeedbackComponents';

// --- Icons "Đẳng cấp" ---
import {
    Users, X, Clock, Eye, Send, BrainCircuit, FileText, CheckSquare, XCircle, UserCheck, HelpCircle, CheckCircle,
    Github, CalendarDays, Loader, Check, Send as SendIcon, ExternalLink, UserRoundCheck, ThumbsDown, ThumbsUp, Medal,
    Bot
} from 'lucide-react';

// --- Animation Variants ---
const listItemVariant = { initial: { opacity: 0, x: -20 }, animate: { opacity: 1, x: 0, transition: { duration: 0.3, ease: "easeOut" } }, exit: { opacity: 0, x: 20, transition: { duration: 0.2, ease: "easeIn" } } };
const modalSlideVariant = { initial: { y: 50, opacity: 0 }, animate: { y: 0, opacity: 1 }, exit: { y: 50, opacity: 0 }, transition: { type: "spring", stiffness: 300, damping: 30 } };

// === COMPONENT CON "CHUYÊN BIỆT": ApplicantCard ===
const ApplicantCard = memo(({ applicant, getStatusInfo, onStatusUpdate, onOpenSendInviteModal }) => {
    // --- 1. Tạo đối tượng "An toàn" ---
    const student = applicant.student || {};

    // --- 2. Tạo các biến "An toàn" ---
    const studentName = student.name || student.githubUsername || 'Tài khoản đã bị xóa';
    const studentAvatar = student.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(studentName)}&background=random&color=ffffff&size=64`;
    const studentGithubUrl = student.githubUsername ? `https://github.com/${student.githubUsername}` : '#';
    const studentProfileUrl = student.githubUsername ? `/profile/${student.githubUsername}` : '#';
    const isStudentValid = !!student.id; // Kiểm tra xem sinh viên có thật sự tồn tại không

    const statusInfo = useMemo(() => getStatusInfo(applicant.status), [applicant.status, getStatusInfo]);
    const appliedDate = useMemo(() => { try { return new Date(applicant.appliedAt).toLocaleDateString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' }); } catch (e) { return 'N/A'; } }, [applicant.appliedAt]);
    const [isUpdating, setIsUpdating] = useState(false);
    const [updateError, setUpdateError] = useState('');

    const handleUpdateStatus = useCallback(async (newStatus) => {
        if (isUpdating || newStatus === applicant.status) return;
        setIsUpdating(true); setUpdateError('');
        try {
            await updateApplicationStatus(applicant.id, newStatus);
            onStatusUpdate(applicant.id, newStatus);
        } catch (error) {
            console.error(`[ApplicantCard] Failed to update status for app ${applicant.id}:`, error);
            const errorMsg = error.message || 'Lỗi cập nhật';
            setUpdateError(errorMsg);
        } finally {
            setIsUpdating(false);
        }
    }, [applicant.id, applicant.status, isUpdating, onStatusUpdate]);

    const handleInterviewInvite = () => {
        if (isUpdating || !isStudentValid) return; // Không cho mời nếu student null
        onOpenSendInviteModal(applicant);
    };

    const possibleActions = useMemo(() => {
        const actions = [];
        const reviewAction = { label: 'Đã xem', icon: Check, color: 'blue', title: 'Đánh dấu đã xem', onClick: () => handleUpdateStatus('Reviewed'), disabled: false };
        const rejectAction = { label: 'Từ chối', icon: X, color: 'red', title: 'Từ chối hồ sơ', onClick: () => handleUpdateStatus('Rejected'), disabled: false };
        const interviewAction = { label: 'Mời PV', icon: SendIcon, color: 'purple', title: isStudentValid ? 'Gửi lời mời phỏng vấn AI' : 'Không thể mời (User đã bị xóa)', onClick: handleInterviewInvite, disabled: !isStudentValid };
        const offerAction = { label: 'Offer', icon: CheckCircle, color: 'green', title: 'Gửi lời mời làm việc', onClick: () => handleUpdateStatus('Offered'), disabled: false };
        const hireAction = { label: 'Tuyển', icon: UserCheck, color: 'emerald', title: 'Đánh dấu đã tuyển dụng', onClick: () => handleUpdateStatus('Hired'), disabled: false };

        switch (applicant.status) {
            case 'Pending': actions.push(reviewAction, rejectAction, interviewAction); break;
            case 'Reviewed': actions.push(rejectAction, interviewAction); break;
            case 'Interview_Sent':
            case 'Started':
            case 'Submitted':
            case 'Grading':
                actions.push(rejectAction);
                break;
            case 'Graded':
                actions.push(rejectAction, offerAction);
                break;
            case 'Offered': actions.push(rejectAction, hireAction); break;
            default: break;
        }
        return actions;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [applicant.status, isUpdating, isStudentValid]);

    return (
        <motion.div key={applicant.id} variants={listItemVariant} layout
            // ===>>> ĐÂY LÀ DÒNG SỬA LỖI CÚ PHÁP (dùng `+` thay vì `${}`) <<<===
            className={'p-4 rounded-lg border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-colors duration-200 shadow-sm ' + (isStudentValid ? 'bg-gray-700/70 border-gray-600/80 hover:bg-gray-700/90' : 'bg-red-900/30 border-red-700/50 opacity-70')}
        >
            {/* Thông tin */}
            <div className="flex items-center gap-4 flex-grow min-w-0">
                <motion.img
                    src={studentAvatar}
                    alt={studentName}
                    className="w-12 h-12 rounded-full flex-shrink-0 border-2 border-gray-500 object-cover bg-gray-600"
                    whileHover={{ scale: 1.1 }}
                />
                <div className="flex-grow min-w-0">
                    <Link to={studentProfileUrl} target="_blank" className={`font-bold text-base ${isStudentValid ? 'text-white hover:text-blue-400' : 'text-gray-400 line-through'} transition truncate block`}>{studentName}</Link>
                    <a href={studentGithubUrl} target="_blank" rel="noopener noreferrer" className={`text-xs ${isStudentValid ? 'text-blue-400 hover:underline' : 'text-gray-500'} flex items-center gap-1 w-fit mt-0.5`}> <Github className="w-3 h-3" /> <span className="truncate">{student.githubUsername || 'N/A'}</span> </a>
                    <p className="text-xs text-gray-400 mt-1 flex items-center gap-1.5"> <CalendarDays className="w-3 h-3 text-gray-500" /> {appliedDate} </p>
                </div>
            </div>

            {/* Trạng thái & Actions */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 flex-shrink-0 w-full sm:w-auto mt-2 sm:mt-0">
                <span className={`flex items-center justify-center sm:justify-start gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${statusInfo.color} bg-opacity-20 w-full sm:w-auto whitespace-nowrap shadow-inner border border-current border-opacity-30`} title={`Trạng thái: ${statusInfo.text}`}>
                    <statusInfo.icon className="w-3.5 h-3.5" /> {statusInfo.text}
                </span>
                <div className="flex items-center gap-1.5 w-full sm:w-auto">
                    <AnimatePresence>
                        {possibleActions.length > 0 && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-1.5 w-full sm:w-auto">
                                {possibleActions.map(action => (
                                    <motion.button
                                        key={action.label} whileTap={{ scale: 0.95 }}
                                        onClick={action.onClick}
                                        disabled={isUpdating || action.disabled}
                                        // ===>>> ĐÂY LÀ DÒNG SỬA LỖI CÚ PHÁP (Xóa chữ 'E' thừa) <<<===
                                        className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 text-xs font-semibold py-1.5 px-3 rounded transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm border border-transparent hover:border-current hover:border-opacity-30
                                            ${action.color === 'red' ? 'bg-red-600/80 hover:bg-red-600 text-white' :
                                            action.color === 'blue' ? 'bg-blue-600/80 hover:bg-blue-600 text-white' :
                                            action.color === 'purple' ? 'bg-purple-600/80 hover:bg-purple-600 text-white' :
                                            action.color === 'green' ? 'bg-green-600/80 hover:bg-green-600 text-white' :
                                            action.color === 'emerald' ? 'bg-emerald-600/80 hover:bg-emerald-600 text-white' :
                                            'bg-gray-600/80 hover:bg-gray-600 text-white'}`}
                                        title={action.title}
                                    >
                                        {isUpdating ? <Loader className="animate-spin w-3.5 h-3.5" /> : <action.icon className="w-3.5 h-3.5" />}
                                        <span className="hidden sm:inline">{action.label}</span>
                                    </motion.button>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                    <Link to={studentProfileUrl} target="_blank" className={`bg-gray-600 text-white text-xs font-bold py-1.5 px-3 rounded hover:bg-gray-500 transition flex items-center gap-1.5 justify-center sm:w-auto shadow-sm border border-transparent hover:border-gray-400/50 ${!isStudentValid ? 'opacity-50 cursor-not-allowed' : ''}`} title="Xem Hồ sơ Chi tiết" onClick={(e) => !isStudentValid && e.preventDefault()}>
                        <ExternalLink className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Hồ sơ</span>
                    </Link>
                </div>
                {updateError && <p className="text-xs text-red-400 text-right w-full mt-1">{updateError}</p>}
            </div>
        </motion.div>
    );
});
ApplicantCard.displayName = 'ApplicantCard';


// === COMPONENT "CHUYÊN BIỆT" CHÍNH: ApplicantsModal ===
const ApplicantsModal = ({ job, onClose, applicants: applicantsProp, isLoading: isLoadingProp, error: errorProp, setApplicants: setApplicantsProp, onOpenSendInviteModal }) => {
    // (Logic nội bộ y hệt file dashboard v3.1)
    const [internalApplicants, setInternalApplicants] = useState([]);
    const [internalIsLoading, setInternalIsLoading] = useState(!applicantsProp);
    const [internalError, setInternalError] = useState('');
    const isLoading = isLoadingProp ?? internalIsLoading;
    const error = errorProp ?? internalError;
    const applicants = useMemo(() => applicantsProp ?? internalApplicants, [applicantsProp, internalApplicants]);

    useEffect(() => {
        const fetchInternalApplicants = async () => {
            if (!job || applicantsProp !== undefined) { setInternalIsLoading(false); return; }
            setInternalIsLoading(true); setInternalError('');
            try { const data = await getApplicantsForJob(job.id); setInternalApplicants(data || []); }
            catch (err) { setInternalError(err.message || "Không thể tải danh sách ứng viên."); }
            finally { setInternalIsLoading(false); }
        };
        fetchInternalApplicants();
    }, [job, applicantsProp]);

    const handleStatusUpdate = useCallback((applicationId, newStatus) => {
        const updateFunction = (prevApplicants) => prevApplicants.map(app => app.id === applicationId ? { ...app, status: newStatus } : app);
        if (setApplicantsProp) { setApplicantsProp(updateFunction); } else { setInternalApplicants(updateFunction); }
    }, [setApplicantsProp]);

    // Hàm lấy thông tin status "Hoàn hảo" (v3.1)
    const getStatusInfo = useCallback((status) => {
        switch (status) {
            case 'Pending': return { text: 'Chờ duyệt', color: 'text-yellow-400', icon: Clock };
            case 'Reviewed': return { text: 'Đã xem', color: 'text-blue-400', icon: Eye };
            case 'Interview_Sent': return { text: 'Đã gửi PV', color: 'text-purple-400', icon: Send };
            case 'Started': return { text: 'Đang làm bài', color: 'text-purple-400', icon: BrainCircuit };
            case 'Submitted': return { text: 'Đã nộp bài', color: 'text-indigo-400', icon: FileText };
            case 'Grading': return { text: 'AI đang chấm', color: 'text-indigo-400', icon: Bot };
            case 'Graded': return { text: 'Đã chấm điểm', color: 'text-cyan-400', icon: CheckSquare };
            case 'Offered': return { text: 'Đã Offer', color: 'text-green-400', icon: CheckCircle };
            case 'Rejected': return { text: 'Từ chối', color: 'text-red-400', icon: XCircle };
            case 'Hired': return { text: 'Đã Tuyển', color: 'text-emerald-400', icon: UserCheck };
            case 'Withdrawn': return { text: 'Đã rút', color: 'text-gray-500', icon: X };
            default: return { text: status || 'N/A', color: 'text-gray-500', icon: HelpCircle };
        }
    }, []);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-[100] p-4 backdrop-blur-md" onClick={onClose}>
            <motion.div
                variants={modalSlideVariant}
                initial="initial"
                animate="animate"
                exit="exit"
                className="bg-gray-800 rounded-xl border border-gray-700 w-full max-w-4xl text-white flex flex-col overflow-hidden shadow-2xl max-h-[90vh]"
                onClick={e => e.stopPropagation()}
            >
                {/* Header Modal */}
                <div className="p-5 border-b border-gray-700 flex-shrink-0 bg-gray-800/80 backdrop-blur-sm sticky top-0 z-10">
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="text-xl font-bold flex items-center gap-2"> <Users className="w-6 h-6 text-purple-400" /> Danh sách ứng viên </h2>
                            <p className="text-md text-blue-400 mt-1 truncate" title={job?.title}>{job?.title || 'Đang tải...'}</p>
                        </div>
                        <button onClick={onClose} className="text-gray-400 hover:text-white transition rounded-full p-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800"> <X className="w-6 h-6" /> </button>
                    </div>
                </div>

                {/* Content - Danh sách ứng viên */}
                <div className="p-3 sm:p-6 overflow-y-auto flex-grow bg-gray-800/50 styled-scrollbar">
                    {isLoading ? <div className="py-16"><LoadingSpinner text="Đang tải danh sách ứng viên..." /></div> :
                        error ? <div className="py-10"><ErrorDisplay message={error} /></div> :
                            applicants.length === 0 ? (<EmptyState icon={Users} title="Chưa có ứng viên nào" message="Hiện tại chưa có sinh viên nào ứng tuyển vào vị trí này." />) : (
                                <motion.div layout className="space-y-3">
                                    <AnimatePresence>
                                        {applicants.map(applicant => (
                                            <ApplicantCard
                                                key={applicant.id}
                                                applicant={applicant}
                                                getStatusInfo={getStatusInfo}
                                                onStatusUpdate={handleStatusUpdate}
                                                onOpenSendInviteModal={onOpenSendInviteModal}
                                            />
                                        ))}
                                    </AnimatePresence>
                                </motion.div>
                            )}
                </div>

                {/* Footer Modal */}
                <div className="p-4 border-t border-gray-700 flex justify-end bg-gray-800/80 backdrop-blur-sm flex-shrink-0 sticky bottom-0 z-10">
                    <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }} onClick={onClose} className="py-2 px-6 bg-gray-600 rounded-md hover:bg-gray-500 transition duration-200 text-white font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 focus:ring-offset-gray-800">Đóng</motion.button>
                </div>
            </motion.div>
        </div>
    );
};

export default memo(ApplicantsModal);