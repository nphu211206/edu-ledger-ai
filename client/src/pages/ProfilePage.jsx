// File: /client/src/pages/ProfilePage.jsx
// PHIÊN BẢN TỐI THƯỢNG - DỨT ĐIỂM

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { 
    addWorkExperience, updateWorkExperience, deleteWorkExperience,
    addEducationHistory, updateEducationHistory, deleteEducationHistory
} from '../services/api';

// --- ICONS ---
const PlusIcon = (props) => <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>;
const EditIcon = (props) => <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>;
const TrashIcon = (props) => <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;
const BriefcaseIcon = (props) => <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>;
const AcademicCapIcon = (props) => <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0112 20.055a11.952 11.952 0 01-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14v7m0 0l-3-2m3 2l3-2" /></svg>;

// --- COMPONENT TIỆN ÍCH CHUNG ---
const Spinner = ({ size = 'h-12 w-12' }) => <div className={`animate-spin rounded-full border-b-2 border-blue-400 ${size}`}></div>;
const ErrorMessage = ({ message }) => <div className="text-center text-red-400 p-4 bg-red-900 bg-opacity-30 rounded-lg">{message}</div>;

// --- CÁC COMPONENT GIAO DIỆN TĨNH ---
const UserProfileCard = ({ profile }) => ( <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 text-center"> <img src={profile.avatarUrl} alt="Avatar" className="w-32 h-32 rounded-full border-4 border-gray-600 mx-auto mb-4" /> <h1 className="text-3xl font-bold text-white">{profile.name || profile.githubUsername}</h1> <a href={`https://github.com/${profile.githubUsername}`} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">@{profile.githubUsername}</a> <p className="mt-4 text-gray-400">{profile.bio || "Chưa có tiểu sử trên GitHub."}</p> </div> );
const SkillsRadarChart = ({ skills }) => ( <div className="bg-gray-800 p-6 rounded-xl border border-gray-700"> <h2 className="text-xl font-semibold text-white mb-4">Hồ sơ năng lực AI-Verified</h2> {skills && skills.length > 0 ? ( <ResponsiveContainer width="100%" height={300}> <RadarChart cx="50%" cy="50%" outerRadius="80%" data={skills}> <PolarGrid stroke="#555" /> <PolarAngleAxis dataKey="skill_name" stroke="#ccc" /> <Radar name="Điểm kỹ năng" dataKey="score" stroke="#38BDF8" fill="#38BDF8" fillOpacity={0.6} /> </RadarChart> </ResponsiveContainer> ) : ( <p className="text-gray-500 text-center italic">Chưa có kỹ năng nào được xác thực.</p> )} </div> );
const RepoCard = ({ repo, onClick }) => ( <button onClick={onClick} className="text-left w-full bg-gray-800 p-4 rounded-xl border border-gray-700 transition transform hover:scale-105 hover:border-blue-500"> <div className="font-semibold text-lg text-blue-400">{repo.name}</div> <p className="text-gray-400 text-sm mt-1 h-10 overflow-hidden">{repo.description || "Không có mô tả."}</p> <div className="mt-4 text-xs text-gray-500"> <span>{repo.language || 'N/A'}</span> <span className="mx-2">•</span> <span>Cập nhật: {new Date(repo.updated_at).toLocaleDateString()}</span> </div> </button> );
const AnalysisResultCard = ({ result }) => ( <div className="bg-gray-800 p-6 rounded-lg text-left"> <h3 className="text-xl font-bold text-white mb-4">Kết quả Phân tích AI</h3> <p className="text-gray-300 italic mb-4">"{result.summary}"</p> <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4"> <div className="md:col-span-1 flex flex-col items-center justify-center bg-gray-900 p-4 rounded-lg"> <div className="text-5xl font-bold text-blue-400">{result.overall_score}</div> <div className="text-gray-400">Overall Score</div> </div> <div className="md:col-span-2 grid grid-cols-2 gap-4"> <div className="bg-gray-900 p-4 rounded-lg"> <h4 className="font-semibold text-green-400 mb-2">Điểm mạnh</h4> <ul className="list-disc list-inside text-gray-300 text-sm space-y-1">{result.strengths.map((item, i) => <li key={i}>{item}</li>)}</ul> </div> <div className="bg-gray-900 p-4 rounded-lg"> <h4 className="font-semibold text-yellow-400 mb-2">Cần cải thiện</h4> <ul className="list-disc list-inside text-gray-300 text-sm space-y-1">{result.weaknesses.map((item, i) => <li key={i}>{item}</li>)}</ul> </div> </div> </div> <h4 className="font-semibold text-white mb-2">Các kỹ năng đã xác thực</h4> <div className="flex flex-wrap gap-2"> {result.detected_skills.map((skill, i) => ( <div key={i} className="bg-blue-900 text-blue-300 text-xs font-semibold px-3 py-1 rounded-full flex items-center"> {skill.skill_name} <span className="ml-2 bg-blue-400 text-gray-900 text-xs font-bold rounded-full px-2 py-0.5">{skill.score}</span> </div> ))} </div> </div> );
const AnalysisModal = ({ repo, onClose, onAnalyze, analysisResult, isAnalyzing, analysisError }) => { useEffect(() => { if (repo) onAnalyze(); }, [repo, onAnalyze]); return ( <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4" onClick={onClose}> <div className="bg-gray-800 rounded-xl border border-gray-700 w-full max-w-3xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}> <div className="p-6 border-b border-gray-700 flex justify-between items-center sticky top-0 bg-gray-800 z-10"> <h2 className="text-2xl font-bold text-white">{repo.name}</h2> <button onClick={onClose} className="text-gray-400 text-3xl hover:text-white">&times;</button> </div> <div className="p-6"> {isAnalyzing && <div className="flex flex-col items-center gap-4 py-10"><Spinner /> <p>AI đang phân tích...</p></div>} {analysisError && <ErrorMessage message={analysisError} />} {analysisResult && <AnalysisResultCard result={analysisResult} />} </div> </div> </div> );};

// --- COMPONENT ĐA NĂNG CHO MODAL THÊM/SỬA ---
const ProfileItemModal = ({ item, onSave, onClose, type }) => {
    const isExperience = type === 'experience';
    const initialState = isExperience 
        ? { title: item?.title || '', company: item?.company || '', location: item?.location || '', startDate: item?.startDate ? new Date(item.startDate).toISOString().split('T')[0] : '', endDate: item?.endDate ? new Date(item.endDate).toISOString().split('T')[0] : '', description: item?.description || '' }
        : { school: item?.school || '', degree: item?.degree || '', fieldOfStudy: item?.fieldOfStudy || '', startDate: item?.startDate ? new Date(item.startDate).toISOString().split('T')[0] : '', endDate: item?.endDate ? new Date(item.endDate).toISOString().split('T')[0] : '', grade: item?.grade || '', description: item?.description || '' };
    
    const [data, setData] = useState(initialState);
    const handleChange = (e) => setData({ ...data, [e.target.name]: e.target.value });
    const handleSubmit = (e) => { e.preventDefault(); onSave(data); };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4" onClick={onClose}>
            <motion.div initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -50, opacity: 0 }} className="bg-gray-800 rounded-xl border border-gray-700 w-full max-w-2xl" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-gray-700"><h2 className="text-2xl font-bold text-white">{item ? `Chỉnh sửa ${isExperience ? 'kinh nghiệm' : 'học vấn'}` : `Thêm ${isExperience ? 'kinh nghiệm mới' : 'học vấn mới'}`}</h2></div>
                <form onSubmit={handleSubmit}>
                    <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                        {isExperience ? (
                            <>
                                <input name="title" value={data.title} onChange={handleChange} placeholder="Chức danh *" className="w-full p-3 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                                <input name="company" value={data.company} onChange={handleChange} placeholder="Công ty *" className="w-full p-3 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                                <input name="location" value={data.location} onChange={handleChange} placeholder="Địa điểm (VD: Hà Nội)" className="w-full p-3 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                            </>
                        ) : (
                            <>
                                <input name="school" value={data.school} onChange={handleChange} placeholder="Tên trường *" className="w-full p-3 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                                <input name="degree" value={data.degree} onChange={handleChange} placeholder="Bằng cấp (VD: Kỹ sư) *" className="w-full p-3 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                                <input name="fieldOfStudy" value={data.fieldOfStudy} onChange={handleChange} placeholder="Chuyên ngành *" className="w-full p-3 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                                <input name="grade" value={data.grade} onChange={handleChange} placeholder="Điểm GPA" className="w-full p-3 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                            </>
                        )}
                        <div className="flex gap-4">
                            <div className="w-1/2"><label className="text-xs text-gray-400">Ngày bắt đầu *</label><input type="date" name="startDate" value={data.startDate} onChange={handleChange} className="w-full p-3 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required /></div>
                            <div className="w-1/2"><label className="text-xs text-gray-400">Ngày kết thúc (để trống nếu đang tiếp tục)</label><input type="date" name="endDate" value={data.endDate} onChange={handleChange} className="w-full p-3 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
                        </div>
                        <textarea name="description" value={data.description} onChange={handleChange} placeholder="Mô tả chi tiết và các thành tựu..." rows="5" className="w-full p-3 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"></textarea>
                    </div>
                    <div className="p-6 border-t border-gray-700 flex justify-end gap-4">
                        <button type="button" onClick={onClose} className="py-2 px-4 bg-gray-600 rounded-md hover:bg-gray-500 transition">Hủy</button>
                        <button type="submit" className="py-2 px-4 bg-blue-600 rounded-md hover:bg-blue-500 transition">Lưu</button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};

// --- COMPONENT HIỂN THỊ DẠNG TIMELINE ---
const TimelineTab = ({ isOwner, items, itemType, onAdd, onEdit, onDelete, isLoading }) => {
    const isExperience = itemType === 'experience';
    const ItemIcon = isExperience ? BriefcaseIcon : AcademicCapIcon;
    const emptyText = `Chưa có ${isExperience ? 'kinh nghiệm làm việc' : 'thông tin học vấn'} nào.`;
    const addText = `Thêm ${isExperience ? 'kinh nghiệm' : 'học vấn'}`;

    if (isLoading) return <div className="flex justify-center py-10"><Spinner size="h-8 w-8" /></div>;
    
    return (
        <div>
            {isOwner && (
                <div className="flex justify-end mb-6">
                    <button onClick={onAdd} className="flex items-center gap-2 bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition">
                        <PlusIcon className="w-5 h-5"/> {addText}
                    </button>
                </div>
            )}
            <div className="space-y-8 relative border-l-2 border-gray-700 ml-4">
                {items && items.length > 0 ? items.map(item => (
                    <div key={item.id} className="pl-8 relative">
                        <div className="absolute -left-4 top-1 w-8 h-8 bg-gray-800 rounded-full border-4 border-gray-900 flex items-center justify-center ring-4 ring-gray-700"><ItemIcon className="w-5 h-5 text-blue-400"/></div>
                        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 relative hover:border-blue-500 transition">
                            {isOwner && (
                                <div className="absolute top-4 right-4 flex gap-2 opacity-0 hover:opacity-100 transition-opacity">
                                    <button onClick={() => onEdit(item)} className="text-gray-400 hover:text-yellow-400"><EditIcon className="w-5 h-5"/></button>
                                    <button onClick={() => onDelete(item.id, itemType)} className="text-gray-400 hover:text-red-500"><TrashIcon className="w-5 h-5"/></button>
                                </div>
                            )}
                            <h3 className="text-xl font-bold text-white">{isExperience ? item.title : item.degree}</h3>
                            <p className="text-md text-gray-300">{isExperience ? item.company : `${item.school} - ${item.fieldOfStudy}`}</p>
                            <p className="text-sm text-gray-500 mt-1">
                                {new Date(item.startDate).toLocaleDateString('vi-VN', { month: '2-digit', year: 'numeric' })} - 
                                {item.endDate ? new Date(item.endDate).toLocaleDateString('vi-VN', { month: '2-digit', year: 'numeric' }) : 'Hiện tại'}
                                {isExperience && item.location && ` · ${item.location}`}
                            </p>
                            {!isExperience && item.grade && <p className="text-sm text-gray-400 mt-1">GPA: {item.grade}</p>}
                            <p className="mt-4 text-gray-400 whitespace-pre-wrap">{item.description}</p>
                        </div>
                    </div>
                )) : (
                     <div className="pl-8 text-gray-500 italic">{emptyText}</div>
                )}
            </div>
        </div>
    );
};

// --- COMPONENT CHÍNH ---
export default function ProfilePage() {
    const { username } = useParams();
    const { user: currentUser } = useAuth();
    const [activeTab, setActiveTab] = useState('github');
    const [profileData, setProfileData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedRepo, setSelectedRepo] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState(null);
    const [analysisError, setAnalysisError] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [modalType, setModalType] = useState('');

    const isOwner = currentUser?.githubUsername === username;

    const handleAnalyzeRepo = useCallback(async () => {
        if (!selectedRepo) return;
        setIsAnalyzing(true); setAnalysisResult(null); setAnalysisError('');
        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(`http://localhost:3800/api/analyze-repo`, { repoFullName: selectedRepo.full_name }, { headers: { 'Authorization': `Bearer ${token}` } });
            setAnalysisResult(response.data);
        } catch (error) { setAnalysisError(error.response?.data?.message || 'Phân tích thất bại.'); } 
        finally { setIsAnalyzing(false); }
    }, [selectedRepo]);

    useEffect(() => {
        const fetchProfile = async () => {
            setIsLoading(true); setError('');
            try {
                const token = localStorage.getItem('token');
                if (!token) throw new Error("Token not found");
                const config = { headers: { 'Authorization': `Bearer ${token}` } };
                const response = await axios.get(`http://localhost:3800/api/profile/${username}`, config);
                setProfileData(response.data);
            } catch (err) { setError(err.response?.data?.message || 'Không thể tải hồ sơ này.'); } 
            finally { setIsLoading(false); }
        };
        fetchProfile();
    }, [username]);

    const handleSave = async (data) => {
        try {
            let updatedOrNewItem;
            if (modalType === 'experience') {
                updatedOrNewItem = editingItem ? await updateWorkExperience(editingItem.id, data) : await addWorkExperience(data);
            } else {
                updatedOrNewItem = editingItem ? await updateEducationHistory(editingItem.id, data) : await addEducationHistory(data);
            }
            setProfileData(prevData => {
                const key = modalType === 'experience' ? 'experiences' : 'education';
                const items = prevData[key] || [];
                let newItems = editingItem ? items.map(it => it.id === updatedOrNewItem.id ? updatedOrNewItem : it) : [updatedOrNewItem, ...items];
                newItems.sort((a, b) => new Date(b.startDate) - new Date(a.startDate));
                return { ...prevData, [key]: newItems };
            });
            closeModal();
        } catch (err) { console.error("Lỗi khi lưu:", err); }
    };

    const handleDelete = async (id, type) => {
        if (window.confirm(`Bạn có chắc chắn muốn xóa mục này?`)) {
            try {
                if (type === 'experience') await deleteWorkExperience(id);
                else await deleteEducationHistory(id);
                setProfileData(prevData => {
                    const key = type === 'experience' ? 'experiences' : 'education';
                    return { ...prevData, [key]: prevData[key].filter(it => it.id !== id) };
                });
            } catch (err) { console.error("Lỗi khi xóa:", err); }
        }
    };

    const openModal = (type, item = null) => { setModalType(type); setEditingItem(item); setModalOpen(true); };
    const closeModal = () => { setModalOpen(false); setEditingItem(null); };

    if (isLoading) return <div className="min-h-screen bg-gray-900 flex items-center justify-center"><Spinner /></div>;
    if (error) return <div className="min-h-screen bg-gray-900 flex items-center justify-center p-6"><ErrorMessage message={error} /></div>;
    if (!profileData) return null;

    const { profile, skills, repos, experiences, education } = profileData;
    const tabs = [{ id: 'github', label: 'Dự án GitHub' }, { id: 'experience', label: 'Kinh nghiệm' }, { id: 'education', label: 'Học vấn' }];
    
    const renderTabContent = () => {
        switch(activeTab) {
            case 'github': return ( <div className="grid grid-cols-1 md:grid-cols-2 gap-6">{repos.map(repo => <RepoCard key={repo.id} repo={repo} onClick={() => setSelectedRepo(repo)} />)}</div> );
            case 'experience': return <TimelineTab isOwner={isOwner} items={experiences} itemType="experience" onAdd={() => openModal('experience')} onEdit={(item) => openModal('experience', item)} onDelete={handleDelete} isLoading={!experiences} />;
            case 'education': return <TimelineTab isOwner={isOwner} items={education} itemType="education" onAdd={() => openModal('education')} onEdit={(item) => openModal('education', item)} onDelete={handleDelete} isLoading={!education} />;
            default: return null;
        }
    };

    return (
        <>
            <div className="bg-gray-900 text-white min-h-screen">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <aside className="lg:col-span-1 space-y-8 sticky top-24 self-start">
                            <UserProfileCard profile={profile} />
                            <SkillsRadarChart skills={skills} />
                        </aside>
                        <main className="lg:col-span-2">
                            <div className="border-b border-gray-700 mb-6">
                                <nav className="-mb-px flex space-x-8" aria-label="Tabs">{tabs.map(tab => ( <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`${activeTab === tab.id ? 'border-blue-500 text-blue-400' : 'border-transparent text-gray-500 hover:text-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}>{tab.label}</button>))} </nav>
                            </div>
                            <AnimatePresence mode="wait">
                                <motion.div key={activeTab} initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -10, opacity: 0 }} transition={{ duration: 0.2 }}>
                                    {renderTabContent()}
                                </motion.div>
                            </AnimatePresence>
                        </main>
                    </div>
                    {selectedRepo && ( <AnalysisModal repo={selectedRepo} onClose={() => setSelectedRepo(null)} onAnalyze={handleAnalyzeRepo} /> )}
                </div>
            </div>
            <AnimatePresence>
                {modalOpen && <ProfileItemModal item={editingItem} onSave={handleSave} onClose={closeModal} type={modalType} />}
            </AnimatePresence>
        </>
    );
}