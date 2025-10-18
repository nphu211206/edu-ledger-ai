// File: server/services/jobs.service.js
// PHIÊN BẢN TỐI THƯỢNG - HỢP NHẤT TOÀN BỘ CHỨC NĂNG

const sql = require('mssql');
const { poolPromise } = require('../config/db.js');

// --- BỘ CHUYỂN ĐỔI TỌA ĐỘ (GEO-MAPPER) ---
const cityCoordinates = { 'hà nội': [21.0285, 105.8542], 'tp.hcm': [10.7769, 106.7009], 'hồ chí minh': [10.7769, 106.7009], 'đà nẵng': [16.0544, 108.2022], 'hải phòng': [20.8449, 106.6881], 'cần thơ': [10.0452, 105.7469] };
const getLocationCoordinates = (locationString) => { if (!locationString) return null; const normalizedLocation = locationString.toLowerCase(); for (const city in cityCoordinates) { if (normalizedLocation.includes(city)) { return cityCoordinates[city]; } } return null; };

// --- HÀM LẤY DANH SÁCH VIỆC LÀM (CÓ PHÂN TRANG & FILTER) ---
const findAllJobs = async (page, limit, filters) => {
    const pool = await poolPromise;
    try {
        const request = pool.request();
        const offset = (Number(page) - 1) * Number(limit);
        let whereClauses = [];
        if (filters.keyword) { whereClauses.push(`(j.title LIKE @keyword OR j.description LIKE @keyword)`); request.input('keyword', sql.NVarChar, `%${filters.keyword}%`); }
        if (filters.location) { whereClauses.push(`j.location LIKE @location`); request.input('location', sql.NVarChar, `%${filters.location}%`); }
        if (filters.jobType) { whereClauses.push(`j.jobType = @jobType`); request.input('jobType', sql.NVarChar, filters.jobType); }
        const whereCondition = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
        const countQuery = `SELECT COUNT(DISTINCT j.id) as total FROM Jobs j ${whereCondition};`;
        const countResult = await request.query(countQuery);
        const totalJobs = countResult.recordset[0].total;
        const totalPages = Math.ceil(totalJobs / Number(limit));
        const jobsQuery = `
            SELECT 
                j.id, j.title, j.location, j.salary, j.jobType, j.createdAt,
                c.name AS companyName,
                c.logoUrl AS companyLogoUrl,
                c.slug AS companySlug,
                (SELECT s.name FROM JobSkills js JOIN Skills s ON js.skillId = s.id WHERE js.jobId = j.id FOR JSON PATH) AS skills
            FROM Jobs j
            LEFT JOIN Companies c ON j.companyId = c.id
            ${whereCondition}
            ORDER BY j.createdAt DESC
            OFFSET @offset ROWS
            FETCH NEXT @limit ROWS ONLY;
        `;
        request.input('offset', sql.Int, offset);
        request.input('limit', sql.Int, Number(limit));
        const jobsResult = await request.query(jobsQuery);
        const jobs = jobsResult.recordset.map(job => ({
            id: job.id, title: job.title, location: job.location, salary: job.salary, jobType: job.jobType, postedDate: job.createdAt,
            coordinates: getLocationCoordinates(job.location),
            company: { name: job.companyName, logoUrl: job.companyLogoUrl, slug: job.companySlug },
            skills: job.skills ? JSON.parse(job.skills).map(s => s.name) : []
        }));
        return { jobs, totalPages, currentPage: Number(page), totalJobs };
    } catch (error) {
        console.error('SQL error in findAllJobs service:', error);
        throw new Error('Lỗi khi truy vấn dữ liệu việc làm từ CSDL.');
    }
};

// --- HÀM LẤY CHI TIẾT VIỆC LÀM THEO ID ---
const findJobById = async (jobId) => {
    const pool = await poolPromise;
    const transaction = new sql.Transaction(pool);
    try {
        await transaction.begin();
        const request = new sql.Request(transaction);
        const jobQuery = `
            SELECT 
                j.id, j.title, j.description, j.location, j.salary, j.jobType, j.createdAt,
                c.id as companyId, c.name as companyName, c.logoUrl as companyLogoUrl, c.description as companyBio, c.slug as companySlug
            FROM Jobs j
            LEFT JOIN Companies c ON j.companyId = c.id
            WHERE j.id = @jobId;
        `;
        const jobResult = await request.input('jobId', sql.Int, jobId).query(jobQuery);
        if (jobResult.recordset.length === 0) throw new Error('Không tìm thấy tin tuyển dụng.');
        const jobDetails = jobResult.recordset[0];

        const skillsQuery = `SELECT s.name FROM Skills s JOIN JobSkills js ON s.id = js.skillId WHERE js.jobId = @jobId;`;
        const skillsResult = await new sql.Request(transaction).input('jobId', sql.Int, jobId).query(skillsQuery);
        const skills = skillsResult.recordset.map(s => s.name);

        const relatedJobsQuery = `
            SELECT DISTINCT TOP 5 j.id, j.title, j.location, j.salary, c.name as companyName, c.slug as companySlug
            FROM Jobs j
            JOIN Companies c ON j.companyId = c.id
            WHERE j.id != @jobId AND EXISTS (
                SELECT 1 FROM JobSkills js_inner
                WHERE js_inner.jobId = j.id AND js_inner.skillId IN (SELECT skillId FROM JobSkills WHERE jobId = @jobId)
            );
        `;
        const relatedJobsResult = await new sql.Request(transaction).input('jobId', sql.Int, jobId).query(relatedJobsQuery);
        await transaction.commit();
        return { ...jobDetails, skills, relatedJobs: relatedJobsResult.recordset };
    } catch (error) {
        await transaction.rollback();
        console.error('SQL Error in findJobById:', error);
        throw error;
    }
};

// --- HÀM TẠO VIỆC LÀM MỚI ---
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

        const jobRequest = new sql.Request(transaction);
        jobRequest.input('recruiterId', sql.Int, recruiterId);
        jobRequest.input('companyId', sql.Int, companyId);
        jobRequest.input('title', sql.NVarChar, title);
        jobRequest.input('description', sql.NText, description);
        jobRequest.input('location', sql.NVarChar, location);
        jobRequest.input('salary', sql.NVarChar, salary);
        jobRequest.input('jobType', sql.NVarChar, jobType);
        
        const jobResult = await jobRequest.query(`INSERT INTO Jobs (recruiterId, companyId, title, description, location, salary, jobType) OUTPUT INSERTED.id VALUES (@recruiterId, @companyId, @title, @description, @location, @salary, @jobType);`);
        const newJobId = jobResult.recordset[0].id;

        const skillIds = [];
        for (const skillName of skills) {
            const skillRequest = new sql.Request(transaction).input('skillName', sql.NVarChar, skillName.trim());
            const skillResult = await skillRequest.query(`MERGE Skills AS target USING (SELECT @skillName AS name) AS source ON target.name = source.name WHEN NOT MATCHED THEN INSERT (name) VALUES (source.name) OUTPUT inserted.id;`);
            skillIds.push(skillResult.recordset[0].id);
        }

        const jobSkillsTable = new sql.Table('JobSkills');
        jobSkillsTable.columns.add('jobId', sql.Int);
        jobSkillsTable.columns.add('skillId', sql.Int);
        for (const skillId of skillIds) {
            jobSkillsTable.rows.add(newJobId, skillId);
        }
        await new sql.Request(transaction).bulk(jobSkillsTable);
        
        await transaction.commit();
        return { id: newJobId, ...jobData };
    } catch (error) {
        await transaction.rollback();
        console.error('SQL Transaction Error in createJob:', error);
        // Ném lại lỗi với thông điệp rõ ràng hơn cho controller
        throw new Error(error.message || 'Lỗi khi lưu tin tuyển dụng vào cơ sở dữ liệu.');
    }
};

// --- HÀM LẤY DANH SÁCH VIỆC LÀM CỦA NTD ---
const findJobsByRecruiter = async (recruiterId) => {
    try {
        const pool = await poolPromise;
        const request = pool.request().input('recruiterId', sql.Int, recruiterId);
        const query = `SELECT j.id, j.title, j.createdAt, j.jobType, (SELECT COUNT(*) FROM JobApplications ja WHERE ja.jobId = j.id) AS applicants, 'Active' AS status FROM Jobs j WHERE j.recruiterId = @recruiterId ORDER BY j.createdAt DESC;`;
        const result = await request.query(query);
        return result.recordset;
    } catch (error) {
        console.error('SQL error in findJobsByRecruiter:', error);
        throw new Error('Lỗi khi truy vấn tin tuyển dụng của bạn từ CSDL.');
    }
};

// --- HÀM TẠO ĐƠN ỨNG TUYỂN ---
const createApplication = async ({ jobId, studentId, coverLetter }) => {
    const pool = await poolPromise;
    try {
        const request = pool.request().input('jobId', sql.Int, jobId).input('studentId', sql.Int, studentId);
        const checkResult = await request.query(`SELECT id FROM JobApplications WHERE jobId = @jobId AND studentId = @studentId`);
        if (checkResult.recordset.length > 0) {
            throw new Error('Bạn đã ứng tuyển vào vị trí này rồi.');
        }
        const insertRequest = pool.request().input('jobId', sql.Int, jobId).input('studentId', sql.Int, studentId);
        const insertResult = await insertRequest.query(`INSERT INTO JobApplications (jobId, studentId, status) OUTPUT INSERTED.* VALUES (@jobId, @studentId, 'Pending');`);
        return { success: true, application: insertResult.recordset[0] };
    } catch (error) {
        console.error('SQL Error in createApplication:', error.message);
        throw error;
    }
};

module.exports = {
    findAllJobs,
    findJobById,
    createJob,
    findJobsByRecruiter,
    createApplication,
};