const jobsService = require('../services/jobs.service.js'); // Import service

/** Gửi phản hồi lỗi chuẩn hóa */
const sendErrorResponse = (res, statusCode, message, logFunctionName, originalError, logContext = {}) => {
    // (Copy hàm sendErrorResponse từ api.controller.js hoặc tạo helper chung)
    console.error(`❌ Error in ${logFunctionName || 'jobs.controller'}:`, originalError?.message || message, logContext);
    if (!res.headersSent) {
        res.status(statusCode).json({ message });
    }
};

// --- GET (Đã có) ---
/** Lấy danh sách jobs công khai (có filter, pagination) */
const getAllJobs = async (req, res) => {
    try {
        const { page = 1, limit = 10, sortBy = 'createdAt_desc', ...filters } = req.query; // Tách sortBy khỏi filters
        // Xóa các filter rỗng hoặc không hợp lệ nếu cần
        const validFilters = {};
        for (const key in filters) {
            if (filters[key] !== undefined && filters[key] !== '') {
                // Xử lý jobTypes là mảng
                if (key === 'jobTypes' && typeof filters[key] === 'string') {
                    validFilters[key] = filters[key].split(',').map(t => t.trim()).filter(Boolean);
                } else {
                    validFilters[key] = filters[key];
                }
            }
        }
        const result = await jobsService.findAllJobs(page, limit, validFilters, sortBy);
        res.status(200).json(result);
    } catch (error) {
        sendErrorResponse(res, 500, 'Lỗi máy chủ khi lấy danh sách việc làm', 'getAllJobs', error, req.query);
    }
};

/** Lấy chi tiết job theo ID */
const getJobById = async (req, res) => {
    try {
        const { id } = req.params;
        const jobId = parseInt(id, 10);
        if (isNaN(jobId)) return sendErrorResponse(res, 400, 'Job ID không hợp lệ.');
        const job = await jobsService.findJobById(jobId);
        res.status(200).json(job); // Service đã xử lý lỗi 404
    } catch (error) {
        const statusCode = error.message.includes('Không tìm thấy') ? 404 : 500;
        sendErrorResponse(res, statusCode, error.message, 'getJobById', error, req.params);
    }
};

// --- POST (Đã có) ---
/** Tạo job mới */
const createJob = async (req, res) => {
    const recruiterId = req.user?.userId;
    const jobData = req.body;
    const role = req.user?.role;

    if (role !== 'recruiter') return sendErrorResponse(res, 403, 'Chỉ có nhà tuyển dụng mới được đăng tin.');
    if (!recruiterId) return sendErrorResponse(res, 401, 'Xác thực không hợp lệ.');

    try {
        const newJob = await jobsService.createJob(recruiterId, jobData);
        res.status(201).json(newJob); // 201 Created
    } catch (error) {
         // Phân loại lỗi từ service
        if (error.message.includes('Dữ liệu không hợp lệ') || error.message.includes('Tài khoản nhà tuyển dụng') || error.message.includes('Trạng thái job không hợp lệ')) {
            sendErrorResponse(res, 400, error.message, 'createJob', error, { recruiterId });
        } else {
            sendErrorResponse(res, 500, error.message || 'Lỗi máy chủ khi tạo tin tuyển dụng', 'createJob', error, { recruiterId });
        }
    }
};
const applyToJob = async (req, res) => {
    try {
        const { jobId } = req.params;
        const studentId = req.user.userId;
        const { role } = req.user;
        const { coverLetter } = req.body;
        if (role !== 'student') {
            return res.status(403).json({ message: 'Chỉ sinh viên mới có thể ứng tuyển.' });
        }
        const result = await jobsService.createApplication({
            jobId: parseInt(jobId, 10),
            studentId,
            coverLetter
        });
        res.status(201).json(result);
    } catch (error) {
        console.error('Error in applyToJob controller:', error.message);
        if (error.message.includes('đã ứng tuyển')) {
            return res.status(409).json({ message: error.message }); // 409 Conflict
        }
        res.status(500).json({ message: 'Lỗi máy chủ khi nộp đơn ứng tuyển.' });
    }
};
// --- *** CÁC HÀM CRUD MỚI *** ---

/**
 * @route PUT /api/jobs/:id
 * @description Cập nhật thông tin chi tiết của một Job (chỉ chủ sở hữu).
 * @access Private (Recruiter owner only)
 */
const updateJob = async (req, res) => {
    const { id } = req.params;
    const jobData = req.body; // Dữ liệu cần cập nhật
    const recruiterId = req.user?.userId;
    const role = req.user?.role;

    const jobId = parseInt(id, 10);
    if (isNaN(jobId)) return sendErrorResponse(res, 400, 'Job ID không hợp lệ.');
    if (role !== 'recruiter') return sendErrorResponse(res, 403, 'Chỉ nhà tuyển dụng mới được sửa tin.');
    if (!recruiterId) return sendErrorResponse(res, 401, 'Xác thực không hợp lệ.');
    if (!jobData || Object.keys(jobData).length === 0) return sendErrorResponse(res, 400, 'Không có dữ liệu để cập nhật.');

    try {
        const updatedJob = await jobsService.updateJob(jobId, recruiterId, jobData);
        res.status(200).json(updatedJob); // Trả về job đã cập nhật
    } catch (error) {
        const statusCode = error.message.includes('không có quyền') ? 403 : (error.message.includes('Không tìm thấy') ? 404 : (error.message.includes('không hợp lệ') ? 400 : 500));
        sendErrorResponse(res, statusCode, error.message, 'updateJob', error, { jobId, recruiterId });
    }
};

/**
 * @route PATCH /api/jobs/:id/status
 * @description Thay đổi trạng thái của một Job (Ẩn/Hiện/Hết hạn) (chỉ chủ sở hữu).
 * @access Private (Recruiter owner only)
 * @body {string} newStatus - Trạng thái mới ('Active', 'Inactive', 'Expired').
 */
const changeJobStatus = async (req, res) => {
    const { id } = req.params;
    const { newStatus } = req.body;
    const recruiterId = req.user?.userId;
    const role = req.user?.role;

    const jobId = parseInt(id, 10);
    if (isNaN(jobId)) return sendErrorResponse(res, 400, 'Job ID không hợp lệ.');
    if (role !== 'recruiter') return sendErrorResponse(res, 403, 'Chỉ nhà tuyển dụng mới được đổi trạng thái tin.');
    if (!recruiterId) return sendErrorResponse(res, 401, 'Xác thực không hợp lệ.');
    if (!newStatus) return sendErrorResponse(res, 400, 'Trạng thái mới (newStatus) là bắt buộc.');

    try {
        const updatedJob = await jobsService.changeJobStatus(jobId, recruiterId, newStatus);
        res.status(200).json(updatedJob);
    } catch (error) {
        const statusCode = error.message.includes('không có quyền') ? 403 : (error.message.includes('Không tìm thấy') ? 404 : (error.message.includes('không hợp lệ') ? 400 : 500));
        sendErrorResponse(res, statusCode, error.message, 'changeJobStatus', error, { jobId, recruiterId, newStatus });
    }
};

/**
 * @route DELETE /api/jobs/:id
 * @description Xóa vĩnh viễn một Job (chỉ chủ sở hữu).
 * @access Private (Recruiter owner only)
 */
const deleteJob = async (req, res) => {
    const { id } = req.params;
    const recruiterId = req.user?.userId;
    const role = req.user?.role;

    const jobId = parseInt(id, 10);
    if (isNaN(jobId)) return sendErrorResponse(res, 400, 'Job ID không hợp lệ.');
    if (role !== 'recruiter') return sendErrorResponse(res, 403, 'Chỉ nhà tuyển dụng mới được xóa tin.');
    if (!recruiterId) return sendErrorResponse(res, 401, 'Xác thực không hợp lệ.');

    try {
        const result = await jobsService.deleteJob(jobId, recruiterId);
        res.status(200).json(result); // Thường là { success: true, message: '...' }
    } catch (error) {
        const statusCode = error.message.includes('không có quyền') ? 403 : (error.message.includes('Không tìm thấy') ? 404 : 500);
        sendErrorResponse(res, statusCode, error.message, 'deleteJob', error, { jobId, recruiterId });
    }
};


// --- Xuất các hàm controller ---
module.exports = {
    getAllJobs,
    getJobById,
    createJob,
    applyToJob,
    updateJob,        // Export hàm mới
    changeJobStatus,  // Export hàm mới
    deleteJob,        // Export hàm mới
};

console.log("✅ jobs.controller.js (Tối Thượng - CRUD v1.0) loaded.");