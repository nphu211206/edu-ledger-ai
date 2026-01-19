// File: client/src/components/common/Pagination.jsx
// HÃY THAY THẾ TOÀN BỘ NỘI DUNG FILE NÀY
import React from 'react';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react'; // Thêm MoreHorizontal

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
    if (totalPages <= 1) return null;

    const MAX_VISIBLE_PAGES = 5; // Số lượng nút trang tối đa hiển thị (không tính prev/next/ellipsis)

    const renderPageNumbers = () => {
        const pageNumbers = [];
        if (totalPages <= MAX_VISIBLE_PAGES + 2) { // Hiển thị tất cả nếu <= 7 trang
            for (let i = 1; i <= totalPages; i++) {
                pageNumbers.push(i);
            }
        } else {
            pageNumbers.push(1); // Luôn hiển thị trang 1
            const startPage = Math.max(2, currentPage - Math.floor((MAX_VISIBLE_PAGES - 2) / 2));
            const endPage = Math.min(totalPages - 1, startPage + MAX_VISIBLE_PAGES - 3);

            if (startPage > 2) {
                pageNumbers.push('...');
            }

            for (let i = startPage; i <= endPage; i++) {
                pageNumbers.push(i);
            }

            if (endPage < totalPages - 1) {
                pageNumbers.push('...');
            }

            pageNumbers.push(totalPages); // Luôn hiển thị trang cuối
        }

        return pageNumbers.map((page, index) =>
            page === '...' ? (
                <span key={`ellipsis-${index}`} className="px-4 py-2 text-gray-500">
                     <MoreHorizontal className="h-5 w-5" />
                </span>
            ) : (
                <button
                    key={page}
                    onClick={() => onPageChange(page)}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        currentPage === page
                            ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-300 ring-offset-1'
                            : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                    }`}
                    aria-current={currentPage === page ? 'page' : undefined}
                    aria-label={`Go to page ${page}`}
                >
                    {page}
                </button>
            )
        );
    };


    return (
        <nav className="flex items-center justify-center space-x-1 sm:space-x-2" aria-label="Pagination">
            <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-300 transition-colors"
                aria-label="Previous page"
            >
                <span className="sr-only">Previous</span>
                <ChevronLeft className="h-5 w-5" />
            </button>

            {renderPageNumbers()}

            <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-300 transition-colors"
                aria-label="Next page"
            >
                <span className="sr-only">Next</span>
                <ChevronRight className="h-5 w-5" />
            </button>
        </nav>
    );
};

export default Pagination;