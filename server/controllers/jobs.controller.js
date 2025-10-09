// src/controllers/jobs.controller.js
import jobsService from '../services/jobs.service.js';

const getAllJobs = async (req, res) => {
    try {
        const { page = 1, limit = 10, keyword = '', location = '', jobType = '' } = req.query;
        const filters = { keyword, location, jobType };
        
        const result = await jobsService.findAllJobs(page, limit, filters);
        
        res.status(200).json(result);
    } catch (error) {
        // Lỗi từ service sẽ được bắt ở đây
        console.error('Error in getAllJobs controller:', error.message);
        res.status(500).json({ message: 'Lỗi máy chủ khi lấy danh sách việc làm' });
    }
};

export default {
    getAllJobs,
};