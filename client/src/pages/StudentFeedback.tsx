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
  feedbackData: FeedbackData | null; // Dữ liệu feedback cũ (nếu có)
}

// --- CARD COMPONENT ---
const FeedbackCardItem = ({ course, studentId, onUpdate }: { 
  course: FeedbackCandidate, 
  studentId: string, 
  onUpdate: () => void 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [ratings, setRatings] = useState({ overall: 0, teaching: 0, material: 0, difficulty: 0 });
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load dữ liệu cũ khi mở card (nếu có)
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
      // Nếu chưa có, reset về 0
      setRatings({ overall: 0, teaching: 0, material: 0, difficulty: 0 });
      setComment('');
    }
  }, [course.feedbackData]);

  const toggleExpand = () => setIsExpanded(!isExpanded);

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

  // Xử lý Submit (Tạo mới hoặc Update)
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
      onUpdate(); // Refresh data từ server
      // Không đóng form, giữ nguyên để user biết đã submit và có thể sửa
      alert("Feedback saved successfully!"); 
    } catch (error: any) {
      alert("Error saving feedback");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Xử lý Cancel / Withdraw
  const handleCancel = async () => {
    if (course.feedbackData) {
      // Nếu đã submit -> Hành động là XOÁ (Withdraw)
      if (window.confirm("Are you sure you want to withdraw this feedback?")) {
        try {
          await axios.delete('http://localhost:5000/api/student/feedback', {
            data: { studentId, courseId: course.courseId }
          });
          onUpdate(); // Refresh data -> Form sẽ reset về trạng thái chưa điền
          setRatings({ overall: 0, teaching: 0, material: 0, difficulty: 0 });
          setComment('');
        } catch (e) { alert("Failed to withdraw feedback"); }
      }
    } else {
      // Nếu chưa submit -> Hành động là RESET form
      setRatings({ overall: 0, teaching: 0, material: 0, difficulty: 0 });
      setComment('');
    }
  };

  const isSubmitted = !!course.feedbackData;

  return (
    <div className={`feedback-card-item ${isExpanded ? 'expanded' : ''}`}>
      
      {/* HEADER: Luôn hiển thị */}
      <div className="card-header-content">
        <div className="course-info">
          <h3 className="fb-course-name">
            {course.courseName}
            {isSubmitted && <span className="tag-submitted">Submitted</span>}
          </h3>
          <div className="fb-course-meta">
            <span className="fb-meta-tag">{course.courseId}</span>
            <span className="fb-meta-tag">{course.credits} Credits</span>
            <span>• {course.tutorName}</span>
          </div>
          
          {!isExpanded && !isSubmitted && (
            <div className="fb-hint-text">Click "Provide Feedback" to share your thoughts.</div>
          )}
          {!isExpanded && isSubmitted && (
            <div className="fb-hint-text" style={{color: '#166534'}}>You have reviewed this course. Click Edit to change.</div>
          )}
        </div>

        {/* Nút Toggle: Thay đổi dựa trên trạng thái expanded */}
        <button 
          className={`btn-toggle-form ${isExpanded ? 'btn-close' : (isSubmitted ? 'btn-edit' : 'btn-open')}`} 
          onClick={toggleExpand}
        >
          {isExpanded ? 'Close' : (isSubmitted ? 'Review / Edit' : 'Provide Feedback')}
        </button>
      </div>

      {/* FORM BODY */}
      <div className="form-expandable-body">
        
        <div className="rating-row-full">
          <label className="fb-label required">Overall Rating</label>
          {renderStars(ratings.overall, 'overall')}
        </div>

        <div className="ratings-grid">
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
          </div>
        </div>

        <div style={{marginBottom:'24px'}}>
          <label className="fb-label">Additional Comments</label>
          <textarea 
            className="fb-textarea"
            placeholder="Share your thoughts..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
        </div>

        <div className="form-actions-footer">
          {/* Nút Cancel: Chức năng thay đổi tùy context */}
          <button className="btn-cancel-form" onClick={handleCancel}>
            {isSubmitted ? 'Withdraw Feedback' : 'Reset Form'}
          </button>
          
          <button 
            className="btn-submit" 
            onClick={handleSubmit} 
            disabled={ratings.overall === 0 || isSubmitting}
          >
            {isSubmitting ? 'Saving...' : (isSubmitted ? 'Update Feedback' : 'Submit Feedback')}
          </button>
        </div>

      </div>
    </div>
  );
};

const StudentFeedback = () => {
  const [candidates, setCandidates] = useState<FeedbackCandidate[]>([]);
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const fetchData = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/student/feedback-candidates?studentId=${user.id}`);
      if (res.data.success) {
        setCandidates(res.data.data);
      }
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchData(); }, []);

  // Tính toán số lượng cần feedback
  const pendingCount = candidates.filter(c => !c.feedbackData).length;

  return (
    <StudentLayout title="">
      <div className="feedback-page-container">
        <h1 className="fb-page-title">Feedback</h1>
        <p className="fb-page-desc">
          Share your honest feedback. Forms are available for a limited time after course completion.
        </p>

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
          <div style={{textAlign:'center', padding:'60px', background:'white', borderRadius:'16px', border:'1px dashed #e5e7eb'}}>
            <h3>No courses available for feedback.</h3>
            <p style={{color:'#6b7280'}}>Check back after you complete a course.</p>
          </div>
        )}
      </div>
    </StudentLayout>
  );
};

export default StudentFeedback;