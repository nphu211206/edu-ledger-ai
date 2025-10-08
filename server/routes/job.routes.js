// /server/routes/job.routes.js
const express = require('express');
const router = express.Router();
const jobController = require('../controllers/job.controller');
const authenticateToken = require('../middleware/authenticateToken');

// Route để lấy danh sách tất cả việc làm (công khai, ai cũng xem được)
// GET http://localhost:3800/jobs/
router.get('/', jobController.getAllJobs);

// Route để đăng một tin tuyển dụng mới (yêu cầu phải đăng nhập với vai trò NTD)
// POST http://localhost:3800/jobs/
router.post('/', authenticateToken, jobController.createJob);

// Các route khác như /:id (xem chi tiết), /:id/apply (ứng tuyển)... sẽ được thêm ở đây

module.exports = router;