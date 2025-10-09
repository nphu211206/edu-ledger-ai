// File: client/src/components/common/Spinner.jsx
// HÃY THAY THẾ TOÀN BỘ NỘI DUNG FILE NÀY
import React from 'react';

const Spinner = () => {
    return (
        <div className="flex flex-col items-center justify-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-t-4 border-blue-600"></div>
            <p className="text-gray-600">Đang tải dữ liệu...</p>
        </div>
    );
};

export default Spinner;