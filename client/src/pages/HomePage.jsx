// /client/src/pages/HomePage.jsx

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

// --- ICONS (Dạng SVG để dễ dàng tùy chỉnh và không cần file ảnh) ---

const SearchIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
);

const BriefcaseIcon = () => (
    <svg className="w-8 h-8 mb-2 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
);

const CodeIcon = () => (
    <svg className="w-8 h-8 mb-2 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path></svg>
);

const MegaphoneIcon = () => (
     <svg className="w-8 h-8 mb-2 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.834 9.168-4.432l.256-.506M4 13V9a2 2 0 012-2h1.5l2.5-5M18 7h2a2 2 0 012 2v2a2 2 0 01-2 2h-2m-4-6h.01M18 13h.01"></path></svg>
);

const BrainIcon = () => <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg>;
const CertificateIcon = () => <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>;
const GithubIconSolid = () => <svg className="w-8 h-8 text-gray-300" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.28.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21-.15.46-.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"></path></svg>;

// --- CÁC COMPONENT CON CỦA TRANG CHỦ ---

const HeroSection = () => (
    <div className="bg-gray-800 rounded-xl p-8 md:p-16 text-center border border-gray-700 shadow-2xl">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white leading-tight">
            <span className="text-blue-400">Nền tảng</span> xác thực năng lực,
            <br />
            <span className="text-purple-400">kiến tạo</span> sự nghiệp.
        </h1>
        <p className="mt-6 max-w-3xl mx-auto text-lg text-gray-300">
            EduLedger AI không chỉ là cầu nối. Chúng tôi là xưởng đúc, nơi kỹ năng của bạn được AI xác thực và bảo chứng, biến bạn thành ứng viên đắt giá nhất thị trường.
        </p>
        <div className="mt-10 max-w-2xl mx-auto">
            <form className="flex flex-col sm:flex-row gap-4">
                <input
                    type="text"
                    placeholder="Tìm kiếm kỹ năng, công việc, công ty..."
                    className="flex-grow w-full px-5 py-4 bg-gray-700 border-2 border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
                <button
                    type="submit"
                    className="flex-shrink-0 bg-blue-600 text-white font-bold py-4 px-8 rounded-lg hover:bg-blue-700 transition-all duration-300 flex items-center justify-center gap-2 transform hover:scale-105"
                >
                    <SearchIcon />
                    Tìm kiếm
                </button>
            </form>
        </div>
    </div>
);

const StatsSection = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-gray-800 p-8 rounded-xl border border-gray-700 text-center transform hover:-translate-y-2 transition-transform duration-300 shadow-lg">
            <p className="text-5xl font-bold text-blue-400">1,834+</p>
            <p className="mt-2 text-gray-400 text-lg">Việc làm mới trong 24h</p>
        </div>
        <div className="bg-gray-800 p-8 rounded-xl border border-gray-700 text-center transform hover:-translate-y-2 transition-transform duration-300 shadow-lg">
            <p className="text-5xl font-bold text-green-400">53,027</p>
            <p className="mt-2 text-gray-400 text-lg">Việc làm đang tuyển</p>
        </div>
        <div className="bg-gray-800 p-8 rounded-xl border border-gray-700 text-center transform hover:-translate-y-2 transition-transform duration-300 shadow-lg">
            <p className="text-5xl font-bold text-purple-400">17,887+</p>
            <p className="mt-2 text-gray-400 text-lg">Công ty hàng đầu</p>
        </div>
    </div>
);

const TopCategoriesSection = () => {
    const categories = [
        { name: 'Công nghệ thông tin', jobCount: 12255, link: '/jobs/it', icon: <CodeIcon /> },
        { name: 'Kinh doanh / Bán hàng', jobCount: 10721, link: '/jobs/business', icon: <BriefcaseIcon /> },
        { name: 'Marketing / PR', jobCount: 7480, link: '/jobs/marketing', icon: <MegaphoneIcon /> },
        { name: 'Tài chính / Ngân hàng', jobCount: 1585, link: '/jobs/finance', icon: <BriefcaseIcon /> },
        { name: 'Bất động sản', jobCount: 389, link: '/jobs/real-estate', icon: <BriefcaseIcon /> },
    ];
    return (
    <div className="text-center">
        <h2 className="text-3xl font-bold text-white mb-4">Top ngành nghề nổi bật</h2>
        <p className="text-gray-400 mb-10">Khám phá cơ hội ở các lĩnh vực hàng đầu</p>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {categories.map((category) => (
                <Link to={category.link} key={category.name} className="bg-gray-800 p-6 rounded-xl border border-gray-700 text-center transition-all duration-300 hover:border-blue-500 hover:bg-gray-700 hover:-translate-y-2 shadow-lg">
                    <div className="flex justify-center">{category.icon}</div>
                    <h3 className="mt-4 font-semibold text-white">{category.name}</h3>
                    <p className="text-sm text-gray-400">{category.jobCount.toLocaleString('vi-VN')} việc làm</p>
                </Link>
            ))}
        </div>
    </div>
)};

const HowItWorksSection = () => (
    <div className="text-center bg-gray-800 rounded-xl p-12 border border-gray-700">
        <h2 className="text-3xl font-bold text-white mb-4">Hoạt động như thế nào?</h2>
        <p className="text-gray-400 mb-12 max-w-2xl mx-auto">Chỉ với 3 bước đơn giản, hồ sơ năng lực của bạn sẽ được nâng lên một tầm cao mới, sẵn sàng chinh phục mọi nhà tuyển dụng.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div className="flex flex-col items-center">
                <div className="bg-gray-700 p-5 rounded-full mb-4 border-2 border-gray-600"><GithubIconSolid /></div>
                <h3 className="text-xl font-semibold text-white mb-2">1. Kết nối GitHub</h3>
                <p className="text-gray-400">Đăng nhập an toàn và cho phép chúng tôi truy cập các dự án public của bạn.</p>
            </div>
            <div className="flex flex-col items-center">
                <div className="bg-gray-700 p-5 rounded-full mb-4 border-2 border-gray-600"><BrainIcon /></div>
                <h3 className="text-xl font-semibold text-white mb-2">2. AI Phân tích</h3>
                <p className="text-gray-400">Trí tuệ nhân tạo của chúng tôi sẽ "đọc" code, phân tích và chấm điểm kỹ năng của bạn.</p>
            </div>
            <div className="flex flex-col items-center">
                <div className="bg-gray-700 p-5 rounded-full mb-4 border-2 border-gray-600"><CertificateIcon /></div>
                <h3 className="text-xl font-semibold text-white mb-2">3. Nhận Chứng thực</h3>
                <p className="text-gray-400">Sở hữu hồ sơ năng lực được bảo chứng, thu hút nhà tuyển dụng hàng đầu.</p>
            </div>
        </div>
    </div>
);

const FinalCallToActionSection = () => (
    <div className="text-center bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-12">
        <h2 className="text-4xl font-extrabold text-white">Sẵn sàng để được khám phá?</h2>
        <p className="mt-4 text-lg text-blue-200 max-w-2xl mx-auto">Tạo hồ sơ năng lực 360° của bạn ngay hôm nay và để các công ty hàng đầu tự tìm đến bạn.</p>
        <div className="mt-8">
            <Link 
                to="/login"
                className="inline-block bg-white text-gray-900 font-bold text-lg py-4 px-10 rounded-lg shadow-xl transform hover:scale-105 transition-transform duration-300"
            >
                Bắt đầu ngay
            </Link>
        </div>
    </div>
);

// --- COMPONENT CHÍNH CỦA TRANG ---

export default function HomePage() {
    return (
        <div className="bg-gray-900 text-white">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <div className="space-y-24">
                    <HeroSection />
                    <StatsSection />
                    <HowItWorksSection />
                    <TopCategoriesSection />
                    <FinalCallToActionSection />
                </div>
            </div>
        </div>
    );
}