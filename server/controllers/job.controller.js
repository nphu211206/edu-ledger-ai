// /server/controllers/job.controller.js
const { sql, poolPromise } = require('../config/db');

/**
 * Lấy tất cả các tin tuyển dụng để hiển thị công khai
 * Dữ liệu trả về bao gồm thông tin của nhà tuyển dụng (tên, logo công ty)
 */
exports.getAllJobs = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT 
                j.id, j.title, j.location, j.salary, j.jobType, j.createdAt,
                u.name as recruiterName 
                -- Sau này có thể JOIN thêm bảng Company để lấy logo
            FROM Jobs j
            JOIN Users u ON j.recruiterId = u.id
            ORDER BY j.createdAt DESC;
        `);
        // Luôn trả về phản hồi
        res.status(200).json(result.recordset);
    } catch (error) {
        console.error("Lỗi khi lấy danh sách việc làm:", error);
        res.status(500).json({ message: "Lỗi máy chủ nội bộ khi lấy danh sách việc làm." });
    }
};

/**
 * Tạo một tin tuyển dụng mới
 * Chỉ có Nhà tuyển dụng (recruiter) đã đăng nhập mới được phép
 */
exports.createJob = async (req, res) => {
    // Middleware authenticateToken đã chạy trước, nên chúng ta có req.user
    if (req.user.role !== 'recruiter') {
        return res.status(403).json({ message: 'Chỉ nhà tuyển dụng mới có thể đăng tin.' });
    }
    
    const { title, description, location, salary, jobType } = req.body;
    const recruiterId = req.user.userId;

    if (!title || !description) {
        return res.status(400).json({ message: 'Tiêu đề và mô tả là bắt buộc.' });
    }

    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('recruiterId', sql.Int, recruiterId)
            .input('title', sql.NVarChar, title)
            .input('description', sql.NText, description)
            .input('location', sql.NVarChar, location)
            .input('salary', sql.NVarChar, salary)
            .input('jobType', sql.NVarChar, jobType)
            .query(`
                INSERT INTO Jobs (recruiterId, title, description, location, salary, jobType)
                OUTPUT INSERTED.*
                VALUES (@recruiterId, @title, @description, @location, @salary, @jobType);
            `);
        
        // Trả về tin tuyển dụng vừa được tạo thành công
        res.status(201).json(result.recordset[0]);
    } catch (error) {
        console.error("Lỗi khi tạo việc làm mới:", error);
        res.status(500).json({ message: "Lỗi máy chủ nội bộ khi tạo việc làm." });
    }
};

// Trong tương lai, chúng ta sẽ thêm các hàm khác ở đây:
// exports.getJobById = async (req, res) => { ... };
// exports.updateJob = async (req, res) => { ... };
// exports.deleteJob = async (req, res) => { ... };