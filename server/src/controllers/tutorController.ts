// server/src/controllers/tutorController.ts
import type { Request, Response } from 'express';
import { COURSES, USERS, CONSULTATIONS, SCHEDULES, GRADES, NOTIFICATIONS, MATERIALS, COURSE_CONTENTS, SUBMISSIONS, type Session, CourseStatus, Notification, Material, Major, CourseItem, CourseSection, ContentType} from '../models/mockData';

// --- HELPER: Tính toán trạng thái dựa trên thời gian ---
const calculateStatus = (dateStr: string, timeStr: string, manualStatus?: boolean): boolean => {
  // 1. Ưu tiên Manual Status nếu có (Tutor chỉnh tay)
  if (manualStatus !== undefined) return manualStatus;

  // 2. Logic tự động so sánh thời gian
  try {
    const now = new Date();
    // Parse ngày giờ buổi học (Giả sử timeStr là "07:00 - 10:00")
    const endTimeStr = timeStr.split('-')[1]?.trim() || timeStr.trim(); 
    const [endH, endM] = endTimeStr.split(':').map(Number);
    
    // Tạo Date object cho thời gian kết thúc buổi học
    const sessionEnd = new Date(dateStr);
    sessionEnd.setHours(endH || 0, endM, 0);

    // Nếu thời gian kết thúc nhỏ hơn hiện tại -> Đã xong
    return sessionEnd < now;
  } catch (e) {
    return false;
  }
};


// Helper: Check trùng lịch (Tái sử dụng logic cũ)
const getDayNumber = (day: string): number => {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return days.indexOf(day);
};

// FIX: Thêm kiểm tra an toàn cho timeStr
const getMinutes = (timeStr: string): number => {
  if (!timeStr) return 0;
  // Ép kiểu string để tránh lỗi undefined
  const parts = timeStr.split(':');
  const hours = Number(parts[0] || 0); 
  const minutes = Number(parts[1] || 0);
  return hours * 60 + minutes;
};

// FIX: Thêm kiểm tra an toàn cho mảng parts
const isTimeOverlap = (schedule1: string, schedule2: string): boolean => {
  try {
    if (!schedule1 || !schedule2) return false;

    // "Mon 07:00 - 10:00" -> ["Mon", "07:00", "-", "10:00"]
    const parts1 = schedule1.split(' ');
    const parts2 = schedule2.split(' ');

    // Kiểm tra độ dài mảng để đảm bảo có đủ dữ liệu
    if (parts1.length < 4 || parts2.length < 4) return false;

    const day1 = getDayNumber(parts2[0] || "");;
    const day2 = getDayNumber(parts2[0] || "");;

    if (day1 !== day2) return false;

    // Dùng biến tạm để TS hiểu kiểu string
    const start1Str = parts1[1];
    const end1Str = parts1[3];
    const start2Str = parts2[1];
    const end2Str = parts2[3];

    // Kiểm tra undefined trước khi gọi getMinutes (hoặc dùng ! nếu chắc chắn)
    if (!start1Str || !end1Str || !start2Str || !end2Str) return false;

    const start1 = getMinutes(start1Str);
    const end1 = getMinutes(end1Str);
    const start2 = getMinutes(start2Str);
    const end2 = getMinutes(end2Str);

    return (start1 < end2) && (start2 < end1);
  } catch (e) {
    return false;
  }
};

// 1. Lấy lịch dạy của Tutor
export const getTutorSchedule = (req: Request, res: Response) => {
  const tutorId = req.query.tutorId as string;
  let allSessions: any[] = [];

  // 1. LẤY LỊCH DẠY CỐ ĐỊNH (Class Sessions)
  COURSES.forEach(course => {
    course.classes.forEach(cls => {
      if (cls.tutorId === tutorId) {
        cls.sessions.forEach(s => {
          const isDone = calculateStatus(s.date, s.time, s.isCompleted);
          allSessions.push({
            id: s.id, // ID gốc của session
            date: s.date,
            time: s.time,
            courseName: course.courseName,
            classId: cls.classId,
            type: 'Teaching', // Phân loại
            room: s.room,
            isCompleted: isDone
          });
        });
      }
    });
  });

  // 2. LẤY LỊCH TƯ VẤN (Confirmed Consultations)
  const myConsultations = CONSULTATIONS.filter(c => c.tutorId === tutorId && c.status === 'Confirmed');
  
  myConsultations.forEach(c => {
    const isDone = calculateStatus(c.date, c.time);
    allSessions.push({
      id: c.id, // ID của consultation
      date: c.date,
      time: c.time,
      courseName: `Consultation: ${c.courseName}`, // Tiêu đề khác biệt
      classId: c.studentId, // Hiển thị tên SV thay vì mã lớp
      type: 'Consultation', // Phân loại
      room: c.room || "Online",
      isCompleted: isDone // Tự động check completed theo ngày
    });
  });

  res.status(200).json({ success: true, data: allSessions });
};

// 2. Cập nhật buổi dạy (Change Time)
export const updateSession = (req: Request, res: Response) => {
  const { tutorId, sessionId, classId, newDate, newTime, courseName } = req.body; 
  // newDate: "2025-12-05", newTime: "08:00 - 11:00"
  console.log(req.body);

  console.log("Backend received update:", { sessionId, newDate, classId, newTime });

  // Tìm Session cần sửa
  let targetSession: any = null;
  let contextType = ""; // 'Class' or 'Consultation'
  let targetClass: any = null

  // Tìm trong COURSES
  for (const c of COURSES) {
    for (const cls of c.classes) {
      if (cls.tutorId === tutorId && (!classId || cls.classId === classId)) {
        const s = cls.sessions.find(x => x.id === sessionId);
        if (s) { targetSession = s; targetClass = cls; contextType = "Class"; break; }
      }
    }
    if (targetSession) break;
  }

  if (!targetSession) {
    const cons = CONSULTATIONS.find(c => c.id === sessionId && c.tutorId === tutorId);
    if (cons) { targetSession = cons; contextType = "Consultation"; }
  }

  if (!targetSession) {
    res.status(404).json({ success: false, message: "Session not found" });
    return;
  }

  // --- CHECK TRÙNG LỊCH (CONFLICT) ---
  // Lấy thứ trong tuần của ngày mới (VD: "2025-12-05" -> Friday -> "Fri")
  const dateObj = new Date(newDate);
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const dayStr = days[dateObj.getDay()];
  const newScheduleStr = `${dayStr} ${newTime}`; // "Fri 08:00 - 11:00"

  // Quét tất cả các buổi dạy KHÁC của Tutor này để xem có trùng không
  for (const course of COURSES) {
    for (const cls of course.classes) {
      if (cls.tutorId === tutorId) {
        for (const sess of cls.sessions) {
          // Bỏ qua chính session đang sửa
          if (sess.id === sessionId) continue;

          // Tạo chuỗi schedule cho session kia để so sánh
          const sessDateObj = new Date(sess.date);
          const sessDayStr = days[sessDateObj.getDay()];
          const sessScheduleStr = `${sessDayStr} ${sess.time}`;

          // Kiểm tra trùng ngày và trùng giờ
          if (sess.date === newDate && isTimeOverlap(newScheduleStr, sessScheduleStr)) {
             res.status(400).json({ 
               success: false, 
               message: `Time conflict with ${course.courseName} (${cls.classId}) at ${sess.time}` 
             });
             return;
          }
        }
      }
    }
  }

  // Update thành công

  const oldDate = targetSession.date;
  const oldTime = targetSession.time;


  targetSession.date = newDate;
  targetSession.time = newTime;

  if (contextType === "Consultation") {
      targetSession.status = "Confirmed"; 
  }

  if(targetSession.isCompleted !== undefined) targetSession.isCompleted = false;

  //GỬI THÔNG BÁO
  const notiContent = `The session for ${courseName} has been rescheduled from ${oldDate} (${oldTime}) to ${newDate} (${newTime}).`;

  if (contextType === "Consultation") {
      NOTIFICATIONS.push({
          id: "NOTI-" + Date.now(),
          studentId: targetSession.studentId,
          tutorName: targetSession.tutorName || "Tutor",
          courseName: courseName,
          date: newDate,
          time: newTime,
          status: "Update", // Trạng thái này quan trọng để FE hiển thị
          reason: notiContent, // Nội dung chi tiết
          isRead: false
      });
  } else if (contextType === "Class" && targetClass) {
      targetClass.enrolledStudentIds.forEach((sid: string) => {
          NOTIFICATIONS.push({
              id: "NOTI-" + Date.now() + Math.random(),
              studentId: sid,
              tutorName: targetClass.tutorName,
              courseName: courseName, // Sửa classId thành courseName cho đẹp
              date: newDate,
              time: newTime,
              status: "Update",
              reason: notiContent,
              isRead: false
          });
      });
  }

  res.status(200).json({ success: true, message: "Session updated successfully!" });
};

export const toggleSessionStatus = (req: Request, res: Response) => {
  const { tutorId, sessionId, status } = req.body; // status: true (Completed) / false (Upcoming)

  // Tìm Session (Chỉ hỗ trợ Class Session trong Mock Data hiện tại vì Consultation chưa có field này)
  let targetSession: any = null;
  for (const c of COURSES) {
    for (const cls of c.classes) {
      if (cls.tutorId === tutorId) {
        const s = cls.sessions.find(x => x.id === sessionId);
        if (s) { targetSession = s; break; }
      }
    }
  }

  if (targetSession) {
    targetSession.isCompleted = status; // Ghi đè trạng thái
    res.status(200).json({ success: true, message: `Session marked as ${status ? 'Completed' : 'Upcoming'}.` });
  } else {
    // Nếu là Consultation, ta có thể bỏ qua hoặc update model sau
    res.status(404).json({ success: false, message: "Session not found or cannot be manually toggled." });
  }
};

// 3. Hủy buổi dạy (Cancel Session)
export const cancelSession = (req: Request, res: Response) => {
  const { tutorId, sessionId } = req.body;

  let found = false;
  for (const course of COURSES) {
    for (const cls of course.classes) {
      if (cls.tutorId === tutorId) {
        const idx = cls.sessions.findIndex(s => s.id === sessionId);
        if (idx > -1) {
          cls.sessions.splice(idx, 1); // Xóa khỏi mảng -> Student cũng sẽ mất luôn
          found = true;
          break;
        }
      }
    }
    if (found) break;
  }

  if (!found) {
      const idx = CONSULTATIONS.findIndex(c => c.id === sessionId && c.tutorId === tutorId);
      if (idx > -1) {
          CONSULTATIONS.splice(idx, 1);
          found = true;
      }
  }

  if (found) {
    res.status(200).json({ success: true, message: "Session cancelled" });
  } else {
    res.status(404).json({ success: false, message: "Session not found" });
  }
};

export const getConsultationRequests = (req: Request, res: Response) => {
    const tutorId = req.query.tutorId as string;
    // Lấy tất cả request gửi đến tutor này
    const requests = CONSULTATIONS.filter(c => c.tutorId === tutorId);
    res.status(200).json({ success: true, data: requests });
};

export const respondToConsultation = (req: Request, res: Response) => {
    const { tutorId, consultationId, action } = req.body;

    const consultation = CONSULTATIONS.find(c => c.id === consultationId && c.tutorId === tutorId);
    if (!consultation) {
        res.status(404).json({ success: false, message: "Request not found" });
        return;
    }

    if (action === "Reject") {
        consultation.status = "Rejected";
        res.status(200).json({ success: true, message: "Request rejected." });
    } else if (action === "Approve") {
        consultation.status = "Confirmed";
        consultation.room = "Google Meet (Link)";

        // ĐỒNG BỘ LỊCH: Ghi vào SCHEDULES để hàm getBusySlots hoạt động đúng
        // (Không cần push vào COURSES vì hàm getSchedule đã tự đọc CONSULTATIONS rồi)
        
        // Helper thêm lịch (đảm bảo không trùng)
        const addToSchedule = (uid: string, date: string, time: string) => {
            let sched = SCHEDULES.find(s => s.userId === uid && s.date === date);
            if (!sched) {
                SCHEDULES.push({ userId: uid, date: date, bookedSlots: [time] });
            } else if (!sched.bookedSlots.includes(time)) {
                sched.bookedSlots.push(time);
            }
        };

        addToSchedule(consultation.studentId, consultation.date, consultation.time);
        addToSchedule(consultation.tutorId, consultation.date, consultation.time);

        res.status(200).json({ success: true, message: "Request approved. Schedule updated for both." });
    } else {
        res.status(400).json({ success: false, message: "Invalid action" });
    }
};


// Helper tái sử dụng từ studentController (nên tách ra utils chung nếu dự án thật)
const markSlotAsTaken = (userId: string, dateStr: string, time: string) => {
  let schedule = SCHEDULES.find(s => s.userId === userId && s.date === dateStr);
  if (schedule) {
    if (!schedule.bookedSlots.includes(time)) schedule.bookedSlots.push(time);
  } else {
    SCHEDULES.push({ userId, date: dateStr, bookedSlots: [time] });
  }
};

const calculateAverage = (components: any[]) => {
  if (!components || components.length === 0) return 0;
  let totalScore = 0;
  let totalWeight = 0;
  components.forEach(c => {
    totalScore += c.score * (c.weight / 100);
    totalWeight += c.weight;
  });
  return totalWeight > 0 ? parseFloat(totalScore.toFixed(2)) : 0;
};

// API: Lấy danh sách sinh viên của Tutor
export const getTutorStudents = (req: Request, res: Response) => {
  const tutorId = req.query.tutorId as string;
  
  // 1. Tìm tất cả các lớp mà Tutor này dạy
  const myClasses: { classId: string, courseId: string, courseName: string }[] = [];
  
  COURSES.forEach(c => {
    c.classes.forEach(cls => {
      if (cls.tutorId === tutorId) {
        myClasses.push({ classId: cls.classId, courseId: c.courseId, courseName: c.courseName });
      }
    });
  });

  // 2. Tìm các bản ghi điểm (Enrollments) thuộc các lớp này
  const studentRecords: any[] = [];

  GRADES.forEach(grade => {
    // Check xem record này có thuộc lớp tutor dạy không
    const matchingClass = myClasses.find(c => c.classId === grade.classId);
    
    if (matchingClass) {
      // Tìm thông tin sinh viên
      const student = USERS.find(u => u.id === grade.studentId);
      if (student) {
        // Lấy điểm thành phần
        const midterm = grade.components.find(c => c.name === 'Midterm')?.score || 0;
        const final = grade.components.find(c => c.name === 'Final Exam')?.score || 0;
        const assignment = grade.components.find(c => c.name === 'Assignment')?.score || 0; // Giả sử lấy điểm Asm đầu tiên hoặc TB

        studentRecords.push({
          studentId: student.id,
          fullName: student.fullName,
          avatarUrl: student.avatarUrl,
          courseName: matchingClass.courseName,
          classId: grade.classId,
          courseId: grade.courseId,
          status: grade.status,
          attendance: "95%", // Mock data hoặc tính từ sessions
          assignment: assignment,
          midterm: midterm,
          final: final,
          average: calculateAverage(grade.components)
        });
      }
    }
  });

  res.status(200).json({ success: true, data: studentRecords, classes: myClasses });
};

// API: Cập nhật điểm
export const updateStudentGrade = (req: Request, res: Response) => {
  const { studentId, classId, assignment, midterm, final } = req.body;

  const gradeRecord = GRADES.find(g => g.studentId === studentId && g.classId === classId);

  if (!gradeRecord) {
    res.status(404).json({ success: false, message: "Record not found" });
    return;
  }

  // Check nếu Completed thì không cho sửa (Backend validation)
  if (gradeRecord.status === CourseStatus.COMPLETED) {
    res.status(400).json({ success: false, message: "Cannot edit grades for completed courses." });
    return;
  }

  // Update Components
  // Lưu ý: Logic này giả định trong components đã có sẵn mục Midterm/Final. 
  // Nếu chưa có thì phải push mới. Ở đây mình viết logic update or push.
  
  const updateComponent = (name: string, score: number, weight: number) => {
    const comp = gradeRecord.components.find(c => c.name === name);
    if (comp) {
      comp.score = Number(score);
    } else {
      gradeRecord.components.push({ name, score: Number(score), weight });
    }
  };

  updateComponent('Assignment', assignment, 20);
  updateComponent('Midterm', midterm, 30);
  updateComponent('Final Exam', final, 50);

  res.status(200).json({ success: true, message: "Grades updated successfully!" });
};


// API lấy danh sách Materials
export const getTutorMaterials = (req: Request, res: Response) => {
  const { q, major } = req.query; 
  let result = MATERIALS;

  if (q) {
    const lowerQ = (q as string).toLowerCase();
    result = result.filter(m => m.title.toLowerCase().includes(lowerQ));
  }
  if (major && major !== "All Majors") {
    result = result.filter(m => m.majors.includes(major as any));
  }
  
  // Sắp xếp mới nhất lên đầu
  res.status(200).json({ success: true, data: result.reverse() });
};


export const getTutorMaterialDetail = (req: Request, res: Response) => {
  const { id } = req.query;
  const material = MATERIALS.find(m => m.id === id);
  
  if (!material) {
    res.status(404).json({ success: false, message: "Material not found" });
    return;
  }
  res.status(200).json({ success: true, data: material });
}

// API Upload Material (Mới)
export const uploadMaterial = (req: Request, res: Response) => {
  const file = req.file; // File do Multer xử lý
  const { title, author, description, major, sharedBy } = req.body;

  if (!file) {
    res.status(400).json({ success: false, message: "No file uploaded." });
    return;
  }

  let majorsArray: Major[] = [Major.ALL];
  try {
    if (major) {
      majorsArray = JSON.parse(major) as Major[];
    }
  } catch (e) {
    console.log("Error parsing majors");
  }

  // Tạo URL truy cập file thật
  // Lưu ý: Port 5000 là port của server bạn đang chạy
  const downloadUrl = `http://localhost:5000/uploads/${file.filename}`;

  const newMaterial: Material = {
    id: "MAT-" + Date.now(),
    title: title || file.originalname,
    author: author || "Unknown",
    sharedBy: sharedBy || "Tutor",
    description: description || "",
    majors: majorsArray, // Major chọn từ dropdown
    coverImage: "https://via.placeholder.com/150", // Ảnh bìa mặc định hoặc logic upload ảnh riêng
    downloadUrl: downloadUrl, // <--- LINK FILE THẬT
    previewPages: 0
  };

  MATERIALS.unshift(newMaterial);

  res.status(200).json({ success: true, message: "Material uploaded successfully!", data: newMaterial });
};

// Lấy lớp mà tutor đang dạy
export const getTutorClasses = (req: Request, res: Response) => {
  const tutorId = req.query.tutorId as string;
  const myClasses: any[] = [];

  COURSES.forEach(course => {
    course.classes.forEach(cls => {
      if (cls.tutorId === tutorId) {
        // Logic xác định status đơn giản (hoặc lấy từ DB nếu có)
        // Giả sử nếu có session trong tương lai -> Studying, không thì Completed
        const hasFutureSession = cls.sessions.some(s => new Date(s.date) >= new Date());
        const status = hasFutureSession ? "Studying" : "Completed";

        myClasses.push({
          courseId: course.courseId,
          courseName: course.courseName,
          classId: cls.classId,
          tutorName: cls.tutorName, // Chính là mình
          status: status, 
          // Thêm thống kê nhỏ
          studentCount: cls.enrolledStudentIds.length
        });
      }
    });
  });

  res.status(200).json({ success: true, data: myClasses });
};

// API: Tạo Section mới (Ví dụ: Week 1, Week 2...)
export const addCourseSection = (req: Request, res: Response) => {
  const { courseId, title } = req.body;

  if (!COURSE_CONTENTS[courseId]) {
    COURSE_CONTENTS[courseId] = []; // Init nếu chưa có
  }

  const newSection: CourseSection = {
    id: "SEC-" + Date.now(),
    title: title,
    items: []
  };

  COURSE_CONTENTS[courseId].push(newSection);
  res.status(200).json({ success: true, message: "Section created!", data: newSection });
};

// API: Upload Item vào Section (File/Lesson)
export const addCourseItem = (req: Request, res: Response) => {
  const file = req.file;
  const { courseId, sectionId, title } = req.body;

  if (!file) {
    res.status(400).json({ success: false, message: "No file uploaded." });
    return;
  }

  const sections = COURSE_CONTENTS[courseId];
  const targetSection = sections?.find(s => s.id === sectionId);

  if (!targetSection) {
    res.status(404).json({ success: false, message: "Section not found." });
    return;
  }

  const newItem: CourseItem = {
    id: "ITEM-" + Date.now(),
    type: ContentType.FILE, // Mặc định là file
    title: title || file.originalname,
    fileUrl: `http://localhost:5000/uploads/${file.filename}`
  };

  targetSection.items.push(newItem);

  res.status(200).json({ success: true, message: "Material uploaded to section!", data: newItem });
};

// API: Xóa Item trong Section
export const deleteCourseItem = (req: Request, res: Response) => {
  const { courseId, sectionId, itemId } = req.body;

  const sections = COURSE_CONTENTS[courseId];
  const targetSection = sections?.find(s => s.id === sectionId);

  if (targetSection) {
    const idx = targetSection.items.findIndex(i => i.id === itemId);
    if (idx > -1) {
      targetSection.items.splice(idx, 1);
      res.status(200).json({ success: true, message: "Item deleted successfully." });
      return;
    }
  }
  res.status(404).json({ success: false, message: "Item not found." });
};

// API: Lấy danh sách bài nộp (Submissions) của 1 Assignment
export const getAssignmentSubmissions = (req: Request, res: Response) => {
  const { itemId, classId } = req.query; // itemId là ID của Assignment

  // Lọc submission theo itemId
  // (Thực tế nên lọc thêm classId nếu 1 assignment dùng chung cho nhiều lớp, 
  // nhưng trong mock data hiện tại ta giả định assignment ID là unique)
  
  const submissions = SUBMISSIONS.filter(s => s.itemId === itemId);

  // Map thêm thông tin sinh viên
  const result = submissions.map(sub => {
    const student = USERS.find(u => u.id === sub.studentId);
    return {
      ...sub,
      studentName: student?.fullName || sub.studentId,
      studentCode: student?.studentIdDisplay || "N/A",
      avatarUrl: student?.avatarUrl
    };
  });

  res.status(200).json({ success: true, data: result });
};
