// File: server/routes/jobs.routes.js
// PHIÊN BẢN TỐI THƯỢNG - Đầy đủ CRUD (Protected)

const express = require('express');
const router = express.Router();
const jobsController = require('../controllers/jobs.controller.js'); // Import controller đã cập nhật
const authenticateToken = require('../middleware/authenticateToken.js'); // Middleware xác thực

// --- CÁC ROUTE CÔNG KHAI (ĐÃ CHUYỂN SANG publicApiRoutes) ---
// router.get('/', jobsController.getAllJobs); // Không dùng ở đây nữa
// router.get('/:id', jobsController.getJobById); // Không dùng ở đây nữa

// --- CÁC ROUTE YÊU CẦU XÁC THỰC ---
// Áp dụng middleware xác thực cho tất cả các route bên dưới
router.use(authenticateToken);

// POST /api/jobs -> Tạo Job mới (chỉ Recruiter)
router.post('/', jobsController.createJob);

// POST /api/jobs/:jobId/apply -> Sinh viên ứng tuyển
router.post('/:jobId/apply', jobsController.applyToJob);

// PUT /api/jobs/:id -> Cập nhật Job (chỉ Recruiter owner)
router.put('/:id', jobsController.updateJob);

// PATCH /api/jobs/:id/status -> Thay đổi trạng thái Job (chỉ Recruiter owner)
router.patch('/:id/status', jobsController.changeJobStatus);

// DELETE /api/jobs/:id -> Xóa Job (chỉ Recruiter owner)
router.delete('/:id', jobsController.deleteJob);

module.exports = router;

console.log("✅ jobs.routes.js (Tối Thượng - CRUD Protected v1.0) loaded.");