// server/src/controllers/studentController.ts
import type { Request, Response } from 'express';
//import { COURSES, USERS, GRADES, type Class, type Session, CourseStatus } from '../models/mockData';
import { COURSES, USERS, GRADES, MATERIALS, type Class, CourseStatus } from '../models/mockData';

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

  if (!student) {
    res.status(404).json({ success: false, message: "Student not found" });
    return;
  }

  // Logic: Duyệt qua tất cả môn, tất cả lớp.
  // Nếu lớp đó có trong danh sách đã đăng ký của SV -> Lấy hết session ra
  let allSessions: any[] = [];

  COURSES.forEach(course => {
    course.classes.forEach(cls => {
      if (student.registeredClassIds.includes(cls.classId)) {
        // Map thêm thông tin Môn học và Giảng viên vào từng buổi học để hiển thị
        const sessionsWithInfo = cls.sessions.map(s => ({
          ...s,
          courseName: course.courseName,
          courseCode: course.courseId,
          tutorName: cls.tutorName,
          classId: cls.classId
        }));
        allSessions = [...allSessions, ...sessionsWithInfo];
      }
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
  const { studentId, courseId } = req.query; // Dùng classId làm khóa chính
  
  const gradeRecord = GRADES.find(g => g.studentId === studentId && g.courseId === courseId);
  
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