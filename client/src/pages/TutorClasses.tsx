import React, { useState, useEffect, useRef } from 'react';
import TutorLayout from './TutorLayout';
import axios from 'axios';
import { ChevronDown, ChevronRight, Plus, Upload, X, FileText, Trash2, ChevronDown as ChevronIcon } from 'lucide-react';
import './TutorClasses.css';
import './MyCourses.css';
import { useNavigate } from 'react-router-dom';

interface ClassMin { 
  courseId: string; courseName: string; status: string; 
  classId: string; tutorName: string; studentCount: number;
}
interface CourseSection { id: string; title: string; items: CourseItem[]; }
interface CourseItem { id: string; type: string; title: string; fileUrl?: string; }

const TutorClasses = () => {
  const [view, setView] = useState<'list' | 'detail'>('list');
  const [classes, setClasses] = useState<ClassMin[]>([]);
  const [selectedClass, setSelectedClass] = useState<ClassMin | null>(null);
  const [sections, setSections] = useState<CourseSection[]>([]);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  // Modals State
  const [showSectionModal, setShowSectionModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  
  // Input State
  const [newSectionTitle, setNewSectionTitle] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState("");
  const [targetSectionId, setTargetSectionId] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const [isSectionDropdownOpen, setIsSectionDropdownOpen] = useState(false);
  const navigate = useNavigate();

  // 1. Fetch Classes
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/tutor/classes?tutorId=${user.id}`);
        if(res.data.success) setClasses(res.data.data);
      } catch (err) { console.error(err); }
    };
    fetchClasses();
  }, []);

  // 2. Select Class & Fetch Content
  const handleSelectClass = async (cls: ClassMin) => {
    setSelectedClass(cls);
    try {
      const res = await axios.get(`http://localhost:5000/api/courses/content?courseId=${cls.courseId}`);
      if(res.data.success) {
        setSections(res.data.data);
        setView('detail');
        // Mở sẵn section đầu tiên
        if(res.data.data.length > 0) setExpandedSections({ [res.data.data[0].id]: true });
      }
    } catch (err) { console.error(err); }
  };

  const toggleSection = (id: string) => {
    setExpandedSections(prev => ({...prev, [id]: !prev[id]}));
  };

  // --- ACTIONS: ADD SECTION ---
  const handleAddSection = async () => {
    if (!newSectionTitle || !selectedClass) return;
    try {
      const res = await axios.post('http://localhost:5000/api/tutor/add-section', {
        courseId: selectedClass.courseId,
        title: newSectionTitle
      });
      if(res.data.success) {
        alert("Section added!");
        setSections([...sections, res.data.data]); // Update UI local
        setShowSectionModal(false);
        setNewSectionTitle("");
      }
    } catch (err) { alert("Failed to add section"); }
  };

  // --- ACTIONS: UPLOAD CONTENT ---
  const handleUploadContent = async () => {
    if (!uploadFile || !uploadTitle || !targetSectionId || !selectedClass) return;
    
    const formData = new FormData();
    formData.append('file', uploadFile);
    formData.append('title', uploadTitle);
    formData.append('sectionId', targetSectionId);
    formData.append('courseId', selectedClass.courseId);

    try {
      const res = await axios.post('http://localhost:5000/api/tutor/add-item', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if(res.data.success) {
        alert("Content uploaded!");
        // Reload content to update list
        const contentRes = await axios.get(`http://localhost:5000/api/courses/content?courseId=${selectedClass.courseId}`);
        if(contentRes.data.success) setSections(contentRes.data.data);
        
        setShowUploadModal(false);
        setUploadFile(null); setUploadTitle("");
      }
    } catch (err) { alert("Upload failed"); }
  };

  // Hàm Download
  const handleRealDownload = (url: string) => {
    if(!url) return;
    const link = document.createElement('a'); link.href = url;
    link.setAttribute('download', ''); link.setAttribute('target', '_blank');
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  //Hàm xóa tài liệu
  const handleDeleteItem = async (e: React.MouseEvent, sectionId: string, itemId: string) => {
    e.stopPropagation(); // Chặn click vào item cha
    if(!window.confirm("Are you sure you want to delete this item?")) return;
    
    try {
      const res = await axios.post('http://localhost:5000/api/tutor/delete-item', {
        courseId: selectedClass?.courseId,
        sectionId,
        itemId
      });
      if(res.data.success) {
        // Reload content
        const contentRes = await axios.get(`http://localhost:5000/api/courses/content?courseId=${selectedClass?.courseId}`);
        if(contentRes.data.success) setSections(contentRes.data.data);
      }
    } catch (err) { alert("Delete failed"); }
  };

  // Chuyển tới trang chi tiết của submission
  const handleItemClick = (item: any) => {
    if (item.type === 'file') {
      handleRealDownload(item.fileUrl);
    } else if (item.type === 'assignment') {
      // Chuyển tới trang chấm bài
      navigate(`/tutor/class/${selectedClass?.classId}/assignment/${item.id}`);
    }
  };

  // --- RENDER LIST VIEW ---
  const renderList = () => (
    <div className="course-list-grid">
      {classes.map(c => (
        <div key={c.classId} className="tutor-card" onClick={() => handleSelectClass(c)}>
          <div style={{display:'flex', justifyContent:'space-between', marginBottom:'10px'}}>
             <span className={`status-tag ${c.status.toLowerCase()}`}>{c.status}</span>
             <span style={{fontSize:'0.8rem', color:'#64748b'}}>👥 {c.studentCount} Students</span>
          </div>
          <h3 className="perf-title">{c.courseName}</h3>
          <div className="perf-code">{c.courseId}</div>
          <div style={{marginTop:'15px', paddingTop:'15px', borderTop:'1px solid #f1f5f9', fontSize:'0.9rem', color:'#334155'}}>
            <div>🏫 Class ID: <strong>{c.classId}</strong></div>
          </div>
        </div>
      ))}
    </div>
  );

  // --- RENDER DETAIL VIEW ---
  const renderDetail = () => (
    <div className="class-detail-view">
      <div className="class-header">
        <div>
            <button className="btn-action" style={{marginBottom:'10px', borderRadius:'8px'}} onClick={() => setView('list')}>← Back to Classes</button>
            <h2 style={{margin:0, color:'#1e293b'}}>{selectedClass?.courseName} ({selectedClass?.classId})</h2>
        </div>
        <div style={{display:'flex', gap:'10px'}}>
            <button className="btn-add-section" onClick={() => setShowSectionModal(true)}>+ New Section</button>
            <button className="btn-upload-content" onClick={() => setShowUploadModal(true)}><Upload size={16}/> Upload Content</button>
        </div>
      </div>

      <div className="accordion-container">
        {sections.map(sec => (
          <div key={sec.id} className="accordion-item">
            <div className={`accordion-header ${expandedSections[sec.id] ? 'active' : ''}`} onClick={() => toggleSection(sec.id)}>
              <span>{sec.title}</span>
              {expandedSections[sec.id] ? <ChevronDown size={18}/> : <ChevronRight size={18}/>}
            </div>
            
            {expandedSections[sec.id] && (
              <div className="accordion-body">
                {sec.items.length > 0 ? sec.items.map(item => (
                  <div key={item.id} className="content-link" onClick={() => handleItemClick(item)}>
                    <span className="icon">
                        {item.type === 'file' ? '📄' : item.type === 'assignment' ? '📝' : '❓'}
                    </span>
                    <span className="text" style={{flex:1}}>{item.title}</span>
                    
                    {/* NÚT XÓA (Chỉ hiện khi hover) */}
                    <span className="btn-delete-item" onClick={(e) => handleDeleteItem(e, sec.id, item.id)}>
                        <Trash2 size={16}/>
                    </span>
                  </div>
                )) : <div style={{padding:'15px', color:'#999', fontStyle:'italic'}}>No content.</div>}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <TutorLayout title="My Classes">
      {view === 'list' ? renderList() : renderDetail()}

      {/* MODAL: ADD SECTION */}
      {showSectionModal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h3 style={{marginTop:0}}>Create New Section</h3>
            <input 
                className="gm-input" 
                placeholder="e.g. Week 5: Advanced Topics" 
                value={newSectionTitle}
                onChange={e => setNewSectionTitle(e.target.value)}
                style={{marginTop:'15px', marginBottom:'20px'}}
            />
            <div style={{display:'flex', justifyContent:'flex-end', gap:'10px'}}>
                <button className="btn-cancel" onClick={() => setShowSectionModal(false)} style={{background:'white', border:'1px solid #ddd'}}>Cancel</button>
                <button className="gm-btn-save" onClick={handleAddSection}>Create</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: UPLOAD CONTENT */}
      {showUploadModal && (
        <div className="modal-overlay">
          <div className="modal-box" style={{width:'500px'}}>
            <div style={{display:'flex', justifyContent:'space-between', marginBottom:'20px'}}>
                <h3 style={{margin:0}}>Upload Content</h3>
                <button style={{background:'none', border:'none', cursor:'pointer'}} onClick={()=>setShowUploadModal(false)}><X size={20}/></button>
            </div>
            
            <div className="upload-drop-zone" onClick={() => fileInputRef.current?.click()} style={{padding:'20px'}}>
                <input type="file" hidden ref={fileInputRef} onChange={e => { if(e.target.files?.[0]) { setUploadFile(e.target.files[0]); setUploadTitle(e.target.files[0].name); } }} />
                <div style={{color:'#64748b'}}>{uploadFile ? uploadFile.name : 'Click to select file'}</div>
            </div>

            <div className="gm-form-group">
                <label className="gm-label">Title</label>
                <input className="gm-input" value={uploadTitle} onChange={e => setUploadTitle(e.target.value)} />
            </div>

            {/* CUSTOM DROPDOWN SELECT SECTION */}
            <div className="gm-form-group" style={{position:'relative'}}>
                <label className="gm-label">Upload To Section</label>
                <div className="custom-select-container">
                    <div className="custom-select-trigger" onClick={() => setIsSectionDropdownOpen(!isSectionDropdownOpen)}>
                        <span>{targetSectionId ? sections.find(s=>s.id===targetSectionId)?.title : 'Select Section...'}</span>
                        <ChevronIcon size={16} color="#94a3b8"/>
                    </div>
                    
                    <div className={`custom-options-list ${isSectionDropdownOpen ? 'open' : ''}`}>
                        {sections.map(s => (
                            <div key={s.id} className={`custom-option ${targetSectionId===s.id ? 'selected' : ''}`} 
                                 onClick={() => { setTargetSectionId(s.id); setIsSectionDropdownOpen(false); }}>
                                <span>{s.title}</span>
                            </div>
                        ))}
                    </div>
                    {isSectionDropdownOpen && <div style={{position:'fixed', inset:0, zIndex:90}} onClick={()=>setIsSectionDropdownOpen(false)}/>}
                </div>
            </div>

            <div style={{display:'flex', justifyContent:'flex-end', gap:'10px', marginTop:'20px'}}>
                <button className="btn-cancel" onClick={() => setShowUploadModal(false)} style={{background:'white', border:'1px solid #ddd', padding:'10px 20px', borderRadius:'8px'}}>Cancel</button>
                <button className="gm-btn-save" onClick={handleUploadContent} style={{padding:'10px 20px', borderRadius:'8px', background:'#0f172a', color:'white', border:'none', fontWeight:600}}>Upload</button>
            </div>
          </div>
        </div>
      )}

    </TutorLayout>
  );
};

export default TutorClasses;