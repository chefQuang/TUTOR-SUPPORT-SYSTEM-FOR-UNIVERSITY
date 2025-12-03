import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import StudentHome from './pages/StudentHome';
import CourseRegistration from './pages/CourseRegistration';
import { TutorDashboard, AdminDashboard } from './pages/Dashboard';
import StudentSchedule from './pages/StudentSchedule';
import StudentPerformance from './pages/StudentPerformance';
import StudentMaterials from './pages/StudentMaterials';
import StudentFeedback from './pages/StudentFeedback';
import StudentProfile from './pages/StudentProfile';
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
        <Route path="/student/feedback" element={
          <PrivateRoute><StudentFeedback /></PrivateRoute>
        } />
        <Route path="/student/profile" element={
          <PrivateRoute><StudentProfile /></PrivateRoute>
        } />
        <Route path="/tutor/home" element={
          <PrivateRoute>
            <TutorDashboard />
          </PrivateRoute>
        } />
        
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