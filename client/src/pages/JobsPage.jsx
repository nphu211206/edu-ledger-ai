// File: client/src/pages/JobsPage.jsx
// PHIÊN BẢN TỐI THƯỢNG - TÍCH HỢP HOÀN CHỈNH MODAL ỨNG TUYỂN

import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import { getJobs } from '../services/api'; 
import { ApplyModal } from '../components/jobs/ApplyModal';
import JobsFilter from '../components/jobs/JobsFilter';
import JobCard from '../components/jobs/JobCard';
import Pagination from '../components/common/Pagination';
import Spinner from '../components/common/Spinner';
import { useAuth } from '../hooks/useAuth';

export default function JobsPage() {
    const { isAuthenticated } = useAuth();
    const [jobs, setJobs] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [filters, setFilters] = useState({ keyword: '', location: '', jobType: '' });
    
    // --- STATE CHO CHỨC NĂNG ỨNG TUYỂN ---
    const [applyingJob, setApplyingJob] = useState(null);
    const [appliedJobs, setAppliedJobs] = useState(new Set());

    const fetchJobs = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await getJobs(filters, currentPage);
            setJobs(data.jobs);
            setTotalPages(data.totalPages);
        } catch (err) {
            setError('Đã có lỗi xảy ra. Không thể tải danh sách việc làm từ server.');
        } finally {
            setIsLoading(false);
        }
    }, [filters, currentPage]);

    useEffect(() => {
        fetchJobs();
    }, [fetchJobs]);

    const handleFilterChange = (newFilters) => {
        setFilters(prev => ({ ...prev, ...newFilters }));
        setCurrentPage(1);
    };
    
    const handlePageChange = (page) => {
        if (page > 0 && page <= totalPages) {
            setCurrentPage(page);
            window.scrollTo(0, 0);
        }
    };
    
    const handleApplyClick = (job) => {
        if (!isAuthenticated) {
            // Có thể hiện một modal yêu cầu đăng nhập ở đây
            alert("Vui lòng đăng nhập để ứng tuyển!");
            return;
        }
        setApplyingJob(job);
    };

    const handleApplySuccess = (jobId) => {
        setAppliedJobs(prev => new Set(prev).add(jobId));
    };
    
    const renderContent = () => {
        if (isLoading) {
            return <div className="flex justify-center items-center h-96"><Spinner /></div>;
        }
        if (error) {
            return (
                <div className="text-center bg-red-50 text-red-700 p-6 rounded-lg">
                    <h3 className="text-xl font-semibold">Lỗi!</h3>
                    <p>{error}</p>
                </div>
            );
        }
        if (jobs.length === 0) {
            return (
                <div className="text-center py-10 text-gray-500">
                    <h3 className="text-2xl font-semibold mb-2">Không tìm thấy việc làm phù hợp</h3>
                    <p>Hãy thử thay đổi bộ lọc hoặc quay lại sau nhé.</p>
                </div>
            );
        }
        return (
            <motion.div 
                className="grid grid-cols-1 gap-6"
                initial="hidden"
                animate="visible"
                variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
            >
                {jobs.map(job => (
                    <JobCard 
                        key={job.id} 
                        job={job}
                        onApplyClick={handleApplyClick}
                        isApplied={appliedJobs.has(job.id)}
                    />
                ))}
            </motion.div>
        );
    };

    return (
        <>
            <Helmet>
                <title>Tìm kiếm Việc làm | EduLedger AI</title>
                <meta name="description" content="Khám phá hàng ngàn cơ hội việc làm công nghệ hấp dẫn dành cho sinh viên trên EduLedger AI." />
            </Helmet>
            <div className="bg-gray-50 min-h-screen">
                <main className="container mx-auto px-4 py-8 md:py-12">
                    <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.5 }}>
                        <h1 className="text-4xl md:text-5xl font-bold text-gray-800 text-center mb-4">
                            Khám Phá <span className="text-blue-600">Cơ Hội</span>
                        </h1>
                        <p className="text-lg text-gray-600 text-center max-w-3xl mx-auto mb-12">
                            Tìm kiếm công việc IT mơ ước của bạn từ các công ty hàng đầu. Hồ sơ của bạn trên EduLedger AI là lợi thế cạnh tranh lớn nhất.
                        </p>
                    </motion.div>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                        <div className="lg:col-span-1">
                            <JobsFilter onFilterChange={handleFilterChange} />
                        </div>
                        <div className="lg:col-span-3">
                            {renderContent()}
                            {!isLoading && !error && jobs.length > 0 && (
                                <div className="mt-8">
                                    <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
                                </div>
                            )}
                        </div>
                    </div>
                </main>
            </div>
            <AnimatePresence>
                {applyingJob && <ApplyModal job={applyingJob} onClose={() => setApplyingJob(null)} onApplySuccess={handleApplySuccess} />}
            </AnimatePresence>
        </>
    );
};