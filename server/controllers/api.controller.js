// Controller này quản lý các API endpoint, sử dụng AI Giả Lập chi tiết
// và ĐẢM BẢO LƯU KỸ NĂNG VÀO CSDL. Sử dụng helpers.

// ====================================================================
// KHAI BÁO MODULES VÀ CẤU HÌNH BAN ĐẦU
// ====================================================================
const axios = require('axios');
const { sql, poolPromise } = require('../config/db.js');
// const { GoogleGenerativeAI } = require('@google/generative-ai'); 
const jobsService = require('../services/jobs.service.js');
const { logError, sendErrorResponse, sendSuccessResponse, sleep } = require('../utils/helpers.js'); // Import bộ công cụ Helpers
/**
 * @route GET /api/stats
 * @description Lấy thống kê công khai (dummy).
 * @access Public
 */
exports.getPublicStats = async (req, res) => {
    const functionName = 'getPublicStats (DUMMY)';
    try {
        // TODO: Viết logic thật để lấy stats
        console.log(`[${functionName}] Serving dummy public stats.`);
        const stats = {
            totalStudents: 150, // Số liệu giả
            totalRecruiters: 25, // Số liệu giả
            activeJobs: 42     // Số liệu giả
        };
        sendSuccessResponse(res, 200, stats);
    } catch (error) {
        sendErrorResponse(res, 500, 'Lỗi khi lấy public stats', functionName, error);
    }
};

/**
 * @route GET /api/skills/trending
 * @description Lấy kỹ năng trending (dummy).
 * @access Public
 */
exports.getTrendingSkills = async (req, res) => {
    const functionName = 'getTrendingSkills (DUMMY)';
    try {
        // TODO: Viết logic thật để lấy skills
        console.log(`[${functionName}] Serving dummy trending skills.`);
        const skills = [
            { name: "React", count: 90 },
            { name: "Node.js", count: 85 },
            { name: "Python", count: 70 },
            { name: "SQL Server", count: 65 },
            { name: "Docker", count: 50 }
        ];
        sendSuccessResponse(res, 200, skills);
    } catch (error) {
        sendErrorResponse(res, 500, 'Lỗi khi lấy trending skills', functionName, error);
    }
};
/**
 * @route GET /api/companies
 * @description Lấy danh sách công ty công khai (dummy).
 * @access Public
 */
exports.getAllCompanies = async (req, res) => {
    const functionName = 'getAllCompanies (DUMMY)';
    try {
        console.log(`[${functionName}] Serving dummy company list.`);
        const companies = [
            { id: 1, name: "Công ty A (Dummy)", slug: "cong-ty-a" },
            { id: 2, name: "Công ty B (Dummy)", slug: "cong-ty-b" }
        ];
        sendSuccessResponse(res, 200, companies);
    } catch (error) {
        sendErrorResponse(res, 500, 'Lỗi khi lấy danh sách công ty', functionName, error);
    }
};

/**
 * @route GET /api/companies/:slug
 * @description Lấy hồ sơ công ty theo slug (dummy).
 * @access Public
 */
exports.getPublicCompanyProfile = async (req, res) => {
    const functionName = 'getPublicCompanyProfile (DUMMY)';
    try {
        const { slug } = req.params;
        console.log(`[${functionName}] Serving dummy company profile for: ${slug}`);
        
        // 1. Tạo profile giả lập
        const profile = {
            id: 1,
            name: `Công ty ${slug} (Dummy)`,
            slug: slug,
            tagline: "Khám phá cơ hội tại công ty chúng tôi.",
            description: "Mô tả chi tiết về công ty (đây là dữ liệu giả lập).",
            companySize: "100-500",
            country: "Việt Nam",
            website: "https://example.com",
            bannerUrl: "https://images.unsplash.com/photo-1517048676732-d65bc937f952?q=80&w=2070",
            logoUrl: "https://via.placeholder.com/150"
        };
        
        // 2. Tạo mảng jobs giả lập (hoặc mảng rỗng)
        const jobs = []; // Trả về mảng rỗng để frontend không bị lỗi

        // 3. Trả về đúng cấu trúc { profile, jobs }
        const companyData = {
            profile: profile,
            jobs: jobs
        };
        
        sendSuccessResponse(res, 200, companyData); // <-- Đã sửa
        
    } catch (error) {
        sendErrorResponse(res, 500, 'Lỗi khi lấy hồ sơ công ty', functionName, error);
    }
};
// --- Hằng số và Cấu hình khác ---
const GITHUB_API_BASE = 'https://api.github.com';
const DEFAULT_REPOS_PER_PAGE = 20;
const FAKE_AI_DELAY_MIN_MS = 1500; // Giảm nhẹ delay giả lập
const FAKE_AI_DELAY_MAX_MS = 3500;


const generateFakeEvaluation = (profile) => {
    console.log("[Fake Eval v2.4 - Controller Copy] Generating structured fake evaluation...");
    let score = 60 + Math.floor(Math.random() * 30); let evaluation = { overall: null, sections: [], finalVerdict: null, disclaimer: "(Lưu ý: Đây là đánh giá nhanh do AI giả lập tạo ra dựa trên thông tin có sẵn. Nhà tuyển dụng cần tự đánh giá chi tiết hơn.)" };
    if (!profile) { evaluation.overall = "Không đủ thông tin để đánh giá."; return { score: 50, evaluation }; }
    const skills = profile.skills || []; const repos = profile.repos || []; const experiences = profile.experiences || []; const education = profile.education || [];
    if (skills.length > 5) score = Math.min(100, score + 6); else if (skills.length === 0) score -= 5; if (repos.length > 5) score = Math.min(100, score + 4); if (experiences.length > 0) score = Math.min(100, score + 7); else score -= 3; if (education.length > 0) score = Math.min(100, score + 3);
    evaluation.overall = `Ứng viên thể hiện tiềm năng ${score > 85 ? 'rất tốt' : (score > 70 ? 'khá tốt' : 'trung bình')}. Cần xem xét thêm các yếu tố chi tiết.`;
    let skillSection = { title: "Kỹ năng (AI-Verified)", points: [] }; if (skills.length > 0) { const avgScore = skills.length > 0 ? Math.round(skills.reduce((sum, s) => sum + (s.score || 0), 0) / skills.length) : 0; skillSection.points.push(`Có ${skills.length} kỹ năng được AI xác thực, điểm trung bình ~${avgScore}/100.`); const topSkill = [...skills].sort((a, b) => (b.score || 0) - (a.score || 0))[0]; if (topSkill) skillSection.points.push(`Nổi bật: ${topSkill.skill_name} (${topSkill.score || 'N/A'} điểm).`); if (skills.length < 3) skillSection.points.push("Cần bổ sung thêm kỹ năng được xác thực."); } else { skillSection.points.push("Chưa có kỹ năng nào được AI xác thực. Đây là điểm cần cải thiện lớn."); } evaluation.sections.push(skillSection);
    let repoSection = { title: "Dự án GitHub", points: [] }; if (repos.length > 0) { repoSection.points.push(`Có ${repos.length} dự án public.`); const recentRepo = [...repos].sort((a, b) => new Date(b.updated_at || 0).getTime() - new Date(a.updated_at || 0).getTime())[0]; if (recentRepo) repoSection.points.push(`Dự án "${recentRepo.name}" được cập nhật gần đây nhất.`); if (repos.some(r => r.stargazers_count > 10)) { score = Math.min(100, score + 2); repoSection.points.push("Có dự án nhận được sự chú ý nhất định (stars > 10)."); } if (repos.length < 3) repoSection.points.push("Số lượng dự án còn khá ít."); } else { repoSection.points.push("Không có dự án public nào."); } evaluation.sections.push(repoSection);
    let expSection = { title: "Kinh nghiệm làm việc", points: [] }; if (experiences.length > 0) { expSection.points.push(`Đã có ${experiences.length} kinh nghiệm được ghi nhận.`); const latestExp = experiences[0]; expSection.points.push(`${latestExp.isCurrent ? 'Hiện tại:' : 'Gần nhất:'} ${latestExp.title || 'N/A'} tại ${latestExp.company || 'N/A'}.`); if (experiences.some(exp => exp.description?.length > 100)) expSection.points.push("Mô tả kinh nghiệm khá chi tiết."); } else { expSection.points.push("Chưa có kinh nghiệm làm việc thực tế được liệt kê."); } evaluation.sections.push(expSection);
    let eduSection = { title: "Học vấn", points: [] }; if (education.length > 0) { const latestEdu = education[0]; eduSection.points.push(`${latestEdu.isCurrent ? 'Đang theo học' : 'Đã tốt nghiệp'} ${latestEdu.degree || 'N/A'} - ${latestEdu.fieldOfStudy || 'N/A'} tại ${latestEdu.school || 'N/A'}.`); if (latestEdu.grade) eduSection.points.push(`GPA: ${latestEdu.grade} (tham khảo).`); } else { eduSection.points.push("Chưa có thông tin học vấn."); } evaluation.sections.push(eduSection);
    if (score >= 85) { evaluation.finalVerdict = `Tiềm năng cao. Kỹ năng và kinh nghiệm (nếu có) tốt. Đề xuất: Nên mời phỏng vấn.`; } else if (score >= 70) { evaluation.finalVerdict = `Khá tiềm năng. Cần xem xét kỹ hơn về chất lượng dự án và chi tiết kinh nghiệm. Đề xuất: Cân nhắc vào vòng tiếp theo.`; } else { evaluation.finalVerdict = `Hồ sơ cơ bản hoặc thiếu thông tin quan trọng. Cần thêm minh chứng về năng lực (dự án, skills AI). Đề xuất: Xem xét thêm hoặc bỏ qua tùy vị trí.`; }
    score = Math.max(40, Math.min(score, 99));
    console.log("[Fake Eval v2.4 - Controller Copy] Generated structured evaluation:", { score, evaluation });
    return { score, evaluation }; // Trả về object có cấu trúc
};

const generateFakeAnalysisResultMaster = (repoFullName, mainLanguage = 'Unknown') => {
    console.log(`[Fake AI Master v2.4.1] Generating sophisticated fake analysis for ${repoFullName} (Language: ${mainLanguage})`);
    const [userName, repoName] = repoFullName.split('/');
    const languageBonus = ['javascript', 'typescript', 'python', 'java', 'c#', 'go'].includes(mainLanguage.toLowerCase()) ? Math.floor(Math.random() * 5) : 0;
    const randomScore = Math.min(98, Math.floor(Math.random() * (98 - 65 + 1)) + 65 + languageBonus);
    let detected_skills = [];
    const baseSkillsPool = [ { name: "Git", min: 70, max: 96 }, { name: "Problem Solving", min: 65, max: 90 }, { name: "Debugging", min: 62, max: 88 }, { name: "Object-Oriented Programming (OOP)", min: 65, max: 92, probability: 0.65 }, { name: "Data Structures", min: 60, max: 87, probability: 0.55 }, { name: "Algorithms", min: 60, max: 85, probability: 0.45 }, { name: "Software Design Principles", min: 60, max: 85, probability: 0.4 }, ];
    const addSkill = (name, min, max) => ({ skill_name: name, score: Math.floor(min + Math.random() * (max - min + 1)) });
    detected_skills = baseSkillsPool.filter(skill => !skill.probability || Math.random() < skill.probability).map(skill => addSkill(skill.name, skill.min, skill.max));
    let langSpecificSkills = [];
    const languageLower = mainLanguage.toLowerCase();
    if (['javascript', 'typescript'].includes(languageLower)) { langSpecificSkills = [addSkill(mainLanguage, 82, 97), addSkill("HTML5", 78, 95), addSkill("CSS3", 75, 93), ]; if (Math.random() < 0.6) langSpecificSkills.push(addSkill("React", 75, 96)); if (Math.random() < 0.3) langSpecificSkills.push(addSkill("Vue.js", 70, 93)); if (Math.random() < 0.2) langSpecificSkills.push(addSkill("Angular", 68, 91)); if (Math.random() < 0.5) langSpecificSkills.push(addSkill("Node.js", 70, 94)); if (langSpecificSkills.some(s => s.skill_name === 'Node.js') && Math.random() < 0.7) langSpecificSkills.push(addSkill("Express", 68, 90)); if (Math.random() < 0.6) langSpecificSkills.push(addSkill("Tailwind CSS", 72, 92)); if (Math.random() < 0.5) langSpecificSkills.push(addSkill("REST API Design", 68, 89)); if (Math.random() < 0.3) langSpecificSkills.push(addSkill("GraphQL", 65, 87)); if (Math.random() < 0.4) langSpecificSkills.push(addSkill("Jest", 65, 85)); if (Math.random() < 0.2) langSpecificSkills.push(addSkill("Cypress", 60, 82)); }
    else if (languageLower === 'python') { langSpecificSkills = [ addSkill("Python", 84, 98), ]; if (Math.random() < 0.5) langSpecificSkills.push(addSkill("Django", 77, 95)); if (Math.random() < 0.4) langSpecificSkills.push(addSkill("Flask", 73, 93)); if (Math.random() < 0.6) langSpecificSkills.push(addSkill("SQLAlchemy", 70, 90)); if (Math.random() < 0.7) langSpecificSkills.push(addSkill("PostgreSQL", 70, 91)); if (Math.random() < 0.3) langSpecificSkills.push(addSkill("MySQL", 68, 88)); if (Math.random() < 0.5) langSpecificSkills.push(addSkill("Pandas", 70, 93)); if (Math.random() < 0.4) langSpecificSkills.push(addSkill("NumPy", 68, 91)); if (Math.random() < 0.5) langSpecificSkills.push(addSkill("REST API Design", 69, 90)); if (Math.random() < 0.4) langSpecificSkills.push(addSkill("Pytest", 65, 86)); if (Math.random() < 0.2) langSpecificSkills.push(addSkill("Docker", 65, 88)); }
    else if (languageLower === 'java') { langSpecificSkills = [ addSkill("Java", 83, 97), ]; if (Math.random() < 0.6) langSpecificSkills.push(addSkill("Spring Boot", 79, 96)); if (Math.random() < 0.5) langSpecificSkills.push(addSkill("SQL Server", 72, 92)); if (Math.random() < 0.4) langSpecificSkills.push(addSkill("PostgreSQL", 70, 90)); if (Math.random() < 0.5) langSpecificSkills.push(addSkill("Maven", 70, 89)); if (Math.random() < 0.4) langSpecificSkills.push(addSkill("Gradle", 68, 87)); if (Math.random() < 0.4) langSpecificSkills.push(addSkill("Hibernate", 70, 91)); if (Math.random() < 0.3) langSpecificSkills.push(addSkill("JUnit", 68, 88)); if (Math.random() < 0.5) langSpecificSkills.push(addSkill("REST API Design", 70, 91)); if (Math.random() < 0.3) langSpecificSkills.push(addSkill("Docker", 65, 87)); }
    else if (mainLanguage !== 'Unknown') { langSpecificSkills.push(addSkill(mainLanguage, 70, 92)); if (Math.random() < 0.6) langSpecificSkills.push(addSkill("SQL", 65, 88)); if (Math.random() < 0.5) langSpecificSkills.push(addSkill("REST API Design", 65, 86)); if (Math.random() < 0.3) langSpecificSkills.push(addSkill("Docker", 62, 83)); if (Math.random() < 0.2) langSpecificSkills.push(addSkill("Unit Testing", 60, 80)); }
    detected_skills = [...detected_skills, ...langSpecificSkills].filter((skill, index, self) => index === self.findIndex((s) => s.skill_name.toLowerCase() === skill.skill_name.toLowerCase())).sort((a, b) => b.score - a.score).slice(0, 12 + Math.floor(Math.random() * 6));
    const strengthsPool = [ "Cấu trúc thư mục dự án được tổ chức khá logic và dễ theo dõi.", "Việc sử dụng tên biến, hàm, và class tuân thủ convention, dễ đọc hiểu.", "Áp dụng tốt các nguyên tắc Lập trình Hướng đối tượng (OOP) / Functional Programming.", "Codebase được format nhất quán bằng Prettier/ESLint (hoặc tương đương).", `Tận dụng hiệu quả các tính năng hiện đại của ngôn ngữ ${mainLanguage}.`, "README.md cung cấp hướng dẫn cài đặt và sử dụng khá chi tiết.", "Logic nghiệp vụ chính được tách biệt khỏi tầng giao diện/API.", "Commit history trên Git rõ ràng, thể hiện quá trình phát triển có tổ chức.", "Sử dụng comments hợp lý để giải thích các đoạn code phức tạp hoặc ý đồ thiết kế.", "Có dấu hiệu của việc áp dụng unit testing hoặc integration testing cơ bản." ];
    const weaknessesPool = [ "Thiếu vắng hệ thống testing tự động (Unit Test, Integration Test) hoặc độ bao phủ (coverage) còn thấp.", "Việc xử lý lỗi (error handling) ở một số module chưa thực sự robust, có thể gây crash ứng dụng.", "Một số truy vấn CSDL hoặc thuật toán xử lý dữ liệu có thể được tối ưu hóa để tăng hiệu năng.", "Tài liệu bình luận trong code (code comments) còn ít hoặc chưa đủ chi tiết ở những phần quan trọng.", "Một số hàm hoặc component có dấu hiệu quá phức tạp (high cyclomatic complexity), nên xem xét tái cấu trúc (refactoring).", "Validation dữ liệu đầu vào (user input, API request) cần được tăng cường để đảm bảo tính bảo mật và ổn định.", "Việc quản lý state (đặc biệt trong Frontend) hoặc dependencies (trong Backend) có thể được tổ chức khoa học hơn.", "Tồn tại một số đoạn code lặp lại (vi phạm nguyên tắc DRY - Don't Repeat Yourself).", "Thiếu file cấu hình môi trường chuẩn (.env.example) hoặc hướng dẫn cấu hình môi trường.", "Phần documentation (tài liệu dự án) cần được bổ sung chi tiết hơn." ];
    const summaryTemplates = [ `Dự án "${repoName}" là một ứng dụng ${mainLanguage} thể hiện ${randomScore > 85 ? 'sự hiểu biết sâu sắc' : (randomScore > 75 ? 'khả năng ứng dụng tốt' : 'kiến thức nền tảng vững chắc')} về ${detected_skills[1]?.skill_name || 'công nghệ web'}. Mã nguồn được tổ chức ${randomScore > 80 ? 'khá tốt' : 'tương đối'}, tập trung vào ${repoName.includes('api') || languageLower === 'python' || languageLower === 'java' ? 'xây dựng logic backend và API' : 'phát triển giao diện người dùng tương tác'}.`, `"${repoName}" là một ${mainLanguage} project ${randomScore > 90 ? 'chất lượng cao, thể hiện sự đầu tư nghiêm túc' : (randomScore > 78 ? 'khá hoàn chỉnh và có tiềm năng' : 'cơ bản nhưng cho thấy nỗ lực học hỏi')}. Dự án tập trung vào ${detected_skills[2]?.skill_name || 'việc giải quyết một bài toán cụ thể'}. ${strengthsPool[Math.floor(Math.random()*strengthsPool.length)]}`, `Qua xem xét "${repoName}", có thể thấy tác giả ${randomScore > 82 ? 'đã áp dụng khá thành thạo' : 'đang làm quen với'} các kỹ năng ${detected_skills[0]?.skill_name} và ${detected_skills[1]?.skill_name}. Mặc dù ${weaknessesPool[Math.floor(Math.random()*weaknessesPool.length)].toLowerCase().replace('.', '')}, dự án nhìn chung ${randomScore > 70 ? 'đạt yêu cầu và có thể phát triển thêm' : 'cần được hoàn thiện thêm'}.`, ];
    const strengths = strengthsPool.sort(() => 0.5 - Math.random()).slice(0, Math.floor(Math.random() * 3) + 3);
    const weaknesses = weaknessesPool.sort(() => 0.5 - Math.random()).slice(0, Math.floor(Math.random() * 2) + 2);
    const summary = summaryTemplates[Math.floor(Math.random() * summaryTemplates.length)];
    let career_advice = `\n===== PHÂN TÍCH ĐỊNH HƯỚNG SỰ NGHIỆP TỪ DỰ ÁN "${repoName}" =====\n\n`; career_advice += `Dựa trên phân tích mã nguồn và các kỹ năng được phát hiện, AI đề xuất một số định hướng phát triển sự nghiệp tiềm năng:\n\n`; let potentialPaths = []; const feSkills = detected_skills.filter(s => ['React', 'Vue.js', 'Angular', 'HTML5', 'CSS3', 'Tailwind CSS', 'JavaScript', 'TypeScript'].includes(s.skill_name)); if (feSkills.length >= 3 || feSkills.some(s => ['React', 'Vue.js', 'Angular'].includes(s.skill_name) && s.score > 80)) { potentialPaths.push('Frontend'); career_advice += `**🚀 Con đường Frontend Developer:**\n   - **Điểm mạnh:** Có nền tảng tốt về ${feSkills.map(s => s.skill_name).slice(0, 3).join(', ')}.\n   - **Đào sâu:** Tập trung nâng cao kỹ năng về framework/thư viện đang sử dụng (ví dụ: state management nâng cao, performance optimization, testing).\n   - **Mở rộng:** Tìm hiểu thêm về Server-Side Rendering (SSR) với Next.js/Nuxt.js, build tools (Webpack/Vite), và các CSS-in-JS solutions.\n\n`; } const beSkills = detected_skills.filter(s => ['Node.js', 'Express', 'Python', 'Django', 'Flask', 'Java', 'Spring Boot', 'SQL Server', 'PostgreSQL', 'MongoDB', 'REST API Design', 'GraphQL', 'SQLAlchemy', 'Hibernate', 'Maven', 'Gradle'].includes(s.skill_name)); if (beSkills.length >= 3 || beSkills.some(s => ['Node.js', 'Python', 'Java'].includes(s.skill_name) && s.score > 78)) { potentialPaths.push('Backend'); career_advice += `**⚙️ Con đường Backend Developer:**\n   - **Điểm mạnh:** Thể hiện khả năng xây dựng logic phía server với ${beSkills.map(s => s.skill_name).filter(n => !['REST API Design', 'SQL'].includes(n)).slice(0, 2).join(' và ')}.\n   - **Đào sâu:** Nắm vững về thiết kế CSDL quan hệ/NoSQL, tối ưu hóa query, caching, và bảo mật API.\n   - **Mở rộng:** Tìm hiểu về microservices architecture, message queues (Kafka/RabbitMQ), gRPC, và các ngôn ngữ backend khác (Go, Rust).\n\n`; } const devopsSkills = detected_skills.filter(s => ['Docker', 'Kubernetes', 'AWS', 'Azure', 'Git'].includes(s.skill_name)); if (devopsSkills.length >= 2 && devopsSkills.some(s => s.skill_name !== 'Git')) { potentialPaths.push('DevOps/Cloud'); career_advice += `**☁️ Con đường DevOps / Cloud Engineer:**\n   - **Nền tảng:** Đã có hiểu biết về ${devopsSkills.map(s=>s.skill_name).join('/')}. Git là công cụ thiết yếu.\n   - **CI/CD:** Tập trung xây dựng pipelines tự động hóa build, test, deploy (Jenkins, GitLab CI, GitHub Actions).\n`; if (devopsSkills.some(s => s.skill_name === 'Kubernetes')) { career_advice += `   - **K8s:** Nếu đã biết K8s, hãy đào sâu về quản lý cluster, networking (Ingress, Service Mesh), và monitoring.\n`; } else if (devopsSkills.some(s => s.skill_name === 'Docker')) { career_advice += `   - **Containerization:** Đã có Docker là lợi thế. Bước tiếp theo có thể là học Kubernetes hoặc ECS/Fargate.\n`; } career_advice += `   - **IaC:** Tìm hiểu Infrastructure as Code (Terraform, CloudFormation) để quản lý hạ tầng.\n`; const cloudSkill = devopsSkills.find(s => ['AWS', 'Azure'].includes(s.skill_name)); if (cloudSkill) { career_advice += `   - **Cloud (${cloudSkill.skill_name}):** Tập trung vào các dịch vụ cốt lõi (EC2/VM, S3/Blob, RDS/SQL DB, VPC/VNet) và các dịch vụ serverless.\n`; } else { career_advice += `   - **Cloud:** Lựa chọn một nền tảng cloud (AWS, Azure, GCP) và bắt đầu học các dịch vụ cơ bản.\n`; } career_advice += `   - **Monitoring:** Tìm hiểu các công cụ giám sát và logging (Prometheus, Grafana, ELK Stack, Datadog).\n\n`; } career_advice += `**💡 Lời khuyên Chung & Bước Tiếp Theo:**\n`; if (potentialPaths.length > 1) { career_advice += `   - **Định hướng:** Bạn có tiềm năng phát triển theo nhiều hướng (${potentialPaths.join(', ')}). Hãy xem xét sở thích và mục tiêu cá nhân để chọn con đường phù hợp nhất, hoặc cân nhắc trở thành Fullstack developer.\n`; } else if (potentialPaths.length === 1) { career_advice += `   - **Định hướng:** Dự án này cho thấy bạn có thiên hướng rõ rệt về ${potentialPaths[0]}. Hãy tiếp tục đào sâu vào lĩnh vực này.\n`; } else { career_advice += `   - **Định hướng:** Cần xây dựng thêm các dự án phức tạp hơn để thể hiện rõ định hướng chuyên môn (Frontend, Backend, etc.).\n`; } if (weaknesses.some(w => w.toLowerCase().includes('testing'))) { career_advice += `   - **Testing:** Ưu tiên hàng đầu là bổ sung kiến thức và thực hành về testing (Unit, Integration, E2E) cho các dự án của bạn.\n`; } if (weaknesses.some(w => w.toLowerCase().includes('comment') || w.toLowerCase().includes('document'))) { career_advice += `   - **Documentation:** Chú trọng hơn vào việc viết comments giải thích code và tài liệu README rõ ràng.\n`; } career_advice += `   - **Dự án Tiếp theo:** Thử thách bản thân với một dự án cá nhân lớn hơn, áp dụng các kiến thức mới học được và giải quyết các điểm yếu đã được chỉ ra.\n`; career_advice += `   - **Mã nguồn mở:** Đóng góp vào các dự án mã nguồn mở là cách tuyệt vời để học hỏi, cải thiện kỹ năng và xây dựng portfolio.\n`; career_advice += `   - **Học hỏi Liên tục:** Công nghệ thay đổi rất nhanh, hãy luôn cập nhật kiến thức qua blog, khóa học, và cộng đồng.\n`; if (!detected_skills.some(s => ['Problem Solving', 'Teamwork', 'English'].includes(s.skill_name))) { career_advice += `   - **Kỹ năng mềm:** Đừng quên trau dồi kỹ năng mềm như giao tiếp, làm việc nhóm, và ngoại ngữ (đặc biệt là tiếng Anh).\n\n`; } else { career_advice += `\n`; } career_advice += `Chúc bạn thành công!\n (Phân tích tham khảo dựa trên "${repoName}".)\n`; career_advice += `===========================================================\n`;

    return { summary, overall_score: randomScore, strengths, weaknesses, detected_skills, career_advice };
};


/**
 * @route POST /api/user/analyze-repo
 * @description Phân tích một repository GitHub (Luôn dùng GIẢ LẬP) VÀ LƯU KỸ NĂNG VÀO DB.
 * @param {string} req.body.repoFullName - Tên đầy đủ repo.
 * @access Private (Students & Recruiters)
 */
exports.analyzeRepo = async (req, res) => {
    const { userId, role } = req.user;
    const { repoFullName } = req.body;
    const functionName = 'analyzeRepo (Forced Fake)';

    // 1. Kiểm tra quyền và đầu vào
    if (role !== 'student' && role !== 'recruiter') { return sendErrorResponse(res, 403, 'Forbidden: Chức năng này yêu cầu quyền Sinh viên hoặc Nhà tuyển dụng.', functionName + ' (Permission Check)'); }
    if (!repoFullName || typeof repoFullName !== 'string' || !repoFullName.includes('/')) { return sendErrorResponse(res, 400, 'Bad Request: Tên repository không hợp lệ (cần định dạng "username/repo-name").', functionName + ' (Input Validation)'); }

    console.log(`[${functionName} v2.4.1] Request received for ${repoFullName} from user ${userId} (Role: ${role})`);

    let analysisResult = null;
    const transaction = new sql.Transaction(await poolPromise);

    try {
        await transaction.begin();
        console.log(`[${functionName}] Database transaction started.`);

        // --- LUÔN CHẠY LOGIC GIẢ LẬP ---
        console.log(`[${functionName}] Using FAKE AI Simulation for ${repoFullName}...`);
        const delayMs = Math.floor(Math.random() * (FAKE_AI_DELAY_MAX_MS - FAKE_AI_DELAY_MIN_MS + 1)) + FAKE_AI_DELAY_MIN_MS;
        await sleep(delayMs);

        let mainLanguage = 'Unknown';
        try {
            let githubToken = null;
            const repoOwnerUsername = repoFullName.split('/')[0];
            const currentUserResult = await new sql.Request(transaction).input('userId_token', sql.Int, userId).query('SELECT githubUsername, githubAccessToken FROM Users WHERE id = @userId_token');
            const currentUserGithubUsername = currentUserResult.recordset[0]?.githubUsername;

            if (role === 'student' && currentUserGithubUsername && currentUserGithubUsername.toLowerCase() === repoOwnerUsername.toLowerCase()) {
                githubToken = currentUserResult.recordset[0]?.githubAccessToken;
                if (!githubToken) { console.warn(`[${functionName}] Student ${userId} missing GitHub token, but is owner. Proceeding without auth.`); }
            } else { console.log(`[${functionName}] Not owner or not student/tokenless student. Calling GitHub API without authentication.`); }

            const headers = githubToken ? { 'Authorization': `token ${githubToken}` } : {};
            const langResponse = await axios.get(`${GITHUB_API_BASE}/repos/${repoFullName}/languages`, { headers });
            const languages = langResponse.data;
            if (languages && Object.keys(languages).length > 0) { mainLanguage = Object.keys(languages).reduce((a, b) => languages[a] > languages[b] ? a : b); }
            console.log(`[${functionName}] Detected main language via GitHub API: ${mainLanguage}`);
        } catch (githubError) {
            if (githubError.response?.status === 404) { console.error(`[${functionName}] GitHub repo not found: ${repoFullName}`); throw new Error(`Không tìm thấy repository '${repoFullName}' trên GitHub.`); }
            else if (githubError.response?.status === 401 && role === 'student') { console.error(`[${functionName}] Invalid GitHub token for student ${userId}.`); throw new Error('Token GitHub không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại qua GitHub.'); }
            else { console.warn(`[${functionName}] Could not fetch languages for ${repoFullName}: ${githubError.message}. Using '${mainLanguage}'.`); }
        }

        analysisResult = generateFakeAnalysisResultMaster(repoFullName, mainLanguage);
        // --- KẾT THÚC LOGIC GIẢ LẬP ---


        // --- LƯU KỸ NĂNG VÀO DATABASE ---
        const repoOwnerUsername = repoFullName.split('/')[0];
        const targetUserResult = await new sql.Request(transaction).input('targetUsername', sql.NVarChar(100), repoOwnerUsername).query('SELECT id FROM Users WHERE githubUsername = @targetUsername AND role=\'student\'');
        const targetUserId = targetUserResult.recordset[0]?.id;

        if (!targetUserId) {
            console.warn(`[${functionName}] Could not find student user '${repoOwnerUsername}' in database. Skipping skill save.`);
            if (analysisResult) analysisResult.warning_message = `Không tìm thấy người dùng '${repoOwnerUsername}' trong hệ thống EduLedger AI, các kỹ năng được phát hiện chưa được lưu vào hồ sơ.`;
        } else if (analysisResult?.detected_skills && analysisResult.detected_skills.length > 0) {
            console.log(`[${functionName}] Saving ${analysisResult.detected_skills.length} skills to DB for target user ${targetUserId} (${repoOwnerUsername})...`);
            for (const skill of analysisResult.detected_skills) {
                const skillName = skill.skill_name; const skillScore = skill.score;
                const skillRequest = new sql.Request(transaction); skillRequest.input('skillName_merge', sql.NVarChar(100), skillName); const skillResult = await skillRequest.query(`MERGE Skills AS target USING (SELECT @skillName_merge AS name) AS source ON target.name = source.name WHEN NOT MATCHED BY TARGET THEN INSERT (name) VALUES (source.name) OUTPUT inserted.id, $action AS Action;`); let skillId; if (skillResult.recordset.length > 0) { skillId = skillResult.recordset[0].id; if (skillResult.recordset[0].Action === 'INSERT') { console.log(`[${functionName} DB] Inserted new skill '${skillName}' with ID: ${skillId}`); } } else { const existingSkill = await new sql.Request(transaction).input('skillName_exist', sql.NVarChar(100), skillName).query('SELECT id FROM Skills WHERE name = @skillName_exist'); if (existingSkill.recordset.length === 0) { throw new Error(`Critical DB error: Could not find or create skill '${skillName}'.`); } skillId = existingSkill.recordset[0].id; }
                if (skillId) { const userSkillRequest = new sql.Request(transaction); userSkillRequest.input('userId_us', sql.Int, targetUserId); userSkillRequest.input('skillId_us', sql.Int, skillId); userSkillRequest.input('score_us', sql.Int, skillScore); userSkillRequest.input('verifiedBy_us', sql.NVarChar(50), 'AI_Simulated'); await userSkillRequest.query(`MERGE UserSkills AS target USING (SELECT @userId_us AS userId, @skillId_us AS skillId, @score_us AS score, @verifiedBy_us AS verifiedBy) AS source ON (target.userId = source.userId AND target.skillId = source.skillId) WHEN MATCHED THEN UPDATE SET score = source.score, verifiedBy = source.verifiedBy, lastVerifiedAt = GETUTCDATE(), updatedAt = GETUTCDATE() WHEN NOT MATCHED BY TARGET THEN INSERT (userId, skillId, score, verifiedBy, lastVerifiedAt, createdAt, updatedAt) VALUES (source.userId, source.skillId, source.score, source.verifiedBy, GETUTCDATE(), GETUTCDATE(), GETUTCDATE());`); } else { console.warn(`[${functionName}] Skipped saving user skill for '${skillName}' due to missing skillId.`); }
            }
             console.log(`[${functionName}] Finished saving/updating detected skills to database for target user ${targetUserId}.`);
        } else {
            console.log(`[${functionName}] No skills detected by fake AI or target user not found, skipping database update.`);
        }

        // --- Commit Transaction ---
        await transaction.commit();
        console.log(`[${functionName}] Database transaction committed successfully.`);

        // --- Gửi kết quả về Frontend ---
        console.log(`[${functionName}] Sending analysis result back to client for ${repoFullName}`);
        sendSuccessResponse(res, 200, analysisResult || {}, "Phân tích repo (giả lập) thành công!"); // Gửi kết quả giả lập

    } catch (error) {
        if (transaction && transaction.active) { console.warn(`[${functionName}] Rolling back database transaction due to error: ${error.message}`); await transaction.rollback(); }
        const isClientError = error.message.includes("GitHub") || error.message.includes("Token GitHub");
        const statusCode = isClientError ? 400 : 500;
        sendErrorResponse(res, statusCode, `Lỗi khi phân tích repo (giả lập): ${error.message}`, functionName, error, { userId, repoFullName });
    }
};

/**
 * @route GET /api/user/me
 * @description Lấy thông tin chi tiết của người dùng đang đăng nhập.
 * @access Private
 */
exports.getMe = async (req, res) => {
    const userId = req.user?.userId; const functionName = 'getMe';
    if (!userId) { return sendErrorResponse(res, 401, 'Unauthorized: Thông tin xác thực không hợp lệ hoặc bị thiếu.', functionName); }
    console.log(`[${functionName}] Request received for user ID: ${userId}`);
    try { const pool = await poolPromise; const request = pool.request().input('userId', sql.Int, userId); const userResult = await request.query(` SELECT u.id, u.name, u.email, u.avatarUrl, u.bio, u.role, u.githubId, u.githubUsername, u.companyId, c.name as companyName, c.slug as companySlug FROM Users u LEFT JOIN Companies c ON u.companyId = c.id WHERE u.id = @userId AND u.isActive = 1; `); if (userResult.recordset.length === 0) { console.log(`[${functionName}] User not found or inactive for ID: ${userId}`); return sendErrorResponse(res, 404, 'Not Found: Không tìm thấy thông tin người dùng hoặc tài khoản đã bị khóa.', functionName); } console.log(`[${functionName}] Successfully retrieved data for user ID: ${userId}`); sendSuccessResponse(res, 200, userResult.recordset[0]); } catch (error) { sendErrorResponse(res, 500, 'Internal Server Error: Lỗi máy chủ khi lấy thông tin người dùng.', functionName, error, { userId }); }
};

/**
 * @route GET /api/user/repos
 * @description Lấy danh sách repo GitHub của sinh viên.
 * @access Private (role='student')
 */
exports.getRepos = async (req, res) => {
    const { userId, role } = req.user; const functionName = 'getRepos';
    console.log(`[${functionName}] User ID from token: ${userId}, Role: ${role}`);
    if (role !== 'student') { return sendErrorResponse(res, 403, 'Forbidden: Chức năng này chỉ dành cho sinh viên.', functionName); }
    console.log(`[${functionName}] Request received for student ID: ${userId}`);
    try { const pool = await poolPromise; const tokenResult = await pool.request().input('userId', sql.Int, userId).query('SELECT githubAccessToken FROM Users WHERE id = @userId'); const githubToken = tokenResult.recordset[0]?.githubAccessToken; if (!githubToken) { console.log(`[${functionName}] GitHub access token not found for student ID: ${userId}`); return sendErrorResponse(res, 401, 'Unauthorized: Không tìm thấy access token GitHub. Vui lòng đăng nhập lại qua GitHub.', functionName); } console.log(`[${functionName}] Calling GitHub API for user ID: ${userId}`); const reposResponse = await axios.get(`${GITHUB_API_BASE}/user/repos?type=public&sort=pushed&per_page=${DEFAULT_REPOS_PER_PAGE}`, { headers: { 'Authorization': `token ${githubToken}`, 'Accept': 'application/vnd.github.v3+json' } }); console.log(`[${functionName}] Successfully retrieved ${reposResponse.data.length} repos for user ID: ${userId}`); sendSuccessResponse(res, 200, reposResponse.data); } catch (error) { let statusCode = 500; let clientMessage = 'Internal Server Error: Lỗi máy chủ khi lấy danh sách repository.'; if (axios.isAxiosError(error)) { statusCode = error.response?.status || 500; const githubErrorMessage = error.response?.data?.message || error.message; clientMessage = `GitHub API Error (${statusCode}): ${githubErrorMessage}`; if (statusCode === 401) { clientMessage = 'Unauthorized: GitHub token không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.'; } else if (statusCode === 403) { clientMessage = 'Forbidden: Vượt quá giới hạn truy cập GitHub API hoặc không có quyền. Thử lại sau.'; } else if (statusCode === 404) { clientMessage = 'Not Found: Không tìm thấy tài nguyên trên GitHub.'; } } else { clientMessage = `Internal Server Error: ${error.message}`; } sendErrorResponse(res, statusCode, clientMessage, functionName, error, { userId }); }
};

/**
 * @route GET /api/user/skills
 * @description Lấy danh sách kỹ năng đã xác thực của sinh viên.
 * @access Private (role='student')
 */
exports.getSkills = async (req, res) => {
    const { userId, role } = req.user; const functionName = 'getSkills';
    console.log(`[${functionName}] User ID from token: ${userId}, Role: ${role}`);
    if (role !== 'student') { return sendErrorResponse(res, 403, 'Forbidden: Chức năng này chỉ dành cho sinh viên.', functionName); }
    console.log(`[${functionName}] Request received for student ID: ${userId}`);
    try { const pool = await poolPromise; const skillsResult = await pool.request().input('userId', sql.Int, userId).query(`SELECT s.name AS skill_name, us.score FROM UserSkills us INNER JOIN Skills s ON us.skillId = s.id WHERE us.userId = @userId ORDER BY us.score DESC, s.name ASC;`); console.log(`[${functionName}] Successfully retrieved ${skillsResult.recordset.length} verified skills for user ID: ${userId}`); sendSuccessResponse(res, 200, skillsResult.recordset); } catch (error) { sendErrorResponse(res, 500, 'Internal Server Error: Lỗi máy chủ khi lấy danh sách kỹ năng.', functionName, error, { userId }); }
};

/**
 * @route POST /api/user/recruiter/search
 * @description Nhà tuyển dụng tìm kiếm sinh viên theo kỹ năng.
 * @access Private (role='recruiter')
 */
exports.searchStudents = async (req, res) => {
    const { userId, role } = req.user; const functionName = 'searchStudents';
    if (role !== 'recruiter') { return sendErrorResponse(res, 403, 'Forbidden: Chức năng này chỉ dành cho Nhà tuyển dụng.', functionName); }
    const { skills } = req.body; if (!Array.isArray(skills) || skills.length === 0) { return sendErrorResponse(res, 400, 'Bad Request: Vui lòng cung cấp ít nhất một tiêu chí kỹ năng để tìm kiếm.', functionName); } const validCriteria = skills.map(c => ({ name: c?.name?.trim(), minScore: parseInt(c?.minScore, 10) || 50 })).filter(c => c.name); if (validCriteria.length === 0) { return sendErrorResponse(res, 400, 'Bad Request: Vui lòng cung cấp ít nhất một tên kỹ năng hợp lệ trong tiêu chí tìm kiếm.', functionName); } console.log(`[${functionName}] Recruiter ID ${userId} searching with criteria:`, validCriteria);
    try { const pool = await poolPromise; const request = pool.request(); let subQueries = []; validCriteria.forEach((criterion, index) => { const skillNameParam = `skillName${index}`; const minScoreParam = `minScore${index}`; subQueries.push(` EXISTS ( SELECT 1 FROM UserSkills us_inner INNER JOIN Skills s_inner ON us_inner.skillId = s_inner.id WHERE us_inner.userId = u.id AND s_inner.name = @${skillNameParam} AND us_inner.score >= @${minScoreParam} ) `); request.input(skillNameParam, sql.NVarChar(100), criterion.name); request.input(minScoreParam, sql.Int, criterion.minScore); }); const skillNameParamsList = validCriteria.map((_, i) => `@skillName${i}`).join(','); const query = ` SELECT DISTINCT u.id, u.name, u.avatarUrl, u.bio, u.githubUsername, ISNULL(( SELECT SUM(us_score.score) FROM UserSkills us_score INNER JOIN Skills s_score ON us_score.skillId = s_score.id WHERE us_score.userId = u.id AND s_score.name IN (${skillNameParamsList}) AND EXISTS ( SELECT 1 FROM (VALUES ${validCriteria.map((_, i) => `(@skillName${i}, @minScore${i})`).join(',')}) AS Criteria(name, minScore) WHERE Criteria.name = s_score.name AND us_score.score >= Criteria.minScore ) ), 0) as totalMatchedScore FROM Users u WHERE u.role = 'student' AND u.isActive = 1 AND ${subQueries.join(' AND ')} ORDER BY totalMatchedScore DESC, u.name ASC; `; console.log(`[${functionName}] Executing search query...`); const result = await request.query(query); console.log(`[${functionName}] Found ${result.recordset.length} matching students for recruiter ID ${userId}.`); sendSuccessResponse(res, 200, result.recordset); } catch (error) { sendErrorResponse(res, 500, 'Internal Server Error: Lỗi máy chủ khi thực hiện tìm kiếm ứng viên.', functionName, error, { userId, skills: validCriteria }); }
};

/**
 * @route GET /api/user/profile/:username
 * @description Lấy hồ sơ công khai chi tiết của một sinh viên.
 * @access Private
 */
exports.getPublicProfile = async (req, res) => {
    const { username } = req.params; const requesterUserId = req.user?.userId; const functionName = 'getPublicProfile';
    if (!username || typeof username !== 'string' || !username.trim()) { return sendErrorResponse(res, 400, 'Bad Request: GitHub username là bắt buộc.', functionName); } const targetUsername = username.trim(); console.log(`[${functionName}] User ${requesterUserId} requesting profile for target username: ${targetUsername}`);
    try { const pool = await poolPromise; console.log(`[${functionName}] Querying basic profile for: ${targetUsername}`); const userResult = await pool.request().input('githubUsername', sql.NVarChar(100), targetUsername).query(`SELECT id, name, avatarUrl, bio, githubUsername, createdAt FROM Users WHERE githubUsername = @githubUsername AND role = 'student' AND isActive = 1;`); if (userResult.recordset.length === 0) { console.log(`[${functionName}] User profile not found, inactive, or not a student: ${targetUsername}`); return sendErrorResponse(res, 404, 'Not Found: Không tìm thấy hồ sơ sinh viên này hoặc tài khoản không hoạt động.', functionName); } const userProfile = userResult.recordset[0]; const targetUserId = userProfile.id; console.log(`[${functionName}] Found target user ID: ${targetUserId} for username: ${targetUsername}`); console.log(`[${functionName}] Fetching details (skills, repos, experiences, education) for user ID: ${targetUserId}`); const [skillsResult, reposResponse, experiencesResult, educationResult] = await Promise.all([ pool.request().input('userId', sql.Int, targetUserId).query(`SELECT s.name AS skill_name, us.score FROM UserSkills us INNER JOIN Skills s ON us.skillId = s.id WHERE us.userId = @userId ORDER BY us.score DESC, s.name ASC;`), axios.get(`${GITHUB_API_BASE}/users/${targetUsername}/repos?type=public&sort=pushed&per_page=${DEFAULT_REPOS_PER_PAGE}`).catch(err => { console.warn(`[${functionName}] WARN: GitHub API error fetching repos for ${targetUsername}: ${err.message}. Returning empty array.`); return { data: [] }; }), pool.request().input('userId', sql.Int, targetUserId).query(`SELECT * FROM WorkExperiences WHERE userId = @userId ORDER BY isCurrent DESC, startDate DESC;`), pool.request().input('userId', sql.Int, targetUserId).query(`SELECT * FROM Education WHERE userId = @userId ORDER BY isCurrent DESC, startDate DESC;`) ]); console.log(`[${functionName}] Successfully fetched all profile details for username: ${targetUsername}`); sendSuccessResponse(res, 200, { profile: userProfile, skills: skillsResult.recordset, repos: reposResponse.data || [], experiences: experiencesResult.recordset, education: educationResult.recordset }); } catch (error) { sendErrorResponse(res, 500, `Internal Server Error: Lỗi máy chủ khi tải hồ sơ: ${error.message}`, functionName, error, { username: targetUsername, requesterUserId }); }
};

/**
 * @route GET /api/user/recruiter/stats
 * @description Lấy thống kê riêng cho nhà tuyển dụng.
 * @access Private (role='recruiter')
 */
exports.getRecruiterStats = async (req, res) => {
    const { userId, role } = req.user; const functionName = 'getRecruiterStats'; if (role !== 'recruiter') return sendErrorResponse(res, 403, 'Chức năng này chỉ dành cho Nhà tuyển dụng.', functionName); try { const pool = await poolPromise; const request = pool.request().input('recruiterId', sql.Int, userId); const [studentCountResult, jobCountResult, applicantCountResult] = await Promise.all([ pool.request().query("SELECT COUNT(*) as total FROM Users WHERE role = 'student'"), request.query("SELECT COUNT(*) as total FROM Jobs WHERE recruiterId = @recruiterId"), request.query(`SELECT COUNT(ja.id) as total FROM JobApplications ja JOIN Jobs j ON ja.jobId = j.id WHERE j.recruiterId = @recruiterId`) ]); sendSuccessResponse(res, 200, { totalStudents: studentCountResult.recordset[0].total, postedJobs: jobCountResult.recordset[0].total, totalApplicants: applicantCountResult.recordset[0].total }); } catch (error) { sendErrorResponse(res, 500, 'Lỗi máy chủ khi lấy thống kê nhà tuyển dụng.', functionName, error, { userId }); }
};

/**
 * @route GET /api/user/recruiter/jobs
 * @description Lấy danh sách jobs đã đăng của nhà tuyển dụng.
 * @access Private (role='recruiter')
 */
exports.getRecruiterJobs = async (req, res) => {
    const { userId, role } = req.user; const functionName = 'getRecruiterJobs'; if (role !== 'recruiter') return sendErrorResponse(res, 403, 'Chức năng này chỉ dành cho Nhà tuyển dụng.', functionName); try { const jobs = await jobsService.findJobsByRecruiter(userId, req.query, req.query.sortBy); sendSuccessResponse(res, 200, jobs); } catch (error) { sendErrorResponse(res, 500, error.message || 'Lỗi máy chủ khi lấy danh sách tin đã đăng.', functionName, error, { userId }); }
};

/**
 * @route GET /api/user/jobs/:jobId/applicants
 * @description Lấy danh sách ứng viên cho một job.
 * @access Private (role='recruiter' - owner only)
 */
exports.getApplicantsForJob = async (req, res) => {
    const { userId, role } = req.user; const { jobId } = req.params; const functionName = 'getApplicantsForJob'; if (role !== 'recruiter') return sendErrorResponse(res, 403, 'Chức năng này chỉ dành cho Nhà tuyển dụng.', functionName); if (!jobId || isNaN(parseInt(jobId))) return sendErrorResponse(res, 400, 'Job ID không hợp lệ.', functionName); const jobIdInt = parseInt(jobId); try { const pool = await poolPromise; const ownerCheck = await pool.request().input('jobId', sql.Int, jobIdInt).input('recruiterId', sql.Int, userId).query('SELECT 1 FROM Jobs WHERE id = @jobId AND recruiterId = @recruiterId'); if (ownerCheck.recordset.length === 0) return sendErrorResponse(res, 403, 'Không có quyền xem ứng viên của tin này.', functionName); 
      console.log(`[${functionName}] ĐANG CHẠY CODE MỚI (với LEFT JOIN) cho Job ID: ${jobIdInt}`);
       const result = await pool.request().input('jobId', sql.Int, jobIdInt).query(`
    SELECT u.id as studentId, u.name, u.avatarUrl, u.githubUsername,
           ja.id as applicationId, ja.appliedAt, ja.status, ja.coverLetter
    FROM JobApplications ja
    LEFT JOIN Users u ON ja.studentId = u.id
    WHERE ja.jobId = @jobId
    ORDER BY ja.appliedAt DESC;
`);
 const applicants = result.recordset.map(row => ({ id: row.applicationId, appliedAt: row.appliedAt, status: row.status, coverLetter: row.coverLetter, student: { id: row.studentId, name: row.name, avatarUrl: row.avatarUrl, githubUsername: row.githubUsername } })); sendSuccessResponse(res, 200, applicants); } catch (error) { sendErrorResponse(res, 500, 'Lỗi máy chủ khi lấy danh sách ứng viên.', functionName, error, { userId, jobId }); }
};

/**
 * @route GET /api/user/student/applications
 * @description Lấy lịch sử ứng tuyển của sinh viên.
 * @access Private (role='student')
 */
exports.getStudentApplications = async (req, res) => {
    const { userId, role } = req.user; 
    const functionName = 'getStudentApplications'; 
    if (role !== 'student') return sendErrorResponse(res, 403, 'Chức năng này chỉ dành cho sinh viên.', functionName); 
    
    try { 
        const pool = await poolPromise; 
        
        // ===>>> TRUY VẤN "ĐẲNG CẤP" v2.0 <<<===
        // Thêm LEFT JOIN vào StudentInterviews để lấy si.id
        const result = await pool.request()
            .input('studentId', sql.Int, userId)
            .query(` 
                SELECT 
                    j.id as jobId, j.title, j.location, j.salary, j.jobType, j.status as jobStatus, 
                    c.name as companyName, c.logoUrl as companyLogoUrl, c.slug as companySlug, 
                    ja.id as applicationId, ja.status as applicationStatus, ja.appliedAt,
                    si.id as studentInterviewId -- <<<=== "BÙNG NỔ" - LẤY ID BÀI PHỎNG VẤN
                FROM JobApplications ja 
                JOIN Jobs j ON ja.jobId = j.id 
                JOIN Companies c ON j.companyId = c.id
                LEFT JOIN StudentInterviews si ON si.applicationId = ja.id -- <<<=== JOIN "BẤT TỬ"
                WHERE ja.studentId = @studentId 
                ORDER BY ja.appliedAt DESC; 
            `);

        // ===>>> MAPPER "TOÀN DIỆN" v2.0 <<<===
        const applications = result.recordset.map(row => ({ 
            id: row.applicationId, 
            status: row.applicationStatus, 
            appliedAt: row.appliedAt, 
            title: row.title, 
            companyName: row.companyName, 
            studentInterviewId: row.studentInterviewId, // <<<=== TRƯỜNG DỮ LIỆU MỚI
            job: { 
                id: row.jobId, 
                title: row.title, 
                location: row.location, 
                salary: row.salary, 
                jobType: row.jobType, 
                status: row.jobStatus, 
                company: { 
                    name: row.companyName, 
                    logoUrl: row.companyLogoUrl, 
                    slug: row.companySlug 
                } 
            } 
        })); 
        
        sendSuccessResponse(res, 200, applications); 
        
    } catch (error) { 
        sendErrorResponse(res, 500, 'Lỗi máy chủ khi lấy lịch sử ứng tuyển.', functionName, error, { userId }); 
    }
};
// ====================================================================
// KẾT THÚC FILE CONTROLLER
// ====================================================================
console.log("✅✅✅ api.controller.js (Tối Thượng - Use Helpers & Forced Fake AI v2.4.1 - Đẳng Cấp Master) loaded.");