// server/src/server.ts
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { login } from './controllers/mainController';
// Import controller mới
//import { searchClasses, registerClass, getStudentStats, getStudentSchedule } from './controllers/studentController';
import { 
  searchClasses, registerClass, getStudentStats, getStudentSchedule, 
  getUpcomingSessions, getCoursePerformance, getPerformanceDetail, getMaterials, getMaterialDetail, getFeedbackCandidates, submitFeedback, deleteFeedback, checkTutorAvailability, bookConsultation, updateStudentProfile, uploadAvatar, getStudentProfile, getStudentNotifications
} from './controllers/studentController';
import { 
  getMyCourses, getCourseContent, getCourseItem, 
  getSubmissionStatus, submitAssignment, submitQuiz, removeSubmission 
} from './controllers/courseController';
import { getTutorSchedule, updateSession, cancelSession, getConsultationRequests, respondToConsultation, getTutorStudents, updateStudentGrade, toggleSessionStatus, uploadMaterial, getTutorMaterials, getTutorMaterialDetail, addCourseSection, addCourseItem, getTutorClasses, deleteCourseItem, getAssignmentSubmissions } from './controllers/tutorController';

const app = express();
const PORT = 5000;

app.use(cors());
app.use(bodyParser.json());



const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir);
}
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir)
  },
  filename: function (req, file, cb) {
    // Đặt tên file: avatar-studentId-timestamp.jpg
    let prefix = 'file-';
    if (file.fieldname === 'avatar') {
        prefix = 'avatar-';
    } else if (file.fieldname === 'file') { // Bên TutorMaterials mình đặt name='file'
        prefix = 'material-';
    } else if (file.fieldname === 'submission') {
        prefix = 'sub-';
    }
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, prefix + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// 3. Cho phép Client truy cập thư mục uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// --- ROUTES ---
app.post('/api/login', login);

// Student Routes
app.get('/api/student/search', searchClasses);
app.post('/api/student/register', registerClass);
app.get('/api/student/stats', getStudentStats);
app.get('/api/student/upcoming', getUpcomingSessions);
app.get('/api/student/performance', getCoursePerformance);
app.get('/api/student/performance-detail', getPerformanceDetail);
app.get('/api/student/materials', getMaterials);
app.get('/api/student/material-detail', getMaterialDetail);
app.get('/api/student/feedback-candidates', getFeedbackCandidates); 
app.post('/api/student/feedback', submitFeedback); 
app.delete('/api/student/feedback', deleteFeedback);
app.get('/api/student/profile', getStudentProfile);
app.put('/api/student/profile', updateStudentProfile);
app.post('/api/student/upload-avatar', upload.single('avatar'), uploadAvatar);
app.get('/api/student/tutor-availability', checkTutorAvailability);
app.post('/api/student/book-consultation', bookConsultation);
app.get('/api/student/notifications', getStudentNotifications);

// Course Learning Routes
app.get('/api/courses/my-courses', getMyCourses);
app.get('/api/courses/content', getCourseContent);
app.get('/api/courses/item', getCourseItem);
app.get('/api/courses/submission', getSubmissionStatus);
app.post('/api/courses/submit-assignment', upload.single('submission'), submitAssignment);
app.post('/api/courses/submit-quiz', submitQuiz);
app.post('/api/courses/remove-submission', removeSubmission);


// Tutor Routes
app.get('/api/tutor/schedule', getTutorSchedule);
app.post('/api/tutor/update-session', updateSession);
app.post('/api/tutor/cancel-session', cancelSession);
app.get('/api/tutor/consultations', getConsultationRequests);
app.post('/api/tutor/respond-consultation', respondToConsultation);
app.get('/api/tutor/students', getTutorStudents);
app.post('/api/tutor/update-grade', updateStudentGrade);
app.post('/api/tutor/toggle-status', toggleSessionStatus);
app.post('/api/materials/upload', upload.single('file'), uploadMaterial);
app.get('/api/tutor/materials', getTutorMaterials);
app.get('/api/tutor/material-detail', getTutorMaterialDetail);
app.get('/api/tutor/classes', getTutorClasses);
app.post('/api/tutor/add-section', addCourseSection);
app.post('/api/tutor/add-item', upload.single('file'), addCourseItem);
app.post('/api/tutor/delete-item', deleteCourseItem);
app.get('/api/tutor/assignment-submissions', getAssignmentSubmissions);

app.get('/', (req, res) => {
  res.send('Tutor Support System API is running...');
});

app.get('/api/student/schedule', getStudentSchedule);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});