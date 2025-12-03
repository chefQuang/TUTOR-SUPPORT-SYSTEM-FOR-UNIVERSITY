// server/src/controllers/tutorController.ts
import type { Request, Response } from 'express';
import { COURSES, USERS, type Session } from '../models/mockData';

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

  // Quét tất cả Course -> Class -> Session
  COURSES.forEach(course => {
    course.classes.forEach(cls => {
      if (cls.tutorId === tutorId) {
        cls.sessions.forEach(s => {
          allSessions.push({
            ...s,
            courseName: course.courseName,
            classId: cls.classId,
            type: 'Teaching', // Đánh dấu là lịch dạy
            // Format lại date để FE dễ dùng nếu cần
          });
        });
      }
    });
  });

  res.status(200).json({ success: true, data: allSessions });
};

// 2. Cập nhật buổi dạy (Change Time)
export const updateSession = (req: Request, res: Response) => {
  const { tutorId, sessionId, newDate, newTime } = req.body; 
  // newDate: "2025-12-05", newTime: "08:00 - 11:00"

  // Tìm Session cần sửa
  let targetSession: Session | null = null;
  let targetClass: any = null;

  // Tìm session trong DB
  for (const course of COURSES) {
    for (const cls of course.classes) {
      if (cls.tutorId === tutorId) {
        const found = cls.sessions.find(s => s.id === sessionId);
        if (found) {
          targetSession = found;
          targetClass = cls;
          break;
        }
      }
    }
    if (targetSession) break;
  }

  if (!targetSession || !targetClass) {
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
  targetSession.date = newDate;
  targetSession.time = newTime;

  res.status(200).json({ success: true, message: "Session updated successfully!" });
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

  if (found) {
    res.status(200).json({ success: true, message: "Session cancelled" });
  } else {
    res.status(404).json({ success: false, message: "Session not found" });
  }
};