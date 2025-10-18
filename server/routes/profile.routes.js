// File: server/routes/profile.routes.js

const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profile.controller.js');
const apiController = require('../controllers/api.controller.js'); // Vẫn cần cho getPublicProfile
const authenticateToken = require('../middleware/authenticateToken.js');
// Áp dụng middleware xác thực cho tất cả các route trong file này
router.use(authenticateToken);

// === API cho Kinh nghiệm làm việc (Work Experiences) ===
router.get('/experience/me', profileController.getWorkExperiences);
router.post('/experience', profileController.addWorkExperience);
router.put('/experience/:id', profileController.updateWorkExperience);
router.delete('/experience/:id', profileController.deleteWorkExperience);

// API cho Học vấn
router.get('/education/me', profileController.getEducationHistory);
router.post('/education', profileController.addEducationHistory);
router.put('/education/:id', profileController.updateEducationHistory);
router.delete('/education/:id', profileController.deleteEducationHistory);

module.exports = router;