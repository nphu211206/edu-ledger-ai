// File: /client/src/pages/RecruiterDashboardPage.jsx
// PHIÊN BẢN TỐI THƯỢNG - TRUNG TÂM CHỈ HUY TUYỂN DỤNG MASTER v2.1 (Đầy Đủ Hoàn Chỉnh)
// Trang dashboard dành cho Nhà tuyển dụng, cung cấp cái nhìn tổng quan về hoạt động tuyển dụng,
// quản lý tin đăng, xem xét ứng viên, cập nhật trạng thái, và tìm kiếm tài năng sinh viên
// dựa trên kỹ năng đã được AI xác thực (giả lập). Giao diện được thiết kế đẳng cấp,
// mượt mà với nhiều hiệu ứng và chi tiết.

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom'; // Hooks cho routing và quản lý URL params
import { Helmet } from 'react-helmet-async'; // Quản lý thẻ <head>
import { motion, AnimatePresence } from 'framer-motion'; // Thư viện animation
import { BarChart, Bar, ResponsiveContainer, Tooltip as RechartsTooltip, Cell } from 'recharts'; // Thư viện biểu đồ

// --- API & Hooks ---
import {
    getRecruiterStats, getRecruiterJobs, getApplicantsForJob, searchStudents,
    updateApplicationStatus, // API cập nhật status ứng viên
    // Giả lập các API CRUD Job (sẽ thay bằng API thật sau)
    // updateJob as apiUpdateJob, deleteJob as apiDeleteJob, changeJobStatus as apiChangeJobStatus
} from '../services/api'; // Import các hàm gọi API đã chuẩn hóa
import { useAuth } from '../hooks/useAuth'; // Hook để lấy thông tin người dùng đang đăng nhập

// --- Components ---
// Import các component hiển thị trạng thái chung
import { LoadingSpinner, ErrorDisplay, EmptyState } from '../components/common/FeedbackComponents';

// --- Icons ---
// Import đầy đủ icons từ thư viện lucide-react để tạo giao diện trực quan
import {
    LayoutDashboard, Briefcase, Users, Search, Plus, Trash2, Github, ExternalLink,
    Loader, AlertCircle, Eye, CalendarDays, CheckCircle, XCircle, Clock, Mail, ChevronRight, Edit, Settings,
    Check, X, Send, MessageSquare, HelpCircle, Filter, Activity, TrendingUp, Archive, ArchiveRestore, Info, Pencil, MapPin, UserCheck, DollarSign, Building // Thêm Building
} from 'lucide-react';

// --- Animation Variants ---
// Định nghĩa các animation dùng chung cho trang
const cardVariant = { // Animation cho các StatCard
    initial: { opacity: 0, y: 15, scale: 0.98 },
    animate: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: [0.25, 1, 0.5, 1] } } // Ease out cubic
};
const tabContentVariant = { // Animation chuyển đổi giữa các tab
    initial: { y: 15, opacity: 0 },
    animate: { y: 0, opacity: 1, transition: { duration: 0.3, ease: 'easeInOut' } },
    exit: { y: -15, opacity: 0, transition: { duration: 0.2, ease: 'easeIn' } }
};
const listItemVariant = { // Animation cho từng item trong danh sách (Job Row, Applicant Card)
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0, transition: { duration: 0.3, ease: "easeOut" } },
    exit: { opacity: 0, x: 20, transition: { duration: 0.2, ease: "easeIn" } }
};

// --- Hàm Sleep (cho Giả lập API) ---
// Hàm tạo độ trễ để mô phỏng thời gian chờ mạng
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// ==========================================================
// === CÁC COMPONENT CON TÁI SỬ DỤNG CAO CẤP ===
// Các component này được định nghĩa trực tiếp trong file để đảm bảo tính đầy đủ.
// Trong dự án thực tế lớn, nên tách chúng ra các file riêng.
// ==========================================================

/**
 * CustomStatTooltip: Component hiển thị tooltip tùy chỉnh cho biểu đồ trong StatCard.
 * @param {object} props - Props từ Recharts Tooltip (active, payload, label).
 */
const CustomStatTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      // Hiển thị tooltip với nền mờ và bo tròn
      return (
        <div className="bg-gray-700/80 backdrop-blur-sm border border-gray-600 rounded-md shadow-lg px-2 py-1 text-xs text-gray-200">
          <p>{`Tuần ${label}: ${payload[0].value}`}</p> {/* Ví dụ hiển thị */}
        </div>
      );
    }
    return null; // Không hiển thị gì nếu tooltip không active
};

/**
 * StatCard: Card hiển thị một chỉ số thống kê quan trọng, kèm icon và biểu đồ mini.
 * @param {string} title - Tiêu đề của chỉ số (VD: "Tin Đã đăng").
 * @param {number} value - Giá trị của chỉ số.
 * @param {React.ElementType} icon - Component Icon từ Lucide React.
 * @param {'blue'|'green'|'purple'} color - Theme màu của card.
 * @param {Array<object>} data - Dữ liệu cho biểu đồ mini (VD: [{name: 'W1', value: 10}]).
 * @param {string} dataKey - Key trong object data chứa giá trị cho biểu đồ.
 * @param {boolean} isLoading - Cờ báo trạng thái đang tải dữ liệu.
 * @param {string} [detailLink] - (Tùy chọn) Đường dẫn link khi click vào card.
 */
const StatCard = React.memo(({ title, value = 0, icon: Icon, color = 'blue', data = [], dataKey = 'value', isLoading, detailLink }) => {
    // Memo hóa để tối ưu hiệu năng
    // Định nghĩa các lớp CSS theo theme màu
    const colorClasses = useMemo(() => ({
        blue: { bg: 'bg-blue-900/40 hover:bg-blue-900/60', border: 'border-blue-700/60', text: 'text-blue-400', bar: '#60A5FA' },
        green: { bg: 'bg-green-900/40 hover:bg-green-900/60', border: 'border-green-700/60', text: 'text-green-400', bar: '#34D399' },
        purple: { bg: 'bg-purple-900/40 hover:bg-purple-900/60', border: 'border-purple-700/60', text: 'text-purple-400', bar: '#A78BFA' },
    }), []);
    const classes = colorClasses[color] || colorClasses.blue; // Lấy theme màu hoặc dùng blue mặc định

    // Nội dung bên trong card
    const cardContent = (
        <>
            {/* Icon và Biểu đồ nền */}
            <div className="flex justify-between items-start mb-3 relative z-10">
                 <div className={`p-2.5 rounded-lg bg-gray-700/60 ${classes.text} shadow-inner transition-colors duration-300`}>
                     <Icon className="w-5 h-5" />
                 </div>
            </div>
            {/* Giá trị và Tiêu đề */}
            {isLoading ? (
                // Hiển thị skeleton loading
                <div className="space-y-2 mt-1 mb-2">
                    <div className="h-9 w-1/2 bg-gray-700/80 rounded animate-pulse"></div>
                    <div className="h-4 w-3/4 bg-gray-700/60 rounded animate-pulse"></div>
                </div>
            ) : (
                // Hiển thị giá trị thật
                <>
                    <p className={`text-4xl font-bold ${classes.text} mb-1 transition-all duration-300 group-hover:scale-105`}>{value.toLocaleString('vi-VN')}</p>
                    <p className="text-sm text-gray-400 relative z-10">{title}</p>
                 </>
            )}
            {/* Biểu đồ Mini làm nền (chỉ hiện khi có data và không loading) */}
            {data.length > 1 && !isLoading && (
                <div className="w-full h-20 absolute bottom-0 left-0 opacity-15 group-hover:opacity-30 transition-opacity duration-400 overflow-hidden rounded-b-xl mask-gradient-b">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data} margin={{ top: 25, right: 0, left: 0, bottom: 0 }}> {/* Tăng margin top */}
                            <RechartsTooltip content={<CustomStatTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }}/>
                             <Bar dataKey={dataKey} radius={[3, 3, 0, 0]} barSize={6}>
                                 {/* Màu sắc thay đổi nhẹ cho từng cột */}
                                 {data.map((entry, index) => ( <Cell key={`cell-${index}`} fill={classes.bar} fillOpacity={0.5 + (index / data.length) * 0.5}/> ))}
                             </Bar>
                         </BarChart>
                    </ResponsiveContainer>
                 </div>
            )}
            {/* CSS nội bộ cho hiệu ứng mask gradient */}
            <style jsx>{`.mask-gradient-b { mask-image: linear-gradient(to top, black 40%, transparent 100%); -webkit-mask-image: linear-gradient(to top, black 40%, transparent 100%); }`}</style>
        </>
    );

    // Wrapper component để xử lý animation và link (nếu có)
    const CardWrapper = ({ children }) => (
        <motion.div
            variants={cardVariant} // Áp dụng animation variant
            className={`p-5 rounded-xl border backdrop-blur-sm relative overflow-hidden transition-all duration-300 group hover:shadow-xl hover:-translate-y-1 ${classes.bg} ${classes.border} ${detailLink ? 'hover:border-opacity-80 cursor-pointer' : ''}`}
        >
             {children}
        </motion.div>
    );

    // Trả về card có bọc Link hoặc không tùy thuộc vào prop detailLink
    return detailLink
        ? <Link to={detailLink} className="focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500 rounded-xl block"><CardWrapper>{cardContent}</CardWrapper></Link>
        : <CardWrapper>{cardContent}</CardWrapper>;
});
StatCard.displayName = 'StatCard'; // Tên hiển thị trong React DevTools

// ==========================================================
// === CÁC COMPONENT CHO TAB QUẢN LÝ TIN TUYỂN DỤNG ===
// ==========================================================

/**
 * JobManagementRow: Hiển thị thông tin một tin tuyển dụng trong bảng quản lý.
 * @param {object} job - Dữ liệu job.
 * @param {function} onClick - Callback khi click vào hàng (để xem ứng viên).
 * @param {boolean} isSelected - Cờ báo hàng này có đang được chọn không.
 * @param {function} onEdit - Callback khi nhấn nút Sửa.
 * @param {function} onDelete - Callback khi nhấn nút Xóa.
 * @param {function} onChangeStatus - Callback khi nhấn nút đổi trạng thái (Ẩn/Hiện).
 */
const JobManagementRow = React.memo(({ job, onClick, isSelected, onEdit, onDelete, onChangeStatus }) => {
    // Format ngày đăng bằng useMemo để tránh tính toán lại không cần thiết
    const postedDate = useMemo(() => {
        try {
            return new Date(job.createdAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
        } catch (e) { return 'N/A'; } // Xử lý ngày không hợp lệ
    }, [job.createdAt]);

    // Lấy thông tin trạng thái (text, color, icon) bằng useMemo
    const statusInfo = useMemo(() => {
        switch (job.status) {
            case 'Active': return { text: 'Đang hiển thị', color: 'bg-green-500', icon: CheckCircle };
            case 'Inactive': return { text: 'Đã ẩn', color: 'bg-yellow-500', icon: Archive };
            case 'Draft': return { text: 'Bản nháp', color: 'bg-gray-500', icon: Pencil };
            case 'Expired': return { text: 'Hết hạn', color: 'bg-red-500', icon: XCircle };
            default: return { text: job.status || 'Không rõ', color: 'bg-gray-600', icon: HelpCircle };
        }
    }, [job.status]);

    // State quản lý việc hiển thị các nút actions khi hover
    const [isActionsVisible, setIsActionsVisible] = useState(false);

    return (
        // Sử dụng motion.tr để Framer Motion có thể animate
        <motion.tr
            key={job.id} // Key là bắt buộc cho list animation
            variants={listItemVariant} // Áp dụng animation cho từng hàng
            layout // Cho phép animation mượt mà khi các hàng khác thêm/xóa/sắp xếp lại
            className={`border-b border-gray-700/80 transition duration-200 ease-in-out group relative ${isSelected ? 'bg-blue-900/40' : 'hover:bg-gray-700/50'}`} // Style khi được chọn hoặc hover
            onMouseEnter={() => setIsActionsVisible(true)} // Hiện actions khi hover vào hàng
            onMouseLeave={() => setIsActionsVisible(false)} // Ẩn actions khi rời chuột
        >
            {/* Cột Vị trí */}
            <td className="p-4 align-top cursor-pointer max-w-sm" onClick={() => onClick(job)} title={`Click để xem ứng viên cho "${job.title}"`}>
                 <p className="font-bold text-white text-base group-hover:text-blue-300 transition line-clamp-2 leading-snug">{job.title}</p>
                 {/* Thông tin phụ (Loại job, Địa điểm, Cấp bậc, Lương) */}
                 <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-xs text-gray-400 mt-1.5">
                     <span className="inline-flex items-center gap-1"><Briefcase className="w-3.5 h-3.5"/> {job.jobType || 'N/A'}</span>
                     {job.location && <span className="inline-flex items-center gap-1"><MapPin className="w-3.5 h-3.5"/> {job.location}</span>}
                     {job.experienceLevel && <span className="inline-flex items-center gap-1"><UserCheck className="w-3.5 h-3.5"/> {job.experienceLevel}</span>}
                     {/* Hiển thị lương hoặc thỏa thuận */}
                     {job.isSalaryNegotiable
                        ? <span className="inline-flex items-center gap-1"><DollarSign className="w-3.5 h-3.5"/> Thỏa thuận</span>
                        : job.salary && <span className="inline-flex items-center gap-1"><DollarSign className="w-3.5 h-3.5"/> {job.salary}</span>
                     }
                 </div>
            </td>
            {/* Cột Trạng thái */}
             <td className="p-4 align-middle text-center cursor-pointer" onClick={() => onClick(job)}>
                 {/* Badge hiển thị trạng thái với màu sắc và icon */}
                 <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full ${statusInfo.color} text-white bg-opacity-80 shadow-inner whitespace-nowrap`}>
                    <statusInfo.icon className="w-3.5 h-3.5"/> {statusInfo.text}
                 </span>
            </td>
            {/* Cột Số lượng Ứng viên */}
            <td className="p-4 align-middle text-center cursor-pointer" onClick={() => onClick(job)}>
                 {/* Hiển thị số lượng ứng viên, màu xanh nếu > 0 */}
                 <span className={`font-mono text-xl font-medium ${job.applicants > 0 ? 'text-blue-400' : 'text-gray-500'}`}>
                    {job.applicants}
                </span>
            </td>
            {/* Cột Ngày đăng */}
            <td className="p-4 align-middle text-center text-sm text-gray-400 cursor-pointer" onClick={() => onClick(job)}>
                <CalendarDays className="w-4 h-4 inline mr-1 text-gray-500"/> {postedDate}
            </td>
            {/* Cột Actions (Hiện khi hover) */}
             <td className="p-4 align-middle text-center relative">
                 {/* Sử dụng AnimatePresence để các nút actions xuất hiện/biến mất mượt mà */}
                 <AnimatePresence>
                 {isActionsVisible && (
                    <motion.div
                        initial={{ opacity: 0, x: 10, scale: 0.9 }} // Animation vào
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: 10, scale: 0.9 }} // Animation ra
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        // Container cho các nút actions, hiện ở bên phải, căn giữa theo chiều dọc
                        className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5 bg-gray-700/95 border border-gray-600/70 rounded-lg p-1 shadow-lg backdrop-blur-sm z-10"
                        onClick={(e) => e.stopPropagation()} // Ngăn click vào nút làm trigger click vào hàng
                    >
                        {/* Nút Xem ứng viên */}
                        <button onClick={() => onClick(job)} title="Xem ứng viên" className="p-1.5 text-blue-400 hover:bg-gray-600/70 rounded transition duration-150"><Eye className="w-4 h-4"/></button>
                        {/* Nút Sửa tin */}
                         <button onClick={() => onEdit(job)} title="Chỉnh sửa tin" className="p-1.5 text-yellow-400 hover:bg-gray-600/70 rounded transition duration-150"><Edit className="w-4 h-4"/></button>
                         {/* Nút Ẩn tin (nếu đang Active) */}
                         {job.status === 'Active' && <button onClick={() => onChangeStatus(job.id, 'Inactive')} title="Ẩn tin tuyển dụng" className="p-1.5 text-gray-400 hover:bg-gray-600/70 rounded transition duration-150"><Archive className="w-4 h-4"/></button>}
                         {/* Nút Hiện lại tin (nếu đang Inactive) */}
                         {job.status === 'Inactive' && <button onClick={() => onChangeStatus(job.id, 'Active')} title="Hiển thị lại tin" className="p-1.5 text-green-400 hover:bg-gray-600/70 rounded transition duration-150"><ArchiveRestore className="w-4 h-4"/></button>}
                         {/* Nút Xóa (chỉ cho phép xóa khi không Active) */}
                         {(job.status === 'Draft' || job.status === 'Inactive' || job.status === 'Expired') && <button onClick={() => onDelete(job.id)} title="Xóa vĩnh viễn" className="p-1.5 text-red-500 hover:bg-red-900/50 rounded transition duration-150"><Trash2 className="w-4 h-4"/></button>}
                    </motion.div>
                 )}
                 </AnimatePresence>
                 {/* Icon mũi tên chỉ dẫn (hiển thị khi không hover) */}
                 {!isActionsVisible && <ChevronRight className={`w-5 h-5 text-gray-600 transition-transform ${isSelected ? 'transform translate-x-1 text-blue-400' : 'group-hover:text-gray-400'}`} />}
            </td>
        </motion.tr>
    );
});
JobManagementRow.displayName = 'JobManagementRow';

/**
 * JobsManagementTable: Component bảng hiển thị danh sách các tin tuyển dụng của NTD.
 * Bao gồm header bảng, các hàng JobManagementRow, và xử lý trạng thái loading/error/empty.
 * @param {Array<object>} jobs - Mảng dữ liệu jobs.
 * @param {boolean} isLoading - Cờ báo đang tải jobs.
 * @param {string|null} error - Thông báo lỗi nếu có.
 * @param {function} onJobClick - Callback khi click vào một job row (để xem applicants).
 * @param {number|null} selectedJobId - ID của job đang được chọn (để highlight).
 * @param {function} onEditJob - Callback khi nhấn nút Sửa job.
 * @param {function} onDeleteJob - Callback khi nhấn nút Xóa job.
 * @param {function} onChangeJobStatus - Callback khi nhấn nút đổi trạng thái job.
 */
const JobsManagementTable = React.memo(({ jobs, isLoading, error, onJobClick, selectedJobId, onEditJob, onDeleteJob, onChangeJobStatus }) => {
    // 1. Xử lý trạng thái Loading
    if (isLoading) {
        return <div className="py-20"><LoadingSpinner text="Đang tải danh sách tin tuyển dụng..." /></div>;
    }
    // 2. Xử lý trạng thái Lỗi
    if (error) {
        // Cung cấp thêm chi tiết nếu có thể
        return <div className="my-6"><ErrorDisplay message={error} details="Không thể tải danh sách tin tuyển dụng của bạn từ server. Vui lòng thử lại hoặc liên hệ hỗ trợ." onRetry={() => window.location.reload()} /></div>;
    }
    // 3. Xử lý trạng thái Không có dữ liệu (Empty State)
    if (!jobs || jobs.length === 0) {
        return (
            <EmptyState
                icon={Briefcase}
                title="Bạn chưa đăng tin tuyển dụng nào"
                message="Hãy bắt đầu tạo tin tuyển dụng đầu tiên để kết nối với những tài năng công nghệ xuất sắc nhất trên EduLedger AI."
                actionButton={
                    <Link to="/recruiter/jobs/new" className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-2.5 px-6 rounded-lg hover:shadow-lg hover:opacity-90 transition duration-300 transform hover:-translate-y-0.5">
                        <Plus className="w-5 h-5" /> Đăng tin ngay
                    </Link>
                }
            />
        );
    }

    // 4. Render bảng dữ liệu nếu có jobs
    return (
         // Container của bảng với hiệu ứng nền và bo góc
         <div className="bg-gray-800/70 rounded-xl border border-gray-700/80 overflow-hidden shadow-lg backdrop-blur-sm mt-2">
            {/* Div cho phép cuộn ngang trên màn hình nhỏ */}
            <div className="overflow-x-auto styled-scrollbar">
                {/* Bảng dữ liệu */}
                <table className="w-full text-sm text-left text-gray-400 min-w-[800px]"> {/* Tăng min-w để đủ chỗ cho actions */}
                    {/* Header bảng (cố định khi cuộn dọc) */}
                    <thead className="text-xs text-gray-300 uppercase bg-gray-700/60 sticky top-0 z-10 backdrop-blur-sm">
                        <tr>
                            <th scope="col" className="p-4 w-[40%]">Vị trí & Chi tiết</th>
                            <th scope="col" className="p-4 text-center w-[15%]">Trạng thái</th>
                            <th scope="col" className="p-4 text-center w-[15%]">Ứng viên</th>
                            <th scope="col" className="p-4 text-center w-[15%]">Ngày đăng</th>
                             <th scope="col" className="p-4 text-center w-[15%]">Actions</th>
                        </tr>
                    </thead>
                    {/* Body bảng với animation */}
                    <motion.tbody layout> {/* `layout` prop giúp animate vị trí các hàng */}
                        <AnimatePresence initial={false}> {/* `initial={false}` ngăn animation khi load trang lần đầu */}
                            {jobs.map(job => (
                                // Render từng hàng job, truyền đầy đủ props và callbacks
                                <JobManagementRow
                                    key={job.id} // Key là bắt buộc
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
             {/* Footer bảng hiển thị tổng số */}
             <div className="p-3 bg-gray-700/40 border-t border-gray-700/80 text-xs text-gray-500 text-right">
                Tổng cộng: <span className="font-semibold text-gray-400">{jobs.length}</span> tin tuyển dụng
             </div>
        </div>
    );
});
JobsManagementTable.displayName = 'JobsManagementTable';

/**
 * ApplicantCard: Hiển thị thông tin một ứng viên trong Modal Danh sách Ứng viên.
 * Bao gồm avatar, tên, username, ngày ứng tuyển, trạng thái, và các nút actions.
 * @param {object} applicant - Dữ liệu ứng viên (bao gồm thông tin student và application).
 * @param {function} getStatusInfo - Hàm trả về thông tin hiển thị (text, color, icon) cho status.
 * @param {function} onStatusUpdate - Callback được gọi khi trạng thái ứng viên cần được cập nhật.
 */
const ApplicantCard = React.memo(({ applicant, getStatusInfo, onStatusUpdate }) => {
    const statusInfo = useMemo(() => getStatusInfo(applicant.status), [applicant.status, getStatusInfo]);
    const appliedDate = useMemo(() => {
        try {
            return new Date(applicant.appliedAt).toLocaleDateString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' });
        } catch(e) { return 'N/A'; }
    }, [applicant.appliedAt]);
    // State loading riêng cho các nút action của card này
    const [isUpdating, setIsUpdating] = useState(false);
    const [updateError, setUpdateError] = useState(''); // State lưu lỗi cập nhật của card này

    /** Xử lý khi nhấn nút cập nhật trạng thái */
    const handleUpdateStatus = useCallback(async (newStatus) => {
        if (isUpdating || newStatus === applicant.status) return; // Không làm gì nếu đang update hoặc status không đổi
        setIsUpdating(true); // Bật loading
        setUpdateError(''); // Xóa lỗi cũ
        console.log(`[ApplicantCard] Updating status for app ${applicant.id} from ${applicant.status} to ${newStatus}`);
        try {
            // Gọi API service để cập nhật trạng thái ở backend
            await updateApplicationStatus(applicant.id, newStatus);
            console.log(`[ApplicantCard] API call successful for app ${applicant.id}, new status: ${newStatus}`);
            // Gọi callback onStatusUpdate để component cha (ApplicantsModal) cập nhật UI
            onStatusUpdate(applicant.id, newStatus);
            // TODO: Hiển thị thông báo thành công (ví dụ: Toast)
        } catch (error) {
            console.error(`[ApplicantCard] Failed to update status for app ${applicant.id}:`, error);
            setUpdateError(error.message || 'Lỗi cập nhật'); // Lưu lỗi để hiển thị (nếu cần)
            // TODO: Hiển thị thông báo lỗi (ví dụ: Toast)
             alert(`Lỗi cập nhật trạng thái: ${error.message}`); // Tạm dùng alert
        } finally {
            setIsUpdating(false); // Tắt loading
        }
    }, [applicant.id, applicant.status, isUpdating, onStatusUpdate]); // Dependencies

    // Xác định các hành động (nút bấm) có thể thực hiện dựa trên trạng thái hiện tại
    const possibleActions = useMemo(() => {
        const actions = [];
        // Định nghĩa các actions: { label, status, icon, color, title }
        const reviewAction = { label: 'Đã xem', status: 'Reviewed', icon: Check, color: 'blue', title: 'Đánh dấu hồ sơ đã được xem xét' };
        const rejectAction = { label: 'Từ chối', status: 'Rejected', icon: X, color: 'red', title: 'Từ chối hồ sơ ứng tuyển này' };
        const interviewAction = { label: 'Mời PV', status: 'Interviewing', icon: Send, color: 'purple', title: 'Chuyển sang trạng thái Phỏng vấn' };
        const offerAction = { label: 'Offer', status: 'Offered', icon: CheckCircle, color: 'green', title: 'Gửi lời mời làm việc' };
        const hireAction = { label: 'Tuyển', status: 'Hired', icon: UserCheck, color: 'emerald', title: 'Đánh dấu đã tuyển dụng' }; // Thêm màu emerald

        switch (applicant.status) {
            case 'Pending':
                actions.push(reviewAction, rejectAction, interviewAction);
                break;
            case 'Reviewed':
                 actions.push(rejectAction, interviewAction);
                 break;
            case 'Interviewing':
                 actions.push(rejectAction, offerAction);
                break;
            case 'Offered':
                 actions.push(rejectAction, hireAction); // Có thể từ chối offer hoặc chấp nhận tuyển
                break;
            // Không có action cho trạng thái cuối: Rejected, Hired, Withdrawn
            default:
                break;
        }
        return actions;
    }, [applicant.status]);


    return (
        <motion.div
            key={applicant.id} // Key
            variants={listItemVariant} // Animation
            layout // Cho phép animate khi trạng thái thay đổi làm thay đổi layout (ví dụ: nút biến mất)
            className="bg-gray-700/70 p-4 rounded-lg border border-gray-600/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-colors duration-200 hover:bg-gray-700/90 shadow-sm"
        >
            {/* Phần thông tin ứng viên */}
             <div className="flex items-center gap-4 flex-grow min-w-0">
                 <motion.img
                     src={applicant.student.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(applicant.student.name || applicant.student.githubUsername)}&background=random&color=ffffff&size=64`}
                     alt={applicant.student.name || applicant.student.githubUsername}
                     className="w-12 h-12 rounded-full flex-shrink-0 border-2 border-gray-500 object-cover bg-gray-600"
                     whileHover={{ scale: 1.1 }}
                 />
                 <div className="flex-grow min-w-0">
                     <Link to={`/profile/${applicant.student.githubUsername}`} target="_blank" className="font-bold text-base text-white hover:text-blue-400 transition truncate block">{applicant.student.name || applicant.student.githubUsername}</Link>
                     <a href={`https://github.com/${applicant.student.githubUsername}`} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 hover:underline flex items-center gap-1 w-fit mt-0.5">
                         <Github className="w-3 h-3" /> <span className="truncate">{applicant.student.githubUsername}</span>
                    </a>
                     <p className="text-xs text-gray-400 mt-1 flex items-center gap-1.5"> <CalendarDays className="w-3 h-3 text-gray-500"/> {appliedDate} </p>
                 </div>
            </div>
             {/* Phần Trạng thái & Actions */}
             <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 flex-shrink-0 w-full sm:w-auto mt-2 sm:mt-0">
                 {/* Trạng thái hiện tại (Badge) */}
                 <span className={`flex items-center justify-center sm:justify-start gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${statusInfo.color} bg-opacity-20 w-full sm:w-auto whitespace-nowrap shadow-inner border border-current border-opacity-30`} title={`Trạng thái hiện tại: ${statusInfo.text}`}>
                     <statusInfo.icon className="w-3.5 h-3.5"/> {statusInfo.text}
                 </span>

                 {/* Các nút Actions */}
                 <div className="flex items-center gap-1.5 w-full sm:w-auto">
                     {/* Hiển thị các nút actions nếu có */}
                     <AnimatePresence>
                     {possibleActions.length > 0 && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1}} exit={{ opacity: 0 }} className="flex items-center gap-1.5 w-full sm:w-auto">
                            {possibleActions.map(action => (
                                <motion.button
                                    key={action.status}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handleUpdateStatus(action.status)}
                                    disabled={isUpdating} // Disable khi đang gọi API
                                    className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 text-xs font-semibold py-1.5 px-3 rounded transition duration-200 disabled:opacity-50 disabled:cursor-wait shadow-sm border border-transparent hover:border-current hover:border-opacity-30
                                        ${action.color === 'red' ? 'bg-red-600/80 hover:bg-red-600 text-white' :
                                         action.color === 'blue' ? 'bg-blue-600/80 hover:bg-blue-600 text-white' :
                                         action.color === 'purple' ? 'bg-purple-600/80 hover:bg-purple-600 text-white' :
                                         action.color === 'green' ? 'bg-green-600/80 hover:bg-green-600 text-white' :
                                         action.color === 'emerald' ? 'bg-emerald-600/80 hover:bg-emerald-600 text-white' :
                                         'bg-gray-600/80 hover:bg-gray-600 text-white'}`}
                                    title={action.title} // Tooltip giải thích hành động
                                >
                                     {isUpdating ? <Loader className="animate-spin w-3.5 h-3.5"/> : <action.icon className="w-3.5 h-3.5"/>}
                                    <span className="hidden sm:inline">{action.label}</span> {/* Chỉ hiển thị text trên màn hình lớn */}
                                </motion.button>
                            ))}
                        </motion.div>
                     )}
                     </AnimatePresence>
                     {/* Nút Xem hồ sơ (luôn hiển thị) */}
                     <Link to={`/profile/${applicant.student.githubUsername}`} target="_blank" className="bg-gray-600 text-white text-xs font-bold py-1.5 px-3 rounded hover:bg-gray-500 transition flex items-center gap-1.5 justify-center sm:w-auto shadow-sm border border-transparent hover:border-gray-400/50" title="Xem Hồ sơ Chi tiết">
                         <ExternalLink className="w-3.5 h-3.5"/> <span className="hidden sm:inline">Hồ sơ</span>
                     </Link>
                 </div>
                 {/* Hiển thị lỗi cập nhật nếu có */}
                 {updateError && <p className="text-xs text-red-400 text-right w-full mt-1">{updateError}</p>}
             </div>
        </motion.div>
    );
});
ApplicantCard.displayName = 'ApplicantCard';

/**
 * ApplicantsModal: Modal hiển thị danh sách ứng viên cho một job.
 * @param {object} job - Job đang xem.
 * @param {function} onClose - Hàm đóng modal.
 * @param {Array<object>} applicants - (Prop tùy chọn) Dữ liệu applicants nếu cha quản lý.
 * @param {boolean} isLoading - (Prop tùy chọn) Trạng thái loading nếu cha quản lý.
 * @param {string} error - (Prop tùy chọn) Lỗi nếu cha quản lý.
 * @param {function} setApplicants - (Prop tùy chọn) Hàm setter nếu cha quản lý state applicants.
 */
const ApplicantsModal = ({ job, onClose, applicants: applicantsProp, isLoading: isLoadingProp, error: errorProp, setApplicants: setApplicantsProp }) => {
    // State nội bộ để fetch và quản lý applicants nếu không được truyền từ props
    const [internalApplicants, setInternalApplicants] = useState([]);
    const [internalIsLoading, setInternalIsLoading] = useState(!applicantsProp); // Loading nếu không có data ban đầu
    const [internalError, setInternalError] = useState('');

    // Ưu tiên sử dụng props nếu được cung cấp
    const isLoading = isLoadingProp ?? internalIsLoading;
    const error = errorProp ?? internalError;
    const applicants = useMemo(() => applicantsProp ?? internalApplicants, [applicantsProp, internalApplicants]); // Dùng useMemo để ổn định

    // useEffect để fetch dữ liệu nội bộ nếu cần
    useEffect(() => {
        const fetchInternalApplicants = async () => {
            // Chỉ fetch nếu job tồn tại VÀ không có applicants được truyền từ props
            if (!job || applicantsProp !== undefined) {
                setInternalIsLoading(false); // Dừng loading nếu không cần fetch
                return;
            }
            console.log(`[ApplicantsModal] Fetching internal applicants for job: ${job.id}`);
            setInternalIsLoading(true);
            setInternalError('');
            try {
                const data = await getApplicantsForJob(job.id); // Gọi API
                setInternalApplicants(data || []); // Lưu data hoặc mảng rỗng
            } catch (err) {
                console.error(`[ApplicantsModal] Error fetching internal applicants:`, err);
                setInternalError(err.message || "Không thể tải danh sách ứng viên.");
            } finally {
                setInternalIsLoading(false); // Tắt loading
            }
        };
        fetchInternalApplicants();
    }, [job, applicantsProp]); // Fetch lại khi job thay đổi (và không có applicantsProp)

    // Callback để cập nhật UI khi trạng thái của ApplicantCard thay đổi
    const handleStatusUpdate = useCallback((applicationId, newStatus) => {
        console.log(`[ApplicantsModal] Updating UI for AppID: ${applicationId} to ${newStatus}`);
        const updateFunction = (prevApplicants) => prevApplicants.map(app =>
            app.id === applicationId ? { ...app, status: newStatus } : app
        );
        // Gọi setter của component cha nếu nó được truyền vào
        if (setApplicantsProp) {
            console.log("[ApplicantsModal] Calling parent's setApplicants...");
            setApplicantsProp(updateFunction);
        } else {
            // Ngược lại, cập nhật state nội bộ
            console.log("[ApplicantsModal] Updating internal state...");
            setInternalApplicants(updateFunction);
        }
    }, [setApplicantsProp]); // Dependency là hàm setter từ props

    // Hàm lấy thông tin hiển thị cho status
    const getStatusInfo = useCallback((status) => {
        switch (status) {
            case 'Pending': return { text: 'Chờ duyệt', color: 'text-yellow-400', icon: Clock };
            case 'Reviewed': return { text: 'Đã xem', color: 'text-blue-400', icon: Eye };
            case 'Interviewing': return { text: 'Phỏng vấn', color: 'text-purple-400', icon: MessageSquare };
            case 'Offered': return { text: 'Đã Offer', color: 'text-green-400', icon: CheckCircle };
            case 'Rejected': return { text: 'Từ chối', color: 'text-red-400', icon: XCircle };
            case 'Hired': return { text: 'Đã Tuyển', color: 'text-emerald-400', icon: UserCheck };
            case 'Withdrawn': return { text: 'Đã rút', color: 'text-gray-500', icon: X }; // Ứng viên tự rút
            default: return { text: status || 'N/A', color: 'text-gray-500', icon: HelpCircle };
        }
    }, []); // Callback không có dependency

    return (
         // Backdrop
        <div className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-[100] p-4 backdrop-blur-md" onClick={onClose}>
            {/* Modal Container */}
            <motion.div
                initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="bg-gray-800 rounded-xl border border-gray-700 w-full max-w-4xl text-white flex flex-col overflow-hidden shadow-2xl max-h-[90vh]" // Tăng max-w
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                 <div className="p-5 border-b border-gray-700 flex-shrink-0 bg-gray-800/80 backdrop-blur-sm sticky top-0 z-10">
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="text-xl font-bold flex items-center gap-2"> <Users className="w-6 h-6 text-purple-400"/> Danh sách ứng viên </h2>
                            <p className="text-md text-blue-400 mt-1 truncate" title={job?.title}>{job?.title || 'Đang tải...'}</p>
                        </div>
                         <button onClick={onClose} className="text-gray-400 hover:text-white transition rounded-full p-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800"> <X className="w-6 h-6" /> </button>
                    </div>
                </div>

                {/* Content - Danh sách ứng viên */}
                <div className="p-3 sm:p-6 overflow-y-auto flex-grow bg-gray-800/50 styled-scrollbar">
                    {isLoading ? <div className="py-16"><LoadingSpinner text="Đang tải danh sách ứng viên..." /></div> :
                     error ? <div className="py-10"><ErrorDisplay message={error} onRetry={!applicantsProp ? () => {/* TODO: Implement retry logic */} : undefined}/></div> :
                     applicants.length === 0 ? (
                         <EmptyState
                             icon={Users}
                             title="Chưa có ứng viên nào"
                             message="Hiện tại chưa có sinh viên nào ứng tuyển vào vị trí này. Hãy chia sẻ tin tuyển dụng để thu hút thêm ứng viên!"
                         />
                     ) : (
                        // Danh sách ứng viên với animation
                        <motion.div layout className="space-y-3">
                            <AnimatePresence>
                                {applicants.map(applicant => (
                                    <ApplicantCard
                                        key={applicant.id} // Sử dụng application ID làm key
                                        applicant={applicant}
                                        getStatusInfo={getStatusInfo}
                                        onStatusUpdate={handleStatusUpdate} // Truyền callback xuống
                                    />
                                ))}
                            </AnimatePresence>
                        </motion.div>
                    )}
                </div>

                 {/* Footer (Chỉ nút đóng) */}
                 <div className="p-4 border-t border-gray-700 flex justify-end bg-gray-800/80 backdrop-blur-sm flex-shrink-0 sticky bottom-0 z-10">
                     <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }} onClick={onClose} className="py-2 px-6 bg-gray-600 rounded-md hover:bg-gray-500 transition duration-200 text-white font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 focus:ring-offset-gray-800">Đóng</motion.button>
                 </div>
            </motion.div>
        </div>
    );
};
ApplicantsModal.displayName = 'ApplicantsModal';


// File: /client/src/pages/RecruiterDashboardPage.jsx (Phần Components Tab Tìm Kiếm)
// (Bạn sẽ thay thế phần tương ứng trong file RecruiterDashboardPage.jsx bằng code này)

// --- CÁC COMPONENT CHO TAB TÌM KIẾM ỨNG VIÊN ---

/**
 * SearchPanel: Component giao diện cho phép nhà tuyển dụng nhập tiêu chí kỹ năng
 * để tìm kiếm ứng viên sinh viên đã được AI xác thực.
 * @param {function} onSearch - Callback function được gọi khi form submit với danh sách criteria hợp lệ.
 * @param {boolean} isSearching - Cờ báo trạng thái đang thực hiện tìm kiếm (để disable nút).
 */
const SearchPanel = React.memo(({ onSearch, isSearching }) => {
    // State quản lý các dòng tiêu chí tìm kiếm (kỹ năng + điểm tối thiểu)
    const [searchCriteria, setSearchCriteria] = useState([
        { id: Date.now(), name: '', minScore: '70' } // Bắt đầu với một dòng
    ]);
    // State quản lý lỗi hiển thị trên form
    const [formError, setFormError] = useState('');

    /** Xử lý thay đổi input trong một dòng tiêu chí */
    const handleCriteriaChange = useCallback((id, event) => {
        const { name, value } = event.target;
        setSearchCriteria(prevCriteria =>
            prevCriteria.map(criterion =>
                criterion.id === id ? { ...criterion, [name]: value } : criterion
            )
        );
        if (formError) setFormError(''); // Xóa lỗi khi sửa
    }, [formError]);

    /** Thêm một dòng tiêu chí mới */
    const handleAddCriterion = useCallback(() => {
        setSearchCriteria(prevCriteria => [
            ...prevCriteria,
            { id: Date.now(), name: '', minScore: '70' } // ID mới
        ]);
        if (formError) setFormError('');
    }, [formError]);

    /** Xóa một dòng tiêu chí */
    const handleRemoveCriterion = useCallback((id) => {
        if (searchCriteria.length <= 1) return; // Luôn giữ ít nhất 1 dòng
        setSearchCriteria(prevCriteria => prevCriteria.filter(criterion => criterion.id !== id));
        if (formError) setFormError('');
    }, [searchCriteria.length, formError]);

    /** Xử lý submit form tìm kiếm */
    const handleSubmit = useCallback((event) => {
        event.preventDefault();
        setFormError(''); // Reset lỗi

        // Lọc và chuẩn hóa criteria
        const validCriteria = searchCriteria
            .map(c => ({
                name: c.name.trim(),
                minScore: parseInt(c.minScore, 10) || 50 // Mặc định 50
            }))
            .filter(c => c.name !== ''); // Lọc bỏ dòng không có tên skill

        if (validCriteria.length === 0) {
            setFormError("Vui lòng nhập ít nhất một kỹ năng hợp lệ để tìm kiếm.");
            return;
        }
        onSearch(validCriteria); // Gọi callback với criteria hợp lệ
    }, [searchCriteria, onSearch]);

    // Animation Variants cho từng dòng tiêu chí
    const criterionRowVariant = {
        initial: { opacity: 0, x: -20, height: 0 },
        animate: { opacity: 1, x: 0, height: 'auto', transition: { duration: 0.3, ease: 'easeOut' } },
        exit: { opacity: 0, x: 20, height: 0, transition: { duration: 0.2, ease: 'easeIn' } }
    };

    return (
        // Container của panel, sticky khi cuộn
        <motion.div
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
            className="sticky top-24 bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg backdrop-blur-md"
        >
            <h2 className="text-xl font-bold mb-5 text-white flex items-center gap-2">
                <Filter className="w-5 h-5 text-purple-400" /> Bộ lọc Tìm kiếm Tài năng
            </h2>

            {/* Hiển thị lỗi form nếu có */}
            {formError && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-red-900/40 border border-red-700 text-red-300 px-3 py-2 rounded-md text-xs mb-4 flex items-center gap-1.5">
                    <Info className="w-4 h-4 flex-shrink-0"/> {formError}
                </motion.div>
            )}

            {/* Form tìm kiếm */}
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Danh sách các dòng tiêu chí */}
                <AnimatePresence initial={false}>
                    {searchCriteria.map((criterion, index) => (
                        <motion.div
                            key={criterion.id} // Key phải ổn định
                            variants={criterionRowVariant} initial="initial" animate="animate" exit="exit" layout
                            className="flex items-end gap-2 overflow-hidden"
                         >
                            {/* Input Tên Kỹ năng */}
                            <div className="flex-grow">
                                {index === 0 && <label htmlFor={`skillName-${criterion.id}`} className="text-xs font-medium text-gray-400 mb-1 block">Kỹ năng</label>}
                                <input
                                    id={`skillName-${criterion.id}`} type="text" placeholder="VD: React, Python..." name="name"
                                    value={criterion.name} onChange={e => handleCriteriaChange(criterion.id, e)}
                                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
                                    aria-label={`Skill name ${index + 1}`}
                                />
                            </div>
                            {/* Input Điểm Tối thiểu */}
                            <div className="w-24 flex-shrink-0">
                                {index === 0 && <label htmlFor={`minScore-${criterion.id}`} className="text-xs font-medium text-gray-400 mb-1 block">Điểm &ge;</label>}
                                <input
                                    id={`minScore-${criterion.id}`} type="number" name="minScore"
                                    value={criterion.minScore} onChange={e => handleCriteriaChange(criterion.id, e)}
                                    min="50" max="100" step="5"
                                    className="w-full px-2 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 text-center"
                                    aria-label={`Minimum score ${index + 1}`}
                                />
                            </div>
                            {/* Nút Xóa Tiêu chí */}
                            <button
                                type="button" onClick={() => handleRemoveCriterion(criterion.id)}
                                disabled={searchCriteria.length <= 1}
                                className={`p-2 text-gray-500 hover:text-red-400 transition duration-200 flex-shrink-0 mb-1 ${searchCriteria.length <= 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                                title="Xóa tiêu chí này" aria-label={`Remove criterion ${index + 1}`}
                            > <Trash2 className="w-4 h-4" /> </button>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {/* Nút Thêm Tiêu chí */}
                <button
                    type="button" onClick={handleAddCriterion}
                    className="w-full flex items-center justify-center gap-2 text-sm py-2 text-blue-400 hover:bg-gray-700/50 rounded-md transition duration-200 border border-dashed border-gray-600 hover:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-600"
                > <Plus className="w-4 h-4" /> Thêm tiêu chí kỹ năng </button>

                {/* Nút Submit Tìm kiếm */}
                <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-3 px-4 rounded-lg hover:from-blue-700 hover:to-purple-700 transition duration-300 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-gray-800 transform hover:scale-[1.02]"
                    disabled={isSearching} // Disable khi đang tìm
                >
                    {isSearching ? <Loader className="animate-spin w-5 h-5" /> : <Search className="w-5 h-5" />}
                    {isSearching ? 'Đang tìm...' : 'Tìm kiếm Ứng viên'}
                </button>
            </form>
        </motion.div>
    );
});
SearchPanel.displayName = 'SearchPanel'; // Tên component trong DevTools

/**
 * StudentSearchResultCard: Hiển thị thông tin tóm tắt của một sinh viên trong kết quả tìm kiếm.
 * @param {object} student - Dữ liệu sinh viên từ API search.
 */
const StudentSearchResultCard = React.memo(({ student }) => (
     // Card với animation và hiệu ứng hover
     <motion.div
        initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        layout // Cho phép animation khi danh sách thay đổi
        className="bg-gray-800 p-5 rounded-xl border border-gray-700/80 transition-all duration-300 hover:border-blue-500/70 hover:shadow-xl hover:-translate-y-1 backdrop-blur-sm bg-opacity-70"
     >
        <div className="flex flex-col sm:flex-row items-start gap-4">
            {/* Avatar */}
            <motion.img
                src={student.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(student.name || student.githubUsername)}&background=random&color=ffffff&size=80`}
                alt={student.name || student.githubUsername}
                className="w-16 h-16 rounded-full border-2 border-gray-600 flex-shrink-0 object-cover bg-gray-700"
                whileHover={{ scale: 1.1 }}
            />
            {/* Thông tin chính */}
            <div className="flex-1 min-w-0"> {/* min-w-0 quan trọng để text ellipsis hoạt động */}
                <div className="flex flex-col sm:flex-row justify-between items-start gap-2 mb-1.5">
                    {/* Tên và GitHub */}
                    <div className="min-w-0"> {/* Container cho text ellipsis */}
                         <h3 className="text-lg font-bold text-white truncate">{student.name || student.githubUsername}</h3>
                        <a href={`https://github.com/${student.githubUsername}`} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-400 hover:underline flex items-center gap-1 w-fit">
                            <Github className="w-4 h-4 flex-shrink-0" /> <span className="truncate">{student.githubUsername}</span>
                        </a>
                    </div>
                    {/* Nút Xem Hồ sơ (mở tab mới) */}
                     <Link
                        to={`/profile/${student.githubUsername}`}
                         target="_blank" // Mở trong tab mới
                         rel="noopener noreferrer" // Bảo mật và SEO
                         className="bg-gray-700 text-white text-xs font-bold py-1.5 px-4 rounded-full hover:bg-blue-600 transition duration-200 flex items-center gap-1.5 flex-shrink-0 mt-1 sm:mt-0 whitespace-nowrap"
                         title={`Xem hồ sơ chi tiết của ${student.name || student.githubUsername}`}
                     >
                         <ExternalLink className="w-3.5 h-3.5"/> Xem Hồ sơ
                     </Link>
                </div>
                {/* Bio */}
                <p className="text-sm text-gray-400 mt-1 line-clamp-2">{student.bio || <span className="italic opacity-70">Chưa có tiểu sử trên GitHub.</span>}</p>
                 {/* (Tùy chọn) Hiển thị điểm khớp hoặc các skill nổi bật */}
                 {student.totalMatchedScore > 0 && (
                     <div className="mt-3 text-xs text-purple-300 font-medium">
                        Điểm khớp: <span className="font-bold text-purple-200">{student.totalMatchedScore}</span>
                     </div>
                 )}
                 {/* <div className="mt-3 flex flex-wrap gap-1.5">
                    {student.highlightSkills?.map(skill => <span key={skill} className="bg-blue-900/70 text-blue-300 text-[11px] font-medium px-2 py-0.5 rounded-full">{skill}</span>)}
                 </div> */}
            </div>
        </div>
    </motion.div>
));
StudentSearchResultCard.displayName = 'StudentSearchResultCard'; // Tên component trong DevTools

/**
 * SearchTabContent: Component quản lý logic và hiển thị cho Tab Tìm kiếm Ứng viên.
 * Bao gồm SearchPanel và khu vực hiển thị kết quả (loading, error, empty, list).
 */
const SearchTabContent = React.memo(() => {
    // State lưu trữ kết quả tìm kiếm
    // null: Trạng thái ban đầu, chưa tìm kiếm
    // []: Không tìm thấy kết quả
    // [...]: Danh sách kết quả tìm thấy
    const [searchResults, setSearchResults] = useState(null);
    // State báo đang thực hiện tìm kiếm (gọi API)
    const [isSearching, setIsSearching] = useState(false);
    // State lưu trữ lỗi xảy ra trong quá trình tìm kiếm
    const [searchError, setSearchError] = useState('');

    /**
     * Hàm callback được gọi bởi SearchPanel khi người dùng submit tìm kiếm.
     * @param {Array<object>} criteria - Danh sách tiêu chí đã được validate [{ name, minScore }].
     */
     const handleSearch = useCallback(async (criteria) => {
        setIsSearching(true); // Bật loading
        setSearchResults(null); // Reset kết quả cũ khi bắt đầu tìm kiếm mới
        setSearchError(''); // Reset lỗi cũ
        console.log("[SearchTabContent] Starting student search with criteria:", criteria);
        try {
            // Gọi API searchStudents với criteria
            const results = await searchStudents(criteria);
            setSearchResults(results || []); // Lưu kết quả (đảm bảo là mảng)
            console.log(`[SearchTabContent] Search successful, found ${results?.length ?? 0} students.`);
        } catch (err) {
            console.error("[SearchTabContent] Student search error:", err);
            setSearchError(err.message || 'Tìm kiếm thất bại. Có lỗi xảy ra ở máy chủ.'); // Lưu lỗi
            setSearchResults([]); // Set mảng rỗng để hiển thị thông báo "Không tìm thấy"
        } finally {
            setIsSearching(false); // Tắt loading
        }
    }, []); // Callback này không có dependency vì nó chỉ gọi API và set state

    // --- Render Logic cho Khu vực Kết quả ---
    const renderResults = () => {
        // 1. Trạng thái đang tìm kiếm
        if (isSearching) {
            return (
                <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="pt-10">
                    <LoadingSpinner text="Đang tìm kiếm ứng viên tài năng..." size="lg" />
                </motion.div>
            );
        }
        // 2. Trạng thái lỗi
        if (searchError) {
             return (
                 <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-6">
                    {/* Cho phép thử lại bằng cách gọi lại onSearch (cần lưu lại criteria) - Tạm thời không retry */}
                    <ErrorDisplay message={searchError} details="Vui lòng thử lại hoặc điều chỉnh tiêu chí tìm kiếm." />
                 </motion.div>
             );
        }
        // 3. Trạng thái ban đầu (chưa tìm kiếm)
        if (searchResults === null) {
             return (
                 <motion.div key="initial" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                     <EmptyState
                        icon={Search}
                        title="Bắt đầu Hành trình Tìm kiếm Tài năng"
                        message="Sử dụng bộ lọc bên trái để nhập các kỹ năng và điểm số tối thiểu mong muốn. Hệ thống sẽ tìm kiếm các sinh viên có năng lực đã được EduLedger AI xác thực."
                    />
                 </motion.div>
             );
        }
        // 4. Trạng thái không tìm thấy kết quả
        if (searchResults.length === 0) {
             return (
                 <motion.div key="noresults" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                     <EmptyState
                        icon={Users}
                        title="Không tìm thấy ứng viên phù hợp"
                        message="Rất tiếc, không có sinh viên nào khớp với tất cả các tiêu chí bạn đã nhập. Hãy thử giảm bớt số lượng kỹ năng, hạ mức điểm yêu cầu, hoặc tìm kiếm với từ khóa rộng hơn."
                    />
                 </motion.div>
             );
        }
        // 5. Hiển thị danh sách kết quả
        return (
             <motion.div
                key="results"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="space-y-4"
            >
                 {/* Tiêu đề kết quả */}
                 <h2 className="text-xl font-bold text-white mb-4">
                    Tìm thấy <span className="text-blue-400">{searchResults.length}</span> ứng viên tiềm năng:
                 </h2>
                 {/* Danh sách các card ứng viên */}
                 <motion.div layout className="space-y-4">
                    <AnimatePresence>
                         {searchResults.map(student => (
                            <StudentSearchResultCard key={student.id} student={student} />
                        ))}
                    </AnimatePresence>
                 </motion.div>
             </motion.div>
        );
    };

    // --- JSX của SearchTabContent ---
     return (
        // Layout 2 cột: Filter bên trái, Results bên phải
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Cột Filter */}
            <aside className="lg:col-span-4 xl:col-span-3">
                 <SearchPanel onSearch={handleSearch} isSearching={isSearching} />
            </aside>
            {/* Cột Kết quả */}
            <main className="lg:col-span-8 xl:col-span-9 min-h-[400px]"> {/* min-h để giữ layout khi loading/empty */}
                 {/* Sử dụng AnimatePresence để chuyển đổi mượt mà giữa các trạng thái */}
                 <AnimatePresence mode="wait">
                    {renderResults()}
                </AnimatePresence>
            </main>
        </div>
    );
});
SearchTabContent.displayName = 'SearchTabContent'; // Tên component trong DevTools

// ==========================================================
// === COMPONENT CHÍNH CỦA TRANG DASHBOARD (MASTER v2.1) ===
// ==========================================================
export default function RecruiterDashboardPage() {
    // --- State & Hooks ---
    const { user: authUser, isLoading: isAuthLoading } = useAuth(); // Auth hook
    const navigate = useNavigate(); // Navigation hook
    const [searchParams, setSearchParams] = useSearchParams(); // URL Params hook
    // State quản lý loading chung của trang (chỉ lần đầu)
    const [isLoadingPage, setIsLoadingPage] = useState(true);
    // State quản lý tab đang active (đồng bộ với URL)
    const [activeTab, setActiveTab] = useState(() => searchParams.get('tab') || 'jobs'); // Đọc từ URL hoặc mặc định
    // State lưu trữ dữ liệu thống kê
    const [stats, setStats] = useState({ totalStudents: 0, postedJobs: 0, totalApplicants: 0 });
    // State lưu trữ danh sách jobs của NTD
    const [jobs, setJobs] = useState([]);
    // State quản lý loading cho từng phần dữ liệu
    const [isLoadingStats, setIsLoadingStats] = useState(true);
    const [isLoadingJobs, setIsLoadingJobs] = useState(true);
    // State lưu trữ lỗi chung của trang (fetch stats hoặc jobs)
    const [pageError, setPageError] = useState('');
    // State cho Modal Applicants (Cha quản lý)
    const [viewingApplicantsFor, setViewingApplicantsFor] = useState(null); // Lưu trữ job object đang xem
    const [applicantsData, setApplicantsData] = useState([]); // Dữ liệu ứng viên cho modal
    const [isLoadingApplicants, setIsLoadingApplicants] = useState(false); // Loading cho modal
    const [applicantsError, setApplicantsError] = useState(''); // Lỗi cho modal
    // Dữ liệu giả cho biểu đồ stats (sẽ thay bằng dữ liệu thật nếu có API)
    const fakeChartData = useMemo(() => Array.from({ length: 7 }, (_, i) => ({ name: `Day ${i + 1}`, value: Math.floor(Math.random() * 25) })), []);

     // --- Đồng bộ Tab với URL ---
     useEffect(() => {
        const tabFromUrl = searchParams.get('tab');
        // Chỉ cập nhật state nếu tab từ URL hợp lệ và khác state hiện tại
        if (tabFromUrl && ['jobs', 'search', /*'analytics', 'settings'*/].includes(tabFromUrl)) {
            if (tabFromUrl !== activeTab) {
                 setActiveTab(tabFromUrl);
                 console.log(`[RecruiterDashboard] Switched tab based on URL: ${tabFromUrl}`);
            }
        } else if (!tabFromUrl && activeTab !== 'jobs') {
             // Nếu URL không có tab, và state không phải là default, reset về default
             changeTab('jobs'); // Cập nhật cả state và URL
        }
    }, [searchParams, activeTab]); // Chỉ chạy khi searchParams hoặc activeTab (nội bộ) thay đổi

     // Hàm đổi tab và cập nhật URL (dùng replace để không tạo history)
     const changeTab = useCallback((tabId) => {
         if (tabId !== activeTab) {
             console.log(`[RecruiterDashboard] Changing tab to: ${tabId}`);
             setActiveTab(tabId);
             const nextParams = new URLSearchParams(searchParams);
             nextParams.set('tab', tabId);
             setSearchParams(nextParams, { replace: true });
         }
     }, [activeTab, searchParams, setSearchParams]);

    // --- Data Fetching ---
    // Fetch dữ liệu dashboard (stats và jobs)
    const fetchDashboardData = useCallback(async (showLoading = true) => {
         if (showLoading) { setIsLoadingStats(true); setIsLoadingJobs(true); }
         setPageError(''); // Reset lỗi trước khi fetch
         console.log("[RecruiterDashboard] Attempting to fetch dashboard data...");
         try {
             // Sử dụng Promise.allSettled để xử lý lỗi riêng lẻ
             const [statsRes, jobsRes] = await Promise.allSettled([ getRecruiterStats(), getRecruiterJobs() ]);

             // Xử lý kết quả stats
             if (statsRes.status === 'fulfilled') {
                 setStats(statsRes.value || { totalStudents: 0, postedJobs: 0, totalApplicants: 0 }); // Đảm bảo stats có giá trị
                 console.log("[RecruiterDashboard] Stats fetched successfully:", statsRes.value);
             } else {
                 console.error("[RecruiterDashboard] Failed to fetch stats:", statsRes.reason);
                 setPageError(prevError => prevError || 'Không thể tải dữ liệu thống kê.'); // Chỉ set lỗi nếu chưa có lỗi nào
             }

             // Xử lý kết quả jobs
             if (jobsRes.status === 'fulfilled') {
                setJobs(jobsRes.value || []); // Đảm bảo jobs là mảng
                console.log("[RecruiterDashboard] Jobs fetched successfully:", jobsRes.value?.length ?? 0);
             } else {
                 console.error("[RecruiterDashboard] Failed to fetch jobs:", jobsRes.reason);
                 setPageError(prevError => prevError || 'Không thể tải danh sách tin tuyển dụng.'); // Chỉ set lỗi nếu chưa có lỗi nào
             }
         } catch (error) { // Lỗi ngoài dự kiến trong Promise.allSettled hoặc logic khác
             console.error("[RecruiterDashboard] Unexpected error during dashboard data fetch:", error);
             setPageError('Đã có lỗi không mong muốn xảy ra khi tải dữ liệu.');
         } finally {
             // Tắt loading flags
             setIsLoadingStats(false);
             setIsLoadingJobs(false);
             // Chỉ tắt loading page sau lần fetch đầu tiên thành công hoặc thất bại
             if (isLoadingPage) setIsLoadingPage(false);
             console.log("[RecruiterDashboard] Dashboard data fetch process completed.");
         }
     }, [isLoadingPage]); // Dependency là isLoadingPage để biết là lần load đầu

     // Effect kiểm tra Authentication và gọi Fetch Data
     useEffect(() => {
        if (isAuthLoading) {
             console.log("[RecruiterDashboard] Waiting for authentication check...");
             return; // Chờ auth load xong
        }
        if (!authUser || authUser.role !== 'recruiter') {
             console.warn("[RecruiterDashboard] User not authenticated or not a recruiter. Redirecting to login.");
            navigate('/recruiter/login', { replace: true }); // Chuyển hướng nếu không hợp lệ
            return; // Dừng thực thi effect
        }
        // Nếu đã xác thực là recruiter, gọi fetch data
         console.log("[RecruiterDashboard] User authenticated as recruiter. Fetching data...");
        fetchDashboardData();
     }, [authUser, isAuthLoading, navigate, fetchDashboardData]); // Dependencies


    // --- Event Handlers ---
    /** Mở modal xem ứng viên và fetch dữ liệu ứng viên */
    const handleJobClick = useCallback(async (job) => {
        if (!job || !job.id) return;
        console.log(`[RecruiterDashboard] Job row clicked, opening applicants modal for job: ${job.id} (${job.title})`);
        setViewingApplicantsFor(job); // Lưu job đang xem để mở modal
        setApplicantsData([]); // Xóa dữ liệu ứng viên cũ
        setApplicantsError(''); // Xóa lỗi cũ
        setIsLoadingApplicants(true); // Bật loading cho modal
        try {
            const data = await getApplicantsForJob(job.id); // Gọi API lấy applicants
            setApplicantsData(data || []); // Cập nhật state applicants
            console.log(`[RecruiterDashboard] Successfully fetched ${data?.length ?? 0} applicants for job ${job.id}.`);
        } catch (err) {
            console.error(`[RecruiterDashboard] Error fetching applicants for job ${job.id}:`, err);
            setApplicantsError(err.message || "Lỗi khi tải danh sách ứng viên."); // Lưu lỗi
        } finally {
            setIsLoadingApplicants(false); // Tắt loading cho modal
        }
    }, []); // Không có dependency vì chỉ dùng state setters

    /** Đóng modal xem ứng viên */
    const closeApplicantsModal = useCallback(() => {
        console.log("[RecruiterDashboard] Closing applicants modal.");
        setViewingApplicantsFor(null); // Reset job đang xem
        // Không cần reset applicantsData/Error/Loading ở đây vì sẽ được reset khi mở lại
    }, []);

    // ** CRUD Job Handlers (GIẢ LẬP VỚI DELAY VÀ CẬP NHẬT UI) **
    /** Xử lý khi nhấn nút Sửa Job */
    const handleEditJob = useCallback((job) => {
        console.log("[RecruiterDashboard] Edit job button clicked (Not Implemented Yet):", job.id);
        // Chuyển hướng đến trang sửa job (ví dụ)
        // navigate(`/recruiter/jobs/edit/${job.id}`);
        alert(`Master Feature Placeholder:\nChức năng "Chỉnh sửa Tin Tuyển dụng #${job.id}" sẽ được triển khai tại đây.\nHiện tại sẽ chuyển hướng đến trang tạo mới.`);
        navigate(`/recruiter/jobs/new`); // Tạm thời
    }, [navigate]); // Dependency là navigate

    /** Xử lý khi nhấn nút Xóa Job */
    const handleDeleteJob = useCallback(async (jobId) => {
        console.log(`[RecruiterDashboard] Delete job button clicked: ${jobId}`);
        // Hiển thị hộp thoại xác nhận với thông tin chi tiết hơn
        const jobToDelete = jobs.find(j => j.id === jobId);
        if (!jobToDelete) return; // Không tìm thấy job (hiếm khi xảy ra)
        if (window.confirm(`XÁC NHẬN XÓA VĨNH VIỄN\n\nBạn có chắc chắn muốn xóa tin tuyển dụng:\n"${jobToDelete.title}"?\n\nHành động này không thể hoàn tác và các đơn ứng tuyển liên quan cũng sẽ bị ảnh hưởng.`)) {
            console.log(`[RecruiterDashboard] User confirmed deletion for job ${jobId}. Faking API call...`);
            // --- GIẢ LẬP GỌI API XÓA ---
            const originalJobs = [...jobs]; // Lưu lại state cũ để rollback nếu cần
            // Cập nhật UI ngay lập tức (Optimistic Update)
            setJobs(prev => prev.filter(j => j.id !== jobId));
            setIsLoadingJobs(true); // Có thể dùng loading riêng cho hành động xóa
            await sleep(1200); // Giả lập chờ mạng
            try {
                // const response = await apiDeleteJob(jobId); // Gọi API thật
                console.log(`[RecruiterDashboard - FAKE] Job ${jobId} 'deleted' successfully.`);
                // Cập nhật lại stats (giảm số job)
                 setStats(prev => ({...prev, postedJobs: Math.max(0, prev.postedJobs - 1)}));
                // TODO: Hiển thị Toast thông báo thành công
            } catch (error) {
                console.error(`[RecruiterDashboard - FAKE] Error deleting job ${jobId}:`, error);
                alert(`Lỗi khi xóa job: ${error.message}\nKhôi phục lại danh sách.`);
                setJobs(originalJobs); // Rollback UI nếu API thất bại
                // TODO: Hiển thị Toast thông báo lỗi
            } finally {
                 setIsLoadingJobs(false); // Tắt loading (nếu dùng)
            }
            // --- KẾT THÚC GIẢ LẬP ---
        } else {
             console.log(`[RecruiterDashboard] Deletion cancelled for job ${jobId}.`);
        }
    }, [jobs]); // Dependency là jobs để lấy jobToDelete và rollback

    /** Xử lý khi nhấn nút Đổi trạng thái Job (Ẩn/Hiện) */
     const handleChangeJobStatus = useCallback(async (jobId, newStatus) => {
        console.log(`[RecruiterDashboard] Change status button clicked for job ${jobId} to ${newStatus}`);
        const actionText = newStatus === 'Active' ? 'hiển thị lại công khai' : 'ẩn đi';
        const jobToChange = jobs.find(j => j.id === jobId);
        if (!jobToChange) return;
        if (window.confirm(`XÁC NHẬN THAY ĐỔI TRẠNG THÁI\n\nBạn có muốn ${actionText} tin tuyển dụng:\n"${jobToChange.title}" không?`)) {
            console.log(`[RecruiterDashboard] User confirmed status change for job ${jobId}. Faking API call...`);
            // --- GIẢ LẬP GỌI API ---
            const originalJobs = [...jobs];
            // Optimistic Update UI
            setJobs(prev => prev.map(j => j.id === jobId ? {...j, status: newStatus, updatedAt: new Date().toISOString()} : j));
            // Có thể thêm hiệu ứng loading nhẹ trên dòng đó
            await sleep(800);
            try {
                // const updatedJob = await apiChangeJobStatus(jobId, newStatus); // Gọi API thật
                console.log(`[RecruiterDashboard - FAKE] Job ${jobId} status changed to ${newStatus}.`);
                // Cập nhật lại job trong state với data trả về từ API (nếu cần)
                // setJobs(prev => prev.map(j => j.id === jobId ? updatedJob : j));
                // TODO: Hiển thị Toast thành công
            } catch (error) {
                 console.error(`[RecruiterDashboard - FAKE] Error changing job ${jobId} status:`, error);
                 alert(`Lỗi khi đổi trạng thái job: ${error.message}\nKhôi phục lại trạng thái cũ.`);
                 setJobs(originalJobs); // Rollback UI
                 // TODO: Hiển thị Toast lỗi
            } finally {
                 // Tắt hiệu ứng loading nếu có
            }
            // --- KẾT THÚC GIẢ LẬP ---
        } else {
             console.log(`[RecruiterDashboard] Status change cancelled for job ${jobId}.`);
        }
    }, [jobs]); // Dependency là jobs


    // --- Tabs Configuration (Đầy đủ callbacks) ---
    const tabs = useMemo(() => [
        { id: 'jobs', label: 'Quản lý Tuyển dụng', icon: Briefcase, component: <JobsManagementTable jobs={jobs} isLoading={isLoadingJobs} error={pageError} onJobClick={handleJobClick} selectedJobId={viewingApplicantsFor?.id} onEditJob={handleEditJob} onDeleteJob={handleDeleteJob} onChangeJobStatus={handleChangeJobStatus} /> },
        { id: 'search', label: 'Tìm kiếm Ứng viên', icon: Search, component: <SearchTabContent /> },
        // { id: 'analytics', label: 'Phân tích', icon: Activity, component: <div className="p-6 text-gray-500 italic">Tính năng phân tích hiệu quả tuyển dụng sẽ sớm ra mắt...</div> },
        // { id: 'settings', label: 'Cài đặt', icon: Settings, component: <div className="p-6 text-gray-500 italic">Khu vực cài đặt tài khoản và thông tin công ty...</div> },
    ], [jobs, isLoadingJobs, pageError, handleJobClick, viewingApplicantsFor?.id, handleEditJob, handleDeleteJob, handleChangeJobStatus]); // Đầy đủ dependencies


    // --- Render Logic ---
    // 1. Loading toàn trang ban đầu
    if (isLoadingPage || isAuthLoading) {
        return <div className="bg-gray-900 min-h-screen flex items-center justify-center"><LoadingSpinner text="Đang tải Trung tâm Chỉ huy..." size="lg" /></div>;
    }
    // 2. Lỗi nghiêm trọng không thể load jobs hoặc stats lần đầu
    // (Kiểm tra lỗi và đảm bảo jobs là mảng trước khi check length)
    if (pageError && (!Array.isArray(jobs) || jobs.length === 0) && isLoadingPage === false) {
        return <div className="bg-gray-900 min-h-screen flex items-center justify-center p-6"><ErrorDisplay message={pageError} details="Không thể tải dữ liệu cần thiết cho dashboard. Vui lòng thử lại." onRetry={fetchDashboardData} /></div>;
    }

    // 3. Render giao diện chính
    return (
        <>
            <Helmet> <title>Trung tâm Chỉ huy Tuyển dụng | EduLedger AI</title> <meta name="description" content="Quản lý tin tuyển dụng, tìm kiếm ứng viên..." /> </Helmet>

            <div className="bg-gradient-to-br from-gray-900 via-gray-900 to-indigo-900/20 min-h-screen text-white">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12 relative">
                    {/* Background Animation */}
                    <div className="absolute inset-0 overflow-hidden -z-10 opacity-70"> <motion.div /* Blob 1 */ /> <motion.div /* Blob 2 */ /> </div>

                    {/* Header Section */}
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

                    {/* Stats Section */}
                    <motion.div variants={{ visible: { transition: { staggerChildren: 0.1 } } }} initial="hidden" animate="visible" className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6 mb-10 md:mb-12 relative z-10">
                         <StatCard title="Hồ sơ Sinh viên (Toàn hệ thống)" value={stats.totalStudents} icon={Users} color="blue" isLoading={isLoadingStats} data={fakeChartData} detailLink={`/recruiter/dashboard?tab=search`} />
                         <StatCard title="Tin Tuyển dụng Đã đăng" value={stats.postedJobs} icon={Briefcase} color="green" isLoading={isLoadingStats} data={fakeChartData} detailLink={`/recruiter/dashboard?tab=jobs`}/>
                         <StatCard title="Tổng Lượt Ứng tuyển (Vào tin của bạn)" value={stats.totalApplicants} icon={TrendingUp} color="purple" isLoading={isLoadingStats} data={fakeChartData} />
                    </motion.div>

                    {/* Tab Navigation */}
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

                    {/* Tab Content */}
                     <div className="relative z-10">
                         <AnimatePresence mode="wait">
                             <motion.div key={activeTab} variants={tabContentVariant} initial="initial" animate="animate" exit="exit">
                                {tabs.find(tab => tab.id === activeTab)?.component}
                            </motion.div>
                         </AnimatePresence>
                     </div>
                </div>
                 {/* CSS nội bộ cho scrollbar và background animation */}
                 <style jsx global>{`
                    .styled-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
                    .styled-scrollbar::-webkit-scrollbar-track { background: transparent; }
                    .styled-scrollbar::-webkit-scrollbar-thumb { background-color: rgba(107, 114, 128, 0.5); border-radius: 20px; border: transparent; }
                    .styled-scrollbar::-webkit-scrollbar-thumb:hover { background-color: rgba(156, 163, 175, 0.6); }
                    .scrollbar-hide::-webkit-scrollbar { display: none; }
                    .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
                 `}</style>
            </div>

            {/* Modal Applicants (Truyền state đầy đủ) */}
             <AnimatePresence>
                {viewingApplicantsFor && (
                    <ApplicantsModal
                         key={`modal-${viewingApplicantsFor.id}`} // Quan trọng để reset modal khi đổi job
                         job={viewingApplicantsFor}
                         onClose={closeApplicantsModal}
                         applicants={applicantsData}
                         isLoading={isLoadingApplicants}
                         error={applicantsError}
                         setApplicants={setApplicantsData} // Truyền setter để con cập nhật state của cha
                    />
                )}
            </AnimatePresence>
             {/* Modal Edit Job (Sẽ thêm sau) */}
             {/* <AnimatePresence> {editingJob && <EditJobModal job={editingJob} onClose={...} onSave={...} />} </AnimatePresence> */}
        </>
    );
}

// Thêm displayName cho các component con để dễ debug trong React DevTools
StatCard.displayName = 'StatCard';
JobManagementRow.displayName = 'JobManagementRow';
JobsManagementTable.displayName = 'JobsManagementTable';
ApplicantCard.displayName = 'ApplicantCard';
ApplicantsModal.displayName = 'ApplicantsModal';
SearchPanel.displayName = 'SearchPanel';
StudentSearchResultCard.displayName = 'StudentSearchResultCard';
SearchTabContent.displayName = 'SearchTabContent';