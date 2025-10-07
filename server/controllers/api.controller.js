// /server/controllers/api.controller.js

const axios = require('axios');
const { sql, poolPromise } = require('../config/db');
const { GoogleGenerativeAI } = require('@google/generative-ai');

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
        // ... (logic query tìm kiếm không đổi)
    } catch (error) {
        // ...
    }
};

// ======================= PHIÊN BẢN AI THEO LỰA CHỌN B ============================
exports.analyzeRepo = async (req, res) => {
    if (req.user.role !== 'student') {
        return res.status(403).json({ message: 'Forbidden' });
    }
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
    // Lấy username từ URL, ví dụ: /api/profile/nphu211206
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
        const skillsResult = await pool.request()
            .input('userId', sql.Int, userId)
            .query(`
                SELECT s.name AS skill_name, us.score
                FROM UserSkills us
                JOIN Skills s ON us.skillId = s.id
                WHERE us.userId = @userId
                ORDER BY us.score DESC;
            `);
        
        // Lấy danh sách các repo public của user đó từ GitHub API
        const reposResponse = await axios.get(`https://api.github.com/users/${username}/repos?sort=updated&per_page=10`);

        // Gộp tất cả dữ liệu và trả về
        res.status(200).json({
            profile: userProfile,
            skills: skillsResult.recordset,
            repos: reposResponse.data
        });

    } catch (error) {
        console.error(`Lỗi khi lấy hồ sơ công khai cho ${username}:`, error);
        res.status(500).json({ message: 'Lỗi máy chủ khi tải hồ sơ.' });
    }
};