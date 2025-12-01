// server/src/models/mockData.ts

export enum Role {
  STUDENT = "student",
  TUTOR = "tutor",
  ADMIN = "admin"
}

export interface User {
  id: string;
  username: string;
  password: string;
  fullName: string;
  role: Role;
  email: string;
  registeredClassIds: string[]; // Thêm trường này để lưu môn học sinh viên đã đăng ký
}

// Session: Một buổi học cụ thể (Theo Class Diagram)
export interface Session {
  id: string;
  date: string;      // VD: "2025-10-20"
  time: string;      // VD: "07:00 - 10:00"
  room: string;      // VD: "H6-304"
  isCompleted: boolean;
}

// Course: Môn học (VD: Software Engineering) - Chứa list Classes
export interface Course {
  courseId: string;   // PK: CO3001
  courseName: string; // VD: Software Engineering
  credits: number;
  classes: Class[];   // Quan hệ 1-n: 1 Course có nhiều Class
}

// Class: Lớp học cụ thể (VD: Lớp L01 của thầy A)
export interface Class {
  classId: string;    // PK: CL001
  tutorName: string;
  tutorId: string;
  capacity: number;
  enrolledStudentIds: string[]; // Danh sách SV trong lớp này
  sessions: Session[];          // Danh sách các buổi học
  scheduleOverview: string;     // Chuỗi hiển thị nhanh (VD: "Mon 7-10")
}

export enum CourseStatus {
  STUDYING = "Studying",
  COMPLETED = "Completed",
  WITHDRAWN = "Withdrawn"
}

export interface GradeComponent {
  name: string;   // VD: Midterm, Final, Assignment
  weight: number; // VD: 30 (tức là 30%)
  score: number;  // VD: 8.5
}

export interface StudentCoursePerformance {
  studentId: string;
  courseId: string;
  status: CourseStatus;
  components: GradeComponent[];
  // Điểm tổng kết sẽ được tính toán tự động ở Controller, không cần lưu cứng
}


// Mock Data Users (Cập nhật thêm mảng rỗng cho student)
export const USERS: User[] = [
{
    id: "ST001",
    username: "student1",
    password: "123",
    fullName: "Nguyễn Văn A",
    role: Role.STUDENT,
    email: "studentA@hcmut.edu.vn",
    registeredClassIds: [] 
  },
  {
    id: "TT001",
    username: "tutor1",
    password: "123",
    fullName: "Dr. John Smith",
    role: Role.TUTOR,
    email: "john.smith@hcmut.edu.vn",
    registeredClassIds: []
  }
  /*{
    id: "AD001",
    username: "admin1",
    password: "123",
    fullName: "System Admin",
    role: Role.ADMIN,
    email: "admin@hcmut.edu.vn"
  }*/
];

// Mock Data Courses
export const COURSES: Course[] = [
  {
    courseId: "CO3001",
    courseName: "Software Engineering",
    credits: 3,
    classes: [
      {
        classId: "CL_SE_01",
        tutorName: "Dr. John Smith",
        tutorId: "TT001",
        capacity: 30,
        enrolledStudentIds: [],
        scheduleOverview: "Mon 07:00 - 10:00",
        sessions: [
          { id: "S01", date: "2025-11-03", time: "07:00 - 10:00", room: "H6-301", isCompleted: true },
          { id: "S02", date: "2025-11-10", time: "07:00 - 10:00", room: "H6-301", isCompleted: true },
          
          // Buổi học tương lai (Upcoming)
          { id: "S03", date: "2025-12-05", time: "07:00 - 10:00", room: "H6-301", isCompleted: false },
          { id: "S04", date: "2025-12-12", time: "07:00 - 10:00", room: "H6-301", isCompleted: false },
          { id: "S05", date: "2025-12-19", time: "07:00 - 10:00", room: "H6-301", isCompleted: false }
        ]
      },
      {
        classId: "CL_SE_02",
        tutorName: "Msc. Lan Anh",
        tutorId: "TT002",
        capacity: 30,
        enrolledStudentIds: [],
        scheduleOverview: "Tue 13:00 - 16:00",
        sessions: []
      }
    ]
  },
  {
    courseId: "CO2003",
    courseName: "Data Structures & Algorithms",
    credits: 4,
    classes: [
      {
        classId: "CL_DSA_01",
        tutorName: "Dr. Emily Tran",
        tutorId: "TT003",
        capacity: 40,
        enrolledStudentIds: [],
        scheduleOverview: "Wed 13:00 - 16:00",
        sessions: []
      }
    ]
  }
];

export const GRADES: StudentCoursePerformance[] = [
  {
    studentId: "ST001",
    courseId: "CO3001", // Software Engineering
    status: CourseStatus.COMPLETED,
    components: [
      { name: "Assignment", weight: 20, score: 9.0 },
      { name: "Midterm", weight: 30, score: 8.0 },
      { name: "Final Exam", weight: 50, score: 8.5 }
    ]
  },
  {
    studentId: "ST001",
    courseId: "CO2003", // Data Structures
    status: CourseStatus.STUDYING,
    components: [
      { name: "Lab 1", weight: 10, score: 9.5 },
      { name: "Lab 2", weight: 10, score: 8.0 },
      { name: "Midterm", weight: 30, score: 7.5 },
      { name: "Final Exam", weight: 50, score: 0 } // Chưa thi
    ]
  },
  {
    studentId: "ST001",
    courseId: "CO1023", // Intro to Computing
    status: CourseStatus.WITHDRAWN,
    components: []
  }
];