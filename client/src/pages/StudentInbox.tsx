import React, { useState, useEffect } from 'react';
import StudentLayout from './StudentLayout';
import axios from 'axios';
import './Inbox.css'; // Dùng chung CSS

interface Notification {
  id: string; tutorName: string; courseName: string;
  date: string; time: string; status: 'Pending' | 'Confirmed' | 'Rejected' | 'Update';
  reason: string; room?: string;
}

const StudentInbox = () => {
  const [msgs, setMsgs] = useState<Notification[]>([]);
  const [selectedMsg, setSelectedMsg] = useState<Notification | null>(null);
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    const fetchNotifs = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/student/notifications?studentId=${user.id}`);
        if(res.data.success) setMsgs(res.data.data);
      } catch (err) { console.error(err); }
    };
    fetchNotifs();
  }, []);

  return (
    <StudentLayout title="Inbox & Notifications">
      <div className="inbox-wrapper">
        
        {/* LEFT LIST */}
        <div className="inbox-list">
          <div className="inbox-header">
            <h2 className="inbox-title">Notifications</h2>
            <div className="inbox-subtitle">Updates on your requests</div>
          </div>
          <div className="msg-scroll-area">
            {msgs.map(msg => (
              <div 
                key={msg.id} 
                className={`msg-card ${selectedMsg?.id === msg.id ? 'active' : ''}`}
                onClick={() => setSelectedMsg(msg)}
              >
                <div className="msg-header">
                  <span className="msg-sender">{msg.tutorName}</span>
                  <span className="msg-date">{new Date(msg.date).toLocaleDateString()}</span>
                </div>
                <div className="msg-subject">{msg.status} - {msg.courseName}</div>
                <span className={`mini-badge ${msg.status.toLowerCase()}`}>{msg.status}</span>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT DETAIL */}
        <div className="inbox-detail">
          {selectedMsg ? (
            <div className="detail-content">
              <div className="detail-header">
                <div className="dh-left">
                  <h2>
                    {selectedMsg.status === 'Confirmed' ? 'Booking Confirmed' 
                    : selectedMsg.status === 'Rejected' ? 'Booking Declined' 
                    : selectedMsg.status === 'Update' ? 'Schedule Rescheduled' // <--- Thêm dòng này
                    : 'Request Sent'}
                  </h2>
                  <div className="dh-meta">With Tutor: <b>{selectedMsg.tutorName}</b></div>
                </div>
                <div className={`status-pill ${selectedMsg.status.toLowerCase()}`}>{selectedMsg.status}</div>
              </div>

              <div className="detail-body">
                {/* FIX NỘI DUNG MÔ TẢ */}
                <p style={{marginBottom: '20px', lineHeight: '1.5'}}>
                  {selectedMsg.status === 'Confirmed' ? "Great news! Your consultation request has been accepted." 
                  : selectedMsg.status === 'Rejected' ? "Unfortunately, your request could not be accepted."
                  : selectedMsg.status === 'Update' ? "Attention: The tutor has updated the schedule for this session." // <--- Thêm dòng này
                  : "Your request is currently awaiting tutor approval."}
                </p>

                <div className="info-grid">
                  <div className="info-item"><label>Subject</label><div>{selectedMsg.courseName}</div></div>
                  {/* Hiển thị giờ mới nhất */}
                  <div className="info-item"><label>New Time</label><div>{selectedMsg.date} @ {selectedMsg.time}</div></div>
                </div>
                
                {/* HIỂN THỊ LÝ DO / NỘI DUNG THÔNG BÁO */}
                <div className="info-item" style={{marginTop: '20px'}}>
                  <label>Message / Details</label>
                  <div className="reason-box" style={{color: selectedMsg.status === 'Update' ? '#b45309' : '#475569'}}>
                    "{selectedMsg.reason}"
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="empty-view">
              <div className="empty-icon">📭</div>
              <p>Select a notification to view</p>
            </div>
          )}
        </div>

      </div>
    </StudentLayout>
  );
};

export default StudentInbox;