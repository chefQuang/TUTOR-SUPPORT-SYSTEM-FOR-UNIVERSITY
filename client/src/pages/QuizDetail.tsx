import React, { useState, useEffect, useRef } from 'react';
import StudentLayout from './StudentLayout';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './QuizDetail.css';

// --- Types ---
interface Question { id: string; text: string; options: string[]; }
interface QuizData { 
  id: string; title: string; description: string; 
  duration: number; attempts: number; questions: Question[]; 
}
interface Submission { score: number; status: string; submittedAt: string; attemptCount?: number; }

const QuizDetail = () => {
  const { courseId, itemId } = useParams();
  const navigate = useNavigate();
  
  // Data State
  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);

  // Play State
  const [isStarted, setIsStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0); // Giây
  const [currentQIdx, setCurrentQIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({}); // Map: QuestionID -> OptionIndex
  
  const timerRef = useRef<any>(null);
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  // 1. Load Data
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Lấy đề bài
        const resItem = await axios.get(`http://localhost:5000/api/courses/item?courseId=${courseId}&itemId=${itemId}`);
        if(resItem.data.success) setQuiz(resItem.data.data);

        // Lấy lịch sử làm bài (nếu có)
        const resSub = await axios.get(`http://localhost:5000/api/courses/submission?studentId=${user.id}&itemId=${itemId}`);
        if(resSub.data.success && resSub.data.data) setSubmission(resSub.data.data);
      } catch (err) { console.error(err); } finally { setLoading(false); }
    };
    fetchData();
  }, [courseId, itemId]);

  // 2. Timer Logic
  useEffect(() => {
    if (isStarted && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (isStarted && timeLeft === 0) {
      clearInterval(timerRef.current);
      handleSubmit(true); // Auto submit
    }
    return () => clearInterval(timerRef.current);
  }, [isStarted, timeLeft]);

  // Handle Start
  const handleStart = () => {
    if (!quiz) return;
    if (window.confirm(`Start quiz? You have ${quiz.duration} minutes.`)) {
      setIsStarted(true);
      setTimeLeft(quiz.duration * 60);
      setAnswers({});
      setCurrentQIdx(0);
    }
  };

  // Handle Select Option
  const handleSelectOption = (qId: string, optIdx: number) => {
    setAnswers(prev => ({ ...prev, [qId]: optIdx }));
  };

  // Handle Submit
  const handleSubmit = async (auto = false) => {
    if (!auto && !window.confirm("Are you sure you want to finish and submit?")) return;
    
    // Dừng timer ngay lập tức
    clearInterval(timerRef.current);
    setIsStarted(false);

    // Tính điểm giả lập (Demo logic: Random điểm nếu BE chưa tính thực)
    // Trong thực tế: Gửi answers về BE, BE so sánh đáp án đúng và trả về điểm.
    const mockScore = Math.floor(Math.random() * 10) + 1; // Random 1-10 cho vui

    try {
      const res = await axios.post('http://localhost:5000/api/courses/submit-quiz', {
        studentId: user.id,
        itemId: itemId,
        score: mockScore // Gửi điểm hoặc answers
      });
      
      if (res.data.success) {
        alert(auto ? "Time's up! Quiz submitted automatically." : "Quiz Submitted Successfully!");
        // Reload lại submission để hiện kết quả
        const resSub = await axios.get(`http://localhost:5000/api/courses/submission?studentId=${user.id}&itemId=${itemId}`);
        if(resSub.data.success) setSubmission(resSub.data.data);
      }
    } catch (err) { alert("Submission failed. Please contact support."); }
  };

  // Format Time (MM:SS)
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (loading || !quiz) return <div className="quiz-loading">Loading Quiz...</div>;

  return (
    <StudentLayout title="Quiz Assessment">
      <div className="quiz-container">
        
        {/* --- MÀN HÌNH CHỜ / KẾT QUẢ --- */}
        {!isStarted && (
          <div className="quiz-intro-card">
            <button className="btn-back-quiz" onClick={() => navigate(-1)}>← Back to Course</button>
            
            <div className="quiz-header-content">
              <span className="quiz-badge">Quiz</span>
              <h1>{quiz.title}</h1>
              <p>{quiz.description}</p>
            </div>

            <div className="quiz-info-grid">
              <div className="info-box">
                <span className="label">Duration</span>
                <span className="value">{quiz.duration} min</span>
              </div>
              <div className="info-box">
                <span className="label">Attempts</span>
                <span className="value">{quiz.attempts}</span>
              </div>
              <div className="info-box">
                <span className="label">Questions</span>
                <span className="value">{quiz.questions.length}</span>
              </div>
            </div>

            {submission ? (
              <div className="result-box">
                <h3>Best Result</h3>
                <div className="score-display">{submission.score}/10</div>
                <p className="submitted-at">Submitted on {new Date(submission.submittedAt).toLocaleString()}</p>
                <div className="action-row">
                  <button className="btn-start" onClick={handleStart}>Re-attempt Quiz</button>
                </div>
              </div>
            ) : (
              <div className="action-row">
                <button className="btn-start" onClick={handleStart}>Start Attempt</button>
              </div>
            )}
          </div>
        )}

        {/* --- MÀN HÌNH LÀM BÀI --- */}
        {isStarted && (
          <div className="quiz-play-interface">
            
            {/* Header: Timer & Progress */}
            <div className="play-header">
              <div className="question-counter">
                Question {currentQIdx + 1} <span style={{color:'#94a3b8'}}>/ {quiz.questions.length}</span>
              </div>
              <div className={`timer-box ${timeLeft < 60 ? 'urgent' : ''}`}>
                ⏱ {formatTime(timeLeft)}
              </div>
            </div>

            {/* Question Area */}
            <div className="question-area">
              <h2 className="q-text">{quiz.questions[currentQIdx].text}</h2>
              
              <div className="options-list">
                {quiz.questions[currentQIdx].options.map((opt, idx) => (
                  <div 
                    key={idx}
                    className={`option-item ${answers[quiz.questions[currentQIdx].id] === idx ? 'selected' : ''}`}
                    onClick={() => handleSelectOption(quiz.questions[currentQIdx].id, idx)}
                  >
                    <div className="opt-marker">{String.fromCharCode(65 + idx)}</div>
                    <div className="opt-content">{opt}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer Navigation */}
            <div className="play-footer">
              <button 
                className="btn-nav prev"
                disabled={currentQIdx === 0}
                onClick={() => setCurrentQIdx(curr => curr - 1)}
              >
                Previous
              </button>

              {/* Danh sách câu hỏi nhỏ để nhảy nhanh */}
              <div className="quick-nav">
                {quiz.questions.map((_, idx) => (
                  <div 
                    key={idx} 
                    className={`nav-dot ${currentQIdx === idx ? 'active' : ''} ${answers[quiz.questions[idx].id] !== undefined ? 'answered' : ''}`}
                    onClick={() => setCurrentQIdx(idx)}
                  />
                ))}
              </div>

              {currentQIdx < quiz.questions.length - 1 ? (
                <button className="btn-nav next" onClick={() => setCurrentQIdx(curr => curr + 1)}>
                  Next Question →
                </button>
              ) : (
                <button className="btn-submit-quiz" onClick={() => handleSubmit(false)}>
                  Submit Quiz
                </button>
              )}
            </div>
          </div>
        )}

      </div>
    </StudentLayout>
  );
};

export default QuizDetail;