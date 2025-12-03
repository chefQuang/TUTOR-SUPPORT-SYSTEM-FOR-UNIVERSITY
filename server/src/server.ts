// server/src/server.ts
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import multer from 'multer'; // <--- Import multer
import path from 'path';     // <--- Import path
import fs from 'fs';         // <--- Import fs
import { login } from './controllers/mainController';
// Import controller mới
//import { searchClasses, registerClass, getStudentStats, getStudentSchedule } from './controllers/studentController';
import { 
  searchClasses, registerClass, getStudentStats, getStudentSchedule, getStudentProfile, updateStudentProfile, uploadAvatar,
  getUpcomingSessions, getCoursePerformance, getPerformanceDetail, getMaterials, getMaterialDetail, submitFeedback, getFeedbackCandidates, deleteFeedback
} from './controllers/studentController';

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
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'avatar-' + uniqueSuffix + path.extname(file.originalname))
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
app.get('/api/student/profile', getStudentProfile); // <--- Add
app.put('/api/student/profile', updateStudentProfile); // <--- Add
app.post('/api/student/upload-avatar', upload.single('avatar'), uploadAvatar);

app.get('/', (req, res) => {
  res.send('Tutor Support System API is running...');
});

app.get('/api/student/schedule', getStudentSchedule);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

