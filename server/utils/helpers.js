// File: server/utils/helpers.js
// PHIÊN BẢN TỐI THƯỢNG - BỘ CÔNG CỤ HỖ TRỢ "BẤT BẠI" (v1.0 - Logging, Error Handling, Utilities)
// File này tập hợp các hàm tiện ích dùng chung siêu cấp vip pro cho toàn bộ backend,
// đảm bảo sự nhất quán, dễ bảo trì và khả năng mở rộng vô hạn.

// ==========================================================
// === BỘ CÔNG CỤ LOGGING SIÊU CHI TIẾT ===
// ==========================================================

/**
 * Ghi log lỗi chi tiết, toàn diện vào console với định dạng chuẩn hóa Đẳng cấp Master.
 * Bao gồm timestamp, tên hàm, loại lỗi, message, context dữ liệu (JSON), và stack trace.
 * Giúp debug nhanh như chớp, chính xác từng milimet.
 *
 * @param {string} functionName - Tên hàm controller/service nơi phát hiện lỗi (VD: 'UserService.createUser', 'AuthController.login'). Rõ ràng, dễ truy vết.
 * @param {Error} error - Đối tượng Error gốc bắt được trong khối catch. Phải là Error object để có stack trace.
 * @param {object} [context={}] - (Tùy chọn) Object chứa mọi thông tin ngữ cảnh quan trọng tại thời điểm xảy ra lỗi (VD: { userId, requestBody: req.body, params: req.params, query: req.query }). Càng chi tiết càng tốt.
 */
const logError = (functionName, error, context = {}) => {
    // Luôn hiển thị log lỗi, không phụ thuộc vào môi trường (có thể thêm kiểm tra process.env.NODE_ENV === 'development' nếu muốn chỉ log chi tiết ở dev)
    const timestamp = new Date().toISOString(); // Chuẩn ISO 8601 quốc tế

    console.error(`\n==================== ❌ MASTER ERROR LOG ❌ ====================`);
    console.error(`[Timestamp]: ${timestamp}`);
    console.error(`[Origin]:    Function -> ${functionName}`);
    console.error(`[ErrorType]: ${error.name || 'Unknown Error Type'}`);
    console.error(`[Message]:   ${error.message}`);

    // In Context Data một cách an toàn và đẹp mắt
    if (Object.keys(context).length > 0) {
        console.error(`[Context]:`);
        try {
            // Sử dụng JSON.stringify với replacer để xử lý BigInt và thụt lề
            const contextString = JSON.stringify(context, (key, value) =>
                typeof value === 'bigint' ? value.toString() + 'n' : value // Chuyển BigInt thành string
            , 2); // Thụt lề 2 spaces
            console.error(contextString);
        } catch (stringifyError) {
            console.error("  (Error serializing context):", stringifyError.message);
            console.error("  (Raw Context Object):", context); // In object gốc nếu không serialize được
        }
    } else {
        console.error(`[Context]:   (No additional context provided)`);
    }

    // In lỗi gốc từ CSDL (nếu có và là lỗi SQL)
    if (error.originalError && typeof error.originalError.info === 'object') { // Kiểm tra kỹ hơn
        console.error(`[DB Origin]:`);
        console.error(`  - Code:    ${error.originalError.info.number}`);
        console.error(`  - State:   ${error.originalError.info.state}`);
        console.error(`  - Class:   ${error.originalError.info.class}`);
        console.error(`  - Message: ${error.originalError.info.message}`);
        // console.error(`  - Server:  ${error.originalError.info.serverName}`); // (Tùy chọn)
        // console.error(`  - Proc:    ${error.originalError.info.procName}`);   // (Tùy chọn)
    }

    // In Stack Trace đầy đủ (quan trọng nhất để dò lỗi)
    if (error.stack) {
        console.error(`[Stack Trace]:`);
        console.error(error.stack);
    } else {
        console.error(`[Stack Trace]: (Not available)`);
    }

    console.error(`==================== END MASTER ERROR LOG ====================\n`);

    // Gợi ý Nâng cao (Tương lai):
    // - Tích hợp thư viện logging chuyên nghiệp (Winston, Pino) để ghi ra file, xoay vòng log.
    // - Gửi log lỗi đến các hệ thống giám sát tập trung (Sentry, Datadog, ELK) trong môi trường production.
    // - Phân loại mức độ lỗi (error, warn, info, debug).
};

// ==========================================================
// === BỘ CÔNG CỤ XỬ LÝ PHẢN HỒI API CHUẨN MỰC ===
// ==========================================================

/**
 * Gửi phản hồi lỗi JSON chuẩn mực, nhất quán về phía client.
 * Tự động ghi log lỗi chi tiết ở backend nếu được cung cấp thông tin.
 * Đảm bảo không gửi response 2 lần gây crash server.
 *
 * @param {import('express').Response} res - Đối tượng response của Express.
 * @param {number} statusCode - Mã trạng thái HTTP (400, 401, 403, 404, 500, etc.). Phải chuẩn theo ngữ nghĩa HTTP.
 * @param {string} clientMessage - Thông báo lỗi ngắn gọn, thân thiện, an toàn để hiển thị cho người dùng cuối. Không nên chứa thông tin nhạy cảm.
 * @param {string} [logFunctionName] - (Tùy chọn) Tên hàm gốc nơi lỗi được bắt (để logError).
 * @param {Error} [originalError] - (Tùy chọn) Đối tượng Error gốc (để logError).
 * @param {object} [logContext={}] - (Tùy chọn) Dữ liệu ngữ cảnh bổ sung (để logError).
 */
const sendErrorResponse = (res, statusCode, clientMessage, logFunctionName, originalError, logContext = {}) => {
    // Log lỗi chi tiết ở backend nếu có đủ thông tin
    if (logFunctionName && originalError) {
        logError(logFunctionName, originalError, logContext);
    } else if (originalError instanceof Error) { // Chỉ log nếu originalError là Error object thực sự
        logError(`Unknown Origin (Status ${statusCode})`, originalError, logContext);
    } else if (originalError) { // Trường hợp originalError không phải Error object (ví dụ: string)
         console.warn(`[API Response - ${statusCode}] Sending error to client: "${clientMessage}". Non-Error object logged:`, originalError, logContext);
    }
     else {
        // Log cảnh báo thông thường cho các lỗi không có Error gốc (VD: validation)
        console.warn(`[API Response - ${statusCode}] Sending known error to client: "${clientMessage}"`, logContext);
    }

    // Kiểm tra headersSent trước khi gửi để tránh crash
    if (res.headersSent) {
        console.error(`[CRITICAL] Cannot send error response (Status ${statusCode}: "${clientMessage}") because headers were already sent. Investigate the function: ${logFunctionName || '(unknown)'}.`);
        return; // Không làm gì thêm
    }

    // Gửi cấu trúc JSON lỗi chuẩn
    res.status(statusCode).json({
        success: false, // Luôn là false cho lỗi
        status: statusCode, // Bao gồm cả status code trong body
        message: clientMessage // Thông báo cho client
        // Có thể thêm error code riêng của ứng dụng nếu cần: errorCode: 'AUTH_INVALID_CREDENTIALS'
    });
};

/**
 * Gửi phản hồi thành công JSON chuẩn mực, nhất quán về phía client.
 *
 * @param {import('express').Response} res - Đối tượng response của Express.
 * @param {number} [statusCode=200] - Mã trạng thái HTTP thành công (Mặc định 200 OK, có thể là 201 Created, 204 No Content...).
 * @param {*} [data=null] - Dữ liệu chính cần gửi về client (object, array, string, number...). Null nếu không có dữ liệu trả về (VD: sau khi DELETE).
 * @param {string} [message] - (Tùy chọn) Thông báo thành công ngắn gọn (VD: "Tạo tài khoản thành công!").
 */
const sendSuccessResponse = (res, statusCode = 200, data = null, message) => {
    // Kiểm tra headersSent trước khi gửi
    if (res.headersSent) {
        console.error(`[CRITICAL] Cannot send success response (Status ${statusCode}) because headers were already sent.`);
        return; // Không làm gì thêm
    }

    // Xây dựng cấu trúc JSON thành công chuẩn
    const responseBody = {
        success: true, // Luôn là true cho thành công
        status: statusCode,
        // Chỉ thêm 'data' vào body nếu nó không phải là null hoặc undefined
        ...(data !== null && data !== undefined && { data: data }),
        // Chỉ thêm 'message' vào body nếu nó được cung cấp và không rỗng
        ...(message && typeof message === 'string' && message.trim() !== '' && { message: message.trim() })
    };

     // Xử lý trường hợp 204 No Content (không nên có body)
     if (statusCode === 204) {
          res.status(204).send(); // Gửi response trống
     } else {
          res.status(statusCode).json(responseBody);
     }
};


// ==========================================================
// === BỘ CÔNG CỤ TIỆN ÍCH KHÁC ===
// ==========================================================

/**
 * Hàm sleep tạo độ trễ "Đẳng cấp". Trả về Promise để dùng với async/await.
 * @param {number} ms - Thời gian chờ (miliseconds).
 * @returns {Promise<void>}
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));


// ==========================================================
// === XUẤT CÁC CÔNG CỤ ĐỂ SỬ DỤNG ===
// ==========================================================
module.exports = {
    logError,
    sendErrorResponse,
    sendSuccessResponse,
    sleep,
};

console.log("✅✅✅ utils/helpers.js (Bộ công cụ Bất bại v1.0) loaded.");