// File: server/controllers/applications.controller.js
const applicationsService = require('../services/applications.service');

/** Gửi phản hồi lỗi chuẩn hóa */
const sendErrorResponse = (res, statusCode, message) => {
    console.error(`Application Controller Error (${statusCode}): ${message}`);
    res.status(statusCode).json({ message });
};

/**
 * @route PATCH /api/applications/:applicationId/status
 * @description NTD cập nhật trạng thái đơn ứng tuyển.
 * @access Private (Recruiters only - job owner)
 * @param {string} req.params.applicationId
 * @body {string} newStatus - Trạng thái mới.
 * @body {string} [notes] - Ghi chú (tùy chọn).
 */
exports.updateApplicationStatus = async (req, res) => {
    const { applicationId } = req.params;
    const { newStatus, notes } = req.body;
    const recruiterId = req.user?.userId; // Lấy từ token

    if (!applicationId || isNaN(parseInt(applicationId))) {
        return sendErrorResponse(res, 400, 'Application ID không hợp lệ.');
    }
    if (!newStatus) {
        return sendErrorResponse(res, 400, 'Trạng thái mới (newStatus) là bắt buộc.');
    }

    try {
        const updatedApplication = await applicationsService.updateApplicationStatus(
            parseInt(applicationId),
            recruiterId,
            newStatus,
            notes
        );
        res.status(200).json(updatedApplication);
    } catch (error) {
        if (error.message.includes('không có quyền') || error.message.includes('not found')) {
            sendErrorResponse(res, 403, error.message); // Hoặc 404 tùy trường hợp
        } else if (error.message.includes('không hợp lệ')) {
             sendErrorResponse(res, 400, error.message);
        }
        else {
            sendErrorResponse(res, 500, error.message || 'Lỗi máy chủ khi cập nhật trạng thái.');
        }
    }
};

console.log("✅ applications.controller.js (Tối Thượng v1.0) loaded.");