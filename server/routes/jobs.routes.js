// File: server/routes/jobs.routes.js
// Sửa lại theo cú pháp CommonJS

const express = require('express');
const jobsController = require('../controllers/jobs.controller.js');
const authenticateToken = require('../middleware/authenticateToken');

const router = express.Router();

router.get('/', jobsController.getAllJobs);
router.post('/', authenticateToken, jobsController.createJob); 


module.exports = router;