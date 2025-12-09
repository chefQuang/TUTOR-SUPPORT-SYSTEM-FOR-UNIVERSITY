import React, { useState, useEffect } from 'react';
import StudentLayout from './StudentLayout';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Upload, FileText, Download } from 'lucide-react';
import './AssignmentDetail.css';

interface AssignmentData { id: string; title: string; description: string; dueDate: string; }
interface Submission { status: string; submittedAt: string; fileUrl: string; }

const AssignmentDetail = () => {
  const { courseId, itemId } = useParams(); // Lấy itemId từ URL
  const navigate = useNavigate();
  
  const [assignment, setAssignment] = useState<AssignmentData | null>(null);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Lấy user ở đây để dùng trong toàn bộ component
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const resItem = await axios.get(`http://localhost:5000/api/courses/item?courseId=${courseId}&itemId=${itemId}`);
        if(resItem.data.success) setAssignment(resItem.data.data);

        const resSub = await axios.get(`http://localhost:5000/api/courses/submission?studentId=${user.id}&itemId=${itemId}`);
        if(resSub.data.success && resSub.data.data) {
          setSubmission(resSub.data.data);
        } else {
          setSubmission(null); // Đảm bảo reset nếu không có submission
        }
      } catch (err) { console.error(err); }
    };
    fetchData();
  }, [courseId, itemId]);

  const handleSubmit = async () => {
    if (!file) {
      alert("Please select a file first.");
      return;
    }
    if (!window.confirm("Confirm submission?")) return;

    const formData = new FormData();
    // 'submission' phải trùng tên với upload.single('submission') ở server.ts
    formData.append('submission', file); 
    formData.append('studentId', user.id);
    formData.append('itemId', itemId || ''); // itemId lấy từ useParams

    try {
      const res = await axios.post('http://localhost:5000/api/courses/submit-assignment', formData, {
        headers: { 'Content-Type': 'multipart/form-data' } // Bắt buộc header này
      });

      if (res.data.success) {
        alert("Submitted successfully!");
        setSubmission(res.data.data);
        setIsEditing(false);
        setFile(null);
      }
    } catch (err: any) { 
        console.error(err);
        alert(err.response?.data?.message || "Submission failed"); 
    }
  };

  const handleDeleteSubmission = async () => {
    if(!window.confirm("Are you sure you want to remove your submission?")) return;
    
    try {
      const res = await axios.post('http://localhost:5000/api/courses/remove-submission', {
        studentId: user.id,
        itemId: itemId
      });

      if (res.data.success) {
        alert("Submission removed successfully!");
        setSubmission(null); // Set về null để UI đổi trạng thái
        setIsEditing(false);
        setFile(null);
      }
    } catch (err) {
      alert("Failed to remove submission.");
    }
  };

  const handleRealDownload = (url: string) => {
    if(!url) return;
    const link = document.createElement('a'); link.href = url;
    link.setAttribute('download', ''); link.setAttribute('target', '_blank');
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  if (!assignment) return <div>Loading...</div>;

  return (
    <StudentLayout title="Assignment Submission">
      <div className="assign-container">
        <button className="btn-back" onClick={() => navigate(-1)}>← Back to Course</button>

        <div className="assign-header-card">
          <div className="assign-meta">
            <span className="assign-type">Assignment</span>
            <span className="assign-due">Due: {new Date(assignment.dueDate).toLocaleString()}</span>
          </div>
          <h1>{assignment.title}</h1>
          <p className="assign-desc">{assignment.description}</p>
        </div>

        <div className="submission-card">
          <h2 className="card-title">Submission Status</h2>
          
          <table className="sub-table">
            <tbody>
              <tr>
                <th>Grading Status</th>
                <td>
                  <span className={`status-badge ${submission ? 'pending' : 'none'}`}>
                    {submission ? submission.status : 'No attempt'}
                  </span>
                </td>
              </tr>
              <tr>
                <th>Last Modified</th>
                <td>{submission ? new Date(submission.submittedAt).toLocaleString() : '-'}</td>
              </tr>
              <tr>
                <th>File Submissions</th>
                <td>
                  {submission ? (
                    <div className="file-display" style={{display:'flex', alignItems:'center', gap:'10px'}}>
                      <FileText size={18} color="#0033cc"/>
                      <span style={{fontWeight: 600, color: '#334155'}}>
                        {submission.fileUrl.split('/').pop() || 'submitted_file'}
                      </span>
                      <button 
                        onClick={() => handleRealDownload(submission.fileUrl)}
                        style={{
                          background: 'transparent', border: 'none', cursor: 'pointer',
                          color: '#0033cc', display: 'flex', alignItems: 'center', gap: '4px',
                          fontWeight: 600, fontSize: '0.85rem', marginLeft: '10px'
                        }}
                      >
                        <Download size={14}/> Download
                      </button>
                    </div>
                  ) : '-'}
                </td>
              </tr>
            </tbody>
          </table>

          <div className="sub-actions">
            {!submission || isEditing ? (
              <div className="upload-area">
                <h3>Upload your file</h3>
                <div className="file-input-box">
                  <input type="file" onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)} />
                </div>
                <div className="btn-group">
                  <button className="btn-submit" onClick={handleSubmit}>Save Changes</button>
                  {submission && <button className="btn-cancel" onClick={() => setIsEditing(false)}>Cancel</button>}
                </div>
              </div>
            ) : (
              <div className="manage-btns">
                <button className="btn-edit" onClick={() => setIsEditing(true)}>Edit Submission</button>
                <button className="btn-remove" onClick={handleDeleteSubmission}>Remove Submission</button>
              </div>
            )}
          </div>

        </div>
      </div>
    </StudentLayout>
  );
};

export default AssignmentDetail;