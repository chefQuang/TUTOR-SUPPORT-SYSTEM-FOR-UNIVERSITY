import React, { useState, useEffect } from 'react';
import StudentLayout from './StudentLayout';
import axios from 'axios';
import './StudentPerformance.css';

// --- Types ---
interface GradeComponent {
  name: string;
  weight: number;
  score: number;
}

interface CoursePerf {
  courseId: string;
  courseName: string;
  classId: string;
  status: 'Completed' | 'Studying' | 'Withdrawn';
  finalScore: number | null;
  letterGrade: string | null;
  components?: GradeComponent[]; // Chỉ có khi xem detail
}

const StudentPerformance = () => {
  const [view, setView] = useState<'list' | 'detail'>('list');
  const [courses, setCourses] = useState<CoursePerf[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<CoursePerf | null>(null);
  const [query, setQuery] = useState('');
  const [hoveredSegment, setHoveredSegment] = useState<string | null>(null);

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  // Load danh sách khóa học
  useEffect(() => {
    fetchCourses();
  }, [query]); // Reload khi search

  const fetchCourses = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/student/performance?studentId=${user.id}&q=${query}`);
      if(res.data.success) setCourses(res.data.data);
    } catch (err) { console.error(err); }
  };

  // Load chi tiết khóa học khi click
  const handleSelectCourse = async (courseId: string) => {
    try {
      const res = await axios.get(`http://localhost:5000/api/student/performance-detail?studentId=${user.id}&courseId=${courseId}`);
      if(res.data.success) {
        setSelectedCourse(res.data.data);
        setView('detail');
        setHoveredSegment(null);
      }
    } catch (err) { console.error(err); }
  };

  // --- LOGIC VẼ BIỂU ĐỒ TRÒN (DONUT SVG) ---
  const renderDonutChart = (components: GradeComponent[]) => {
    const size = 100; // viewBox size
    const rad = 40;   // Bán kính
    const circumference = 2 * Math.PI * rad;
    let offset = 0; // Để xếp các miếng nối tiếp nhau

    // Màu sắc cho các thành phần (Gradient simulation)
    const colors = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];

    return (
      <svg width="250" height="250" viewBox="0 0 100 100" className="donut-chart">
        {/* Vòng nền xám */}
        <circle cx="50" cy="50" r={rad} className="donut-bg" />
        
        {/* Các miếng (Segments) */}
        {components.map((comp, idx) => {
          const segmentLength = (comp.weight / 100) * circumference;
          const strokeDasharray = `${segmentLength} ${circumference}`;
          const currentOffset = offset;
          offset += segmentLength; // Cộng dồn cho miếng tiếp theo

          return (
            <circle
              key={idx}
              cx="50" cy="50" r={rad}
              className="donut-segment"
              stroke={colors[idx % colors.length]}
              strokeDasharray={strokeDasharray}
              strokeDashoffset={-currentOffset} // Xoay miếng đến đúng vị trí
              onMouseEnter={() => setHoveredSegment(`${comp.name}: ${comp.score} (${comp.weight}%)`)}
              onMouseLeave={() => setHoveredSegment(null)}
            />
          );
        })}
      </svg>
    );
  };

  // --- RENDER MAIN LIST ---
  const renderList = () => (
    <>
      <div className="perf-search">
        <input 
          type="text" 
          className="search-input" 
          placeholder="Search course..." 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className="perf-grid">
        {courses.map(course => (
          <div key={course.classId} className="perf-card" onClick={() => handleSelectCourse(course.courseId)}>
            <span className={`status-tag ${course.status.toLowerCase()}`}>{course.status}</span>
            <h3 className="perf-title">{course.courseName}</h3>
            <div className="perf-code">{course.courseId}</div>
            
            {course.status !== 'Withdrawn' && (
              <div className="perf-score-row">
                {/* Chỉ hiện điểm nếu KHÔNG PHẢI là Studying */}
                {course.status !== 'Studying' ? (
                  <>
                    <div className="big-score">{course.finalScore}</div>
                    <div className="letter-grade">{course.letterGrade}</div>
                  </>
                ) : (
                  <div style={{color: '#64748b', fontStyle: 'italic', fontSize: '0.9rem'}}>
                    Grade pending...
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );

  // --- RENDER DETAIL VIEW ---
  const renderDetail = () => {
    if (!selectedCourse) return null;

    return (
      <div className="detail-view">
        <button className="btn btn-action" style={{marginBottom: '20px'}} onClick={() => setView('list')}>← Back to Courses</button>
        
        <div style={{marginBottom: '30px'}}>
          <h2 style={{fontSize: '2rem', color: '#1e293b', margin: 0}}>{selectedCourse.courseName} <span style={{fontSize:'1rem', color:'#64748b', fontWeight:'normal'}}>{selectedCourse.courseId}</span></h2>
          <span className={`status-tag ${selectedCourse.status.toLowerCase()}`} style={{marginTop: '10px'}}>{selectedCourse.status}</span>
        </div>

        {selectedCourse.status === 'Withdrawn' ? (
          <div className="withdrawn-msg">Sinh viên đã rút môn học này.</div>
        ) : (
          <div className="detail-container">
            {/* CỘT TRÁI: BIỂU ĐỒ (Chỉ hiện khi Completed hoặc có điểm) */}
            {selectedCourse.status === 'Completed' && (
              <div className="chart-section">
                {renderDonutChart(selectedCourse.components || [])}
                
                {/* Text ở giữa biểu đồ */}
                <div className="chart-center-text">
                  <div className="chart-score">{selectedCourse.finalScore}</div>
                  <div className="chart-letter">{selectedCourse.letterGrade}</div>
                </div>

                {/* Tooltip khi Hover */}
                <div className="segment-tooltip">
                  {hoveredSegment || "Hover chart for details"}
                </div>
              </div>
            )}

            {/* CỘT PHẢI: BẢNG ĐIỂM CHI TIẾT */}
            <div className="grades-section">
              <h3 style={{color: '#334155', marginBottom: '20px'}}>Detailed Grades</h3>
              {selectedCourse.components?.map((comp, idx) => (
                <div key={idx} className="grade-row">
                  <div>
                    <span className="grade-name">{comp.name}</span>
                    <span className="grade-weight">{comp.weight}%</span>
                  </div>
                  <span className="grade-value">{comp.score !== null ? comp.score : '-'}</span>
                </div>
              ))}
              
              {/* Nếu đang học, chưa có điểm tổng kết chính thức */}
              {selectedCourse.status === 'Studying' && (
                <div style={{marginTop: '20px', padding: '15px', background: '#eff6ff', borderRadius: '8px', color: '#1e40af'}}>
                  ℹ️ Course is in progress. Final grades pending.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <StudentLayout title={view === 'list' ? 'Course Performance' : 'Performance Details'}>
      {view === 'list' ? renderList() : renderDetail()}
    </StudentLayout>
  );
};

export default StudentPerformance;