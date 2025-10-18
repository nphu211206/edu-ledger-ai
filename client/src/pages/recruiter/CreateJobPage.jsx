import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { createRecruiterJob } from '../../services/api';

// --- COMPONENT CON ---
const FormInput = ({ id, label, ...props }) => ( <div> <label htmlFor={id} className="block text-sm font-medium text-gray-300 mb-1">{label}</label> <input id={id} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500" {...props} /> </div> );
const FormTextarea = ({ id, label, ...props }) => ( <div> <label htmlFor={id} className="block text-sm font-medium text-gray-300 mb-1">{label}</label> <textarea id={id} rows="8" className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500" {...props}></textarea> </div> );
const SkillInput = ({ skills, setSkills }) => { const [inputValue, setInputValue] = useState(''); const handleKeyDown = (e) => { if (e.key !== 'Enter' || !inputValue.trim()) return; e.preventDefault(); const newSkill = inputValue.trim(); if (!skills.includes(newSkill)) { setSkills([...skills, newSkill]); } setInputValue(''); }; const removeSkill = (skillToRemove) => { setSkills(skills.filter(skill => skill !== skillToRemove)); }; return ( <div> <label className="block text-sm font-medium text-gray-300 mb-1">Kỹ năng yêu cầu (nhấn Enter để thêm)</label> <div className="flex flex-wrap items-center gap-2 p-2 bg-gray-700 border border-gray-600 rounded-md"> {skills.map(skill => ( <div key={skill} className="flex items-center gap-2 bg-blue-900 text-blue-300 text-sm font-semibold px-3 py-1 rounded-full"> {skill} <button type="button" onClick={() => removeSkill(skill)} className="text-blue-200 hover:text-white">&times;</button> </div> ))} <input type="text" value={inputValue} onChange={(e) => setInputValue(e.target.value)} onKeyDown={handleKeyDown} placeholder="VD: React, Node.js..." className="flex-grow bg-transparent text-white outline-none p-1" /> </div> </div> ); };
const Spinner = () => <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>;
const Alert = ({ message }) => <div className="bg-red-900 border border-red-700 text-red-300 px-4 py-3 rounded-lg text-center">{message}</div>;

// --- COMPONENT CHÍNH ---
export default function CreateJobPage() {
    const [formData, setFormData] = useState({ title: '', description: '', location: '', salary: '', jobType: 'Full-time' });
    const [skills, setSkills] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleChange = (e) => { setFormData({ ...formData, [e.target.name]: e.target.value }); };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.title || !formData.description || skills.length === 0) { setError('Vui lòng điền đầy đủ Tiêu đề, Mô tả và ít nhất một Kỹ năng.'); return; }
        setIsLoading(true);
        setError('');
        try {
            await createRecruiterJob({ ...formData, skills });
            navigate('/recruiter/dashboard'); // Thành công thì chuyển hướng
        } catch (err) {
            setError(err.message || 'Đã có lỗi xảy ra. Vui lòng thử lại.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <Helmet> <title>Đăng tin tuyển dụng mới | EduLedger AI</title> </Helmet>
            <div className="bg-gray-900 min-h-screen text-white py-12">
                <div className="container mx-auto max-w-4xl px-4">
                    <h1 className="text-4xl font-bold mb-2">Tạo tin tuyển dụng mới</h1>
                    <p className="text-gray-400 mb-8">Điền thông tin chi tiết để tìm kiếm những ứng viên tài năng nhất.</p>
                    <form onSubmit={handleSubmit} className="bg-gray-800 p-8 rounded-xl border border-gray-700 space-y-6">
                        {error && <Alert message={error} />}
                        <FormInput id="title" name="title" label="Tiêu đề công việc" value={formData.title} onChange={handleChange} placeholder="VD: Lập trình viên Frontend (ReactJS)" required />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormInput id="location" name="location" label="Địa điểm" value={formData.location} onChange={handleChange} placeholder="VD: Hà Nội, TP. Hồ Chí Minh" />
                            <FormInput id="salary" name="salary" label="Mức lương" value={formData.salary} onChange={handleChange} placeholder="VD: 15-25 triệu hoặc Thỏa thuận" />
                        </div>
                        <div>
                            <label htmlFor="jobType" className="block text-sm font-medium text-gray-300 mb-1">Loại công việc</label>
                            <select id="jobType" name="jobType" value={formData.jobType} onChange={handleChange} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                                <option>Full-time</option><option>Part-time</option><option>Internship</option><option>Remote</option>
                            </select>
                        </div>
                        <SkillInput skills={skills} setSkills={setSkills} />
                        <FormTextarea id="description" name="description" label="Mô tả chi tiết công việc" value={formData.description} onChange={handleChange} placeholder="Mô tả yêu cầu, trách nhiệm, và phúc lợi..." required />
                        <div className="flex justify-end pt-4">
                            <button type="submit" disabled={isLoading} className="w-full md:w-auto flex justify-center py-3 px-8 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-500">
                                {isLoading ? <Spinner /> : 'Đăng tin'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
}