// server/src/controllers/courseController.ts
import type { Request, Response } from 'express';
import { COURSES, USERS, COURSE_CONTENTS, SUBMISSIONS, GRADES, type Submission, type CourseItem, type QuizQuestion } from '../models/mockData';

// 1. Lấy danh sách khóa học của sinh viên (My Courses)
export const getMyCourses = (req: Request, res: Response) => {
  const studentId = req.query.studentId as string;
  
  // Cũng lấy từ GRADES (Nguồn chân lý duy nhất)
  const allRecords = GRADES.filter(g => g.studentId === studentId);

  const myCourses = allRecords.map(grade => {
    // Tìm thông tin chi tiết
    let courseName = "Unknown";
    let tutorName = "Unknown";
    
    const course = COURSES.find(c => c.courseId === grade.courseId);
    if (course) {
      courseName = course.courseName;
      const cls = course.classes.find(c => c.classId === grade.classId);
      if (cls) tutorName = cls.tutorName;
    }

    return {
      courseId: grade.courseId,
      courseName: courseName,
      classId: grade.classId, // Key duy nhất
      tutorName: tutorName,
      status: grade.status
    };
  });

  res.status(200).json({ success: true, data: myCourses });
};

// 2. Lấy nội dung chi tiết khóa học
export const getCourseContent = (req: Request, res: Response) => {
  const courseId = req.query.courseId as string;
  const content = COURSE_CONTENTS[courseId] || [];
  res.status(200).json({ success: true, data: content });
};

// 3. Lấy thông tin chi tiết bài tập/Quiz
export const getCourseItem = (req: Request, res: Response) => {
  const { courseId, itemId } = req.query;
  const sections = COURSE_CONTENTS[courseId as string] || [];
  
  let foundItem = null;
  for (const sec of sections) {
    const item = sec.items.find(i => i.id === itemId);
    if (item) { foundItem = item; break; }
  }

  if (!foundItem) { res.status(404).json({ success: false }); return; }
  res.status(200).json({ success: true, data: foundItem });
};

// 4. Lấy trạng thái nộp bài
export const getSubmissionStatus = (req: Request, res: Response) => {
  const { studentId, itemId } = req.query;
  const sub = SUBMISSIONS.find(s => s.studentId === studentId && s.itemId === itemId);
  res.status(200).json({ success: true, data: sub || null });
};

// 5. Nộp bài Assignment
export const submitAssignment = (req: Request, res: Response) => {
  const { studentId, itemId, fileName } = req.body;
  
  // Xóa bài cũ nếu nộp lại
  const existingIdx = SUBMISSIONS.findIndex(s => s.studentId === studentId && s.itemId === itemId);
  if (existingIdx > -1) SUBMISSIONS.splice(existingIdx, 1);

  const newSub: Submission = {
    studentId,
    itemId,
    submittedAt: new Date().toISOString(),
    status: "Pending Grading", // Sửa từ "Submitted" thành "Pending Grading" cho đúng yêu cầu
    fileUrl: fileName
  };
  
  SUBMISSIONS.push(newSub);
  res.status(200).json({ success: true, message: "Assignment submitted successfully!", data: newSub });
};

//Xóa bài đã nộp

/*export const removeSubmission = (req: Request, res: Response) => {
  const { studentId, itemId } = req.body;
  
  const index = SUBMISSIONS.findIndex(s => s.studentId === studentId && s.itemId === itemId);
  
  if (index > -1) {
    SUBMISSIONS.splice(index, 1); // Xóa khỏi mảng dữ liệu
    res.status(200).json({ success: true, message: "Submission removed" });
  } else {
    res.status(404).json({ success: false, message: "Submission not found" });
  }
}; */

export const removeSubmission = (req: Request, res: Response) => {
  const { studentId, itemId } = req.body;
  
  // Tìm index của bài nộp
  const index = SUBMISSIONS.findIndex(s => s.studentId === studentId && s.itemId === itemId);
  
  if (index > -1) {
    SUBMISSIONS.splice(index, 1); // Xóa khỏi mảng
    res.status(200).json({ success: true, message: "Submission removed successfully" });
  } else {
    res.status(404).json({ success: false, message: "Submission not found" });
  }
};

// 6. Nộp bài Quiz
export const submitQuiz = (req: Request, res: Response) => {
  const { studentId, itemId, answers } = req.body;

  // 1. Tìm đề bài quiz
  let quizItem: CourseItem | undefined = undefined;

  for (const courseId in COURSE_CONTENTS) {
    // SỬA LỖI Ở ĐÂY: Thêm || [] để đảm bảo sections luôn là mảng, không bao giờ undefined
    const sections = COURSE_CONTENTS[courseId] || []; 
    
    for (const sec of sections) {
      const found = sec.items.find(i => i.id === itemId);
      if (found) {
        quizItem = found;
        break;
      }
    }
    if (quizItem) break;
  }

  // Kiểm tra tính hợp lệ
  if (!quizItem || quizItem.type !== 'quiz' || !quizItem.questions) {
    res.status(404).json({ success: false, message: "Quiz not found" });
    return;
  }

  // 2. Kiểm tra Submission cũ
  let sub = SUBMISSIONS.find(s => s.studentId === studentId && s.itemId === itemId);
  const currentAttempts = sub?.attemptCount || 0;
  const maxAttempts = quizItem.attempts || 1; 

  if (currentAttempts >= maxAttempts) {
    res.status(400).json({ success: false, message: "No attempts remaining." });
    return;
  }

  // 3. Tính điểm
  let correctCount = 0;
  // Ép kiểu tường minh để TS hiểu structure
  const questions = quizItem.questions as QuizQuestion[];

  questions.forEach(q => {
    // So sánh đáp án
    if (answers[q.id] === q.correctOptionIndex) {
      correctCount++;
    }
  });

  const totalQuestions = questions.length;
  const finalScore = totalQuestions > 0 ? parseFloat(((correctCount / totalQuestions) * 10).toFixed(2)) : 0;

  // 4. Lưu kết quả
  const newAttemptCount = currentAttempts + 1;

  if (sub) {
    if (finalScore > (sub.score || 0)) {
      sub.score = finalScore;
    }
    sub.submittedAt = new Date().toISOString();
    sub.attemptCount = newAttemptCount;
  } else {
    SUBMISSIONS.push({
      studentId,
      itemId,
      submittedAt: new Date().toISOString(),
      status: "Graded",
      score: finalScore,
      attemptCount: 1
    });
  }

  res.status(200).json({ 
    success: true, 
    message: "Quiz submitted!", 
    score: finalScore,
    attemptsUsed: newAttemptCount,
    maxAttempts: maxAttempts
  });
};