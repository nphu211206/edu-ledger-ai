// File: server/services/ai.service.js


const OpenAI = require('openai'); // Sử dụng thư viện OpenAI
const axios = require('axios');
const { logError } = require('../utils/helpers');

// --- Hằng số ---
const GITHUB_API_BASE = 'https://api.github.com';
const MAX_CODE_CONTENT_LENGTH = 15000;
const MAX_ANSWER_LENGTH = 5000;

const AI_MODEL_NAME = "gpt-3.5-turbo-1106"; 

// --- Biến "Lười" (Lazy) ---
let openai; // Thay thế genAI
let isAiReady = false;

/**

 * Chỉ chạy khi hàm AI đầu tiên được gọi, đảm bảo .env đã được load.
 */
const initializeAI = () => {
    // Chỉ chạy 1 lần duy nhất
    if (isAiReady) return true;

    const functionName = "AI Initialization (OpenAI)";
    try {
        const API_KEY = process.env.OPENAI_API_KEY; // DÙNG KEY MỚI
        
        if (!API_KEY) {
            throw new Error("OPENAI_API_KEY is missing from environment variables. Real AI analysis is disabled.");
        }

        openai = new OpenAI({ apiKey: API_KEY }); // Khởi tạo OpenAI
        isAiReady = true;
        console.log(`✅ Real AI Service (OpenAI): Model "${AI_MODEL_NAME}" initialized successfully and is READY.`);
        return true;

    } catch (error) {
        logError(functionName, error);
        isAiReady = false;
        console.error("❌ Real AI Service (OpenAI): FAILED to initialize AI Model. Real AI analysis is DISABLED.");
        return false;
    }
};

/**
 * [HELPER] Lấy nội dung code từ GitHub repo
 */
const fetchRepoContent = async (repoFullName, githubToken) => {
    const readmeUrl = `${GITHUB_API_BASE}/repos/${repoFullName}/readme`;
    const headers = githubToken ? { 'Authorization': `token ${githubToken}` } : {};
    headers['Accept'] = 'application/vnd.github.v3.raw';
    try {
        const response = await axios.get(readmeUrl, { headers, timeout: 8000 });
        if (response.status === 200 && typeof response.data === 'string' && response.data.trim().length > 0) {
            return response.data.substring(0, MAX_CODE_CONTENT_LENGTH);
        }
        return "";
    } catch (error) {
        if (error.response?.status === 404) return "";
        logError('fetchRepoContent', error, { repoFullName, url: readmeUrl });
        throw new Error(`Lỗi khi lấy nội dung README từ GitHub (${error.response?.status || 'Network Error'}): ${error.message}`);
    }
};

/**
 * [HELPER] Parse JSON phản hồi từ AI (OpenAI JSON Mode rất đáng tin)
 */
const parseAIResponse = (rawText, functionName = "parseAIResponse") => {
    try {
        // Model 1106 với JSON mode trả về chuỗi JSON chuẩn
        return JSON.parse(rawText);
    } catch (parseError) {
        logError(functionName, parseError, { rawText });
        throw new Error(`AI đã phản hồi nhưng kết quả không đúng định dạng JSON. (Lỗi: ${parseError.message})`);
    }
};

/**
 * [HELPER] Hàm gọi AI "Tối thượng" (phiên bản OpenAI)
 * Hàm này yêu cầu model AI trả về CHỈ JSON
 */
const generateStructuredContent = async (prompt, functionName) => {
    // Bước 1: Khởi tạo AI (nếu chưa)
    if (!isAiReady) {
        initializeAI();
    }

    if (!isAiReady || !openai) {
        throw new Error("AI Service (OpenAI) không sẵn sàng. Vui lòng kiểm tra API Key và cấu hình.");
    }

    console.log(`[AI Service (OpenAI)] Sending Prompt to ${AI_MODEL_NAME} for: ${functionName}. Prompt length (approx): ${prompt.length} chars.`);

    try {
        // Sử dụng Chat Completions API với JSON mode
        const completion = await openai.chat.completions.create({
            model: AI_MODEL_NAME,
            messages: [{ role: "user", content: prompt }],
            response_format: { type: "json_object" }, // Yêu cầu trả về JSON
            temperature: 0.6,
            max_tokens: 4096, // Giới hạn token trả về (phòng trường hợp)
        });

        const responseText = completion.choices[0].message.content;
        
        if (completion.choices[0].finish_reason === 'length') {
             throw new Error("AI (OpenAI) đã dừng vì vượt quá giới hạn token. Kết quả có thể không hoàn chỉnh.");
        }

        if (!responseText) {
            throw new Error("AI (OpenAI) đã trả về phản hồi rỗng.");
        }

        console.log(`[AI Service (OpenAI)] Received response from ${AI_MODEL_NAME} for: ${functionName}. Parsing...`);
        return parseAIResponse(responseText, functionName); // Parse JSON

    } catch (error) {
        logError(functionName, error, { promptLength: prompt.length });
        
        // Xử lý lỗi từ API OpenAI
        if (error.response) { 
            const openAIError = error.response.data?.error;
            if (openAIError) {
                if (openAIError.code === 'invalid_api_key') {
                    throw new Error('API Key của OpenAI không hợp lệ. Vui lòng kiểm tra lại file .env của server.');
                }
                if (openAIError.code === 'rate_limit_exceeded') {
                    throw new Error('AI đang quá tải (Rate Limit). Vui lòng đợi và thử lại sau 1 phút.');
                }
                throw new Error(`Lỗi từ OpenAI: ${openAIError.message} (Code: ${openAIError.code})`);
            }
        }
        
        // Xử lý lỗi mạng
        if (error.message.includes('fetch') && (error.message.includes('ENOTFOUND') || error.message.includes('ECONNREFUSED'))) {
            throw new Error('Không thể kết nối đến dịch vụ OpenAI. Vui lòng kiểm tra kết nối mạng của server.');
        }
        
        // Ném lại các lỗi khác (ví dụ: lỗi parse JSON)
        throw error;
    }
};

// ====================================================================
// === CÁC HÀM NGHIỆP VỤ AI CHÍNH (Đẳng Cấp Master) ===
// ====================================================================

/**
 * 1. Phân tích code repo
 */
const analyzeCodeWithAI = async (repoFullName, githubToken) => {
    const functionName = 'analyzeCodeWithAI';
    try {
        const codeContent = await fetchRepoContent(repoFullName, githubToken);

        if (!codeContent || codeContent.trim().length < 100) {
            return {
                summary: "Không đủ nội dung code (chỉ có README hoặc README quá ngắn) để AI đưa ra đánh giá chi tiết.",
                overall_score: 45 + Math.floor(Math.random() * 10),
                strengths: ["Cần bổ sung thêm code vào repo hoặc viết README chi tiết hơn."],
                weaknesses: ["Thiếu nội dung trầm trọng để AI có thể phân tích."],
                detected_skills: [{ skill_name: "Git", score: 50 + Math.floor(Math.random() * 15) }],
                career_advice: "Hãy đảm bảo repository của bạn chứa mã nguồn dự án hoặc ít nhất là một file README mô tả chi tiết về dự án, công nghệ sử dụng và cách cài đặt."
            };
        }

        const prompt = `
            Bạn là một chuyên gia đánh giá code (Expert Code Reviewer). Phân tích code/README từ repo "${repoFullName}".
            Trả về CHỈ MỘT ĐỐI TƯỢNG JSON hợp lệ theo cấu trúc sau:
            {
              "summary": "(string) Tóm tắt (2-3 câu) về mục đích, chất lượng code.",
              "overall_score": (number) Điểm tổng quát (40-99).",
              "strengths": [ (array of strings) 3-5 điểm mạnh chính. ],
              "weaknesses": [ (array of strings) 2-3 điểm yếu. ],
              "detected_skills": [ (array of objects) Tối đa 15 kỹ năng kỹ thuật, dạng { "skill_name": "Tên skill", "score": (number, 50-98) }. ],
              "career_advice": "(string) 2-3 lời khuyên sự nghiệp (dùng \\n để xuống dòng)."
            }
            --- CODE/README CONTENT ---
            ${codeContent}
            --- END CODE/README CONTENT ---
            Hãy đảm bảo bạn CHỈ trả về một đối tượng JSON hợp lệ, không có bất kỳ văn bản nào khác bên ngoài.`;

        const analysisResult = await generateStructuredContent(prompt, functionName);
        
        if (!analysisResult.summary || typeof analysisResult.overall_score !== 'number' || !Array.isArray(analysisResult.detected_skills)) {
            throw new Error("AI response JSON structure is invalid or missing required fields.");
        }
        analysisResult.detected_skills = analysisResult.detected_skills
            .filter(skill => skill && typeof skill.skill_name === 'string' && skill.skill_name.trim() !== '' && typeof skill.score === 'number' && skill.score >= 0 && skill.score <= 100)
            .map(skill => ({ skill_name: skill.skill_name.trim(), score: Math.round(skill.score) }))
            .slice(0, 15);
        analysisResult.overall_score = Math.max(40, Math.min(Math.round(analysisResult.overall_score), 99));

        return analysisResult;

    } catch (error) {
        logError(functionName, error, { repoFullName });
        throw error;
    }
};

/**
 * 2. AI tạo bộ câu hỏi phỏng vấn
 */
const generateInterviewQuestions = async (jobTitle, jobDescription, focusSkills, questionCount = 7, difficulty = "Junior") => {
    const functionName = 'generateInterviewQuestions';
    const numTechnical = Math.ceil(questionCount * 0.6);
    const numBehavioral = Math.floor(questionCount * 0.2);
    const numSituational = questionCount - numTechnical - numBehavioral;

    const prompt = `
        Bạn là một Trưởng phòng Tuyển dụng Kỹ thuật (Senior Tech Hiring Manager) cực kỳ "Đẳng cấp" và "Chi tiết".
        Nhiệm vụ: Tạo một bộ ${questionCount} câu hỏi phỏng vấn cho vị trí "${jobTitle}" (cấp bậc ${difficulty}).
        
        Mô tả công việc (JD) để tham khảo: "${jobDescription}"
        Các kỹ năng NTD muốn tập trung: ${focusSkills.join(', ')}.

        Yêu cầu "Hoàn hảo":
        1. Tạo chính xác ${questionCount} câu hỏi.
        2. Phân bổ: ${numTechnical} câu hỏi Kỹ thuật (Technical), ${numBehavioral} câu hỏi Hành vi (Behavioral), và ${numSituational} câu hỏi Tình huống (Situational).
        3. Các câu hỏi Kỹ thuật phải xoay quanh các "focusSkills" đã cung cấp và JD.
        4. Với MỖI câu hỏi, cung cấp:
           - "questionText": (string) Nội dung câu hỏi.
           - "idealAnswer": (string) Câu trả lời lý tưởng, chi tiết, đóng vai trò là barem chấm điểm. Phải nêu bật các từ khóa và concept quan trọng.
           - "questionType": (string) Phân loại câu hỏi ("Technical", "Behavioral", "Situational").
        5. Ước tính tổng thời gian làm bài (timeLimitMinutes) (ví dụ: 4-5 phút/câu kỹ thuật, 3 phút/câu hành vi).

        Trả về CHỈ MỘT ĐỐI TƯỢNG JSON hợp lệ theo cấu trúc sau:
        {
          "timeLimitMinutes": (number) Tổng số phút ước tính (ví dụ: 35),
          "questions": [
            {
              "questionText": "(string) Nội dung câu hỏi 1 (VD: 'Hãy giải thích sự khác biệt giữa useEffect và useLayoutEffect trong React').",
              "idealAnswer": "(string) Câu trả lời lý tưởng cho câu 1. Cần đề cập: ... (chi tiết)",
              "questionType": "Technical"
            },
            {
              "questionText": "(string) Nội dung câu hỏi 2 (VD: 'Kể về một lần bạn gặp xung đột (conflict) với đồng nghiệp và cách bạn giải quyết?').",
              "idealAnswer": "(string) Câu trả lời lý tưởng cho câu 2. Cần thể hiện: ... (chi tiết)",
              "questionType": "Behavioral"
            }
            // ... (Tiếp tục cho đủ ${questionCount} câu)
          ]
        }
        
        Hãy đảm bảo bạn CHỈ trả về một đối tượng JSON hợp lệ, không có bất kỳ văn bản nào khác bên ngoài.
    `;

    try {
        const result = await generateStructuredContent(prompt, functionName);
        
        if (!result.timeLimitMinutes || typeof result.timeLimitMinutes !== 'number' || result.timeLimitMinutes < 5) {
            throw new Error("AI response JSON 'timeLimitMinutes' is invalid.");
        }
        if (!Array.isArray(result.questions) || result.questions.length === 0) {
            throw new Error("AI response JSON 'questions' array is missing or empty.");
        }
        if (result.questions.some(q => !q || !q.questionText || !q.idealAnswer || !q.questionType)) {
            throw new Error("AI response JSON 'questions' array contains items with missing fields.");
        }
        
        return result;

    } catch (error) {
        logError(functionName, error, { jobTitle, focusSkills, questionCount });
        throw error;
    }
};

/**
 * 3. AI chấm điểm MỘT câu trả lời
 */
const evaluateStudentAnswer = async (questionText, idealAnswer, studentAnswer) => {
    const functionName = 'evaluateStudentAnswer';
    
    if (!studentAnswer || studentAnswer.trim().length === 0) {
        return {
            score: 0,
            evaluation: "Sinh viên không trả lời câu hỏi này."
        };
    }

    const trimmedAnswer = studentAnswer.substring(0, MAX_ANSWER_LENGTH);
    
    const prompt = `
        Bạn là một Giám khảo AI "Đẳng cấp", công bằng, nghiêm khắc nhưng chi tiết.
        Nhiệm vụ: Chấm điểm câu trả lời của sinh viên (0-100) dựa trên barem điểm.

        Câu hỏi đã đặt ra:
        "${questionText}"

        Barem điểm (Câu trả lời lý tưởng mong đợi):
        "${idealAnswer}"

        Câu trả lời của Sinh viên:
        "${trimmedAnswer}"

        Yêu cầu "Chính xác":
        1. So sánh câu trả lời của sinh viên với barem điểm.
        2. Cho điểm (score) từ 0 đến 100. (0 = hoàn toàn sai/trống, 50 = hiểu ý nhưng sai kỹ thuật, 75 = đúng ý chính, 90-100 = xuất sắc, chi tiết).
        3. Viết một nhận xét (evaluation) NGẮN GỌN (1-3 câu) giải thích lý do cho điểm số đó (VD: "Hiểu đúng ý chính về A, nhưng thiếu B và C.", "Trả lời xuất sắc, bao quát cả trường hợp X.").

        Trả về CHỈ MỘT ĐỐI TƯỢNG JSON hợp lệ theo cấu trúc sau:
        {
          "score": (number) Điểm số từ 0-100,
          "evaluation": "(string) Nhận xét chi tiết lý do chấm điểm."
        }
        
        Hãy đảm bảo bạn CHỈ trả về một đối tượng JSON hợp lệ, không có bất kỳ văn bản nào khác bên ngoài.
    `;

    try {
        const result = await generateStructuredContent(prompt, functionName);
        
        if (typeof result.score !== 'number' || typeof result.evaluation !== 'string') {
            throw new Error("AI response JSON structure is invalid for evaluation.");
        }

        result.score = Math.max(0, Math.min(Math.round(result.score), 100));
        return result;

    } catch (error) {
        logError(functionName, error, { questionText });
        throw error;
    }
};

/**
 * 4. AI viết nhận định TỔNG KẾT
 */
const gradeOverallInterview = async (jobTitle, gradedAnswers) => {
    const functionName = 'gradeOverallInterview';
    
    let averageScore = 0;
    if (gradedAnswers.length > 0) {
        averageScore = Math.round(gradedAnswers.reduce((sum, ans) => sum + (ans.aiScore || 0), 0) / gradedAnswers.length);
    }

    const summaryOfAnswers = gradedAnswers.map((ans, i) =>
        `Câu ${i + 1} (Điểm: ${ans.aiScore}/100): ${ans.questionText}\nSV Trả lời: ${ans.studentAnswer || "(Bỏ trống)"}\nNhận xét AI: ${ans.aiEvaluation}\n---`
    ).join('\n\n');

    const prompt = `
        Bạn là Trưởng phòng Tuyển dụng Cấp cao (Head of Talent Acquisition).
        Nhiệm vụ: Viết một nhận định tổng kết (aiOverallEvaluation) "sắc sảo" về toàn bộ bài phỏng vấn của ứng viên cho vị trí "${jobTitle}".
        
        Dưới đây là toàn bộ bài làm của họ, đã được AI chấm điểm từng câu:
        --- BÀI LÀM CHI TIẾT ---
        ${summaryOfAnswers}
        --- HẾT BÀI LÀM ---

        Yêu cầu "Toàn diện":
        1. Dựa vào TẤT CẢ các câu trả lời và nhận xét, viết một nhận định tổng kết (aiOverallEvaluation) (3-5 câu) về:
           - Điểm mạnh lớn nhất (VD: "Nắm vững kiến thức nền tảng về X...").
           - Điểm yếu rõ rệt nhất (VD: "Tuy nhiên, còn yếu ở phần xử lý tình huống...").
           - Một đề xuất cuối cùng (VD: "Đề xuất: Nên mời phỏng vấn vòng 2 để làm rõ...", "Đề xuất: Phù hợp với vị trí Intern hơn là Junior", "Đề xuất: Không phù hợp").
        2. Cho một điểm tổng kết (overallScore) dựa trên điểm trung bình (${averageScore}) nhưng có điều chỉnh (cộng/trừ 5-10 điểm) dựa trên cảm quan chung của bạn về chất lượng tổng thể của bài làm.

        Trả về CHỈ MỘT ĐỐI TƯỢNG JSON hợp lệ theo cấu trúc sau:
        {
          "overallScore": (number) Điểm tổng kết cuối cùng (0-100),
          "aiOverallEvaluation": "(string) Nhận định tổng kết chi tiết và đề xuất cuối cùng. Dùng \\n để xuống dòng nếu cần."
        }
        
        Hãy đảm bảo bạn CHỈ trả về một đối tượng JSON hợp lệ, không có bất kỳ văn bản nào khác bên ngoài.
    `;
    
    try {
        const result = await generateStructuredContent(prompt, functionName);
        
        if (typeof result.overallScore !== 'number' || typeof result.aiOverallEvaluation !== 'string') {
            throw new Error("AI response JSON structure is invalid for final evaluation.");
        }

        result.overallScore = Math.max(0, Math.min(Math.round(result.overallScore), 100));
        return result;

    } catch (error) {
        logError(functionName, error, { jobTitle });
        // Fallback "An toàn"
        console.warn(`[${functionName}] Final evaluation generation failed. Falling back to average score.`);
        return {
            overallScore: averageScore,
            aiOverallEvaluation: `AI không thể tạo nhận định tổng kết (Lỗi: ${error.message}).\n\nĐiểm trung bình của bài làm là ${averageScore}/100. Nhà tuyển dụng vui lòng tự xem xét chi tiết từng câu trả lời.`
        };
    }
};

// ====================================================================
// === XUẤT CÁC CÔNG CỤ ĐỂ SỬ DỤNG (ĐÃ SỬA) ===
// ====================================================================
module.exports = {
    // Xuất một hàm để kiểm tra trạng thái (nó sẽ tự khởi tạo)
    isAiReady: () => {
        if (!isAiReady) return initializeAI();
        return isAiReady;
    },
    // Sửa các hàm export để chúng tự khởi tạo AI
    analyzeCodeWithAI: async (...args) => {
        initializeAI(); // Đảm bảo AI được khởi tạo
        return analyzeCodeWithAI(...args);
    },
    generateInterviewQuestions: async (...args) => {
        initializeAI(); // Đảm bảo AI được khởi tạo
        return generateInterviewQuestions(...args);
    },
    evaluateStudentAnswer: async (...args) => {
        initializeAI(); // Đảm bảo AI được khởi tạo
        return evaluateStudentAnswer(...args);
    },
    gradeOverallInterview: async (...args) => {
        initializeAI(); // Đảm bảo AI được khởi tạo
        return gradeOverallInterview(...args);
    }
};

console.log(`✅✅✅ ai.service.js (v4.1 - OpenAI Swapped) loaded. AI Service is NOT ready yet, will init on first call.`);