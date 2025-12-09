import React, { useState, useEffect } from 'react';
import StudentLayout from './StudentLayout';
import axios from 'axios';
import './BookingConsultation.css';
import { Search, Plus, Star, X, ChevronLeft, ChevronRight, Clock } from 'lucide-react'; // Thêm icon cần thiết

// ... (Giữ nguyên các interface cũ) ...
interface ClassInfo {
  classId: string;
  tutorName: string;
  scheduleOverview: string;
  isRegistered: boolean;
  capacity: number;
  enrolledStudentIds: string[];
}

interface CourseResult {
  courseId: string;
  courseName: string;
  credits: number;
  classes: ClassInfo[];
}

const CourseRegistration = () => {
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState('register');
  const [courses, setCourses] = useState<CourseResult[]>([]);
  
  // Context
  const [contextCourse, setContextCourse] = useState<CourseResult | null>(null);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [selectedCourseForModal, setSelectedCourseForModal] = useState<CourseResult | null>(null);
  const [selectedTutorName, setSelectedTutorName] = useState<string>("");
  const [bookingReason, setBookingReason] = useState("");

  // Booking State (Mới)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null); // Ngày được chọn
  const [viewDate, setViewDate] = useState(new Date()); // Tháng đang xem (để chuyển qua lại)
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);
  
  const [unavailableSlots, setUnavailableSlots] = useState<string[]>([]);

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    if (activeTab === 'register') {
      // Gọi hàm search không truyền tham số (hoặc truyền chuỗi rỗng)
      handleSearch(); 
    }
  }, [activeTab]);  

  useEffect(() => {
    if (showModal && selectedTutorName && selectedDate) {
      fetchAvailability();
    }
  }, [showModal, selectedDate, selectedTutorName]);

  const fetchAvailability = async () => {
    if (!selectedDate) return;
    try {
      // Format date YYYY-MM-DD để gửi lên server (lưu ý timezone)
      const dateStr = selectedDate.toLocaleDateString('en-CA'); // 'en-CA' trả về format YYYY-MM-DD
      const res = await axios.get(`http://localhost:5000/api/student/tutor-availability?tutorName=${selectedTutorName}&date=${dateStr}`);
      if (res.data.success) {
        setUnavailableSlots(res.data.data); // data là mảng string giờ bận ["09:00", "14:00"]
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSearch = async (searchQuery: string = '') => {
    try {
      const res = await axios.get(`http://localhost:5000/api/student/search?q=${searchQuery}&studentId=${user.id}`);
      if (res.data.success) setCourses(res.data.data);
    } catch (err) { setCourses([]); }
  };

  const handleFindTutor = (course: CourseResult) => {
    setContextCourse(course);
    setActiveTab('tutor');
  };

  // Mở modal Booking
  const handleOpenBooking = (course: CourseResult, tutorName: string) => {
    setSelectedCourseForModal(course);
    setSelectedTutorName(tutorName);
    
    // Reset state lịch
    const today = new Date();
    setViewDate(today);
    setSelectedDate(today);
    setSelectedTimeSlot(null);
    setBookingReason("");

    setShowModal(true);
  };

  const handleConfirmBooking = async () => {
    if (!selectedDate || !selectedTimeSlot) {
      alert("Please select a date and time slot!");
      return;
    }

    if (!bookingReason.trim()) {
      alert("Please provide a reason for the consultation.");
      return;
    }

    try {
      const dateStr = toLocalDateString(selectedDate);
      
      const res = await axios.post('http://localhost:5000/api/student/book-consultation', {
        studentId: user.id,
        tutorName: selectedTutorName,
        courseName: selectedCourseForModal?.courseName, // Đảm bảo gửi courseName
        date: dateStr, // Chuỗi YYYY-MM-DD chuẩn
        time: selectedTimeSlot,
        reason: bookingReason
      });
      if (res.data.success) {
        alert(res.data.message);
        if (selectedTimeSlot) {
          setUnavailableSlots(prev => [...prev, selectedTimeSlot]);
          setSelectedTimeSlot(null);
        }
        // -------------------------------------------------------------------------

        setShowModal(false);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || "Booking failed");
    }
  };
  const handlePrevMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  const handleSelectDay = (day: number) => {
    const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    setSelectedDate(newDate);
  };

  // Tính toán Grid lịch
  const getDaysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const getFirstDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay(); // 0 = Sunday

  const daysInMonth = getDaysInMonth(viewDate);
  const startDay = getFirstDayOfMonth(viewDate);
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const timeSlots = ["08:00", "09:00", "10:00", "11:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00"];

  // --- DỮ LIỆU GIẢ ---
  

  // --- RENDER MODAL BOOKING (MỚI) ---
  const renderBookingModal = () => {
    if (!selectedCourseForModal) return null;

    return (
      <div className="modal-overlay">
        <div className="booking-modal-content">
          <div className="bm-header">
            <h3>Select Date & Time</h3>
            <button className="bm-close-btn" onClick={() => setShowModal(false)}><X size={20} /></button>
          </div>
          <p className="bm-subtitle">Choose your preferred date and time slot</p>

          <div className="bm-tutor-info">
            <div className="bm-avatar">{selectedTutorName.charAt(0)}</div>
            <div>
              <div className="bm-tutor-name">{selectedTutorName}</div>
              <div className="bm-tutor-meta"><Star size={12} fill="#fbbf24" stroke="none" /> 4.8/5.0 • {selectedCourseForModal.courseName}</div>
            </div>
          </div>

        <div style={{display:'flex', gap:'24px'}}>

          {/*CỘT TRÁI */}
          <div style={{flex: 1}}>
            <div className="bm-section-title">Select Date</div>
            <div className="bm-calendar">
              <div className="cal-header">
                <button className="cal-nav" onClick={handlePrevMonth}><ChevronLeft size={16}/></button>
                <span>{monthNames[viewDate.getMonth()]} {viewDate.getFullYear()}</span>
                <button className="cal-nav" onClick={handleNextMonth}><ChevronRight size={16}/></button>
              </div>
              <div className="cal-grid">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => <div key={d} className="cal-day-name">{d}</div>)}
                {[...Array(startDay)].map((_, i) => <div key={`empty-${i}`} className="cal-day empty"></div>)}
                {[...Array(daysInMonth)].map((_, i) => {
                  const day = i + 1;
                  const dateObj = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
                  
                  // Logic check:
                  const isSelected = selectedDate && 
                                    selectedDate.getDate() === day && 
                                    selectedDate.getMonth() === viewDate.getMonth() && 
                                    selectedDate.getFullYear() === viewDate.getFullYear();
                  
                  const isPast = isPastDate(dateObj); // Kiểm tra ngày quá khứ

                  return (
                    <div 
                      key={day} 
                      // Thêm class 'disabled' nếu là ngày quá khứ
                      className={`cal-day ${isSelected ? 'selected' : ''} ${isPast ? 'disabled' : ''}`} 
                      onClick={() => !isPast && handleSelectDay(day)} // Không cho click nếu quá khứ
                      style={isPast ? {opacity: 0.3, cursor: 'not-allowed'} : {}}
                    >
                      {day}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>


        {/*CỘT PHẢI*/}
          <div style={{flex: 1, display:'flex', flexDirection:'column'}}>
            <div className="bm-slots-header">
              <div className="bm-section-title">Available Time Slots</div>
              <div className="bm-date-display">{selectedDate ? selectedDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : 'Select a date'}</div>
            </div>
            
            <div className="bm-slots-grid">
              {timeSlots.map(time => {
                // 1. Kiểm tra xem giờ này có nằm trong danh sách bận không
                const isUnavailable = unavailableSlots.includes(time);
                
                return (
                  <button 
                    key={time} 
                    // 2. Nếu bận -> thêm class 'unavailable', nếu không -> kiểm tra 'selected'
                    className={`time-slot-btn ${isUnavailable ? 'unavailable' : (selectedTimeSlot === time ? 'selected' : '')}`}
                    
                    // 3. Vô hiệu hóa nút bấm nếu bận
                    disabled={isUnavailable}
                    
                    // 4. Chỉ cho chọn nếu không bận
                    onClick={() => !isUnavailable && setSelectedTimeSlot(time)}
                  >
                    {/* Icon đồng hồ cũng mờ đi nếu bận (CSS sẽ xử lý việc này) */}
                    <Clock size={14} className="icon-clock" /> {time}
                  </button>
                );
              })}
            </div>

            <div className="bm-section-title">Reason for Consultation <span style={{color:'red'}}>*</span></div>
              <textarea 
                className="bm-reason-input"
                placeholder="e.g. I need help with Assignment 2 regarding React Hooks..."
                rows={4}
                value={bookingReason}
                onChange={(e) => setBookingReason(e.target.value)}
              ></textarea>

          </div>
        </div>

        <div className="bm-footer">
          <div className="bm-legend">
              <div className="legend-item"><span className="dot selected"></span> Selected</div>
              <div className="legend-item"><span className="dot available"></span> Available</div>
              <div className="legend-item"><span className="dot unavailable"></span> Unavailable</div>
            </div>
            <div className="bm-actions">
              <button className="bm-btn-cancel" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="bm-btn-next" onClick={handleConfirmBooking}>Confirm</button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // --- RENDER CÁC TAB (Code cũ giữ nguyên, chỉ sửa gọi hàm mở modal) ---
  const renderRegisterTab = () => ( /* ... Giữ nguyên ... */ 
    <>
      <h2 className="cr-card-title">Booking Consultation</h2>
      <div className="cr-search-area">
        <div className="cr-search-box">
          <Search className="search-icon" size={18} color="#9ca3af" />
          <input type="text" placeholder="Search courses..." value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch(query)} />
        </div>
      </div>
      <div className="cr-filter-row"><button className="btn-find-year">Find by Year</button></div>
      <div className="cr-table-container">
        <table className="cr-table">
          <thead><tr><th style={{width:'15%'}}>Code</th><th style={{width:'65%'}}>Course Name</th><th style={{width:'10%'}}>Credits</th><th style={{width:'10%'}}></th></tr></thead>
          <tbody>
            {courses.length > 0 ? courses.map(course => (
              <tr key={course.courseId}>
                <td className="col-code">{course.courseId}</td><td className="col-name">{course.courseName}</td><td className="col-credits">{course.credits}</td>
                <td className="col-action"><button className="btn-icon-plus" onClick={() => handleFindTutor(course)}><Plus size={16} /></button></td>
              </tr>
            )) : <tr><td colSpan={4} className="empty-msg">No courses found.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );

  const renderSelectTutorTab = () => {
    // ... (Logic lọc tutor giữ nguyên) ...
    let displayTutors = [];
    // (Giả lập logic hiển thị tutor như cũ)
    const defaultTutors = [
      { name: "John Smith", subject: "Discrete Mathematics", rating: "4.8", desc: "Expert in mathematics", avatar: "J" },
      { name: "Sarah Johnson", subject: "C Programming", rating: "4.9", desc: "Experienced programming tutor", avatar: "S" },
    ];
    
    if (contextCourse) {
       // Logic thực tế (giữ nguyên code cũ của bạn)
       const uniqueTutors = new Set();
       displayTutors = contextCourse.classes.filter(cls => {
          if (uniqueTutors.has(cls.tutorName)) return false;
          uniqueTutors.add(cls.tutorName);
          return true;
       }).map(cls => ({
          name: cls.tutorName, subject: contextCourse.courseName, rating: "4.8", desc: `Tutor for class ${cls.classId}`, avatar: cls.tutorName.charAt(0)
       }));
    } else { displayTutors = defaultTutors; }

    return (
      <div className="tutor-tab-content">
        <h2 className="cr-card-title">Select Tutor</h2>
        <div className="context-box">
          {contextCourse ? (<>Finding tutors for: <span style={{fontWeight: 600, marginLeft: 5}}>{contextCourse.courseName}</span></>) : (<span>Please select a course first.</span>)}
        </div>
        <div className="cr-search-area"><div className="cr-search-box"><Search className="search-icon" size={18} color="#9ca3af" /><input type="text" placeholder="Search tutors..." /></div></div>
        <div className="tutor-filters">
          <div className="select-wrapper"><select className="tutor-select"><option>Subject</option></select></div>
          <div className="select-wrapper"><select className="tutor-select"><option>Rating</option></select></div>
          <div className="select-wrapper"><select className="tutor-select"><option>Sort by</option></select></div>
        </div>
        <div className="tutor-grid">
          {displayTutors.map((tutor, idx) => (
            <div key={idx} className="tutor-card">
              <div className="tutor-header">
                <div className="tutor-avatar">{tutor.avatar}</div>
                <div><div className="tutor-name">{tutor.name}</div><div className="tutor-rating"><Star size={12} fill="#fbbf24" stroke="none"/> {tutor.rating}</div></div>
              </div>
              <div className="tutor-subject">{tutor.subject}</div><div className="tutor-desc">{tutor.desc}</div>
              
              {/* GỌI HÀM MỞ MODAL MỚI */}
              <button className="btn-black-action" onClick={() => contextCourse ? handleOpenBooking(contextCourse, tutor.name) : alert("Select course first")}>Select & Book</button>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderAutoMatchTab = () => (
    <div className="auto-tab-content">
      <h2 className="cr-card-title">Auto-Match Tutor</h2>
      <div className="cr-search-area" style={{marginBottom: 20}}><div className="cr-search-box"><Search className="search-icon" size={18} color="#9ca3af" /><input type="text" placeholder="Search..." /></div></div>
      <div className="auto-status-box">
        <div className="auto-status-text">{contextCourse ? `Finding best match for ${contextCourse.courseName}...` : "Waiting..."}</div>
        <div className="progress-bar"><div className="progress-fill"></div></div>
      </div>
      {contextCourse && (
        <>
          <div className="tutor-card matched-card">
            <div className="tutor-header">
              <div className="tutor-avatar blue">A</div>
              <div><div className="tutor-name">AI Recommendation</div><div className="tutor-subject">{contextCourse.courseName}</div><div className="tutor-rating"><Star size={12} fill="#fbbf24" stroke="none"/> 5.0</div></div>
            </div>
            {/* GỌI HÀM MỞ MODAL MỚI */}
            <button className="btn-black-action" onClick={() => handleOpenBooking(contextCourse, "AI Tutor")}>Book Session</button>
          </div>
          <div className="success-msg-box"><div className="success-title">Tutor assigned successfully!</div><div className="success-desc">Click "Book Session" above to schedule.</div></div>
        </>
      )}
    </div>
  );

  return (
    <StudentLayout title="">
      <div className="cr-header-top" style={{ justifyContent: 'left' }}> 
        <h1 className="cr-page-title" >{activeTab === 'register' ? 'Booking Consultation' : activeTab === 'tutor' ? 'Select Tutor' : 'Auto-Match Tutor'}</h1>
      </div>
      <div className="cr-tabs-container">
        <div className="cr-tabs">
          <button className={`cr-tab ${activeTab === 'register' ? 'active' : ''}`} onClick={() => setActiveTab('register')}>Booking Consultation</button>
          <button className={`cr-tab ${activeTab === 'tutor' ? 'active' : ''} ${!contextCourse ? 'disabled' : ''}`} onClick={() => contextCourse && setActiveTab('tutor')} disabled={!contextCourse}>Select Tutor</button>
          <button className={`cr-tab ${activeTab === 'auto' ? 'active' : ''} ${!contextCourse ? 'disabled' : ''}`} onClick={() => contextCourse && setActiveTab('auto')} disabled={!contextCourse}>Auto-Match</button>
        </div>
      </div>
      <div className="cr-main-card">
        {activeTab === 'register' && renderRegisterTab()}
        {activeTab === 'tutor' && renderSelectTutorTab()}
        {activeTab === 'auto' && renderAutoMatchTab()}
      </div>

      {/* HIỂN THỊ MODAL MỚI */}
      {showModal && renderBookingModal()}

    </StudentLayout>
  );
};

const isPastDate = (dateToCheck: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset giờ về 0h sáng nay
    return dateToCheck < today;
  };

  // 2. HÀM HELPER MỚI: Tạo chuỗi YYYY-MM-DD theo giờ địa phương (Fix lỗi 28 -> 29)
  const toLocalDateString = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

export default CourseRegistration;