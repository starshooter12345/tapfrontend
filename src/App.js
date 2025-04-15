import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';
import { useNavigate } from 'react-router-dom';


// Configure axios defaults
axios.defaults.baseURL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';
axios.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      toast.error('Session expired. Please login again.');
      window.location.reload();
    }
    return Promise.reject(error);
  }
);

function App() {
  const navigate = useNavigate();
  // Authentication state
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authType, setAuthType] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    dob: '',
    remember: false
  });
  const [errors, setErrors] = useState({});
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Team slideshow state
  const [currentMemberIndex, setCurrentMemberIndex] = useState(0);
  const [direction, setDirection] = useState('right');
  const sliderRef = useRef(null);

  // Team members data
  const teamMembers = [
    {
      name: "Nirmalkumar Chauhan",
      email: "nirmal@example.com",
      studentId: "S001",
      role: "Lead Developer",
      image: "https://via.placeholder.com/150"
    },
    {
      name: "Buddhi Shah",
      email: "buddhi@example.com",
      studentId: "S002",
      role: "AI Specialist",
      image: "https://via.placeholder.com/150"
    },
    {
      name: "Ravi Soni",
      email: "ravi@example.com",
      studentId: "S003",
      role: "Frontend Developer",
      image: "https://via.placeholder.com/150"
    },
    {
      name: "Alex Johnson",
      email: "alex@example.com",
      studentId: "S004",
      role: "Backend Developer",
      image: "https://via.placeholder.com/150"
    },
    {
      name: "Dax Daboriya",
      email: "dax@example.com",
      studentId: "S005",
      role: "UI/UX Designer",
      image: "https://via.placeholder.com/150"
    },
    {
      name: "Jatin Kaushal",
      email: "jatin@example.com",
      studentId: "S006",
      role: "Project Manager",
      image: "https://via.placeholder.com/150"
    }
  ];

  // Check for existing token on load
  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (token && user) {
      try {
        const parsedUser = JSON.parse(user);
        setCurrentUser(parsedUser);
        
        // Verify token is still valid
        axios.get('/auth/verify', {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => {
          handleLogout();
        });
      } catch (err) {
        handleLogout();
      }
    }
  }, []);

  // Validate form
  const validateForm = () => {
    const newErrors = {};
    const today = new Date();
    const dobDate = new Date(formData.dob);
    let age = today.getFullYear() - dobDate.getFullYear();
    const monthDiff = today.getMonth() - dobDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dobDate.getDate())) {
      age--;
    }

    if (authType === 'signup') {
      if (!formData.username.trim()) {
        newErrors.username = 'Username is required';
      } else if (formData.username.length < 3) {
        newErrors.username = 'Username must be at least 3 characters';
      } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
        newErrors.username = 'Username can only contain letters, numbers and underscores';
      }

      if (!formData.dob) {
        newErrors.dob = 'Date of birth is required';
      } else if (age < 14) {
        newErrors.dob = 'You must be at least 14 years old';
      }

      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle authentication form submission
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    if (validateForm()) {
      setIsLoading(true);
      try {
        const endpoint = authType === 'login' ? '/auth/login' : '/auth/signup';
        const payload = authType === 'login' ? {
          email: formData.email,
          password: formData.password
        } : {
          username: formData.username,
          email: formData.email,
          password: formData.password,
          dob: formData.dob
        };

        const { data } = await axios.post(endpoint, payload);

        // Store token and user data
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        setCurrentUser(data.user);
        
        setShowAuthModal(false);
        setFormData({
          username: '',
          email: '',
          password: '',
          confirmPassword: '',
          dob: '',
          remember: false
        });

        toast.success(`Welcome ${data.user.username}!`);
        // NEW: Redirect logic based on authType
        if (authType === 'login') {
          navigate('/main');  // Redirect to main page after login
        } else if (authType === 'signup') {
          navigate('/create-avatar');  // Redirect to create avatar page after signup
        }
      } catch (error) {
        console.error('Auth error:', error);
        const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message || 
                          'Authentication failed. Please try again.';
        setErrors({ submit: errorMessage });
        toast.error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = {...prev};
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setCurrentUser(null);
    toast.info('You have been logged out');
  };

  // Navigate to next team member
  const nextMember = () => {
    setDirection('right');
    setCurrentMemberIndex(prev => 
      prev === teamMembers.length - 1 ? 0 : prev + 1
    );
  };

  // Navigate to previous team member
  const prevMember = () => {
    setDirection('left');
    setCurrentMemberIndex(prev => 
      prev === 0 ? teamMembers.length - 1 : prev - 1
    );
  };

  // Auto-advance team slideshow
  useEffect(() => {
    const interval = setInterval(() => {
      nextMember();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="app">
      <ToastContainer 
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
      
      {/* Header with User State */}
      <header className="header">
        <div className="logo">Talk Toon Me!</div>
        <nav>
          {currentUser ? (
            <div className="user-controls">
              <span>Welcome, {currentUser.username}</span>
              <button className="logout-btn" onClick={handleLogout}>Logout</button>
            </div>
          ) : (
            <button 
              className="start-btn" 
              onClick={() => {
                setShowAuthModal(true);
                setAuthType(null);
                setErrors({});
              }}
            >
              Start
            </button>
          )}
        </nav>
      </header>

      {/* Main Content */}
      <main className="main-content">
        {/* Project Introduction */}
        <section className="intro-section">
          <h1>Welcome to Talk Toon Me!</h1>
          <p className="intro-text">
            Talk Toon Me! is a revolutionary AI companion that brings conversations to life through 
            animated avatars. Our state-of-the-art system combines advanced transformer-based language 
            models with synchronized facial animation for truly lifelike interactions.
          </p>
          <div className="features">
            <div className="feature-card">
              <h3>🤖 Intelligent Conversations</h3>
              <p>Context-aware dialogue powered by cutting-edge AI</p>
            </div>
            <div className="feature-card">
              <h3>🎭 Expressive Avatars</h3>
              <p>Dynamic animations that match speech and emotions</p>
            </div>
            <div className="feature-card">
              <h3>🔒 Safe Interactions</h3>
              <p>Built-in safety protocols for secure conversations</p>
            </div>
          </div>
        </section>

        {/* Video Section */}
        <section className="video-section">
          <h2>See Our AI in Action</h2>
          <div className="video-container">
            <div className="video-placeholder">
              <p>Demo video will be placed here</p>
            </div>
          </div>
        </section>

        {/* Team Members Slideshow */}
        {/* <section className="team-section">
          <h2>Our Team</h2>
          <div className="team-slider" ref={sliderRef}>
            <div className="team-slides-container">
              {teamMembers.map((member, index) => (
                <div 
                  key={index}
                  className={`team-slide ${
                    index === currentMemberIndex ? 'active' : 
                    index === (currentMemberIndex + 1) % teamMembers.length ? 'next' :
                    index === (currentMemberIndex - 1 + teamMembers.length) % teamMembers.length ? 'prev' : ''
                  } ${
                    direction === 'right' ? 'slide-right' : 'slide-left'
                  }`}
                >
                  <div className="member-card">
                    <div className="member-image">
                      <img src={member.image} alt={member.name} />
                    </div>
                    <div className="member-info">
                      <h3>{member.name}</h3>
                      <p><strong>Email:</strong> {member.email}</p>
                      <p><strong>Student ID:</strong> {member.studentId}</p>
                      <p><strong>Role:</strong> {member.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button className="slider-arrow left" onClick={prevMember}>
              &lt;
            </button>
            <button className="slider-arrow right" onClick={nextMember}>
              &gt;
            </button>
          </div>
          <div className="team-dots">
            {teamMembers.map((_, index) => (
              <span 
                key={index}
                className={`dot ${index === currentMemberIndex ? 'active' : ''}`}
                onClick={() => {
                  setDirection(index > currentMemberIndex ? 'right' : 'left');
                  setCurrentMemberIndex(index);
                }}
              ></span>
            ))}
          </div>
        </section> */}
      </main>

      {/* Authentication Modal */}
      {showAuthModal && (
        <div className="modal-overlay">
          <div className="auth-modal">
            <button 
              className="close-btn"
              onClick={() => {
                setShowAuthModal(false);
                setAuthType(null);
                setErrors({});
              }}
            >
              ×
            </button>
            
            {!authType ? (
              <div className="auth-options">
                <h2>Welcome to Talk Toon Me!</h2>
                <p>Please choose an option to continue</p>
                <div className="option-buttons">
                  <button 
                    className="auth-option-btn login-option"
                    onClick={() => setAuthType('login')}
                  >
                    Login
                  </button>
                  <button 
                    className="auth-option-btn signup-option"
                    onClick={() => setAuthType('signup')}
                  >
                    Sign Up
                  </button>
                </div>
                <div className="social-login">
                  <button 
                    className="google-login-btn"
                    onClick={() => window.location.href = '/api/auth/google'}
                  >
                    <img src="https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg" alt="Google" />
                    Continue with Google
                  </button>
                </div>
              </div>
            ) : (
              <div className="auth-form-container">
                <h2>{authType === 'login' ? 'Login' : 'Sign Up'}</h2>
                {errors.submit && <div className="error-message">{errors.submit}</div>}
                <form onSubmit={handleAuthSubmit}>
                  {authType === 'signup' && (
                    <>
                      <div className="form-group">
                        <label>Username</label>
                        <input
                          type="text"
                          name="username"
                          value={formData.username}
                          onChange={handleInputChange}
                          className={errors.username ? 'error' : ''}
                          disabled={isLoading}
                        />
                        {errors.username && <span className="error-message">{errors.username}</span>}
                      </div>
                      
                      <div className="form-group">
                        <label>Date of Birth</label>
                        <input
                          type="date"
                          name="dob"
                          value={formData.dob}
                          onChange={handleInputChange}
                          className={errors.dob ? 'error' : ''}
                          disabled={isLoading}
                        />
                        {errors.dob && <span className="error-message">{errors.dob}</span>}
                      </div>
                    </>
                  )}
                  
                  <div className="form-group">
                    <label>Email</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className={errors.email ? 'error' : ''}
                      disabled={isLoading}
                    />
                    {errors.email && <span className="error-message">{errors.email}</span>}
                  </div>
                  
                  <div className="form-group">
                    <label>Password</label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className={errors.password ? 'error' : ''}
                      disabled={isLoading}
                    />
                    {errors.password && <span className="error-message">{errors.password}</span>}
                  </div>
                  
                  {authType === 'signup' && (
                    <div className="form-group">
                      <label>Confirm Password</label>
                      <input
                        type="password"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        className={errors.confirmPassword ? 'error' : ''}
                        disabled={isLoading}
                      />
                      {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
                    </div>
                  )}
                  
                  <div className="form-group remember">
                    <input
                      type="checkbox"
                      name="remember"
                      checked={formData.remember}
                      onChange={handleInputChange}
                      id="remember"
                      disabled={isLoading}
                    />
                    <label htmlFor="remember">Remember me</label>
                  </div>
                  
                  <button 
                    type="submit" 
                    className="submit-btn"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <span className="spinner"></span>
                    ) : authType === 'login' ? 'Login' : 'Sign Up'}
                  </button>
                </form>
                
                <div className="auth-switch">
                  {authType === 'login' ? (
                    <p>Don't have an account? <span onClick={() => setAuthType('signup')}>Sign up</span></p>
                  ) : (
                    <p>Already have an account? <span onClick={() => setAuthType('login')}>Login</span></p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;