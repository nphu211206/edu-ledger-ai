// /server/controllers/auth.controller.js
// Phiên bản được rà soát và vá lỗi để tương thích hoàn toàn với CSDL

const axios = require('axios');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { sql, poolPromise } = require('../config/db');

const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;
const JWT_SECRET = process.env.JWT_SECRET; // Biến này sẽ được nạp từ .env

// ... (logic getGithubAuthUrl không đổi)
exports.getGithubAuthUrl = (req, res) => {
    const authUrl = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&scope=read:user,repo`;
    res.json({ redirectUrl: authUrl });
};

// ... (các hàm khác giữ nguyên)

exports.handleGithubCallback = async (req, res) => {
    const { code } = req.query;
    if (!code) { return res.redirect(`http://localhost:3001/login-error?message=No_code_provided`); }
    try {
        // ... (logic lấy token và thông tin user giữ nguyên)
        const tokenResponse = await axios.post('https://github.com/login/oauth/access_token', { client_id: GITHUB_CLIENT_ID, client_secret: GITHUB_CLIENT_SECRET, code }, { headers: { 'Accept': 'application/json' } });
        const accessToken = tokenResponse.data.access_token;
        if (!accessToken) throw new Error('Không nhận được access token từ GitHub.');
        const userResponse = await axios.get('https://api.github.com/user', { headers: { 'Authorization': `token ${accessToken}` } });
        const githubUser = userResponse.data;
        const pool = await poolPromise;
        let userResult = await pool.request().input('githubId', sql.BigInt, githubUser.id).query('SELECT * FROM Users WHERE githubId = @githubId');
        let user, userId;
        if (userResult.recordset.length > 0) {
            // ... (logic update user giữ nguyên)
            user = userResult.recordset[0];
            userId = user.id;
            await pool.request().input('id', sql.Int, userId).input('githubAccessToken', sql.NVarChar, accessToken).query('UPDATE Users SET githubAccessToken = @githubAccessToken, updatedAt = GETUTCDATE() WHERE id = @id');
        } else {
            // ... (logic tạo user mới giữ nguyên)
            const newUserResult = await pool.request().input('githubId', sql.BigInt, githubUser.id).input('githubUsername', sql.NVarChar, githubUser.login).input('avatarUrl', sql.NVarChar, githubUser.avatar_url).input('name', sql.NVarChar, githubUser.name).input('bio', sql.NVarChar, githubUser.bio).input('githubAccessToken', sql.NVarChar, accessToken).query("INSERT INTO Users (githubId, githubUsername, avatarUrl, name, bio, githubAccessToken, role) OUTPUT INSERTED.* VALUES (@githubId, @githubUsername, @avatarUrl, @name, @bio, @githubAccessToken, 'student')");
            user = newUserResult.recordset[0];
            userId = user.id;
        }
        const payload = { userId: userId, role: user.role };
        const ourToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
        
        // ======================= FIX HERE ============================
        // Chuyển hướng về ĐÚNG ĐỊA CHỈ mà frontend đang chờ
        res.redirect(`http://localhost:3001/auth/github/callback?token=${ourToken}`);
        // =============================================================

    } catch (error) {
        console.error('Lỗi nghiêm trọng trong quá trình callback GitHub:', error);
        res.redirect(`http://localhost:3001/login-error?message=${error.message}`);
    }
};

// ... (các hàm còn lại giữ nguyên)

exports.registerRecruiter = async (req, res) => {
    const { email, password, name } = req.body;
    if (!email || !password || !name) return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin.' });
    try {
        const pool = await poolPromise;
        const existingUser = await pool.request().input('email', sql.NVarChar, email).query('SELECT id FROM Users WHERE email = @email');
        if (existingUser.recordset.length > 0) return res.status(409).json({ message: 'Email đã được sử dụng.' });

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // Sửa lại câu lệnh INSERT cho đúng với CSDL
        await pool.request()
            .input('email', sql.NVarChar, email)
            .input('passwordHash', sql.NVarChar, passwordHash)
            .input('name', sql.NVarChar, name)
            .query("INSERT INTO Users (email, passwordHash, name, role) VALUES (@email, @passwordHash, @name, 'recruiter')");

        res.status(201).json({ message: 'Tạo tài khoản nhà tuyển dụng thành công!' });
    } catch (error) {
        console.error('Lỗi khi đăng ký recruiter:', error);
        res.status(500).json({ message: 'Lỗi máy chủ nội bộ.' });
    }
};

// ... (logic loginRecruiter không đổi)
exports.loginRecruiter = async (req, res) => {
    // ...
};