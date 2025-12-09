import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Login.css';
import '../App.css'; // Import file CSS vừa tạo

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Gọi xuống Backend (cổng 5000)
      const response = await axios.post('http://localhost:5000/api/login', {
        username,
        password
      });

      if (response.data.success) {
        const { user, token } = response.data.data;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));

        if (user.role === 'student') navigate('/student/home');
        else if (user.role === 'tutor') navigate('/tutor/schedule');
        else if (user.role === 'admin') navigate('/admin/dashboard');
      }
    } catch (err) {
      setError('Login failed. Please check your username and password.');
    }
  };

  return (
    <div className="login-page">
      {/* Header */}
      <div className="header-bar">
        <div className="logo-box">BK</div>
        <h1 style={{fontSize: '1.2rem', margin: 0}}>CENTRALIZED AUTHENTICATION SERVICE</h1>
      </div>

      {/* Main Container */}
      <div className="login-container">
        <div className="login-box">
          
          {/* Form Side */}
          <div className="login-left">
            <h2 className="login-title">Login to your account</h2>
            
            <form onSubmit={handleLogin}>
              <div className="form-group">
                <input
                  type="text"
                  placeholder="Username"
                  className="form-input"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
              <div className="form-group">
                <input
                  type="password"
                  placeholder="Password"
                  className="form-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              {error && <p style={{color: 'red', fontSize: '0.9rem'}}>{error}</p>}

              <div style={{marginTop: '20px'}}>
                <button type="submit" className="btn btn-primary">Sign In</button>
              </div>
            </form>
          </div>

          {/* Info Side */}
          <div className="login-right">
            <h3 style={{color: '#991b1b', marginTop: 0}}>Choose your Language</h3>
            <div className="lang-links">
              <a href="#">English</a> | <a href="#">Vietnamese</a>
            </div>
            
            <div style={{marginTop: '40px', color: '#666', fontSize: '0.9rem'}}>
              <p>Welcome to HCMUT Tutor Support System.</p>
              <p>Please log in with your university credentials.</p>
              <p style={{marginTop: '20px', fontStyle: 'italic'}}>Default Accounts:</p>
              <ul style={{paddingLeft: '20px'}}>
                <li>Student: student1 / 123</li>
                <li>Tutor: tutor1 / 123</li>
              </ul>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Login;