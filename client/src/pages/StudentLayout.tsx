import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './StudentLayout.css';

interface LayoutProps {
  children: React.ReactNode;
  title: string;
}

const StudentLayout: React.FC<LayoutProps> = ({ children, title }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const menuItems = [
    { label: 'Home', path: '/student/home', icon: '🏠' },
    { label: 'Schedule', path: '/student/schedule', icon: '📅' },
    { label: 'Register Course', path: '/student/register', icon: '🎓' }, // Nút quan trọng
    { label: 'Course Performance', path: '/student/performance', icon: '📊' },
    { label: 'My Courses', path: '/student/courses', icon: '👥' },
    { label: 'Materials', path: '/student/materials', icon: '📚' },
    { label: 'Profile', path: '/student/profile', icon: '👤' },
  ];

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  return (
    <div className="student-layout">
      {/* Sidebar */}
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
              <span>{item.icon}</span> {item.label}
            </li>
          ))}
          <li className="menu-item logout-btn" onClick={handleLogout}>
            <span>🚪</span> Logout
          </li>
        </ul>
      </aside>

      {/* Main Content */}
      <main className="std-content">
        <header className="page-header">
          <h1 style={{margin: 0, fontSize: '1.5rem', color: '#1e293b'}}>{title}</h1>
          <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
            <span style={{fontWeight: 600, color: '#334155'}}>{user.fullName}</span>
            <div className="user-avatar">{user.fullName?.charAt(0)}</div>
          </div>
        </header>
        {children}
      </main>
    </div>
  );
};

export default StudentLayout;