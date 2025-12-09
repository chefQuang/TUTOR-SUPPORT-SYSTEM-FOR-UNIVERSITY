import React, { useState, useEffect } from 'react';
import TutorLayout from './TutorLayout';
import axios from 'axios';
import './Inbox.css'; // Dùng chung CSS

interface Request {
  id: string; studentId: string; courseName: string; 
  date: string; time: string; status: 'Pending' | 'Confirmed' | 'Rejected'; 
  reason: string;
}

const TutorInbox = () => {
  const [requests, setRequests] = useState<Request[]>([]);
  const [selectedReq, setSelectedReq] = useState<Request | null>(null);
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const fetchRequests = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/tutor/consultations?tutorId=${user.id}`);
      if (res.data.success) {
        // Sort Pending lên đầu
        const sorted = res.data.data.sort((a: Request, b: Request) => (a.status === 'Pending' ? -1 : 1));
        setRequests(sorted);
        // Nếu đang chọn một request, update lại data của nó
        if (selectedReq) {
            const updated = sorted.find((r:Request) => r.id === selectedReq.id);
            if(updated) setSelectedReq(updated);
        }
      }
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchRequests(); }, []);

  const handleAction = async (action: 'Approve' | 'Reject') => {
    if (!selectedReq) return;
    try {
      const res = await axios.post('http://localhost:5000/api/tutor/respond-consultation', {
        tutorId: user.id,
        consultationId: selectedReq.id,
        action: action
      });
      if (res.data.success) {
        alert(res.data.message); // Có thể thay bằng Toast
        fetchRequests();
      }
    } catch (err) { alert("Error processing request"); }
  };

  return (
    <TutorLayout title="Inbox">
      <div className="inbox-wrapper">
        
        {/* LEFT COLUMN: LIST */}
        <div className="inbox-list">
          <div className="inbox-header">
            <h2 className="inbox-title">Requests</h2>
            <div className="inbox-subtitle">{requests.filter(r => r.status === 'Pending').length} Pending Requests</div>
          </div>
          <div className="msg-scroll-area">
            {requests.map(req => (
              <div 
                key={req.id} 
                className={`msg-card ${selectedReq?.id === req.id ? 'active' : ''} ${req.status === 'Pending' ? 'pending' : ''}`}
                onClick={() => setSelectedReq(req)}
              >
                <div className="msg-header">
                  <span className="msg-sender">{req.studentId}</span> {/* Thực tế nên map ra tên */}
                  <span className="msg-date">{new Date(req.date).toLocaleDateString()}</span>
                </div>
                <div className="msg-subject">{req.courseName}</div>
                <div className="msg-preview">{req.reason}</div>
                <span className={`mini-badge ${req.status.toLowerCase()}`}>{req.status}</span>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT COLUMN: DETAIL */}
        <div className="inbox-detail">
          {selectedReq ? (
            <div className="detail-content">
              <div className="detail-header">
                <div className="dh-left">
                  <h2>Consultation Request</h2>
                  <div className="dh-meta">From Student ID: <b>{selectedReq.studentId}</b></div>
                </div>
                <div className={`status-pill ${selectedReq.status.toLowerCase()}`}>{selectedReq.status}</div>
              </div>

              <div className="detail-body">
                <div className="info-grid">
                  <div className="info-item"><label>Subject</label><div>{selectedReq.courseName}</div></div>
                  <div className="info-item"><label>Date & Time</label><div>{selectedReq.date} @ {selectedReq.time}</div></div>
                  <div className="info-item"><label>Location</label><div>Google Meet (Remote)</div></div>
                </div>
                <div className="info-item">
                  <label>Message / Reason</label>
                  <div className="reason-box">"{selectedReq.reason}"</div>
                </div>
              </div>

              {selectedReq.status === 'Pending' && (
                <div className="detail-actions">
                  <button className="btn-inbox btn-reject" onClick={() => handleAction('Reject')}>Decline</button>
                  <button className="btn-inbox btn-approve" onClick={() => handleAction('Approve')}>Accept Request</button>
                </div>
              )}
            </div>
          ) : (
            <div className="empty-view">
              <div className="empty-icon">📩</div>
              <p>Select a request to view details</p>
            </div>
          )}
        </div>

      </div>
    </TutorLayout>
  );
};

export default TutorInbox;