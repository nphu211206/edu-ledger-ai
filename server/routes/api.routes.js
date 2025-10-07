// /server/routes/api.routes.js
// Định nghĩa các endpoints của API

const express = require('express');
const router = express.Router();
// CHỈ KHAI BÁO MỘT LẦN DUY NHẤT Ở ĐÂY
const apiController = require('../controllers/api.controller'); 
const authenticateToken = require('../middleware/authenticateToken');

// Dùng middleware "gác cổng" cho tất cả các route bên dưới
router.use(authenticateToken);

// Các route đã có
router.get('/me', apiController.getMe);
router.get('/repos', apiController.getRepos);
router.post('/analyze-repo', apiController.analyzeRepo);

// Route mới cho việc tìm kiếm
router.post('/recruiter/search', apiController.searchStudents);
router.get('/skills', apiController.getSkills);


module.exports = router;