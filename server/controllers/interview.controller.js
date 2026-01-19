// File: server/controllers/interview.controller.js
// PHIÊN BẢN v3.1 - "BỘ NÃO" ĐIỀU KHIỂN (Tương thích với Đại lộ Tách biệt)

const interviewService = require('../services/interview.service.js');
const { sendErrorResponse, sendSuccessResponse, logError } = require('../utils/helpers.js');

// ==========================================================
// === API CHO NHÀ TUYỂN DỤNG (RECRUITER) ===
// ==========================================================

/**
 * [CONTROLLER] Tạo Mẫu Phỏng vấn từ AI
 * POST /api/interviews/recruiter/templates
 * Body: { jobId, title, focusSkills, questionCount, difficulty }
 */
exports.createTemplate = async (req, res) => {
    const functionName = 'InterviewController.createTemplate';
    const recruiterId = req.user?.userId;
    const { jobId, title, focusSkills, questionCount, difficulty } = req.body;

    try {
        // 1. Validation "Toàn diện"
        if (!jobId || !title || !questionCount || !difficulty) {
            return sendErrorResponse(res, 400, 'jobId, title, questionCount, và difficulty là bắt buộc.', functionName);
        }
        const jobIdInt = parseInt(jobId);
        const questionCountInt = parseInt(questionCount);
        if (isNaN(jobIdInt) || isNaN(questionCountInt) || questionCountInt < 3 || questionCountInt > 20) {
            return sendErrorResponse(res, 400, 'jobId phải là số nguyên và questionCount phải là số nguyên từ 3 đến 20.', functionName);
        }

        // 2. Gọi "Trái tim" Service
        const newTemplate = await interviewService.createInterviewTemplate(
            recruiterId,
            jobIdInt,
            title,
            focusSkills,
            questionCountInt,
            difficulty
        );

        // 3. Trả về "Đẳng cấp"
        sendSuccessResponse(res, 201, newTemplate, 'Tạo mẫu phỏng vấn AI thành công.');
    
    } catch (error) {
        // Lỗi 4xx (AI, Quyền, Input)
        if (error.message.includes('không có quyền') || error.message.includes('Không tìm thấy')) {
            return sendErrorResponse(res, 403, error.message, functionName, error, req.body);
        }
        if (error.message.includes('AI') || error.message.includes('JSON')) {
            return sendErrorResponse(res, 503, error.message, functionName, error, req.body); // 503 Service Unavailable
        }
        // Lỗi 500
        sendErrorResponse(res, 500, error.message || 'Lỗi máy chủ khi tạo mẫu phỏng vấn.', functionName, error, req.body);
    }
};

/**
 * [CONTROLLER] Lấy danh sách Mẫu Phỏng vấn
 * GET /api/interviews/recruiter/templates
 */
exports.getTemplates = async (req, res) => {
    const functionName = 'InterviewController.getTemplates';
    const recruiterId = req.user?.userId;
    try {
        const templates = await interviewService.getInterviewTemplates(recruiterId);
        sendSuccessResponse(res, 200, templates);
    } catch (error) {
        sendErrorResponse(res, 500, error.message, functionName, error, { recruiterId });
    }
};

/**
 * [CONTROLLER] Gửi Lời mời Phỏng vấn
 * POST /api/interviews/recruiter/send
 * Body: { applicationId, templateId, message }
 */
exports.sendInvite = async (req, res) => {
    const functionName = 'InterviewController.sendInvite';
    const recruiterId = req.user?.userId;
    const { applicationId, templateId, message } = req.body;

    try {
        if (!applicationId || !templateId) {
            return sendErrorResponse(res, 400, 'applicationId và templateId là bắt buộc.', functionName);
        }
        const appIdInt = parseInt(applicationId);
        const templateIdInt = parseInt(templateId);
        if (isNaN(appIdInt) || isNaN(templateIdInt)) {
             return sendErrorResponse(res, 400, 'applicationId và templateId phải là số nguyên.', functionName);
        }
        
        const newInterview = await interviewService.sendInterviewInvite(
            recruiterId,
            appIdInt,
            templateIdInt,
            message
        );
        sendSuccessResponse(res, 201, newInterview, 'Gửi lời mời phỏng vấn thành công.');
    
    } catch (error) {
        // Lỗi nghiệp vụ (đã gửi, sai status, không có quyền)
        if (error.message.includes('không có quyền') || error.message.includes('Không tìm thấy') || error.message.includes('Trạng thái') || error.message.includes('đã gửi')) {
            return sendErrorResponse(res, 409, error.message, functionName, error, req.body); // 409 Conflict (hoặc 403)
        }
        sendErrorResponse(res, 500, error.message, functionName, error, req.body);
    }
};

/**
 * [CONTROLLER] Lấy danh sách Kết quả (Đã nộp/Đã chấm)
 * GET /api/interviews/recruiter/results
 */
exports.getResults = async (req, res) => {
    const functionName = 'InterviewController.getResults';
    const recruiterId = req.user?.userId;
    try {
        const results = await interviewService.getInterviewResults(recruiterId);
        sendSuccessResponse(res, 200, results);
    } catch (error) {
        sendErrorResponse(res, 500, error.message, functionName, error, { recruiterId });
    }
};

/**
 * [CONTROLLER] Yêu cầu AI chấm bài
 * POST /api/interviews/recruiter/results/:id/grade
 * (Bất đồng bộ - Trả về 202 Accepted)
 */
exports.gradeInterview = async (req, res) => {
    const functionName = 'InterviewController.gradeInterview';
    const recruiterId = req.user?.userId;
    const { id } = req.params; // id này là studentInterviewId

    try {
        const studentInterviewId = parseInt(id);
        if (isNaN(studentInterviewId)) {
            return sendErrorResponse(res, 400, 'ID bài phỏng vấn không hợp lệ.', functionName);
        }

        const result = await interviewService.gradeInterviewAI(recruiterId, studentInterviewId);
        
        // Trả về 202 Accepted - Yêu cầu đã được chấp nhận và đang xử lý ngầm
        sendSuccessResponse(res, 202, result, result.message);

    } catch (error) {
        // Lỗi 4xx (không có quyền, sai status)
        if (error.message.includes('không có quyền') || error.message.includes('Không tìm thấy') || error.message.includes('trạng thái')) {
            return sendErrorResponse(res, 403, error.message, functionName, error, { studentInterviewId: id });
        }
        sendErrorResponse(res, 500, error.message, functionName, error, { studentInterviewId: id });
    }
};

/**
 * [CONTROLLER] Lấy Chi tiết Kết quả (Side-by-side)
 * GET /api/interviews/recruiter/results/:id
 */
exports.getResultDetail = async (req, res) => {
    const functionName = 'InterviewController.getResultDetail';
    const recruiterId = req.user?.userId;
    const { id } = req.params; // id này là studentInterviewId

    try {
        const studentInterviewId = parseInt(id);
        if (isNaN(studentInterviewId)) {
            return sendErrorResponse(res, 400, 'ID bài phỏng vấn không hợp lệ.', functionName);
        }

        const detailData = await interviewService.getInterviewResultDetail(recruiterId, studentInterviewId);
        sendSuccessResponse(res, 200, detailData);
    
    } catch (error) {
        if (error.message.includes('không có quyền') || error.message.includes('Không tìm thấy')) {
            return sendErrorResponse(res, 403, error.message, functionName, error, { studentInterviewId: id });
        }
        sendErrorResponse(res, 500, error.message, functionName, error, { studentInterviewId: id });
    }
};

// ==========================================================
// === API CHO SINH VIÊN (STUDENT) ===
// ==========================================================

/**
 * [CONTROLLER] Bắt đầu làm bài
 * GET /api/interviews/student/start/:id
 */
exports.startInterview = async (req, res) => {
    const functionName = 'InterviewController.startInterview';
    const studentId = req.user?.userId;
    const { id } = req.params; // id này là studentInterviewId
    
    try {
        const studentInterviewId = parseInt(id);
        if (isNaN(studentInterviewId)) {
            return sendErrorResponse(res, 400, 'ID bài phỏng vấn không hợp lệ.', functionName);
        }
        
        const interviewData = await interviewService.startInterview(studentId, studentInterviewId);
        sendSuccessResponse(res, 200, interviewData, 'Bắt đầu bài phỏng vấn thành công.');
    
    } catch (error) {
        if (error.message.includes('không có quyền') || error.message.includes('Không tìm thấy') || error.message.includes('đã nộp')) {
            return sendErrorResponse(res, 403, error.message, functionName, error, { studentInterviewId: id });
        }
        sendErrorResponse(res, 500, error.message, functionName, error, { studentInterviewId: id });
    }
};

/**
 * [CONTROLLER] Nộp bài
 * POST /api/interviews/student/submit/:id
 * Body: { answers: [{ questionId, answerText }] }
 */
exports.submitInterview = async (req, res) => {
    const functionName = 'InterviewController.submitInterview';
    const studentId = req.user?.userId;
    const { id } = req.params; // id này là studentInterviewId
    const { answers } = req.body;
    
    try {
        const studentInterviewId = parseInt(id);
        if (isNaN(studentInterviewId)) {
            return sendErrorResponse(res, 400, 'ID bài phỏng vấn không hợp lệ.', functionName);
        }
        if (!Array.isArray(answers)) {
            return sendErrorResponse(res, 400, 'Dữ liệu "answers" phải là một mảng.', functionName);
        }

        const submissionResult = await interviewService.submitInterview(studentId, studentInterviewId, answers);
        sendSuccessResponse(res, 200, submissionResult, 'Nộp bài thành công!');

    } catch (error) {
        if (error.message.includes('không có quyền') || error.message.includes('Không tìm thấy') || error.message.includes('đã nộp') || error.message.includes('chưa bắt đầu')) {
            return sendErrorResponse(res, 403, error.message, functionName, error, { studentInterviewId: id });
        }
        sendErrorResponse(res, 500, error.message, functionName, error, { studentInterviewId: id });
    }
};