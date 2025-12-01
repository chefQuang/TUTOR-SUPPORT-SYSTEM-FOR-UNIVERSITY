import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Dashboard.css';
import '../App.css'; // Import CSS

// Type Definitions
interface Course {
  id: string;
  code: string;
  name: string;
  tutorName: string;
  schedule: string;
}

interface User {
  id: string;
  fullName: string;
  role: string;
  registeredCourseIds: string[];
}

// Layout Component
const DashboardLayout: React.FC<{title: string, role: string, children: React.ReactNode}> = ({title, role, children}) => {
  const navigate = useNavigate();
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : {};

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  return (
    <div className="dashboard-container">
        {/* Sidebar */}
        <div className="sidebar">
            <div className="sidebar-brand">
               <span style={{fontSize: '1.5rem', marginRight: '5px'}}>BK</span> Tutor System
            </div>
            <div style={{flex: 1}}>
                <div className="nav-item">Home</div>
                {role === 'student' && <div className="nav-item active">Register Course</div>}
                {role === 'tutor' && <div className="nav-item">My Schedule</div>}
                {role === 'admin' && <div className="nav-item">User Management</div>}
            </div>
            <button onClick={handleLogout} className="logout-btn">Logout</button>
        </div>

        {/* Main Content */}
        <div className="main-content">
            <div className="top-bar">
                <h1 style={{margin: 0, color: '#333'}}>{title}</h1>
                <div className="user-profile">
                    <span>{user.fullName || 'User'}</span>
                    <div style={{width: '30px', height: '30px', background: '#ccc', borderRadius: '50%'}}></div>
                </div>
            </div>
            {children}
        </div>
    </div>
  );
}

// Student Dashboard: Chức năng Đăng ký môn học
export const StudentDashboard = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [user, setUser] = useState<User | null>(null);

  // Load dữ liệu khi vào trang
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) setUser(JSON.parse(userStr));

    const fetchCourses = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/courses');
        if (res.data.success) setCourses(res.data.data);
      } catch (error) { console.error(error); }
    };
    fetchCourses();
  }, []);

  const handleRegister = async (courseId: string) => {
    if (!user) return;
    try {
      const res = await axios.post('http://localhost:5000/api/register-course', {
        studentId: user.id,
        courseId: courseId
      });
      if (res.data.success) {
        alert(res.data.message);
        // Cập nhật lại user trong state và localStorage để UI phản hồi ngay (nếu cần)
      }
    } catch (error: any) {
      alert(error.response?.data?.message || "Error");
    }
  };

  return (
    <DashboardLayout title="Course Registration" role="student">
      {/* Thống kê */}
      <div className="stats-grid">
          <div className="stat-card">
            <div style={{color: '#666'}}>Available Courses</div>
            <div style={{fontSize: '1.5rem', fontWeight: 'bold'}}>{courses.length}</div>
          </div>
          <div className="stat-card" style={{borderLeftColor: 'green'}}>
            <div style={{color: '#666'}}>Registered</div>
            <div style={{fontSize: '1.5rem', fontWeight: 'bold'}}>
               {/* Demo số lượng giả định */}
               {user?.registeredCourseIds?.length || 0}
            </div>
          </div>
      </div>

      <h2 style={{marginBottom: '15px'}}>Available Courses List</h2>
      
      <table className="data-table">
        <thead>
          <tr>
            <th>Code</th>
            <th>Course Name</th>
            <th>Tutor</th>
            <th>Schedule</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {courses.map((course) => (
            <tr key={course.id}>
              <td style={{color: '#0033cc', fontWeight: 'bold'}}>{course.code}</td>
              <td>{course.name}</td>
              <td>{course.tutorName}</td>
              <td>{course.schedule}</td>
              <td>
                <button 
                  onClick={() => handleRegister(course.id)}
                  className="btn btn-action"
                >
                  Register
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </DashboardLayout>
  );
};

export const TutorDashboard = () => (
  <DashboardLayout title="Tutor Dashboard" role="tutor">
     <div className="stat-card">
        <h3>My Teaching Schedule</h3>
        <p>No classes assigned yet.</p>
    </div>
  </DashboardLayout>
);

export const AdminDashboard = () => (
  <DashboardLayout title="Admin Control Panel" role="admin">
     <div className="stat-card">
        <h3>System Overview</h3>
        <p>Manage users and settings here.</p>
    </div>
  </DashboardLayout>
);