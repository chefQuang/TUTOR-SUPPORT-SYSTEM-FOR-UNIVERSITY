import React, { useState } from 'react';
import StudentLayout from './StudentLayout';
import axios from 'axios';
import './CourseRegistration.css';

// Type chuẩn theo cấu trúc mới
interface ClassInfo {
  classId: string;
  tutorName: string;
  scheduleOverview: string;
  isRegistered: boolean;
  capacity: number;
  enrolledStudentIds: string[];
}

interface CourseResult {
  courseId: string;
  courseName: string;
  credits: number;
  classes: ClassInfo[];
}

const CourseRegistration = () => {
  const [query, setQuery] = useState('');
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  // State lưu danh sách MÔN HỌC tìm được
  const [courses, setCourses] = useState<CourseResult[]>([]);
  
  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState<ClassInfo | null>(null);
  const [selectedCourseName, setSelectedCourseName] = useState('');

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleSearch = async () => {
    setIsError(false);
    setErrorMessage('');
    setCourses([]);

    if (!query.trim()) return;

    try {
      const res = await axios.get(`http://localhost:5000/api/student/search?q=${query}&studentId=${user.id}`);
      if (res.data.success) {
        setCourses(res.data.data);
      }
    } catch (err: any) {
      setIsError(true);
      setErrorMessage(err.response?.data?.message || "Course not found");
    }
  };

  const openConfirmModal = (cls: ClassInfo, courseName: string) => {
    setSelectedClass(cls);
    setSelectedCourseName(courseName);
    setShowModal(true);
  };

  const handleConfirmRegister = async () => {
    if (!selectedClass) return;

    try {
      const res = await axios.post('http://localhost:5000/api/student/register', {
        studentId: user.id,
        classId: selectedClass.classId
      });

      if (res.data.success) {
        alert("Registration Successful!");
        setShowModal(false);
        handleSearch(); // Load lại để update UI
      }
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to register");
      setShowModal(false);
    }
  };

  return (
    <StudentLayout title="Course Registration">
      
      {/* SEARCH BAR */}
      <div className="search-container">
        <label style={{fontWeight: 600, color: '#334155', marginBottom: '8px', display: 'block'}}>
          Find Course
        </label>
        <div className="search-box">
          <input 
            type="text" 
            className={`search-input ${isError ? 'error' : ''}`}
            placeholder="Search by Course Name or ID (e.g., Software)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button className="search-btn" onClick={handleSearch}>Search</button>
        </div>
        {isError && <span className="error-text">⚠️ {errorMessage}</span>}
      </div>

      {/* RESULTS LIST (HIERARCHY VIEW) */}
      <div className="results-list">
        {courses.map((course) => (
          <div key={course.courseId} className="course-group-card">
            {/* Header Môn Học */}
            <div className="course-header">
              <h2 style={{margin: 0, color: '#0033cc'}}>{course.courseName}</h2>
              <span className="badge-id">{course.courseId}</span>
              <span className="badge-credits">{course.credits} Credits</span>
            </div>

            {/* Danh sách Lớp của môn đó */}
            <div className="class-grid">
              {course.classes.length > 0 ? (
                course.classes.map((cls) => (
                  <div key={cls.classId} className="class-row">
                    <div className="class-details">
                      <div className="class-id">Class: <strong>{cls.classId}</strong></div>
                      <div className="tutor-name">👨‍🏫 {cls.tutorName}</div>
                      <div className="schedule">📅 {cls.scheduleOverview}</div>
                      <div className="slots">Slots: {cls.enrolledStudentIds.length}/{cls.capacity}</div>
                    </div>
                    
                    <div className="class-action">
                      {cls.isRegistered ? (
                        <button className="reg-btn registered" disabled>
                          ✓ Enrolled
                        </button>
                      ) : (
                        <button 
                          className="reg-btn available" 
                          onClick={() => openConfirmModal(cls, course.courseName)}
                        >
                          Register Class
                        </button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p style={{padding: '15px', color: '#666', fontStyle: 'italic'}}>No classes open for registration.</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* MODAL */}
      {showModal && selectedClass && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 style={{color: '#0033cc', marginTop: 0}}>Confirm Enrollment</h2>
            <p className="modal-desc">Are you sure you want to register for this class?</p>
            
            <div className="confirm-box">
              <div className="confirm-row"><span>Course:</span> <strong>{selectedCourseName}</strong></div>
              <div className="confirm-row"><span>Class ID:</span> <strong>{selectedClass.classId}</strong></div>
              <div className="confirm-row"><span>Tutor:</span> <strong>{selectedClass.tutorName}</strong></div>
              <div className="confirm-row"><span>Schedule:</span> <strong>{selectedClass.scheduleOverview}</strong></div>
            </div>

            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn-confirm" onClick={handleConfirmRegister}>Confirm Registration</button>
            </div>
          </div>
        </div>
      )}

    </StudentLayout>
  );
};

export default CourseRegistration;