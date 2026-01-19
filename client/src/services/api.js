// File: client/src/services/api.js
// PHIÊN BẢN v3.1 - "BẤT TỬ" (Hoàn thiện API Phỏng vấn cho CẢ NTD & SV)

import axios from 'axios';

// ==========================================================
// === CẤU HÌNH AXIOS VÀ HÀM HELPER ===
// ==========================================================
const api = axios.create({
    baseURL: 'http://localhost:3800',
    timeout: 15000, // Tăng timeout lên 15s cho các tác vụ AI
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
});

/** [HELPER] Lấy cấu hình xác thực (Authorization header) */
const getAuthConfig = () => {
    try {
        const token = localStorage.getItem('token');
        if (token) {
            return {
                headers: {
                    'Authorization': `Bearer ${token}`
                },
            };
        }
    } catch (e) {
        console.error("[getAuthConfig] Error reading token from localStorage:", e);
    }
    return {};
};

/** [HELPER] Hàm xử lý lỗi tập trung "Đẳng cấp" */
const handleError = (error, functionName = 'API call') => {
    let errorMessage = 'Lỗi không xác định. Vui lòng thử lại.';
    let statusCode = 500;
    if (error.response) {
        // Ưu tiên message từ server (trong object { success: false, message: '...' })
        errorMessage = error.response.data?.message || error.message;
        statusCode = error.response.status;
        console.error(`❌ API Error in ${functionName} (Status ${statusCode}):`, errorMessage, error.response.data);
    } else if (error.request) {
        errorMessage = 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng hoặc thử lại sau.';
        statusCode = 503;
        console.error(`❌ Network Error in ${functionName} (No Response):`, error.request);
    } else {
        errorMessage = `Lỗi thiết lập request: ${error.message}`;
        console.error(`❌ Request Setup Error in ${functionName}:`, error.message);
    }
    if (statusCode === 401) {
        errorMessage = `Xác thực thất bại (${errorMessage}). Vui lòng đăng nhập lại.`;
        // (Logic logout tự động có thể được thêm ở đây nếu cần)
    }
    const standardizedError = new Error(errorMessage);
    standardizedError.status = statusCode;
    throw standardizedError;
};

// ==========================================================
// === API CÔNG KHAI (Public APIs) ===
// (Giữ nguyên các hàm của bạn)
// ==========================================================
export const getPublicStats = async () => { try { console.log("[API] Calling GET /api/public/stats"); const res = await api.get('/api/public/stats'); return res.data.data; } catch (e) { handleError(e, 'getPublicStats'); return { jobs: 0, companies: 0, students: 0 }; } };
export const getTrendingSkills = async () => { try { console.log("[API] Calling GET /api/public/skills/trending"); const res = await api.get('/api/public/skills/trending'); return res.data.data; } catch (e) { handleError(e, 'getTrendingSkills'); return []; } };
export const getJobs = async (filters = {}, page = 1, limit = 10) => { try { console.log(`[API] Calling GET /api/public/jobs (Page: ${page}, Filters: ${JSON.stringify(filters)})`); const params = { ...filters, page, limit }; Object.keys(params).forEach(key => (params[key] == null || params[key] === '') && delete params[key]); const res = await api.get('/api/public/jobs', { params }); return res.data; } catch (e) { handleError(e, 'getJobs'); throw e; } };
export const getJobById = async (id) => { try { if (!id) throw new Error("Job ID is required."); console.log(`[API] Calling GET /api/public/jobs/${id}`); const res = await api.get(`/api/public/jobs/${id}`); return res.data; } catch (e) { handleError(e, `getJobById(${id})`); throw e; } };
export const getAllCompanies = async () => { try { console.log("[API] Calling GET /api/public/companies"); const res = await api.get('/api/public/companies'); return res.data.data; } catch (e) { handleError(e, 'getAllCompanies'); throw e; } };
export const getCompanyProfileBySlug = async (slug) => { try { if (!slug) throw new Error("Company slug is required."); console.log(`[API] Calling GET /api/public/companies/${slug}`); const res = await api.get(`/api/public/companies/${slug}`); return res.data.data; } catch (e) { handleError(e, `getCompanyProfileBySlug(${slug})`); throw e; } };

// ==========================================================
// === API NGƯỜI DÙNG ĐÃ XÁC THỰC (Authenticated APIs) ===
// (Giữ nguyên)
// ==========================================================
export const getMe = async () => { try { console.log("[API] Calling GET /api/user/me"); const res = await api.get('/api/user/me', getAuthConfig()); return res.data; } catch (e) { handleError(e, 'getMe'); throw e; } };
export const getMyRepos = async () => { try { console.log("[API] Calling GET /api/user/repos"); const res = await api.get('/api/user/repos', getAuthConfig()); return res.data.data; } catch (e) { handleError(e, 'getMyRepos'); throw e; } };
export const getMySkills = async () => { try { console.log("[API] Calling GET /api/user/skills"); const res = await api.get('/api/user/skills', getAuthConfig()); return res.data.data; } catch (e) { handleError(e, 'getMySkills'); throw e; } };
export const analyzeRepo = async (repoFullName) => { try { if (!repoFullName) throw new Error("Repo full name is required for analysis."); console.log(`[API] Calling POST /api/user/analyze-repo for: ${repoFullName}`); const res = await api.post('/api/user/analyze-repo', { repoFullName }, getAuthConfig()); return res.data.data; } catch (e) { handleError(e, `analyzeRepo(${repoFullName})`); throw e; } };
export const getUserProfile = async (username) => { try { if (!username) throw new Error("Username is required to fetch profile."); console.log(`[API] Calling GET /api/user/profile/${username}`); const res = await api.get(`/api/user/profile/${username}`, getAuthConfig()); return res.data.data; } catch (e) { handleError(e, `getUserProfile(${username})`); throw e; } };
export const getStudentApplications = async () => { try { console.log("[API] Calling GET /api/user/student/applications"); const res = await api.get('/api/user/student/applications', getAuthConfig()); return res.data.data; } catch (e) { handleError(e, 'getStudentApplications'); throw e; } };
export const getStudentDashboardData = async () => { const functionName = 'getStudentDashboardData'; /* ... (logic hàm này giữ nguyên) ... */ console.log(`[API] Calling ${functionName} (Combined)...`); try { const results = await Promise.allSettled([ getMe(), getMyRepos(), getMySkills(), getStudentApplications() ]); const data = { user: null, repos: [], skills: [], applications: [], }; if (results[0].status === 'fulfilled' && results[0].value) { data.user = results[0].value; } else if (results[0].status === 'rejected') { console.error(`[${functionName}] CRITICAL: Failed to fetch /me data.`, results[0].reason); throw new Error('Không thể tải dữ liệu cốt lõi của người dùng.'); } if (results[1].status === 'fulfilled' && Array.isArray(results[1].value)) { data.repos = results[1].value; } else if (results[1].status === 'rejected') { console.warn(`[${functionName}] Non-critical failure in getMyRepos:`, results[1].reason?.message); } if (results[2].status === 'fulfilled' && Array.isArray(results[2].value)) { data.skills = results[2].value; } else if (results[2].status === 'rejected') { console.warn(`[${functionName}] Non-critical failure in getMySkills:`, results[2].reason?.message); } if (results[3].status === 'fulfilled' && Array.isArray(results[3].value)) { data.applications = results[3].value; } else if (results[3].status === 'rejected') { console.warn(`[${functionName}] Non-critical failure in getStudentApplications:`, results[3].reason?.message); } console.log(`[${functionName}] Final combined data being returned:`, data); return data; } catch (e) { if (!e.status) { console.error(`[${functionName}] Unexpected error:`, e); } throw new Error(e.message || 'Lỗi khi tổng hợp dữ liệu Dashboard.'); } };
export const applyToJob = async (jobId, coverLetter = '') => { try { if (!jobId) throw new Error("Job ID is required to apply."); console.log(`[API] Calling POST /api/jobs/${jobId}/apply`); const res = await api.post(`/api/jobs/${jobId}/apply`, { coverLetter }, getAuthConfig()); return res.data; } catch (e) { handleError(e, `applyToJob(${jobId})`); throw e; } };

// ==========================================================
// === API QUẢN LÝ HỒ SƠ (Profile Management) ===
// (Giữ nguyên)
// ==========================================================
export const addWorkExperience = async (data) => { try { console.log("[API] Calling POST /api/profile/experience"); const res = await api.post('/api/profile/experience', data, getAuthConfig()); return res.data; } catch (e) { handleError(e, 'addWorkExperience'); throw e; } };
export const updateWorkExperience = async (id, data) => { try { console.log(`[API] Calling PUT /api/profile/experience/${id}`); const res = await api.put(`/api/profile/experience/${id}`, data, getAuthConfig()); return res.data; } catch (e) { handleError(e, `updateWorkExperience(${id})`); throw e; } };
export const deleteWorkExperience = async (id) => { try { console.log(`[API] Calling DELETE /api/profile/experience/${id}`); const res = await api.delete(`/api/profile/experience/${id}`, getAuthConfig()); return res.data; } catch (e) { handleError(e, `deleteWorkExperience(${id})`); throw e; } };
export const addEducationHistory = async (data) => { try { console.log("[API] Calling POST /api/profile/education"); const res = await api.post('/api/profile/education', data, getAuthConfig()); return res.data; } catch (e) { handleError(e, 'addEducationHistory'); throw e; } };
export const updateEducationHistory = async (id, data) => { try { console.log(`[API] Calling PUT /api/profile/education/${id}`); const res = await api.put(`/api/profile/education/${id}`, data, getAuthConfig()); return res.data; } catch (e) { handleError(e, `updateEducationHistory(${id})`); throw e; } };
export const deleteEducationHistory = async (id) => { try { console.log(`[API] Calling DELETE /api/profile/education/${id}`); const res = await api.delete(`/api/profile/education/${id}`, getAuthConfig()); return res.data; } catch (e) { handleError(e, `deleteEducationHistory(${id})`); throw e; } };

// ==========================================================
// === API NHÀ TUYỂN DỤNG (Recruiter APIs) ===
// (Giữ nguyên)
// ==========================================================
export const createRecruiterJob = async (jobData) => { try { console.log("[API] Calling POST /api/jobs (createRecruiterJob)"); const res = await api.post('/api/jobs', jobData, getAuthConfig()); return res.data; } catch (e) { handleError(e, 'createRecruiterJob'); throw e; } };
export const updateJob = async (jobId, jobData) => { try { console.log(`[API] Calling PUT /api/jobs/${jobId} (updateJob)`); const res = await api.put(`/api/jobs/${jobId}`, jobData, getAuthConfig()); return res.data; } catch (e) { handleError(e, `updateJob(${jobId})`); throw e; } };
export const changeJobStatus = async (jobId, newStatus) => { try { console.log(`[API] Calling PATCH /api/jobs/${jobId}/status`); const res = await api.patch(`/api/jobs/${jobId}/status`, { newStatus }, getAuthConfig()); return res.data; } catch (e) { handleError(e, `changeJobStatus(${jobId})`); throw e; } };
export const deleteJob = async (jobId) => { try { console.log(`[API] Calling DELETE /api/jobs/${jobId}`); const res = await api.delete(`/api/jobs/${jobId}`, getAuthConfig()); return res.data; } catch (e) { handleError(e, `deleteJob(${jobId})`); throw e; } };
export const getRecruiterStats = async () => { try { console.log("[API] Calling GET /api/user/recruiter/stats"); const res = await api.get('/api/user/recruiter/stats', getAuthConfig()); return res.data.data; } catch (e) { handleError(e, 'getRecruiterStats'); throw e; } };
export const getRecruiterJobs = async () => { try { console.log("[API] Calling GET /api/user/recruiter/jobs"); const res = await api.get('/api/user/recruiter/jobs', getAuthConfig()); return res.data.data; } catch (e) { handleError(e, 'getRecruiterJobs'); throw e; } };
export const getApplicantsForJob = async (jobId) => { try { console.log(`[API] Calling GET /api/user/jobs/${jobId}/applicants`); const res = await api.get(`/api/user/jobs/${jobId}/applicants`, getAuthConfig()); return res.data.data; } catch (e) { handleError(e, `getApplicantsForJob(${jobId})`); throw e; } };
export const searchStudents = async (criteria) => { try { console.log("[API] Calling POST /api/user/recruiter/search", { skills: criteria }); const res = await api.post('/api/user/recruiter/search', { skills: criteria }, getAuthConfig()); return res.data.data; } catch (e) { handleError(e, 'searchStudents'); throw e; } };
export const updateApplicationStatus = async (applicationId, newStatus, notes = null) => { try { console.log(`[API] Calling PATCH /api/applications/${applicationId}/status`); const payload = { newStatus, notes }; const res = await api.patch(`/api/applications/${applicationId}/status`, payload, getAuthConfig()); return res.data; } catch (e) { handleError(e, `updateApplicationStatus(${applicationId})`); throw e; } };
export const getMyCompanyProfile = async () => { try { console.log("[API] Calling GET /api/company-management"); const res = await api.get('/api/company-management', getAuthConfig()); return res.data; } catch (e) { handleError(e, 'getMyCompanyProfile'); throw e; } };
export const updateMyCompanyProfile = async (companyData) => { try { console.log("[API] Calling PUT /api/company-management"); const res = await api.put('/api/company-management', companyData, getAuthConfig()); return res.data; } catch (e) { handleError(e, 'updateMyCompanyProfile'); throw e; } };

// ==========================================================
// === (MỚI) API PHỎNG VẤN AI (v3.1 - HOÀN HẢO) ===
// ==========================================================

// --- (A) Đại lộ Nhà Tuyển dụng ---

/** [Protected/Recruiter] Lấy danh sách Mẫu Phỏng vấn của NTD */
export const getInterviewTemplates = async () => {
    try {
        console.log("[API] Calling GET /api/interviews/recruiter/templates");
        const res = await api.get('/api/interviews/recruiter/templates', getAuthConfig());
        return res.data.data; // Backend dùng sendSuccessResponse
    } catch (e) { handleError(e, 'getInterviewTemplates'); throw e; }
};

/**
 * [Protected/Recruiter] Yêu cầu AI tạo Mẫu Phỏng vấn mới
 * @param {object} templateData - { jobId, title, focusSkills, questionCount, difficulty }
 */
export const createInterviewTemplate = async (templateData) => {
    try {
        console.log("[API] Calling POST /api/interviews/recruiter/templates", templateData);
        // Tăng timeout CỤC BỘ cho riêng API này lên 60 giây
        // vì AI có thể mất thời gian để suy nghĩ và tạo bộ câu hỏi "chất lượng"
        const config = {
            ...getAuthConfig(),
            timeout: 60000 
        };
        const res = await api.post('/api/interviews/recruiter/templates', templateData, config);
        return res.data.data; // Backend dùng sendSuccessResponse
    } catch (e) { handleError(e, 'createInterviewTemplate'); throw e; }
};

/**
 * [Protected/Recruiter] Gửi lời mời phỏng vấn cho ứng viên
 * @param {number} applicationId - ID của đơn ứng tuyển
 * @param {number} templateId - ID của mẫu phỏng vấn
 * @param {string} message - Lời nhắn
 */
export const sendInterviewInvite = async (applicationId, templateId, message) => {
    try {
        console.log(`[API] Calling POST /api/interviews/recruiter/send (AppID: ${applicationId}, TemplateID: ${templateId})`);
        const payload = { applicationId, templateId, message };
        const res = await api.post('/api/interviews/recruiter/send', payload, getAuthConfig());
        return res.data.data; // Backend dùng sendSuccessResponse
    } catch (e) { handleError(e, 'sendInterviewInvite'); throw e; }
};

/** [Protected/Recruiter] Lấy danh sách kết quả (đã nộp/đã chấm) */
export const getInterviewResults = async () => {
    try {
        console.log("[API] Calling GET /api/interviews/recruiter/results");
        const res = await api.get('/api/interviews/recruiter/results', getAuthConfig());
        return res.data.data; // Backend dùng sendSuccessResponse
    } catch (e) { handleError(e, 'getInterviewResults'); throw e; }
};

/**
 * [Protected/Recruiter] Yêu cầu AI chấm bài (Bất đồng bộ)
 * @param {number} studentInterviewId - ID của bài làm (StudentInterviews)
 */
export const gradeInterviewAI = async (studentInterviewId) => {
    try {
        console.log(`[API] Calling POST /api/interviews/recruiter/results/${studentInterviewId}/grade`);
        const res = await api.post(`/api/interviews/recruiter/results/${studentInterviewId}/grade`, {}, getAuthConfig());
        return res.data; // Trả về { success, message, data } từ 202 Accepted
    } catch (e) { handleError(e, `gradeInterviewAI(${studentInterviewId})`); throw e; }
};

/**
 * [Protected/Recruiter] Lấy chi tiết kết quả (side-by-side)
 * @param {number} studentInterviewId - ID của bài làm (StudentInterviews)
 */
export const getInterviewResultDetail = async (studentInterviewId) => {
    try {
        console.log(`[API] Calling GET /api/interviews/recruiter/results/${studentInterviewId}`);
        // API này có thể mất thời gian query nhiều bảng
        const config = {
            ...getAuthConfig(),
            timeout: 20000 // Tăng timeout lên 20s
        };
        const res = await api.get(`/api/interviews/recruiter/results/${studentInterviewId}`, config);
        return res.data.data; // Backend dùng sendSuccessResponse
    } catch (e) { handleError(e, `getInterviewResultDetail(${studentInterviewId})`); throw e; }
};


// --- (B) Đại lộ Sinh viên (MỚI THÊM) ---

/**
 * [Protected/Student] Bắt đầu làm bài, lấy đề
 * @param {number} studentInterviewId - ID của bài làm (StudentInterviews)
 */
export const startInterview = async (studentInterviewId) => {
    try {
        console.log(`[API] Calling GET /api/interviews/student/start/${studentInterviewId}`);
        const res = await api.get(`/api/interviews/student/start/${studentInterviewId}`, getAuthConfig());
        return res.data.data; // Backend dùng sendSuccessResponse
    } catch (e) { handleError(e, `startInterview(${studentInterviewId})`); throw e; }
};

/**
 * [Protected/Student] Nộp bài phỏng vấn
 * @param {number} studentInterviewId - ID của bài làm (StudentInterviews)
 * @param {Array<object>} answers - Mảng [{ questionId, answerText }]
 */
export const submitInterview = async (studentInterviewId, answers) => {
    try {
        console.log(`[API] Calling POST /api/interviews/student/submit/${studentInterviewId}`);
        const payload = { answers };
        const res = await api.post(`/api/interviews/student/submit/${studentInterviewId}`, payload, getAuthConfig());
        return res.data.data; // Backend dùng sendSuccessResponse
    } catch (e) { handleError(e, `submitInterview(${studentInterviewId})`); throw e; }
};

// ==========================================================
console.log("✅✅✅ client/services/api.js (Tối Thượng v3.1 - Full Interview Suite) loaded.");