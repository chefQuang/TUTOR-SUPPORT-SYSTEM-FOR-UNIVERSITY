import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './StudentLayout.css'; // Tái sử dụng CSS layout cũ cho nhanh
import {Mail, BookOpen, School, CalendarDays, TrendingUp} from 'lucide-react'

interface LayoutProps { children: React.ReactNode; title: string; }

const TutorLayout: React.FC<LayoutProps> = ({ children, title }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const menuItems = [
    { label: 'My Classes', path: '/tutor/classes', icon: <School size={20}/> },
    { label: 'Schedule Management', path: '/tutor/schedule', icon: <CalendarDays size={20}/> },
    { label: 'Student Progress', path: '/tutor/progress', icon: <TrendingUp size={20} /> },
    { label: 'Learning Materials', path: '/tutor/materials', icon: <BookOpen size={20}/> },
    { label: 'Mailbox', path: '/tutor/requests', icon: <Mail size={20}/> }
  ];

  const handleLogout = () => { localStorage.clear(); navigate('/'); };

  return (
    <div className="student-layout">
      <aside className="std-sidebar">
        <div className="brand"><div className="brand-logo">BK</div><span>Tutor Portal</span></div>
        <ul className="menu-list">
          {menuItems.map((item) => (
            <li key={item.label} className={`menu-item ${location.pathname === item.path ? 'active' : ''}`} onClick={() => navigate(item.path)}>
              <span>{item.icon}</span> {item.label}
            </li>
          ))}
          <li className="menu-item logout-btn" onClick={handleLogout}><span>🚪</span> Logout</li>
        </ul>
      </aside>
      <main className="std-content">
        <header className="page-header">
          <h1 style={{margin:0, color:'#1e293b'}}>{title}</h1>
          <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
            <span style={{fontWeight:600}}>{user.fullName}</span>
            <div className="user-avatar" style={{background:'#0f766e'}}>{user.fullName?.charAt(0)}</div>
          </div>
        </header>
        {children}
      </main>
    </div>
  );
};
export default TutorLayout;