import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import TutorLayout from './TutorLayout';
import axios from 'axios';
import { Download, ChevronLeft } from 'lucide-react';
import './TutorClasses.css';

interface Submission {
  studentId: string; studentName: string; studentCode: string; avatarUrl?: string;
  submittedAt: string; status: string; fileUrl?: string; score?: number;
}

const TutorAssignmentView = () => {
  const { courseId, assignmentId } = useParams();
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState<Submission[]>([]);

  useEffect(() => {
    const fetchSubs = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/tutor/assignment-submissions?itemId=${assignmentId}`);
        if(res.data.success) setSubmissions(res.data.data);
      } catch (err) { console.error(err); }
    };
    fetchSubs();
  }, [assignmentId]);

  // --- HÀM DOWNLOAD CHUẨN (FIX LỖI HTML) ---
  const handleDownload = (url?: string, filename?: string) => {
    if (!url || url === "#") {
      alert("File not found or invalid URL."); 
      return;
    }
    
    // Tạo thẻ a ảo
    const link = document.createElement('a');
    link.href = url;
    // Thuộc tính download giúp trình duyệt hiểu là cần tải về
    // Nếu file không cùng domain (localhost:5000 vs 3000), browser có thể mở tab mới
    link.setAttribute('download', filename || 'submission-file'); 
    link.setAttribute('target', '_blank'); 
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <TutorLayout title="Assignment Submissions">
      <div style={{paddingBottom: '40px'}}>
        <div className="sub-header">
          {/* FIX: Nút Back có màu nền trắng và style rõ ràng */}
          <button 
            className="btn-action" 
            onClick={() => navigate(-1)} 
            style={{
              display:'flex', alignItems:'center', gap:'8px', 
              background:'white', border:'1px solid #cbd5e1', 
              padding: '10px 16px', borderRadius: '10px',
              fontWeight: 600, color: '#334155', cursor: 'pointer',
              boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
            }}
          >
            <ChevronLeft size={18}/> Back to Class
          </button>
          
          <div style={{fontSize:'1.2rem', fontWeight:700, color:'#1e293b'}}>Submission List</div>
        </div>

        {submissions.length > 0 ? (
          <table className="sub-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Submitted At</th>
                <th>Status</th>
                <th>Score</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map((sub, idx) => (
                <tr key={idx}>
                  <td>
                    <div style={{display:'flex', alignItems:'center'}}>
                      <div className="sub-avatar">{sub.studentName.charAt(0)}</div>
                      <div>
                        <div style={{fontWeight:600}}>{sub.studentName}</div>
                        <div style={{fontSize:'0.8rem', color:'#94a3b8'}}>{sub.studentCode}</div>
                      </div>
                    </div>
                  </td>
                  <td>{new Date(sub.submittedAt).toLocaleString()}</td>
                  <td><span className={`sub-status ${sub.status === 'Graded' ? 'graded' : 'pending'}`}>{sub.status}</span></td>
                  <td>{sub.score !== undefined ? sub.score : '-'}</td>
                  <td>
                    {sub.fileUrl && (
                      <button 
                        className="btn-download-sub" 
                        onClick={() => handleDownload(sub.fileUrl, `${sub.studentName}_Submission`)}
                      >
                        <Download size={14}/> Download
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div style={{textAlign:'center', padding:'50px', color:'#94a3b8', background:'white', borderRadius:'16px'}}>
            No submissions yet.
          </div>
        )}
      </div>
    </TutorLayout>
  );
};

export default TutorAssignmentView;