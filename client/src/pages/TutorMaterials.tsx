import React, { useState, useEffect, useRef } from 'react';
import TutorLayout from './TutorLayout';
import axios from 'axios';
import { Search, Upload, X, ChevronDown } from 'lucide-react'; 
import './TutorMaterials.css';

interface Material {
  id: string; title: string; author: string; sharedBy: string;
  description: string; majors: string[]; downloadUrl: string; uploadDate?: string;
  coverImage: string;
}

const TutorMaterials = () => {
  // State quản lý View
  const [view, setView] = useState<'grid' | 'detail'>('grid');
  const [selectedMat, setSelectedMat] = useState<Material | null>(null);

  const [materials, setMaterials] = useState<Material[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMajorFilter, setSelectedMajorFilter] = useState("All Majors");
  
  // Toggle UI
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isUploadDropdownOpen, setIsUploadDropdownOpen] = useState(false);

  // Upload Form Data
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [description, setDescription] = useState("");
  const [selectedMajors, setSelectedMajors] = useState<string[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const availableMajors = [
    "Computer Science", "Computer Engineering", "Electrical Engineering",
    "Business Administration", "General"
  ];
  const majorsFilterList = ["All Majors", ...availableMajors];

  // --- FETCH DATA ---
  const fetchMaterials = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/tutor/materials?q=${searchQuery}&major=${selectedMajorFilter}`);
      if (res.data.success) setMaterials(res.data.data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { 
    const timeout = setTimeout(fetchMaterials, 300);
    return () => clearTimeout(timeout);
  }, [searchQuery, selectedMajorFilter]);

  // --- ACTIONS ---
  const handleSelectMaterial = async (id: string) => {
    try {
      const res = await axios.get(`http://localhost:5000/api/tutor/material-detail?id=${id}`);
      if(res.data.success) {
        setSelectedMat(res.data.data);
        setView('detail');
      }
    } catch (err) { console.error(err); }
  };

  const handleRealDownload = (url: string, filename: string) => {
    // 1. Kiểm tra URL hợp lệ
    if (!url || url === '#' || !url.startsWith('http')) {
      alert("File not available or invalid URL."); 
      return; 
    }

    // 2. Tạo thẻ a ảo để tải
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename); // Gợi ý tên file
    link.setAttribute('target', '_blank');   // Mở tab mới (dự phòng)
    document.body.appendChild(link);
    
    // 3. Kích hoạt click
    link.click();
    
    // 4. Dọn dẹp
    document.body.removeChild(link);
  };

  // --- UPLOAD LOGIC ---
  const toggleMajor = (major: string) => {
    if (selectedMajors.includes(major)) setSelectedMajors(selectedMajors.filter(m => m !== major));
    else setSelectedMajors([...selectedMajors, major]);
  };

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsUploadDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleUpload = async () => {
    if (!file) { alert("Please select a file."); return; }
    if (!title || !author) { alert("Title and Author are required."); return; }
    if (selectedMajors.length === 0) { alert("Please select at least one Major."); return; }

    const formData = new FormData();
    formData.append('file', file); formData.append('title', title);
    formData.append('author', author); formData.append('description', description);
    formData.append('majors', JSON.stringify(selectedMajors));
    formData.append('sharedBy', user.fullName || "Tutor");

    try {
      const res = await axios.post('http://localhost:5000/api/materials/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data.success) {
        alert("Upload successful!");
        setShowModal(false); fetchMaterials();
        setFile(null); setTitle(""); setAuthor(""); setDescription(""); setSelectedMajors([]);
      }
    } catch (err: any) { alert("Upload failed"); }
  };

  // --- RENDER DETAIL VIEW (Giống Student) ---
  const renderDetail = () => {
    if (!selectedMat) return null;
    return (
      <div className="mat-detail-view">
        <button className="btn-upload-primary" style={{background:'white', color:'#334155', border:'1px solid #cbd5e1', boxShadow:'none', marginBottom:'20px'}} onClick={() => setView('grid')}>
          ← Back to Library
        </button>
        
        <div className="hero-section">
          <img src={selectedMat.coverImage || "https://via.placeholder.com/200"} alt={selectedMat.title} className="hero-cover" />
          <div className="hero-content">
            <div style={{background:'rgba(255,255,255,0.2)', width:'fit-content', padding:'5px 15px', borderRadius:'20px', marginBottom:'15px', fontSize:'0.9rem'}}>
              Shared by: {selectedMat.sharedBy}
            </div>
            <h1 className="hero-title">{selectedMat.title}</h1>
            <p className="hero-meta">By {selectedMat.author} • {selectedMat.majors.join(', ')}</p>
            <div className="hero-actions">
              <div className="price-box"><div>Access</div><div style={{fontSize:'1.5rem', fontWeight:800, color:'#0033cc'}}>Free</div></div>
              <div>
                <button className="btn-review" onClick={() => alert("Preview feature")}>Review (5 pages)</button>
                <button className="btn-download" onClick={() => handleRealDownload(selectedMat.downloadUrl, selectedMat.title)}>Download PDF</button>
              </div>
            </div>
          </div>
        </div>

        <div className="content-section">
          <h2 className="content-title">Description</h2>
          <p className="content-text">{selectedMat.description}</p>
        </div>
      </div>
    );
  };

  // --- RENDER GRID VIEW ---
  const renderGrid = () => (
    <>
      <div className="mat-header">
        <div className="mat-search-container">
          <input 
            type="text" className="mat-input" placeholder="Search materials..." 
            value={searchQuery} onChange={e => setSearchQuery(e.target.value)} 
          />
        </div>

        {/* CUSTOM DROPDOWN FILTER */}
        <div className={`mat-filter-container ${isFilterOpen ? 'dropdown-open' : ''}`}>
          <div className="custom-dropdown-trigger" onClick={() => setIsFilterOpen(!isFilterOpen)}>
            <span>{selectedMajorFilter}</span>
            <ChevronDown size={16} color="#94a3b8"/>
          </div>
          <div className="custom-dropdown-menu">
            {majorsFilterList.map(m => (
              <div key={m} className={`dropdown-item ${selectedMajorFilter===m?'selected':''}`} 
                   onClick={() => { setSelectedMajorFilter(m); setIsFilterOpen(false); }}>
                {m} {selectedMajorFilter===m && <span>✓</span>}
              </div>
            ))}
          </div>
          {isFilterOpen && <div style={{position:'fixed', inset:0, zIndex:40}} onClick={()=>setIsFilterOpen(false)}/>}
        </div>

        {/* NÚT UPLOAD (Chỉ có ở Tutor) */}
        <button className="btn-upload-primary" onClick={() => setShowModal(true)}>
          <Upload size={18}/> Upload
        </button>
      </div>

      <div className="mat-grid">
        {materials.map(mat => (
          <div key={mat.id} className="mat-card" onClick={() => handleSelectMaterial(mat.id)}>
            <div className="mat-cover-wrapper">
              <img src={mat.coverImage || "https://via.placeholder.com/200"} alt={mat.title} className="mat-cover-img" />
            </div>
            <div className="mat-info">
              <div className="mat-tags-row">
                  {mat.majors.map(tag => <span key={tag} className="mat-tag">{tag}</span>)}
              </div>
              <h3 className="mat-title">{mat.title}</h3>
              <div className="mat-author">by {mat.author}</div>
              <p className="mat-desc">{mat.description}</p>
            </div>
          </div>
        ))}
        {materials.length === 0 && <p style={{color:'#94a3b8', gridColumn:'1/-1', textAlign:'center'}}>No materials found.</p>}
      </div>
    </>
  );

  return (
    <TutorLayout title="Learning Materials">
      <div className="mat-container">
        {view === 'grid' ? renderGrid() : renderDetail()}
      </div>

      {/* --- UPLOAD MODAL (GRID LAYOUT FIX) --- */}
      {showModal && (
        <div className="modal-overlay">
          <div className="grade-modal-content" style={{width:'650px'}}>
            <div className="gm-header">
              <h2 className="gm-title">Upload Material</h2>
              <button className="gm-close" onClick={() => setShowModal(false)}><X size={24}/></button>
            </div>

            <div className={`upload-drop-zone`} onClick={() => fileInputRef.current?.click()}>
              <input type="file" hidden ref={fileInputRef} onChange={(e) => { if(e.target.files?.[0]) { setFile(e.target.files[0]); setTitle(e.target.files[0].name.split('.')[0]); } }} accept=".pdf,.doc,.docx,.ppt,.pptx,.zip" />
              <div style={{fontSize:'2rem', marginBottom:'10px'}}>☁️</div>
              <div style={{fontWeight:600, color:'#334155'}}>{file ? 'Change File' : 'Click to Upload File'}</div>
              <div style={{fontSize:'0.8rem', color:'#94a3b8', marginTop:'4px'}}>Max 10MB (PDF, DOC, ZIP)</div>
            </div>
            {file && <div className="file-preview">📄 {file.name} <span style={{marginLeft:'auto', cursor:'pointer', color:'red'}} onClick={(e)=>{e.stopPropagation(); setFile(null)}}>✕</span></div>}

            <div className="gm-form-group">
              <label className="gm-label">Document Title <span style={{color:'red'}}>*</span></label>
              <input type="text" className="gm-input" value={title} onChange={e => setTitle(e.target.value)} />
            </div>

            {/* Grid chia đôi Author và Target Majors */}
            <div className="gm-grid-row">
                <div className="gm-form-group">
                    <label className="gm-label">Author <span style={{color:'red'}}>*</span></label>
                    <input type="text" className="gm-input" value={author} onChange={e => setAuthor(e.target.value)} placeholder="Author name" />
                </div>
                
                <div className="gm-form-group" ref={dropdownRef}>
                    <label className="gm-label">Target Majors <span style={{color:'red'}}>*</span></label>
                    <div className="custom-select-container">
                        <div className="custom-select-trigger" onClick={() => setIsUploadDropdownOpen(!isUploadDropdownOpen)}>
                            {selectedMajors.length > 0 ? (
                                <div className="selected-tags">
                                    {selectedMajors.slice(0, 2).map(m => <span key={m} className="mini-tag">{m}</span>)}
                                    {selectedMajors.length > 2 && <span className="mini-tag">+{selectedMajors.length - 2}</span>}
                                </div>
                            ) : <span className="placeholder-text">Select majors...</span>}
                            <ChevronDown size={16} color="#94a3b8" />
                        </div>
                        <div className={`custom-options-list ${isUploadDropdownOpen ? 'open' : ''}`}>
                            {availableMajors.map(major => {
                                const isSelected = selectedMajors.includes(major);
                                return (
                                    <div key={major} className={`custom-option ${isSelected ? 'selected' : ''}`} onClick={() => toggleMajor(major)}>
                                        <div className="checkbox-box"></div><span>{major}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            <div className="gm-form-group">
              <label className="gm-label">Description</label>
              <textarea className="gm-input" rows={3} value={description} onChange={e => setDescription(e.target.value)} placeholder="Brief description..." style={{height:'auto'}}></textarea>
            </div>

            <div className="gm-actions">
              <button className="btn-upload-primary" style={{background:'white', color:'#334155', border:'1px solid #cbd5e1', boxShadow:'none'}} onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn-upload-primary" onClick={handleUpload}>🚀 Upload Now</button>
            </div>
          </div>
        </div>
      )}
    </TutorLayout>
  );
};

export default TutorMaterials;