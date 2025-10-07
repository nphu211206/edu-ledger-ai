// /client/src/components/Footer.jsx

import React from 'react';
import { Link } from 'react-router-dom';

// --- ICONS ---
const GithubIcon = () => (
    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path fillRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.168 6.839 9.49.5.092.682-.217.682-.482 0-.237-.009-.868-.014-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.031-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.03 1.595 1.03 2.688 0 3.848-2.338 4.695-4.566 4.943.359.308.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.001 10.001 0 0022 12c0-5.523-4.477-10-10-10z" clipRule="evenodd" />
    </svg>
);
const LinkedInIcon = () => (
    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
    </svg>
);
const FacebookIcon = () => (
    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z" />
    </svg>
);

// --- COMPONENT CHÍNH ---

export default function Footer() {
    return (
        <footer className="bg-gray-800 border-t border-gray-700 text-gray-400 mt-auto">
            <div className="container mx-auto px-6 py-12">
                <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-8">
                    
                    <div className="col-span-1 lg:col-span-2">
                        <Link to="/" className="text-2xl font-bold text-white">
                            <span className="text-blue-500">Edu</span>
                            <span className="text-purple-500">Ledger</span> AI
                        </Link>
                        <p className="mt-4 text-sm max-w-xs">
                            Nền tảng xác thực năng lực, kiến tạo sự nghiệp. Thay đổi cách nhà tuyển dụng nhìn nhận giá trị thật của bạn.
                        </p>
                        <div className="mt-6 flex space-x-4">
                            <a href="#" className="hover:text-white transition-colors"><GithubIcon /></a>
                            <a href="#" className="hover:text-white transition-colors"><LinkedInIcon /></a>
                            <a href="#" className="hover:text-white transition-colors"><FacebookIcon /></a>
                        </div>
                    </div>

                    <div>
                        <h3 className="font-semibold text-white tracking-wider uppercase">Sản phẩm</h3>
                        <ul className="mt-4 space-y-2 text-sm">
                            <li><Link to="/features/ai-analysis" className="hover:text-white transition-colors">Phân tích AI</Link></li>
                            <li><Link to="/features/skill-profile" className="hover:text-white transition-colors">Hồ sơ năng lực 360°</Link></li>
                            <li><Link to="/features/recruiter-search" className="hover:text-white transition-colors">Tìm kiếm cho NTD</Link></li>
                            <li><Link to="/features/blockchain-certs" className="hover:text-white transition-colors">Chứng chỉ Blockchain</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="font-semibold text-white tracking-wider uppercase">Về EduLedger</h3>
                        <ul className="mt-4 space-y-2 text-sm">
                            <li><Link to="/about" className="hover:text-white transition-colors">Về chúng tôi</Link></li>
                            <li><Link to="/blog" className="hover:text-white transition-colors">Blog công nghệ</Link></li>
                            <li><Link to="/careers" className="hover:text-white transition-colors">Tuyển dụng</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="font-semibold text-white tracking-wider uppercase">Hỗ trợ</h3>
                        <ul className="mt-4 space-y-2 text-sm">
                            <li><Link to="/contact" className="hover:text-white transition-colors">Liên hệ</Link></li>
                            <li><Link to="/faq" className="hover:text-white transition-colors">Câu hỏi thường gặp</Link></li>
                            <li><Link to="/terms" className="hover:text-white transition-colors">Điều khoản dịch vụ</Link></li>
                        </ul>
                    </div>

                </div>
            </div>

            <div className="bg-gray-900 py-4">
                <div className="container mx-auto px-6 text-center text-sm text-gray-500">
                    &copy; {new Date().getFullYear()} EduLedger AI. All rights reserved. Nền tảng vì cộng đồng sinh viên công nghệ.
                </div>
            </div>
        </footer>
    );
}