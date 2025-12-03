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
  studentIdDisplay?: string; // e.g., "2012345"
  major?: string;
  phoneNumber?: string;
  currentYear?: string;
  bio?: string;
  avatarUrl?: string;
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

// Loại nội dung học tập
export enum ContentType {
  FILE = "file", // Tài liệu
  ASSIGNMENT = "assignment", // Bài tập nộp file
  QUIZ = "quiz" // Bài kiểm tra trắc nghiệm
}

export enum CourseStatus {
  STUDYING = "Studying",
  COMPLETED = "Completed",
  WITHDRAWN = "Withdrawn"
}

// Thêm enum cho Ngành (Major)
export enum Major {
  CS = "Computer Science",
  CE = "Computer Engineering",
  EE = "Electrical Engineering",
  BA = "Business Administration",
  ALL = "General"
}

export interface GradeComponent {
  name: string;   // VD: Midterm, Final, Assignment
  weight: number; // VD: 30 (tức là 30%)
  score: number;  // VD: 8.5
}

export interface StudentCoursePerformance {
  studentId: string;
  classId: string;
  courseId: string;
  status: CourseStatus;
  components: GradeComponent[];
  // Điểm tổng kết sẽ được tính toán tự động ở Controller, không cần lưu cứng
}

// Interface Tài liệu
export interface Material {
  id: string;
  title: string;
  author: string;
  sharedBy: string; // Tên Tutor hoặc "HCMUT LIBRARY"
  description: string;
  majors: Major[]; // Một tài liệu có thể thuộc nhiều ngành
  coverImage: string; // URL ảnh bìa
  downloadUrl: string; // URL file
  previewPages: number; // Số trang cho phép xem trước
}

// Cấu trúc câu hỏi Quiz
export interface QuizQuestion {
  id: string;
  text: string;
  options: string[];
  correctOptionIndex: number;
}

// Cấu trúc một Section (Chương/Tuần)
export interface CourseSection {
  id: string;
  title: string;
  items: CourseItem[];
}

// Cấu trúc một mục (Item) trong khóa học
export interface CourseItem {
  id: string;
  type: ContentType;
  title: string;
  description?: string;
  
  // Dành cho Assignment
  dueDate?: string; // Deadline
  fileUrl?: string; // File đề bài (nếu có)
  
  // Dành cho Quiz
  duration?: number; // Phút
  attempts?: number; // Số lần làm bài
  questions?: QuizQuestion[];
}

// Lưu trạng thái nộp bài của sinh viên
export interface Submission {
  studentId: string;
  itemId: string; // Assignment ID hoặc Quiz ID
  submittedAt: string;
  status: "Pending Grading" | "Graded" | "Late";
  fileUrl?: string; // Cho Assignment
  score?: number;   // Cho Quiz hoặc Assignment đã chấm
  attemptCount?: number;
}

export const SUBMISSIONS: Submission[] = []; // Khởi tạo rỗng


// Mock Data Users (Cập nhật thêm mảng rỗng cho student)
export const USERS: User[] = [
{
    id: "ST001",
    username: "student1",
    password: "123",
    fullName: "Nguyễn Văn A",
    role: Role.STUDENT,
    email: "studentA@hcmut.edu.vn",
    registeredClassIds: [] ,
    studentIdDisplay: "2013456",
    major: "Computer Science",
    phoneNumber: "+84 909 123 456",
    currentYear: "Year 3",
    bio: "Passionate about AI and Software Engineering. Looking for tutors in advanced algorithms.",
    avatarUrl: "" // Empty string will trigger default initial avatar
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
  },
  {
    courseId: "CO1023",
    courseName: "Introduction to Computing",
    credits: 4,
    classes: [
      {
        classId: "CL_IC_01",
        tutorName: "Dr. Hoa Thanh Que",
        tutorId: "TT004",
        capacity: 40,
        enrolledStudentIds: [],
        scheduleOverview: "Wed 12:00 - 15:00",
        sessions: []
      }
    ]
  }
];

export const GRADES: StudentCoursePerformance[] = [
  {
    studentId: "ST001",
    courseId: "CO3001", // Software Engineering
    classId: "CL_SE_01",
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
    classId: "CL_DSA_01",
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
    classId: "CL_IC_01",
    status: CourseStatus.WITHDRAWN,
    components: []
  }
];

export const MATERIALS: Material[] = [
  {
    id: "MAT01",
    title: "Computer Networking: A Top-Down Approach",
    author: "James F. Kurose, Keith Ross",
    sharedBy: "HCMUT LIBRARY",
    description: "Introduces this complex subject in a top-down manner, familiarizing you with important concepts early in your study.",
    majors: [Major.CS, Major.CE],
    coverImage: "https://m.media-amazon.com/images/I/71p783f-JCL._AC_UF1000,1000_QL80_.jpg", // Link ảnh mạng
    downloadUrl: "#",
    previewPages: 5
  },
  {
    id: "MAT02",
    title: "Introduction to Algorithms (4th Edition)",
    author: "Thomas H. Cormen",
    sharedBy: "Dr. John Smith",
    description: "A comprehensive update of the leading algorithms text, with new material on matchings in bipartite graphs, online algorithms, and machine learning.",
    majors: [Major.CS],
    coverImage: "https://m.media-amazon.com/images/I/61Mw06x2XcL._AC_UF1000,1000_QL80_.jpg",
    downloadUrl: "#",
    previewPages: 5
  },
  {
    id: "MAT03",
    title: "Digital Logic Design Principles",
    author: "Norman Balabanian",
    sharedBy: "HCMUT LIBRARY",
    description: "Foundation of digital systems and computer architecture.",
    majors: [Major.CE, Major.EE],
    coverImage: "https://m.media-amazon.com/images/I/51+6J7+8L+L.jpg",
    downloadUrl: "#",
    previewPages: 3
  }
];

// Dữ liệu nội dung khóa học (Map theo CourseId)
export const COURSE_CONTENTS: Record<string, CourseSection[]> = {
  "CO3001": [ // Software Engineering
    {
      id: "SEC01",
      title: "Week 1: Introduction & Process Models",
      items: [
        { id: "FILE01", type: ContentType.FILE, title: "Lecture Slide Chapter 1", fileUrl: "#" },
        { 
          id: "ASS01", 
          type: ContentType.ASSIGNMENT, 
          title: "Assignment 1: Case Study Analysis", 
          description: "Analyze the given case study and propose a suitable process model.",
          dueDate: "2025-10-20T23:59:00" 
        }
      ]
    },
    {
      id: "SEC02",
      title: "Week 3: Requirements Engineering",
      items: [
        { 
          id: "QUIZ01", 
          type: ContentType.QUIZ, 
          title: "Quiz 1: Requirement Types", 
          description: "Test your understanding of Functional vs Non-functional requirements.",
          duration: 15, // 15 phút
          attempts: 2,
          questions: [
            { id: "Q1", text: "Which is a non-functional requirement?", options: ["System must send email", "Response time < 2s", "User can login", "Admin can delete user"], correctOptionIndex: 1 },
            { id: "Q2", text: "What does SRS stand for?", options: ["System Requirement Specification", "Software Requirement Specification", "System Role Specification", "Software Role Specification"], correctOptionIndex: 1 }
          ]
        }
      ]
    }
  ],
  "CO2003": [ // Data Structures
    {
      id: "SEC_DSA_01",
      title: "Lab 2: Linked List",
      items: [
        {
          id: "ASS_DSA_01",
          type: ContentType.ASSIGNMENT,
          title: "Lab 2 Submission",
          description: "Submit your source code for Linked List implementation.",
          dueDate: "2025-11-15T23:59:00"
        }
      ]
    }
  ]
};
export interface Feedback {
  id: string;
  studentId: string; // Used for duplicate checks, but treated anonymously in reports
  courseId: string;
  courseName: string; // Stored for easier display
  overallRating: number;
  teachingQuality: number;
  materialQuality: number;
  difficultyLevel: number;
  comment: string;
  createdAt: string;
}

// ... existing code ...

// Add this Mock Array at the end of the file
export const FEEDBACKS: Feedback[] = [];