// File: client/src/services/api.js
// PHIÊN BẢN TỐI THƯỢNG - ĐẦY ĐỦ API CHO TOÀN BỘ HỆ THỐNG

import axios from 'axios';
const api = axios.create({ baseURL: 'http://localhost:3800' });
const getAuthConfig = () => { const token = localStorage.getItem('token'); if (!token) throw new Error('Yêu cầu xác thực.'); return { headers: { 'Authorization': `Bearer ${token}` } }; };

// --- API CÔNG KHAI & CHUNG ---
export const getPublicStats = async () => { try { const res = await api.get('/api/public/stats'); return res.data; } catch (e) { return { jobs: 0, companies: 0, students: 0 }; }};
export const getTrendingSkills = async () => { try { const res = await api.get('/api/public/skills/trending'); return res.data; } catch (e) { return []; }};
export const getJobs = async (filters, page) => { try { const params = { ...filters, page, limit: 10 }; const res = await api.get('/api/jobs', { params }); return res.data; } catch (e) { throw e.response?.data || e; }};
export const getJobById = async (id) => { try { const res = await api.get(`/api/jobs/${id}`); return res.data; } catch (e) { throw e.response?.data || e; }};
export const getAllCompanies = async () => { try { const res = await api.get('/api/companies'); return res.data; } catch (e) { throw e.response?.data || e; }};
export const getCompanyProfileBySlug = async (slug) => { try { const res = await api.get(`/api/companies/${slug}`); return res.data; } catch (e) { throw e.response?.data || e; }};

// === API NGƯỜI DÙNG ĐÃ XÁC THỰC (Sử dụng /api/user và /api/profile) ===
export const applyToJob = async (jobId, coverLetter) => { try { const config = getAuthConfig(); const res = await api.post(`/api/jobs/${jobId}/apply`, { coverLetter }, config); return res.data; } catch (e) { throw e.response?.data || e; }};
export const analyzeRepo = async (repoFullName) => { try { const config = getAuthConfig(); const res = await api.post('/api/user/analyze-repo', { repoFullName }, config); return res.data; } catch (e) { throw e.response?.data || e; }};
export const getStudentDashboardData = async () => { try { const config = getAuthConfig(); const [meRes, reposRes, skillsRes, applicationsRes] = await Promise.all([ api.get('/api/user/me', config), api.get('/api/user/repos', config), api.get('/api/user/skills', config), api.get('/api/user/student/applications', config) ]); return { user: meRes.data, repos: reposRes.data, skills: skillsRes.data, applications: applicationsRes.data }; } catch (e) { throw e.response?.data || e; }};
export const getWorkExperiences = async () => { try { const config = getAuthConfig(); const res = await api.get('/api/profile/experience', config); return res.data; } catch (e) { throw e.response?.data || e; }};
export const addWorkExperience = async (data) => { try { const config = getAuthConfig(); const res = await api.post('/api/profile/experience', data, config); return res.data; } catch (e) { throw e.response?.data || e; }};
export const updateWorkExperience = async (id, data) => { try { const config = getAuthConfig(); const res = await api.put(`/api/profile/experience/${id}`, data, config); return res.data; } catch (e) { throw e.response?.data || e; }};
export const deleteWorkExperience = async (id) => { try { const config = getAuthConfig(); const res = await api.delete(`/api/profile/experience/${id}`, config); return res.data; } catch (e) { throw e.response?.data || e; }};
export const getEducationHistory = async () => { try { const config = getAuthConfig(); const res = await api.get('/api/profile/education', config); return res.data; } catch (e) { throw e.response?.data || e; }};
export const addEducationHistory = async (data) => { try { const config = getAuthConfig(); const res = await api.post('/api/profile/education', data, config); return res.data; } catch (e) { throw e.response?.data || e; }};
export const updateEducationHistory = async (id, data) => { try { const config = getAuthConfig(); const res = await api.put(`/api/profile/education/${id}`, data, config); return res.data; } catch (e) { throw e.response?.data || e; }};
export const deleteEducationHistory = async (id) => { try { const config = getAuthConfig(); const res = await api.delete(`/api/profile/education/${id}`, config); return res.data; } catch (e) { throw e.response?.data || e; }};
export const createRecruiterJob = async (jobData) => { try { const config = getAuthConfig(); const res = await api.post('/api/jobs', jobData, config); return res.data; } catch (e) { throw e.response?.data || e; }};

export const getRecruiterStats = async () => { try { const config = getAuthConfig(); const res = await api.get('/api/user/recruiter/stats', config); return res.data; } catch (e) { throw e.response?.data || e; }};
export const getRecruiterJobs = async () => { try { const config = getAuthConfig(); const res = await api.get('/api/user/recruiter/jobs', config); return res.data; } catch (e) { throw e.response?.data || e; }};
export const getApplicantsForJob = async (jobId) => { try { const config = getAuthConfig(); const res = await api.get(`/api/user/jobs/${jobId}/applicants`, config); return res.data; } catch (e) { throw e.response?.data || e; }};
export const searchStudents = async (criteria) => { try { const config = getAuthConfig(); const res = await api.post('/api/user/recruiter/search', { skills: criteria }, config); return res.data; } catch (e) { throw e.response?.data || e; }};