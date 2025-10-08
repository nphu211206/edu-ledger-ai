// /client/src/pages/JobsPage.jsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

// --- ICONS & COMPONENTS ---
const SearchIcon = () => <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>;
const MapPinIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const CurrencyDollarIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v.01M12 6v-1h4v1m-7 6h7m-3-3h3" /></svg>;
const ClockIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const Spinner = () => <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400"></div>;
const ErrorMessage = ({ message }) => <div className="text-center text-red-400 p-4 bg-red-900 bg-opacity-30 rounded-lg">{message}</div>;

const JobCard = ({ job }) => (
    <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 transition-all duration-300 hover:border-blue-500 hover:shadow-2xl hover:-translate-y-1">
        <div className="flex items-start justify-between">
            <div>
                <h3 className="text-xl font-bold text-white hover:text-blue-400 transition">
                    <Link to={`/jobs/${job.id}`}>{job.title}</Link>
                </h3>
                <p className="text-sm text-gray-400 mt-1">{job.recruiterName}</p>
            </div>
            <span className="text-xs font-semibold bg-blue-900 text-blue-300 px-3 py-1 rounded-full">{job.jobType || 'Full-time'}</span>
        </div>
        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-400">
            <div className="flex items-center gap-1.5"><MapPinIcon /> {job.location || 'Hà Nội'}</div>
            <div className="flex items-center gap-1.5"><CurrencyDollarIcon /> {job.salary || 'Thỏa thuận'}</div>
            <div className="flex items-center gap-1.5"><ClockIcon /> {new Date(job.createdAt).toLocaleDateString()}</div>
        </div>
    </div>
);

// --- COMPONENT CHÍNH ---
export default function JobsPage() {
    const [jobs, setJobs] = useState([]);
    const [filteredJobs, setFilteredJobs] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchJobs = async () => {
            setIsLoading(true);
            setError('');
            try {
                // Gọi đến API /jobs mà chúng ta đã tạo ở Backend
                const response = await axios.get('http://localhost:3800/jobs');
                setJobs(response.data);
                setFilteredJobs(response.data); // Ban đầu, danh sách lọc chính là danh sách đầy đủ
            } catch (err) {
                console.error("Lỗi khi tải danh sách việc làm:", err);
                setError("Không thể tải danh sách việc làm. Vui lòng thử lại sau.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchJobs();
    }, []);

    // Hiệu ứng lọc sẽ chạy mỗi khi người dùng gõ vào ô tìm kiếm
    useEffect(() => {
        const lowercasedFilter = searchTerm.toLowerCase();
        const filteredData = jobs.filter(job =>
            job.title.toLowerCase().includes(lowercasedFilter) ||
            job.recruiterName.toLowerCase().includes(lowercasedFilter) ||
            (job.location && job.location.toLowerCase().includes(lowercasedFilter))
        );
        setFilteredJobs(filteredData);
    }, [searchTerm, jobs]);

    return (
        <div className="bg-gray-900 min-h-screen text-white">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-extrabold text-white">Khám phá Cơ hội</h1>
                    <p className="mt-4 text-lg text-gray-400">Tìm kiếm công việc mơ ước của bạn tại các công ty công nghệ hàng đầu.</p>
                </div>
                
                {/* Thanh tìm kiếm và bộ lọc */}
                <div className="max-w-3xl mx-auto mb-10">
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <SearchIcon />
                        </div>
                        <input
                            type="text"
                            placeholder="Tìm kiếm theo chức danh, công ty, hoặc địa điểm..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="block w-full pl-10 pr-3 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>

                {/* Hiển thị kết quả */}
                {isLoading ? (
                    <div className="flex justify-center"><Spinner /></div>
                ) : error ? (
                    <ErrorMessage message={error} />
                ) : (
                    <div className="space-y-6">
                        {filteredJobs.length > 0 ? (
                            filteredJobs.map(job => <JobCard key={job.id} job={job} />)
                        ) : (
                            <p className="text-center text-gray-500">Không tìm thấy công việc nào phù hợp.</p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}