// /server/routes/auth.routes.js
// Định nghĩa các endpoints liên quan đến xác thực

const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');

// GitHub Routes
router.get('/github', authController.getGithubAuthUrl);
router.get('/github/callback', authController.handleGithubCallback);

// Recruiter Routes
router.post('/recruiter/register', authController.registerRecruiter);
router.post('/recruiter/login', authController.loginRecruiter);

module.exports = router;