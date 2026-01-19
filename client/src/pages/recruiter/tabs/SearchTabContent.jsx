// File: client/src/components/recruiter/tabs/SearchTabContent.jsx
// PHIÊN BẢN v3.2 - Component "Chuyên biệt" (Tách từ Dashboard v3.1)
// ĐÃ SỬA ĐƯỜNG DẪN IMPORT "BẤT TỬ" (../../../)

import React, { useState, useCallback, memo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

// --- API & Components (Fix đường dẫn "chí mạng") ---
import { searchStudents } from '../../../services/api';
import { LoadingSpinner, ErrorDisplay, EmptyState } from '../../../components/common/FeedbackComponents';
// --- Icons ---
import { Search, Plus, Trash2, Github, ExternalLink, Users, Loader, Info, Filter } from 'lucide-react';

// === COMPONENT CON "CHUYÊN BIỆT": SearchPanel ===
const SearchPanel = memo(({ onSearch, isSearching }) => {
    const [searchCriteria, setSearchCriteria] = useState([ { id: Date.now(), name: '', minScore: '70' } ]);
    const [formError, setFormError] = useState('');
    const handleCriteriaChange = useCallback((id, event) => { const { name, value } = event.target; setSearchCriteria(prevCriteria => prevCriteria.map(criterion => criterion.id === id ? { ...criterion, [name]: value } : criterion )); if (formError) setFormError(''); }, [formError]);
    const handleAddCriterion = useCallback(() => { setSearchCriteria(prevCriteria => [ ...prevCriteria, { id: Date.now(), name: '', minScore: '70' } ]); if (formError) setFormError(''); }, [formError]);
    const handleRemoveCriterion = useCallback((id) => { if (searchCriteria.length <= 1) return; setSearchCriteria(prevCriteria => prevCriteria.filter(criterion => criterion.id !== id)); if (formError) setFormError(''); }, [searchCriteria.length, formError]);
    const handleSubmit = useCallback((event) => { event.preventDefault(); setFormError(''); const validCriteria = searchCriteria.map(c => ({ name: c.name.trim(), minScore: parseInt(c.minScore, 10) || 50 })).filter(c => c.name !== ''); if (validCriteria.length === 0) { setFormError("Vui lòng nhập ít nhất một kỹ năng hợp lệ."); return; } onSearch(validCriteria); }, [searchCriteria, onSearch]);
    const criterionRowVariant = { initial: { opacity: 0, x: -20, height: 0 }, animate: { opacity: 1, x: 0, height: 'auto', transition: { duration: 0.3, ease: 'easeOut' } }, exit: { opacity: 0, x: 20, height: 0, transition: { duration: 0.2, ease: 'easeIn' } } };

    return (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="sticky top-24 bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg backdrop-blur-md">
            <h2 className="text-xl font-bold mb-5 text-white flex items-center gap-2"> <Filter className="w-5 h-5 text-purple-400" /> Bộ lọc Tìm kiếm Tài năng </h2>
            {formError && ( <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-red-900/40 border border-red-700 text-red-300 px-3 py-2 rounded-md text-xs mb-4 flex items-center gap-1.5"> <Info className="w-4 h-4 flex-shrink-0"/> {formError} </motion.div> )}
            <form onSubmit={handleSubmit} className="space-y-4">
                <AnimatePresence initial={false}>
                    {searchCriteria.map((criterion, index) => (
                        <motion.div key={criterion.id} variants={criterionRowVariant} initial="initial" animate="animate" exit="exit" layout className="flex items-end gap-2 overflow-hidden">
                            <div className="flex-grow"> {index === 0 && <label htmlFor={`skillName-${criterion.id}`} className="text-xs font-medium text-gray-400 mb-1 block">Kỹ năng</label>} <input id={`skillName-${criterion.id}`} type="text" placeholder="VD: React, Python..." name="name" value={criterion.name} onChange={e => handleCriteriaChange(criterion.id, e)} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200" aria-label={`Skill name ${index + 1}`} /> </div>
                            <div className="w-24 flex-shrink-0"> {index === 0 && <label htmlFor={`minScore-${criterion.id}`} className="text-xs font-medium text-gray-400 mb-1 block">Điểm &ge;</label>} <input id={`minScore-${criterion.id}`} type="number" name="minScore" value={criterion.minScore} onChange={e => handleCriteriaChange(criterion.id, e)} min="50" max="100" step="5" className="w-full px-2 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 text-center" aria-label={`Minimum score ${index + 1}`} /> </div>
                            <button type="button" onClick={() => handleRemoveCriterion(criterion.id)} disabled={searchCriteria.length <= 1} className={`p-2 text-gray-500 hover:text-red-400 transition duration-200 flex-shrink-0 mb-1 ${searchCriteria.length <= 1 ? 'opacity-50 cursor-not-allowed' : ''}`} title="Xóa tiêu chí này" aria-label={`Remove criterion ${index + 1}`}> <Trash2 className="w-4 h-4" /> </button>
                        </motion.div>
                    ))}
                </AnimatePresence>
                <button type="button" onClick={handleAddCriterion} className="w-full flex items-center justify-center gap-2 text-sm py-2 text-blue-400 hover:bg-gray-700/50 rounded-md transition duration-200 border border-dashed border-gray-600 hover:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-600"> <Plus className="w-4 h-4" /> Thêm tiêu chí kỹ năng </button>
                
                <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-3 px-4 rounded-lg hover:from-blue-700 hover:to-purple-700 transition duration-300 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-gray-800 transform hover:scale-[1.02]"
                    disabled={isSearching}
                >
                    <span className="relative w-5 h-5 flex items-center justify-center">
                        <Search className={`w-5 h-5 transition-opacity duration-200 ${isSearching ? 'opacity-0 scale-50' : 'opacity-100 scale-100'}`} />
                        <Loader className={`animate-spin w-5 h-5 absolute transition-opacity duration-200 ${isSearching ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`} />
                    </span>
                    <span className="ml-2">{isSearching ? 'Đang tìm...' : 'Tìm kiếm Ứng viên'}</span>
                </button>
            </form>
        </motion.div>
    );
});
SearchPanel.displayName = 'SearchPanel';

// === COMPONENT CON "CHUYÊN BIỆT": StudentSearchResultCard ===
const StudentSearchResultCard = memo(({ student }) => (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3, ease: "easeOut" }} layout className="bg-gray-800 p-5 rounded-xl border border-gray-700/80 transition-all duration-300 hover:border-blue-500/70 hover:shadow-xl hover:-translate-y-1 backdrop-blur-sm bg-opacity-70">
        <div className="flex flex-col sm:flex-row items-start gap-4">
            <motion.img src={student.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(student.name || student.githubUsername)}&background=random&color=ffffff&size=80`} alt={student.name || student.githubUsername} className="w-16 h-16 rounded-full border-2 border-gray-600 flex-shrink-0 object-cover bg-gray-700" whileHover={{ scale: 1.1 }} />
            <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-2 mb-1.5">
                    <div className="min-w-0"> <h3 className="text-lg font-bold text-white truncate">{student.name || student.githubUsername}</h3> <a href={`https://github.com/${student.githubUsername}`} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-400 hover:underline flex items-center gap-1 w-fit"> <Github className="w-4 h-4 flex-shrink-0" /> <span className="truncate">{student.githubUsername}</span> </a> </div>
                    <Link to={`/profile/${student.githubUsername}`} target="_blank" rel="noopener noreferrer" className="bg-gray-700 text-white text-xs font-bold py-1.5 px-4 rounded-full hover:bg-blue-600 transition duration-200 flex items-center gap-1.5 flex-shrink-0 mt-1 sm:mt-0 whitespace-nowrap" title={`Xem hồ sơ chi tiết của ${student.name || student.githubUsername}`}> <ExternalLink className="w-3.5 h-3.5"/> Xem Hồ sơ </Link>
                </div>
                <p className="text-sm text-gray-400 mt-1 line-clamp-2">{student.bio || <span className="italic opacity-70">Chưa có tiểu sử trên GitHub.</span>}</p>
                {student.totalMatchedScore > 0 && ( <div className="mt-3 text-xs text-purple-300 font-medium"> Điểm khớp: <span className="font-bold text-purple-200">{student.totalMatchedScore}</span> </div> )}
            </div>
        </div>
    </motion.div>
));
StudentSearchResultCard.displayName = 'StudentSearchResultCard';


// === COMPONENT "CHUYÊN BIỆT" CHÍNH: SearchTabContent ===
const SearchTabContent = () => {
    const [searchResults, setSearchResults] = useState(null);
    const [isSearching, setIsSearching] = useState(false);
    const [searchError, setSearchError] = useState('');
    const [viewState, setViewState] = useState('initial');

    const handleSearch = useCallback(async (criteria) => {
        setIsSearching(true); setViewState('loading'); setSearchError('');
        try {
            const results = await searchStudents(criteria);
            setSearchResults(results || []);
            setSearchError('');
            setViewState(results && results.length > 0 ? 'results' : 'empty');
        } catch (err) {
            setSearchError(err.message || 'Tìm kiếm thất bại.');
            setSearchResults(null);
            setViewState('error');
        } finally {
            setIsSearching(false);
        }
    }, []);

    // --- Component Render Nội dung theo State ---
    const RenderContent = () => {
        switch (viewState) {
            case 'loading':
                return (
                    <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{duration: 0.2}} className="pt-10">
                        <LoadingSpinner text="Đang tìm kiếm ứng viên tài năng..." size="lg" />
                    </motion.div>
                );
            case 'error':
                return (
                    <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{duration: 0.2}} className="mt-6">
                        <ErrorDisplay message={searchError} details="Vui lòng thử lại hoặc điều chỉnh tiêu chí tìm kiếm." />
                    </motion.div>
                );
            case 'empty':
                return (
                    <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{duration: 0.2}}>
                        <EmptyState icon={Users} title="Không tìm thấy ứng viên phù hợp" message="Rất tiếc, không có sinh viên nào khớp với tất cả các tiêu chí bạn đã nhập." />
                    </motion.div>
                );
            case 'results':
                return (
                    <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{duration: 0.2}} className="space-y-4">
                        <h2 className="text-xl font-bold text-white mb-4"> Tìm thấy <span className="text-blue-400">{searchResults?.length || 0}</span> ứng viên tiềm năng: </h2>
                        <motion.div layout className="space-y-4">
                            <AnimatePresence>
                                {searchResults?.map(student => ( <StudentSearchResultCard key={student.id} student={student} /> ))}
                            </AnimatePresence>
                        </motion.div>
                    </motion.div>
                );
            case 'initial':
            default:
                return (
                    <motion.div key="initial" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{duration: 0.2}}>
                        <EmptyState icon={Search} title="Bắt đầu Hành trình Tìm kiếm Tài năng" message="Sử dụng bộ lọc bên trái để nhập các kỹ năng và điểm số tối thiểu mong muốn." />
                    </motion.div>
                );
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <aside className="lg:col-span-4 xl:col-span-3">
                <SearchPanel onSearch={handleSearch} isSearching={isSearching} />
            </aside>
            <main className="lg:col-span-8 xl:col-span-9">
                <AnimatePresence mode="wait">
                    {RenderContent()}
                </AnimatePresence>
            </main>
        </div>
    );
};

export default memo(SearchTabContent);