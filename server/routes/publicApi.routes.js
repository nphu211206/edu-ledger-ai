// File: server/routes/publicApi.routes.js
// CỔNG CÔNG KHAI TỐI THƯỢNG

const express = require('express');
const router = express.Router();
const apiController = require('../controllers/api.controller.js');
const jobsController = require('../controllers/jobs.controller.js');

// === API THỐNG KÊ & TRENDING ===
router.get('/stats', apiController.getPublicStats);
router.get('/skills/trending', apiController.getTrendingSkills);

// === API VIỆC LÀM ===
router.get('/jobs', jobsController.getAllJobs);
router.get('/jobs/:id', jobsController.getJobById);

// === API CÔNG TY ===
router.get('/companies', apiController.getAllCompanies);
router.get('/companies/:slug', apiController.getPublicCompanyProfile);

module.exports = router;