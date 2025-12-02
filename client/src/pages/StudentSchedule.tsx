import React, { useState, useEffect } from 'react';
import StudentLayout from './StudentLayout';
import axios from 'axios';
import './StudentSchedule.css';

interface Session {
  id: string;
  date: string;
  time: string;
  room: string;
  courseName: string;
  courseCode: string;
  tutorName: string;
  isCompleted: boolean;
}

const StudentSchedule = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [sessions, setSessions] = useState<Session[]>([]);
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/student/schedule?studentId=${user.id}`);
        if (res.data.success) setSessions(res.data.data);
      } catch (error) { console.error(error); }
    };
    fetchSchedule();
  }, []); // eslint-disable-line

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month); // 0 = Sunday

  const changeMonth = (offset: number) => setCurrentDate(new Date(year, month + offset, 1));
  const formatDate = (date: Date) => date.toISOString().split('T')[0];
  const isSameDate = (d1: Date, d2: Date) => d1.getDate() === d2.getDate() && d1.getMonth() === d2.getMonth() && d1.getFullYear() === d2.getFullYear();

  const selectedSessions = sessions.filter(s => s.date === formatDate(selectedDate));

  const renderCalendarDays = () => {
    const days = [];
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="day-cell empty"></div>);
    }
    for (let day = 1; day <= daysInMonth; day++) {
      const dateObj = new Date(year, month, day);
      const dateStr = formatDate(dateObj);
      const daySessions = sessions.filter(s => s.date === dateStr);
      const hasCompleted = daySessions.some(s => s.isCompleted);
      const hasUpcoming = daySessions.some(s => !s.isCompleted);

      days.push(
        <div 
          key={day} 
          className={`day-cell ${isSameDate(dateObj, selectedDate) ? 'selected' : ''}`}
          onClick={() => setSelectedDate(dateObj)}
        >
          <span className="day-number">{day}</span>
          <div className="day-markers">
            {hasCompleted && <span className="dot completed"></span>}
            {hasUpcoming && <span className="dot upcoming"></span>}
          </div>
        </div>
      );
    }
    return days;
  };

  return (
    <StudentLayout title="My Schedule">
      <div className="schedule-container">
        
        {/* --- CALENDAR --- */}
        <div className="calendar-card">
          <div className="calendar-header">
            <h2>{currentDate.toLocaleString('en-US', { month: 'long', year: 'numeric' })}</h2>          
            <div style={{display: 'flex', gap: '10px'}}>
                <button className="month-nav-btn" onClick={() => changeMonth(-1)}>
                  <svg width="10" height="16" viewBox="0 0 10 16" fill="none"><path d="M8.5 1L1.5 8L8.5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </button>
                <button className="month-nav-btn" onClick={() => changeMonth(1)}>
                  <svg width="10" height="16" viewBox="0 0 10 16" fill="none"><path d="M1.5 1L8.5 8L1.5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </button>
            </div>
          </div>

          <div className="legend">
             <div className="legend-item"><span className="dot upcoming"></span> Upcoming Class</div>
             <div className="legend-item"><span className="dot completed"></span> Completed</div>
          </div>

          <div className="calendar-grid">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <div key={d} className="day-name">{d}</div>
            ))}
            {renderCalendarDays()}
          </div>
        </div>

        {/* --- DETAILS --- */}
        <div className="details-panel">
          <div className="selected-date-title">
            <span>📅</span> 
            {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </div>

          {selectedSessions.length > 0 ? (
            selectedSessions.map(session => (
              <div key={session.id} className={`session-card ${session.isCompleted ? 'completed' : 'upcoming'}`}>
                <span className={`status-badge ${session.isCompleted ? 'completed' : 'upcoming'}`}>
                  {session.isCompleted ? 'Completed' : 'Upcoming'}
                </span>
                <div className="session-time">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                  {session.time}
                </div>
                <div className="session-course">{session.courseName}</div>
                <div className="session-info">
                    <div>
                      <span style={{fontSize: '1.2rem'}}>🎓</span> {session.tutorName}
                    </div>
                    <div>
                      <span style={{fontSize: '1.2rem'}}>📍</span> {session.room}
                    </div>
                </div>
              </div>
            ))
          ) : (
            <div className="no-sessions">
              <span className="no-sessions-icon">☕</span>
              <p>No classes scheduled.<br/>Time to relax or self-study!</p>
            </div>
          )}
        </div>

      </div>
    </StudentLayout>
  );
};

export default StudentSchedule;