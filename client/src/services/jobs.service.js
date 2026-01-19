// File: server/services/jobs.service.js
// Sửa lại theo cú pháp CommonJS

const sql = require('mssql');
const { poolPromise } = require('../config/db.js');
const findAllJobs = async (page, limit, filters) => {
    const pool = await poolPromise;
    
    try {
        const request = pool.request();
        const offset = (Number(page) - 1) * Number(limit);

        let whereClauses = [];
        if (filters.keyword) {
            whereClauses.push(`(j.title LIKE @keyword OR j.description LIKE @keyword)`);
            request.input('keyword', sql.NVarChar, `%${filters.keyword}%`);
        }
        if (filters.location) {
            whereClauses.push(`j.location LIKE @location`);
            request.input('location', sql.NVarChar, `%${filters.location}%`);
        }
        if (filters.jobType) {
            whereClauses.push(`j.jobType = @jobType`);
            request.input('jobType', sql.NVarChar, filters.jobType);
        }
        
        const whereCondition = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

        const countQuery = `SELECT COUNT(DISTINCT j.id) as total FROM Jobs j ${whereCondition};`;
        const countResult = await request.query(countQuery);
        const totalJobs = countResult.recordset[0].total;
        const totalPages = Math.ceil(totalJobs / Number(limit));

        const jobsQuery = `
            SELECT 
                j.id, j.title, j.location, j.salary, j.jobType, j.createdAt,
                u.name AS companyName,
                u.avatarUrl AS companyLogoUrl,
                (
                    SELECT s.name
                    FROM JobSkills js
                    JOIN Skills s ON js.skillId = s.id
                    WHERE js.jobId = j.id
                    FOR JSON PATH
                ) AS skills
            FROM Jobs j
            JOIN Users u ON j.recruiterId = u.id
            ${whereCondition}
            ORDER BY j.createdAt DESC
            OFFSET @offset ROWS
            FETCH NEXT @limit ROWS ONLY;
        `;
        request.input('offset', sql.Int, offset);
        request.input('limit', sql.Int, Number(limit));
        
        const jobsResult = await request.query(jobsQuery);
        
        const jobs = jobsResult.recordset.map(job => ({
            id: job.id,
            title: job.title,
            location: job.location,
            salary: job.salary,
            jobType: job.jobType,
            postedDate: job.createdAt,
            company: {
                name: job.companyName,
                logoUrl: job.companyLogoUrl,
            },
            skills: job.skills ? JSON.parse(job.skills).map(s => s.name) : []
        }));

        return {
            jobs,
            totalPages,
            currentPage: Number(page),
            totalJobs
        };

    } catch (error) {
        console.error('SQL error in findAllJobs service:', error);
        throw new Error('Lỗi khi truy vấn dữ liệu việc làm từ CSDL.');
    }
};
const createJob = async (recruiterId, jobData) => {
    const { title, description, location, salary, jobType, skills } = jobData;
    if (!title || !description || !skills || !Array.isArray(skills) || skills.length === 0) {
        throw new Error('Dữ liệu không hợp lệ: Vui lòng cung cấp đầy đủ Tiêu đề, Mô tả và ít nhất một Kỹ năng.');
    }
    const pool = await poolPromise;
    const transaction = new sql.Transaction(pool);
    try {
        await transaction.begin();

        // BƯỚC 1: LẤY companyId VÀ KIỂM TRA "BẤT TỬ"
        const userCompanyRequest = new sql.Request(transaction);
        userCompanyRequest.input('recruiterId', sql.Int, recruiterId);
        const userCompanyResult = await userCompanyRequest.query('SELECT companyId FROM Users WHERE id = @recruiterId');
        
        if (userCompanyResult.recordset.length === 0 || !userCompanyResult.recordset[0].companyId) {
            // ĐÂY CHÍNH LÀ LỚP PHÒNG THỦ NGĂN CHẶN LỖI 500
            throw new Error('Tài khoản nhà tuyển dụng không hợp lệ hoặc chưa được liên kết với một công ty.');
        }
        const companyId = userCompanyResult.recordset[0].companyId;

        // Bước 2: Insert vào bảng Jobs
        const jobRequest = new sql.Request(transaction);
        jobRequest.input('recruiterId', sql.Int, recruiterId);
        jobRequest.input('companyId', sql.Int, companyId);
        jobRequest.input('title', sql.NVarChar, title);
        jobRequest.input('description', sql.NText, description);
        jobRequest.input('location', sql.NVarChar, location);
        jobRequest.input('salary', sql.NVarChar, salary);
        jobRequest.input('jobType', sql.NVarChar, jobType);
        
        const jobResult = await jobRequest.query(
            `INSERT INTO Jobs (recruiterId, companyId, title, description, location, salary, jobType) 
             OUTPUT INSERTED.id 
             VALUES (@recruiterId, @companyId, @title, @description, @location, @salary, @jobType);`
        );
        const newJobId = jobResult.recordset[0].id;

        // Bước 3 & 4: Xử lý skills và commit (giữ nguyên logic an toàn)
        const skillIds = [];
        for (const skillName of skills) {
            const skillRequest = new sql.Request(transaction).input('skillName', sql.NVarChar, skillName.trim());
            const skillResult = await skillRequest.query(`MERGE Skills AS target USING (SELECT @skillName AS name) AS source ON target.name = source.name WHEN NOT MATCHED THEN INSERT (name) VALUES (source.name) OUTPUT inserted.id;`);
            skillIds.push(skillResult.recordset[0].id);
        }
        for (const skillId of skillIds) {
            const jobSkillRequest = new sql.Request(transaction).input('jobId', sql.Int, newJobId).input('skillId', sql.Int, skillId);
            await jobSkillRequest.query('INSERT INTO JobSkills (jobId, skillId) VALUES (@jobId, @skillId)');
        }
        await transaction.commit();
        
        return { id: newJobId, ...jobData };

    } catch (error) {
        await transaction.rollback();
        console.error('SQL Transaction Error in createJob:', error);
        // Ném lại lỗi với thông điệp rõ ràng hơn cho controller
        throw new Error(error.message || 'Lỗi khi lưu tin tuyển dụng vào cơ sở dữ liệu.');
    }
};
const findJobsByRecruiter = async (recruiterId) => {
    try {
        const pool = await poolPromise;
        const request = pool.request();
        request.input('recruiterId', sql.Int, recruiterId);

        // Câu query này sẽ JOIN với bảng JobApplications để đếm số ứng viên (applicants)
        const query = `
            SELECT 
                j.id,
                j.title,
                j.createdAt,
                j.jobType,
                (SELECT COUNT(*) FROM JobApplications ja WHERE ja.jobId = j.id) AS applicants,
                'Active' AS status -- Tạm thời hardcode, sau này sẽ phát triển thêm
            FROM Jobs j
            WHERE j.recruiterId = @recruiterId
            ORDER BY j.createdAt DESC;
        `;

        const result = await request.query(query);
        return result.recordset;

    } catch (error) {
        console.error('SQL error in findJobsByRecruiter:', error);
        throw new Error('Lỗi khi truy vấn tin tuyển dụng của bạn từ CSDL.');
    }
};

module.exports = {
    findAllJobs,
    findJobById,
    createJob,
    findJobsByRecruiter,
    createApplication,
};