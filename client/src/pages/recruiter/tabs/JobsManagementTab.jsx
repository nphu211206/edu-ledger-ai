// File: client/src/components/recruiter/tabs/JobsManagementTab.jsx
// PHIÊN BẢN v3.2 - Component "Chuyên biệt" (Tách từ Dashboard v3.1)
// ĐÃ SỬA ĐƯỜNG DẪN IMPORT "BẤT TỬ" (../../../)

import React, { useMemo, memo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LoadingSpinner, ErrorDisplay, EmptyState } from '../../../components/common/FeedbackComponents';
import { 
    Briefcase, Plus, Trash2, Eye, CalendarDays, CheckCircle, XCircle, Archive, ArchiveRestore, 
    Pencil, MapPin, UserCheck, DollarSign, ChevronRight, HelpCircle 
} from 'lucide-react';

// Animation
const listItemVariant = { initial: { opacity: 0, x: -20 }, animate: { opacity: 1, x: 0, transition: { duration: 0.3, ease: "easeOut" } }, exit: { opacity: 0, x: 20, transition: { duration: 0.2, ease: "easeIn" } } };

// === COMPONENT CON "CHUYÊN BIỆT": JobManagementRow ===
const JobManagementRow = memo(({ job, onClick, isSelected, onEdit, onDelete, onChangeStatus }) => {
    const postedDate = useMemo(() => { try { return new Date(job.createdAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }); } catch (e) { return 'N/A'; } }, [job.createdAt]);
    const statusInfo = useMemo(() => {
        switch (job.status) {
            case 'Active': return { text: 'Đang hiển thị', color: 'bg-green-500', icon: CheckCircle };
            case 'Inactive': return { text: 'Đã ẩn', color: 'bg-yellow-500', icon: Archive };
            case 'Draft': return { text: 'Bản nháp', color: 'bg-gray-500', icon: Pencil };
            case 'Expired': return { text: 'Hết hạn', color: 'bg-red-500', icon: XCircle };
            default: return { text: job.status || 'Không rõ', color: 'bg-gray-600', icon: HelpCircle };
        }
    }, [job.status]);
    const [isActionsVisible, setIsActionsVisible] = useState(false);
    return (
        <motion.tr key={job.id} variants={listItemVariant} layout className={`border-b border-gray-700/80 transition duration-200 ease-in-out group relative ${isSelected ? 'bg-blue-900/40' : 'hover:bg-gray-700/50'}`} onMouseEnter={() => setIsActionsVisible(true)} onMouseLeave={() => setIsActionsVisible(false)}>
            <td className="p-4 align-top cursor-pointer max-w-sm" onClick={() => onClick(job)} title={`Click để xem ứng viên cho "${job.title}"`}>
                <p className="font-bold text-white text-base group-hover:text-blue-300 transition line-clamp-2 leading-snug">{job.title}</p>
                <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-xs text-gray-400 mt-1.5">
                    <span className="inline-flex items-center gap-1"><Briefcase className="w-3.5 h-3.5"/> {job.jobType || 'N/A'}</span>
                    {job.location && <span className="inline-flex items-center gap-1"><MapPin className="w-3.5 h-3.5"/> {job.location}</span>}
                    {job.experienceLevel && <span className="inline-flex items-center gap-1"><UserCheck className="w-3.5 h-3.5"/> {job.experienceLevel}</span>}
                    {job.isSalaryNegotiable ? <span className="inline-flex items-center gap-1"><DollarSign className="w-3.5 h-3.5"/> Thỏa thuận</span> : job.salary && <span className="inline-flex items-center gap-1"><DollarSign className="w-3.5 h-3.5"/> {job.salary}</span> }
                </div>
            </td>
            <td className="p-4 align-middle text-center cursor-pointer" onClick={() => onClick(job)}> <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full ${statusInfo.color} text-white bg-opacity-80 shadow-inner whitespace-nowrap`}> <statusInfo.icon className="w-3.5 h-3.5"/> {statusInfo.text} </span> </td>
            <td className="p-4 align-middle text-center cursor-pointer" onClick={() => onClick(job)}> <span className={`font-mono text-xl font-medium ${job.applicants > 0 ? 'text-blue-400' : 'text-gray-500'}`}> {job.applicants} </span> </td>
            <td className="p-4 align-middle text-center text-sm text-gray-400 cursor-pointer" onClick={() => onClick(job)}> <CalendarDays className="w-4 h-4 inline mr-1 text-gray-500"/> {postedDate} </td>
            <td className="p-4 align-middle text-center relative">
                <AnimatePresence>
                {isActionsVisible && (
                    <motion.div initial={{ opacity: 0, x: 10, scale: 0.9 }} animate={{ opacity: 1, x: 0, scale: 1 }} exit={{ opacity: 0, x: 10, scale: 0.9 }} transition={{ duration: 0.15, ease: "easeOut" }} className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5 bg-gray-700/95 border border-gray-600/70 rounded-lg p-1 shadow-lg backdrop-blur-sm z-10" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => onClick(job)} title="Xem ứng viên" className="p-1.5 text-blue-400 hover:bg-gray-600/70 rounded transition duration-150"><Eye className="w-4 h-4"/></button>
                        <button onClick={() => onEdit(job)} title="Chỉnh sửa tin" className="p-1.5 text-yellow-400 hover:bg-gray-600/70 rounded transition duration-150"><Pencil className="w-4 h-4"/></button>
                        {job.status === 'Active' && <button onClick={() => onChangeStatus(job.id, 'Inactive')} title="Ẩn tin tuyển dụng" className="p-1.5 text-gray-400 hover:bg-gray-600/70 rounded transition duration-150"><Archive className="w-4 h-4"/></button>}
                        {job.status === 'Inactive' && <button onClick={() => onChangeStatus(job.id, 'Active')} title="Hiển thị lại tin" className="p-1.5 text-green-400 hover:bg-gray-600/70 rounded transition duration-150"><ArchiveRestore className="w-4 h-4"/></button>}
                        {(job.status === 'Draft' || job.status === 'Inactive' || job.status === 'Expired') && <button onClick={() => onDelete(job.id)} title="Xóa vĩnh viễn" className="p-1.5 text-red-500 hover:bg-red-900/50 rounded transition duration-150"><Trash2 className="w-4 h-4"/></button>}
                    </motion.div>
                )}
                </AnimatePresence>
                {!isActionsVisible && <ChevronRight className={`w-5 h-5 text-gray-600 transition-transform ${isSelected ? 'transform translate-x-1 text-blue-400' : 'group-hover:text-gray-400'}`} />}
            </td>
        </motion.tr>
    );
});
JobManagementRow.displayName = 'JobManagementRow';

// === COMPONENT "CHUYÊN BIỆT" CHÍNH: JobsManagementTable / JobsManagementTab ===
const JobsManagementTab = ({ jobs, isLoading, error, onJobClick, selectedJobId, onEditJob, onDeleteJob, onChangeJobStatus }) => {
    if (isLoading) { return <div className="py-20"><LoadingSpinner text="Đang tải danh sách tin tuyển dụng..." /></div>; }
    if (error) { return <div className="my-6"><ErrorDisplay message={error} details="Không thể tải danh sách tin tuyển dụng của bạn từ server." onRetry={() => window.location.reload()} /></div>; }
    if (!jobs || jobs.length === 0) { 
        return ( 
            <EmptyState 
                icon={Briefcase} 
                title="Bạn chưa đăng tin tuyển dụng nào" 
                message="Hãy bắt đầu tạo tin tuyển dụng đầu tiên." 
                actionButton={ 
                    <Link to="/recruiter/jobs/new" className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-2.5 px-6 rounded-lg hover:shadow-lg hover:opacity-90 transition duration-300 transform hover:-translate-y-0.5"> 
                        <Plus className="w-5 h-5" /> Đăng tin ngay 
                    </Link> 
                } 
            /> 
        ); 
    }
    
    return (
        <div className="bg-gray-800/70 rounded-xl border border-gray-700/80 overflow-hidden shadow-lg backdrop-blur-sm mt-2">
            <div className="overflow-x-auto styled-scrollbar">
                <table className="w-full text-sm text-left text-gray-400 min-w-[800px]">
                    <thead className="text-xs text-gray-300 uppercase bg-gray-700/60 sticky top-0 z-10 backdrop-blur-sm"> 
                        <tr> 
                            <th scope="col" className="p-4 w-[40%]">Vị trí & Chi tiết</th> 
                            <th scope="col" className="p-4 text-center w-[15%]">Trạng thái</th> 
                            <th scope="col" className="p-4 text-center w-[15%]">Ứng viên</th> 
                            <th scope="col" className="p-4 text-center w-[15%]">Ngày đăng</th> 
                            <th scope="col" className="p-4 text-center w-[15%]">Actions</th> 
                        </tr> 
                    </thead>
                    <motion.tbody layout> 
                        <AnimatePresence initial={false}> 
                            {jobs.map(job => ( 
                                <JobManagementRow 
                                    key={job.id} 
                                    job={job} 
                                    onClick={onJobClick} 
                                    isSelected={job.id === selectedJobId} 
                                    onEdit={onEditJob} 
                                    onDelete={onDeleteJob} 
                                    onChangeStatus={onChangeJobStatus} 
                                /> 
                            ))} 
                        </AnimatePresence> 
                    </motion.tbody>
                </table>
            </div>
            <div className="p-3 bg-gray-700/40 border-t border-gray-700/80 text-xs text-gray-500 text-right"> 
                Tổng cộng: <span className="font-semibold text-gray-400">{jobs.length}</span> tin tuyển dụng 
            </div>
        </div>
    );
};

export default memo(JobsManagementTab);