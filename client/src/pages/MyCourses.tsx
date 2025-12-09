import React, { useState, useEffect } from 'react';
import StudentLayout from './StudentLayout';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './MyCourses.css';

interface CourseMin { 
  courseId: string; courseName: string; status: string; 
  classId: string; tutorName: string; // Thêm 2 trường này
}
interface CourseSection { id: string; title: string; items: CourseItem[]; }
interface CourseItem { id: string; type: string; title: string; fileUrl: string; }

const MyCourses = () => {
  const [view, setView] = useState<'list' | 'detail'>('list');
  const [courses, setCourses] = useState<CourseMin[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<CourseMin | null>(null);
  const [sections, setSections] = useState<CourseSection[]>([]);
  
  // State quản lý việc mở/đóng các section (Accordion)
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/courses/my-courses?studentId=${user.id}`);
        if(res.data.success) setCourses(res.data.data);
      } catch (err) { console.error(err); }
    };
    fetchCourses();
  }, []);

  const handleSelectCourse = async (course: CourseMin) => {
    setSelectedCourse(course);
    try {
      const res = await axios.get(`http://localhost:5000/api/courses/content?courseId=${course.courseId}`);
      if(res.data.success) {
        setSections(res.data.data);
        setView('detail');
        // Mặc định mở section đầu tiên
        if(res.data.data.length > 0) {
          setExpandedSections({ [res.data.data[0].id]: true });
        }
      }
    } catch (err) { console.error(err); }
  };

  const toggleSection = (secId: string) => {
    setExpandedSections(prev => ({ ...prev, [secId]: !prev[secId] }));
  };

  const handleItemClick = (item: CourseItem) => {
    if (item.type === 'file') {
      handleRealDownload(item.fileUrl);
      // Thực tế: window.open(item.url)
    } else if (item.type === 'assignment') {
      // Chuyển sang trang Assignment riêng biệt
      navigate(`/student/courses/${selectedCourse?.courseId}/assignment/${item.id}`);
    } else if (item.type === 'quiz') {
      navigate(`/student/courses/${selectedCourse?.courseId}/quiz/${item.id}`);
    }
  };

  // Hàm xử lý download
  const handleRealDownload = (url: string) => {
    if(!url) return;
    const link = document.createElement('a'); link.href = url;
    link.setAttribute('download', ''); link.setAttribute('target', '_blank');
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  // --- RENDER LIST ---
  const renderList = () => (
    <div className="course-list-grid">
      {courses.map(c => ( // Thêm index
        <div key={c.classId}
        className="perf-card" onClick={() => handleSelectCourse(c)}>
          <span className={`status-tag ${c.status.toLowerCase()}`}>{c.status}</span>
          <h3 className="perf-title">{c.courseName}</h3>
          <div className="perf-code">{c.courseId}</div>
          
          {/* Thông tin thêm */}
          <div style={{marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #f1f5f9', fontSize: '0.9rem', color: '#64748b'}}>
            <div>🏫 Class: <strong>{c.classId}</strong></div>
            <div style={{marginTop: '5px'}}>🎓 Tutor: <strong>{c.tutorName}</strong></div>
          </div>
        </div>
      ))}
    </div>
  );

  // --- RENDER DETAIL (ACCORDION MENU) ---
  const renderDetail = () => (
    <div className="course-detail-view">
      <button className="btn-action" style={{marginBottom:'20px', borderRadius:'8px'}} onClick={() => setView('list')}>← Back to Courses</button>
      
      <h2 style={{color: '#1e293b', marginBottom: '30px'}}>{selectedCourse?.courseName}</h2>

      <div className="accordion-container">
        {sections.map(sec => (
          <div key={sec.id} className="accordion-item">
            <div 
              className={`accordion-header ${expandedSections[sec.id] ? 'active' : ''}`} 
              onClick={() => toggleSection(sec.id)}
            >
              <span>{sec.title}</span>
              <span className="arrow">{expandedSections[sec.id] ? '▼' : '▶'}</span>
            </div>
            
            {expandedSections[sec.id] && (
              <div className="accordion-body">
                {sec.items.map(item => (
                  <div key={item.id} className="content-link" onClick={() => handleItemClick(item)}>
                    <span className="icon">
                      {item.type === 'file' ? '📄' : item.type === 'assignment' ? '📝' : '❓'}
                    </span>
                    <span className="text">{item.title}</span>
                    {item.type === 'file' && <span className="action-hint">Download</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <StudentLayout title={view === 'list' ? 'My Courses' : 'Course Content'}>
      {view === 'list' ? renderList() : renderDetail()}
    </StudentLayout>
  );
};

export default MyCourses;