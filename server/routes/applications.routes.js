// File: server/routes/applications.routes.js
const express = require('express');
const router = express.Router();
const applicationsController = require('../controllers/applications.controller');
const authenticateToken = require('../middleware/authenticateToken');

// Tất cả route trong đây đều cần xác thực
router.use(authenticateToken);

// Cập nhật trạng thái application (chỉ Recruiter)
router.patch('/:applicationId/status', applicationsController.updateApplicationStatus);

module.exports = router;