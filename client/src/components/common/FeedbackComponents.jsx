// File: client/src/components/common/FeedbackComponents.jsx
// Tập hợp các component hiển thị trạng thái Loading, Error, Empty
// ĐÃ SỬA LỖI RENDER ICON TRONG EMPTYSTATE

import React from 'react';
import { motion } from 'framer-motion';
import { Loader, AlertCircle, Info, ServerCrash, Inbox } from 'lucide-react'; // Thêm icons

/**
 * LoadingSpinner: Hiển thị trạng thái Loading tinh tế
 * @param {string} text - Văn bản hiển thị bên dưới spinner
 * @param {'sm'|'md'|'lg'} size - Kích thước spinner ('sm', 'md', 'lg')
 */
export const LoadingSpinner = ({ text = "Đang tải...", size = 'md' }) => {
    const sizeClasses = {
        sm: 'h-6 w-6 border-2', // Border nhỏ hơn cho size sm
        md: 'h-10 w-10 border-4',
        lg: 'h-16 w-16 border-4'
    };
    const textSizeClass = size === 'sm' ? 'text-xs' : 'text-sm';

    return (
        <div className="flex flex-col items-center justify-center gap-3 text-center text-gray-400 py-8">
            <Loader className={`animate-spin text-blue-500 ${sizeClasses[size]}`} />
            {text && <p className={`${textSizeClass} mt-1`}>{text}</p>}
        </div>
    );
};

/**
 * ErrorDisplay: Hiển thị lỗi thân thiện với nút Retry (tùy chọn)
 * @param {string} message - Thông báo lỗi chính
 * @param {string} details - Thông tin chi tiết hơn (tùy chọn)
 * @param {function} onRetry - Hàm callback khi nhấn nút Thử lại
 */
export const ErrorDisplay = ({ message = "Đã có lỗi xảy ra.", details, onRetry }) => (
    <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-red-900/40 border border-red-700/60 text-red-300 px-6 py-5 rounded-lg flex flex-col items-center text-center shadow-md my-6 max-w-lg mx-auto"
    >
        <AlertCircle className="w-10 h-10 mb-3 text-red-400" />
        <p className="font-semibold text-lg text-red-200 mb-1">Oops! Có lỗi xảy ra</p>
        <p className="text-sm text-red-300 mb-3">{message}</p>
        {details && <p className="text-xs text-red-400/80 mb-4">{details}</p>}
        {onRetry && (
            <button
                onClick={onRetry}
                className="bg-red-600 hover:bg-red-700 text-white text-sm font-semibold py-2 px-5 rounded transition duration-200 shadow hover:shadow-lg"
            >
                Thử lại
            </button>
        )}
    </motion.div>
);

/**
 * EmptyState: Khung hiển thị khi không có dữ liệu
 * @param {React.ElementType | React.ReactNode} icon - Component Icon hoặc Element Icon (VD: Inbox, <BriefcaseIcon/>)
 * @param {string} title - Tiêu đề chính
 * @param {string} message - Mô tả chi tiết hơn
 * @param {React.ReactNode} actionButton - Nút hành động (VD: Link, button)
 */
export const EmptyState = ({ icon: IconInput = Inbox, title = "Không có dữ liệu", message, actionButton }) => (
    <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="text-center py-16 px-6 bg-gray-800/60 rounded-xl border-2 border-dashed border-gray-700 flex flex-col items-center backdrop-blur-sm mt-6"
    >
        {/* Sửa cách render Icon */}
        {IconInput && (
            <div className="w-16 h-16 text-gray-500 mb-5">
                {React.isValidElement(IconInput) ? (
                    // Nếu đã là element (VD: <BriefcaseIcon className="..."/>), clone và set lại class
                    React.cloneElement(IconInput, { className: "w-full h-full" })
                ) : (typeof IconInput === 'function' || typeof IconInput === 'object') ? (
                    // Nếu là component type (VD: BriefcaseIcon), tạo element mới
                    React.createElement(IconInput, { className: "w-full h-full" })
                ) : null}
            </div>
        )}
        <h3 className="text-xl sm:text-2xl font-semibold text-white mb-2">{title}</h3>
        {message && <p className="mt-1 text-gray-400 max-w-md mx-auto">{message}</p>}
        {actionButton && <div className="mt-6">{actionButton}</div>}
    </motion.div>
);

// Bạn có thể thêm các component feedback khác ở đây nếu cần
// Ví dụ: SuccessMessage, InfoMessage, ...

console.log("✅ common/FeedbackComponents.jsx loaded."); // Log để xác nhận file được load