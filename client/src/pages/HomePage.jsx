// File: /client/src/pages/HomePage.jsx
// PHIÊN BẢN TỐI THƯỢNG - SỬA LỖI VÀ HOÀN THIỆN

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { getJobs, getPublicStats } from '../services/api';
import JobCard from '../components/jobs/JobCard';
import { ApplyModal } from '../components/jobs/ApplyModal';
import { useAuth } from '../hooks/useAuth';

// --- ICONS ---
const SearchIcon = (props) => <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>;
const MapPinIcon = (props) => <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const BriefcaseIcon = (props) => <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>;
const StarIcon = (props) => <svg {...props} fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>;

// --- ANIMATION VARIANTS ---
const sectionVariant = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
};

// --- COMPONENT CON ---
const HeroSection = () => {
    const navigate = useNavigate();
    const [keyword, setKeyword] = useState('');
    const [location, setLocation] = useState('');
    const handleSearch = (e) => { e.preventDefault(); const query = new URLSearchParams(); if (keyword.trim()) query.set('keyword', keyword.trim()); if (location.trim()) query.set('location', location.trim()); navigate(`/jobs?${query.toString()}`); };
    return (
        <div className="relative text-center py-24 px-6 rounded-3xl overflow-hidden border border-gray-700">
            <div className="absolute inset-0 bg-gray-900 opacity-50 z-0"></div>
            <div className="absolute inset-0 bg-gradient-to-br from-blue-900/30 via-purple-900/30 to-gray-900/30 z-10"></div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="relative z-20">
                <h1 className="text-4xl md:text-5xl lg:text-7xl font-extrabold text-white tracking-tighter">Nơi Tài Năng Được <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">Bảo Chứng</span></h1>
                <p className="mt-6 max-w-3xl mx-auto text-lg md:text-xl text-gray-300">Hàng ngàn cơ hội việc làm IT từ các công ty hàng đầu. Năng lực của bạn, được AI của chúng tôi xác thực.</p>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }} className="mt-10 max-w-4xl mx-auto relative z-20">
                <form onSubmit={handleSearch} className="bg-gray-800/50 backdrop-blur-xl border border-gray-700 rounded-xl p-4 flex flex-col md:flex-row items-center gap-4 shadow-2xl">
                    <div className="flex-1 w-full flex items-center gap-3"><SearchIcon className="w-6 h-6 text-gray-400" /><input type="text" value={keyword} onChange={e => setKeyword(e.target.value)} placeholder="Chức danh, kỹ năng..." className="w-full bg-transparent text-lg text-white placeholder-gray-400 focus:outline-none" /></div>
                    <div className="w-full md:w-px h-px md:h-8 bg-gray-700"></div>
                    <div className="flex-1 w-full flex items-center gap-3"><MapPinIcon className="w-6 h-6 text-gray-400" /><input type="text" value={location} onChange={e => setLocation(e.target.value)} placeholder="Địa điểm" className="w-full bg-transparent text-lg text-white placeholder-gray-400 focus:outline-none" /></div>
                    <button type="submit" className="w-full md:w-auto bg-blue-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-blue-700 transition-all duration-300 transform hover:scale-105">Tìm kiếm</button>
                </form>
            </motion.div>
        </div>
    );
};

const TopCompaniesSection = () => {
    const topCompanies = [ { name: "FPT Software", logo: "https://inkythuatso.com/uploads/images/2021/11/fpt-logo-inkythuatso-1-14-10-18-09.jpg" }, { name: "Viettel", logo: "https://cdn.haitrieu.com/wp-content/uploads/2021/10/Logo-Viettel-Telecom.png" }, { name: "VNG", logo: "https://vcdn-sohoa.vnecdn.net/2019/08/21/VNG-logo-8588-1566378453.png" }, { name: "CMC Corp", logo: "https://inkythuatso.com/uploads/images/2021/11/cmc-logo-inkythuatso-1-14-10-16-16.jpg" }, { name: "Momo", logo: "https://static.mservice.io/img/logo-momo.png" }, { name: "Tiki", logo: "https://vudigital.co/wp-content/uploads/2022/11/logo-tiki-inkythuatso-2-1.jpg" } ];
    return (
        <motion.div variants={sectionVariant}>
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest text-center mb-8">Các công ty hàng đầu tin tưởng</h3>
            <div className="flex justify-center items-center gap-12 flex-wrap">{topCompanies.map(company => ( <img key={company.name} src={company.logo} alt={company.name} title={company.name} className="h-10 grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all duration-300" /> ))}</div>
        </motion.div>
    );
};

const AIRecommendationSection = ({ user }) => {
    if (!user) return null;
    return (
        <motion.div variants={sectionVariant} className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 p-8 rounded-2xl border border-purple-700">
             <h2 className="text-3xl font-bold text-white mb-4">Gợi ý Dành riêng cho bạn</h2>
             <p className="text-gray-300 mb-8">Dựa trên hồ sơ năng lực của bạn, AI của chúng tôi tin rằng bạn sẽ phù hợp với những cơ hội này:</p>
             {/* Logic hiển thị jobs... */}
        </motion.div>
    );
};

// COMPONENT BỊ THIẾU ĐÃ ĐƯỢC BỔ SUNG VÀ NÂNG CẤP
const JobFeedSection = ({ title, jobs, isLoading, icon, onApplyClick, appliedJobs }) => (
    <motion.div variants={sectionVariant}>
        <div className="flex items-center gap-4 mb-8">
            {icon}
            <h2 className="text-3xl font-bold text-white">{title}</h2>
        </div>
        {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{[...Array(3)].map((_, i) => <div key={i} className="h-48 bg-gray-800 rounded-xl animate-pulse"></div>)}</div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {jobs.map(job => 
                    <JobCard 
                        key={job.id} 
                        job={job} 
                        onApplyClick={onApplyClick}
                        isApplied={appliedJobs.has(job.id)}
                    />
                )}
            </div>
        )}
    </motion.div>
);

const FinalCallToActionSection = () => (
    <motion.div variants={sectionVariant} className="text-center bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-12">
        <h2 className="text-4xl font-extrabold text-white">Sẵn sàng để được khám phá?</h2>
        <p className="mt-4 text-lg text-blue-200 max-w-2xl mx-auto">Tạo hồ sơ năng lực 360° của bạn ngay hôm nay và để các công ty hàng đầu tự tìm đến bạn.</p>
        <div className="mt-8">
            <Link to="/login" className="inline-block bg-white text-gray-900 font-bold text-lg py-4 px-10 rounded-lg shadow-xl transform hover:scale-105 transition-transform duration-300">Bắt đầu ngay</Link>
        </div>
    </motion.div>
);

// --- COMPONENT CHÍNH CỦA TRANG ---
export default function HomePage() {
    const { user, isAuthenticated } = useAuth();
    const [stats, setStats] = useState({ jobs: 0, companies: 0, students: 0 });
    const [featuredJobs, setFeaturedJobs] = useState([]);
    const [highSalaryJobs, setHighSalaryJobs] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [applyingJob, setApplyingJob] = useState(null);
    const [appliedJobs, setAppliedJobs] = useState(new Set());

    useEffect(() => {
        const fetchHomepageData = async () => {
            setIsLoading(true);
            try {
                const [statsData, featuredJobsData, highSalaryJobsData] = await Promise.all([
                    getPublicStats(),
                    getJobs({ isFeatured: true, limit: 3 }, 1),
                    getJobs({ sortBy: 'salary_desc', limit: 3 }, 1),
                ]);
                setStats(statsData);
                setFeaturedJobs(featuredJobsData.jobs);
                setHighSalaryJobs(highSalaryJobsData.jobs);
            } catch (error) {
                console.error("Lỗi khi tải dữ liệu trang chủ:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchHomepageData();
    }, []);

    const handleApplyClick = (job) => {
        if (!isAuthenticated) {
            alert("Vui lòng đăng nhập để ứng tuyển!");
            return;
        }
        setApplyingJob(job);
    };

    const handleApplySuccess = (jobId) => {
        setAppliedJobs(prev => new Set(prev).add(jobId));
    };

    return (
        <>
            <Helmet>
                <title>EduLedger AI: Nền tảng xác thực năng lực, kiến tạo sự nghiệp</title>
                <meta name="description" content="Hàng ngàn cơ hội việc làm IT từ các công ty hàng đầu. Năng lực của bạn, được AI của chúng tôi xác thực và bảo chứng." />
            </Helmet>
            <div className="bg-gray-900 text-white">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10">
                    <motion.div 
                        className="space-y-24"
                        initial="hidden"
                        animate="visible"
                        variants={{ visible: { transition: { staggerChildren: 0.3 } } }}
                    >
                        <HeroSection />
                        <TopCompaniesSection />
                        
                        {user && <AIRecommendationSection user={user} />}
                        
                        <JobFeedSection 
                            title="Việc làm Nổi bật" 
                            jobs={featuredJobs} 
                            isLoading={isLoading} 
                            icon={<StarIcon className="w-8 h-8 text-yellow-400" />}
                            onApplyClick={handleApplyClick}
                            appliedJobs={appliedJobs}
                        />
                        <JobFeedSection 
                            title="Việc làm Lương cao" 
                            jobs={highSalaryJobs} 
                            isLoading={isLoading} 
                            icon={<BriefcaseIcon className="w-8 h-8 text-green-400" />}
                            onApplyClick={handleApplyClick}
                            appliedJobs={appliedJobs}
                        />
                        
                        <FinalCallToActionSection />
                    </motion.div>
                </div>
            </div>
            <AnimatePresence>
                {applyingJob && <ApplyModal job={applyingJob} onClose={() => setApplyingJob(null)} onApplySuccess={handleApplySuccess} />}
            </AnimatePresence>
        </>
    );
}