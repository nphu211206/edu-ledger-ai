// /server/controllers/auth.controller.js
const axios = require('axios');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { sql, poolPromise } = require('../config/db');
const authService = require('../services/auth.service');

const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;
const JWT_SECRET = process.env.JWT_SECRET;

// Hàm này không đổi
exports.getGithubAuthUrl = (req, res) => {
    const authUrl = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&scope=read:user,repo`;
    // Chuyển hướng trực tiếp thay vì trả về JSON
    res.redirect(authUrl);
};

// Hàm này không đổi
exports.handleGithubCallback = async (req, res) => {
    const { code } = req.query;
    if (!code) { return res.redirect(`http://localhost:3001/login-error?message=No_code_provided`); }
    try {
        const tokenResponse = await axios.post('https://github.com/login/oauth/access_token', { client_id: GITHUB_CLIENT_ID, client_secret: GITHUB_CLIENT_SECRET, code }, { headers: { 'Accept': 'application/json' } });
        const accessToken = tokenResponse.data.access_token;
        if (!accessToken) throw new Error('Không nhận được access token từ GitHub.');
        
        const userResponse = await axios.get('https://api.github.com/user', { headers: { 'Authorization': `token ${accessToken}` } });
        const githubUser = userResponse.data;
        
        const pool = await poolPromise;
        let userResult = await pool.request().input('githubId', sql.BigInt, githubUser.id).query('SELECT * FROM Users WHERE githubId = @githubId');
        
        let user;
        if (userResult.recordset.length > 0) {
            user = userResult.recordset[0];
            await pool.request().input('id', sql.Int, user.id).input('githubAccessToken', sql.NVarChar, accessToken).input('avatarUrl', sql.NVarChar, githubUser.avatar_url).input('name', sql.NVarChar, githubUser.name).input('bio', sql.NVarChar, githubUser.bio).query('UPDATE Users SET githubAccessToken = @githubAccessToken, avatarUrl = @avatarUrl, name = @name, bio = @bio, updatedAt = GETUTCDATE() WHERE id = @id');
            // Cập nhật lại thông tin user để payload token luôn mới nhất
            user.name = githubUser.name;
            user.avatarUrl = githubUser.avatar_url;
        } else {
            const newUserResult = await pool.request().input('githubId', sql.BigInt, githubUser.id).input('githubUsername', sql.NVarChar, githubUser.login).input('avatarUrl', sql.NVarChar, githubUser.avatar_url).input('name', sql.NVarChar, githubUser.name).input('bio', sql.NVarChar, githubUser.bio).input('githubAccessToken', sql.NVarChar, accessToken).query("INSERT INTO Users (githubId, githubUsername, avatarUrl, name, bio, githubAccessToken, role) OUTPUT INSERTED.* VALUES (@githubId, @githubUsername, @avatarUrl, @name, @bio, @githubAccessToken, 'student')");
            user = newUserResult.recordset[0];
        }

        const payload = { 
            userId: user.id, 
            role: user.role,
            name: user.name, // Thêm name và avatar vào token
            avatarUrl: user.avatarUrl,
            githubUsername: user.githubUsername 
        };
        const ourToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
        
        res.redirect(`http://localhost:3001/auth/github/callback?token=${ourToken}`);

    } catch (error) {
        console.error('Lỗi nghiêm trọng trong quá trình callback GitHub:', error);
        res.redirect(`http://localhost:3001/login-error?message=${error.message}`);
    }
};

// Hàm này không đổi
exports.registerRecruiter = async (req, res) => {
    const { email, password, fullName, companyName } = req.body;
    
    if (!email || !password || !fullName || !companyName) {
        return res.status(400).json({ message: 'Vui lòng điền đầy đủ tất cả các trường.' });
    }

    try {
        // Ủy quyền toàn bộ logic phức tạp cho service
        await authService.registerRecruiterAndCompany({ fullName, email, password, companyName });
        res.status(201).json({ message: 'Tạo tài khoản và hồ sơ công ty thành công!' });
    } catch (error) {
        // Bắt lỗi từ service và trả về cho client một cách an toàn
        if (error.message.includes('đã được sử dụng') || error.message.includes('đã tồn tại')) {
            return res.status(409).json({ message: error.message }); // 409 Conflict
        }
        res.status(500).json({ message: 'Lỗi máy chủ nội bộ. Không thể hoàn tất đăng ký.' });
    }
};


// ======================= PHIÊN BẢN HOÀN CHỈNH ============================
exports.loginRecruiter = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        // Luôn trả về câu trả lời cho client
        return res.status(400).json({ message: 'Vui lòng cung cấp email và mật khẩu.' });
    }

    try {
        const pool = await poolPromise;
        const userResult = await pool.request()
            .input('email', sql.NVarChar, email)
            .query("SELECT * FROM Users WHERE email = @email AND role = 'recruiter'");

        if (userResult.recordset.length === 0) {
            // Luôn trả về câu trả lời cho client
            return res.status(401).json({ message: 'Email hoặc mật khẩu không chính xác.' });
        }

        const user = userResult.recordset[0];

        // Dùng bcrypt để so sánh mật khẩu nhập vào với hash trong CSDL
        const isMatch = await bcrypt.compare(password, user.passwordHash);

        if (!isMatch) {
            // Luôn trả về câu trả lời cho client
            return res.status(401).json({ message: 'Email hoặc mật khẩu không chính xác.' });
        }
        
        // Nếu mật khẩu khớp, tạo JWT token
        const payload = {
            userId: user.id,
            role: user.role,
            name: user.name,
            avatarUrl: user.avatarUrl // Dù NTD có thể chưa có, nhưng vẫn thêm vào cho nhất quán
        };

        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

        // Gửi token về cho client
        res.status(200).json({ token });

    } catch (error) {
        console.error('Lỗi khi đăng nhập recruiter:', error);
        // Luôn trả về câu trả lời cho client, kể cả khi có lỗi 500
        res.status(500).json({ message: 'Lỗi máy chủ nội bộ.' });
    }
};
// =========================================================================