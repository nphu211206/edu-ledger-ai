// File: client/src/pages/JobDetailPage.jsx
// PHIÊN BẢN TỐI THƯỢNG - KẾT NỐI HOÀN HẢO

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import { getJobById } from '../services/api';
import { ApplyModal } from '../components/jobs/ApplyModal';
import { useAuth } from '../hooks/useAuth';

// --- ICONS ---
const BriefcaseIcon = (props) => <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>;
const MapPinIcon = (props) => <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const DollarSignIcon = (props) => <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8V6m0 12v-2" /></svg>;
const ShareIcon = (props) => <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12s-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.368a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" /></svg>;
const Spinner = () => <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400"></div>;
const ErrorMessage = ({ message }) => <div className="text-center text-red-400 p-4 bg-red-900 bg-opacity-30 rounded-lg">{message}</div>;

// --- COMPONENT CON ---
const CompanyCard = ({ company }) => (
    <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
        <div className="flex items-center gap-4">
            <img src={company.companyLogoUrl || `https://ui-avatars.com/api/?name=${company.companyName}&background=random`} alt={company.companyName} className="w-16 h-16 rounded-lg bg-white p-1" />
            <div>
                <h3 className="text-lg font-bold text-white">{company.companyName}</h3>
                {company.companySlug && (
                    <Link to={`/companies/${company.companySlug}`} className="text-sm text-blue-400 hover:underline">Xem trang công ty</Link>
                )}
            </div>
        </div>
        <p className="mt-4 text-sm text-gray-400 line-clamp-4">{company.companyBio || "Công ty chưa cập nhật mô tả."}</p>
    </div>
);
const JobDetailSkeleton = () => ( <div className="animate-pulse"> <div className="h-10 bg-gray-700 rounded w-3/4 mb-4"></div> <div className="h-6 bg-gray-700 rounded w-1/2 mb-8"></div> <div className="grid grid-cols-1 lg:grid-cols-3 gap-8"> <div className="lg:col-span-2 space-y-6"> <div className="h-48 bg-gray-800 rounded-xl"></div> <div className="h-32 bg-gray-800 rounded-xl"></div> </div> <div className="lg:col-span-1 space-y-6"> <div className="h-32 bg-gray-800 rounded-xl"></div> <div className="h-24 bg-gray-800 rounded-xl"></div> </div> </div> </div> );

// --- COMPONENT CHÍNH ---
export default function JobDetailPage() {
    const { id } = useParams();
    const { isAuthenticated } = useAuth();
    const [job, setJob] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [applyingJob, setApplyingJob] = useState(null);
    const [appliedJobs, setAppliedJobs] = useState(new Set()); 

    useEffect(() => {
        window.scrollTo(0, 0);
        const fetchJob = async () => {
            setIsLoading(true);
            try {
                const data = await getJobById(id);
                setJob(data);
            } catch (err) { setError('Không tìm thấy tin tuyển dụng hoặc đã có lỗi xảy ra.'); } 
            finally { setIsLoading(false); }
        };
        fetchJob();
    }, [id]);

    const handleApplyClick = (jobToApply) => {
        if (!isAuthenticated) { alert("Vui lòng đăng nhập để ứng tuyển!"); return; }
        setApplyingJob(jobToApply);
    };

    const handleApplySuccess = (jobId) => {
        setAppliedJobs(prev => new Set(prev).add(jobId));
    };

    if (isLoading) return <div className="bg-gray-900 min-h-screen text-white py-12"><div className="container mx-auto px-6"><JobDetailSkeleton /></div></div>;
    if (error) return <div className="bg-gray-900 min-h-screen flex items-center justify-center p-6"><ErrorMessage message={error} /></div>;
    if (!job) return null;

    return (
        <>
            <Helmet><title>{`${job.title} tại ${job.companyName} | EduLedger AI`}</title></Helmet>
            <div className="bg-gray-900 text-white min-h-screen py-12">
                <div className="container mx-auto px-6">
                    <div className="bg-gray-800 p-8 rounded-xl border border-gray-700 mb-8">
                        <h1 className="text-4xl font-bold text-white">{job.title}</h1>
                        <p className="text-xl text-gray-300 mt-2">{job.companyName}</p>
                        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-gray-400 mt-4">
                            <span className="flex items-center gap-2"><BriefcaseIcon className="w-5 h-5"/> {job.jobType}</span>
                            <span className="flex items-center gap-2"><MapPinIcon className="w-5 h-5"/> {job.location}</span>
                            <span className="flex items-center gap-2"><DollarSignIcon className="w-5 h-5"/> {job.salary}</span>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 space-y-8">
                            <div className="bg-gray-800 p-8 rounded-xl border border-gray-700">
                                <h2 className="text-2xl font-bold text-white mb-4">Mô tả công việc</h2>
                                <div className="prose prose-invert max-w-none text-gray-300 whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: job.description }}></div>
                            </div>
                            <div className="bg-gray-800 p-8 rounded-xl border border-gray-700">
                                <h2 className="text-2xl font-bold text-white mb-4">Các kỹ năng yêu cầu</h2>
                                <div className="flex flex-wrap gap-3">{job.skills.map(skill => ( <span key={skill} className="bg-blue-900 text-blue-300 font-semibold px-4 py-2 rounded-full text-sm">{skill}</span> ))}</div>
                            </div>
                        </div>
                        <div className="lg:col-span-1 space-y-6 sticky top-24 self-start">
                            <div className="grid grid-cols-1 gap-4">
                                <button onClick={() => handleApplyClick(job)} disabled={appliedJobs.has(job.id)} className="w-full bg-blue-600 text-white font-bold py-4 px-6 rounded-lg hover:bg-blue-700 transition-all duration-300 shadow-lg text-lg disabled:bg-gray-400 disabled:cursor-not-allowed">{appliedJobs.has(job.id) ? 'Đã ứng tuyển' : 'Ứng tuyển ngay'}</button>
                                <button className="w-full bg-gray-700 text-white font-bold py-3 px-6 rounded-lg hover:bg-gray-600 transition flex items-center justify-center gap-2"><ShareIcon className="w-5 h-5"/> Chia sẻ</button>
                            </div>
                            <CompanyCard company={job} />
                            {job.relatedJobs && job.relatedJobs.length > 0 && (
                                <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                                    <h3 className="text-lg font-bold text-white mb-4">Việc làm liên quan</h3>
                                    <div className="space-y-4">{job.relatedJobs.map(related => ( <Link key={related.id} to={`/jobs/${related.id}`} className="block hover:bg-gray-700 p-3 rounded-lg"><p className="font-semibold text-white truncate">{related.title}</p><p className="text-sm text-gray-400">{related.companyName}</p></Link> ))}</div>
                                </div>
                            )}
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