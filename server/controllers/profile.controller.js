// File: server/controllers/profile.controller.js

const { sql, poolPromise } = require('../config/db.js');

// --- HELPER FUNCTION (Hàm hỗ trợ dùng chung) ---
// Hàm này kiểm tra xem một bản ghi (kinh nghiệm/học vấn) có thuộc về người dùng đang yêu cầu hay không
const checkOwnership = async (tableName, recordId, userId) => {
    const pool = await poolPromise;
    const result = await pool.request()
        .input('id', sql.Int, recordId)
        .input('userId', sql.Int, userId)
        .query(`SELECT userId FROM ${tableName} WHERE id = @id AND userId = @userId`);
    return result.recordset.length > 0;
};


// ==========================================================
// === CONTROLLERS CHO KINH NGHIỆM LÀM VIỆC (Work Experience) ===
// ==========================================================

exports.getWorkExperiences = async (req, res) => {
    const userId = req.user.userId;
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('userId', sql.Int, userId)
            .query('SELECT * FROM WorkExperiences WHERE userId = @userId ORDER BY startDate DESC');
        res.status(200).json(result.recordset);
    } catch (error) {
        res.status(500).json({ message: "Lỗi máy chủ khi lấy dữ liệu kinh nghiệm." });
    }
};

exports.addWorkExperience = async (req, res) => {
    const userId = req.user.userId;
    const { title, company, location, startDate, endDate, description } = req.body;
    if (!title || !company || !startDate) {
        return res.status(400).json({ message: "Chức danh, công ty và ngày bắt đầu là bắt buộc." });
    }
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('userId', sql.Int, userId)
            .input('title', sql.NVarChar, title)
            .input('company', sql.NVarChar, company)
            .input('location', sql.NVarChar, location)
            .input('startDate', sql.Date, startDate)
            .input('endDate', sql.Date, endDate || null)
            .input('description', sql.NText, description)
            .query(`INSERT INTO WorkExperiences (userId, title, company, location, startDate, endDate, description) 
                    OUTPUT INSERTED.* VALUES (@userId, @title, @company, @location, @startDate, @endDate, @description)`);
        res.status(201).json(result.recordset[0]);
    } catch (error) {
        res.status(500).json({ message: "Lỗi máy chủ khi thêm kinh nghiệm mới." });
    }
};

exports.updateWorkExperience = async (req, res) => {
    const { id } = req.params;
    const userId = req.user.userId;
    const { title, company, location, startDate, endDate, description } = req.body;

    try {
        if (!await checkOwnership('WorkExperiences', id, userId)) {
            return res.status(403).json({ message: "Không có quyền chỉnh sửa mục này." });
        }
        const pool = await poolPromise;
        const result = await pool.request()
            .input('id', sql.Int, id)
            .input('title', sql.NVarChar, title)
            .input('company', sql.NVarChar, company)
            .input('location', sql.NVarChar, location)
            .input('startDate', sql.Date, startDate)
            .input('endDate', sql.Date, endDate || null)
            .input('description', sql.NText, description)
            .query(`UPDATE WorkExperiences SET 
                        title = @title, company = @company, location = @location, 
                        startDate = @startDate, endDate = @endDate, description = @description,
                        updatedAt = GETUTCDATE()
                    OUTPUT INSERTED.*
                    WHERE id = @id`);
        res.status(200).json(result.recordset[0]);
    } catch (error) {
        res.status(500).json({ message: "Lỗi máy chủ khi cập nhật kinh nghiệm." });
    }
};

exports.deleteWorkExperience = async (req, res) => {
    const { id } = req.params;
    const userId = req.user.userId;
    try {
        if (!await checkOwnership('WorkExperiences', id, userId)) {
            return res.status(403).json({ message: "Không có quyền xóa mục này." });
        }
        const pool = await poolPromise;
        await pool.request().input('id', sql.Int, id).query('DELETE FROM WorkExperiences WHERE id = @id');
        res.status(200).json({ message: "Xóa kinh nghiệm thành công." });
    } catch (error) {
        res.status(500).json({ message: "Lỗi máy chủ khi xóa kinh nghiệm." });
    }
};


// =================================================
// === CONTROLLERS CHO HỌC VẤN (Education) ===
// =================================================

exports.getEducationHistory = async (req, res) => {
    const userId = req.user.userId;
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('userId', sql.Int, userId)
            .query('SELECT * FROM Education WHERE userId = @userId ORDER BY startDate DESC');
        res.status(200).json(result.recordset);
    } catch (error) {
        res.status(500).json({ message: "Lỗi máy chủ khi lấy dữ liệu học vấn." });
    }
};

exports.addEducationHistory = async (req, res) => {
    const userId = req.user.userId;
    const { school, degree, fieldOfStudy, startDate, endDate, grade, description } = req.body;
    if (!school || !degree || !fieldOfStudy || !startDate) {
        return res.status(400).json({ message: "Trường, bằng cấp, chuyên ngành và ngày bắt đầu là bắt buộc." });
    }
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('userId', sql.Int, userId)
            .input('school', sql.NVarChar, school)
            .input('degree', sql.NVarChar, degree)
            .input('fieldOfStudy', sql.NVarChar, fieldOfStudy)
            .input('startDate', sql.Date, startDate)
            .input('endDate', sql.Date, endDate || null)
            .input('grade', sql.NVarChar, grade)
            .input('description', sql.NText, description)
            .query(`INSERT INTO Education (userId, school, degree, fieldOfStudy, startDate, endDate, grade, description)
                    OUTPUT INSERTED.*
                    VALUES (@userId, @school, @degree, @fieldOfStudy, @startDate, @endDate, @grade, @description)`);
        res.status(201).json(result.recordset[0]);
    } catch (error) {
        res.status(500).json({ message: "Lỗi máy chủ khi thêm học vấn mới." });
    }
};

exports.updateEducationHistory = async (req, res) => {
    const { id } = req.params;
    const userId = req.user.userId;
    const { school, degree, fieldOfStudy, startDate, endDate, grade, description } = req.body;
    try {
        if (!await checkOwnership('Education', id, userId)) {
            return res.status(403).json({ message: "Không có quyền chỉnh sửa mục này." });
        }
        const pool = await poolPromise;
        const result = await pool.request()
            .input('id', sql.Int, id)
            .input('school', sql.NVarChar, school)
            .input('degree', sql.NVarChar, degree)
            .input('fieldOfStudy', sql.NVarChar, fieldOfStudy)
            .input('startDate', sql.Date, startDate)
            .input('endDate', sql.Date, endDate || null)
            .input('grade', sql.NVarChar, grade)
            .input('description', sql.NText, description)
            .query(`UPDATE Education SET
                        school = @school, degree = @degree, fieldOfStudy = @fieldOfStudy,
                        startDate = @startDate, endDate = @endDate, grade = @grade, description = @description,
                        updatedAt = GETUTCDATE()
                    OUTPUT INSERTED.*
                    WHERE id = @id`);
        res.status(200).json(result.recordset[0]);
    } catch (error) {
        res.status(500).json({ message: "Lỗi máy chủ khi cập nhật học vấn." });
    }
};

exports.deleteEducationHistory = async (req, res) => {
    const { id } = req.params;
    const userId = req.user.userId;
    try {
        if (!await checkOwnership('Education', id, userId)) {
            return res.status(403).json({ message: "Không có quyền xóa mục này." });
        }
        const pool = await poolPromise;
        await pool.request().input('id', sql.Int, id).query('DELETE FROM Education WHERE id = @id');
        res.status(200).json({ message: "Xóa học vấn thành công." });
    } catch (error) {
        res.status(500).json({ message: "Lỗi máy chủ khi xóa học vấn." });
    }
};