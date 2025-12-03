import React, { useEffect, useState } from 'react';
import StudentLayout from './StudentLayout';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './StudentHome.css';

interface UpcomingSession {
  id: string;
  courseName: string;
  tutorName: string;
  time: string;
  date: string;
  room: string;
}

const StudentHome = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [pendingFeedbackCount, setPendingFeedbackCount] = useState(0);
  const [stats, setStats] = useState({
    registeredCount: 0,
    tutorsCount: 0,
    sessionsCount: 0,
    averageScore: '--'
  });
  const [upcoming, setUpcoming] = useState<UpcomingSession[]>([]);

  // Load lại số liệu mỗi khi vào trang chủ để cập nhật "Registered Courses"
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/student/stats?studentId=${user.id}`);
        if(res.data.success) {
          setStats(res.data.data);
        }
      } catch (err) { console.error(err); }
    };
    fetchStats();
    // Fetch Upcoming Sessions
    const fetchUpcoming = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/student/upcoming?studentId=${user.id}`);
        if(res.data.success) {
          setUpcoming(res.data.data);
          const count = res.data.data.filter((c: any) => !c.feedbackData).length;
          setPendingFeedbackCount(count);
        }
      } catch (err) { console.error(err); }
    };
    fetchUpcoming();
  }, []); // eslint-disable-line

  return (
    <StudentLayout title="Home">
      {/* 4 Cards thống kê */}
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-header"><span>Registered Courses</span> <span>🎓</span></div>
          <div className="stat-value">{stats.registeredCount}</div>
          <div className="stat-sub">Active this semester</div>
        </div>
        <div className="stat-card">
          <div className="stat-header"><span>Tutors</span> <span>👥</span></div>
          <div className="stat-value">{stats.tutorsCount}</div>
          <div className="stat-sub">Currently assigned</div>
        </div>
        <div className="stat-card">
          <div className="stat-header"><span>Sessions</span> <span>📅</span></div>
          <div className="stat-value">{stats.sessionsCount}</div>
          <div className="stat-sub">Upcoming</div>
        </div>
        <div className="stat-card">
          <div className="stat-header"><span>Progress</span> <span>📈</span></div>
          <div className="stat-value">{stats.averageScore}</div>
          <div className="stat-sub">Average score</div>
        </div>
      </div>

      <div className="dashboard-grid">
        {/* Cột trái: Upcoming Sessions */}
        <div>
          <div className="section-card" style={{minHeight: '300px', display: 'flex', flexDirection: 'column'}}>
            <div className="section-title">Upcoming Sessions</div>
            
            {upcoming.length > 0 ? (
              <div style={{display: 'flex', flexDirection: 'column', gap: '15px'}}>
                {/* Tiêu đề ngày (Logic: Hiển thị ngày của buổi học đầu tiên trong list) */}
                <div style={{color: '#64748b', fontWeight: 600, paddingBottom: '10px', borderBottom: '1px solid #f1f1f1'}}>
                   📅 {new Date(upcoming[0].date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </div>

                {upcoming.map(sess => (
                  <div key={sess.id} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '16px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0'
                  }}>
                    <div>
                      <div style={{fontWeight: 'bold', color: '#1e293b', fontSize: '1.1rem'}}>{sess.courseName}</div>
                      <div style={{fontSize: '0.9rem', color: '#64748b', marginTop: '4px'}}>
                        🎓 {sess.tutorName} • 📍 {sess.room}
                      </div>
                    </div>
                    <div style={{
                      background: '#dbeafe', color: '#1e40af', padding: '6px 12px', 
                      borderRadius: '20px', fontWeight: 'bold', fontSize: '0.9rem'
                    }}>
                      {sess.time}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state" style={{flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column'}}>
                <span style={{fontSize: '3rem', opacity: 0.3}}>zzz</span>
                <p>No upcoming sessions. Book a session with your tutor!</p>
              </div>
            )}
            
            <button className="action-btn" style={{textAlign: 'center', justifyContent: 'center', marginTop: 'auto'}} onClick={() => navigate('/student/schedule')}>
              View Full Schedule
            </button>
          </div>
        </div>

        {/* Cột phải: Quick Actions & Recent Activity */}
        <div>
          <div className="section-card">
            <div className="section-title">Quick Actions</div>
            <button className="action-btn" onClick={() => navigate('/student/register')}>
              <span>🎓</span> Register Course
            </button>
            <button className="action-btn">
              <span>📅</span> Book Session
            </button>
            <button className="action-btn" onClick={() => navigate('/student/feedback')} style={{justifyContent: 'space-between'}}>
            <div style={{display:'flex', gap:'10px', alignItems:'center'}}>
              <span>💬</span> Send Feedback
            </div>
            {pendingFeedbackCount > 0 && (
              <span style={{
                background: '#ef4444', color: 'white', fontSize: '0.75rem', 
                padding: '2px 8px', borderRadius: '10px', fontWeight: 'bold'
              }}>
                {pendingFeedbackCount}
              </span>
            )}
          </button>
          </div>

          <div className="section-card">
            <div className="section-title">Recent Activity</div>
            <div style={{fontSize: '0.9rem', color: '#64748b'}}>
              <p>Course registered <br/><small>2 days ago</small></p>
              <hr style={{border: 'none', borderTop: '1px solid #f1f1f1', margin: '10px 0'}}/>
              <p>New tutor assigned <br/><small>Yesterday</small></p>
            </div>
          </div>
        </div>
      </div>
    </StudentLayout>
  );
};

export default StudentHome;