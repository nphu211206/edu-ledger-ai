// /client/src/pages/RecruiterDashboardPage.jsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';

// --- ICONS & COMPONENTS (Tái sử dụng để đảm bảo tính nhất quán) ---
const SearchIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>;
const PlusIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>;
const TrashIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;
const GithubIcon = () => <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.28.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21-.15.46-.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"></path></svg>;
const Spinner = ({ size = 'h-8 w-8' }) => <div className="flex justify-center items-center"><div className={`animate-spin rounded-full border-b-2 border-blue-400 ${size}`}></div></div>;
const ErrorMessage = ({ message }) => <div className="bg-red-900 border border-red-700 text-red-300 px-4 py-3 rounded-lg" role="alert"><strong className="font-bold">Lỗi! </strong><span className="block sm:inline">{message}</span></div>;
const StudentResultCard = ({ student }) => ( <div className="bg-gray-800 p-5 rounded-xl border border-gray-700 transition-all duration-300 hover:border-blue-500 hover:shadow-2xl hover:-translate-y-1"> <div className="flex items-start gap-4"> <img src={student.avatarUrl} alt={student.name} className="w-16 h-16 rounded-full border-2 border-gray-600" /> <div className="flex-1"> <div className="flex justify-between items-start"> <div> <h3 className="text-lg font-bold text-white">{student.name || student.githubUsername}</h3> <a href={`https://github.com/${student.githubUsername}`} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-400 hover:underline flex items-center gap-1"> <GithubIcon /> {student.githubUsername} </a> </div> <Link to={`/profile/${student.githubUsername}`} className="bg-gray-700 text-white text-xs font-bold py-1 px-3 rounded-full hover:bg-blue-600 transition"> Xem Hồ sơ </Link> </div> <p className="text-sm text-gray-400 mt-2 line-clamp-2">{student.bio || "Chưa có tiểu sử trên GitHub."}</p> </div> </div> </div> );
const EmptyState = ({ title, message }) => ( <div className="text-center py-20 px-6 bg-gray-800 rounded-xl border-2 border-dashed border-gray-700"> <h3 className="text-xl font-semibold text-white">{title}</h3> <p className="mt-2 text-gray-400">{message}</p> </div> );

// --- COMPONENT CHÍNH ---

export default function RecruiterDashboardPage() {
    const [recruiter, setRecruiter] = useState(null);
    const [isLoadingPage, setIsLoadingPage] = useState(true);
    const [searchCriteria, setSearchCriteria] = useState([{ name: '', minScore: '70' }]);
    const [searchResults, setSearchResults] = useState(null);
    const [isSearching, setIsSearching] = useState(false);
    const [searchError, setSearchError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchRecruiterData = async () => {
            const token = localStorage.getItem('token');
            if (!token) { navigate('/recruiter/login'); return; }
            try {
                const config = { headers: { 'Authorization': `Bearer ${token}` } };
                const response = await axios.get(`http://localhost:3800/api/me`, config);
                setRecruiter(response.data);
            } catch (error) {
                console.error("Lỗi khi lấy thông tin nhà tuyển dụng:", error);
                localStorage.removeItem('token');
                navigate('/recruiter/login');
            } finally {
                setIsLoadingPage(false);
            }
        };
        fetchRecruiterData();
    }, [navigate]);

    const handleCriteriaChange = (index, event) => {
        const values = [...searchCriteria];
        values[index][event.target.name] = event.target.value;
        setSearchCriteria(values);
    };

    const handleAddCriterion = () => {
        setSearchCriteria([...searchCriteria, { name: '', minScore: '70' }]);
    };

    const handleRemoveCriterion = (index) => {
        if (searchCriteria.length <= 1) return;
        const values = [...searchCriteria];
        values.splice(index, 1);
        setSearchCriteria(values);
    };

    const handleSearch = async (e) => {
        e.preventDefault();
        setIsSearching(true);
        setSearchResults(null);
        setSearchError('');

        const validCriteria = searchCriteria
            .filter(c => c.name.trim() !== '')
            .map(c => ({ name: c.name.trim(), minScore: parseInt(c.minScore, 10) || 0 }));

        if (validCriteria.length === 0) {
            setSearchError('Vui lòng nhập ít nhất một kỹ năng để tìm kiếm.');
            setIsSearching(false);
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const config = { headers: { 'Authorization': `Bearer ${token}` } };
            const response = await axios.post(`http://localhost:3800/api/recruiter/search`, { skills: validCriteria }, config);
            setSearchResults(response.data);
        } catch (err) {
            setSearchError(err.response?.data?.message || 'Tìm kiếm thất bại. Vui lòng thử lại.');
        } finally {
            setIsSearching(false);
        }
    };

    if (isLoadingPage) {
        return <div className="min-h-screen bg-gray-900 flex items-center justify-center"><Spinner size="h-12 w-12" /></div>;
    }

    return (
        <div className="bg-gray-900 min-h-screen text-white">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <h1 className="text-4xl font-bold text-white mb-2">Chào mừng, {recruiter?.name}!</h1>
                <p className="text-gray-400 mb-10">Đây là trung tâm điều khiển của bạn. Hãy bắt đầu tìm kiếm những tài năng sáng giá nhất.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                    <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                        <p className="text-3xl font-bold text-blue-400">1,204</p>
                        <p className="mt-1 text-gray-400">Hồ sơ sinh viên</p>
                    </div>
                    <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                        <p className="text-3xl font-bold text-green-400">78</p>
                        <p className="mt-1 text-gray-400">Lượt tìm kiếm hôm nay</p>
                    </div>
                    <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                        <p className="text-3xl font-bold text-purple-400">15</p>
                        <p className="mt-1 text-gray-400">Hồ sơ đã lưu</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    <aside className="lg:col-span-4 xl:col-span-3">
                        <div className="sticky top-24 bg-gray-800 p-6 rounded-xl border border-gray-700">
                            <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><SearchIcon /> Bộ lọc tìm kiếm</h2>
                            <form onSubmit={handleSearch} className="space-y-4">
                                {searchCriteria.map((criterion, index) => (
                                    <div className="flex items-end gap-2" key={index}>
                                        <div className="flex-grow">
                                            <label className="text-xs text-gray-400">Kỹ năng</label>
                                            <input type="text" placeholder="VD: React, Node.js" name="name" value={criterion.name} onChange={e => handleCriteriaChange(index, e)} className="w-full mt-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-400">Điểm &gt;=</label>
                                            <input type="number" name="minScore" value={criterion.minScore} onChange={e => handleCriteriaChange(index, e)} min="0" max="100" className="w-20 mt-1 px-2 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                        </div>
                                        <button type="button" onClick={() => handleRemoveCriterion(index)} disabled={searchCriteria.length <= 1} className="p-2 text-gray-500 hover:text-red-400 disabled:opacity-50 disabled:cursor-not-allowed">
                                            <TrashIcon />
                                        </button>
                                    </div>
                                ))}
                                <button type="button" onClick={handleAddCriterion} className="w-full flex items-center justify-center gap-2 text-sm py-2 text-blue-400 hover:bg-gray-700 rounded-md transition"><PlusIcon /> Thêm tiêu chí</button>
                                <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition disabled:bg-gray-600 flex justify-center" disabled={isSearching}>{isSearching ? <Spinner size="h-5 w-5" /> : 'Tìm kiếm ứng viên'}</button>
                            </form>
                        </div>
                    </aside>

                    <main className="lg:col-span-8 xl:col-span-9">
                        {isSearching ? ( <div className="flex justify-center py-20"><Spinner size="h-12 w-12" /></div> ) : searchError ? ( <ErrorMessage message={searchError} /> ) : searchResults === null ? ( <EmptyState title="Bắt đầu tìm kiếm" message="Sử dụng bộ lọc bên trái để tìm các ứng viên có kỹ năng đã được AI xác thực." /> ) : searchResults.length === 0 ? ( <EmptyState title="Không tìm thấy kết quả" message="Hãy thử điều chỉnh hoặc giảm bớt các tiêu chí tìm kiếm của bạn." /> ) : ( <div className="space-y-4"> <h2 className="text-xl font-bold">Tìm thấy {searchResults.length} ứng viên phù hợp</h2> {searchResults.map(student => ( <StudentResultCard key={student.id} student={student} /> ))} </div> )}
                    </main>
                </div>
            </div>
        </div>
    );
}