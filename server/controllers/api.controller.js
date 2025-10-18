// /server/controllers/api.controller.js

const axios = require('axios');
const { sql, poolPromise } = require('../config/db');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const jobsService = require('../services/jobs.service');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "models/text-bison-001" });

// ====================================================================
// CÁC HÀM API KHÁC - ĐẦY ĐỦ VÀ HOÀN CHỈNH
// ====================================================================

exports.getMe = async (req, res) => {
    try {
        const pool = await poolPromise;
        const userResult = await pool.request().input('userId', sql.Int, req.user.userId).query('SELECT id, name, avatarUrl, bio, role, githubUsername FROM Users WHERE id = @userId');
        if (userResult.recordset.length === 0) return res.status(404).json({ message: 'Không tìm thấy người dùng.' });
        res.status(200).json(userResult.recordset[0]);
    } catch (error) {
        console.error('Lỗi khi lấy thông tin /api/me:', error);
        res.status(500).json({ message: 'Lỗi máy chủ khi lấy thông tin người dùng.' });
    }
};

exports.getRepos = async (req, res) => {
    if (req.user.role !== 'student') {
        return res.status(403).json({ message: 'Forbidden' });
    }
    try {
        const pool = await poolPromise;
        const tokenResult = await pool.request()
            .input('userId', sql.Int, req.user.userId)
            .query('SELECT githubAccessToken FROM Users WHERE id = @userId');
        
        const githubToken = tokenResult.recordset[0]?.githubAccessToken;
        if (!githubToken) {
            return res.status(401).json({ message: 'Không tìm thấy access token GitHub. Vui lòng đăng nhập lại.' });
        }
        
        const reposResponse = await axios.get('https://api.github.com/user/repos?sort=updated&per_page=10', {
            headers: { 'Authorization': `token ${githubToken}` }
        });
        
        res.status(200).json(reposResponse.data);
    } catch (error) {
        console.error('Lỗi khi lấy repo:', error.response?.data || error.message);
        res.status(500).json({ message: 'Lỗi máy chủ khi lấy danh sách repository.' });
    }
};

exports.getSkills = async (req, res) => {
    if (req.user.role !== 'student') {
        return res.status(403).json({ message: 'Forbidden' });
    }
    const { userId } = req.user;
    try {
        const pool = await poolPromise;
        const skillsResult = await pool.request()
            .input('userId', sql.Int, userId)
            .query(`SELECT s.name AS skill_name, us.score FROM UserSkills us JOIN Skills s ON us.skillId = s.id WHERE us.userId = @userId ORDER BY us.score DESC;`);
        res.status(200).json(skillsResult.recordset);
    } catch (error) {
        console.error('Lỗi khi lấy danh sách kỹ năng:', error);
        res.status(500).json({ message: 'Lỗi máy chủ nội bộ khi lấy kỹ năng.' });
    }
};

exports.searchStudents = async (req, res) => {
    if (req.user.role !== 'recruiter') {
        return res.status(403).json({ message: 'Chức năng này chỉ dành cho Nhà tuyển dụng.' });
    }
    const { skills } = req.body;
    if (!skills || !Array.isArray(skills) || skills.length === 0) {
        return res.status(400).json({ message: 'Vui lòng cung cấp ít nhất một tiêu chí kỹ năng.' });
    }

    try {
        const pool = await poolPromise;
        const request = pool.request();
        
        // Xây dựng một câu query an toàn và hiệu quả
        let subQueries = [];
        skills.forEach((skill, index) => {
            const skillNameParam = `skillName${index}`;
            const minScoreParam = `minScore${index}`;
            
            // Mỗi điều kiện sẽ kiểm tra sự tồn tại của một cặp skill-score thỏa mãn
            subQueries.push(`
                EXISTS (
                    SELECT 1
                    FROM UserSkills us_inner
                    JOIN Skills s_inner ON us_inner.skillId = s_inner.id
                    WHERE us_inner.userId = u.id
                      AND s_inner.name LIKE @${skillNameParam}
                      AND us_inner.score >= @${minScoreParam}
                )
            `);
            
            request.input(skillNameParam, sql.NVarChar, `%${skill.name}%`);
            request.input(minScoreParam, sql.Int, skill.minScore || 0);
        });

        // Ghép các điều kiện bằng 'AND' để tìm ứng viên có TẤT CẢ các kỹ năng yêu cầu
        const query = `
            SELECT DISTINCT u.id, u.name, u.avatarUrl, u.bio, u.githubUsername
            FROM Users u
            WHERE u.role = 'student' AND ${subQueries.join(' AND ')};
        `;

        const result = await request.query(query);
        res.status(200).json(result.recordset);

    } catch (error) {
        console.error('Lỗi khi tìm kiếm ứng viên:', error);
        res.status(500).json({ message: 'Lỗi máy chủ khi tìm kiếm.' });
    }
};

// ======================= PHIÊN BẢN AI THEO LỰA CHỌN B ============================
exports.analyzeRepo = async (req, res) => {
    //if (req.user.role !== 'student') {
    //    return res.status(403).json({ message: 'Forbidden' });
   // }
    const { repoFullName } = req.body;
    const { userId } = req.user;

    if (!repoFullName) {
        return res.status(400).json({ message: 'Tên đầy đủ của repository là bắt buộc.' });
    }

    try {
        const pool = await poolPromise;
        const tokenResult = await pool.request().input('userId', sql.Int, userId).query('SELECT githubAccessToken FROM Users WHERE id = @userId');
        const githubToken = tokenResult.recordset[0]?.githubAccessToken;
        if (!githubToken) return res.status(401).json({ message: 'Không tìm thấy access token GitHub.' });

        let repoContent = `Phân tích dự án có tên ${repoFullName}.\n\n`;
        const langResponse = await axios.get(`https://api.github.com/repos/${repoFullName}/languages`, { headers: { 'Authorization': `token ${githubToken}` } });
        repoContent += `--- Các ngôn ngữ chính: ${Object.keys(langResponse.data).join(', ')} ---\n\n`;
        
        try {
            const readmeResponse = await axios.get(`https://api.github.com/repos/${repoFullName}/contents/README.md`, { headers: { 'Authorization': `token ${githubToken}`, 'Accept': 'application/vnd.github.v3.raw' } });
            repoContent += `--- Nội dung README.md ---\n${readmeResponse.data}\n\n`;
        } catch (error) {
            repoContent += `--- Không có file README.md ---\n\n`;
        }

        const prompt = `Bạn là một chuyên gia đánh giá code. Phân tích dự án sau và trả về MỘT đối tượng JSON DUY NHẤT, không giải thích. Cấu trúc JSON: {"summary": "Tóm tắt dự án dưới 30 từ.", "overall_score": số từ 70-95, "strengths": ["điểm mạnh 1"], "weaknesses": ["điểm yếu 1"], "detected_skills": [{ "skill_name": "Tên skill", "score": số từ 70-95 }]}. Nội dung dự án: ${repoContent}`;
        
        const result = await model.generateContent(prompt);
        const response = result.response;
        // CÁCH LẤY KẾT QUẢ CỦA MODEL CŨ SẼ KHÁC
        const text = response.candidates[0].output; 
        
        let analysisResult;
        try {
            const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
            analysisResult = JSON.parse(cleanedText);
        } catch (e) {
            console.error("Lỗi khi parse JSON từ AI:", text);
            throw new Error("AI đã trả về một định dạng không hợp lệ.");
        }

        // Bước 5: Lưu kết quả vào CSDL
        const transaction = new sql.Transaction(pool);
        await transaction.begin();
        try {
            for (const skillItem of analysisResult.detected_skills) {
                // ... (logic MERGE vào CSDL giữ nguyên)
            }
            await transaction.commit();
        } catch (dbError) {
            await transaction.rollback();
            throw dbError;
        }
        
        // Bước 6: Gửi kết quả về cho Frontend
        res.status(200).json(analysisResult);
    } catch (error) {
        console.error(`Lỗi nghiêm trọng khi phân tích repo ${repoFullName}:`, error);
        res.status(500).json({ message: `Lỗi máy chủ khi phân tích repo: ${error.message}` });
    }
};
// =======================================================================================
exports.getPublicProfile = async (req, res) => {
    const { username } = req.params;
    try {
        const pool = await poolPromise;

        // Lấy thông tin cơ bản của user
        const userResult = await pool.request()
            .input('githubUsername', sql.NVarChar, username)
            .query('SELECT id, name, avatarUrl, bio, githubUsername FROM Users WHERE githubUsername = @githubUsername AND role = \'student\'');

        if (userResult.recordset.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy hồ sơ sinh viên này.' });
        }
        
        const userProfile = userResult.recordset[0];
        const userId = userProfile.id;

        // Lấy danh sách kỹ năng đã xác thực của user đó
        const [skillsResult, reposResponse, experiencesResult, educationResult] = await Promise.all([
            // Lấy skills
            pool.request().input('userId', sql.Int, userId).query(`
                SELECT s.name AS skill_name, us.score FROM UserSkills us
                JOIN Skills s ON us.skillId = s.id WHERE us.userId = @userId ORDER BY us.score DESC;
            `),
            // Lấy repos từ GitHub
            axios.get(`https://api.github.com/users/${username}/repos?sort=updated&per_page=10`),
            // LẤY KINH NGHIỆM LÀM VIỆC
            pool.request().input('userId', sql.Int, userId).query('SELECT * FROM WorkExperiences WHERE userId = @userId ORDER BY startDate DESC'),
            // LẤY HỌC VẤN
            pool.request().input('userId', sql.Int, userId).query('SELECT * FROM Education WHERE userId = @userId ORDER BY startDate DESC')
        ]);

        // Gộp tất cả dữ liệu và trả về một gói hoàn chỉnh
        res.status(200).json({
            profile: userProfile,
            skills: skillsResult.recordset,
            repos: reposResponse.data,
            experiences: experiencesResult.recordset, // <-- DỮ LIỆU MỚI
            education: educationResult.recordset      // <-- DỮ LIỆU MỚI
        });

    } catch (error) {
        console.error(`Lỗi khi lấy hồ sơ công khai cho ${username}:`, error);
        res.status(500).json({ message: 'Lỗi máy chủ khi tải hồ sơ.' });
    }
};
exports.getRecruiterStats = async (req, res) => {
    const { userId, role } = req.user;
    if (role !== 'recruiter') return res.status(403).json({ message: 'Forbidden' });

    try {
        const pool = await poolPromise;
        const request = pool.request().input('recruiterId', sql.Int, userId);
        
        // Chạy song song 3 câu query để tối ưu hiệu năng
        const [studentCountResult, jobCountResult, applicantCountResult] = await Promise.all([
            pool.request().query("SELECT COUNT(*) as total FROM Users WHERE role = 'student'"),
            request.query("SELECT COUNT(*) as total FROM Jobs WHERE recruiterId = @recruiterId"),
            request.query(`
                SELECT COUNT(ja.id) as total 
                FROM JobApplications ja
                JOIN Jobs j ON ja.jobId = j.id
                WHERE j.recruiterId = @recruiterId
            `)
        ]);

        res.status(200).json({
            totalStudents: studentCountResult.recordset[0].total,
            postedJobs: jobCountResult.recordset[0].total,
            totalApplicants: applicantCountResult.recordset[0].total
        });

    } catch (error) {
        console.error('Lỗi khi lấy recruiter stats:', error);
        res.status(500).json({ message: 'Lỗi máy chủ khi lấy dữ liệu thống kê.' });
    }
};


// --- HÀM CONTROLLER MỚI 2: LẤY JOBS CỦA NTD ---
exports.getRecruiterJobs = async (req, res) => {
    const { userId, role } = req.user;
    if (role !== 'recruiter') return res.status(403).json({ message: 'Forbidden' });
    
    try {
        // Gọi hàm service đã viết ở bước 2
        const jobs = await jobsService.findJobsByRecruiter(userId);
        res.status(200).json(jobs);
    } catch (error) {
        console.error('Lỗi khi lấy danh sách jobs của recruiter:', error);
        res.status(500).json({ message: 'Lỗi máy chủ khi lấy danh sách tin tuyển dụng.' });
    }
};

exports.getPublicStats = async (req, res) => {
    try {
        const pool = await poolPromise;
        
        const [jobCountResult, companyCountResult, studentCountResult] = await Promise.all([
            pool.request().query("SELECT COUNT(*) as total FROM Jobs"),
            pool.request().query("SELECT COUNT(*) as total FROM Users WHERE role = 'recruiter'"),
            pool.request().query("SELECT COUNT(*) as total FROM Users WHERE role = 'student'")
        ]);

        res.status(200).json({
            jobs: jobCountResult.recordset[0].total,
            companies: companyCountResult.recordset[0].total,
            students: studentCountResult.recordset[0].total
        });
    } catch (error) {
        console.error('Lỗi khi lấy public stats:', error);
        res.status(500).json({ message: 'Lỗi máy chủ khi lấy dữ liệu thống kê.' });
    }
};
exports.getTrendingSkills = async (req, res) => {
    try {
        const pool = await poolPromise;
        
        // Câu query này đếm số lần xuất hiện của mỗi skill trong bảng JobSkills,
        // sắp xếp theo thứ tự giảm dần và chỉ lấy top 20 skill hot nhất.
        const query = `
            SELECT TOP 20 s.name, COUNT(js.skillId) as frequency
            FROM JobSkills js
            JOIN Skills s ON js.skillId = s.id
            GROUP BY s.name
            ORDER BY frequency DESC;
        `;

        const result = await pool.request().query(query);
        
        // Chỉ trả về mảng các tên skill
        const skillNames = result.recordset.map(record => record.name);

        res.status(200).json(skillNames);

    } catch (error) {
        console.error('Lỗi khi lấy trending skills:', error);
        res.status(500).json({ message: 'Lỗi máy chủ khi lấy dữ liệu kỹ năng.' });
    }
};
exports.getStudentApplications = async (req, res) => {
    const { userId, role } = req.user;
    if (role !== 'student') return res.status(403).json({ message: 'Forbidden' });

    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('studentId', sql.Int, userId)
            .query(`
                SELECT 
                    j.id as jobId,
                    j.title,
                    u.name as companyName,
                    ja.status,
                    ja.appliedAt
                FROM JobApplications ja
                JOIN Jobs j ON ja.jobId = j.id
                JOIN Users u ON j.recruiterId = u.id
                WHERE ja.studentId = @studentId
                ORDER BY ja.appliedAt DESC;
            `);
        
        res.status(200).json(result.recordset);
    } catch (error) {
        console.error('Lỗi khi lấy danh sách ứng tuyển của sinh viên:', error);
        res.status(500).json({ message: 'Lỗi máy chủ.' });
    }
};
exports.getApplicantsForJob = async (req, res) => {
    const { userId, role } = req.user;
    const { jobId } = req.params;
    if (role !== 'recruiter') return res.status(403).json({ message: 'Forbidden' });

    try {
        const pool = await poolPromise;
        // Kiểm tra xem job này có đúng là của NTD này không
        const ownerCheck = await pool.request().input('jobId', sql.Int, jobId).input('recruiterId', sql.Int, userId).query('SELECT id FROM Jobs WHERE id = @jobId AND recruiterId = @recruiterId');
        if (ownerCheck.recordset.length === 0) {
            return res.status(403).json({ message: 'Không có quyền xem ứng viên của tin này.' });
        }
        
        const result = await pool.request().input('jobId', sql.Int, jobId).query(`
            SELECT u.id, u.name, u.avatarUrl, u.githubUsername, ja.appliedAt, ja.status
            FROM JobApplications ja
            JOIN Users u ON ja.studentId = u.id
            WHERE ja.jobId = @jobId ORDER BY ja.appliedAt DESC;
        `);
        res.status(200).json(result.recordset);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi máy chủ.' });
    }
};
exports.getPublicCompanyProfile = async (req, res) => {
    try {
        const { slug } = req.params;
        const pool = await poolPromise;

        // Query 1: Lấy thông tin chi tiết công ty
        const companyResult = await pool.request()
            .input('slug', sql.NVarChar, slug)
            .query('SELECT * FROM Companies WHERE slug = @slug');

        if (companyResult.recordset.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy công ty này.' });
        }
        const companyProfile = companyResult.recordset[0];

        // Query 2: Lấy tất cả các job đang hoạt động của công ty đó
        const jobsResult = await pool.request()
            .input('companyId', sql.Int, companyProfile.id)
            .query(`
                SELECT j.id, j.title, j.location, j.salary, j.jobType, j.createdAt as postedDate
                FROM Jobs j
                WHERE j.companyId = @companyId
                ORDER BY j.createdAt DESC;
            `);
        
        // Gộp dữ liệu và trả về
        res.status(200).json({
            profile: companyProfile,
            jobs: jobsResult.recordset
        });

    } catch (error) {
        console.error('Lỗi khi lấy hồ sơ công ty:', error);
        res.status(500).json({ message: 'Lỗi máy chủ.' });
    }
};
exports.getAllCompanies = async (req, res) => {
    try {
        const pool = await poolPromise;
        // Lấy thông tin công ty và đếm số job đang có
        const result = await pool.request().query(`
            SELECT 
                c.id, c.name, c.slug, c.logoUrl, c.tagline,
                (SELECT COUNT(j.id) FROM Jobs j WHERE j.companyId = c.id) as jobCount
            FROM Companies c
            ORDER BY c.name;
        `);
        res.status(200).json(result.recordset);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi máy chủ.' });
    }
};