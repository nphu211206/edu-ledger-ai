// File: client/src/pages/CompanyListPage.jsx
// PHIÊN BẢN TỐI THƯỢNG - ĐẠI LỘ DOANH NGHIỆP

import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { getAllCompanies } from '../services/api';

// --- ICONS ---
const SearchIcon = (props) => <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>;

// --- COMPONENT TIỆN ÍCH CHUNG ---
const Spinner = () => <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-400"></div>;
const ErrorMessage = ({ message }) => <div className="text-center text-red-400 p-8 bg-gray-800 rounded-xl">{message}</div>;

// --- COMPONENT CON ĐẲNG CẤP ---
const CompanyCard = ({ company }) => (
    <motion.div
        variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
    >
        <Link to={`/companies/${company.slug}`} className="block h-full bg-gray-800 p-6 rounded-xl border border-gray-700 transition-all duration-300 hover:border-blue-500 hover:-translate-y-2 hover:shadow-2xl">
            <div className="flex flex-col h-full">
                <div className="flex items-center gap-5 mb-4">
                    <img src={company.logoUrl || `https://ui-avatars.com/api/?name=${company.name}&background=random&size=128`} alt={company.name} className="w-20 h-20 rounded-lg bg-white p-1 object-contain flex-shrink-0" />
                    <div>
                        <h2 className="text-xl font-bold text-white line-clamp-2">{company.name}</h2>
                        <p className="text-sm text-gray-400 mt-1 line-clamp-2">{company.tagline || 'Đối tác tuyển dụng hàng đầu'}</p>
                    </div>
                </div>
                <div className="flex-grow"></div>
                <div className="mt-4 pt-4 border-t border-gray-700">
                    <p className="text-sm font-bold text-blue-400">{company.jobCount} việc làm đang tuyển</p>
                </div>
            </div>
        </Link>
    </motion.div>
);

// --- COMPONENT CHÍNH ---
export default function CompanyListPage() {
    const [companies, setCompanies] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchCompanies = async () => {
            try {
                const data = await getAllCompanies();
                setCompanies(data);
            } catch (err) {
                setError('Không thể tải danh sách công ty.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchCompanies();
    }, []);

    const filteredCompanies = useMemo(() => {
        if (!searchTerm) return companies;
        return companies.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [searchTerm, companies]);

    return (
        <>
            <Helmet>
                <title>Danh sách công ty | EduLedger AI</title>
                <meta name="description" content="Khám phá và kết nối với hàng ngàn công ty công nghệ hàng đầu trên EduLedger AI." />
            </Helmet>
            <div className="bg-gray-900 min-h-screen text-white">
                <div className="container mx-auto px-4 py-12">
                    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                        <h1 className="text-5xl font-bold text-center mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">Đối tác Doanh nghiệp</h1>
                        <p className="text-lg text-gray-400 text-center mb-10 max-w-3xl mx-auto">Khám phá văn hóa, cơ hội và kết nối với những nhà tuyển dụng tốt nhất trong hệ sinh thái của chúng tôi.</p>
                        <div className="max-w-xl mx-auto mb-12">
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-4"><SearchIcon className="w-6 h-6 text-gray-400" /></span>
                                <input 
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Tìm kiếm công ty..."
                                    className="w-full bg-gray-800 border-2 border-gray-700 rounded-full py-3 pl-12 pr-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>
                    </motion.div>

                    {isLoading ? <div className="flex justify-center py-20"><Spinner/></div> :
                     error ? <ErrorMessage message={error}/> :
                     (
                        <motion.div 
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                            initial="hidden"
                            animate="visible"
                            variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
                        >
                            {filteredCompanies.length > 0 ? 
                                filteredCompanies.map(c => <CompanyCard key={c.id} company={c} />) :
                                <div className="md:col-span-2 lg:col-span-3"><EmptyState icon={<BriefcaseIcon className="w-16 h-16"/>} title="Không tìm thấy công ty" message="Không có công ty nào phù hợp với từ khóa tìm kiếm của bạn."/></div>
                            }
                        </motion.div>
                     )
                    }
                </div>
            </div>
        </>
    );
}