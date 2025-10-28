// File: client/src/services/api.js
// PHIÊN BẢN TỐI THƯỢNG MASTER v2.2 - Đầy đủ CRUD Job & Application Status
// File này là cầu nối duy nhất giữa Frontend React và Backend Server.
// Nó định nghĩa tất cả các hàm gọi API, xử lý xác thực (gửi token)
// và chuẩn hóa lỗi trả về.

import axios from 'axios'; // Import thư viện Axios để thực hiện HTTP requests

// ==========================================================
// === CẤU HÌNH AXIOS VÀ HÀM HELPER ===
// ==========================================================

// 1. Tạo một instance Axios duy nhất để quản lý tập trung
// Điều này cho phép chúng ta thiết lập baseURL, timeout, và headers mặc định
// cho tất cả các request gửi đến backend.
const api = axios.create({
    baseURL: 'http://localhost:3800', // Địa chỉ server backend của bạn
    timeout: 15000, // Tăng timeout lên 15 giây, phòng khi API (như AI) xử lý lâu
    headers: { // Headers mặc định cho mọi request
        'Content-Type': 'application/json', // Báo cho server biết chúng ta gửi dữ liệu JSON
        'Accept': 'application/json' // Báo cho server biết chúng ta muốn nhận dữ liệu JSON
    }
});

/**
 * [HELPER] Lấy cấu hình xác thực (Authorization header) từ localStorage.
 * Hàm này được gọi trước mỗi request API yêu cầu đăng nhập.
 * @returns {object} - Object chứa headers (nếu có token) hoặc object rỗng.
 */
const getAuthConfig = () => {
    try {
        // Lấy token đã lưu trong localStorage khi người dùng đăng nhập
        const token = localStorage.getItem('token');
        if (token) {
            // Nếu có token, trả về object config headers
            return {
                headers: {
                    'Authorization': `Bearer ${token}` // Chuẩn JWT Bearer Token
                },
            };
        }
    } catch (e) {
        // Xử lý lỗi nếu localStorage bị chặn hoặc có vấn đề
        console.error("[getAuthConfig] Error reading token from localStorage:", e);
    }
    // Trả về object rỗng nếu không có token hoặc có lỗi
    return {};
};

/**
 * [HELPER] Hàm xử lý lỗi tập trung cho tất cả các cuộc gọi API.
 * Ghi log lỗi chi tiết ra console và ném (throw) lại một Error đã được chuẩn hóa
 * để component UI có thể bắt (catch) và hiển thị thông báo.
 * @param {Error} error - Đối tượng lỗi bắt được từ Axios (hoặc lỗi khác).
 * @param {string} functionName - Tên của hàm API service nơi xảy ra lỗi (giúp debug).
 */
const handleError = (error, functionName = 'API call') => {
    let errorMessage = 'Lỗi không xác định. Vui lòng thử lại.';
    let statusCode = 500; // Mặc định là lỗi server

    if (error.response) {
        // Lỗi nhận được từ server (server đã trả về response với mã lỗi 4xx hoặc 5xx)
        errorMessage = error.response.data?.message || error.message; // Ưu tiên message từ server
        statusCode = error.response.status;
        console.error(`❌ API Error in ${functionName} (Status ${statusCode}):`, errorMessage, error.response.data);
    } else if (error.request) {
        // Lỗi không nhận được response từ server (mất mạng, server sập, timeout, CORS block)
        errorMessage = 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng hoặc thử lại sau.';
        statusCode = 503; // Service Unavailable
        console.error(`❌ Network Error in ${functionName} (No Response):`, error.request);
    } else {
        // Lỗi xảy ra khi thiết lập request (lỗi code ở frontend trước khi gửi đi)
        errorMessage = `Lỗi thiết lập request: ${error.message}`;
        console.error(`❌ Request Setup Error in ${functionName}:`, error.message);
    }

    // Xử lý lỗi 401 (Unauthorized) đặc biệt: có thể token hết hạn hoặc không hợp lệ
    if (statusCode === 401) {
        errorMessage = `Xác thực thất bại (${errorMessage}). Vui lòng đăng nhập lại.`;
        // Cân nhắc thực hiện logout tự động tại đây để đảm bảo an toàn
        // Ví dụ:
        // localStorage.removeItem('token');
        // if (window.location.pathname !== '/login') {
        //     window.location.href = '/login'; // Chuyển hướng về trang login
        // }
    }

    // Ném lại một Error mới đã được chuẩn hóa.
    // Component UI sẽ bắt (catch) lỗi này và hiển thị `error.message`.
    const standardizedError = new Error(errorMessage);
    standardizedError.status = statusCode; // Gán thêm status code vào error object
    throw standardizedError;
};


// ==========================================================
// === API CÔNG KHAI (Public APIs) ===
// Các API này không yêu cầu token xác thực.
// ==========================================================

/** [PUBLIC] Lấy thống kê công khai (số jobs, companies, students) cho trang chủ. */
export const getPublicStats = async () => {
    try {
        console.log("[API] Calling GET /api/public/stats");
        const res = await api.get('/api/public/stats');
        return res.data;
    } catch (e) {
        // Không ném lỗi ra ngoài, trả về giá trị mặc định để UI không bị crash
        handleError(e, 'getPublicStats');
        return { jobs: 0, companies: 0, students: 0 };
    }
};

/** [PUBLIC] Lấy danh sách các kỹ năng đang hot (trending) trên thị trường. */
export const getTrendingSkills = async () => {
    try {
        console.log("[API] Calling GET /api/public/skills/trending");
        const res = await api.get('/api/public/skills/trending');
        return res.data; // Trả về mảng các chuỗi [ "React", "Node.js", ... ]
    } catch (e) {
        handleError(e, 'getTrendingSkills');
        return []; // Trả về mảng rỗng khi lỗi
    }
};

/**
 * [PUBLIC] Lấy danh sách việc làm (có filter, pagination).
 * @param {object} filters - Object chứa các filter (keyword, location, jobTypes[], salaryRange, etc.).
 * @param {number} page - Số trang hiện tại (mặc định 1).
 * @param {number} limit - Số lượng item trên mỗi trang (mặc định 10).
 */
export const getJobs = async (filters = {}, page = 1, limit = 10) => {
    try {
        console.log(`[API] Calling GET /api/public/jobs (Page: ${page}, Filters: ${JSON.stringify(filters)})`);
        const params = { ...filters, page, limit };
        // Dọn dẹp params: loại bỏ key rỗng/null/undefined
        Object.keys(params).forEach(key => (params[key] == null || params[key] === '') && delete params[key]);
        const res = await api.get('/api/public/jobs', { params });
        return res.data; // Trả về { jobs: [], totalPages: 0, currentPage: 0, totalJobs: 0 }
    } catch (e) {
        handleError(e, 'getJobs');
        throw e; // Ném lại lỗi đã chuẩn hóa để component JobsPage xử lý
    }
};

/** [PUBLIC] Lấy chi tiết một việc làm bằng ID. */
export const getJobById = async (id) => {
    try {
        if (!id) throw new Error("Job ID is required."); // Validation cơ bản
        console.log(`[API] Calling GET /api/public/jobs/${id}`);
        const res = await api.get(`/api/public/jobs/${id}`);
        return res.data; // Trả về object job chi tiết
    } catch (e) {
        handleError(e, `getJobById(${id})`);
        throw e;
    }
};

/** [PUBLIC] Lấy danh sách tất cả công ty (thông tin cơ bản). */
export const getAllCompanies = async () => {
    try {
        console.log("[API] Calling GET /api/public/companies");
        const res = await api.get('/api/public/companies');
        return res.data; // Trả về mảng các object company
    } catch (e) {
        handleError(e, 'getAllCompanies');
        throw e;
    }
};

/** [PUBLIC] Lấy hồ sơ công khai của công ty bằng slug. */
export const getCompanyProfileBySlug = async (slug) => {
    try {
        if (!slug) throw new Error("Company slug is required.");
        console.log(`[API] Calling GET /api/public/companies/${slug}`);
        const res = await api.get(`/api/public/companies/${slug}`);
        return res.data; // Trả về { profile: {}, jobs: [] }
    } catch (e) {
        handleError(e, `getCompanyProfileBySlug(${slug})`);
        throw e;
    }
};


// ==========================================================
// === API NGƯỜI DÙNG ĐÃ XÁC THỰC (Authenticated APIs) ===
// ==========================================================

// --- Thông tin User & GitHub (chung cho Student & Recruiter) ---

/** [Protected] Lấy thông tin chi tiết của người dùng đang đăng nhập (từ token). */
export const getMe = async () => {
    try {
        console.log("[API] Calling GET /api/user/me");
        const res = await api.get('/api/user/me', getAuthConfig()); // Gửi kèm token
        return res.data;
    } catch (e) { handleError(e, 'getMe'); throw e; }
};

/** [Protected] Lấy repo GitHub của người dùng (nếu là sinh viên). */
export const getMyRepos = async () => {
    try {
        console.log("[API] Calling GET /api/user/repos");
        const res = await api.get('/api/user/repos', getAuthConfig());
        return res.data; // Mảng repos từ GitHub
    } catch (e) { handleError(e, 'getMyRepos'); throw e; }
};

/** [Protected] Lấy kỹ năng đã xác thực của người dùng (nếu là sinh viên). */
export const getMySkills = async () => {
    try {
        console.log("[API] Calling GET /api/user/skills");
        const res = await api.get('/api/user/skills', getAuthConfig());
        return res.data; // Mảng skills [{ skill_name, score }]
    } catch (e) { handleError(e, 'getMySkills'); throw e; }
};

/** [Protected] Phân tích repo GitHub bằng AI (Giả lập hoặc Thật). */
export const analyzeRepo = async (repoFullName) => {
    try {
        if (!repoFullName) throw new Error("Repo full name is required for analysis.");
        console.log(`[API] Calling POST /api/user/analyze-repo for: ${repoFullName}`);
        const res = await api.post('/api/user/analyze-repo', { repoFullName }, getAuthConfig());
        return res.data; // Trả về kết quả phân tích
    } catch (e) { handleError(e, `analyzeRepo(${repoFullName})`); throw e; }
};

// --- Hồ sơ Công khai & Dashboard Sinh viên ---

/** [Protected] Lấy hồ sơ công khai của một sinh viên (người xem cần đăng nhập). */
export const getUserProfile = async (username) => {
    try {
        if (!username) throw new Error("Username is required to fetch profile.");
        console.log(`[API] Calling GET /api/user/profile/${username}`);
        const res = await api.get(`/api/user/profile/${username}`, getAuthConfig());
        return res.data; // { profile, skills, repos, experiences, education }
    } catch (e) { handleError(e, `getUserProfile(${username})`); throw e; }
};

/** [Protected] Lấy danh sách ứng tuyển của sinh viên đang đăng nhập. */
export const getStudentApplications = async () => {
    try {
        console.log("[API] Calling GET /api/user/student/applications");
        const res = await api.get('/api/user/student/applications', getAuthConfig());
        return res.data; // Mảng applications [{ id, status, appliedAt, job: {...} }]
    } catch (e) { handleError(e, 'getStudentApplications'); throw e; }
};

/** [Protected] Lấy tất cả dữ liệu cần thiết cho trang Dashboard của Sinh viên (Hàm tổng hợp). */
export const getStudentDashboardData = async () => {
    console.log("[API] Calling getStudentDashboardData (Combined)...");
    try {
        // Chạy song song các request API
        const results = await Promise.allSettled([
            getMe(),                // 0: Thông tin user
            getMyRepos(),           // 1: Repos
            getMySkills(),          // 2: Skills
            getStudentApplications()// 3: Applications
        ]);

        // Xử lý kết quả từ Promise.allSettled
        const data = {
            user: results[0].status === 'fulfilled' ? results[0].value : null,
            repos: results[1].status === 'fulfilled' ? results[1].value : [],
            skills: results[2].status === 'fulfilled' ? results[2].value : [],
            applications: results[3].status === 'fulfilled' ? results[3].value : [],
        };

        // Ném lỗi nếu request quan trọng nhất (getMe) thất bại
        if (results[0].status === 'rejected') {
            console.error("[getStudentDashboardData] CRITICAL: Failed to fetch /me data.", results[0].reason);
            throw new Error('Không thể tải dữ liệu cốt lõi của người dùng.');
        }

         // Log cảnh báo nếu các phần phụ trợ lỗi
         results.forEach((result, index) => {
             if (result.status === 'rejected' && index > 0) {
                 const part = ['getMyRepos', 'getMySkills', 'getStudentApplications'][index - 1];
                 console.warn(`[getStudentDashboardData] Non-critical failure in ${part}:`, result.reason?.message);
             }
         });

         console.log("[getStudentDashboardData] Data fetched successfully (partially or fully).");
        return data; // Trả về object dữ liệu đã tổng hợp

    } catch (e) {
        // Bắt lỗi chung hoặc lỗi nghiêm trọng (từ getMe)
        handleError(e, 'getStudentDashboardData');
        throw e; // Ném lại lỗi cuối cùng
    }
};

// --- Hành động (Ứng tuyển) ---

/** [Protected] Sinh viên ứng tuyển vào một Job. */
export const applyToJob = async (jobId, coverLetter = '') => {
    try {
        if (!jobId) throw new Error("Job ID is required to apply.");
        console.log(`[API] Calling POST /api/jobs/${jobId}/apply`);
        const res = await api.post(`/api/jobs/${jobId}/apply`, { coverLetter }, getAuthConfig());
        return res.data; // Trả về thông tin application vừa tạo
    } catch (e) { handleError(e, `applyToJob(${jobId})`); throw e; }
};

// ==========================================================
// === API QUẢN LÝ HỒ SƠ (Profile Management - CRUD Exp/Edu) ===
// ==========================================================
// Các API này gọi đến /api/profile/... và đã được bảo vệ bằng token

// --- Work Experience ---
/** [Protected] Lấy danh sách kinh nghiệm làm việc. */
export const getWorkExperiences = async () => {
    try { console.log("[API] Calling GET /api/profile/experience"); const res = await api.get('/api/profile/experience', getAuthConfig()); return res.data; }
    catch (e) { handleError(e, 'getWorkExperiences'); throw e; }
};
/** [Protected] Thêm kinh nghiệm làm việc mới. */
export const addWorkExperience = async (data) => {
    try { console.log("[API] Calling POST /api/profile/experience"); const res = await api.post('/api/profile/experience', data, getAuthConfig()); return res.data; }
    catch (e) { handleError(e, 'addWorkExperience'); throw e; }
};
/** [Protected] Cập nhật kinh nghiệm làm việc. */
export const updateWorkExperience = async (id, data) => {
    try { console.log(`[API] Calling PUT /api/profile/experience/${id}`); const res = await api.put(`/api/profile/experience/${id}`, data, getAuthConfig()); return res.data; }
    catch (e) { handleError(e, `updateWorkExperience(${id})`); throw e; }
};
/** [Protected] Xóa kinh nghiệm làm việc. */
export const deleteWorkExperience = async (id) => {
    try { console.log(`[API] Calling DELETE /api/profile/experience/${id}`); const res = await api.delete(`/api/profile/experience/${id}`, getAuthConfig()); return res.data; }
    catch (e) { handleError(e, `deleteWorkExperience(${id})`); throw e; }
};

// --- Education History ---
/** [Protected] Lấy lịch sử học vấn. */
export const getEducationHistory = async () => {
    try { console.log("[API] Calling GET /api/profile/education"); const res = await api.get('/api/profile/education', getAuthConfig()); return res.data; }
    catch (e) { handleError(e, 'getEducationHistory'); throw e; }
};
/** [Protected] Thêm lịch sử học vấn mới. */
export const addEducationHistory = async (data) => {
    try { console.log("[API] Calling POST /api/profile/education"); const res = await api.post('/api/profile/education', data, getAuthConfig()); return res.data; }
    catch (e) { handleError(e, 'addEducationHistory'); throw e; }
};
/** [Protected] Cập nhật lịch sử học vấn. */
export const updateEducationHistory = async (id, data) => {
    try { console.log(`[API] Calling PUT /api/profile/education/${id}`); const res = await api.put(`/api/profile/education/${id}`, data, getAuthConfig()); return res.data; }
    catch (e) { handleError(e, `updateEducationHistory(${id})`); throw e; }
};
/** [Protected] Xóa lịch sử học vấn. */
export const deleteEducationHistory = async (id) => {
    try { console.log(`[API] Calling DELETE /api/profile/education/${id}`); const res = await api.delete(`/api/profile/education/${id}`, getAuthConfig()); return res.data; }
    catch (e) { handleError(e, `deleteEducationHistory(${id})`); throw e; }
};

// ==========================================================
// === API NHÀ TUYỂN DỤNG (Recruiter APIs) ===
// ==========================================================

// --- Quản lý Job (Tạo, Sửa, Xóa, Đổi Trạng thái) ---

/** [Protected] NTD tạo tin tuyển dụng mới. */
export const createRecruiterJob = async (jobData) => {
    try {
        console.log("[API] Calling POST /api/jobs (createRecruiterJob)");
        const res = await api.post('/api/jobs', jobData, getAuthConfig()); // Endpoint: POST /api/jobs
        return res.data;
    } catch (e) { handleError(e, 'createRecruiterJob'); throw e; }
};

/** [Protected] NTD cập nhật thông tin chi tiết của Job. */
export const updateJob = async (jobId, jobData) => {
    try {
        if (!jobId) throw new Error("Job ID is required for update.");
        console.log(`[API] Calling PUT /api/jobs/${jobId} (updateJob)`);
        const res = await api.put(`/api/jobs/${jobId}`, jobData, getAuthConfig()); // Endpoint: PUT /api/jobs/:id
        return res.data;
    } catch (e) {
        handleError(e, `updateJob(${jobId})`);
        throw e;
    }
};

/** [Protected] NTD thay đổi trạng thái của Job (Active, Inactive, Expired). */
export const changeJobStatus = async (jobId, newStatus) => {
    try {
        if (!jobId) throw new Error("Job ID is required for status change.");
        if (!newStatus) throw new Error("New status is required.");
        console.log(`[API] Calling PATCH /api/jobs/${jobId}/status`);
        const res = await api.patch(`/api/jobs/${jobId}/status`, { newStatus }, getAuthConfig()); // Endpoint: PATCH /api/jobs/:id/status
        return res.data;
    } catch (e) {
        handleError(e, `changeJobStatus(${jobId})`);
        throw e;
    }
};

/** [Protected] NTD xóa vĩnh viễn một Job. */
export const deleteJob = async (jobId) => {
    try {
        if (!jobId) throw new Error("Job ID is required for deletion.");
        console.log(`[API] Calling DELETE /api/jobs/${jobId}`);
        const res = await api.delete(`/api/jobs/${jobId}`, getAuthConfig()); // Endpoint: DELETE /api/jobs/:id
        return res.data; // Thường là { success: true, message: '...' }
    } catch (e) {
        handleError(e, `deleteJob(${jobId})`);
        throw e;
    }
};

// --- Quản lý Dashboard & Ứng viên ---

/** [Protected] Lấy thống kê cho NTD (Stats Card). */
export const getRecruiterStats = async () => {
    try {
        console.log("[API] Calling GET /api/user/recruiter/stats");
        const res = await api.get('/api/user/recruiter/stats', getAuthConfig());
        return res.data;
    } catch (e) { handleError(e, 'getRecruiterStats'); throw e; }
};

/** [Protected] Lấy danh sách jobs đã đăng của NTD (cho Bảng Quản lý). */
export const getRecruiterJobs = async () => {
    try {
        console.log("[API] Calling GET /api/user/recruiter/jobs");
        const res = await api.get('/api/user/recruiter/jobs', getAuthConfig());
        return res.data;
    } catch (e) { handleError(e, 'getRecruiterJobs'); throw e; }
};

/** [Protected] Lấy danh sách ứng viên cho một job cụ thể của NTD (cho Modal). */
export const getApplicantsForJob = async (jobId) => {
    try {
        if (!jobId) throw new Error("Job ID is required to fetch applicants.");
        console.log(`[API] Calling GET /api/user/jobs/${jobId}/applicants`);
        const res = await api.get(`/api/user/jobs/${jobId}/applicants`, getAuthConfig());
        return res.data; // Mảng applicants [{ id, appliedAt, status, student: {...} }]
    } catch (e) { handleError(e, `getApplicantsForJob(${jobId})`); throw e; }
};

/** [Protected] NTD tìm kiếm sinh viên theo kỹ năng. */
export const searchStudents = async (criteria) => {
    try {
        if (!criteria || !Array.isArray(criteria) || criteria.length === 0) {
            throw new Error("Search criteria (skills array) are required.");
        }
        console.log("[API] Calling POST /api/user/recruiter/search", { skills: criteria });
        const res = await api.post('/api/user/recruiter/search', { skills: criteria }, getAuthConfig());
        return res.data; // Mảng student objects
    } catch (e) { handleError(e, 'searchStudents'); throw e; }
};

// --- *** HÀM MỚI BỊ THIẾU *** ---
/**
 * [Protected] NTD cập nhật trạng thái của một đơn ứng tuyển (VD: Reviewed, Rejected).
 * @param {number|string} applicationId - ID của đơn ứng tuyển (từ JobApplications).
 * @param {string} newStatus - Trạng thái mới (VD: 'Reviewed', 'Interviewing').
 * @param {string} [notes] - (Tùy chọn) Ghi chú của NTD.
 */
export const updateApplicationStatus = async (applicationId, newStatus, notes = null) => {
    try {
        if (!applicationId) throw new Error("Application ID is required.");
        if (!newStatus) throw new Error("New status is required.");
        console.log(`[API] Calling PATCH /api/applications/${applicationId}/status`);
        const payload = { newStatus, notes };
        // Endpoint này nằm dưới /api/applications (đã bảo vệ bằng token)
        const res = await api.patch(`/api/applications/${applicationId}/status`, payload, getAuthConfig());
        return res.data; // Trả về application đã cập nhật
    } catch (e) {
        handleError(e, `updateApplicationStatus(${applicationId})`);
        throw e;
    }
};

// --- Quản lý Công ty (Cho NTD) ---

/** [Protected] NTD lấy hồ sơ công ty của mình (để chỉnh sửa). */
export const getMyCompanyProfile = async () => {
    try {
        console.log("[API] Calling GET /api/company-management");
        const res = await api.get('/api/company-management', getAuthConfig());
        return res.data;
    } catch (e) { handleError(e, 'getMyCompanyProfile'); throw e; }
};

/** [Protected] NTD cập nhật hồ sơ công ty của mình. */
export const updateMyCompanyProfile = async (companyData) => {
    try {
        console.log("[API] Calling PUT /api/company-management");
        const res = await api.put('/api/company-management', companyData, getAuthConfig());
        return res.data;
    } catch (e) { handleError(e, 'updateMyCompanyProfile'); throw e; }
};

// ==========================================================
// === XÁC NHẬN FILE ĐÃ LOAD ===
// ==========================================================
console.log("✅✅✅ client/services/api.js (Tối Thượng Master v2.2 - Full CRUD & App Status) loaded.");