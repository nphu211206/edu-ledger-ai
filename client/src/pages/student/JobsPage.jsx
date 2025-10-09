// src/pages/student/JobsPage.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';

// Import components
import JobsFilter from '../../components/jobs/JobsFilter';
import JobCard from '../../components/jobs/JobCard';
import Pagination from '../../components/common/Pagination';
import Spinner from '../../components/common/Spinner';

// Giả lập API call - Sẽ thay thế bằng file services/api.js
// Giả định backend trả về cấu trúc: { jobs: [...], totalPages: number, currentPage: number }
const fetchJobsFromApi = async (filters, page) => {
    // Xây dựng query string từ object filters
    const params = new URLSearchParams({ page, ...filters });
    Object.keys(filters).forEach(key => {
        if (!filters[key] || (Array.isArray(filters[key]) && filters[key].length === 0)) {
            delete params.delete(key);
        }
    });

    console.log(`Fetching: /api/jobs?${params.toString()}`);
    // Trong thực tế, bạn sẽ dùng fetch hoặc axios ở đây
    // const response = await fetch(`/api/jobs?${params.toString()}`);
    // if (!response.ok) throw new Error('Không thể tải danh sách việc làm');
    // return await response.json();

    // Dữ liệu giả lập để test giao diện
    await new Promise(resolve => setTimeout(resolve, 1000)); // Giả lập độ trễ mạng
    const mockJobs = [
        {
            id: 1,
            title: 'Frontend Developer (ReactJS)',
            company: { name: 'TechCorp', logoUrl: 'https://via.placeholder.com/40' },
            location: 'Hà Nội',
            salary: { min: 15, max: 25, unit: 'triệu' },
            jobType: 'Full-time',
            skills: ['React', 'TypeScript', 'TailwindCSS'],
            postedDate: '2025-10-08T10:00:00Z',
        },
        {
            id: 2,
            title: 'Backend Developer (Node.js)',
            company: { name: 'Server Solutions', logoUrl: 'https://via.placeholder.com/40' },
            location: 'TP. Hồ Chí Minh',
            salary: { min: 20, max: 35, unit: 'triệu' },
            jobType: 'Full-time',
            skills: ['Node.js', 'Express', 'SQL Server'],
            postedDate: '2025-10-07T14:30:00Z',
        },
        {
            id: 3,
            title: 'UI/UX Designer',
            company: { name: 'Creative Minds', logoUrl: 'https://via.placeholder.com/40' },
            location: 'Đà Nẵng',
            salary: { type: 'Thỏa thuận' },
            jobType: 'Part-time',
            skills: ['Figma', 'Adobe XD', 'User Research'],
            postedDate: '2025-10-06T09:00:00Z',
        }
    ];
    return { jobs: mockJobs, totalPages: 5, currentPage: page };
};

const JobsPage = () => {
    const [jobs, setJobs] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [filters, setFilters] = useState({
        keyword: '',
        location: '',
        jobType: [],
        salaryMin: 0,
        skills: []
    });

    const fetchJobs = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await fetchJobsFromApi(filters, currentPage);
            setJobs(data.jobs);
            setTotalPages(data.totalPages);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, [filters, currentPage]);

    useEffect(() => {
        fetchJobs();
    }, [fetchJobs]);

    const handleFilterChange = (newFilters) => {
        setFilters(prev => ({ ...prev, ...newFilters }));
        setCurrentPage(1); // Reset về trang 1 khi có filter mới
    };
    
    const handlePageChange = (page) => {
        if (page > 0 && page <= totalPages) {
            setCurrentPage(page);
        }
    };
    
    const renderContent = () => {
        if (isLoading) {
            return <div className="flex justify-center items-center h-96"><Spinner /></div>;
        }

        if (error) {
            return <div className="text-center text-red-500 py-10">{error}</div>;
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
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
            >
                {jobs.map(job => (
                    <JobCard key={job.id} job={job} />
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
                    <motion.div
                        initial={{ y: -20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.5 }}
                    >
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
                                    <Pagination 
                                        currentPage={currentPage}
                                        totalPages={totalPages}
                                        onPageChange={handlePageChange}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </main>
            </div>
        </>
    );
};

export default JobsPage;