// File: client/src/pages/CompanyProfilePage.jsx
// PHIÊN BẢN "ĐẾ VƯƠNG" - KHÔNG GIAN TRẢI NGHIỆM THƯƠNG HIỆU TUYỂN DỤNG

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import { getCompanyProfileBySlug } from '../services/api';
import JobCard from '../components/jobs/JobCard';
import { ApplyModal } from '../components/jobs/ApplyModal';
import { useAuth } from '../hooks/useAuth';

// --- ICONS ---
const BriefcaseIcon = (props) => <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>;
const MapPinIcon = (props) => <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const UsersIcon = (props) => <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21a6 6 0 00-9-5.197M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const GlobeIcon = (props) => <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2h10a2 2 0 002-2v-1a2 2 0 012-2h1.945M7.707 4.5l.012.012a4.992 4.992 0 015.26 5.262l.012.012M16.293 4.5l-.012.012a4.992 4.992 0 00-5.26 5.262l-.012.012" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 21a9 9 0 100-18 9 9 0 000 18z" /></svg>;

// --- COMPONENT TIỆN ÍCH CHUNG ---
const Spinner = () => <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-400"></div>;
const ErrorMessage = ({ message }) => <div className="text-center text-red-400 p-8 bg-gray-800 rounded-xl">{message}</div>;

// --- CÁC COMPONENT CON ĐẲNG CẤP ---
const CompanyHeader = ({ profile }) => (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }} className="relative h-48 md:h-64 rounded-2xl overflow-hidden border border-gray-700">
        <img src={profile.bannerUrl || 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?q=80&w=2070'} alt={`${profile.name} banner`} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/50 to-transparent"></div>
        <div className="absolute bottom-0 left-0 p-6 md:p-8 flex items-end gap-6">
            <img src={profile.logoUrl || `https://ui-avatars.com/api/?name=${profile.name}&background=random&size=128`} alt={`${profile.name} logo`} className="w-24 h-24 md:w-32 md:h-32 rounded-xl border-4 border-gray-800 bg-white object-contain p-1 shadow-lg" />
            <div>
                <h1 className="text-3xl md:text-4xl font-bold text-white shadow-md">{profile.name}</h1>
                <p className="text-lg text-gray-300 shadow-sm">{profile.tagline}</p>
            </div>
        </div>
    </motion.div>
);

const CompanyStats = ({ profile, jobCount }) => (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center bg-gray-800 p-4 rounded-xl border border-gray-700">
        <div className="p-2"><p className="text-2xl font-bold text-blue-400">{jobCount}</p><p className="text-sm text-gray-400">Việc làm đang tuyển</p></div>
        <div className="p-2"><p className="text-2xl font-bold text-white">{profile.companySize || 'N/A'}</p><p className="text-sm text-gray-400">Quy mô</p></div>
        <div className="p-2"><p className="text-2xl font-bold text-white">{profile.country || 'Việt Nam'}</p><p className="text-sm text-gray-400">Quốc gia</p></div>
        <div className="p-2"><a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-2xl font-bold text-blue-400 hover:underline">Website</a><p className="text-sm text-gray-400">Trang chính thức</p></div>
    </div>
);

// --- COMPONENT CHÍNH ---
export default function CompanyProfilePage() {
    const { slug } = useParams();
    const { isAuthenticated } = useAuth();
    const [companyData, setCompanyData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [applyingJob, setApplyingJob] = useState(null);
    const [appliedJobs, setAppliedJobs] = useState(new Set());

    useEffect(() => {
        window.scrollTo(0, 0);
        const fetchCompanyProfile = async () => {
            setIsLoading(true);
            try {
                const data = await getCompanyProfileBySlug(slug);
                setCompanyData(data);
            } catch (err) {
                setError('Không tìm thấy công ty này hoặc đã có lỗi xảy ra.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchCompanyProfile();
    }, [slug]);

    const handleApplyClick = (job) => {
        if (!isAuthenticated) { alert("Vui lòng đăng nhập để ứng tuyển!"); return; }
        setApplyingJob(job);
    };

    const handleApplySuccess = (jobId) => {
        setAppliedJobs(prev => new Set(prev).add(jobId));
    };

    if (isLoading) return <div className="bg-gray-900 min-h-screen flex items-center justify-center"><Spinner /></div>;
    if (error) return <div className="bg-gray-900 min-h-screen flex items-center justify-center p-6"><ErrorMessage message={error} /></div>;
    if (!companyData) return null;

    const { profile, jobs } = companyData;

    return (
        <>
            <Helmet>
                <title>{`Tuyển dụng tại ${profile.name} | EduLedger AI`}</title>
                <meta name="description" content={profile.tagline || `Khám phá các cơ hội việc làm tại ${profile.name}.`} />
            </Helmet>
            <div className="bg-gray-900 text-white min-h-screen">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="max-w-7xl mx-auto space-y-8">
                        <CompanyHeader profile={profile} />
                        <CompanyStats profile={profile} jobCount={jobs.length} />

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Cột trái: Giới thiệu & Phúc lợi */}
                            <div className="lg:col-span-1 space-y-8 sticky top-24 self-start">
                                <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                                    <h2 className="text-xl font-bold text-white mb-4">Giới thiệu công ty</h2>
                                    <p className="text-gray-300 whitespace-pre-wrap">{profile.description || "Công ty chưa cập nhật phần giới thiệu."}</p>
                                </div>
                                <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                                    <h2 className="text-xl font-bold text-white mb-4">Tại sao bạn sẽ yêu thích làm việc ở đây</h2>
                                    <ul className="space-y-3 text-gray-300">
                                        {/* TODO: Lấy dữ liệu phúc lợi từ API */}
                                        <li className="flex items-start gap-3"><span className="text-blue-400 mt-1">✔</span><span>Môi trường làm việc năng động, sáng tạo.</span></li>
                                        <li className="flex items-start gap-3"><span className="text-blue-400 mt-1">✔</span><span>Lương thưởng cạnh tranh, đánh giá năng lực 2 lần/năm.</span></li>
                                        <li className="flex items-start gap-3"><span className="text-blue-400 mt-1">✔</span><span>Cơ hội tham gia các dự án lớn, làm việc với công nghệ mới nhất.</span></li>
                                        <li className="flex items-start gap-3"><span className="text-blue-400 mt-1">✔</span><span>Bảo hiểm sức khỏe toàn diện cho nhân viên và người thân.</span></li>
                                    </ul>
                                </div>
                            </div>

                            {/* Cột phải: Danh sách việc làm */}
                            <div className="lg:col-span-2">
                                <h2 className="text-2xl font-bold text-white mb-6">Các vị trí đang tuyển dụng</h2>
                                {jobs.length > 0 ? (
                                    <div className="space-y-6">
                                        {jobs.map(job => (
                                            <JobCard 
                                                key={job.id} 
                                                job={{ ...job, company: { name: profile.name, logoUrl: profile.logoUrl } }}
                                                onApplyClick={handleApplyClick}
                                                isApplied={appliedJobs.has(job.id)}
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="bg-gray-800 p-12 rounded-xl border border-dashed border-gray-700 text-center">
                                        <p className="text-gray-400">Hiện tại {profile.name} chưa có tin tuyển dụng nào trên hệ thống.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <AnimatePresence>
                {applyingJob && <ApplyModal job={applyingJob} onClose={() => setApplyingJob(null)} onApplySuccess={handleApplySuccess} />}
            </AnimatePresence>
        </>
    );
}