// server/src/server.ts
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { login } from './controllers/mainController';
// Import controller mới
//import { searchClasses, registerClass, getStudentStats, getStudentSchedule } from './controllers/studentController';
import { 
  searchClasses, registerClass, getStudentStats, getStudentSchedule, 
  getUpcomingSessions, getCoursePerformance, getPerformanceDetail, getMaterials, getMaterialDetail
} from './controllers/studentController';
import { 
  getMyCourses, getCourseContent, getCourseItem, 
  getSubmissionStatus, submitAssignment, submitQuiz, removeSubmission 
} from './controllers/courseController';

const app = express();
const PORT = 5000;

app.use(cors());
app.use(bodyParser.json());

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

// Course Learning Routes
app.get('/api/courses/my-courses', getMyCourses);
app.get('/api/courses/content', getCourseContent);
app.get('/api/courses/item', getCourseItem);
app.get('/api/courses/submission', getSubmissionStatus);
app.post('/api/courses/submit-assignment', submitAssignment);
app.post('/api/courses/submit-quiz', submitQuiz);
app.post('/api/courses/remove-submission', removeSubmission); 

app.get('/', (req, res) => {
  res.send('Tutor Support System API is running...');
});

app.get('/api/student/schedule', getStudentSchedule);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});