// File: server/services/applications.service.js
const { sql, poolPromise } = require('../config/db.js');
const { checkJobOwnership } = require('./jobs.service'); // Import hàm kiểm tra quyền từ jobsService
const VALID_APPLICATION_STATUSES = ['Pending', 'Reviewed', 'Interviewing', 'Offered', 'Rejected', 'Hired', 'Withdrawn'];
/** Log lỗi */
const logDbError = (functionName, error, context = {}) => { /* ... */ };

/**
 * Cập nhật trạng thái của một đơn ứng tuyển.
 * @param {number} applicationId - ID của đơn ứng tuyển.
 * @param {number} recruiterId - ID của NTD thực hiện thay đổi.
 * @param {string} newStatus - Trạng thái mới.
 * @param {string} [notes] - Ghi chú của NTD (tùy chọn).
 * @returns {Promise<object>} Đơn ứng tuyển đã được cập nhật.
 */
const updateApplicationStatus = async (applicationId, recruiterId, newStatus, notes = null) => {
    console.log(`[updateAppStatus] Attempting update for AppID: ${applicationId}, RecruiterID: ${recruiterId}, NewStatus: ${newStatus}`);
    if (!applicationId || isNaN(applicationId) || !recruiterId || isNaN(recruiterId)) {
        throw new Error('Application ID và Recruiter ID không hợp lệ.');
    }
    if (!newStatus || !VALID_APPLICATION_STATUSES.includes(newStatus)) {
        throw new Error(`Trạng thái mới không hợp lệ. Chỉ chấp nhận: ${VALID_APPLICATION_STATUSES.join(', ')}`);
    }

    const pool = await poolPromise;
    const transaction = new sql.Transaction(pool);
    try {
        await transaction.begin();
        const request = new sql.Request(transaction);

        // 1. Lấy thông tin application và jobId liên quan
        const appResult = await request
            .input('applicationId', sql.Int, applicationId)
            .query('SELECT jobId, studentId, status FROM JobApplications WHERE id = @applicationId');

        if (appResult.recordset.length === 0) {
            throw new Error('Không tìm thấy đơn ứng tuyển.');
        }
        const { jobId, studentId, status: currentStatus } = appResult.recordset[0];

        // 2. Kiểm tra xem NTD có quyền sở hữu Job của application này không
        // Tái sử dụng checkJobOwnership từ jobs.service.js
        const isOwner = await checkJobOwnership(jobId, recruiterId, transaction);
        if (!isOwner) {
            throw new Error('Bạn không có quyền thay đổi trạng thái cho đơn ứng tuyển này.');
        }

        // 3. Thực hiện cập nhật trạng thái (chỉ khi trạng thái mới khác trạng thái cũ)
        if (newStatus !== currentStatus) {
            const updateRequest = new sql.Request(transaction); // Request mới để tránh trùng input
            updateRequest.input('applicationId', sql.Int, applicationId);
            updateRequest.input('newStatus', sql.NVarChar(50), newStatus);
            updateRequest.input('changedByUserId', sql.Int, recruiterId);
            updateRequest.input('recruiterNotes', sql.NText, notes); // Cập nhật cả notes nếu có

            const updateResult = await updateRequest.query(`
                UPDATE JobApplications
                SET status = @newStatus,
                    statusChangedAt = GETUTCDATE(),
                    changedByUserId = @changedByUserId,
                    recruiterNotes = ISNULL(@recruiterNotes, recruiterNotes) -- Chỉ cập nhật notes nếu được cung cấp
                OUTPUT INSERTED.* -- Trả về application đã cập nhật
                WHERE id = @applicationId;
            `);

            if (updateResult.recordset.length === 0) {
                // Lỗi không mong muốn
                throw new Error('Cập nhật trạng thái thất bại.');
            }
            await transaction.commit();
            console.log(`[updateAppStatus] Status updated successfully for AppID: ${applicationId}`);
            // TODO: Trigger notification cho sinh viên (ở đây hoặc trong controller)
            return updateResult.recordset[0];
        } else {
            // Nếu trạng thái không đổi, không cần làm gì cả
            await transaction.rollback(); // Rollback vì không có thay đổi
            console.log(`[updateAppStatus] Status is already '${newStatus}' for AppID: ${applicationId}. No update performed.`);
            // Trả về application hiện tại
             return { ...appResult.recordset[0], id: applicationId }; // Bổ sung id
        }

    } catch (error) {
        if (transaction && transaction.active) await transaction.rollback();
        logDbError('updateApplicationStatus', error, { applicationId, recruiterId, newStatus });
        throw error; // Ném lại lỗi để controller xử lý
    }
};


module.exports = {
    updateApplicationStatus,
    // Thêm các hàm khác liên quan đến application sau này (VD: getApplicationById)
};

console.log("✅ applications.service.js (Tối Thượng v1.0) loaded.");