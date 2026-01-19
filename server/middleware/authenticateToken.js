// File: server/middleware/authenticateToken.js
// PHIÊN BẢN TỐI THƯỢNG v2.0 - Phân Quyền "Bất khả xâm phạm"
// File này cung cấp bộ middleware xác thực và phân quyền chi tiết, đẳng cấp
// cho mọi API endpoint.

const jwt = require('jsonwebtoken');
const { sendErrorResponse } = require('../utils/helpers'); // Import helper response "đẳng cấp"

/**
 * Middleware Xác thực Token (Hàm lõi)
 * Xác thực JWT token từ header 'Authorization'.
 * Nếu hợp lệ, giải mã payload và gắn vào req.user.
 */
const authenticateToken = (req, res, next) => {
    const functionName = "authenticateToken";
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Lấy token từ "Bearer TOKEN"

    // 1. Kiểm tra Token có tồn tại không
    if (token == null) {
        console.warn(`[${functionName}] Failed: No token provided.`);
        // 401 Unauthorized - Yêu cầu xác thực
        return sendErrorResponse(res, 401, 'Unauthorized: Yêu cầu cần token xác thực.');
    }

    // 2. Xác thực Token
    jwt.verify(token, process.env.JWT_SECRET, (err, userPayload) => {
        if (err) {
            console.warn(`[${functionName}] Failed: Token is not valid. Error: ${err.message}`);
            // 403 Forbidden - Token không hợp lệ hoặc hết hạn
            return sendErrorResponse(res, 403, 'Forbidden: Token không hợp lệ hoặc đã hết hạn.');
        }

        // 3. Token hợp lệ! Gắn payload (chứa userId, role, v.v.) vào req
        req.user = userPayload;

        // Log chi tiết (có thể tắt ở production)
        // console.log(`[${functionName}] Token verified. User attached:`, req.user);

        next(); // Chuyển giao cho middleware/controller tiếp theo
    });
};

/**
 * Middleware "Cổng gác" chỉ dành cho Sinh viên (studentOnly)
 * Phải được dùng SAU authenticateToken.
 */
const studentOnly = (req, res, next) => {
    if (req.user && req.user.role === 'student') {
        next(); // Là sinh viên, cho qua
    } else {
        console.warn(`[studentOnly] Forbidden attempt by user ID ${req.user?.userId} with role ${req.user?.role}`);
        return sendErrorResponse(res, 403, 'Forbidden: Bạn không có quyền truy cập chức năng này (Yêu cầu quyền Sinh viên).');
    }
};

/**
 * Middleware "Cổng gác" chỉ dành cho Nhà tuyển dụng (recruiterOnly)
 * Phải được dùng SAU authenticateToken.
 */
const recruiterOnly = (req, res, next) => {
    if (req.user && req.user.role === 'recruiter') {
        next(); // Là nhà tuyển dụng, cho qua
    } else {
        console.warn(`[recruiterOnly] Forbidden attempt by user ID ${req.user?.userId} with role ${req.user?.role}`);
        return sendErrorResponse(res, 403, 'Forbidden: Bạn không có quyền truy cập chức năng này (Yêu cầu quyền Nhà tuyển dụng).');
    }
};

/**
 * Middleware "Cổng gác" chỉ dành cho Quản trị viên (adminOnly)
 * Phải được dùng SAU authenticateToken. (Dùng cho Giai đoạn X)
 */
const adminOnly = (req, res, next) => {
     if (req.user && req.user.role === 'admin') {
         next(); // Là admin, cho qua
     } else {
         console.warn(`[adminOnly] Forbidden attempt by user ID ${req.user?.userId} with role ${req.user?.role}`);
         return sendErrorResponse(res, 403, 'Forbidden: Bạn không có quyền truy cập chức năng này (Yêu cầu quyền Quản trị viên).');
     }
};


// Xuất tất cả các middleware để sử dụng
module.exports = {
    authenticateToken,
    studentOnly,
    recruiterOnly,
    adminOnly
};