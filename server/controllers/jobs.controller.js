// File: server/controllers/jobs.controller.js
// Sửa lại theo cú pháp CommonJS

const jobsService = require('../services/jobs.service.js');

const getAllJobs = async (req, res) => {
    try {
        const { page = 1, limit = 10, keyword = '', location = '', jobType = '' } = req.query;
        const filters = { keyword, location, jobType };
        
        const result = await jobsService.findAllJobs(page, limit, filters);
        
        res.status(200).json(result);
    } catch (error) {
        console.error('Error in getAllJobs controller:', error.message);
        res.status(500).json({ message: 'Lỗi máy chủ khi lấy danh sách việc làm' });
    }
};
const createJob = async (req, res) => {
    // Middleware authenticateToken đã giải mã token và gắn req.user
    const recruiterId = req.user.userId;
    const jobData = req.body;

    // Kiểm tra vai trò
    if (req.user.role !== 'recruiter') {
        return res.status(403).json({ message: 'Chỉ có nhà tuyển dụng mới được đăng tin.' });
    }

    try {
        const newJob = await jobsService.createJob(recruiterId, jobData);
        res.status(201).json(newJob);
    } catch (error) {
        console.error('Error in createJob controller:', error.message);
        // Phân biệt lỗi do người dùng và lỗi server
        if (error.message.includes('Dữ liệu không hợp lệ')) {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: 'Lỗi máy chủ khi tạo tin tuyển dụng' });
    }
};



module.exports = {
    getAllJobs,
    createJob, // <-- EXPORT HÀM MỚI
};