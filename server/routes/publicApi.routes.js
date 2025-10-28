// File: server/routes/publicApi.routes.js
// CỔNG CÔNG KHAI TỐI THƯỢNG - ĐÃ CẬP NHẬT

const express = require('express');
const router = express.Router();
const apiController = require('../controllers/api.controller.js');
const jobsController = require('../controllers/jobs.controller.js'); // <-- Cần jobs controller

// === API THỐNG KÊ & TRENDING ===
router.get('/stats', apiController.getPublicStats);
router.get('/skills/trending', apiController.getTrendingSkills);

// === API VIỆC LÀM (CÔNG KHAI) ===
router.get('/jobs', jobsController.getAllJobs);      // Lấy danh sách việc làm (có filter, pagination)
router.get('/jobs/:id', jobsController.getJobById);  // Lấy chi tiết việc làm

// === API CÔNG TY (CÔNG KHAI) ===
router.get('/companies', apiController.getAllCompanies);        // Lấy danh sách công ty
router.get('/companies/:slug', apiController.getPublicCompanyProfile); // Lấy hồ sơ công ty theo slug

// === API HỒ SƠ SINH VIÊN (CÔNG KHAI - nếu muốn) ===
// Nếu bạn muốn ai cũng xem được profile mà không cần đăng nhập, hãy đặt nó ở đây
// router.get('/profile/:username', apiController.getPublicProfile);
// Lưu ý: Nếu đặt ở đây, bạn cần bỏ authenticateToken trong controller getPublicProfile

module.exports = router;