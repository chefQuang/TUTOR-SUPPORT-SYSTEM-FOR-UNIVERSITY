import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import StudentHome from './pages/StudentHome';
import CourseRegistration from './pages/CourseRegistration';
import { TutorDashboard, AdminDashboard } from './pages/Dashboard';
import StudentSchedule from './pages/StudentSchedule';
import StudentPerformance from './pages/StudentPerformance';
import StudentMaterials from './pages/StudentMaterials';
import MyCourses from './pages/MyCourses';
import AssignmentDetail from './pages/AssignmentDetail';
import QuizDetail from './pages/QuizDetail';
import TutorSchedule from './pages/TutorSchedule';
import StudentProfile from './pages/StudentProfile';
import StudentFeedback from './pages/StudentFeedback';
import BookingConsultation from './pages/BookingConsultation';
import TutorInbox from './pages/TutorInbox';
import StudentInbox from './pages/StudentInbox';
import TutorProgress from './pages/TutorProgress';
import TutorMaterials from './pages/TutorMaterials';
import TutorClasses  from './pages/TutorClasses';
import TutorAssignmentView from './pages/TutorAssignmentView';
import './App.css'; 

function App() {
  const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
    const token = localStorage.getItem('token');
    return token ? <>{children}</> : <Navigate to="/" />;
  };

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        
        <Route path="/student/home" element={
          <PrivateRoute><StudentHome /></PrivateRoute>
        } />
        <Route path="/student/register" element={
          <PrivateRoute><CourseRegistration /></PrivateRoute>
        } />

        <Route path="/student/schedule" element={
          <PrivateRoute><StudentSchedule /></PrivateRoute>
        } />
        <Route path="/student/performance" element={
          <PrivateRoute><StudentPerformance /></PrivateRoute>
        } />
        <Route path="/student/materials" element={
          <PrivateRoute><StudentMaterials /></PrivateRoute>
        } />
        <Route path="/student/courses" element={
          <PrivateRoute><MyCourses /></PrivateRoute>
        } />
        <Route path="/student/courses/:courseId/assignment/:itemId" element={
          <PrivateRoute><AssignmentDetail /></PrivateRoute>
        } />
        <Route path="/student/courses/:courseId/quiz/:itemId" element={
          <PrivateRoute><QuizDetail /></PrivateRoute>
        } />
        <Route path="/student/feedback" element={
          <PrivateRoute><StudentFeedback /></PrivateRoute>
        } />
        <Route path="/student/profile" element={
          <PrivateRoute><StudentProfile /></PrivateRoute>
        } />
        <Route path="/student/booking" element={
          <PrivateRoute><BookingConsultation /></PrivateRoute>
        } />
        <Route path="/student/inbox" element={
          <PrivateRoute><StudentInbox /></PrivateRoute>
        } />
        
        <Route path="/tutor/home" element={
          <PrivateRoute>
            <TutorDashboard />
          </PrivateRoute>
        } />
        <Route path="/tutor/schedule" element={
          <PrivateRoute><TutorSchedule /></PrivateRoute>
        } />
        <Route path="/tutor/requests" element={
          <PrivateRoute><TutorInbox /></PrivateRoute>
        } />
        <Route path="/tutor/progress" element={
          <PrivateRoute><TutorProgress /></PrivateRoute>
        } />
        <Route path="/tutor/materials" element={
          <PrivateRoute><TutorMaterials /></PrivateRoute>
        } />
        <Route path="/tutor/classes" element={
          <PrivateRoute><TutorClasses /></PrivateRoute>
        } />
        <Route 
          path="/tutor/class/:classId/assignment/:assignmentId" 
          element={<PrivateRoute><TutorAssignmentView /></PrivateRoute>} 
        />
        
        <Route path="/admin/dashboard" element={
          <PrivateRoute>
            <AdminDashboard />
          </PrivateRoute>
        } />
      </Routes>
    </Router>
  );
}

export default App;