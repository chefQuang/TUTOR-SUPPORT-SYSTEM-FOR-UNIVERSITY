import React, { useEffect, useState } from 'react';
import StudentLayout from './StudentLayout';
import axios from 'axios';
import './StudentFeedback.css';

interface FeedbackData {
  overallRating: number;
  teachingQuality: number;
  materialQuality: number;
  difficultyLevel: number;
  comment: string;
}

interface FeedbackCandidate {
  courseId: string;
  courseName: string;
  credits?: number;
  tutorName: string;
  feedbackData: FeedbackData | null;
}

// --- CARD CHO TỪNG MÔN ---
const FeedbackCardItem = ({ course, studentId, onUpdate }: { 
  course: FeedbackCandidate, 
  studentId: string, 
  onUpdate: () => void 
}) => {
  const [isExpanded, setIsExpanded] = useState(!course.feedbackData); 
  
  const [ratings, setRatings] = useState({ overall: 0, teaching: 0, material: 0, difficulty: 0 });
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load dữ liệu ban đầu
  useEffect(() => {
    if (course.feedbackData) {
      setRatings({
        overall: course.feedbackData.overallRating,
        teaching: course.feedbackData.teachingQuality,
        material: course.feedbackData.materialQuality,
        difficulty: course.feedbackData.difficultyLevel
      });
      setComment(course.feedbackData.comment);
    } else {
      setRatings({ overall: 0, teaching: 0, material: 0, difficulty: 0 });
      setComment('');
    }
  }, [course.feedbackData]);

  // CẬP NHẬT: Đơn giản hóa, chỉ đóng mở, không reset dữ liệu
  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const renderStars = (value: number, field: keyof typeof ratings) => (
    <div className="star-rating">
      {[1, 2, 3, 4, 5].map((star) => (
        <span 
          key={star} 
          className={`star-icon ${star <= value ? 'active' : ''}`}
          onClick={() => setRatings(prev => ({...prev, [field]: star}))}
        >★</span>
      ))}
    </div>
  );

  const handleSubmit = async () => {
    if (ratings.overall === 0) return;
    setIsSubmitting(true);
    try {
      await axios.post('http://localhost:5000/api/student/feedback', {
        studentId,
        courseId: course.courseId,
        courseName: course.courseName,
        ratings,
        comment
      });
      onUpdate();
      alert("Feedback saved successfully!");
    } catch (error: any) {
      alert("Error saving feedback");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Nút Cancel cho trường hợp chưa submit (để xóa trắng làm lại)
  const handleCancel = () => {
    setRatings({ overall: 0, teaching: 0, material: 0, difficulty: 0 });
    setComment('');
    setIsExpanded(false);
  };

  const isSubmitted = !!course.feedbackData;
  const isReady = ratings.overall > 0;

  return (
    <div className="feedback-card-item">
      {/* HEADER */}
      <div className="card-header-content">
        <div className="course-info">
          <h3 className="fb-course-name">
            {course.courseName}
            {isSubmitted && <span className="tag-submitted">Submitted</span>}
          </h3>
          <div className="fb-course-meta">
            <span>{course.courseId} • {course.credits || 3} credits</span>
          </div>
          {!isExpanded && (
            <div className="fb-hint-text">Click "Provide Feedback" (or Review) to view form.</div>
          )}
        </div>

        <button 
          className="btn-toggle-form btn-close" 
          onClick={toggleExpand}
        >
          {isExpanded ? 'Close' : (isSubmitted ? 'Review' : 'Provide Feedback')}
        </button>
      </div>

      {/* FORM BODY */}
      {isExpanded && (
        <div className="form-expandable-body">
          <div className="rating-section">
            <div className="rating-row-main">
              <label className="fb-label required">Overall Rating</label>
              {renderStars(ratings.overall, 'overall')}
            </div>

            <div className="rating-grid-three-col">
              <div>
                <label className="fb-label">Teaching Quality</label>
                {renderStars(ratings.teaching, 'teaching')}
              </div>
              <div>
                <label className="fb-label">Material Quality</label>
                {renderStars(ratings.material, 'material')}
              </div>
              <div>
                <label className="fb-label">Difficulty Level</label>
                {renderStars(ratings.difficulty, 'difficulty')}
                <span className="difficulty-helper">1 = Easy, 5 = Hard</span>
              </div>
            </div>
          </div>

          <label className="fb-label" style={{marginTop: '24px'}}>Additional Comments</label>
          <textarea 
            className="fb-textarea"
            placeholder="Share your thoughts, suggestions, or experiences with this course..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
          <div className="privacy-hint">Your feedback is anonymous and will help improve the course</div>

          <div className="form-actions-footer">
            
            {/* CẬP NHẬT: Chỉ hiện nút Cancel khi CHƯA submit */}
            {!isSubmitted && (
              <button className="btn-cancel-form" onClick={handleCancel}>
                Cancel
              </button>
            )}
            
            <button 
              className={`btn-submit ${isReady ? 'ready' : ''}`} 
              onClick={handleSubmit}
              disabled={!isReady || isSubmitting}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
              {isSubmitting ? 'Saving...' : (isSubmitted ? 'Update Feedback' : 'Submit Feedback')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// --- MAIN PAGE ---
const StudentFeedback = () => {
  const [candidates, setCandidates] = useState<FeedbackCandidate[]>([]);
  const [historyCount, setHistoryCount] = useState(0);
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const fetchData = async () => {
    try {
      const resC = await axios.get(`http://localhost:5000/api/student/feedback-candidates?studentId=${user.id}`);
      if (resC.data.success) setCandidates(resC.data.data);
      
      const submittedCount = resC.data.data.filter((c: any) => c.feedbackData).length;
      setHistoryCount(submittedCount);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchData(); }, []);

  const totalCourses = candidates.length;
  const pendingCount = totalCourses - historyCount;

  return (
    <StudentLayout title="">
      <div className="feedback-page-container">
        
        <h1 className="fb-page-title">Feedback</h1>

        <div className="big-white-card">
          <div className="card-internal-header">
            <h2 className="fb-card-title">Course Feedback</h2>
            <p className="fb-card-desc">Share your experience and help improve the learning experience for everyone.</p>
          </div>

          {candidates.length > 0 ? (
            candidates.map(course => (
              <FeedbackCardItem 
                key={course.courseId} 
                course={course} 
                studentId={user.id}
                onUpdate={fetchData}
              />
            ))
          ) : (
            <div style={{textAlign:'center', padding:'40px', color:'#6b7280'}}>
              No courses available for feedback at this time.
            </div>
          )}

          <div className="summary-blue-card">
            <div className="summary-text-main">
              {historyCount} of {totalCourses} courses reviewed
            </div>
            <div className="summary-text-sub">
              {pendingCount} course(s) pending feedback
            </div>
          </div>

        </div>
      </div>
    </StudentLayout>
  );
};

export default StudentFeedback;