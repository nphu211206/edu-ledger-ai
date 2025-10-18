// File: server/controllers/jobs.controller.js
// PHIÊN BẢN HOÀN CHỈNH - ĐẦY ĐỦ LOGIC

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

const getJobById = async (req, res) => {
    try {
        const { id } = req.params;
        const job = await jobsService.findJobById(parseInt(id, 10));
        res.status(200).json(job);
    } catch (error) {
        console.error('Error in getJobById controller:', error.message);
        if (error.message.includes('Không tìm thấy')) {
            return res.status(404).json({ message: error.message });
        }
        res.status(500).json({ message: 'Lỗi máy chủ khi lấy chi tiết việc làm' });
    }
};

const createJob = async (req, res) => {
    const recruiterId = req.user.userId;
    const jobData = req.body;
    if (req.user.role !== 'recruiter') {
        return res.status(403).json({ message: 'Chỉ có nhà tuyển dụng mới được đăng tin.' });
    }
    try {
        const newJob = await jobsService.createJob(recruiterId, jobData);
        res.status(201).json(newJob);
    } catch (error) {
        console.error('Error in createJob controller:', error.message);
        if (error.message.includes('Dữ liệu không hợp lệ') || error.message.includes('Tài khoản nhà tuyển dụng không hợp lệ')) {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: 'Lỗi máy chủ khi tạo tin tuyển dụng' });
    }
};

const applyToJob = async (req, res) => {
    try {
        const { jobId } = req.params;
        const studentId = req.user.userId;
        const { role } = req.user;
        const { coverLetter } = req.body;
        if (role !== 'student') {
            return res.status(403).json({ message: 'Chỉ sinh viên mới có thể ứng tuyển.' });
        }
        const result = await jobsService.createApplication({
            jobId: parseInt(jobId, 10),
            studentId,
            coverLetter
        });
        res.status(201).json(result);
    } catch (error) {
        console.error('Error in applyToJob controller:', error.message);
        if (error.message.includes('đã ứng tuyển')) {
            return res.status(409).json({ message: error.message }); // 409 Conflict
        }
        res.status(500).json({ message: 'Lỗi máy chủ khi nộp đơn ứng tuyển.' });
    }
};

module.exports = {
    getAllJobs,
    getJobById,
    createJob,
    applyToJob,
};