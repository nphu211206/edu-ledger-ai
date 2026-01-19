// File: client/src/components/jobs/EditJobModal.jsx
// PHIÊN BẢN TỐI THƯỢNG MASTER - Modal Chỉnh sửa Tin Tuyển dụng
// Component này cung cấp giao diện form để Nhà tuyển dụng chỉnh sửa chi tiết
// một tin tuyển dụng đã đăng. Bao gồm validation, gọi API cập nhật,
// và xử lý trạng thái loading/error với hiệu ứng đẳng cấp.

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion'; // Cho animation
import { updateJob } from '../../services/api'; // API function để cập nhật job
import { LoadingSpinner } from '../common/FeedbackComponents'; // Spinner component
import { AlertCircle, X, Save, Loader, Trash2, Plus, ChevronsUpDown, Info } from 'lucide-react'; // Icons

// ==========================================================
// === COMPONENT CON NỘI BỘ CHO FORM ===
// Định nghĩa đầy đủ các component form phụ trợ
// ==========================================================

/**
 * FormInput: Component input field chuẩn hóa với label, helper text, và xử lý lỗi.
 * @param {string} id - ID duy nhất cho input và label's htmlFor.
 * @param {string} label - Text hiển thị cho label.
 * @param {string|undefined} error - Thông báo lỗi (nếu có) để hiển thị.
 * @param {string} [helperText] - (Tùy chọn) Văn bản hướng dẫn nhỏ bên dưới input.
 * @param {object} props - Các props HTML chuẩn cho thẻ input (type, name, value, onChange, placeholder, required, disabled, etc.).
 */
const FormInput = React.memo(({ id, label, error, helperText, ...props }) => (
    <div className="w-full form-field-group"> {/* Class để nhóm label và input */}
        <label htmlFor={id} className="block text-sm font-medium text-gray-300 mb-1.5">{label}</label>
        <input
            id={id}
            className={`w-full px-4 py-2.5 bg-gray-700 border rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 transition duration-200 ease-in-out ${
                error
                    ? 'border-red-500 ring-1 ring-red-500/50' // Style khi có lỗi
                    : 'border-gray-600 hover:border-gray-500 focus:ring-blue-500 focus:border-transparent' // Style bình thường/focus
            }`}
            aria-invalid={!!error} // Accessibility: Đánh dấu input không hợp lệ
            aria-describedby={error ? `${id}-error` : (helperText ? `${id}-helper` : undefined)} // Accessibility: Liên kết với thông báo lỗi/helper
            {...props} // Truyền các props còn lại (value, onChange, type, name, etc.)
        />
        {/* Hiển thị helper text hoặc error message (chỉ hiển thị một trong hai) */}
        {helperText && !error && <p id={`${id}-helper`} className="text-xs text-gray-500 mt-1.5">{helperText}</p>}
        {error && <p id={`${id}-error`} className="text-red-400 text-xs mt-1.5 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5"/>{error}</p>}
    </div>
));
FormInput.displayName = 'FormInput'; // Tên component trong DevTools

/**
 * FormTextarea: Component textarea chuẩn hóa với label, helper text, và xử lý lỗi.
 * @param {string} id - ID cho textarea và label's htmlFor.
 * @param {string} label - Text hiển thị cho label.
 * @param {string|undefined} error - Thông báo lỗi (nếu có).
 * @param {string} [helperText] - Văn bản hướng dẫn nhỏ bên dưới textarea.
 * @param {object} props - Các props HTML chuẩn cho thẻ textarea (name, value, onChange, placeholder, rows, required, etc.).
 */
const FormTextarea = React.memo(({ id, label, error, helperText, ...props }) => (
    <div className="w-full form-field-group">
        <label htmlFor={id} className="block text-sm font-medium text-gray-300 mb-1.5">{label}</label>
        <textarea
            id={id}
            className={`w-full px-4 py-2.5 bg-gray-700 border rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 transition duration-200 ease-in-out min-h-[120px] resize-y ${ // min-h và cho phép resize dọc
                error
                    ? 'border-red-500 ring-1 ring-red-500/50'
                    : 'border-gray-600 hover:border-gray-500 focus:ring-blue-500 focus:border-transparent'
            }`}
            aria-invalid={!!error}
            aria-describedby={error ? `${id}-error` : (helperText ? `${id}-helper` : undefined)}
            {...props} // Rows, value, onChange, etc.
        ></textarea> {/* Thẻ đóng textarea */}
        {helperText && !error && <p id={`${id}-helper`} className="text-xs text-gray-500 mt-1.5">{helperText}</p>}
        {error && <p id={`${id}-error`} className="text-red-400 text-xs mt-1.5 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5"/>{error}</p>}
    </div>
));
FormTextarea.displayName = 'FormTextarea';

/**
 * SkillInput: Component cho phép nhập và quản lý danh sách các skill tags.
 * @param {Array<string>} skills - Mảng các skill hiện tại.
 * @param {function} setSkills - Hàm state setter để cập nhật mảng skills.
 * @param {string|undefined} error - Thông báo lỗi validation cho trường skills.
 */
const SkillInput = React.memo(({ skills = [], setSkills, error }) => {
    const [inputValue, setInputValue] = useState(''); // State cho input nhập skill mới

    /** Xử lý khi nhấn Enter, Tab, hoặc dấu phẩy trong input skill */
    const handleKeyDown = useCallback((e) => {
        // Chỉ xử lý Enter, Tab, hoặc dấu phẩy (,)
        if (e.key !== 'Enter' && e.key !== 'Tab' && e.key !== ',') return;
        
        e.preventDefault(); // Ngăn hành vi mặc định
        const newSkill = inputValue.trim(); // Lấy giá trị và trim
        
        // Kiểm tra skill có giá trị và chưa tồn tại trong danh sách (không phân biệt hoa thường)
        if (newSkill && !skills.some(s => s.toLowerCase() === newSkill.toLowerCase())) {
            setSkills(prevSkills => [...prevSkills, newSkill]); // Thêm skill mới (giữ nguyên case gốc)
        }
        setInputValue(''); // Xóa input sau khi thêm
    }, [inputValue, skills, setSkills]);

    /** Xử lý xóa một skill tag */
    const removeSkill = useCallback((skillToRemove) => {
        setSkills(prevSkills => prevSkills.filter(skill => skill !== skillToRemove));
    }, [setSkills]);

    /** Xử lý khi nội dung input thay đổi */
    const handleInputChange = (e) => {
        setInputValue(e.target.value);
    };

    return (
        <div className="form-field-group">
            <label htmlFor="skill-input-field" className="block text-sm font-medium text-gray-300 mb-1.5">Kỹ năng yêu cầu *</label>
            {/* Container bao bọc input và các tag */}
            <div className={`flex flex-wrap items-center gap-2 p-2.5 bg-gray-700 border rounded-md transition duration-200 ease-in-out min-h-[50px] ${ // Thêm min-h
                error
                    ? 'border-red-500 ring-1 ring-red-500/50' // Style lỗi
                    : 'border-gray-600 hover:border-gray-500 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent' // Style focus-within
            }`}>
                {/* Hiển thị các skill tag đã có */}
                <AnimatePresence> {/* Animation khi xóa tag */}
                    {skills.map(skill => (
                        <motion.div
                            key={skill}
                            initial={{ opacity: 0, scale: 0.8, x: -10 }} animate={{ opacity: 1, scale: 1, x: 0 }} exit={{ opacity: 0, scale: 0.8, x: 10 }}
                            transition={{ duration: 0.15 }}
                            layout // Giúp các tag khác di chuyển mượt khi xóa
                            className="flex items-center gap-1.5 bg-blue-900/70 text-blue-200 text-sm font-medium px-3 py-1 rounded-full border border-blue-700/50 whitespace-nowrap"
                        >
                            <span>{skill}</span>
                            {/* Nút xóa tag */}
                            <button
                                type="button" // Quan trọng: type="button" để không submit form
                                onClick={() => removeSkill(skill)}
                                className="text-blue-300 hover:text-white hover:bg-red-500/50 rounded-full focus:outline-none focus:ring-1 focus:ring-red-400 p-0.5"
                                aria-label={`Remove skill ${skill}`}
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>
                        </motion.div>
                    ))}
                </AnimatePresence>
                {/* Input để nhập skill mới */}
                <input
                    id="skill-input-field"
                    type="text"
                    value={inputValue}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    placeholder={skills.length === 0 ? "Nhập kỹ năng (VD: React) rồi nhấn Enter..." : "Thêm kỹ năng..."}
                    className="flex-grow bg-transparent text-white outline-none p-1 text-sm min-w-[150px]" // min-w để input không quá nhỏ
                    aria-describedby={error ? "skill-input-error" : undefined}
                />
            </div>
            {/* Hiển thị lỗi validation */}
            {error && <p id="skill-input-error" className="text-red-400 text-xs mt-1.5 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5"/>{error}</p>}
            <p className="text-xs text-gray-500 mt-1.5">Nhấn Enter, Tab, hoặc dấu phẩy (,) để thêm kỹ năng.</p>
        </div>
    );
});
SkillInput.displayName = 'SkillInput';

/**
 * FormSelect: Component select dropdown chuẩn hóa.
 * @param {string} id - ID.
 * @param {string} label - Label.
 * @param {string|undefined} error - Lỗi.
 * @param {React.ReactNode} children - Các thẻ <option>.
 * @param {object} props - Các props khác (name, value, onChange, etc.).
 */
const FormSelect = React.memo(({ id, label, error, children, helperText, ...props }) => (
    <div className="w-full form-field-group relative">
        <label htmlFor={id} className="block text-sm font-medium text-gray-300 mb-1.5">{label}</label>
        <select
            id={id}
            className={`w-full px-4 py-2.5 bg-gray-700 border rounded-md text-white focus:outline-none focus:ring-2 transition duration-200 ease-in-out appearance-none pr-10 ${ // Thêm pr-10
                error ? 'border-red-500 ring-1 ring-red-500/50' : 'border-gray-600 hover:border-gray-500 focus:ring-blue-500 focus:border-transparent'
            }`}
            aria-invalid={!!error}
            aria-describedby={error ? `${id}-error` : (helperText ? `${id}-helper` : undefined)}
            {...props}
        >
            {children} {/* Render các <option> */}
        </select>
        {/* Mũi tên dropdown tùy chỉnh */}
         <div className="absolute right-3 top-[calc(50%+4px)] transform -translate-y-1/2 pointer-events-none">
             <ChevronsUpDown className="w-5 h-5 text-gray-400" />
         </div>
        {helperText && !error && <p id={`${id}-helper`} className="text-xs text-gray-500 mt-1.5">{helperText}</p>}
        {error && <p id={`${id}-error`} className="text-red-400 text-xs mt-1.5 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5"/>{error}</p>}
    </div>
));
FormSelect.displayName = 'FormSelect';

/**
 * FormCheckbox: Component checkbox với label.
 * @param {string} id - ID.
 * @param {string} label - Label.
 *• @param {boolean} checked - Trạng thái checked.
 * @param {function} onChange - Hàm xử lý change.
 * @param {object} props - Các props khác (name, etc.).
 */
const FormCheckbox = React.memo(({ id, label, checked, onChange, error, helperText, ...props }) => (
    <div className="form-field-group">
        <div className="flex items-center mt-2"> {/* Thêm mt-2 để căn chỉnh nếu đặt cạnh input khác */}
            <input
                id={id}
                type="checkbox"
                checked={checked}
                onChange={onChange}
                className={`h-4 w-4 rounded border-gray-500 bg-gray-600 text-blue-500 focus:ring-blue-600 focus:ring-offset-gray-800 cursor-pointer transition duration-150 ease-in-out ${error ? 'border-red-500 ring-red-500/50' : ''}`}
                aria-invalid={!!error}
                aria-describedby={error ? `${id}-error` : (helperText ? `${id}-helper` : undefined)}
                {...props}
            />
            <label htmlFor={id} className="ml-2 block text-sm text-gray-300 cursor-pointer">{label}</label>
        </div>
         {helperText && !error && <p id={`${id}-helper`} className="text-xs text-gray-500 mt-1.5">{helperText}</p>}
         {error && <p id={`${id}-error`} className="text-red-400 text-xs mt-1.5 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5"/>{error}</p>}
    </div>
));
FormCheckbox.displayName = 'FormCheckbox';

// ==========================================================
// === COMPONENT CHÍNH: EditJobModal ===
// ==========================================================
/**
 * EditJobModal: Modal cho phép chỉnh sửa tin tuyển dụng.
 * @param {object} job - Dữ liệu job cần chỉnh sửa. Phải chứa tất cả các trường (title, description, skills, ...).
 * @param {function} onClose - Callback được gọi khi modal đóng (nhấn Hủy, X, hoặc click backdrop).
 * @param {function} onSaveSuccess - Callback được gọi khi lưu thành công, truyền job đã cập nhật về cho cha.
 */
const EditJobModal = ({ job, onClose, onSaveSuccess }) => {
    // --- State Management ---
    // State lưu trữ dữ liệu đang được chỉnh sửa trên form
    const [formData, setFormData] = useState({});
    // State riêng cho danh sách skills (vì là mảng phức tạp hơn)
    const [skills, setSkills] = useState([]);
    // State báo trạng thái đang gọi API để lưu
    const [isLoading, setIsLoading] = useState(false);
    // State lưu trữ lỗi chung hiển thị trên modal (lỗi API, etc.)
    const [error, setError] = useState('');
    // State lưu trữ lỗi validation của từng trường input
    const [errors, setErrors] = useState({});

    // --- Effect để Khởi tạo Form Data ---
    // Hook này chạy mỗi khi prop `job` thay đổi (tức là khi modal được mở với một job mới)
    useEffect(() => {
        if (job) {
            console.log("[EditJobModal] Initializing form with job data:", job);
            // Thiết lập giá trị ban đầu cho formData từ object `job`
            setFormData({
                title: job.title || '',
                description: job.description || '',
                location: job.location || '',
                salary: job.salary || '', // Chuỗi lương hiển thị (VD: "15-25 triệu")
                // Các trường lương chi tiết (chuyển đổi null/undefined thành chuỗi rỗng cho input)
                minSalary: job.minSalary?.toString() || '', // Input number cần chuỗi
                maxSalary: job.maxSalary?.toString() || '',
                salaryCurrency: job.salaryCurrency || 'VND', // Mặc định VND
                isSalaryNegotiable: job.isSalaryNegotiable || false, // Checkbox cần boolean
                // Các trường dropdown/select
                jobType: job.jobType || 'Full-time', // Mặc định Full-time
                experienceLevel: job.experienceLevel || '', // Rỗng nếu không có
                remotePolicy: job.remotePolicy || '', // Rỗng nếu không có
            });
            // Khởi tạo danh sách skills từ job.skills (đảm bảo là mảng)
            setSkills(Array.isArray(job.skills) ? job.skills : []);
            // Reset các lỗi khi mở modal mới
            setError('');
            setErrors({});
        } else {
             // Trường hợp không có job data (hiếm khi xảy ra nếu logic mở modal đúng)
             console.error("[EditJobModal] Error: No job data provided to initialize the form.");
             setError("Lỗi: Không có dữ liệu tin tuyển dụng để chỉnh sửa.");
        }
    }, [job]); // Effect này chỉ chạy lại khi `job` prop thay đổi

    // --- Event Handlers ---
    /**
     * Xử lý thay đổi giá trị cho các input, textarea, select, checkbox.
     * Cập nhật state `formData` và xóa lỗi validation của trường đó.
     */
    const handleChange = useCallback((e) => {
        const { name, value, type, checked } = e.target; // Lấy thông tin từ event
        // Cập nhật formData dựa trên loại input
        setFormData(prevData => ({
            ...prevData,
            [name]: type === 'checkbox' ? checked : value // Nếu là checkbox, lấy `checked`, ngược lại lấy `value`
        }));
        // Xóa lỗi validation của trường đang được sửa để người dùng biết họ đã sửa
        if (errors[name]) {
            setErrors(prevErrors => {
                const newErrors = { ...prevErrors };
                delete newErrors[name]; // Xóa key lỗi
                return newErrors;
            });
        }
        setError(''); // Xóa lỗi chung (nếu có) khi người dùng bắt đầu nhập liệu
    }, [errors]); // Dependency là `errors` để có thể xóa lỗi

    /**
     * Thực hiện validation phía client cho form data.
     * @returns {boolean} True nếu tất cả các trường hợp lệ, False nếu có lỗi.
     */
    const validateForm = useCallback(() => {
        const newErrors = {}; // Object chứa lỗi mới
        const requiredMsg = "Thông tin này không được để trống.";

        // --- Kiểm tra các trường bắt buộc ---
        if (!formData.title?.trim()) newErrors.title = requiredMsg;
        if (!formData.description?.trim()) newErrors.description = requiredMsg;
        if (!Array.isArray(skills) || skills.length === 0) newErrors.skills = "Vui lòng nhập ít nhất một kỹ năng yêu cầu.";

        // --- Kiểm tra logic lương ---
        const minSalary = parseFloat(formData.minSalary);
        const maxSalary = parseFloat(formData.maxSalary);
        // Kiểm tra nếu minSalary hoặc maxSalary không phải là số hợp lệ (nếu chúng không rỗng)
        if (formData.minSalary && (isNaN(minSalary) || minSalary < 0)) newErrors.minSalary = "Lương tối thiểu phải là một số dương.";
        if (formData.maxSalary && (isNaN(maxSalary) || maxSalary < 0)) newErrors.maxSalary = "Lương tối đa phải là một số dương.";
        // Kiểm tra nếu min > max (chỉ khi cả hai đều là số hợp lệ)
        if (!isNaN(minSalary) && !isNaN(maxSalary) && minSalary > maxSalary) {
            newErrors.maxSalary = "Lương tối đa phải lớn hơn hoặc bằng lương tối thiểu.";
        }
        // Nếu nhập min/max nhưng lại check Thỏa thuận (tùy logic mong muốn)
        if (formData.isSalaryNegotiable && (formData.minSalary || formData.maxSalary)) {
            newErrors.isSalaryNegotiable = "Bỏ chọn Thỏa thuận nếu đã nhập khoảng lương.";
        }
        // Nếu không nhập min/max và cũng không check Thỏa thuận (tùy logic, có thể bắt buộc nhập lương hoặc chuỗi salary)
        if (!formData.isSalaryNegotiable && !formData.minSalary && !formData.maxSalary && !formData.salary?.trim()) {
             newErrors.salary = "Vui lòng nhập mức lương hiển thị hoặc khoảng lương chi tiết.";
        }

        setErrors(newErrors); // Cập nhật state errors
        console.log("[EditJobModal] Validation results:", newErrors);
        return Object.keys(newErrors).length === 0; // Trả về true nếu không có lỗi
    }, [formData, skills]); // Dependency là formData và skills

    /**
     * Xử lý sự kiện submit form (nhấn nút Lưu).
     * Thực hiện validation, gọi API cập nhật, xử lý kết quả và đóng modal.
     */
    const handleSubmit = useCallback(async (e) => {
        e.preventDefault(); // Ngăn form submit theo cách truyền thống
        setError(''); // Reset lỗi chung
        console.log("[EditJobModal] Submit triggered. Validating form...");

        // Bước 1: Validate form
        if (!validateForm()) {
            console.warn("[EditJobModal] Validation failed. Submission aborted.");
            setError("Vui lòng kiểm tra lại các thông tin chưa hợp lệ bên dưới."); // Thông báo lỗi chung
            return; // Dừng thực thi nếu validation thất bại
        }

        // Bước 2: Bật trạng thái loading và chuẩn bị dữ liệu gửi đi
        setIsLoading(true);
        console.log("[EditJobModal] Validation passed. Preparing data to update job ID:", job.id);
        const dataToUpdate = {
            // Bao gồm tất cả các trường từ formData
            title: formData.title?.trim(),
            description: formData.description?.trim(),
            location: formData.location?.trim() || null, // Gửi null nếu rỗng
            salary: formData.salary?.trim() || null,
            // Chuyển đổi lương min/max sang số hoặc null
            minSalary: formData.minSalary ? parseFloat(formData.minSalary) : null,
            maxSalary: formData.maxSalary ? parseFloat(formData.maxSalary) : null,
            salaryCurrency: formData.salaryCurrency || 'VND',
            isSalaryNegotiable: formData.isSalaryNegotiable || false,
            jobType: formData.jobType || 'Full-time',
            experienceLevel: formData.experienceLevel || null, // Gửi null nếu rỗng
            remotePolicy: formData.remotePolicy || null,
            // Thêm mảng skills đã được quản lý bởi state `skills`
            skills: skills,
            // Không gửi status, createdAt, updatedAt, id, recruiterId, companyId từ đây
        };
        console.log("[EditJobModal] Data prepared for API:", dataToUpdate);

        // Bước 3: Gọi API updateJob
        try {
            // Giả lập độ trễ mạng để thấy loading spinner
            await sleep(1000); // Chờ 1 giây
            const updatedJob = await updateJob(job.id, dataToUpdate); // Gọi API service
            console.log("[EditJobModal] API call successful. Job updated:", updatedJob);
            
            // Bước 4: Xử lý thành công
            onSaveSuccess(updatedJob); // Gọi callback báo thành công cho component cha, truyền job mới
            onClose(); // Đóng modal
            // TODO: Hiển thị thông báo Toast thành công ("Đã cập nhật tin tuyển dụng!")

        } catch (err) {
            // Bước 5: Xử lý lỗi từ API
            console.error("[EditJobModal] Error updating job via API:", err);
            // Hiển thị lỗi API lên modal để người dùng biết
            setError(err.message || "Lỗi không xác định khi cập nhật tin tuyển dụng. Vui lòng thử lại.");
        } finally {
            // Bước 6: Tắt trạng thái loading dù thành công hay thất bại
            setIsLoading(false);
            console.log("[EditJobModal] Submission process finished.");
        }
    }, [job, formData, skills, validateForm, onClose, onSaveSuccess]); // Dependencies đầy đủ


    // --- JSX Render ---
    // Không render gì nếu không có dữ liệu `job` ban đầu (tránh lỗi)
    if (!job) {
         console.warn("[EditJobModal] Rendering null because 'job' prop is missing.");
         return null;
    }

    return (
        // Backdrop (lớp nền mờ)
        // AnimatePresence được quản lý bởi component cha (RecruiterDashboardPage)
        <div
            className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-[100] p-4 backdrop-blur-md"
            onClick={onClose} // Đóng khi click backdrop
            role="dialog" // Accessibility
            aria-modal="true" // Accessibility
            aria-labelledby="edit-job-modal-title" // Accessibility
        >
            {/* Modal Container (Nội dung chính) */}
            <motion.div
                initial={{ scale: 0.95, opacity: 0, y: -10 }} // Animation vào tinh tế hơn
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: -10 }} // Animation ra
                transition={{ type: "spring", stiffness: 400, damping: 30 }} // Hiệu ứng springy
                className="bg-gray-800 rounded-xl border border-gray-700 w-full max-w-4xl shadow-2xl flex flex-col overflow-hidden max-h-[95vh]" // Modal lớn, giới hạn chiều cao
                onClick={e => e.stopPropagation()} // Ngăn click bên trong đóng modal
            >
                {/* Header Modal */}
                <div className="p-5 border-b border-gray-700 flex justify-between items-center flex-shrink-0 bg-gray-800/80 backdrop-blur-sm sticky top-0 z-10">
                    <h2 id="edit-job-modal-title" className="text-xl font-bold text-white flex items-center gap-2">
                        <Edit className="w-5 h-5 text-yellow-400"/> Chỉnh sửa Tin Tuyển dụng
                    </h2>
                     <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white transition rounded-full p-1.5 hover:bg-gray-700/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800"
                        aria-label="Đóng modal"
                     > <X className="w-5 h-5" /> </button>
                </div>

                {/* Form (chiếm phần còn lại và scroll) */}
                <form onSubmit={handleSubmit} noValidate className="flex flex-col flex-grow overflow-hidden">
                    {/* Form Content (Scrollable) */}
                    <div className="p-6 md:p-8 space-y-6 overflow-y-auto styled-scrollbar flex-grow">
                        {/* Hiển thị lỗi API chung (nếu có) */}
                        <AnimatePresence>
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                    className="bg-red-900/40 border border-red-700 text-red-300 px-4 py-3 rounded-md text-sm flex items-center gap-2"
                                    role="alert"
                                >
                                    <AlertCircle className="w-5 h-5 flex-shrink-0"/>
                                    <span>{error}</span>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* --- Các trường Input --- */}
                        <FormInput id="edit-title" name="title" label="Tiêu đề công việc *" value={formData.title || ''} onChange={handleChange} error={errors.title} placeholder="VD: Senior React Native Developer" required />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                            <FormInput id="edit-location" name="location" label="Địa điểm làm việc" value={formData.location || ''} onChange={handleChange} error={errors.location} placeholder="VD: Tầng 10, Keangnam Landmark 72, Hà Nội" />
                            <FormInput id="edit-salary" name="salary" label="Mức lương hiển thị (chuỗi)" value={formData.salary || ''} onChange={handleChange} error={errors.salary} placeholder="VD: 2000-3500 USD hoặc Thỏa thuận" helperText="Chuỗi này sẽ hiển thị trên danh sách jobs." />
                        </div>

                        {/* Nhóm Lương chi tiết */}
                        <div className="p-4 bg-gray-700/30 rounded-lg border border-gray-700/50 space-y-5">
                            <p className="text-sm font-medium text-gray-300 -mb-2">Chi tiết lương (hỗ trợ lọc)</p>
                            <div className="grid grid-cols-1 md:grid-cols-7 gap-x-6 gap-y-5 items-end">
                                 <div className="md:col-span-3">
                                    <FormInput id="edit-minSalary" name="minSalary" type="number" label="Lương Tối thiểu (số, VNĐ)" value={formData.minSalary || ''} onChange={handleChange} error={errors.minSalary} placeholder="40000000" disabled={formData.isSalaryNegotiable} />
                                 </div>
                                 <div className="md:col-span-3">
                                    <FormInput id="edit-maxSalary" name="maxSalary" type="number" label="Lương Tối đa (số, VNĐ)" value={formData.maxSalary || ''} onChange={handleChange} error={errors.maxSalary} placeholder="70000000" disabled={formData.isSalaryNegotiable} />
                                 </div>
                                 <div className="md:col-span-1">
                                    <FormCheckbox id="edit-isSalaryNegotiable" name="isSalaryNegotiable" label="Thỏa thuận?" checked={formData.isSalaryNegotiable || false} onChange={handleChange} error={errors.isSalaryNegotiable} />
                                 </div>
                            </div>
                        </div>

                        {/* Nhóm Loại job, Cấp bậc, Hình thức */}
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-5">
                            <FormSelect id="edit-jobType" name="jobType" label="Loại công việc" value={formData.jobType || 'Full-time'} onChange={handleChange} error={errors.jobType}>
                                 <option value="Full-time">Full-time</option>
                                 <option value="Part-time">Part-time</option>
                                 <option value="Internship">Internship</option>
                                 <option value="Contract">Contract (Hợp đồng)</option>
                                 <option value="Freelance">Freelance</option>
                            </FormSelect>
                            <FormSelect id="edit-experienceLevel" name="experienceLevel" label="Cấp bậc yêu cầu" value={formData.experienceLevel || ''} onChange={handleChange} error={errors.experienceLevel}>
                                 <option value="">Không yêu cầu</option>
                                 <option value="Intern">Thực tập (Intern)</option>
                                 <option value="Junior">Mới tốt nghiệp (Junior)</option>
                                 <option value="Mid">Có kinh nghiệm (Mid-level)</option>
                                 <option value="Senior">Chuyên gia (Senior)</option>
                                 <option value="Lead">Trưởng nhóm (Lead)</option>
                                 <option value="Manager">Quản lý (Manager)</option>
                            </FormSelect>
                            <FormSelect id="edit-remotePolicy" name="remotePolicy" label="Hình thức làm việc" value={formData.remotePolicy || ''} onChange={handleChange} error={errors.remotePolicy}>
                                 <option value="">Không xác định</option>
                                 <option value="Onsite">Tại văn phòng (Onsite)</option>
                                 <option value="Hybrid">Linh hoạt (Hybrid)</option>
                                 <option value="Remote">Từ xa (Remote)</option>
                            </FormSelect>
                        </div>

                        {/* Skill Input */}
                        <SkillInput skills={skills} setSkills={setSkills} error={errors.skills}/>

                        {/* Description */}
                        <FormTextarea
                            id="edit-description" name="description" label="Mô tả chi tiết công việc *"
                            value={formData.description || ''} onChange={handleChange} error={errors.description}
                            rows={10} // Tăng số dòng mặc định
                            placeholder="Mô tả chi tiết về trách nhiệm, yêu cầu kỹ năng, kinh nghiệm, phúc lợi, văn hóa công ty..."
                            helperText="Bạn có thể sử dụng cú pháp Markdown cơ bản (xuống dòng, *, -, #) để định dạng."
                            required
                        />

                    </div> {/* End Form Content Scrollable */}

                    {/* Footer Modal - Nút Bấm */}
                    <div className="p-5 border-t border-gray-700 flex justify-end gap-3 bg-gray-800/60 rounded-b-xl flex-shrink-0 sticky bottom-0 z-10 backdrop-blur-sm">
                        {/* Nút Hủy */}
                        <motion.button
                            type="button" onClick={onClose}
                            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}
                            className="py-2 px-6 bg-gray-600 rounded-md hover:bg-gray-500 transition-colors duration-200 text-white font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 focus:ring-offset-gray-800"
                        >
                            Hủy
                        </motion.button>
                        {/* Nút Lưu */}
                        <motion.button
                            type="submit" disabled={isLoading} // Disable khi đang lưu
                            whileHover={{ scale: isLoading ? 1 : 1.03 }} // Không scale khi disable
                            whileTap={{ scale: isLoading ? 1 : 0.98 }}
                            className="py-2 px-6 bg-blue-600 rounded-md hover:bg-blue-500 transition-colors duration-200 text-white font-bold text-sm flex items-center justify-center min-w-[120px] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-gray-800 disabled:opacity-60 disabled:cursor-not-allowed shadow-md"
                        >
                            {/* Hiển thị spinner hoặc text */}
                            {isLoading
                                ? <LoadingSpinner size="sm" text="" /> // Chỉ hiển thị spinner
                                : <><Save className="w-4 h-4 mr-1.5"/> Cập nhật</> // Icon và Text
                            }
                        </motion.button>
                    </div> {/* End Footer */}
                </form> {/* End Form */}
            </motion.div> {/* End Modal Container */}
             {/* CSS nội bộ */}
             <style jsx global>{` /* ... styled-scrollbar ... */ `}</style>
        </div> // End Backdrop
    );
};
EditJobModal.displayName = 'EditJobModal'; // Tên component trong DevTools

// Export component chính
export default EditJobModal;