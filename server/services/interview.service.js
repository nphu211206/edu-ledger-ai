// File: server/services/interview.service.js
// PHIÊN BẢN v3.0 - "TRÁI TIM" CỦA HỆ SINH THÁI PHỎNG VẤN AI

const { sql, poolPromise } = require('../config/db.js');
const { logError } = require('../utils/helpers.js'); // Import "Bộ công cụ Bất bại"
const aiService = require('./ai.service.js'); // Import "Bộ não AI"
const { checkJobOwnership } = require('./jobs.service.js'); // Import "Kiểm tra Quyền"

// Định nghĩa các trạng thái "bất biến"
const InterviewStatus = {
    SENT: 'Sent',             // NTD đã gửi lời mời
    STARTED: 'Started',           // SV đã bấm bắt đầu làm bài
    SUBMITTED: 'Submitted',       // SV đã nộp bài, chờ chấm
    GRADING: 'Grading',           // AI đang chấm bài (chạy ngầm)
    GRADED: 'Graded'              // AI đã chấm xong
};

const AppStatus = {
    INTERVIEW_SENT: 'Interview_Sent' // Status mới cho JobApplications
};

/**
 * [SERVICE - NTD] Tạo một Mẫu Phỏng vấn Mới (Tự động bằng AI).
 * "Bùng nổ": AI tự đọc Job Description để tạo câu hỏi.
 * @param {number} recruiterId - ID của NTD tạo mẫu.
 * @param {number} jobId - ID của Job (tin tuyển dụng) để AI phân tích.
 * @param {string} title - Tên NTD đặt cho mẫu (VD: "Test React Junior").
 * @param {string} focusSkills - Kỹ năng NTD muốn tập trung (VD: "React Hooks, Redux").
 * @param {number} questionCount - Số lượng câu hỏi.
 * @param {string} difficulty - Độ khó (VD: "Junior").
 * @returns {Promise<object>} - Object Mẫu phỏng vấn (template) đã được tạo (bao gồm câu hỏi).
 */
const createInterviewTemplate = async (recruiterId, jobId, title, focusSkills, questionCount, difficulty) => {
    const functionName = 'InterviewService.createInterviewTemplate';
    console.log(`[${functionName}] Attempting to create template for Job ID: ${jobId} by Recruiter ID: ${recruiterId}`);

    if (!aiService.isAiReady) {
        throw new Error("Dịch vụ AI hiện không sẵn sàng, không thể tạo câu hỏi. Vui lòng kiểm tra cấu hình.");
    }

    const pool = await poolPromise;
    let jobDescription = "Một vị trí tuyển dụng chung."; // Mặc định
    let jobTitle = title; // Dùng title của template nếu không có job

    try {
        // 1. Lấy thông tin Job Description từ CSDL VÀ KIỂM TRA QUYỀN
        // Dùng pool.request() vì đây là thao tác đọc, chưa cần transaction
        const jobResult = await pool.request()
            .input('jobId_check', sql.Int, jobId)
            .input('recruiterId_check', sql.Int, recruiterId)
            .query('SELECT title, description FROM Jobs WHERE id = @jobId_check AND recruiterId = @recruiterId_check');
        
        if (jobResult.recordset.length === 0) {
            logError(functionName, new Error("Job not found or recruiter does not own this job."), { recruiterId, jobId });
            throw new Error("Không tìm thấy tin tuyển dụng hoặc bạn không có quyền sở hữu tin này.");
        }
        
        jobDescription = jobResult.recordset[0].description;
        jobTitle = jobResult.recordset[0].title; // Lấy title thật từ job

        // 2. Gọi "Bộ não AI" (ai.service) để tạo bộ câu hỏi "đẳng cấp"
        console.log(`[${functionName}] Calling AI to generate ${questionCount} questions for: ${jobTitle}`);
        const aiResult = await aiService.generateInterviewQuestions(
            jobTitle,
            jobDescription,
            focusSkills ? focusSkills.split(',').map(s => s.trim()) : [], // Chuyển string "a, b" thành mảng ["a", "b"]
            questionCount,
            difficulty
        );
        // aiResult có dạng: { timeLimitMinutes, questions: [{questionText, idealAnswer, questionType}] }

        console.log(`[${functionName}] AI generated ${aiResult.questions.length} questions. Saving to DB...`);

        // 3. Bắt đầu Transaction "Bất tử" để lưu Template và Câu hỏi
        const transaction = new sql.Transaction(pool);
        await transaction.begin();
        try {
            // 3.1. Lưu vào InterviewTemplates
            const templateRequest = new sql.Request(transaction);
            templateRequest.input('recruiterId', sql.Int, recruiterId);
            templateRequest.input('title', sql.NVarChar(255), title); // Dùng title NTD nhập
            templateRequest.input('jobId', sql.Int, jobId);
            templateRequest.input('timeLimitMinutes', sql.Int, aiResult.timeLimitMinutes); // Dùng thời gian AI đề xuất
            templateRequest.input('aiPromptSettings', sql.NVarChar(sql.MAX), `Skills: ${focusSkills || 'auto'}, Count: ${questionCount}, Difficulty: ${difficulty}`); // Lưu lại cài đặt
            
            const templateResult = await templateRequest.query(`
                INSERT INTO InterviewTemplates (recruiterId, title, jobId, timeLimitMinutes, aiPromptSettings, createdAt, updatedAt)
                OUTPUT INSERTED.id, INSERTED.timeLimitMinutes, INSERTED.createdAt -- Trả về ID, thời gian, ngày tạo
                VALUES (@recruiterId, @title, @jobId, @timeLimitMinutes, @aiPromptSettings, GETUTCDATE(), GETUTCDATE());
            `);

            const newTemplateId = templateResult.recordset[0].id;
            const finalTimeLimit = templateResult.recordset[0].timeLimitMinutes;
            const createdAt = templateResult.recordset[0].createdAt;

            // 3.2. Chuẩn bị Bulk Insert "Tối ưu" cho các câu hỏi
            const questionsTable = new sql.Table('InterviewQuestions');
            questionsTable.columns.add('templateId', sql.Int, { nullable: false });
            questionsTable.columns.add('questionOrder', sql.Int, { nullable: false });
            questionsTable.columns.add('questionText', sql.NVarChar(sql.MAX), { nullable: false });
            questionsTable.columns.add('idealAnswer', sql.NVarChar(sql.MAX), { nullable: false });
            // (Thêm questionType nếu bạn đã thêm cột đó vào CSDL v3.0 - Giả sử chưa)
            // questionsTable.columns.add('questionType', sql.NVarChar(50), { nullable: true });
            
            aiResult.questions.forEach((q, index) => {
                questionsTable.rows.add(
                    newTemplateId,
                    index + 1, // questionOrder (bắt đầu từ 1)
                    q.questionText,
                    q.idealAnswer
                    // q.questionType // Bỏ comment nếu CSDL có cột này
                );
            });

            // 3.3. Thực thi Bulk Insert
            const bulkRequest = new sql.Request(transaction);
            await bulkRequest.bulk(questionsTable);

            // 3.4. Commit "Hoàn hảo"
            await transaction.commit();
            
            console.log(`[${functionName}] Successfully created Template ID: ${newTemplateId} with ${aiResult.questions.length} questions.`);
            
            // 4. Trả về template hoàn chỉnh cho client
            return {
                id: newTemplateId,
                title: title,
                jobId: jobId,
                jobTitle: jobTitle, // Thêm jobTitle cho client
                timeLimitMinutes: finalTimeLimit,
                questions: aiResult.questions, // Trả về luôn câu hỏi để NTD xem
                createdAt: createdAt
            };

        } catch (transError) {
            await transaction.rollback(); // Rollback nếu có lỗi khi lưu
            logError(functionName + ' [Transaction]', transError, { recruiterId, jobId });
            throw new Error(`Lỗi CSDL khi đang lưu mẫu phỏng vấn: ${transError.message}`);
        }
    } catch (error) {
        logError(functionName, error, { recruiterId, jobId });
        throw error; // Ném lại lỗi (từ AI hoặc từ DB) để controller xử lý
    }
};

/**
 * [SERVICE - NTD] Lấy danh sách (chỉ tên) các Mẫu Phỏng vấn của NTD.
 * @param {number} recruiterId - ID của NTD.
 * @returns {Promise<Array<object>>} - Mảng các mẫu (chỉ ID, Title).
 */
const getInterviewTemplates = async (recruiterId) => {
    const functionName = 'InterviewService.getInterviewTemplates';
    console.log(`[${functionName}] Fetching templates for Recruiter ID: ${recruiterId}`);
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('recruiterId', sql.Int, recruiterId)
            .query(`
                SELECT
                    t.id, t.title, t.timeLimitMinutes, t.createdAt,
                    j.title as jobTitle -- Lấy thêm title của job
                FROM InterviewTemplates t
                LEFT JOIN Jobs j ON t.jobId = j.id -- LEFT JOIN phòng khi job đã bị xóa
                WHERE t.recruiterId = @recruiterId
                ORDER BY t.createdAt DESC;
            `);
        return result.recordset;
    } catch (error) {
        logError(functionName, error, { recruiterId });
        throw new Error(`Lỗi máy chủ khi lấy danh sách mẫu phỏng vấn.`);
    }
};

/**
 * [SERVICE - NTD] Gửi lời mời phỏng vấn cho sinh viên.
 * Cập nhật trạng thái 'Interview_Sent' cho JobApplication.
 * @param {number} recruiterId - ID của NTD gửi.
 * @param {number} applicationId - ID của đơn ứng tuyển (JobApplication).
 * @param {number} templateId - ID của mẫu phỏng vấn được chọn.
 * @param {string} recruiterMessage - Lời nhắn NTD gửi kèm.
 * @returns {Promise<object>} - Thông tin StudentInterview vừa được tạo.
 */
const sendInterviewInvite = async (recruiterId, applicationId, templateId, recruiterMessage) => {
    const functionName = 'InterviewService.sendInterviewInvite';
    console.log(`[${functionName}] Recruiter ${recruiterId} sending template ${templateId} to application ${applicationId}`);

    const transaction = new sql.Transaction(await poolPromise);
    try {
        await transaction.begin();

        // 1. Lấy thông tin Job ID từ Application ID
        const appRequest = new sql.Request(transaction);
        appRequest.input('applicationId_check', sql.Int, applicationId);
        const appResult = await appRequest.query(`
            SELECT jobId, status FROM JobApplications WHERE id = @applicationId_check
        `);
        if (appResult.recordset.length === 0) {
            throw new Error(`Không tìm thấy đơn ứng tuyển với ID: ${applicationId}`);
        }
        
        const { jobId, status: currentAppStatus } = appResult.recordset[0];

        // 2. Kiểm tra quyền sở hữu Job "Bất khả xâm phạm"
        // Phải truyền 'transaction' vào hàm helper!
        const isOwner = await checkJobOwnership(jobId, recruiterId, transaction);
        if (!isOwner) {
            throw new Error('Bạn không có quyền gửi phỏng vấn cho đơn ứng tuyển thuộc tin tuyển dụng này.');
        }

        // 3. Kiểm tra trạng thái đơn ứng tuyển (chỉ mời khi đang Pending hoặc Reviewed)
        if (![ 'Pending', 'Reviewed'].includes(currentAppStatus)) {
            throw new Error(`Không thể gửi lời mời phỏng vấn. Trạng thái đơn ứng tuyển hiện tại là '${currentAppStatus}', không phải 'Pending' hoặc 'Reviewed'.`);
        }

        // 4. Tạo bản ghi StudentInterviews
        const interviewRequest = new sql.Request(transaction);
        interviewRequest.input('applicationId_insert', sql.Int, applicationId);
        interviewRequest.input('templateId_insert', sql.Int, templateId);
        interviewRequest.input('status_insert', sql.NVarChar(50), InterviewStatus.SENT); // 'Sent'
        interviewRequest.input('recruiterMessage_insert', sql.NVarChar(sql.MAX), recruiterMessage || null);
        
        const interviewResult = await interviewRequest.query(`
            INSERT INTO StudentInterviews (applicationId, templateId, status, recruiterMessage, createdAt, updatedAt)
            OUTPUT INSERTED.*
            VALUES (@applicationId_insert, @templateId_insert, @status_insert, @recruiterMessage_insert, GETUTCDATE(), GETUTCDATE());
        `);
        
        if (interviewResult.recordset.length === 0) {
            throw new Error("Tạo bản ghi StudentInterviews thất bại.");
        }
        
        // 5. Cập nhật trạng thái JobApplication thành 'Interview_Sent'
        const updateAppRequest = new sql.Request(transaction);
        updateAppRequest.input('applicationId_update', sql.Int, applicationId);
        updateAppRequest.input('newStatus_update', sql.NVarChar(50), AppStatus.INTERVIEW_SENT); // 'Interview_Sent'
        updateAppRequest.input('recruiterId_update', sql.Int, recruiterId);
        
        await updateAppRequest.query(`
            UPDATE JobApplications
            SET status = @newStatus_update, statusChangedAt = GETUTCDATE(), changedByUserId = @recruiterId_update
            WHERE id = @applicationId_update;
        `);

        // 6. Commit "Hoàn hảo"
        await transaction.commit();
        
        console.log(`[${functionName}] Successfully sent interview invite for App ID: ${applicationId}`);
        // (Tương lai: Gửi Email/Thông báo cho SV ở đây)
        
        return interviewResult.recordset[0]; // Trả về bản ghi StudentInterview

    } catch (error) {
        if (transaction && transaction.active) await transaction.rollback();
        // Xử lý lỗi UNIQUE constraint (nếu SV đã được mời 1 lần rồi)
        if (error.number === 2627 || error.number === 2601) {
            logError(functionName, new Error(`Duplicate interview invite attempt for AppID: ${applicationId}`), { applicationId });
            throw new Error("Bạn đã gửi lời mời phỏng vấn cho ứng viên này rồi.");
        }
        logError(functionName, error, { recruiterId, applicationId, templateId });
        throw error; // Ném lại lỗi để controller xử lý
    }
};

/**
 * [SERVICE - SV] Bắt đầu làm bài phỏng vấn.
 * Lấy đề bài và set trạng thái "Started".
 * @param {number} studentId - ID của SV đang làm bài.
 * @param {number} studentInterviewId - ID của bài phỏng vấn (StudentInterviews).
 * @returns {Promise<object>} - { questions: [...], timeLimitMinutes, timeStarted }
 */
const startInterview = async (studentId, studentInterviewId) => {
    const functionName = 'InterviewService.startInterview';
    console.log(`[${functionName}] Student ${studentId} attempting to start interview ${studentInterviewId}`);
    
    const transaction = new sql.Transaction(await poolPromise);
    try {
        await transaction.begin();
        
        // 1. Lấy thông tin bài phỏng vấn và kiểm tra quyền
        const checkRequest = new sql.Request(transaction);
        checkRequest.input('studentInterviewId', sql.Int, studentInterviewId);
        checkRequest.input('studentId', sql.Int, studentId);
        
        const checkResult = await checkRequest.query(`
            SELECT
                si.status, si.templateId, si.timeStarted,
                ja.studentId as ownerStudentId,
                t.timeLimitMinutes
            FROM StudentInterviews si
            JOIN JobApplications ja ON si.applicationId = ja.id
            JOIN InterviewTemplates t ON si.templateId = t.id
            WHERE si.id = @studentInterviewId;
        `);
        
        if (checkResult.recordset.length === 0) {
            throw new Error("Không tìm thấy bài phỏng vấn này.");
        }
        
        const interviewData = checkResult.recordset[0];
        
        // 2. Kiểm tra "Bất khả xâm phạm"
        if (interviewData.ownerStudentId !== studentId) {
            throw new Error("Bạn không có quyền làm bài phỏng vấn này.");
        }
        if (interviewData.status === InterviewStatus.SUBMITTED || interviewData.status === InterviewStatus.GRADED) {
            throw new Error("Bạn đã nộp bài phỏng vấn này rồi.");
        }
        
        let timeStarted = interviewData.timeStarted;
        
        // 3. Cập nhật trạng thái nếu là lần đầu làm bài
        if (interviewData.status === InterviewStatus.SENT) {
            console.log(`[${functionName}] First time start. Updating status to 'Started'.`);
            timeStarted = new Date(); // Ghi lại thời gian bắt đầu mới
            const updateRequest = new sql.Request(transaction);
            updateRequest.input('studentInterviewId_update', sql.Int, studentInterviewId);
            updateRequest.input('newStatus_update', sql.NVarChar(50), InterviewStatus.STARTED);
            updateRequest.input('timeStarted_update', sql.DateTime2, timeStarted);
            await updateRequest.query(`
                UPDATE StudentInterviews
                SET status = @newStatus_update, timeStarted = @timeStarted_update, updatedAt = GETUTCDATE()
                WHERE id = @studentInterviewId_update;
            `);
        } else {
            console.log(`[${functionName}] Resuming interview. Status is already '${interviewData.status}'.`);
        }

        // 4. Lấy danh sách câu hỏi (KHÔNG LẤY CÂU TRẢ LỜI LÝ TƯỞNG)
        const questionRequest = new sql.Request(transaction);
        questionRequest.input('templateId_get', sql.Int, interviewData.templateId);
        const questionsResult = await questionRequest.query(`
            SELECT id, questionOrder, questionText
            FROM InterviewQuestions
            WHERE templateId = @templateId_get
            ORDER BY questionOrder ASC;
        `);

        // 5. Commit
        await transaction.commit();
        
        // 6. Trả về đề bài
        return {
            questions: questionsResult.recordset,
            timeLimitMinutes: interviewData.timeLimitMinutes,
            timeStarted: timeStarted.toISOString() // Trả về mốc thời gian đã bắt đầu
        };
        
    } catch (error) {
        if (transaction && transaction.active) await transaction.rollback();
        logError(functionName, error, { studentId, studentInterviewId });
        throw error;
    }
};

/**
 * [SERVICE - SV] Nộp bài phỏng vấn.
 * @param {number} studentId - ID của SV nộp bài.
 * @param {number} studentInterviewId - ID của bài phỏng vấn.
 * @param {Array<object>} answers - Mảng câu trả lời: [{ questionId, answerText }]
 * @returns {Promise<object>} - Bản ghi StudentInterview đã nộp.
 */
const submitInterview = async (studentId, studentInterviewId, answers) => {
    const functionName = 'InterviewService.submitInterview';
    console.log(`[${functionName}] Student ${studentId} submitting interview ${studentInterviewId} with ${answers.length} answers.`);
    
    if (!Array.isArray(answers)) {
        throw new Error("Dữ liệu câu trả lời không hợp lệ.");
    }
    
    const transaction = new sql.Transaction(await poolPromise);
    try {
        await transaction.begin();

        // 1. Kiểm tra quyền và trạng thái
        const checkRequest = new sql.Request(transaction);
        checkRequest.input('studentInterviewId_check', sql.Int, studentInterviewId);
        checkRequest.input('studentId_check', sql.Int, studentId);
        
        const checkResult = await checkRequest.query(`
            SELECT si.status, si.timeStarted, t.timeLimitMinutes, ja.studentId as ownerStudentId
            FROM StudentInterviews si
            JOIN JobApplications ja ON si.applicationId = ja.id
            JOIN InterviewTemplates t ON si.templateId = t.id
            WHERE si.id = @studentInterviewId_check;
        `);
        
        if (checkResult.recordset.length === 0) { throw new Error("Không tìm thấy bài phỏng vấn."); }
        const interviewData = checkResult.recordset[0];
        if (interviewData.ownerStudentId !== studentId) { throw new Error("Bạn không có quyền nộp bài phỏng vấn này."); }
        
        // 2. Kiểm tra trạng thái nộp bài
        if (interviewData.status === InterviewStatus.SUBMITTED || interviewData.status === InterviewStatus.GRADED) {
            throw new Error("Bạn đã nộp bài này rồi.");
        }
        if (interviewData.status !== InterviewStatus.STARTED) {
            throw new Error("Không thể nộp bài khi chưa bắt đầu.");
        }
        
        // 3. (Tùy chọn) Kiểm tra thời gian
        const timeStarted = new Date(interviewData.timeStarted);
        const timeLimitMs = interviewData.timeLimitMinutes * 60 * 1000;
        const timeNow = new Date();
        if (timeNow.getTime() > timeStarted.getTime() + timeLimitMs) {
            console.warn(`[${functionName}] Student ${studentId} submitted interview ${studentInterviewId} LATE.`);
            // (Vẫn cho nộp, nhưng có thể lưu lại log hoặc trạng thái 'Submitted_Late')
        }

        // 4. Cập nhật trạng thái bài phỏng vấn -> "Submitted"
        const updateRequest = new sql.Request(transaction);
        updateRequest.input('studentInterviewId_update', sql.Int, studentInterviewId);
        updateRequest.input('newStatus_update', sql.NVarChar(50), InterviewStatus.SUBMITTED);
        updateRequest.input('timeSubmitted_update', sql.DateTime2, timeNow); // Ghi lại thời gian nộp
        
        const updatedInterviewResult = await updateRequest.query(`
            UPDATE StudentInterviews
            SET status = @newStatus_update, timeSubmitted = @timeSubmitted_update, updatedAt = GETUTCDATE()
            OUTPUT INSERTED.*
            WHERE id = @studentInterviewId_update;
        `);
        
        // 5. Chuẩn bị Bulk Insert "Tối ưu" cho các câu trả lời
        const answersTable = new sql.Table('StudentAnswers');
        answersTable.columns.add('studentInterviewId', sql.Int, { nullable: false });
        answersTable.columns.add('questionId', sql.Int, { nullable: false });
        answersTable.columns.add('answerText', sql.NVarChar(sql.MAX), { nullable: true });

        for (const answer of answers) {
            if (answer.questionId && typeof answer.answerText === 'string') {
                answersTable.rows.add(
                    studentInterviewId,
                    parseInt(answer.questionId),
                    answer.answerText // (Đã giả định frontend đã giới hạn độ dài)
                );
            }
        }

        // 6. Thực thi Bulk Insert
        if (answersTable.rows.length > 0) {
            const bulkRequest = new sql.Request(transaction);
            await bulkRequest.bulk(answersTable);
        }
        
        // 7. Commit
        await transaction.commit();
        
        console.log(`[${functionName}] Successfully submitted interview ${studentInterviewId}.`);
        return updatedInterviewResult.recordset[0]; // Trả về thông tin bài làm đã nộp

    } catch (error) {
        if (transaction && transaction.active) await transaction.rollback();
        logError(functionName, error, { studentId, studentInterviewId });
        throw error;
    }
};

/**
 * [SERVICE - NTD] Lấy danh sách các bài phỏng vấn đã nộp (chờ chấm) hoặc đã chấm.
 * @param {number} recruiterId - ID của NTD.
 * @returns {Promise<Array<object>>} - Danh sách các bài phỏng vấn.
 */
const getInterviewResults = async (recruiterId) => {
    const functionName = 'InterviewService.getInterviewResults';
    console.log(`[${functionName}] Fetching submitted/graded interviews for Recruiter ID: ${recruiterId}`);
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('recruiterId', sql.Int, recruiterId)
            .query(`
                SELECT
                    si.id as studentInterviewId, si.status, si.overallScore, si.timeSubmitted, si.updatedAt,
                    u.name as studentName, u.avatarUrl as studentAvatar, u.githubUsername,
                    j.title as jobTitle,
                    t.title as templateTitle
                FROM StudentInterviews si
                JOIN JobApplications ja ON si.applicationId = ja.id
                JOIN Jobs j ON ja.jobId = j.id
                JOIN Users u ON ja.studentId = u.id
                JOIN InterviewTemplates t ON si.templateId = t.id
                WHERE j.recruiterId = @recruiterId
                    AND si.status IN ('${InterviewStatus.SUBMITTED}', '${InterviewStatus.GRADING}', '${InterviewStatus.GRADED}')
                ORDER BY si.status ASC, si.updatedAt DESC;
            `);
        return result.recordset;
    } catch (error) {
        logError(functionName, error, { recruiterId });
        throw new Error(`Lỗi máy chủ khi lấy kết quả phỏng vấn.`);
    }
};

/**
 * [SERVICE - NTD] Yêu cầu AI bắt đầu chấm bài (Chạy ngầm - Bất đồng bộ).
 * @param {number} recruiterId - ID của NTD.
 * @param {number} studentInterviewId - ID của bài phỏng vấn cần chấm.
 */
const gradeInterviewAI = async (recruiterId, studentInterviewId) => {
    const functionName = 'InterviewService.gradeInterviewAI';
    console.log(`[${functionName}] Recruiter ${recruiterId} requested AI grading for interview ${studentInterviewId}.`);

    const pool = await poolPromise;
    
    // Bước 1: Kiểm tra quyền và set trạng thái "Grading" (Nhanh, đồng bộ)
    try {
        const transaction = new sql.Transaction(pool);
        await transaction.begin();
        
        // Lấy jobId, templateId và status
        const checkRequest = new sql.Request(transaction);
        checkRequest.input('studentInterviewId', sql.Int, studentInterviewId);
        const checkResult = await checkRequest.query(`
            SELECT si.status, si.templateId, ja.jobId
            FROM StudentInterviews si
            JOIN JobApplications ja ON si.applicationId = ja.id
            WHERE si.id = @studentInterviewId;
        `);
        if (checkResult.recordset.length === 0) throw new Error("Không tìm thấy bài phỏng vấn.");
        
        const { jobId, templateId, status } = checkResult.recordset[0];
        
        // Kiểm tra quyền
        if (!await checkJobOwnership(jobId, recruiterId, transaction)) {
            throw new Error("Bạn không có quyền chấm bài phỏng vấn này.");
        }
        
        // Kiểm tra trạng thái
        if (status !== InterviewStatus.SUBMITTED) {
            throw new Error(`Bài phỏng vấn đang ở trạng thái '${status}', không thể chấm điểm.`);
        }
        
        // Cập nhật trạng thái -> "Grading"
        await new sql.Request(transaction)
            .input('studentInterviewId_update', sql.Int, studentInterviewId)
            .input('newStatus_update', sql.NVarChar(50), InterviewStatus.GRADING)
            .query('UPDATE StudentInterviews SET status = @newStatus_update, updatedAt = GETUTCDATE() WHERE id = @studentInterviewId_update');
        
        await transaction.commit();
        
    } catch (error) {
        // Nếu lỗi ngay bước kiểm tra hoặc set 'Grading', ném lỗi về controller ngay
        logError(functionName + ' [Pre-check]', error, { recruiterId, studentInterviewId });
        throw error;
    }

    // Bước 2: Chạy AI chấm điểm ngầm (Không await)
    // bọc logic AI nặng nề trong một hàm async và gọi nó mà không await
    const runAIGradingInBackground = async () => {
        try {
            console.log(`[${functionName} BG] Background task started for interview ${studentInterviewId}.`);
            
            // 1. Lấy Job Title
            const jobTitleResult = await pool.request().input('studentInterviewId_bg', sql.Int, studentInterviewId)
                .query('SELECT j.title FROM Jobs j JOIN JobApplications ja ON j.id = ja.jobId JOIN StudentInterviews si ON ja.id = si.applicationId WHERE si.id = @studentInterviewId_bg');
            const jobTitle = jobTitleResult.recordset[0]?.title || "Vị trí không xác định";

            // 2. Lấy toàn bộ (Câu hỏi, Barem, Câu trả lời SV)
            const answersResult = await pool.request()
                .input('studentInterviewId_bg', sql.Int, studentInterviewId)
                .query(`
                    SELECT
                        sa.id as studentAnswerId,
                        q.questionText, q.idealAnswer,
                        sa.answerText
                    FROM StudentAnswers sa
                    JOIN InterviewQuestions q ON sa.questionId = q.id
                    WHERE sa.studentInterviewId = @studentInterviewId_bg
                    ORDER BY q.questionOrder ASC;
                `);
            
            const answers = answersResult.recordset;
            if (answers.length === 0) throw new Error("Không tìm thấy câu trả lời nào để chấm.");
            
            let gradedAnswers = []; // Mảng lưu kết quả đã chấm

            // 3. Lặp qua từng câu và gọi AI chấm điểm
            console.log(`[${functionName} BG] Grading ${answers.length} answers one by one...`);
            for (const ans of answers) {
                const { score, evaluation } = await aiService.evaluateStudentAnswer(
                    ans.questionText,
                    ans.idealAnswer,
                    ans.answerText
                );
                
                // Cập nhật điểm và nhận xét cho từng câu trả lời (StudentAnswers)
                await pool.request()
                    .input('studentAnswerId_update', sql.Int, ans.studentAnswerId)
                    .input('aiScore_update', sql.Int, score)
                    .input('aiEvaluation_update', sql.NVarChar(sql.MAX), evaluation)
                    .query('UPDATE StudentAnswers SET aiScore = @aiScore_update, aiEvaluation = @aiEvaluation_update WHERE id = @studentAnswerId_update');
                
                gradedAnswers.push({
                    questionText: ans.questionText,
                    studentAnswer: ans.answerText,
                    aiScore: score,
                    aiEvaluation: evaluation
                });
                
                // await sleep(1000); // Thêm 1s delay giữa các lần gọi AI để tránh rate limit (Tùy chọn)
            }

            // 4. Gọi AI viết nhận định tổng kết
            console.log(`[${functionName} BG] Generating final evaluation...`);
            const { overallScore, aiOverallEvaluation } = await aiService.gradeOverallInterview(
                jobTitle,
                gradedAnswers
            );

            // 5. Cập nhật bài làm (StudentInterviews) với điểm tổng kết và trạng thái "Graded"
            await pool.request()
                .input('studentInterviewId_final', sql.Int, studentInterviewId)
                .input('overallScore_final', sql.Int, overallScore)
                .input('aiOverallEvaluation_final', sql.NVarChar(sql.MAX), aiOverallEvaluation)
                .input('newStatus_final', sql.NVarChar(50), InterviewStatus.GRADED)
                .query(`
                    UPDATE StudentInterviews
                    SET overallScore = @overallScore_final,
                        aiOverallEvaluation = @aiOverallEvaluation_final,
                        status = @newStatus_final,
                        updatedAt = GETUTCDATE()
                    WHERE id = @studentInterviewId_final;
                `);
            
            console.log(`✅ [${functionName} BG] Successfully graded interview ${studentInterviewId}. Final Score: ${overallScore}`);
            // (Tương lai: Gửi thông báo cho NTD là đã chấm xong)

        } catch (bgError) {
            // Xử lý lỗi chạy ngầm: Cập nhật trạng thái về "Submitted" để NTD có thể thử lại
            logError(functionName + ' [Background Task]', bgError, { studentInterviewId });
            try {
                await pool.request()
                    .input('studentInterviewId_err', sql.Int, studentInterviewId)
                    .input('status_err', sql.NVarChar(50), InterviewStatus.SUBMITTED) // Trả về Submitted
                    .input('aiOverallEvaluation_err', sql.NVarChar(sql.MAX), `AI chấm bài thất bại (Lỗi: ${bgError.message}). Vui lòng thử lại.`) // Ghi lỗi
                    .query('UPDATE StudentInterviews SET status = @status_err, aiOverallEvaluation = @aiOverallEvaluation_err, updatedAt = GETUTCDATE() WHERE id = @studentInterviewId_err');
            } catch (updateError) {
                logError(functionName + ' [Background Error Handler]', updateError, { studentInterviewId });
            }
        }
    };
    
    // Chạy hàm AI ngầm và không await nó
    runAIGradingInBackground();
    
    // Trả về thành công ngay lập tức (Status 202)
    return { success: true, message: `Đã nhận yêu cầu chấm bài cho Phỏng vấn ID ${studentInterviewId}. AI đang xử lý ngầm.` };
};

/**
 * [SERVICE - NTD] Lấy chi tiết một bài phỏng vấn đã được chấm.
 * @param {number} recruiterId - ID của NTD.
 * @param {number} studentInterviewId - ID của bài phỏng vấn.
 * @returns {Promise<object>} - Chi tiết bài làm { interviewDetails, answersWithGrading }
 */
const getInterviewResultDetail = async (recruiterId, studentInterviewId) => {
    const functionName = 'InterviewService.getInterviewResultDetail';
    console.log(`[${functionName}] Recruiter ${recruiterId} fetching details for interview ${studentInterviewId}`);
    
    const pool = await poolPromise;
    try {
        // 1. Lấy thông tin chung và kiểm tra quyền
        const interviewResult = await pool.request()
            .input('studentInterviewId_detail', sql.Int, studentInterviewId)
            .input('recruiterId_detail', sql.Int, recruiterId)
            .query(`
                SELECT
                    si.*,
                    ja.jobId,
                    j.recruiterId as ownerId,
                    j.title as jobTitle,
                    u.name as studentName, u.githubUsername, u.avatarUrl as studentAvatar,
                    t.title as templateTitle
                FROM StudentInterviews si
                JOIN JobApplications ja ON si.applicationId = ja.id
                JOIN Jobs j ON ja.jobId = j.id
                JOIN Users u ON ja.studentId = u.id
                JOIN InterviewTemplates t ON si.templateId = t.id
                WHERE si.id = @studentInterviewId_detail AND j.recruiterId = @recruiterId_detail;
            `);
            
        if (interviewResult.recordset.length === 0) {
            throw new Error("Không tìm thấy bài phỏng vấn hoặc bạn không có quyền xem.");
        }
        
        const interviewDetails = interviewResult.recordset[0];
        
        // 2. Lấy chi tiết các câu trả lời, câu hỏi, barem điểm, và đánh giá
        const answersResult = await pool.request()
            .input('studentInterviewId_answers', sql.Int, studentInterviewId)
            .query(`
                SELECT
                    q.id as questionId,
                    q.questionOrder,
                    q.questionText,
                    q.idealAnswer,
                    sa.answerText,
                    sa.aiScore,
                    sa.aiEvaluation
                FROM StudentAnswers sa
                JOIN InterviewQuestions q ON sa.questionId = q.id
                WHERE sa.studentInterviewId = @studentInterviewId_answers
                ORDER BY q.questionOrder ASC;
            `);

        // 3. Trả về cấu trúc "đẳng cấp"
        return {
            interviewDetails: interviewDetails,
            answersWithGrading: answersResult.recordset
        };

    } catch (error) {
        logError(functionName, error, { recruiterId, studentInterviewId });
        throw error;
    }
};


// ====================================================================
// === XUẤT CÁC HÀM "ĐẲNG CẤP" ĐỂ CONTROLLER SỬ DỤNG ===
// ====================================================================
module.exports = {
    // --- Nghiệp vụ NTD ---
    createInterviewTemplate,
    getInterviewTemplates,
    sendInterviewInvite,
    getInterviewResults,
    gradeInterviewAI,
    getInterviewResultDetail,
    
    // --- Nghiệp vụ SV ---
    startInterview,
    submitInterview
};

console.log("✅✅✅ interview.service.js (Tối Thượng v3.0 - AI Interview Logic) loaded.");