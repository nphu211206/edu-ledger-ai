// File: server/routes/user.routes.js
// PHIÊN BẢN "BẤT TỬ" - ĐỊNH NGHĨA LẠI TOÀN BỘ CÁNH CỔNG

const express = require('express');
const router = express.Router();
const apiController = require('../controllers/api.controller'); 
const jobsController = require('../controllers/jobs.controller');
const authenticateToken = require('../middleware/authenticateToken');
const applicationsController = require('../controllers/applications.controller'); 

// "NGƯỜI GÁC CỔNG" BẢO VỆ TOÀN BỘ CÁC ROUTE BÊN DƯỚI
router.use(authenticateToken);

// === API LIÊN QUAN ĐẾN USER HIỆN TẠI ===
router.get('/me', apiController.getMe);
router.get('/repos', apiController.getRepos);
router.get('/skills', apiController.getSkills);
router.post('/analyze-repo', apiController.analyzeRepo);
router.get('/student/applications', apiController.getStudentApplications);

// === API HÀNH ĐỘNG CỦA NTD ===
router.post('/recruiter/search', apiController.searchStudents);
router.get('/recruiter/stats', apiController.getRecruiterStats);
router.get('/recruiter/jobs', apiController.getRecruiterJobs);
router.get('/jobs/:jobId/applicants', apiController.getApplicantsForJob);
router.patch('/applications/:applicationId/status', applicationsController.updateApplicationStatus);
// ======================================================================
// === CÁNH CỔNG BỊ LÃNG QUÊN ĐÃ ĐƯỢC KIẾN TẠO LẠI ĐÚNG CHỖ ===
router.post('/jobs', jobsController.createJob); 
// ======================================================================

// === API HÀNH ĐỘNG CỦA SINH VIÊN ===
router.post('/jobs/:jobId/apply', jobsController.applyToJob);

// === API HỒ SƠ CÔNG KHAI (vẫn cần token để xem) ===
// Lưu ý: Route này nằm trong user.routes.js có nghĩa là chỉ người dùng đăng nhập mới xem được profile của người khác.
// Nếu muốn public hoàn toàn, nó phải được chuyển sang publicApi.routes.js
router.get('/profile/:username', apiController.getPublicProfile);

module.exports = router;