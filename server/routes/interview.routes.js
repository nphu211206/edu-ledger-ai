// File: server/routes/interview.routes.js
// PHIÊN BẢN v3.1 - KIẾN TRÚC "ĐẠI LỘ TÁCH BIỆT" (Đẳng Cấp & Rõ ràng)
// File này khớp "hoàn hảo" với api.js (v3.1) của bạn.

const express = require('express');
const router = express.Router(); // Router chính cho /api/interviews
const controller = require('../controllers/interview.controller.js');
const { authenticateToken, recruiterOnly, studentOnly } = require('../middleware/authenticateToken.js');

// === BẢO VỆ TOÀN BỘ HỆ THỐNG PHỎNG VẤN ===
// Mọi request đến /api/interviews/* đều phải được xác thực
router.use(authenticateToken);

// ==========================================================
// === (A) ĐẠI LỘ NHÀ TUYỂN DỤNG (RECRUITER) ===
// Prefix: /api/interviews/recruiter
// ==========================================================
const recruiterRouter = express.Router(); // Tạo một router con "chuyên biệt"
recruiterRouter.use(recruiterOnly); // "Cổng gác" bảo vệ TOÀN BỘ các route bên dưới

// 1. Quản lý Mẫu Phỏng vấn (Templates)
// POST /api/interviews/recruiter/templates (AI tạo mẫu phỏng vấn mới từ Job ID)
recruiterRouter.post('/templates', controller.createTemplate); 
// GET /api/interviews/recruiter/templates (Lấy danh sách mẫu của NTD)
recruiterRouter.get('/templates', controller.getTemplates);

// 2. Gửi lời mời và Quản lý Kết quả
// POST /api/interviews/recruiter/send (Gửi lời mời làm bài cho 1 đơn ứng tuyển)
recruiterRouter.post('/send', controller.sendInvite);
// GET /api/interviews/recruiter/results (Lấy danh sách các bài đã nộp/đã chấm)
recruiterRouter.get('/results', controller.getResults);
// GET /api/interviews/recruiter/results/:id (Lấy chi tiết bài đã chấm - side-by-side)
recruiterRouter.get('/results/:id', controller.getResultDetail);
// POST /api/interviews/recruiter/results/:id/grade (Yêu cầu AI chấm bài - Bất đồng bộ)
recruiterRouter.post('/results/:id/grade', controller.gradeInterview); 

// ===>>> Gắn "Đại lộ NTD" vào router chính
router.use('/recruiter', recruiterRouter);


// ==========================================================
// === (B) ĐẠI LỘ SINH VIÊN (STUDENT) ===
// Prefix: /api/interviews/student
// ==========================================================
const studentRouter = express.Router(); // Tạo router con "chuyên biệt"
studentRouter.use(studentOnly); // "Cổng gác" bảo vệ TOÀN BỘ các route bên dưới

// 1. Làm bài Phỏng vấn
// GET /api/interviews/student/start/:id (Lấy đề bài và bắt đầu tính giờ)
studentRouter.get('/start/:id', controller.startInterview); 
// POST /api/interviews/student/submit/:id (Nộp bài)
studentRouter.post('/submit/:id', controller.submitInterview); 

// ===>>> Gắn "Đại lộ SV" vào router chính
router.use('/student', studentRouter);

// ==========================================================
module.exports = router;
console.log("✅✅✅ interview.routes.js (Tối Thượng v3.1 - Kiến trúc Đại lộ Tách biệt) loaded.");