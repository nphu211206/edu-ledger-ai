// File: server/services/jobs.service.js
// Sửa lại theo cú pháp CommonJS

const sql = require('mssql');
const { poolPromise } = require('../config/db.js'); // Sửa db.config thành db

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

    // Validate dữ liệu đầu vào cơ bản
    if (!title || !description || !skills || !Array.isArray(skills) || skills.length === 0) {
        throw new Error('Dữ liệu không hợp lệ: Vui lòng cung cấp đầy đủ Tiêu đề, Mô tả và ít nhất một Kỹ năng.');
    }

    const pool = await poolPromise;
    const transaction = new sql.Transaction(pool);

    try {
        await transaction.begin();

        // Bước 1: Insert vào bảng Jobs và lấy về ID của job vừa tạo
        const jobRequest = new sql.Request(transaction);
        jobRequest.input('recruiterId', sql.Int, recruiterId);
        jobRequest.input('title', sql.NVarChar, title);
        jobRequest.input('description', sql.NText, description);
        jobRequest.input('location', sql.NVarChar, location);
        jobRequest.input('salary', sql.NVarChar, salary);
        jobRequest.input('jobType', sql.NVarChar, jobType);
        
        const jobResult = await jobRequest.query(
            `INSERT INTO Jobs (recruiterId, title, description, location, salary, jobType)
             OUTPUT INSERTED.id
             VALUES (@recruiterId, @title, @description, @location, @salary, @jobType);`
        );
        const newJobId = jobResult.recordset[0].id;

        // Bước 2: Xử lý các skills. Với mỗi skill:
        // - Kiểm tra xem nó đã tồn tại trong bảng Skills chưa.
        // - Nếu chưa, tạo mới.
        // - Lấy về ID của skill đó.
        const skillIds = [];
        for (const skillName of skills) {
            const skillRequest = new sql.Request(transaction);
            skillRequest.input('skillName', sql.NVarChar, skillName.trim());
            
            // Dùng MERGE để thực hiện "tìm hoặc tạo mới" trong một câu lệnh, hiệu quả hơn.
            const skillResult = await skillRequest.query(
                `MERGE Skills AS target
                 USING (SELECT @skillName AS name) AS source
                 ON target.name = source.name
                 WHEN NOT MATCHED THEN
                     INSERT (name) VALUES (source.name)
                 OUTPUT inserted.id;`
            );
            skillIds.push(skillResult.recordset[0].id);
        }

        // Bước 3: Insert các cặp (newJobId, skillId) vào bảng JobSkills
        const jobSkillsTable = new sql.Table('JobSkills');
        jobSkillsTable.columns.add('jobId', sql.Int);
        jobSkillsTable.columns.add('skillId', sql.Int);

        for (const skillId of skillIds) {
            jobSkillsTable.rows.add(newJobId, skillId);
        }
        
        // Dùng bulk insert để hiệu năng cao nhất
        const bulkRequest = new sql.Request(transaction);
        await bulkRequest.bulk(jobSkillsTable);

        // Nếu mọi thứ thành công, commit transaction
        await transaction.commit();

        // Trả về job đã tạo (bao gồm cả skills)
        return { id: newJobId, ...jobData };

    } catch (error) {
        // Nếu có bất kỳ lỗi nào, rollback tất cả thay đổi
        await transaction.rollback();
        console.error('SQL Transaction Error in createJob:', error);
        throw new Error('Lỗi khi lưu tin tuyển dụng vào cơ sở dữ liệu.');
    }
};

module.exports = {
    findAllJobs,
    createJob,
};