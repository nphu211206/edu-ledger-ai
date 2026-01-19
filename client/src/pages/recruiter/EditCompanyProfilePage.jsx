// File: client/src/pages/recruiter/EditCompanyProfilePage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { getMyCompanyProfile, updateMyCompanyProfile } from '../../services/api';
import { Building, Save, Loader, AlertCircle } from 'lucide-react'; // Icons

// --- Components Con Tái Sử Dụng ---
const LoadingIndicator = () => (
    <div className="fixed inset-0 bg-gray-900/70 flex items-center justify-center z-[100]">
        <Loader className="animate-spin text-blue-400 h-16 w-16" />
    </div>
);

const ErrorBanner = ({ message, onDismiss }) => (
    <div className="bg-red-900 border border-red-700 text-red-300 px-4 py-3 rounded-lg flex justify-between items-center mb-6">
        <div className="flex items-center">
            <AlertCircle className="w-5 h-5 mr-2" />
            <span>{message}</span>
        </div>
        {onDismiss && (
            <button onClick={onDismiss} className="text-red-300 hover:text-white">&times;</button>
        )}
    </div>
);
const ErrorDisplay = ({ message = "Đã có lỗi xảy ra.", onRetry }) => (
    <div className="bg-red-900/30 border border-red-700 text-red-300 px-6 py-4 rounded-lg flex flex-col items-center text-center">
        <AlertCircle className="w-10 h-10 mb-3" />
        <p className="font-semibold mb-2">Oops! Có lỗi xảy ra</p>
        <p className="text-sm mb-4">{message}</p>
        {onRetry && (
            <button
                onClick={onRetry}
                className="bg-red-600 hover:bg-red-700 text-white text-sm font-semibold py-2 px-4 rounded transition"
            >
                Thử lại
            </button>
        )}
    </div>
);

const FormField = ({ id, label, error, helperText, children }) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-gray-300 mb-1.5">{label}</label>
        {children}
        {helperText && <p className="text-xs text-gray-500 mt-1">{helperText}</p>}
        {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
    </div>
);

const TextInput = ({ id, ...props }) => (
    <input id={id} className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition" {...props} />
);

const TextAreaInput = ({ id, ...props }) => (
    <textarea id={id} className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition" {...props} />
);

// --- Component Chính ---
export default function EditCompanyProfilePage() {
    const [companyData, setCompanyData] = useState(null); // Dữ liệu gốc từ API
    const [formData, setFormData] = useState({}); // Dữ liệu đang chỉnh sửa trên form
    const [isLoading, setIsLoading] = useState(true); // Loading trang ban đầu
    const [isSaving, setIsSaving] = useState(false); // Loading khi nhấn Lưu
    const [error, setError] = useState(''); // Lỗi hiển thị
    const navigate = useNavigate();

    // Fetch dữ liệu công ty khi component mount
    const fetchCompanyData = useCallback(async () => {
        setIsLoading(true);
        setError('');
        try {
            const data = await getMyCompanyProfile();
            setCompanyData(data);
            // Khởi tạo formData từ dữ liệu fetch về, xử lý null/undefined
            setFormData({
                name: data.name || '',
                tagline: data.tagline || '',
                description: data.description || '',
                logoUrl: data.logoUrl || '',
                bannerUrl: data.bannerUrl || '',
                website: data.website || '',
                companySize: data.companySize || '',
                country: data.country || '',
                mainLocation: data.mainLocation || '',
            });
        } catch (err) {
            setError(err.message || "Không thể tải hồ sơ công ty.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCompanyData();
    }, [fetchCompanyData]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setError(''); // Xóa lỗi khi người dùng bắt đầu sửa
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        setError('');

        // Lọc ra các trường thực sự thay đổi để gửi đi (tối ưu)
        const changedData = {};
        for (const key in formData) {
            // So sánh giá trị đã trim (nếu là string) với giá trị gốc (xử lý null/undefined)
            const formValue = typeof formData[key] === 'string' ? formData[key].trim() : formData[key];
            const originalValue = companyData ? (companyData[key] || '') : ''; // Giá trị gốc, coi null/undefined là chuỗi rỗng
             const originalStringValue = typeof originalValue === 'string' ? originalValue : (originalValue ?? '').toString();


             if (formValue !== originalStringValue) {
                changedData[key] = formValue;
            }
        }

        if (Object.keys(changedData).length === 0) {
            setError("Không có thay đổi nào để lưu.");
            setIsSaving(false);
            return;
        }

         // Validation cơ bản
         if (!changedData.name?.trim() && !companyData?.name) { // Nếu tên bị xóa trắng
             setError("Tên công ty là bắt buộc.");
             setIsSaving(false);
             return;
         }


        try {
            await updateMyCompanyProfile(changedData);
            // Thành công: có thể hiển thị thông báo thành công (Toast)
            alert("Cập nhật hồ sơ công ty thành công!"); // Tạm dùng alert
            // Tải lại dữ liệu gốc để form hiển thị đúng sau khi lưu
             fetchCompanyData(); // Hoặc navigate('/recruiter/dashboard');
        } catch (err) {
            setError(err.message || "Cập nhật thất bại. Vui lòng thử lại.");
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return <LoadingIndicator />;
    }
    if (error && !companyData) { // Hiển thị lỗi nếu fetch ban đầu thất bại
        return (
            <div className="bg-gray-900 min-h-screen flex items-center justify-center p-6">
                <ErrorDisplay message={error} onRetry={fetchCompanyData} />
            </div>
        );
    }

    return (
        <>
            <Helmet><title>Chỉnh sửa Hồ sơ Công ty | EduLedger AI</title></Helmet>
            {isSaving && <LoadingIndicator />} {/* Overlay loading khi đang lưu */}

            <div className="bg-gray-900 min-h-screen text-white py-12 px-4 sm:px-6 lg:px-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="container mx-auto max-w-4xl"
                >
                    <div className="flex items-center gap-4 mb-8">
                        <Building className="w-8 h-8 text-blue-400" />
                        <h1 className="text-3xl font-bold">Chỉnh sửa Hồ sơ Công ty</h1>
                    </div>

                    {error && <ErrorBanner message={error} onDismiss={() => setError('')} />}

                    {companyData ? ( // Chỉ hiển thị form khi có dữ liệu gốc
                        <form onSubmit={handleSubmit} className="bg-gray-800 p-8 rounded-xl border border-gray-700 space-y-6">
                            {/* --- Các trường thông tin --- */}
                            <FormField id="name" label="Tên Công ty *" error={/* errors.name */ null}>
                                <TextInput id="name" name="name" value={formData.name || ''} onChange={handleChange} required />
                            </FormField>
                             <FormField id="tagline" label="Tagline / Slogan" helperText="Câu giới thiệu ngắn gọn về công ty.">
                                <TextInput id="tagline" name="tagline" value={formData.tagline || ''} onChange={handleChange} maxLength={200} />
                            </FormField>
                            <FormField id="description" label="Giới thiệu chi tiết" helperText="Mô tả về văn hóa, sản phẩm, môi trường làm việc...">
                                <TextAreaInput id="description" name="description" value={formData.description || ''} onChange={handleChange} rows={6} />
                            </FormField>
                             <FormField id="logoUrl" label="URL Logo" helperText="Dán URL ảnh logo công ty.">
                                <TextInput type="url" id="logoUrl" name="logoUrl" value={formData.logoUrl || ''} onChange={handleChange} placeholder="https://..." />
                            </FormField>
                             <FormField id="bannerUrl" label="URL Ảnh bìa (Banner)" helperText="Dán URL ảnh bìa cho trang công ty.">
                                <TextInput type="url" id="bannerUrl" name="bannerUrl" value={formData.bannerUrl || ''} onChange={handleChange} placeholder="https://..." />
                            </FormField>
                             <FormField id="website" label="Website Chính thức">
                                <TextInput type="url" id="website" name="website" value={formData.website || ''} onChange={handleChange} placeholder="https://yourcompany.com" />
                            </FormField>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormField id="companySize" label="Quy mô Công ty">
                                     <TextInput id="companySize" name="companySize" value={formData.companySize || ''} onChange={handleChange} placeholder="VD: 100-500 nhân viên" />
                                </FormField>
                                <FormField id="country" label="Quốc gia">
                                     <TextInput id="country" name="country" value={formData.country || ''} onChange={handleChange} placeholder="VD: Việt Nam" />
                                </FormField>
                            </div>
                             <FormField id="mainLocation" label="Trụ sở chính">
                                <TextInput id="mainLocation" name="mainLocation" value={formData.mainLocation || ''} onChange={handleChange} placeholder="VD: Tầng 10, Tòa nhà ABC, Hà Nội" />
                            </FormField>


                            {/* --- Nút Lưu --- */}
                            <div className="flex justify-end pt-4 border-t border-gray-700">
                                <button
                                    type="submit"
                                    disabled={isSaving || isLoading} // Disable khi đang load hoặc đang save
                                    className="flex items-center justify-center gap-2 bg-blue-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-blue-700 transition-all duration-300 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Save className="w-5 h-5" /> Lưu Thay Đổi
                                </button>
                            </div>
                        </form>
                    ) : (
                         // Hiển thị thông báo nếu không load được dữ liệu ban đầu
                         !isLoading && <ErrorDisplay message={error || "Không thể tải dữ liệu để chỉnh sửa."} onRetry={fetchCompanyData} />
                    )}
                </motion.div>
            </div>
        </>
    );
}