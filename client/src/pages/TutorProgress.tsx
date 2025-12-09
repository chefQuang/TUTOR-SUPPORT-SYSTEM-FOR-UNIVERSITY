import React, { useState, useEffect, useRef } from 'react';
import TutorLayout from './TutorLayout';
import axios from 'axios';
import './TutorProgress.css';

interface StudentRecord {
  studentId: string; fullName: string; courseName: string; classId: string;
  attendance: string; assignment: number; midterm: number; final: number;
  average: number; status: string;
}

const TutorProgress = () => {
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<StudentRecord[]>([]);
  
  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('All Courses');
  const [selectedClass, setSelectedClass] = useState('All Classes');
  
  // Custom Dropdown State (Mới)
  const [openCourseDrop, setOpenCourseDrop] = useState(false);
  const [openClassDrop, setOpenClassDrop] = useState(false);
  
  // Filter Button State (Mới)
  const [showLowPerfOnly, setShowLowPerfOnly] = useState(false);

  // Lists
  const [courseList, setCourseList] = useState<string[]>([]);
  const [classList, setClassList] = useState<string[]>([]);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<StudentRecord | null>(null);
  
  // Input State (Dùng string để fix lỗi nhập dấu chấm)
  const [assignmentInput, setAssignmentInput] = useState("");
  const [midtermInput, setMidtermInput] = useState("");
  const [finalInput, setFinalInput] = useState("");

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  // Stats Logic (Giữ nguyên từ lần trước)
  const uniqueStudentCount = new Set(students.map(s => s.studentId)).size;
  const getAggregatedStats = () => {
    const studentGradesMap: Record<string, number[]> = {};
    students.forEach(s => {
      if (!studentGradesMap[s.studentId]) studentGradesMap[s.studentId] = [];
      studentGradesMap[s.studentId].push(s.average);
    });
    const uniqueAverages = Object.values(studentGradesMap).map(grades => grades.reduce((a, b) => a + b, 0) / grades.length);
    return {
      excellent: uniqueAverages.filter(avg => avg >= 8.5).length,
      good: uniqueAverages.filter(avg => avg >= 7.0 && avg < 8.5).length,
      fair: uniqueAverages.filter(avg => avg >= 5.5 && avg < 7.0).length,
      needsImp: uniqueAverages.filter(avg => avg < 5.5).length,
    };
  };
  const stats = getAggregatedStats();

  const fetchData = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/tutor/students?tutorId=${user.id}`);
      if (res.data.success) {
        setStudents(res.data.data);
        setFilteredStudents(res.data.data);
        const courses = Array.from(new Set(res.data.data.map((s: any) => s.courseName))) as string[];
        const classes = Array.from(new Set(res.data.data.map((s: any) => s.classId))) as string[];
        setCourseList(courses);
        setClassList(classes);
      }
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchData(); }, []);

  // Filter Logic Updated
  useEffect(() => {
    let result = students;
    if (searchQuery) result = result.filter(s => s.fullName.toLowerCase().includes(searchQuery.toLowerCase()));
    if (selectedCourse !== 'All Courses') result = result.filter(s => s.courseName === selectedCourse);
    if (selectedClass !== 'All Classes') result = result.filter(s => s.classId === selectedClass);
    
    // Logic mới: Lọc sinh viên điểm thấp
    if (showLowPerfOnly) {
      result = result.filter(s => s.average < 5.5);
    }

    setFilteredStudents(result);
  }, [searchQuery, selectedCourse, selectedClass, showLowPerfOnly, students]);

  // Handle Input Change (Cho phép nhập dấu chấm)
  const handleScoreChange = (value: string, setter: React.Dispatch<React.SetStateAction<string>>) => {
    // Regex: Cho phép số, một dấu chấm, tối đa 1 chữ số thập phân
    if (value === '' || /^\d*\.?\d{0,2}$/.test(value)) {
      // Chặn nếu > 10
      const num = parseFloat(value);
      if (num > 10) return; 
      setter(value);
    }
  };

  const openGradeModal = (student: StudentRecord) => {
    setEditingStudent(student);
    // Convert số sang chuỗi để hiển thị
    setAssignmentInput(student.assignment.toString());
    setMidtermInput(student.midterm.toString());
    setFinalInput(student.final.toString());
    setShowModal(true);
  };

  const handleSaveGrades = async () => {
    if (!editingStudent) return;
    try {
      const res = await axios.post('http://localhost:5000/api/tutor/update-grade', {
        studentId: editingStudent.studentId,
        classId: editingStudent.classId,
        // Convert chuỗi về số khi lưu
        assignment: parseFloat(assignmentInput) || 0,
        midterm: parseFloat(midtermInput) || 0,
        final: parseFloat(finalInput) || 0
      });
      if (res.data.success) {
        alert("Grades saved successfully!");
        setShowModal(false);
        fetchData();
      }
    } catch (err: any) { alert(err.response?.data?.message); }
  };

  const getStatusLabel = (avg: number) => {
    if (avg >= 8.5) return <span className="status-pill excellent">Excellent</span>;
    if (avg >= 7.0) return <span className="status-pill good">Good</span>;
    if (avg >= 5.5) return <span className="status-pill fair">Fair</span>;
    return <span className="status-pill needs-improvement">Needs Improvement</span>;
  };

  return (
    <TutorLayout title="Student Progress">
      <div className="tp-container">
        
        {/* STATS SECTION (Giữ nguyên) */}
        <div className="tp-stats-row">
          <div className="tp-stat-card">
            <div className="tp-stat-header"><span>Total Students</span> 👥</div>
            <div className="tp-stat-value">{uniqueStudentCount}</div>
            <div className="tp-stat-sub">Active learners</div>
          </div>
          <div className="tp-stat-card">
            <div className="tp-stat-header"><span>Average Grade</span> 📈</div>
            <div className="tp-stat-value">{(students.reduce((acc, curr) => acc + curr.average, 0) / (students.length || 1)).toFixed(2)}</div>
            <div className="tp-stat-sub">Across all classes</div>
          </div>
          <div className="tp-stat-card">
            <div className="tp-stat-header"><span>Attendance</span> 📅</div>
            <div className="tp-stat-value">92%</div>
            <div className="tp-stat-sub">Average rate</div>
          </div>
          <div className="tp-stat-card">
            <div className="tp-stat-header"><span>Excellence</span> 🏆</div>
            <div className="tp-stat-value">{stats.excellent}</div>
            <div className="tp-stat-sub">Top performers</div>
          </div>
        </div>

        {/* DISTRIBUTION (Giữ nguyên) */}
        <div className="tp-stat-card" style={{marginBottom: '32px'}}>
          <div className="tp-stat-header" style={{fontSize: '1.1rem', color: '#1e293b'}}>Performance Distribution</div>
          <div style={{marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '12px'}}>
            {/*Excellent*/}
            <div style={{display:'flex', alignItems:'center', gap:'16px'}}>
                <span style={{width:'180px', fontSize:'0.9rem', fontWeight:600, color:'#334155'}}>Excellent (Avg ≥ 8.5)</span>
                <div style={{flex:1, background:'#f1f5f9', height:'10px', borderRadius:'5px', overflow:'hidden'}}>
                   <div style={{
                     width: `${uniqueStudentCount > 0 ? (stats.excellent / uniqueStudentCount) * 100 : 0}%`, 
                     background:'#10b981', height:'100%', transition:'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
                   }}></div>
                </div>
                <span style={{width:'80px', textAlign:'right', fontSize:'0.85rem', color:'#64748b', fontWeight:500}}>
                  {stats.excellent} students
                </span>
             </div>
             {/*Good*/}
             <div style={{display:'flex', alignItems:'center', gap:'16px'}}>
                <span style={{width:'180px', fontSize:'0.9rem', fontWeight:600, color:'#334155'}}>Good (7.0 - 8.4)</span>
                <div style={{flex:1, background:'#f1f5f9', height:'10px', borderRadius:'5px', overflow:'hidden'}}>
                   <div style={{
                     width: `${uniqueStudentCount > 0 ? (stats.good / uniqueStudentCount) * 100 : 0}%`, 
                     background:'#3b82f6', height:'100%', transition:'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
                   }}></div>
                </div>
                <span style={{width:'80px', textAlign:'right', fontSize:'0.85rem', color:'#64748b', fontWeight:500}}>
                  {stats.good} students
                </span>
             </div>
             {/*Fair*/}
             <div style={{display:'flex', alignItems:'center', gap:'16px'}}>
                <span style={{width:'180px', fontSize:'0.9rem', fontWeight:600, color:'#334155'}}>Fair (5.5 - 6.9)</span>
                <div style={{flex:1, background:'#f1f5f9', height:'10px', borderRadius:'5px', overflow:'hidden'}}>
                   <div style={{
                     width: `${uniqueStudentCount > 0 ? (stats.fair / uniqueStudentCount) * 100 : 0}%`, 
                     background:'#f59e0b', height:'100%', transition:'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
                   }}></div>
                </div>
                <span style={{width:'80px', textAlign:'right', fontSize:'0.85rem', color:'#64748b', fontWeight:500}}>
                  {stats.fair} students
                </span>
             </div>
             {/* ... (Các dòng Good, Fair, Needs Imp tương tự như code trước) ... */}
             <div style={{display:'flex', alignItems:'center', gap:'16px'}}>
                <span style={{width:'180px', fontSize:'0.9rem', fontWeight:600, color:'#334155'}}>Needs Improv. (&lt; 5.5)</span>
                <div style={{flex:1, background:'#f1f5f9', height:'10px', borderRadius:'5px', overflow:'hidden'}}>
                   <div style={{
                     width: `${uniqueStudentCount > 0 ? (stats.needsImp / uniqueStudentCount) * 100 : 0}%`, 
                     background:'#ef4444', height:'100%', transition:'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
                   }}></div>
                </div>
                <span style={{width:'80px', textAlign:'right', fontSize:'0.85rem', color:'#64748b', fontWeight:500}}>
                  {stats.needsImp} students
                </span>
             </div>
          </div>
        </div>

        {/* FILTERS & SEARCH (NÂNG CẤP) */}
        <div className="tp-filter-bar">
          <div className="tp-search-box">
            <span className="tp-search-icon">🔍</span>
            <input type="text" className="tp-search-input" placeholder="Search student by name..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
          </div>

          {/* COURSE DROPDOWN */}
          <div className={`tp-dropdown-container ${openCourseDrop ? 'tp-dropdown-open' : ''}`}>
            <div className="tp-dropdown-trigger" onClick={() => { setOpenCourseDrop(!openCourseDrop); setOpenClassDrop(false); }}>
              <span>{selectedCourse}</span><span className="tp-dropdown-arrow">▼</span>
            </div>
            <div className="tp-dropdown-menu">
              <div className={`tp-dropdown-item ${selectedCourse==='All Courses'?'selected':''}`} onClick={() => {setSelectedCourse('All Courses'); setOpenCourseDrop(false)}}>All Courses</div>
              {courseList.map(c => <div key={c} className={`tp-dropdown-item ${selectedCourse===c?'selected':''}`} onClick={() => {setSelectedCourse(c); setOpenCourseDrop(false)}}>{c}</div>)}
            </div>
          </div>

          {/* CLASS DROPDOWN */}
          <div className={`tp-dropdown-container ${openClassDrop ? 'tp-dropdown-open' : ''}`}>
            <div className="tp-dropdown-trigger" onClick={() => { setOpenClassDrop(!openClassDrop); setOpenCourseDrop(false); }}>
              <span>{selectedClass}</span><span className="tp-dropdown-arrow">▼</span>
            </div>
            <div className="tp-dropdown-menu">
              <div className={`tp-dropdown-item ${selectedClass==='All Classes'?'selected':''}`} onClick={() => {setSelectedClass('All Classes'); setOpenClassDrop(false)}}>All Classes</div>
              {classList.map(c => <div key={c} className={`tp-dropdown-item ${selectedClass===c?'selected':''}`} onClick={() => {setSelectedClass(c); setOpenClassDrop(false)}}>{c}</div>)}
            </div>
          </div>

          {/* BUTTON: NEEDS IMPROVEMENT */}
          <button 
            className={`btn-filter-warning ${showLowPerfOnly ? 'active' : ''}`}
            onClick={() => setShowLowPerfOnly(!showLowPerfOnly)}
          >
            ⚠️ Needs Improvement
          </button>
        </div>

        {/* TABLE */}
        <div className="tp-table-container">
          <table className="tp-table">
            <thead>
              <tr>
                <th>Student</th> <th>Course</th> <th>Class ID</th> <th>Attd.</th> <th>Assign</th> <th>Midterm</th> <th>Final</th> <th>Avg</th> <th>Status</th> <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((student, idx) => (
                <tr key={`${student.studentId}-${student.classId}`}>
                  <td>
                    <div className="tp-student-info">
                      <div className="tp-avatar">{student.fullName.charAt(0)}</div>
                      <div>
                        <div style={{fontWeight: 600}}>{student.fullName}</div>
                        <div style={{fontSize: '0.8rem', color: '#94a3b8'}}>{student.studentId}</div>
                      </div>
                    </div>
                  </td>
                  <td>{student.courseName}</td>
                  <td><span style={{background:'#f1f5f9', padding:'4px 8px', borderRadius:'6px', fontSize:'0.85rem', fontWeight:600}}>{student.classId}</span></td>
                  <td>{student.attendance}</td>
                  <td>{student.assignment}</td>
                  <td>{student.midterm}</td>
                  <td>{student.final}</td>
                  <td style={{fontWeight: 700}}>{student.average}</td>
                  <td>{getStatusLabel(student.average)}</td>
                  <td>
                    <button 
                      className={`btn-grade ${student.status === 'Completed' ? 'disabled' : ''}`}
                      onClick={() => student.status !== 'Completed' && openGradeModal(student)}
                    >
                      ✏️ Grade
                    </button>
                  </td>
                </tr>
              ))}
              {filteredStudents.length === 0 && (
                <tr><td colSpan={10} style={{textAlign:'center', padding:'30px', color:'#94a3b8'}}>No students found matching your filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* MODAL */}
      {showModal && editingStudent && (
        <div className="modal-overlay">
          <div className="grade-modal-content">
            <div className="gm-header">
              <h2 className="gm-title">Enter Grades</h2>
              <button className="gm-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <p style={{marginBottom: '20px', color: '#64748b'}}>Update grades for <b>{editingStudent.fullName}</b> ({editingStudent.classId})</p>
            
            {/* TEXT INPUT TYPE */}
            <div className="gm-form-group">
              <label className="gm-label">Assignment Grade (0-10)</label>
              <input 
                type="text" className="gm-input"
                value={assignmentInput} 
                onChange={e => handleScoreChange(e.target.value, setAssignmentInput)} 
                placeholder="0.0"
              />
            </div>
            <div className="gm-form-group">
              <label className="gm-label">Midterm Grade (0-10)</label>
              <input 
                type="text" className="gm-input"
                value={midtermInput} 
                onChange={e => handleScoreChange(e.target.value, setMidtermInput)} 
                placeholder="0.0"
              />
            </div>
            <div className="gm-form-group">
              <label className="gm-label">Final Grade (0-10)</label>
              <input 
                type="text" className="gm-input"
                value={finalInput} 
                onChange={e => handleScoreChange(e.target.value, setFinalInput)} 
                placeholder="0.0"
              />
            </div>

            <div className="gm-calc-box">
              Estimated Average: {((parseFloat(assignmentInput) * 0.2) + ((parseFloat(midtermInput)||0) * 0.3) + ((parseFloat(finalInput)||0) * 0.5)).toFixed(2)}
            </div>

            <div className="gm-actions">
              <button className="btn-cancel" onClick={() => setShowModal(false)} style={{border:'1px solid #e2e8f0', padding:'12px 24px', borderRadius:'10px', background:'white'}}>Cancel</button>
              <button className="gm-btn-save" onClick={handleSaveGrades}>💾 Save Grades</button>
            </div>
          </div>
        </div>
      )}

    </TutorLayout>
  );
};

export default TutorProgress; 