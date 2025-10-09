// File: client/src/services/api.js

import axios from 'axios';

// Tạo một instance của axios với cấu hình mặc định
const api = axios.create({
    // baseURL sẽ tự động được thêm vào trước mỗi request
    // Giúp chúng ta không cần gõ lại 'http://localhost:3000'
    baseURL: 'http://localhost:3800', 
    headers: {
        'Content-Type': 'application/json',
    },
});

// Hàm chuyên để gọi API lấy danh sách công việc
export const getJobs = async (filters, page) => {
    try {
        // Xây dựng các tham số cho request
        const params = {
            ...filters,
            page: page,
            limit: 10, // Có thể đặt limit ở đây hoặc truyền vào từ component
        };

        // Thực hiện lời gọi GET đến '/api/jobs' (baseURL sẽ được tự động thêm vào)
        // axios sẽ tự chuyển object params thành query string (?keyword=...&page=...)
        const response = await api.get('/api/jobs', { params });
        
        // Trả về dữ liệu từ server
        return response.data;
    } catch (error) {
        // Nếu có lỗi từ server (VD: 500), ném lỗi để component có thể bắt và xử lý
        console.error('Lỗi khi gọi API getJobs:', error);
        throw error;
    }
};
export const createJob = async (jobData) => {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('Yêu cầu xác thực. Vui lòng đăng nhập lại.');
        }

        const config = {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        };

        const response = await api.post('/api/jobs', jobData, config);
        return response.data;
    } catch (error) {
        console.error('Lỗi khi gọi API createJob:', error.response?.data || error);
        // Ném lại lỗi để component có thể bắt và hiển thị
        throw error.response?.data || error;
    }
};

// Sau này có thể thêm các hàm khác ở đây
// export const getJobById = async (id) => { ... };
// export const applyToJob = async (jobId, studentId) => { ... };