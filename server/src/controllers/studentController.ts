// server/src/controllers/studentController.ts
import type { Request, Response } from 'express';
//import { COURSES, USERS, GRADES, type Class, type Session, CourseStatus } from '../models/mockData';
import { COURSES, USERS, GRADES, MATERIALS, FEEDBACKS, CONSULTATIONS, SCHEDULES, NOTIFICATIONS, type Class, CourseStatus, Feedback, Consultation, Role, Notification } from '../models/mockData';

const markSlotAsTaken = (userId: string, dateStr: string, time: string) => {
  // 1. Tìm xem user này đã có record cho ngày này chưa
  let schedule = SCHEDULES.find(s => s.userId === userId && s.date === dateStr);

  if (schedule) {
    // 2. Nếu có rồi -> Push thêm giờ vào (nếu chưa có)
    if (!schedule.bookedSlots.includes(time)) {
      schedule.bookedSlots.push(time);
    }
  } else {
    // 3. Nếu chưa -> Tạo mới record
    SCHEDULES.push({
      userId: userId,
      date: dateStr,
      bookedSlots: [time]
    });
  }
};

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

// Hàm lấy danh sách giờ bận (Kết hợp cả Mock Data cứng và Dynamic Schedule)
const getBusySlots = (tutorName: string, dateStr: string, studentId: string): Set<string> => {
  const busySlots = new Set<string>();

  // --- A. LẤY TỪ SCHEDULES (DYNAMIC - Mới thêm vào) ---
  
  // 1. Check lịch Tutor (Tìm ID của Tutor qua Name)
  const tutorUser = USERS.find(u => u.fullName === tutorName); // Giả sử tên khớp fullName
  if (tutorUser) {
    const tutorSched = SCHEDULES.find(s => s.userId === tutorUser.id && s.date === dateStr);
    if (tutorSched) tutorSched.bookedSlots.forEach(slot => busySlots.add(slot));
  }

  // 2. Check lịch Student
  const studentSched = SCHEDULES.find(s => s.userId === studentId && s.date === dateStr);
  if (studentSched) studentSched.bookedSlots.forEach(slot => busySlots.add(slot));


  // --- B. QUÉT DỮ LIỆU CŨ (MOCK DATA CỐ ĐỊNH) ---
  // (Vẫn cần giữ đoạn này vì COURSES của bạn đang hardcode lịch học cố định)

  // 1. Check Lịch dạy cố định của Tutor trong các lớp
  COURSES.forEach(course => {
    course.classes.forEach(cls => {
      if (cls.tutorName === tutorName) {
        cls.sessions.forEach(s => {
          if (s.date === dateStr) {
            const startHour = s.time.split(' - ')[0]?.trim(); 
            if (startHour) busySlots.add(startHour);
          }
        });
      }
    });
  });

  // 2. Check Lịch học của Sinh viên
  const student = USERS.find(u => u.id === studentId);
  if (student) {
    COURSES.forEach(course => {
        course.classes.forEach(cls => {
            if (student.registeredClassIds.includes(cls.classId)) {
                cls.sessions.forEach(s => {
                    if (s.date === dateStr) {
                        const startHour = s.time.split(' - ')[0]?.trim();
                        if (startHour) busySlots.add(startHour);
                    }
                });
            }
        });
    });
  }

  return busySlots;
};


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

// 1. Tìm kiếm Môn học (Trả về môn học + danh sách lớp của nó)
export const searchClasses = (req: Request, res: Response) => {
  const query = req.query.q as string;
  const studentId = req.query.studentId as string;

  if (!query) {
    res.status(400).json({ success: false, message: "Query is required" });
    return;
  }

  const student = USERS.find(u => u.id === studentId);
  const lowerQuery = query.toLowerCase();

  // Tìm các Course khớp tên hoặc mã
  const matchedCourses = COURSES.filter(c => 
    c.courseId.toLowerCase().includes(lowerQuery) || 
    c.courseName.toLowerCase().includes(lowerQuery)
  );

  if (matchedCourses.length === 0) {
    res.status(404).json({ success: false, message: "No courses found" });
    return;
  }

  // Clone dữ liệu để thêm cờ "isRegistered" cho từng lớp để FE dễ hiển thị
  // Logic: Duyệt qua từng môn, từng lớp, xem ID lớp có trong registeredClassIds của SV không
  const result = matchedCourses.map(course => ({
    ...course,
    classes: course.classes.map(cls => ({
      ...cls,
      isRegistered: student?.registeredClassIds.includes(cls.classId) || false
    }))
  }));

  res.status(200).json({ success: true, data: result });
};

const calculateGPA = (components: {weight: number, score: number}[]) => {
  let totalScore = 0;
  let totalWeight = 0;
  components.forEach(c => {
    totalScore += c.score * (c.weight / 100);
    totalWeight += c.weight;
  });
  // Nếu chưa đủ đầu điểm (đang học), điểm tạm tính trên số đầu điểm đã có hoặc trả về 0 tùy logic
  // Ở đây ta cứ tính tổng theo weight đã có
  return parseFloat(totalScore.toFixed(2));
};

const getLetterGrade = (score: number) => {
  if (score >= 9.5) return "A+";
  if (score >= 8.5) return "A";
  if (score >= 8.0) return "B+";
  if (score >= 7.0) return "B";
  if (score >= 6.5) return "C+";
  if (score >= 5.5) return "C";
  if (score >= 5.0) return "D+";
  if (score >= 4.0) return "D";
  return "F";
};

// 2. Đăng ký Lớp (Logic phức tạp hơn vì phải tìm Class nằm sâu trong Course)
export const registerClass = (req: Request, res: Response) => {
  const { studentId, classId } = req.body;
  const student = USERS.find(u => u.id === studentId);
  
  // 1. Tìm thông tin lớp đích
  let targetClass = null;
  let parentCourse = null;
  for (const course of COURSES) {
    const found = course.classes.find(c => c.classId === classId);
    if (found) { targetClass = found; parentCourse = course; break; }
  }

  if (!student || !targetClass || !parentCourse) {
    res.status(404).json({ success: false, message: "Data not found" });
    return;
  }

  // 2. CHECK: Trùng Mã Lớp & Đã học lớp này chưa?
  if (student.registeredClassIds.includes(classId)) {
    res.status(400).json({ success: false, message: `You are already in class ${classId}.` });
    return;
  }

  const existsInGrades = GRADES.some(g => g.studentId === studentId && g.classId === classId);
  if (existsInGrades) {
    res.status(400).json({ success: false, message: `You have already taken class ${classId} in the past.` });
    return;
  }

  // --- LOGIC MỚI: KIỂM TRA TRÙNG LỊCH (TIME CONFLICT) ---
  
  // Lấy danh sách tất cả các lớp ĐANG HỌC (Status = STUDYING)
  // Bao gồm cả những lớp vừa đăng ký trong registeredClassIds (mà chưa vào GRADES)
  // Và những lớp trong GRADES đang có status STUDYING.
  
  // Tuy nhiên, logic hiện tại của chúng ta: khi đăng ký là push vào GRADES luôn.
  // Nên ta chỉ cần quét GRADES của user này với status STUDYING.
  
  const currentStudyingClasses = GRADES
    .filter(g => g.studentId === studentId && g.status === CourseStatus.STUDYING)
    .map(g => {
        // Tìm lại thông tin Class để lấy Schedule
        for (const c of COURSES) {
            const cls = c.classes.find(cl => cl.classId === g.classId);
            if (cls) return cls;
        }
        return null;
    })
    .filter(cls => cls !== null); // Lọc bỏ null

  // Duyệt qua từng lớp đang học để so sánh giờ
  for (const currentClass of currentStudyingClasses) {
      if (currentClass && isTimeOverlap(currentClass.scheduleOverview, targetClass.scheduleOverview)) {
          res.status(400).json({ 
              success: false, 
              message: `Time conflict! New class overlaps with ${currentClass.classId} (${currentClass.scheduleOverview}).` 
          });
          return;
      }
  }
  // -----------------------------------------------------

  // 3. SUCCESS
  student.registeredClassIds.push(classId);
  
  GRADES.push({
    studentId: studentId,
    courseId: parentCourse.courseId,
    classId: classId,
    status: CourseStatus.STUDYING,
    components: []
  });

  res.status(200).json({ 
    success: true, 
    message: `Successfully enrolled in ${targetClass.classId}`,
    updatedRegisteredList: student.registeredClassIds
  });
};

// 3. Stats (Giữ nguyên hoặc update nhẹ)
export const getStudentStats = (req: Request, res: Response) => {
  const studentId = req.query.studentId as string;
  const student = USERS.find(u => u.id === studentId);
  if (!student) { res.status(404).json({ success: false }); return; }

  res.status(200).json({
    success: true,
    data: {
      registeredCount: student.registeredClassIds.length,
      tutorsCount: 3,
      sessionsCount: 0,
      averageScore: "85%"
    }
  });
}

// 4. Lấy lịch học (Schedule)
export const getStudentSchedule = (req: Request, res: Response) => {
  const studentId = req.query.studentId as string;
  const student = USERS.find(u => u.id === studentId);

  if (!student) { res.status(404).json({ success: false }); return; }

  let allSessions: any[] = [];

  // 1. LẤY LỊCH HỌC (Class Sessions) - Dựa vào registeredClassIds hoặc enrollments
  // (Logic cũ của bạn đang dùng enrolledStudentIds hoặc registeredClassIds, giữ nguyên phần này)
  COURSES.forEach(course => {
    course.classes.forEach(cls => {
      // Check xem SV có trong lớp này không (Cách check tùy thuộc vào data model hiện tại của bạn)
      // Giả sử dùng enrolledStudentIds trong Class hoặc registeredClassIds trong User
      const isEnrolled = cls.enrolledStudentIds.includes(studentId) || student.registeredClassIds.includes(cls.classId);
      
      if (isEnrolled) {
        cls.sessions.forEach(s => {
          const isDone = calculateStatus(s.date, s.time, s.isCompleted);
          allSessions.push({
            id: s.id,
            date: s.date,
            time: s.time,
            courseName: course.courseName,
            tutorName: cls.tutorName,
            classId: cls.classId,
            room: s.room,
            type: 'Learning',
            isCompleted: isDone
          });
        });
      }
    });
  });

  // 2. LẤY LỊCH TƯ VẤN (Confirmed Consultations)
  const myConsultations = CONSULTATIONS.filter(c => c.studentId === studentId && c.status === 'Confirmed');

  myConsultations.forEach(c => {
    allSessions.push({
      id: c.id,
      date: c.date,
      time: c.time,
      courseName: `Consultation: ${c.courseName}`,
      tutorName: c.tutorName,
      classId: "1-on-1",
      room: c.room || "Online",
      type: 'Consultation',
      isCompleted: new Date(c.date) < new Date()
    });
  });

  res.status(200).json({ success: true, data: allSessions });
};

// 4. API Lấy Upcoming Sessions (Logic thông minh)
export const getUpcomingSessions = (req: Request, res: Response) => {
  const studentId = req.query.studentId as string;
  const student = USERS.find(u => u.id === studentId);
  if (!student) { res.status(404).json({ success: false }); return; }

  // 1. Gom tất cả buổi học của SV
  let allSessions: any[] = [];
  const now = new Date(); // Thời gian thực tế trên server
  
  // Fake ngày giờ hiện tại để dễ test (Giả sử hôm nay là ngày có tiết học trong Mock Data)
  // Bạn có thể xóa dòng này để lấy ngày thật
  // const now = new Date("2025-11-03T06:00:00"); 

  COURSES.forEach(course => {
    course.classes.forEach(cls => {
      if (student.registeredClassIds.includes(cls.classId)) {
        cls.sessions.forEach(s => {
          allSessions.push({
            ...s,
            courseName: course.courseName,
            tutorName: cls.tutorName,
            // Chuyển string date + time thành Date object để so sánh
            dateTime: new Date(`${s.date}T${s.time.split(' - ')[0]}:00`)
          });
        });
      }
    });
  });

  // 2. Lọc các buổi chưa diễn ra (tính từ thời điểm hiện tại)
  const futureSessions = allSessions
    .filter(s => s.dateTime > now)
    .sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime());

  if (futureSessions.length === 0) {
    res.status(200).json({ success: true, data: [] });
    return;
  }

  // 3. Logic: Lấy các buổi của "Ngày gần nhất có lịch"
  const nextSessionDate = futureSessions[0].date; // Ngày của buổi sớm nhất
  const sessionsToShow = futureSessions.filter(s => s.date === nextSessionDate);

  res.status(200).json({ success: true, data: sessionsToShow });
};

// API Lấy danh sách điểm (Performance List)
export const getCoursePerformance = (req: Request, res: Response) => {
  const studentId = req.query.studentId as string;
  const query = (req.query.q as string || "").toLowerCase();
  
  // Lấy TOÀN BỘ từ GRADES (Vì Grades giờ chứa cả Active lẫn History)
  const allRecords = GRADES.filter(g => g.studentId === studentId);

  const result = allRecords.map(grade => {
    const course = COURSES.find(c => c.courseId === grade.courseId);
    if (!course) return null;

    // Filter search
    if (query && !course.courseName.toLowerCase().includes(query) && !course.courseId.toLowerCase().includes(query)) {
      return null;
    }

    const finalScore = calculateGPA(grade.components);
    
    return {
      courseId: grade.courseId,
      courseName: course.courseName,
      classId: grade.classId, // Trả về classId để frontend dùng làm Key
      status: grade.status,
      finalScore: grade.status === CourseStatus.WITHDRAWN || grade.status === CourseStatus.STUDYING ? null : finalScore,
      letterGrade: grade.status === CourseStatus.WITHDRAWN || grade.status === CourseStatus.STUDYING ? null : getLetterGrade(finalScore)
    };
  }).filter(item => item !== null);

  res.status(200).json({ success: true, data: result });
};

// API Lấy chi tiết điểm 1 môn (Performance Detail)
// Cập nhật API Detail để dùng classId tìm kiếm cho chuẩn
export const getPerformanceDetail = (req: Request, res: Response) => {
  const { studentId, classId, courseId } = req.query; // Dùng classId làm khóa chính
  console.log(classId);
  
  const gradeRecord = GRADES.find(g => g.studentId === studentId && g.classId === classId && g.courseId === courseId);

  console.log("studentId:", studentId, "classId:", classId);

  if (!gradeRecord) {
    res.status(404).json({ success: false, message: "Record not found" });
    return;
  }
  console.log("Found a record, hehe");

  const course = COURSES.find(c => c.courseId === gradeRecord.courseId);
  const finalScore = calculateGPA(gradeRecord.components);

  res.status(200).json({
    success: true,
    data: {
      courseId: course?.courseId,
      courseName: course?.courseName,
      classId: gradeRecord.classId,
      status: gradeRecord.status,
      components: gradeRecord.components,
      finalScore: finalScore,
      letterGrade: getLetterGrade(finalScore)
    }
  });
};

// API MỚI: Lấy danh sách Materials
export const getMaterials = (req: Request, res: Response) => {
  const { q, major } = req.query; // Search query và Major filter
  
  let result = MATERIALS;

  // Filter theo tên
  if (q) {
    const lowerQ = (q as string).toLowerCase();
    result = result.filter(m => m.title.toLowerCase().includes(lowerQ));
  }

  // Filter theo ngành
  if (major && major !== "All Majors") {
    result = result.filter(m => m.majors.includes(major as any));
  }

  res.status(200).json({ success: true, data: result });
};

// API MỚI: Lấy chi tiết Material
export const getMaterialDetail = (req: Request, res: Response) => {
  const { id } = req.query;
  const material = MATERIALS.find(m => m.id === id);
  
  if (!material) {
    res.status(404).json({ success: false, message: "Material not found" });
    return;
  }
  res.status(200).json({ success: true, data: material });
}

export const getFeedbackCandidates = (req: Request, res: Response) => {
  const studentId = req.query.studentId as string;

  // Chỉ lấy các môn COMPLETED
  const completedRecords = GRADES.filter(g => 
    g.studentId === studentId && g.status === CourseStatus.COMPLETED
  );

  const result = completedRecords.map(record => {
    const course = COURSES.find(c => c.courseId === record.courseId);
    const existingFeedback = FEEDBACKS.find(f => f.studentId === studentId && f.courseId === record.courseId);

    return {
      courseId: record.courseId,
      courseName: course?.courseName || record.courseId,
      credits: course?.credits || 3,
      tutorName: "Dr. John Smith", 
      feedbackData: existingFeedback || null 
    };
  });

  res.status(200).json({ success: true, data: result });
};

// 11. Submit/Update Feedback (Đã sửa lỗi TS2532)
export const submitFeedback = (req: Request, res: Response) => {
  const { studentId, courseId, ratings, comment, courseName } = req.body;

  // Validate Course
  const gradeRecord = GRADES.find(g => g.studentId === studentId && g.courseId === courseId);
  if (!gradeRecord || gradeRecord.status !== CourseStatus.COMPLETED) {
    res.status(400).json({ success: false, message: "Invalid course status." });
    return;
  }

  // Tìm index và object cũ an toàn
  const existingIndex = FEEDBACKS.findIndex(f => f.studentId === studentId && f.courseId === courseId);
  const existingFeedback = FEEDBACKS[existingIndex]; // Có thể là undefined nếu index = -1

  const feedbackData: Feedback = {
    // SỬA LỖI Ở ĐÂY: Dùng optional chaining (?.id) để tránh lỗi Object possibly undefined
    id: existingFeedback?.id || "FB-" + Date.now(),
    studentId,
    courseId,
    courseName,
    overallRating: ratings.overall,
    teachingQuality: ratings.teaching,
    materialQuality: ratings.material,
    difficultyLevel: ratings.difficulty,
    comment,
    createdAt: new Date().toISOString()
  };

  if (existingIndex > -1) {
    FEEDBACKS[existingIndex] = feedbackData;
    res.status(200).json({ success: true, message: "Feedback updated successfully!" });
  } else {
    FEEDBACKS.push(feedbackData);
    res.status(200).json({ success: true, message: "Feedback submitted successfully!" });
  }
};

// 12. Delete Feedback
export const deleteFeedback = (req: Request, res: Response) => {
  const { studentId, courseId } = req.body;

  const index = FEEDBACKS.findIndex(f => f.studentId === studentId && f.courseId === courseId);
  if (index > -1) {
    FEEDBACKS.splice(index, 1);
    res.status(200).json({ success: true, message: "Feedback withdrawn successfully." });
  } else {
    res.status(404).json({ success: false, message: "Feedback not found." });
  }
};

// 13. Get Feedback History
export const getStudentFeedbackHistory = (req: Request, res: Response) => {
  const studentId = req.query.studentId as string;
  const history = FEEDBACKS.filter(f => f.studentId === studentId);
  res.status(200).json({ success: true, data: history });
};
export const getStudentProfile = (req: Request, res: Response) => {
  const studentId = req.query.studentId as string;
  const user = USERS.find(u => u.id === studentId);

  if (!user) {
    res.status(404).json({ success: false, message: "User not found" });
    return;
  }

  // Return only profile-relevant info (exclude password)
  const profileData = {
    fullName: user.fullName,
    email: user.email,
    studentIdDisplay: user.studentIdDisplay || "N/A",
    major: user.major || "",
    phoneNumber: user.phoneNumber || "",
    currentYear: user.currentYear || "",
    bio: user.bio || "",
    avatarUrl: user.avatarUrl || ""
  };

  res.status(200).json({ success: true, data: profileData });
};

// NEW: Update Student Profile
export const updateStudentProfile = (req: Request, res: Response) => {
  const { studentId, fullName, phoneNumber, major, currentYear, bio } = req.body;

  // Thay vì findIndex, ta dùng find để lấy trực tiếp object
  const user = USERS.find(u => u.id === studentId);
  
  // Kiểm tra nếu user không tồn tại
  if (!user) {
    res.status(404).json({ success: false, message: "User not found" });
    return;
  }

  // Update trực tiếp trên object (dữ liệu trong mảng USERS sẽ tự động cập nhật theo)
  user.fullName = fullName;
  user.phoneNumber = phoneNumber;
  user.major = major;
  user.currentYear = currentYear;
  user.bio = bio;

  res.status(200).json({ success: true, message: "Profile updated successfully!" });
};
export const uploadAvatar = (req: Request, res: Response) => {
  const studentId = req.body.studentId;
  const file = req.file;

  if (!file) {
    res.status(400).json({ success: false, message: "No file uploaded" });
    return;
  }

  // Tạo URL để truy cập ảnh
  // Ví dụ: http://localhost:5000/uploads/avatar-123.jpg
  const avatarUrl = `http://localhost:5000/uploads/${file.filename}`;

  // Cập nhật vào Database (Mock Data)
  const user = USERS.find(u => u.id === studentId);
  if (user) {
    user.avatarUrl = avatarUrl;
    res.status(200).json({ success: true, avatarUrl: avatarUrl, message: "Avatar updated!" });
  } else {
    res.status(404).json({ success: false, message: "User not found" });
  }
};
export const checkTutorAvailability = (req: Request, res: Response) => {
  const { tutorName, date, studentId } = req.query;
  if (!tutorName || !date || !studentId) { res.status(400).json({success:false}); return; }
  const busySlots = getBusySlots(tutorName as string, date as string, studentId as string);
  res.status(200).json({ success: true, data: Array.from(busySlots) });
};

// 15. Đặt lịch hẹn (Đã thêm VALIDATION CHECK)
export const bookConsultation = (req: Request, res: Response) => {
  const { studentId, tutorName, courseName, date, time, reason } = req.body;

  const student = USERS.find(u => u.id === studentId);
  if (!student) { res.status(404).json({success: false, message: "Student not found"}); return; }

  // 1. Tìm thông tin Tutor (để lấy tutorId)
  // Lưu ý: Trong thực tế FE nên gửi tutorId lên luôn. Ở đây tìm tạm qua tên.
  const tutorUser = USERS.find(u => u.fullName === tutorName && u.role === Role.TUTOR);
  if (!tutorUser) {
      res.status(404).json({ success: false, message: "Tutor not found" });
      return;
  }

  // 2. CHECK TRÙNG LỊCH (Cả Student và Tutor)
  // Check lịch Student
  const studentBusySlots = getBusySlots("ANY", date, studentId); // Hàm getBusySlots cần sửa để hỗ trợ check chung
  // (Hoặc dùng logic check đơn giản hơn tại đây)
  const isStudentBusy = checkScheduleConflict(studentId, date, time); // Hàm giả định, xem bên dưới
  if (isStudentBusy) {
      res.status(400).json({ success: false, message: "You have a schedule conflict at this time." });
      return;
  }

  // Check lịch Tutor
  const isTutorBusy = checkScheduleConflict(tutorUser.id, date, time);
  if (isTutorBusy) {
      res.status(400).json({ success: false, message: "Tutor is busy at this time." });
      return;
  }

  // 3. TẠO REQUEST (PENDING)
  // KHÔNG markSlotAsTaken ở đây. Chỉ mark khi Tutor approve.
  
  const newConsultation: Consultation = {
    id: "CS-" + Date.now(),
    studentId,
    tutorName,
    tutorId: tutorUser.id,
    courseName, // Môn học cần tư vấn
    date,
    time,
    status: "Pending",
    reason: reason || ""
  };

  CONSULTATIONS.push(newConsultation);

  res.status(200).json({ success: true, message: "Consultation request sent! Waiting for tutor approval." });
};

const checkScheduleConflict = (userId: string, date: string, time: string): boolean => {
    // 1. Check trong SCHEDULES (Lịch học/dạy chính thức)
    const schedule = SCHEDULES.find(s => s.userId === userId && s.date === date);
    if (schedule && schedule.bookedSlots.includes(time)) return true;

    // 2. Check trong CONSULTATIONS (Các lịch hẹn ĐÃ CONFIRM)
    // Nếu user là student hoặc tutor trong cuộc hẹn đó
    const hasConsultation = CONSULTATIONS.some(c => 
        (c.studentId === userId || c.tutorId === userId) && // User tham gia (là Student hoặc Tutor)
        c.status === 'Confirmed' &&
        c.date === date &&
        c.time === time
    );
    if (hasConsultation) return true;

    return false;
}

export const getStudentNotifications = (req: Request, res: Response) => {
  const studentId = req.query.studentId as string;
  
  // A. Lấy lịch sử đặt lịch tư vấn (Booking Requests)
  const bookings = CONSULTATIONS.filter(c => c.studentId === studentId);
  
  // B. Lấy thông báo hệ thống (System Updates - do Tutor đổi lịch)
  const updates = NOTIFICATIONS.filter(n => n.studentId === studentId);

  // C. Gộp lại thành danh sách chung
  // Cần map bookings sang cấu trúc chung để tránh lỗi hiển thị nếu field khác nhau
  const formattedBookings = bookings.map(b => ({
    id: b.id,
    tutorName: b.tutorName,
    courseName: b.courseName,
    date: b.date,
    time: b.time,
    status: b.status, // 'Pending' | 'Confirmed' | 'Rejected'
    reason: b.reason || "", // Lý do đặt lịch
    isRead: true // Mặc định
  }));

  const formattedUpdates = updates.map(u => ({
    id: u.id,
    tutorName: u.tutorName,
    courseName: u.courseName,
    date: u.date,
    time: u.time,
    status: u.status, // 'Update'
    reason: u.reason, // Nội dung thông báo đổi lịch
    isRead: u.isRead
  }));

  const combined = [...formattedBookings, ...formattedUpdates];
  
  // Sắp xếp mới nhất lên đầu (Dựa vào ID timestamp hoặc date)
  // Ở đây dùng date của sự kiện để sort
  combined.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  res.status(200).json({ success: true, data: combined });
};