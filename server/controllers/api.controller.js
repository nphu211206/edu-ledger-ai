// /server/controllers/api.controller.js
// "Nhà kho" chứa logic xử lý để lấy dữ liệu

const axios = require('axios');
const { sql, poolPromise } = require('../config/db');

// Lấy thông tin của chính người dùng đã đăng nhập
exports.getMe = async (req, res) => {
    try {
        const pool = await poolPromise;
        // req.user.userId được lấy từ token đã được middleware giải mã
        const userResult = await pool.request()
            .input('userId', sql.Int, req.user.userId)
            .query('SELECT id, name, avatarUrl, bio, role, githubUsername FROM Users WHERE id = @userId');

        if (userResult.recordset.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy người dùng' });
        }
        res.json(userResult.recordset[0]);
    } catch (error) {
        console.error('Lỗi khi lấy thông tin /api/me:', error);
        res.status(500).json({ message: 'Lỗi máy chủ' });
    }
};

// Lấy danh sách repo của sinh viên
exports.getRepos = async (req, res) => {
    // Chỉ sinh viên mới có repo
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
            return res.status(404).json({ message: 'Không tìm thấy access token GitHub' });
        }
        
        const reposResponse = await axios.get('https://api.github.com/user/repos?sort=updated&per_page=10', {
            headers: { 'Authorization': `token ${githubToken}` }
        });
        
        res.json(reposResponse.data);
    } catch (error) {
        console.error('Lỗi khi lấy repo:', error);
        res.status(500).json({ message: 'Lỗi máy chủ khi lấy repo' });
    }
};
// HÀM MỚI: Phân tích một repo cụ thể
exports.analyzeRepo = async (req, res) => {
    // Chỉ sinh viên mới được phân tích repo
    if (req.user.role !== 'student') {
        return res.status(403).json({ message: 'Forbidden' });
    }

    const { repoFullName } = req.body; // Ví dụ: "nphu211206/edu-ledger-ai"
    const { userId } = req.user;

    if (!repoFullName) {
        return res.status(400).json({ message: 'Tên đầy đủ của repository là bắt buộc.' });
    }

    try {
        const pool = await poolPromise;
        // Lấy Github token để gọi API của Github
        const tokenResult = await pool.request()
            .input('userId', sql.Int, userId)
            .query('SELECT githubAccessToken FROM Users WHERE id = @userId');
        const githubToken = tokenResult.recordset[0]?.githubAccessToken;

        if (!githubToken) {
            return res.status(404).json({ message: 'Không tìm thấy access token GitHub' });
        }

        // Gọi API GitHub để lấy các ngôn ngữ trong repo
        const langResponse = await axios.get(`https://api.github.com/repos/${repoFullName}/languages`, {
            headers: { 'Authorization': `token ${githubToken}` }
        });
        const languages = Object.keys(langResponse.data); // Lấy ra mảng các ngôn ngữ, vd: ['JavaScript', 'HTML', 'CSS']

        // ==========================================================
        // ĐÂY LÀ PHẦN "GIẢ LẬP AI" - SAU NÀY SẼ THAY BẰNG AI THẬT
        // Hiện tại, chúng ta sẽ giả lập kết quả phân tích
        const analysisResult = {
            strengths: [`Sử dụng tốt ${languages.join(', ')}`, "Cấu trúc project rõ ràng."],
            weaknesses: ["Cần thêm unit test để đảm bảo chất lượng."],
            detected_skills: languages.map(lang => ({ skill_name: lang, score: Math.floor(Math.random() * (95 - 75 + 1) + 75) })), // Random điểm từ 75-95
            overall_score: 83,
            summary: `Đây là một project tốt, thể hiện kỹ năng về ${languages.join(', ')}.`
        };
        // ==========================================================

        // Lưu kết quả phân tích vào CSDL (bảng UserSkills)
        for (const skillItem of analysisResult.detected_skills) {
            // Tìm hoặc tạo mới skill trong bảng Skills
            let skillResult = await pool.request().input('name', sql.NVarChar, skillItem.skill_name).query('SELECT id FROM Skills WHERE name = @name');
            let skillId;
            if (skillResult.recordset.length === 0) {
                let newSkill = await pool.request().input('name', sql.NVarChar, skillItem.skill_name).query("INSERT INTO Skills (name, category) OUTPUT INSERTED.id VALUES (@name, 'Programming Language')");
                skillId = newSkill.recordset[0].id;
            } else {
                skillId = skillResult.recordset[0].id;
            }

            // Dùng MERGE để cập nhật hoặc thêm mới điểm kỹ năng
            const verificationSourceId = `GitHub Repo: ${repoFullName}`;
            await pool.request()
                .input('userId', sql.Int, userId)
                .input('skillId', sql.Int, skillId)
                .input('score', sql.Int, skillItem.score)
                .input('confidenceLevel', sql.Decimal(5, 2), 0.90) // Mức độ tự tin giả lập
                .input('verificationSourceType', sql.NVarChar, 'GITHUB_REPO')
                .input('verificationSourceId', sql.NVarChar, verificationSourceId)
                .query(`
                    MERGE UserSkills AS target
                    USING (VALUES (@userId, @skillId, @verificationSourceType, @verificationSourceId)) AS source (userId, skillId, verificationSourceType, verificationSourceId)
                    ON  target.userId = source.userId AND 
                        target.skillId = source.skillId AND 
                        target.verificationSourceType = source.verificationSourceType AND
                        target.verificationSourceId = source.verificationSourceId
                    WHEN MATCHED THEN
                        UPDATE SET score = @score, lastVerifiedAt = GETUTCDATE()
                    WHEN NOT MATCHED THEN
                        INSERT (userId, skillId, score, confidenceLevel, verificationSourceType, verificationSourceId)
                        VALUES (@userId, @skillId, @score, @confidenceLevel, @verificationSourceType, @verificationSourceId);
                `);
        }
        
        res.json(analysisResult);

    } catch (error) {
        console.error('Lỗi khi phân tích repo:', error.response?.data || error.message);
        res.status(500).json({ message: 'Lỗi máy chủ khi phân tích repo' });
    }
};
exports.searchStudents = async (req, res) => {
    if (req.user.role !== 'recruiter') {
        return res.status(403).json({ message: 'Truy cập bị từ chối. Chỉ dành cho Nhà tuyển dụng.' });
    }

    const { skills } = req.body;
    if (!skills || !Array.isArray(skills) || skills.length === 0) {
        return res.status(400).json({ message: 'Vui lòng cung cấp ít nhất một tiêu chí kỹ năng.' });
    }

    try {
        const pool = await poolPromise;
        
        // Xây dựng một câu query phức tạp và an toàn
        let skillConditions = [];
        const request = pool.request();
        
        skills.forEach((skill, index) => {
            const skillNameParam = `skillName${index}`;
            const minScoreParam = `minScore${index}`;
            
            skillConditions.push(`(s.name LIKE @${skillNameParam} AND us.score >= @${minScoreParam})`);
            
            request.input(skillNameParam, sql.NVarChar, `%${skill.name}%`);
            request.input(minScoreParam, sql.Int, skill.minScore || 70); // Mặc định điểm 70 nếu không có
        });

        // Câu query này sẽ tìm các user có TẤT CẢ các kỹ năng được yêu cầu
        const query = `
            SELECT 
                u.id, u.name, u.avatarUrl, u.bio, u.githubUsername
            FROM Users u
            WHERE u.id IN (
                SELECT us.userId
                FROM UserSkills us
                JOIN Skills s ON us.skillId = s.id
                WHERE ${skillConditions.join(' OR ')}
                GROUP BY us.userId
                HAVING COUNT(DISTINCT s.id) >= ${skills.length}
            ) AND u.role = 'student';
        `;

        const result = await request.query(query);
        res.json(result.recordset);

    } catch (error) {
        console.error('Lỗi khi tìm kiếm ứng viên:', error);
        res.status(500).json({ message: 'Lỗi máy chủ' });
    }
};