// server/src/controllers/studentController.ts
import type { Request, Response } from 'express';
import { COURSES, USERS, GRADES, MATERIALS, FEEDBACKS, type Class, CourseStatus, type Feedback } from '../models/mockData';

// 1. Tìm kiếm Môn học
export const searchClasses = (req: Request, res: Response) => {
  const query = req.query.q as string;
  const studentId = req.query.studentId as string;

  if (!query) {
    res.status(400).json({ success: false, message: "Query is required" });
    return;
  }

  const student = USERS.find(u => u.id === studentId);
  const lowerQuery = query.toLowerCase();

  const matchedCourses = COURSES.filter(c => 
    c.courseId.toLowerCase().includes(lowerQuery) || 
    c.courseName.toLowerCase().includes(lowerQuery)
  );

  if (matchedCourses.length === 0) {
    res.status(404).json({ success: false, message: "No courses found" });
    return;
  }

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

// 2. Đăng ký Lớp
export const registerClass = (req: Request, res: Response) => {
  const { studentId, classId } = req.body;
  const student = USERS.find(u => u.id === studentId);
  
  let targetClass = null;
  let parentCourse = null;

  for (const course of COURSES) {
    const foundClass = course.classes.find(c => c.classId === classId);
    if (foundClass) {
      targetClass = foundClass;
      parentCourse = course;
      break;
    }
  }

  if (!student || !targetClass || !parentCourse) {
    res.status(404).json({ success: false, message: "Data not found" });
    return;
  }

  const currentGradeRecord = GRADES.find(g => 
    g.studentId === studentId && 
    g.courseId === parentCourse.courseId &&
    g.status === CourseStatus.STUDYING 
  );

  if (currentGradeRecord) {
    res.status(400).json({ success: false, message: `You are currently studying ${parentCourse.courseName}.` });
    return;
  }

  const siblingClassIds = parentCourse.classes.map(c => c.classId);
  const isEnrolledInSession = student.registeredClassIds.some(id => siblingClassIds.includes(id));
  if (isEnrolledInSession) {
    res.status(400).json({ success: false, message: "You have already registered for a class in this course." });
    return;
  }

  student.registeredClassIds.push(classId);
  targetClass.enrolledStudentIds.push(studentId);

  res.status(200).json({ 
    success: true, 
    message: `Successfully enrolled in ${targetClass.classId}`,
    updatedRegisteredList: student.registeredClassIds
  });
};

// 3. Stats
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

// 4. Lấy lịch học
export const getStudentSchedule = (req: Request, res: Response) => {
  const studentId = req.query.studentId as string;
  const student = USERS.find(u => u.id === studentId);

  if (!student) {
    res.status(404).json({ success: false, message: "Student not found" });
    return;
  }

  let allSessions: any[] = [];

  COURSES.forEach(course => {
    course.classes.forEach(cls => {
      if (student.registeredClassIds.includes(cls.classId)) {
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

// 5. Upcoming Sessions
export const getUpcomingSessions = (req: Request, res: Response) => {
  const studentId = req.query.studentId as string;
  const student = USERS.find(u => u.id === studentId);
  if (!student) { res.status(404).json({ success: false }); return; }

  let allSessions: any[] = [];
  const now = new Date(); 

  COURSES.forEach(course => {
    course.classes.forEach(cls => {
      if (student.registeredClassIds.includes(cls.classId)) {
        cls.sessions.forEach(s => {
          allSessions.push({
            ...s,
            courseName: course.courseName,
            tutorName: cls.tutorName,
            dateTime: new Date(`${s.date}T${s.time.split(' - ')[0]}:00`)
          });
        });
      }
    });
  });

  const futureSessions = allSessions
    .filter(s => s.dateTime > now)
    .sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime());

  if (futureSessions.length === 0) {
    res.status(200).json({ success: true, data: [] });
    return;
  }

  const nextSessionDate = futureSessions[0].date;
  const sessionsToShow = futureSessions.filter(s => s.date === nextSessionDate);

  res.status(200).json({ success: true, data: sessionsToShow });
};

// 6. Performance List
export const getCoursePerformance = (req: Request, res: Response) => {
  const studentId = req.query.studentId as string;
  const query = (req.query.q as string || "").toLowerCase();

  const studentGrades = GRADES.filter(g => g.studentId === studentId);
  
  const result = studentGrades.map(grade => {
    const course = COURSES.find(c => c.courseId === grade.courseId);
    if (!course) return null;

    if (query && !course.courseName.toLowerCase().includes(query) && !course.courseId.toLowerCase().includes(query)) {
      return null;
    }

    const finalScore = calculateGPA(grade.components);
    
    return {
      courseId: course.courseId,
      courseName: course.courseName,
      status: grade.status,
      finalScore: grade.status === CourseStatus.WITHDRAWN ? null : finalScore,
      letterGrade: grade.status === CourseStatus.WITHDRAWN ? null : getLetterGrade(finalScore)
    };
  }).filter(item => item !== null);

  res.status(200).json({ success: true, data: result });
};

// 7. Performance Detail
export const getPerformanceDetail = (req: Request, res: Response) => {
  const { studentId, courseId } = req.query;
  
  const gradeRecord = GRADES.find(g => g.studentId === studentId && g.courseId === courseId);
  const course = COURSES.find(c => c.courseId === courseId);

  if (!gradeRecord || !course) {
    res.status(404).json({ success: false, message: "Not found" });
    return;
  }

  const finalScore = calculateGPA(gradeRecord.components);

  res.status(200).json({
    success: true,
    data: {
      courseId: course.courseId,
      courseName: course.courseName,
      status: gradeRecord.status,
      components: gradeRecord.components,
      finalScore: finalScore,
      letterGrade: getLetterGrade(finalScore)
    }
  });
};

// 8. Materials List
export const getMaterials = (req: Request, res: Response) => {
  const { q, major } = req.query;
  let result = MATERIALS;

  if (q) {
    const lowerQ = (q as string).toLowerCase();
    result = result.filter(m => m.title.toLowerCase().includes(lowerQ));
  }

  if (major && major !== "All Majors") {
    result = result.filter(m => m.majors.includes(major as any));
  }

  res.status(200).json({ success: true, data: result });
};

// 9. Material Detail
export const getMaterialDetail = (req: Request, res: Response) => {
  const { id } = req.query;
  const material = MATERIALS.find(m => m.id === id);
  if (!material) {
    res.status(404).json({ success: false, message: "Material not found" });
    return;
  }
  res.status(200).json({ success: true, data: material });
}

// --------------------------------------------------------
// CÁC HÀM MỚI CHO FEEDBACK (ĐÃ SỬA LỖI TYPESCRIPT)
// --------------------------------------------------------

// 10. Lấy danh sách Feedback Candidates (Bao gồm dữ liệu cũ nếu có)
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