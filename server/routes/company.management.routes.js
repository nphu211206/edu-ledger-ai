// File: server/routes/company.management.routes.js
const express = require('express');
const router = express.Router();
const companyController = require('../controllers/company.management.controller');
const authenticateToken = require('../middleware/authenticateToken');

// Áp dụng middleware xác thực cho tất cả route quản lý công ty
router.use(authenticateToken);

// Lấy thông tin công ty của NTD đang đăng nhập
router.get('/', companyController.getMyCompanyProfile);

// Cập nhật thông tin công ty của NTD đang đăng nhập
router.put('/', companyController.updateMyCompanyProfile);

module.exports = router;