// /server/debug-ai.js
require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function listMyModels() {
    try {
        console.log("Đang kết nối tới Google AI với API Key của bạn...");
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        
        console.log("Đang lấy danh sách các model mà bạn có quyền truy cập...");
        
        // Đây là hàm quan trọng để lấy danh sách models
        const models = await genAI.listModels();
        
        console.log("\n--- DANH SÁCH CÁC MODEL KHẢ DỤNG CHO BẠN ---");
        let foundCompatibleModel = false;
        for await (const m of models) {
            // Chỉ in ra các model hỗ trợ chức năng `generateContent`
            if (m.supportedGenerationMethods.includes("generateContent")) {
                console.log('✅ Model Name:', m.name);
                foundCompatibleModel = true;
            }
        }
        console.log("----------------------------------------------\n");

        if (!foundCompatibleModel) {
            console.log("🔴 Không tìm thấy model nào tương thích. Vấn đề có thể do dự án Google Cloud của bạn chưa được cấu hình thanh toán (billing) hoặc khu vực (region) không hỗ trợ.");
        } else {
             console.log("🟢 Gợi ý: Hãy sao chép một trong các 'Model Name' ở trên (ví dụ: 'models/gemini-1.0-pro-latest') và dùng nó trong file api.controller.js.");
        }

    } catch (error) {
        console.error("\n❌ LỖI NGHIÊM TRỌNG KHI KẾT NỐI:", error.message);
        console.log("Gợi ý: Vui lòng kiểm tra lại GEMINI_API_KEY trong file .env, hoặc đảm bảo bạn đã 'ENABLE' Gemini API trong Google Cloud Console.");
    }
}

listMyModels();