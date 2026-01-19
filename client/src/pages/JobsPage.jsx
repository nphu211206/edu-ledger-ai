// File: client/src/pages/JobsPage.jsx
// PHIÊN BẢN TỐI THƯỢNG - ĐÃ KHÔI PHỤC VÀ TỐI ƯU

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'react-router-dom'; // Dùng URLSearchParams để quản lý filter

// --- API & Hooks ---
import { getJobs } from '../services/api';
import { useAuth } from '../hooks/useAuth';

// --- Components Đẳng Cấp ---
import { ApplyModal } from '../components/jobs/ApplyModal';
import JobsFilter from '../components/jobs/JobsFilter'; // Component Filter đã nâng cấp
import JobCard from '../components/jobs/JobCard';       // Component JobCard
import Pagination from '../components/common/Pagination'; // Component Pagination đã nâng cấp
// Import các component tiện ích
import { LoadingSpinner, ErrorDisplay, EmptyState } from '../components/common/FeedbackComponents'; // Đường dẫn đúngimport { Briefcase } from 'lucide-react'; // Icon cho EmptyState

// --- Animation Variants ---
const pageVariants = {
    initial: { opacity: 0, y: 20 },
    in: { opacity: 1, y: 0 },
    out: { opacity: 0, y: -20 }
};

const listVariants = {
    visible: { transition: { staggerChildren: 0.08 } },
    hidden: {}
};

// ==========================================================
// === COMPONENT CHÍNH: JobsPage ===
// ==========================================================
export default function JobsPage() {
    const { isAuthenticated } = useAuth();
    const [searchParams, setSearchParams] = useSearchParams(); // Quản lý state filter qua URL

    // --- State Quản lý Dữ liệu Jobs ---
    const [jobs, setJobs] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [totalJobs, setTotalJobs] = useState(0);

    // --- State Quản lý Filter (Đọc từ URL) ---
    // Sử dụng useMemo để chỉ parse URL một lần khi searchParams thay đổi
    const currentFilters = useMemo(() => {
        const params = {};
        searchParams.forEach((value, key) => {
            if (key === 'jobTypes') {
                // Parse mảng jobTypes từ URL (nếu có)
                params[key] = value.split(',');
            } else if (value) { // Chỉ lấy param có giá trị
                params[key] = value;
            }
        });
        return params;
    }, [searchParams]);

     // Đọc trang hiện tại từ URL hoặc mặc định là 1
    useEffect(() => {
        const pageFromUrl = parseInt(searchParams.get('page') || '1', 10);
        setCurrentPage(isNaN(pageFromUrl) || pageFromUrl < 1 ? 1 : pageFromUrl);
    }, [searchParams]);


    // --- State Cho Chức năng Ứng tuyển ---
    const [applyingJob, setApplyingJob] = useState(null); // Job object đang được apply
    const [appliedJobs, setAppliedJobs] = useState(new Set()); // Set các jobId đã apply thành công

    // --- Hàm Fetch Dữ liệu Jobs (Tối ưu với useCallback) ---
    const fetchJobs = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        console.log(`[JobsPage] Fetching jobs - Page: ${currentPage}, Filters:`, currentFilters);
        try {
            // Gọi API với filters và page lấy từ state (đã được cập nhật từ URL)
            const data = await getJobs(currentFilters, currentPage);
            console.log("[JobsPage] Received jobs data:", data);
            setJobs(data.jobs || []); // Đảm bảo jobs là mảng
            setTotalPages(data.totalPages || 0);
            setTotalJobs(data.totalJobs || 0);
        } catch (err) {
            console.error("[JobsPage] Fetch error:", err);
            setError(err.message || 'Lỗi khi tải danh sách việc làm. Vui lòng thử lại.');
            setJobs([]); // Reset jobs khi có lỗi
            setTotalPages(0);
            setTotalJobs(0);
        } finally {
            setIsLoading(false);
            console.log("[JobsPage] Fetch complete.");
        }
    // Dependency: fetch lại khi filter hoặc page thay đổi
    }, [currentFilters, currentPage]);

    // --- Effect Trigger Fetch Dữ liệu ---
    useEffect(() => {
        fetchJobs();
    }, [fetchJobs]); // Chỉ fetch lại khi hàm fetchJobs thay đổi (do filters hoặc page thay đổi)

    // --- Event Handlers ---

    /** Xử lý khi Filter thay đổi */
    const handleFilterChange = useCallback((newFilters) => {
        console.log("[JobsPage] Filters changed:", newFilters);
        const nextParams = new URLSearchParams();
        // Xây dựng params mới, loại bỏ giá trị rỗng/mặc định
        Object.entries(newFilters).forEach(([key, value]) => {
            if (key === 'jobTypes' && Array.isArray(value) && value.length > 0) {
                nextParams.set(key, value.join(',')); // Nối mảng thành chuỗi
            } else if (key !== 'jobTypes' && value && value !== 'Tất cả') {
                nextParams.set(key, value);
            }
        });
        nextParams.set('page', '1'); // Luôn reset về trang 1 khi filter
        setSearchParams(nextParams, { replace: true }); // Cập nhật URL, replace để không lưu lịch sử filter
    }, [setSearchParams]);

    /** Xử lý khi Chuyển trang */
    const handlePageChange = useCallback((page) => {
        if (page > 0 && page <= totalPages && page !== currentPage) {
            console.log(`[JobsPage] Changing page to: ${page}`);
            setCurrentPage(page); // Cập nhật state trang
            // Cập nhật URL param 'page'
            const nextParams = new URLSearchParams(searchParams);
            nextParams.set('page', page.toString());
            setSearchParams(nextParams, { replace: true }); // Dùng replace để không back/forward qua các trang
            // Cuộn lên đầu trang
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }, [currentPage, totalPages, searchParams, setSearchParams]);

    /** Xử lý khi nhấn nút Ứng tuyển */
    const handleApplyClick = useCallback((job) => {
        if (!isAuthenticated) {
            alert("Vui lòng đăng nhập với tài khoản Sinh viên để ứng tuyển!");
            // Hoặc navigate('/login');
            return;
        }
        // Kiểm tra role nếu cần (mặc dù ApplyModal cũng kiểm tra)
        // if (authUser?.role !== 'student') { ... }
        console.log("[JobsPage] Apply button clicked for job:", job.id);
        setApplyingJob(job);
    }, [isAuthenticated]); // Thêm authUser nếu cần kiểm tra role

    /** Xử lý khi Ứng tuyển thành công (từ Modal) */
    const handleApplySuccess = useCallback((jobId) => {
        console.log(`[JobsPage] Successfully applied to job: ${jobId}`);
        setAppliedJobs(prev => new Set(prev).add(jobId));
        // Có thể hiển thị thông báo thành công ở đây (VD: Toast)
    }, []);

    // --- Render Logic ---

    /** Render nội dung chính (Loading / Error / Empty / List) */
    const renderContent = () => {
        if (isLoading) {
            // Loading Skeleton "Đẳng Cấp"
            return (
                <div className="space-y-6">
                    {[...Array(5)].map((_, i) => ( // Hiển thị 5 skeleton cards
                        <motion.div
                            key={i}
                            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 flex gap-6 animate-pulse"
                            initial={{ opacity: 0.5 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}
                        >
                            <div className="w-16 h-16 rounded-md bg-gray-300 flex-shrink-0"></div>
                            <div className="flex-grow space-y-3">
                                <div className="h-5 bg-gray-300 rounded w-3/4"></div>
                                <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                                <div className="flex gap-2 pt-2">
                                    <div className="h-4 bg-gray-300 rounded-full w-16"></div>
                                    <div className="h-4 bg-gray-300 rounded-full w-20"></div>
                                    <div className="h-4 bg-gray-300 rounded-full w-12"></div>
                                </div>
                            </div>
                            <div className="w-24 h-10 bg-gray-300 rounded-lg self-center flex-shrink-0"></div>
                        </motion.div>
                    ))}
                </div>
            );
        }

        if (error) {
            return <ErrorDisplay message={error} onRetry={fetchJobs} />;
        }

        if (jobs.length === 0) {
            return (
                <EmptyState
                    icon={Briefcase}
                    title="Không tìm thấy việc làm phù hợp"
                    message="Rất tiếc, không có tin tuyển dụng nào khớp với tiêu chí tìm kiếm của bạn. Hãy thử điều chỉnh bộ lọc xem sao nhé!"
                />
            );
        }

        // Hiển thị danh sách JobCard với animation
        return (
            <motion.div
                className="space-y-6" // Thêm space-y thay vì grid nếu muốn danh sách dọc
                variants={listVariants}
                initial="hidden"
                animate="visible"
            >
                {jobs.map(job => (
                    <JobCard
                        key={job.id}
                        job={job}
                        onApplyClick={handleApplyClick}
                        isApplied={appliedJobs.has(job.id)}
                    />
                    // Lưu ý: JobCard cần được bọc trong motion.div nếu muốn animation riêng lẻ phức tạp hơn
                    // <motion.div key={job.id} variants={itemVariants}>
                    //     <JobCard job={job} ... />
                    // </motion.div>
                ))}
            </motion.div>
        );
    };


    return (
        <>
            <Helmet>
                <title>Tìm kiếm Việc làm | EduLedger AI - Nơi Tài Năng Được Bảo Chứng</title>
                <meta name="description" content="Khám phá hàng ngàn cơ hội việc làm IT hấp dẫn dành cho sinh viên từ các công ty hàng đầu. Năng lực của bạn được AI xác thực." />
            </Helmet>

            {/* Sử dụng màu nền sáng hơn cho trang này để dễ đọc */}
            <motion.div
                className="bg-gradient-to-b from-gray-50 to-blue-50 min-h-screen" // Nền sáng
                variants={pageVariants}
                initial="initial"
                animate="in"
                exit="out"
                transition={{ duration: 0.4 }}
            >
                <main className="container mx-auto px-4 py-8 md:py-12 lg:py-16">

                    {/* Header trang */}
                    <motion.div
                        initial={{ y: -20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="text-center mb-10 md:mb-16"
                    >
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-800 tracking-tight mb-3">
                            Khám Phá <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">Cơ Hội</span>
                        </h1>
                        <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
                            Tìm kiếm công việc IT mơ ước. Hồ sơ năng lực AI-Verified trên EduLedger là lợi thế cạnh tranh độc nhất của bạn.
                        </p>
                    </motion.div>

                    {/* Layout chính: Filter bên trái, Results bên phải */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">

                        {/* Cột Filter */}
                        <aside className="lg:col-span-4 xl:col-span-3">
                             <JobsFilter
                                onFilterChange={handleFilterChange}
                                // Truyền giá trị filter hiện tại từ URL vào Filter component
                                // để nó có thể hiển thị đúng trạng thái ban đầu
                                initialFilters={currentFilters}
                             />
                        </aside>

                        {/* Cột Results */}
                        <section className="lg:col-span-8 xl:col-span-9">
                             {/* Hiển thị số lượng kết quả (nếu không loading/error) */}
                             {!isLoading && !error && jobs.length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                    className="mb-6 text-sm text-gray-700 font-medium"
                                >
                                    Hiển thị {jobs.length} trên tổng số {totalJobs} việc làm phù hợp.
                                </motion.div>
                             )}

                            {/* Render danh sách jobs hoặc trạng thái khác */}
                            {renderContent()}

                            {/* Pagination (chỉ hiển thị khi có nhiều hơn 1 trang) */}
                            {!isLoading && !error && totalPages > 1 && (
                                <motion.div
                                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                    className="mt-10 md:mt-12 flex justify-center"
                                >
                                    <Pagination
                                        currentPage={currentPage}
                                        totalPages={totalPages}
                                        onPageChange={handlePageChange}
                                    />
                                </motion.div>
                            )}
                        </section>
                    </div>
                </main>
            </motion.div>

            {/* Modal Ứng tuyển */}
            <AnimatePresence>
                {applyingJob && (
                    <ApplyModal
                        job={applyingJob}
                        onClose={() => setApplyingJob(null)}
                        onApplySuccess={handleApplySuccess}
                    />
                )}
            </AnimatePresence>
        </>
    );
}

// --- Component Tiện ích (Nên tách ra file riêng: src/components/common/FeedbackComponents.jsx) ---
// Tạm thời để đây cho tiện copy-paste

// LoadingSpinner (Đã có sẵn, dùng lại)
// const LoadingSpinner = ({ text = "Đang tải...", size = 'md' }) => { ... };

// ErrorDisplay (Đã có sẵn, dùng lại)
// const ErrorDisplay = ({ message = "Đã có lỗi xảy ra.", onRetry }) => { ... };

// EmptyState (Đã có sẵn, dùng lại)
// const EmptyState = ({ icon: Icon, title, message, actionButton }) => { ... };