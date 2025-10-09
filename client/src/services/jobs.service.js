// src/services/jobs.service.js
import sql from 'mssql';
import dbConfig from '../config/db.config.js';

const pool = new sql.ConnectionPool(dbConfig);
// Chỉ kết nối một lần và tái sử dụng
const poolConnect = pool.connect().catch(err => console.error("Database Connection Failed! Bad Config: ", err));

const findAllJobs = async (page, limit, filters) => {
    await poolConnect; 
    
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

        // --- Query 1: Lấy tổng số kết quả khớp với bộ lọc ---
        const countQuery = `SELECT COUNT(DISTINCT j.id) as total FROM Jobs j ${whereCondition};`;
        const countResult = await request.query(countQuery);
        const totalJobs = countResult.recordset[0].total;
        const totalPages = Math.ceil(totalJobs / Number(limit));

        // --- Query 2: Lấy dữ liệu của trang hiện tại ---
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
        
        // Xử lý dữ liệu trả về để có định dạng chuẩn như Frontend mong muốn
        const jobs = jobsResult.recordset.map(job => ({
            id: job.id,
            title: job.title,
            location: job.location,
            salary: job.salary, // Cần chuẩn hóa salary này thành object {min, max, unit} sau
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

export default {
    findAllJobs,
};