// File: client/src/pages/student/InterviewPage.jsx
// PHIÊN BẢN v3.2 - "BẤT TỬ" (Đã sửa lỗi cú pháp & JSX "chí mạng")

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import { startInterview, submitInterview } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import { LoadingSpinner, ErrorDisplay } from '../../components/common/FeedbackComponents';
import { 
    Clock, ListChecks, ChevronLeft, ChevronRight, Send, CheckCircle, 
    AlertTriangle, Info, Save, MessageSquare 
} from 'lucide-react';

// --- Hằng số "Bất biến" ---
const LOCAL_STORAGE_PREFIX = 'eduledger_interview_session_';

// --- Hàm Helper "Chuyên biệt" ---
const formatTime = (totalSeconds) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.floor(totalSeconds % 60);
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

// --- Component Con "Chuyên biệt" ---

/**
 * [Component] Đồng hồ đếm ngược "Bất khả xâm phạm"
 */
const InterviewTimer = ({ timeLeftInSeconds }) => {
    const timeString = formatTime(timeLeftInSeconds);
    const isWarning = timeLeftInSeconds <= 300; // 5 phút cuối

    return (
        <motion.div 
            key={isWarning ? 'warning' : 'normal'}
            initial={{ scale: 1, opacity: 0.8 }}
            animate={{ scale: isWarning ? [1, 1.05, 1] : 1, opacity: 1 }}
            transition={isWarning ? { duration: 0.8, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' } : {}}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 ${
                isWarning 
                ? 'bg-red-900/40 border-red-700/80 text-red-300' 
                : 'bg-gray-700/60 border-gray-600/80 text-gray-200'
            }`}
        >
            <Clock className={`w-5 h-5 ${isWarning ? 'text-red-300' : 'text-blue-400'}`} />
            <span className="text-xl font-bold font-mono tracking-wider">{timeString}</span>
        </motion.div>
    );
};

/**
 * [Component] Bảng Hướng dẫn "Toàn diện"
 */
const InterviewInstructions = ({ interviewData, onStart, studentName }) => (
    <motion.div 
        initial={{ opacity: 0, scale: 0.95 }} 
        animate={{ opacity: 1, scale: 1 }} 
        className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-6"
    >
        <div className="bg-gray-800 p-8 md:p-12 rounded-2xl border border-gray-700 shadow-2xl max-w-3xl text-center">
            <h1 className="text-3xl font-bold text-white mb-3">Chào mừng, {studentName}!</h1>
            <p className="text-xl text-blue-300 mb-6">Bạn được mời tham gia bài phỏng vấn cho vị trí: <br/> <span className="font-bold">{interviewData.jobTitle}</span></p>
            
            <div className="bg-gray-700/50 p-6 rounded-lg border border-gray-600/80 mb-8 text-left space-y-4">
                <h2 className="text-xl font-semibold text-white flex items-center gap-2"><Info className="w-6 h-6 text-blue-400"/> Quy định "Bất biến":</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 text-gray-300">
                    <div className="flex items-start gap-3">
                        <ListChecks className="w-5 h-5 text-green-400 mt-1 flex-shrink-0" />
                        <span>Bài phỏng vấn có <strong className="text-white">{interviewData.questions.length}</strong> câu hỏi.</span>
                    </div>
                    <div className="flex items-start gap-3">
                        <Clock className="w-5 h-5 text-yellow-400 mt-1 flex-shrink-0" />
                        <span>Bạn có <strong className="text-white">{interviewData.timeLimitMinutes}</strong> phút để hoàn thành.</span>
                    </div>
                    <div className="flex items-start gap-3">
                        <Save className="w-5 h-5 text-blue-400 mt-1 flex-shrink-0" />
                        <span>Câu trả lời của bạn được <strong className="text-white">tự động lưu</strong> sau mỗi lần gõ.</span>
                    </div>
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-red-400 mt-1 flex-shrink-0" />
                        <span>Bài sẽ <strong className="text-white">tự động nộp</strong> khi hết giờ, ngay cả khi bạn chưa hoàn thành.</span>
                    </div>
                </div>
                <p className="text-sm text-gray-400 pt-3 border-t border-gray-600">
                    <strong className="text-yellow-300">Lưu ý:</strong> Khi nhấn "Bắt đầu", đồng hồ sẽ ngay lập tức đếm ngược. Hãy đảm bảo bạn đã sẵn sàng.
                </p>
            </div>

            <motion.button
                onClick={onStart}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-4 px-12 rounded-lg text-lg shadow-xl hover:shadow-purple-500/30 transition-all duration-300 transform hover:scale-105"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
            >
                Bắt đầu làm bài
            </motion.button>
        </div>
    </motion.div>
);

/**
 * [Component] Giao diện nộp bài "Hoàn tất"
 */
const InterviewCompleted = ({ navigate }) => (
    <motion.div 
        initial={{ opacity: 0, scale: 0.95 }} 
        animate={{ opacity: 1, scale: 1 }} 
        className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-6"
    >
        <div className="bg-gray-800 p-8 md:p-12 rounded-2xl border border-gray-700 shadow-2xl max-w-xl text-center">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.1, type: 'spring', stiffness: 200, damping: 10 }}>
                <CheckCircle className="w-24 h-24 text-green-500 mx-auto mb-6" />
            </motion.div>
            <h1 className="text-3xl font-bold text-white mb-3">Nộp bài thành công!</h1>
            <p className="text-gray-300 mb-8">
                Câu trả lời của bạn đã được gửi đến nhà tuyển dụng. AI sẽ sớm chấm điểm bài làm của bạn.
                Hãy quay lại "Hành trình Ứng tuyển" trong Dashboard để theo dõi kết quả.
            </p>
            <motion.button
                onClick={() => navigate('/dashboard?tab=applications')}
                className="bg-blue-600 text-white font-bold py-3 px-8 rounded-lg shadow-lg hover:bg-blue-700 transition-all duration-300 transform hover:scale-105"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
            >
                Quay về Dashboard
            </motion.button>
        </div>
    </motion.div>
);

/**
 * [Component] "Đấu trường" chính, chứa toàn bộ logic làm bài
 */
const InterviewArena = ({ interviewData, answers, setAnswers, timeLeft, onSubmit }) => {
    const { questions } = interviewData;
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // (Giữ nguyên logic bên trong component này: handleAnswerChange, useEffect lưu localStorage, goToPrev, goToNext, handleSubmitClick...)
    // ... (Toàn bộ logic nội bộ của InterviewArena không thay đổi) ...
    const navigate = useNavigate();
    const currentQuestion = questions[currentQuestionIndex];
    const currentAnswerText = answers.get(currentQuestion.id) || "";
    const storageKey = `${LOCAL_STORAGE_PREFIX}${interviewData.studentInterviewId}`;
    const handleAnswerChange = (e) => {
        const newText = e.target.value;
        setAnswers(prevMap => new Map(prevMap).set(currentQuestion.id, newText));
    };
    useEffect(() => {
        const answersToStore = Object.fromEntries(answers);
        localStorage.setItem(storageKey, JSON.stringify(answersToStore));
        console.log(`[InterviewPage] Auto-saved ${answers.size} answers to localStorage.`);
    }, [answers, storageKey]);
    const goToPrev = () => setCurrentQuestionIndex(prev => Math.max(0, prev - 1));
    const goToNext = () => setCurrentQuestionIndex(prev => Math.min(questions.length - 1, prev + 1));
    const goToIndex = (index) => setCurrentQuestionIndex(index);
    const handleSubmitClick = async () => {
        const unansweredCount = questions.filter(q => !answers.get(q.id)?.trim()).length;
        let confirmationMessage = "Bạn có chắc chắn muốn nộp bài không?";
        if (unansweredCount > 0) {
            confirmationMessage = `Bạn còn ${unansweredCount} câu chưa trả lời. Bạn có chắc chắn muốn nộp bài không?`;
        }
        if (window.confirm(confirmationMessage)) {
            setIsSubmitting(true);
            await onSubmit(false); 
        }
    };
    // ... (Kết thúc logic nội bộ) ...

    return (
        <div className="flex flex-col h-screen max-h-screen bg-gray-900 text-white overflow-hidden">
            {/* --- Header "Đấu trường" --- */}
            <header className="flex-shrink-0 bg-gray-800 border-b border-gray-700 px-6 py-4 flex justify-between items-center shadow-md z-10">
                <div>
                    <h1 className="text-xl font-bold text-white truncate max-w-md" title={interviewData.jobTitle}>
                        Phỏng vấn: {interviewData.jobTitle}
                    </h1>
                    <p className="text-sm text-gray-400">Đang thực hiện câu {currentQuestionIndex + 1} / {questions.length}</p>
                </div>
                <InterviewTimer timeLeftInSeconds={timeLeft} />
            </header>

            {/* --- Body "Đấu trường" (Chia 2 cột) --- */}
            <div className="flex flex-1 min-h-0">
                
                {/* Cột 1: Điều hướng Câu hỏi (Sidebar) */}
                <nav className="w-1/4 max-w-xs flex-shrink-0 bg-gray-800/50 border-r border-gray-700/80 p-4 overflow-y-auto styled-scrollbar">
                    <h2 className="text-sm font-semibold uppercase text-gray-400 tracking-wider mb-3">Danh sách Câu hỏi</h2>
                    <div className="space-y-2">
                        {questions.map((q, index) => {
                            const isAnswered = (answers.get(q.id) || "").trim().length > 0;
                            const isActive = index === currentQuestionIndex;
                            return (
                                <button
                                    key={q.id}
                                    onClick={() => goToIndex(index)}
                                    className={`w-full text-left flex items-center gap-3 p-3 rounded-md transition-all duration-200 text-sm ${
                                        isActive
                                        ? 'bg-blue-600 text-white font-semibold shadow-lg'
                                        : 'text-gray-300 hover:bg-gray-700/70 hover:text-white'
                                    }`}
                                >
                                    {isAnswered ? (
                                        <CheckCircle className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-white' : 'text-green-500'}`} />
                                    ) : (
                                        <MessageSquare className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-blue-200' : 'text-gray-500'}`} />
                                    )}
                                    <span className="flex-grow truncate">Câu {index + 1}</span>
                                    {isActive && <ChevronRight className="w-4 h-4 flex-shrink-0" />}
                                </button>
                            );
                        })}
                    </div>
                </nav>

                {/* Cột 2: Nội dung Câu hỏi & Trả lời (Main) */}
                <main className="flex-1 flex flex-col overflow-hidden">
                    {/* Phần nội dung câu hỏi (scroll) */}
                    <div className="flex-1 p-6 md:p-8 overflow-y-auto styled-scrollbar">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={currentQuestion.id}
                                initial={{ opacity: 0, x: 50 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -50 }}
                                transition={{ duration: 0.25, ease: 'easeInOut' }}
                            >
                                <div className="mb-6">
                                    <p className="text-sm font-semibold text-blue-300 mb-2">Câu {currentQuestionIndex + 1} / {questions.length}</p>
                                    <p className="text-lg md:text-xl text-gray-100 font-medium leading-relaxed" style={{ whiteSpace: 'pre-wrap' }}>
                                        {currentQuestion.questionText}
                                    </p>
                                </div>
                                <textarea
                                    value={currentAnswerText}
                                    onChange={handleAnswerChange}
                                    placeholder="Nhập câu trả lời của bạn tại đây..."
                                    className="w-full h-full min-h-[300px] md:min-h-[400px] p-4 bg-gray-900/70 border-2 border-gray-700 rounded-lg text-gray-200 text-base leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 styled-scrollbar resize-none"
                                    aria-label={`Câu trả lời cho câu hỏi ${currentQuestionIndex + 1}`}
                                />
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* Footer (Điều hướng & Nộp bài) */}
                    <footer className="flex-shrink-0 bg-gray-800/50 border-t border-gray-700 p-4 flex justify-between items-center">
                        <motion.button
                            onClick={goToPrev}
                            disabled={currentQuestionIndex === 0}
                            className="flex items-center gap-2 py-2 px-5 rounded-md bg-gray-600 text-white font-semibold transition-colors hover:bg-gray-500 disabled:opacity-40 disabled:cursor-not-allowed"
                            whileTap={{ scale: 0.95 }}
                        >
                            <ChevronLeft className="w-5 h-5" /> Câu trước
                        </motion.button>
                        
                        {/* Nút nộp bài "Bất tử" (chỉ hiển thị ở câu cuối) */}
                        {currentQuestionIndex === questions.length - 1 ? (
                            <motion.button
                                onClick={handleSubmitClick}
                                disabled={isSubmitting}
                                className="flex items-center gap-2 py-2 px-6 rounded-md bg-green-600 text-white font-bold transition-colors shadow-lg hover:bg-green-500 disabled:opacity-50"
                                whileTap={{ scale: 0.95 }}
                            >
                                <Send className="w-5 h-5" /> {isSubmitting ? 'Đang nộp...' : 'Hoàn thành & Nộp bài'}
                            </motion.button>
                        ) : (
                            <motion.button
                                onClick={goToNext}
                                disabled={currentQuestionIndex === questions.length - 1}
                                className="flex items-center gap-2 py-2 px-5 rounded-md bg-blue-600 text-white font-semibold transition-colors shadow-md hover:bg-blue-500 disabled:opacity-40"
                                whileTap={{ scale: 0.95 }}
                            >
                                Câu tiếp theo <ChevronRight className="w-5 h-5" />
                            </motion.button>
                        )}
                    </footer>
                </main>
            </div>
        </div>
    );
};

// ==========================================================
// === COMPONENT "ĐẤU TRƯỜNG" CHÍNH (MASTER v3.2) ===
// ==========================================================
export default function InterviewPage() {
    const { interviewId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    
    const [view, setView] = useState('loading'); // 'loading', 'instructions', 'taking', 'submitting', 'completed', 'error'
    const [error, setError] = useState('');
    const [interviewData, setInterviewData] = useState(null); // { questions, timeLimitMinutes, timeStarted, jobTitle }
    const [timeLeft, setTimeLeft] = useState(null); // (number) số giây còn lại
    
    const [answers, setAnswers] = useState(new Map());
    
    const timerRef = useRef(null); 
    const storageKey = useMemo(() => `${LOCAL_STORAGE_PREFIX}${interviewId}`, [interviewId]);

    // Hàm nộp bài "Tối thượng"
    const handleSubmit = useCallback(async (isAutoSubmit = false) => {
        if (view === 'submitting' || view === 'completed') return; 
        
        console.log(`[InterviewPage] Submitting... (AutoSubmit: ${isAutoSubmit})`);
        setView('submitting');
        if (timerRef.current) clearInterval(timerRef.current); 

        const formattedAnswers = Array.from(answers.entries()).map(([qId, text]) => ({
            questionId: qId,
            answerText: text
        }));

        try {
            await submitInterview(interviewId, formattedAnswers);
            localStorage.removeItem(storageKey); 
            setView('completed');
        } catch (err) {
            console.error("[InterviewPage] Submit failed:", err);
            setError(`Nộp bài thất bại: ${err.message}. Vui lòng thử lại.`);
            setView('taking'); 
        }
    }, [interviewId, answers, storageKey, view]);


    // Effect "Bất tử": Tải đề bài và Khởi động "Đấu trường"
    useEffect(() => {
        if (!interviewId) {
            setView('error');
            setError("ID bài phỏng vấn không hợp lệ.");
            return;
        }

        const loadInterview = async () => {
            try {
                console.log(`[InterviewPage] Calling startInterview for ID: ${interviewId}`);
                const data = await startInterview(interviewId);
                
                const savedAnswersRaw = localStorage.getItem(storageKey);
                let loadedAnswers = new Map();
                if (savedAnswersRaw) {
                    console.log("[InterviewPage] Found saved answers in localStorage. Loading...");
                    const savedAnswersObj = JSON.parse(savedAnswersRaw);
                    data.questions.forEach(q => {
                        if (savedAnswersObj[q.id]) {
                            loadedAnswers.set(q.id, savedAnswersObj[q.id]);
                        }
                    });
                }
                setAnswers(loadedAnswers);

                const serverTimeStarted = new Date(data.timeStarted).getTime();
                const timeLimitMs = data.timeLimitMinutes * 60 * 1000;
                const endTime = serverTimeStarted + timeLimitMs;

                timerRef.current = setInterval(() => {
                    const now = Date.now();
                    const secondsLeft = Math.max(0, (endTime - now) / 1000);
                    
                    setTimeLeft(secondsLeft);

                    if (secondsLeft <= 0) {
                        clearInterval(timerRef.current);
                        console.log("[InterviewPage] Time is up! Auto-submitting...");
                        // ===>>> SỬA LỖI CÚ PHÁP (v3.2) <<<===
                        // Bỏ dấu ( thừa
                        handleSubmit(true); // Tự động nộp
                    }
                }, 1000);

                setInterviewData(data);
                setView('instructions'); 

            } catch (err) {
                console.error("[InterviewPage] Failed to load interview:", err);
                setError(err.message || "Không thể tải bài phỏng vấn. (Có thể bạn không có quyền hoặc bài đã hết hạn).");
                setView('error');
            }
        };

        loadInterview();

        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, [interviewId, storageKey, handleSubmit]); // Thêm handleSubmit vào dependencies

    // --- Render "Trạng thái" (View-based Rendering) ---

    if (view === 'loading') {
        // ===>>> SỬA LỖI JSX (v3.2) <<<===
        return <div className="min-h-screen bg-gray-900 flex items-center justify-center"><LoadingSpinner text="Đang tải Đấu trường..." size="lg" /></div>;
    }

    if (view === 'error') {
        // ===>>> SỬA LỖI JSX (v3.2) <<<===
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center p-6">
                <ErrorDisplay 
                    message={error} 
                    details="Vui lòng quay lại Dashboard và thử lại. Nếu lỗi tiếp diễn, liên hệ nhà tuyển dụng."
                    onRetry={() => navigate('/dashboard?tab=applications')}
                />
            </div>
        );
    }
    
    if (view === 'instructions' && interviewData) {
        return <InterviewInstructions interviewData={interviewData} onStart={() => setView('taking')} studentName={user?.name || user?.githubUsername || ''} />;
    }

    if (view === 'taking' && interviewData && timeLeft !== null) {
        return <InterviewArena 
            interviewData={interviewData} 
            answers={answers}
            setAnswers={setAnswers}
            timeLeft={timeLeft}
            onSubmit={handleSubmit}
        />;
    }
    
    if (view === 'submitting') {
        // ===>>> SỬA LỖI JSX (v3.2) <<<===
        return <div className="min-h-screen bg-gray-900 flex items-center justify-center"><LoadingSpinner text="Đang nộp bài... Xin vui lòng không tắt trình duyệt!" size="lg" /></div>;
    }

    if (view === 'completed') {
        return <InterviewCompleted navigate={navigate} />;
    }
    
    // Fallback
    return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">Trạng thái không xác định.</div>;
}