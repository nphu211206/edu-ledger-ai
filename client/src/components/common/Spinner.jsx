// File: client/src/components/common/Spinner.jsx
// HÃY THAY THẾ TOÀN BỘ NỘI DUNG FILE NÀY
import React from 'react';

const Spinner = ({ text = "Đang tải dữ liệu..." }) => {
    return (
        <div className="flex flex-col items-center justify-center gap-4 text-center">
            <div
                className="animate-spin rounded-full h-12 w-12 border-b-4 border-t-4 border-blue-600"
                role="status" // Accessibility attribute
            >
                {/* Screen reader text */}
                <span className="sr-only">Loading...</span>
            </div>
            {text && <p className="text-gray-600 dark:text-gray-400 mt-2">{text}</p>}
        </div>
    );
};

export default Spinner;