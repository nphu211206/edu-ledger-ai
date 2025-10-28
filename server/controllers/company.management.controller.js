// File: server/controllers/company.management.controller.js
const companyService = require('../services/company.service');
const { sql, poolPromise } = require('../config/db'); // Cần để lấy companyId từ user

/**
 * Gửi phản hồi lỗi chuẩn hóa (copy từ api.controller cho tiện)
 */
const sendErrorResponse = (res, statusCode, message, logFunctionName, originalError, logContext = {}) => {
    // (logic logError và res.status().json() như trong api.controller)
     console.error(`❌ Error in ${logFunctionName}:`, originalError?.message || message, logContext);
    res.status(statusCode).json({ message });
};


/**
 * @route GET /api/company-management/
 * @description Lấy thông tin công ty của nhà tuyển dụng đang đăng nhập.
 * @access Private (Recruiters only)
 */
exports.getMyCompanyProfile = async (req, res) => {
    const { userId, role } = req.user;

    if (role !== 'recruiter') {
        return sendErrorResponse(res, 403, 'Chức năng này chỉ dành cho Nhà tuyển dụng.');
    }

    try {
        // 1. Lấy companyId từ thông tin user
        const pool = await poolPromise;
        const userResult = await pool.request()
            .input('userId', sql.Int, userId)
            .query('SELECT companyId FROM Users WHERE id = @userId');

        const companyId = userResult.recordset[0]?.companyId;
        if (!companyId) {
            return sendErrorResponse(res, 404, 'Tài khoản của bạn chưa được liên kết với công ty nào.');
        }

        // 2. Gọi service để lấy thông tin công ty
        const companyProfile = await companyService.findCompanyById(companyId);
        if (!companyProfile) {
             // Lỗi này không nên xảy ra nếu dữ liệu nhất quán
            return sendErrorResponse(res, 404, 'Không tìm thấy thông tin công ty được liên kết.');
        }

        res.status(200).json(companyProfile);

    } catch (error) {
        sendErrorResponse(res, 500, 'Lỗi máy chủ khi lấy hồ sơ công ty.', 'getMyCompanyProfile', error, { userId });
    }
};

/**
 * @route PUT /api/company-management/
 * @description Cập nhật thông tin công ty của nhà tuyển dụng đang đăng nhập.
 * @access Private (Recruiters only)
 * @body {object} companyData - Dữ liệu cần cập nhật (name, tagline, description, logoUrl, etc.)
 */
exports.updateMyCompanyProfile = async (req, res) => {
    const { userId, role } = req.user;
    const companyData = req.body;

    if (role !== 'recruiter') {
        return sendErrorResponse(res, 403, 'Chức năng này chỉ dành cho Nhà tuyển dụng.');
    }
    if (!companyData || Object.keys(companyData).length === 0) {
        return sendErrorResponse(res, 400, 'Không có dữ liệu để cập nhật.');
    }


    try {
        // 1. Lấy companyId từ thông tin user (tương tự như getMyCompanyProfile)
        const pool = await poolPromise;
        const userResult = await pool.request()
            .input('userId', sql.Int, userId)
            .query('SELECT companyId FROM Users WHERE id = @userId');

        const companyId = userResult.recordset[0]?.companyId;
        if (!companyId) {
            return sendErrorResponse(res, 404, 'Tài khoản của bạn chưa được liên kết với công ty nào để cập nhật.');
        }

        // 2. Gọi service để cập nhật thông tin công ty
        const updatedCompany = await companyService.updateCompany(companyId, companyData);

        res.status(200).json(updatedCompany);

    } catch (error) {
         // Xử lý lỗi cụ thể từ service (ví dụ: slug bị trùng)
         if (error.message.includes('đã tồn tại')) {
             sendErrorResponse(res, 409, error.message, 'updateMyCompanyProfile', error, { userId });
         } else if (error.message.includes('Không có dữ liệu')) {
             sendErrorResponse(res, 400, error.message, 'updateMyCompanyProfile', error, { userId });
         } else {
             sendErrorResponse(res, 500, 'Lỗi máy chủ khi cập nhật hồ sơ công ty.', 'updateMyCompanyProfile', error, { userId });
         }
    }
};