import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import './StudentLayout.css';

interface LayoutProps {
  children: React.ReactNode;
  title: string;
}

const StudentLayout: React.FC<LayoutProps> = ({ children, title }) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // CẬP NHẬT 1: Dùng State để User có thể cập nhật động
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user') || '{}'));
  const [pendingCount, setPendingCount] = useState(0);

  // CẬP NHẬT 2: Lắng nghe sự kiện cập nhật user (từ trang Profile)
  useEffect(() => {
    const handleUserUpdate = () => {
      const updatedUser = JSON.parse(localStorage.getItem('user') || '{}');
      setUser(updatedUser);
    };

    window.addEventListener('user-updated', handleUserUpdate);
    return () => {
      window.removeEventListener('user-updated', handleUserUpdate);
    };
  }, []);

  // Fetch Feedback Pending Count (Giữ nguyên)
  useEffect(() => {
    const fetchPendingCount = async () => {
      if (!user.id) return;
      try {
        const res = await axios.get(`http://localhost:5000/api/student/feedback-candidates?studentId=${user.id}`);
        if (res.data.success) {
          const count = res.data.data.filter((c: any) => !c.feedbackData).length;
          setPendingCount(count);
        }
      } catch (error) { console.error(error); }
    };
    fetchPendingCount();
  }, [user.id]);

  const menuItems = [
    { label: 'Home', path: '/student/home', icon: '🏠' },
    { label: 'Schedule', path: '/student/schedule', icon: '📅' },
    { label: 'Register Course', path: '/student/register', icon: '🎓' },
    { label: 'Course Performance', path: '/student/performance', icon: '📊' },
    { label: 'Groups', path: '/student/groups', icon: '👥' },
    { label: 'Materials', path: '/student/materials', icon: '📚' },
    { label: 'Feedback', path: '/student/feedback', icon: '💬' },
    { label: 'Profile', path: '/student/profile', icon: '👤' },
  ];

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  return (
    <div className="student-layout">
      <aside className="std-sidebar">
        <div className="brand">
          <div className="brand-logo">BK</div>
          <span>Tutor Support</span>
        </div>

        <ul className="menu-list">
          {menuItems.map((item) => (
            <li 
              key={item.label}
              className={`menu-item ${location.pathname === item.path ? 'active' : ''}`}
              onClick={() => navigate(item.path)}
            >
              <span style={{display:'flex', alignItems:'center', gap:'10px'}}>
                <span>{item.icon}</span> {item.label}
              </span>
              {item.label === 'Feedback' && pendingCount > 0 && (
                <span className="notification-badge">{pendingCount}</span>
              )}
            </li>
          ))}
          <li className="menu-item logout-btn" onClick={handleLogout}>
            <span>🚪</span> Logout
          </li>
        </ul>
      </aside>

      <main className="std-content">
        <header className="page-header">
          <h1 style={{margin: 0, fontSize: '1.5rem', color: '#1e293b'}}>{title}</h1>
          <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
            
            {/* Tên người dùng */}
            <span style={{fontWeight: 600, color: '#334155'}}>{user.fullName}</span>
            
            {/* CẬP NHẬT 3: Hiển thị Avatar ở góc phải trên */}
            <div className="user-avatar" style={{overflow:'hidden'}}>
              {user.avatarUrl ? (
                <img 
                  src={user.avatarUrl} 
                  alt="U" 
                  style={{width:'100%', height:'100%', objectFit:'cover'}} 
                />
              ) : (
                user.fullName?.charAt(0).toUpperCase()
              )}
            </div>

          </div>
        </header>
        {children}
      </main>
    </div>
  );
};

export default StudentLayout;