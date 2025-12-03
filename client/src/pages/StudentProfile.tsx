import React, { useEffect, useState, useRef } from 'react';
import StudentLayout from './StudentLayout';
import axios from 'axios';
import './StudentProfile.css';

interface UserProfile {
  fullName: string;
  email: string;
  studentIdDisplay: string;
  major: string;
  phoneNumber: string;
  currentYear: string;
  bio: string;
  avatarUrl?: string;
}

const StudentProfile = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  const [profile, setProfile] = useState<UserProfile>({
    fullName: '',
    email: '',
    studentIdDisplay: '',
    major: '',
    phoneNumber: '',
    currentYear: '',
    bio: '',
    avatarUrl: ''
  });

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [backupProfile, setBackupProfile] = useState<UserProfile | null>(null);
  
  // State mới để xử lý Preview ảnh
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. Fetch Data
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/student/profile?studentId=${user.id}`);
        if (res.data.success) {
          setProfile(res.data.data);
        }
      } catch (error) {
        console.error("Failed to fetch profile", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [user.id]);

  // 2. Handle Change Input Text
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  // 3. Edit Mode
  const handleEditClick = () => {
    setBackupProfile(profile);
    setIsEditing(true);
  };

  // 4. Cancel (Reset cả Text và Ảnh preview)
  const handleCancel = () => {
    if (backupProfile) setProfile(backupProfile);
    
    // Reset ảnh preview
    setSelectedFile(null);
    setPreviewUrl(null);
    
    setIsEditing(false);
  };

  // 5. Chọn File (Chỉ Preview, chưa Upload)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Lưu file để tí nữa upload
    setSelectedFile(file);

    // Tạo URL tạm để hiện ảnh ngay lập tức
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  const handleAvatarClick = () => {
    if (!isEditing) return;
    fileInputRef.current?.click();
  };

  // 6. SAVE CHANGES (Upload ảnh trước rồi mới lưu thông tin)
  const handleSave = async () => {
    try {
      let finalAvatarUrl = profile.avatarUrl;

      // Bước 1: Nếu có chọn ảnh mới -> Upload ảnh trước
      if (selectedFile) {
        const formData = new FormData();
        formData.append('avatar', selectedFile);
        formData.append('studentId', user.id);

        const uploadRes = await axios.post('http://localhost:5000/api/student/upload-avatar', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        if (uploadRes.data.success) {
          finalAvatarUrl = uploadRes.data.avatarUrl;
          // Cập nhật state profile với URL thật từ server
          setProfile(prev => ({ ...prev, avatarUrl: finalAvatarUrl }));
        }
      }

      // Bước 2: Lưu thông tin profile (Text + URL ảnh mới nhất)
      const payload = {
        studentId: user.id,
        ...profile,
        avatarUrl: finalAvatarUrl // Quan trọng: Gửi URL mới lên server lưu vào DB
      };

      const res = await axios.put('http://localhost:5000/api/student/profile', payload);
      
      if (res.data.success) {
        alert("Changes saved successfully!");
        
        // Reset trạng thái tạm
        setIsEditing(false);
        setSelectedFile(null);
        setPreviewUrl(null);

        // Cập nhật localStorage và Sidebar
        const updatedUser = { 
          ...user, 
          fullName: profile.fullName,
          avatarUrl: finalAvatarUrl 
        };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        window.dispatchEvent(new Event('user-updated'));
      }
    } catch (error: any) {
      console.error("Save failed", error);
      alert(error.response?.data?.message || "Failed to save changes");
    }
  };

  if (loading) return <StudentLayout title="Profile"><div>Loading...</div></StudentLayout>;

  // Logic hiển thị: Ưu tiên ảnh Preview -> Ảnh gốc -> Chữ cái đầu
  const displayAvatarSrc = previewUrl || profile.avatarUrl;
  const displayName = profile.fullName || user.fullName || "?";
  const initial = displayName.charAt(0).toUpperCase();
  const avatarBackgroundColor = '#2563eb';

  return (
    <StudentLayout title="">
      <div className="profile-page-container">
        <h1 className="page-main-title">Profile</h1>
        <div className="profile-card-container">
          
          <div className="card-top-header">
            <h2 className="card-title">Profile Settings</h2>
            {!isEditing && (
              <button className="btn-edit-black" onClick={handleEditClick}>
                Edit Profile
              </button>
            )}
          </div>

          <div className="avatar-section">
            <input 
              type="file" ref={fileInputRef} style={{ display: 'none' }} accept="image/*"
              onChange={handleFileChange}
            />
            <div 
              className="avatar-image-wrapper" onClick={handleAvatarClick}
              style={{ cursor: isEditing ? 'pointer' : 'default' }}
            >
              {displayAvatarSrc ? (
                <img src={displayAvatarSrc} alt="Avatar" className="avatar-img" />
              ) : (
                <div className="avatar-initials-placeholder" style={{ backgroundColor: avatarBackgroundColor }}>
                  {initial}
                </div>
              )}
              
              {isEditing && (
                <div className="avatar-overlay"><span className="camera-icon">📷</span></div>
              )}
            </div>
            <span className="avatar-label">Profile Picture</span>
            {isEditing && <span style={{fontSize:'0.75rem', color:'#9ca3af', marginTop: '4px'}}>Click image to change</span>}
          </div>

          <div className="profile-form-grid">
            <div className="form-field-group">
              <label className="field-label">Full Name</label>
              <input type="text" name="fullName" className="field-input" value={profile.fullName} onChange={handleChange} disabled={!isEditing} />
            </div>
            <div className="form-field-group">
              <label className="field-label">Student ID</label>
              <input type="text" className="field-input" value={profile.studentIdDisplay} disabled={true} style={{cursor: 'not-allowed', color: '#6b7280'}} />
            </div>
            <div className="form-field-group">
              <label className="field-label">Email</label>
              <input type="text" className="field-input" value={profile.email} disabled={true} style={{cursor: 'not-allowed', color: '#6b7280'}} />
            </div>
            <div className="form-field-group">
              <label className="field-label">Phone Number</label>
              <input type="text" name="phoneNumber" className="field-input" value={profile.phoneNumber} onChange={handleChange} disabled={!isEditing} placeholder={isEditing ? "+84..." : ""} />
            </div>
            <div className="form-field-group">
              <label className="field-label">Major</label>
              <input type="text" name="major" className="field-input" value={profile.major} onChange={handleChange} disabled={!isEditing} />
            </div>
            <div className="form-field-group">
              <label className="field-label">Year</label>
              <input type="text" name="currentYear" className="field-input" value={profile.currentYear} onChange={handleChange} disabled={!isEditing} />
            </div>
          </div>

          <div className="form-field-group bio-section">
            <label className="field-label">Bio</label>
            <textarea name="bio" className="field-input bio-input" value={profile.bio} onChange={handleChange} disabled={!isEditing} placeholder={isEditing ? "Write something about yourself..." : "No bio provided."} />
          </div>

          {isEditing && (
            <div className="edit-actions-footer">
              <button className="btn-cancel" onClick={handleCancel}>Cancel</button>
              <button className="btn-save" onClick={handleSave}>Save Changes</button>
            </div>
          )}
        </div>
      </div>
    </StudentLayout>
  );
};

export default StudentProfile;