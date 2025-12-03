import React, { useState, useEffect } from 'react';
import TutorLayout from './TutorLayout';
import axios from 'axios';
import './StudentSchedule.css'; // Tái sử dụng CSS lịch đẹp đã làm

interface Session {
  id: string; date: string; time: string; room: string;
  courseName: string; classId: string; isCompleted: boolean;
}

const TutorSchedule = () => {
  // Calendar State
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [sessions, setSessions] = useState<Session[]>([]);
  
  // Selection State
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  
  // Modal State (Change Time)
  const [showModal, setShowModal] = useState(false);
  const [newDateStr, setNewDateStr] = useState(""); // YYYY-MM-DD
  const [newTimeStart, setNewTimeStart] = useState("07:00");
  const [newTimeEnd, setNewTimeEnd] = useState("10:00");
  const [showDatePicker, setShowDatePicker] = useState(false); // Toggle lịch nhỏ

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  // Load Data
  const fetchSchedule = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/tutor/schedule?tutorId=${user.id}`);
      if (res.data.success) setSessions(res.data.data);
    } catch (error) { console.error(error); }
  };

  useEffect(() => { fetchSchedule(); }, []);

  // --- Calendar Logic (Giữ nguyên) ---
  const getDaysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
  const getFirstDayOfMonth = (y: number, m: number) => new Date(y, m, 1).getDay();
  const changeMonth = (off: number) => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + off, 1));
  const formatDate = (date: Date) => date.toISOString().split('T')[0];
  const isSameDate = (d1: Date, d2: Date) => d1.getDate() === d2.getDate() && d1.getMonth() === d2.getMonth();

  // --- Handler ---
  const handleSelectSession = (s: Session) => {
    setSelectedSession(s); // Chọn session để thao tác
  };

  const handleCancelSession = async () => {
    if (!selectedSession) return;
    if (!window.confirm("Are you sure you want to cancel this session? This action cannot be undone.")) return;

    try {
      const res = await axios.post('http://localhost:5000/api/tutor/cancel-session', {
        tutorId: user.id,
        sessionId: selectedSession.id
      });
      if (res.data.success) {
        alert("Session cancelled!");
        setSelectedSession(null);
        fetchSchedule(); // Reload
      }
    } catch (err: any) { alert(err.response?.data?.message || "Error"); }
  };

  const openEditModal = () => {
    if (!selectedSession) return;
    setNewDateStr(selectedSession.date); // Lấy ngày hiện tại của session
    const [start, end] = selectedSession.time.split(' - ');
    setNewTimeStart(start.trim());
    setNewTimeEnd(end.trim());
    setShowModal(true);
    setShowDatePicker(false);
  };

  const handleUpdateSession = async () => {
    if (!selectedSession) return;
    // Format date string YYYY-MM-DD
    const newDateStr = formatDate(selectedDate); // Move session sang ngày đang chọn
    const timeStr = `${newTimeStart} - ${newTimeEnd}`;
    try {
      const res = await axios.post('http://localhost:5000/api/tutor/update-session', {
        tutorId: user.id,
        sessionId: selectedSession?.id,
        newDate: newDateStr, // Dùng ngày mới chọn
        newTime: timeStr
      });
      // ... (Alert success & close modal)
    } catch (err: any) { alert("Update Failed"); }
  };

  // Filter session for selected date
  const dailySessions = sessions.filter(s => s.date === formatDate(selectedDate));

// --- RENDER MODAL (VERSION 2.0) ---
  const renderModal = () => {
    // Helper để render lịch nhỏ (Copy logic renderCalendarDays nhưng đơn giản hóa)
    const renderMiniCalendar = () => {
      // (Logic tính toán ngày giống hệt hàm renderCalendarDays ở trên, copy xuống đây)
      // Lưu ý: Dùng biến state tạm local nếu muốn, hoặc dùng chung selectedDate
      // Ở đây mình dùng chung logic hiển thị ngày tháng
      const days = [];
      const y = selectedDate.getFullYear();
      const m = selectedDate.getMonth();
      const firstDay = new Date(y, m, 1).getDay();
      const daysInMonth = new Date(y, m + 1, 0).getDate();

      for (let i = 0; i < firstDay; i++) days.push(<div key={`e-${i}`}></div>);
      for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
        const isSelected = newDateStr === dateStr;
        days.push(
          <div 
            key={d} 
            className={`day-cell ${isSelected ? 'selected' : ''}`}
            onClick={() => { setNewDateStr(dateStr); setShowDatePicker(false); }}
          >
            {d}
          </div>
        );
      }
      return days;
    };

    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <div className="modal-header">
            <h2 className="modal-title">Reschedule Session</h2>
            <p className="modal-subtitle">for <b>{selectedSession?.courseName}</b></p>
          </div>

          {/* 1. DATE PICKER (CUSTOM UI) */}
          <div style={{position: 'relative'}}>
            <div className="date-trigger-box" onClick={() => setShowDatePicker(!showDatePicker)}>
              <div>
                <span className="date-label">New Date</span>
                <span className="date-value">
                  {new Date(newDateStr).toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
              </div>
              <span className="date-icon">📅</span>
            </div>

            {/* Popup Lịch */}
            {showDatePicker && (
              <div className="mini-calendar">
                <div style={{textAlign:'center', fontWeight:'bold', marginBottom:'10px', color:'#334155'}}>
                  {new Date(newDateStr).toLocaleString('default', { month: 'long', year: 'numeric' })}
                </div>
                <div className="calendar-grid">
                  {['S','M','T','W','T','F','S'].map(d => <div key={d} className="day-name">{d}</div>)}
                  {renderMiniCalendar()}
                </div>
              </div>
            )}
          </div>

          {/* 2. TIME PICKER (GRID LAYOUT) */}
          <div className="time-grid">
            <div className="time-input-group">
              <label className="time-label">Start Time</label>
              <div className="time-card">
                <div className="time-icon-wrapper">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"   stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                </div>
                <input 
                    type="time" 
                    className="time-input" 
                    value={newTimeStart} 
                    onChange={e => setNewTimeStart(e.target.value)} 
                />
              </div>
            </div>
            <div className="time-input-group">
              <label className="time-label">End Time</label>
              <div className="time-card">
                <div className="time-icon-wrapper">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 8 14"></polyline>
                  </svg>
                </div>
                <input 
                    type="time" 
                    className="time-input" 
                    value={newTimeEnd} 
                    onChange={e => setNewTimeEnd(e.target.value)} 
                />
              </div>
            </div>
          </div>

          {/* 3. ACTIONS */}
          <div className="modal-actions">
            <button className="btn-modal cancel" onClick={() => setShowModal(false)}>Cancel</button>
            <button className="btn-modal confirm" onClick={handleUpdateSession}>Confirm Update</button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <TutorLayout title="Schedule Management">
      <div className="schedule-container">
        
        {/* --- CALENDAR (LEFT) --- */}
        <div className="calendar-card">
          <div className="calendar-header">
            <h2>{currentDate.toLocaleString('en-US', { month: 'long', year: 'numeric' })}</h2>
            <div style={{display:'flex', gap:'10px'}}>
                <button className="month-nav-btn" onClick={() => changeMonth(-1)}>◀</button>
                <button className="month-nav-btn" onClick={() => changeMonth(1)}>▶</button>
            </div>
          </div>
          <div className="calendar-grid">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <div key={d} className="day-name">{d}</div>)}
            {/* Render Days Logic (Giống Student) */}
            {Array.from({ length: getFirstDayOfMonth(currentDate.getFullYear(), currentDate.getMonth()) }).map((_, i) => <div key={`e-${i}`} className="day-cell empty"></div>)}
            {Array.from({ length: getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth()) }).map((_, i) => {
               const day = i + 1;
               const dateObj = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
               const dateStr = formatDate(dateObj);
               const hasSess = sessions.some(s => s.date === dateStr);
               return (
                 <div key={day} className={`day-cell ${isSameDate(dateObj, selectedDate) ? 'selected' : ''}`} onClick={() => { setSelectedDate(dateObj); setSelectedSession(null); }}>
                   <span className="day-number">{day}</span>
                   {hasSess && <div className="day-markers"><span className="dot upcoming"></span></div>}
                 </div>
               );
            })}
          </div>
        </div>

        {/* --- MANAGEMENT PANEL (RIGHT) --- */}
        <div className="details-panel" style={{display:'flex', flexDirection:'column'}}>
          <div className="selected-date-title">
            <span>📅</span> {selectedDate.toDateString()}
          </div>

          {/* Action Buttons (Chỉ hiện khi chọn ngày) */}
          <div style={{display:'flex', flexDirection:'column', gap:'10px', marginBottom:'20px', paddingBottom:'20px', borderBottom:'1px solid #eee'}}>
             <button className="btn-action" style={{background:'#1e293b'}} onClick={() => alert("Add Slot Logic (Similar to Update)")}>+ Add Time Slot</button>
             
             {selectedSession ? (
               <>
                 <button className="btn-action" style={{background:'white', color:'#334155', border:'1px solid #ccc'}} onClick={openEditModal}>✏️ Change Time</button>
                 <button className="btn-action" style={{background:'white', color:'#dc2626', border:'1px solid #fecaca'}} onClick={handleCancelSession}>❌ Cancel Slot</button>
               </>
             ) : (
               <div style={{color:'#94a3b8', fontSize:'0.9rem', fontStyle:'italic', textAlign:'center', marginTop:'10px'}}>Select a session below to Edit/Cancel</div>
             )}
          </div>

          {/* Session List */}
          <div style={{overflowY:'auto', flex:1}}>
            {dailySessions.length > 0 ? dailySessions.map(sess => (
              <div 
                key={sess.id} 
                className={`session-card ${selectedSession?.id === sess.id ? 'upcoming' : ''}`} // Highlight nếu chọn
                style={{border: selectedSession?.id === sess.id ? '2px solid #0033cc' : '1px solid #e2e8f0', cursor:'pointer'}}
                onClick={() => handleSelectSession(sess)}
              >
                <div className="session-time">🕒 {sess.time}</div>
                <div className="session-course">{sess.courseName}</div>
                <div className="session-info">Class: {sess.classId}</div>
              </div>
            )) : <p className="no-sessions">No schedule.</p>}
          </div>
        </div>

      </div>

      {/* --- MODAL CHANGE TIME --- */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{width:'350px'}}>
            <h3 style={{marginTop:0}}>Change Session Time</h3>
            <p style={{fontSize:'0.9rem', color:'#666'}}>Move session to <b>{selectedDate.toDateString()}</b></p>
            
            <div style={{display:'flex', gap:'10px', marginBottom:'20px'}}>
              <div style={{flex:1}}>
                <label style={{fontSize:'0.8rem', fontWeight:'bold'}}>Start</label>
                <input type="time" className="mat-input" value={newTimeStart} onChange={e => setNewTimeStart(e.target.value)} />
              </div>
              <div style={{flex:1}}>
                <label style={{fontSize:'0.8rem', fontWeight:'bold'}}>End</label>
                <input type="time" className="mat-input" value={newTimeEnd} onChange={e => setNewTimeEnd(e.target.value)} />
              </div>
            </div>

            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn-confirm" onClick={handleUpdateSession}>Update</button>
            </div>
          </div>
        </div>
      )}
      {showModal && renderModal()}
    </TutorLayout>
  );
};



export default TutorSchedule;