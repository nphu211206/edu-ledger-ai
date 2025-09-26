// /server/middleware/authenticateToken.js
// "Người gác cổng" cho các API của chúng ta

const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET;

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Lấy token từ header "Bearer TOKEN"

    if (token == null) {
        return res.status(401).json({ message: 'Lỗi xác thực: Yêu cầu token.' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'Lỗi xác thực: Token không hợp lệ.' });
        }
        // Lưu thông tin user đã giải mã vào request để các hàm xử lý sau có thể dùng
        req.user = user; 
        next(); // Cho phép đi tiếp
    });
};

module.exports = authenticateToken;