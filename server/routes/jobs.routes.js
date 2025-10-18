// File: server/routes/jobs.routes.js
// PHIÊN BẢN HỢP NHẤT - "TẤT CẢ TRONG MỘT"

const express = require('express');
const router = express.Router();
const jobsController = require('../controllers/jobs.controller.js');
const authenticateToken = require('../middleware/authenticateToken.js');

// === CÁC ROUTE CÔNG KHAI (KHÔNG CẦN TOKEN) ===
router.get('/', jobsController.getAllJobs);       // Lấy danh sách việc làm
router.get('/:id', jobsController.getJobById);   // Lấy chi tiết một việc làm

// === CÁC ROUTE ĐƯỢC BẢO VỆ (CẦN TOKEN) ===
// Chỉ những route này mới đi qua "người gác cổng" authenticateToken

// Route tạo Job mới (chỉ dành cho NTD đã đăng nhập)
router.post('/', authenticateToken, jobsController.createJob);

// Route ứng tuyển (chỉ dành cho Sinh viên đã đăng nhập)
router.post('/:jobId/apply', authenticateToken, jobsController.applyToJob);

module.exports = router;