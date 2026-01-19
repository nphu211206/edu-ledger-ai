// File: server/routes/misc.api.routes.js
const express = require('express');
const router = express.Router();
const apiController = require('../controllers/api.controller.js');
const authenticateToken = require('../middleware/authenticateToken.js');
// === API CÔNG KHAI ===
router.get('/stats', apiController.getPublicStats);
router.get('/skills/trending', apiController.getTrendingSkills);

// === API CẦN XÁC THỰC ===
router.use(authenticateToken);
router.get('/me', apiController.getMe);
router.get('/repos', apiController.getRepos);
router.get('/skills', apiController.getSkills);
router.post('/analyze-repo', apiController.analyzeRepo);
router.get('/student/applications', apiController.getStudentApplications);
router.post('/recruiter/search', apiController.searchStudents);
router.get('/recruiter/stats', apiController.getRecruiterStats);
router.get('/recruiter/jobs', apiController.getRecruiterJobs);
router.get('/jobs/:jobId/applicants', apiController.getApplicantsForJob);

module.exports = router;