// src/routes/jobs.routes.js
import express from 'express';
import jobsController from '../controllers/jobs.controller.js';

const router = express.Router();

// CHUẨN REST: GET /api/jobs -> Lấy danh sách tài nguyên
router.get('/', jobsController.getAllJobs);

// Chúng ta có thể mở rộng sau này:
// router.get('/:id', jobsController.getJobById);
// router.post('/', jobsController.createJob); // Dành cho nhà tuyển dụng

export default router;