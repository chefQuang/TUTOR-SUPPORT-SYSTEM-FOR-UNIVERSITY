import React, { useState, useEffect } from 'react';
import StudentLayout from './StudentLayout';
import axios from 'axios';
import './StudentMaterials.css';

interface Material {
  id: string;
  title: string;
  author: string;
  sharedBy: string;
  description: string;
  majors: string[];
  coverImage: string;
  downloadUrl: string;
}

const StudentMaterials = () => {
  const [view, setView] = useState<'grid' | 'detail'>('grid');
  const [materials, setMaterials] = useState<Material[]>([]);
  const [selectedMat, setSelectedMat] = useState<Material | null>(null);
  const [query, setQuery] = useState('');
  const [majorFilter, setMajorFilter] = useState('All Majors');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const majors = ["All Majors", "Computer Science", "Computer Engineering", "Electrical Engineering", "Business Administration"];

  // Fetch Materials
  useEffect(() => {
    const fetchMaterials = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/student/materials?q=${query}&major=${majorFilter}`);
        if(res.data.success) setMaterials(res.data.data);
      } catch (err) { console.error(err); }
    };
    // Debounce nhẹ hoặc gọi luôn khi enter (ở đây gọi luôn khi change để mượt)
    const timeout = setTimeout(fetchMaterials, 300);
    return () => clearTimeout(timeout);
  }, [query, majorFilter]);

  const handleSelectMaterial = async (id: string) => {
    try {
      const res = await axios.get(`http://localhost:5000/api/student/material-detail?id=${id}`);
      if(res.data.success) {
        setSelectedMat(res.data.data);
        setView('detail');
      }
    } catch (err) { console.error(err); }
  };

  const handlePreview = () => {
    alert("Opening preview viewer for first 5 pages...");
    // Thực tế sẽ mở Modal PDF viewer
  };

  const handleDownload = () => {
    alert("Downloading file...");
    // window.open(selectedMat?.downloadUrl);
  };

  // --- VIEW: GRID LIST (UPDATE)---
const renderGrid = () => (
    <>
      <div className="mat-header">
        <div className="mat-search-container">
          <input 
            type="text" 
            className="mat-input" 
            placeholder="Search for books, documents..." 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        {/* --- CUSTOM DROPDOWN BẮT ĐẦU TỪ ĐÂY --- */}
        <div className={`mat-filter-container ${isDropdownOpen ? 'dropdown-open' : ''}`}>
          {/* Nút Trigger */}
          <div 
            className="custom-dropdown-trigger" 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          >
            <span>{majorFilter}</span>
            <span className="dropdown-arrow">▼</span>
          </div>

          {/* Menu thả xuống */}
          <div className="custom-dropdown-menu">
            {majors.map(m => (
              <div 
                key={m} 
                className={`dropdown-item ${majorFilter === m ? 'selected' : ''}`}
                onClick={() => {
                  setMajorFilter(m);
                  setIsDropdownOpen(false); // Chọn xong tự đóng
                }}
              >
                {m}
                {/* Hiện dấu tích nếu đang chọn */}
                {majorFilter === m && <span className="check-icon">✓</span>}
              </div>
            ))}
          </div>
          
          {/* Lớp phủ tàng hình để click ra ngoài thì đóng menu (Optional nhưng tốt cho UX) */}
          {isDropdownOpen && (
            <div 
              style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 90}}
              onClick={() => setIsDropdownOpen(false)}
            />
          )}
        </div>
        {/* --- KẾT THÚC CUSTOM DROPDOWN --- */}
      </div>

      <div className="mat-grid">
        {materials.map(mat => (
          <div key={mat.id} className="mat-card" onClick={() => handleSelectMaterial(mat.id)}>
            <div className="mat-cover-wrapper">
              <img src={mat.coverImage} alt={mat.title} className="mat-cover-img" />
            </div>
            <div className="mat-info">
              <span className="mat-tag">{mat.majors[0]}</span>
              <h3 className="mat-title">{mat.title}</h3>
              <p className="mat-desc">{mat.description}</p>
            </div>
          </div>
        ))}
        {materials.length === 0 && <p style={{gridColumn: '1/-1', textAlign: 'center', color: '#999'}}>No materials found.</p>}
      </div>
    </>
  );

  // --- VIEW: DETAIL ---
  const renderDetail = () => {
    if (!selectedMat) return null;
    return (
      <div className="mat-detail-view">
        <button className="btn btn-action" style={{marginBottom: '20px', borderRadius:'20px'}} onClick={() => setView('grid')}>← Back to Library</button>
        
        {/* HERO SECTION (Màu tối) */}
        <div className="hero-section">
          <img src={selectedMat.coverImage} alt={selectedMat.title} className="hero-cover" />
          
          <div className="hero-content">
            <div style={{background:'rgba(255,255,255,0.2)', width:'fit-content', padding:'5px 15px', borderRadius:'20px', marginBottom:'15px', fontSize:'0.9rem'}}>
              Shared by: {selectedMat.sharedBy}
            </div>
            <h1 className="hero-title">{selectedMat.title}</h1>
            <p className="hero-meta">By {selectedMat.author} • {selectedMat.majors.join(', ')}</p>

            <div className="hero-actions">
              <div className="price-box">
                <div>Access Type</div>
                <div className="price-value">Free</div>
              </div>
              <div>
                <button className="btn-review" onClick={handlePreview}>Review (5 pages)</button>
                <button className="btn-download" onClick={handleDownload}>Download PDF</button>
              </div>
            </div>
          </div>
        </div>

        {/* CONTENT DESCRIPTION */}
        <div className="content-section">
          <h2 className="content-title">Description</h2>
          <p className="content-text">{selectedMat.description}</p>
          <p className="content-text" style={{marginTop: '20px'}}>
            This material is provided for educational purposes. Please respect copyright laws and university regulations when using this document.
          </p>
        </div>
      </div>
    );
  };

  return (
    <StudentLayout title="Learning Materials">
      {view === 'grid' ? renderGrid() : renderDetail()}
    </StudentLayout>
  );
};

export default StudentMaterials;