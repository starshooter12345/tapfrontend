import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate from react-router-dom
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import './App.css';

// Configure axios defaults
axios.defaults.baseURL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';
axios.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add response interceptor for consistent error handling
axios.interceptors.response.use(
  response => response,
  error => {
    if (error.response && error.response.status === 400) {
      const errorData = error.response.data;
      const errorMessage = errorData.error || errorData.message || 'Bad Request';
      return Promise.reject(new Error(errorMessage));
    }
    return Promise.reject(error);
  }
);

function App() {
  const navigate = useNavigate();  // Initialize useNavigate hook for navigation
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authType, setAuthType] = useState('login');
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    currentPassword: '',
    newPassword: '',
    dob: '',
    remember: false
  });
  const [errors, setErrors] = useState({});
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showProfileSidebar, setShowProfileSidebar] = useState(false);

  const [surveys] = useState([
    { id: 1, name: 'Healthcare Survey', description: 'Survey on healthcare topics', buttonText: 'Start Survey' },
    { id: 2, name: 'Education Survey', description: 'Survey on education topics', buttonText: 'Coming Soon' },
    { id: 3, name: 'Technology Survey', description: 'Survey on technology trends', buttonText: 'Coming Soon' }
  ]);

  // Load user from localStorage on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (token && user) {
      try {
        const parsedUser = JSON.parse(user);
        setCurrentUser(parsedUser);
      } catch (err) {
        console.error('Error parsing user data:', err);
        handleLogout();
      }
    }
  }, []);

  // Update form data when profile sidebar opens
  useEffect(() => {
    if (showProfileSidebar && currentUser) {
      setFormData(prev => ({
        ...prev,
        username: currentUser.username || '',
        email: currentUser.email || '',
        dob: currentUser.dob ? new Date(currentUser.dob).toISOString().split('T')[0] : '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
    }
  }, [showProfileSidebar, currentUser]);

  // Form validation
  const validateForm = (isUpdate = false) => {
    const newErrors = {};
    
    // Common validations for both signup and update
    if ((authType === 'signup' || isUpdate) && (!currentUser?.isGoogleAuth || formData.newPassword)) {
      if (!formData.username.trim()) {
        newErrors.username = 'Username is required';
      } else if (formData.username.length < 3) {
        newErrors.username = 'Username must be at least 3 characters';
      }
  
      if (!formData.dob) {
        newErrors.dob = 'Date of birth is required';
      }  else {
        const today = new Date();
        const dobDate = new Date(formData.dob);
        let age = today.getFullYear() - dobDate.getFullYear();
        const monthDiff = today.getMonth() - dobDate.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dobDate.getDate())) {
          age--;
        }
        
        if (age < 14) {
          newErrors.dob = 'You must be at least 14 years old';
        }
      }
    }

    if (!isUpdate && !currentUser?.isGoogleAuth) {
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
  
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }
  
    // Update specific validations
    if (isUpdate && formData.newPassword) {
      if (formData.newPassword.length < 6) {
        newErrors.newPassword = 'Password must be at least 6 characters';
      }
  
      if (formData.newPassword !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
  
      if (!currentUser?.isGoogleAuth && !formData.currentPassword) {
        newErrors.currentPassword = 'Current password is required';
      }
    }
  
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle authentication
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    
    // First validate the form (including password match for signup)
    if (!validateForm()) return;
    
    // Additional explicit password match check for signup
    if (authType === 'signup' && formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      setErrors({ confirmPassword: 'Passwords do not match' });
      return;
    }
    
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

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setCurrentUser(data.user);
      setShowAuthModal(false);
      resetForm();
      toast.success(`Welcome ${data.user.username}!`);
    } catch (error) {
      handleApiError(error, 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Google login
  const handleGoogleLogin = async (credentialResponse) => {
    try {
      setIsLoading(true);
      const { data } = await axios.post('/auth/google', {
        credential: credentialResponse.credential
      });
      
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setCurrentUser(data.user);
      setShowAuthModal(false);
      toast.success(`Welcome ${data.user.username}!`);
    } catch (error) {
      handleApiError(error, 'Google login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    
    // Clear previous errors
    setErrors({});
    
    // Validate form first
    if (!validateForm(true)) {
      return;
    }
  
    // Additional explicit checks
    if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
      setErrors({ confirmPassword: 'Passwords do not match' });
      toast.error('Passwords do not match');
      return;
    }
  
    // For non-Google users changing password, require current password
    if (!currentUser?.isGoogleAuth && formData.newPassword && !formData.currentPassword) {
      setErrors({ currentPassword: 'Current password is required' });
      toast.error('Current password is required');
      return;
    }
  
    setIsLoading(true);
    
    try {
      const updateData = {
        username: formData.username,
        dob: formData.dob
      };
  
      // Only include password fields if they're being changed
      if (formData.newPassword) {
        updateData.newPassword = formData.newPassword;
        updateData.confirmPassword = formData.confirmPassword;
        
        // For non-Google users, include current password
        if (!currentUser?.isGoogleAuth) {
          updateData.currentPassword = formData.currentPassword;
        }
      }
      
      const { data } = await axios.put('/users/me', updateData);

      const updatedUser = {
        ...currentUser,
        username: data.username || currentUser.username,
        dob: data.dob || currentUser.dob
      };
  
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setCurrentUser(updatedUser);
      toast.success('Profile updated successfully!');
      setShowProfileSidebar(false);
    } catch (error) {
      console.error('Update error:', error);
      toast.error(error.response?.data?.error || 'Profile update failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setCurrentUser(null);
    setShowProfileSidebar(false);
    toast.info('You have been logged out');
  };

  const handleApiError = (error, defaultMessage) => {
    console.error('API Error:', error);
    const errorMessage = error.response?.data?.error || 
                       error.response?.data?.message || 
                       error.message || 
                       defaultMessage;
    setErrors({ submit: errorMessage });
    toast.error(errorMessage);
  };

  // Function to handle the input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Function to handle the survey start
  const handleStartSurvey = () => {
    if (currentUser) {
      toast.info('Starting survey...');
      navigate('/main'); // Navigate to MainPage
    } else {
      setShowAuthModal(true);
      setAuthType('login');
    }
  };

  // Function to reset form data
  const resetForm = () => {
    setFormData({
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
      currentPassword: '',
      newPassword: '',
      dob: '',
      remember: false
    });
  };

  // Function to toggle between login and signup forms
  const toggleAuthType = () => {
    setAuthType(prev => prev === 'login' ? 'signup' : 'login');
    setErrors({});
  };

  return (
    <div className="app">
      <ToastContainer position="top-right" autoClose={5000} />
      
      <header className="header">
        <div className="logo">Talk Toon Me!</div>
        <nav>
          {currentUser ? (
            <div className="user-controls">
              {currentUser.profileImage && (
                <img 
                  src={currentUser.profileImage} 
                  alt="Profile" 
                  className="profile-image"
                />
              )}
              <span>Welcome, {currentUser.username}</span>
              <button className="btn profile-btn" onClick={() => setShowProfileSidebar(true)}>
                Profile
              </button>
              <button className="btn logout-btn" onClick={handleLogout}>
                Logout
              </button>
            </div>
          ) : (
            <button className="btn auth-btn" onClick={() => setShowAuthModal(true)}>
              Login / Sign Up
            </button>
          )}
        </nav>
      </header>

      <main className="main-content">
        <div className="survey-cards">
          {surveys.map(survey => (
            <div key={survey.id} className="survey-card">
              <h3>{survey.name}</h3>
              <p>{survey.description}</p>
              <button
                className={`btn survey-btn ${survey.buttonText === 'Coming Soon' ? 'disabled' : ''}`}
                onClick={handleStartSurvey} // Call handleStartSurvey on click
                disabled={survey.buttonText === 'Coming Soon'}
              >
                {survey.buttonText}
              </button>
            </div>
          ))}
        </div>
      </main>

      {showProfileSidebar && (
        <div className="profile-sidebar">
          <div className="sidebar-header">
            <h2>Edit Profile</h2>
            <button 
              className="close-btn" 
              onClick={() => {
                setShowProfileSidebar(false);
                setFormData(prev => ({
                  ...prev,
                  currentPassword: '',
                  newPassword: '',
                  confirmPassword: ''
                }));
              }}
            >
              ×
            </button>
          </div>
          <form onSubmit={handleUpdateProfile}>
            <div className="form-group">
              <label>Username</label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                disabled={currentUser?.isGoogleAuth && !formData.newPassword}
              />
              {currentUser?.isGoogleAuth && !formData.newPassword && (
                <small className="form-hint">
                  Set a password to enable username editing
                </small>
              )}
              {errors.username && <span className="error">{errors.username}</span>}
            </div>
            
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                readOnly
                className="read-only"
              />
            </div>
            
            <div className="form-group">
              <label>Date of Birth</label>
              <input
                type="date"
                name="dob"
                value={formData.dob}
                onChange={handleInputChange}
                disabled={currentUser?.isGoogleAuth && !formData.newPassword}
              />
              {errors.dob && <span className="error">{errors.dob}</span>}
            </div>
            
            <div className="password-section">
              <h3>{currentUser?.isGoogleAuth ? 'Set Password' : 'Change Password'}</h3>
              
              {!currentUser?.isGoogleAuth && (
                <div className="form-group">
                  <label>Current Password</label>
                  <input
                    type="password"
                    name="currentPassword"
                    value={formData.currentPassword}
                    onChange={handleInputChange}
                    placeholder="Enter current password"
                  />
                </div>
              )}
              
              <div className="form-group">
                <label>New Password</label>
                <input
                  type="password"
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleInputChange}
                  placeholder="Enter new password"
                />
              </div>
              
              <div className="form-group">
                <label>Confirm Password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder="Confirm new password"
                />
                {errors.confirmPassword && <span className="error">{errors.confirmPassword}</span>}
              </div>
            </div>
            
            <button type="submit" className="btn submit-btn" disabled={isLoading}>
              {isLoading ? (
                <>
                  <span className="spinner" aria-hidden="true"></span>
                  Updating...
                </>
              ) : 'Update Profile'}
            </button>
          </form>
        </div>
      )}

      {showAuthModal && (
        <div className="modal-overlay">
          <div className="auth-modal">
            <button className="close-btn" onClick={() => setShowAuthModal(false)}>×</button>
            <h2>{authType === 'login' ? 'Login' : 'Sign Up'}</h2>
            
            {errors.submit && <div className="error-message">{errors.submit}</div>}
            
            {authType === 'login' && (
              <div className="google-login-section">
                <div className="divider">or</div>
                <GoogleLogin
                  onSuccess={handleGoogleLogin}
                  onError={() => toast.error('Google login failed')}
                  shape="pill"
                  theme="filled_blue"
                  size="large"
                  text="continue_with"
                />
              </div>
            )}
            
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
                    />
                    {errors.username && <span className="error">{errors.username}</span>}
                  </div>
                  <div className="form-group">
                    <label>Date of Birth</label>
                    <input
                      type="date"
                      name="dob"
                      value={formData.dob}
                      onChange={handleInputChange}
                    />
                    {errors.dob && <span className="error">{errors.dob}</span>}
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
                />
                {errors.email && <span className="error">{errors.email}</span>}
              </div>
              
              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                />
                {errors.password && <span className="error">{errors.password}</span>}
              </div>
              
              {authType === 'signup' && (
                <div className="form-group">
                  <label>Confirm Password</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                  />
                  {errors.confirmPassword && <span className="error">{errors.confirmPassword}</span>}
                </div>
              )}
              
              <div className="form-group remember-me">
                <input
                  type="checkbox"
                  id="remember"
                  name="remember"
                  checked={formData.remember}
                  onChange={handleInputChange}
                />
                <label htmlFor="remember">Remember me</label>
              </div>
              
              <button type="submit" className="btn submit-btn" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <span className="spinner" aria-hidden="true"></span>
                    Processing...
                  </>
                ) : authType === 'login' ? 'Login' : 'Sign Up'}
              </button>
              
              <div className="auth-toggle">
                {authType === 'login' ? (
                  <p>Don't have an account? <button type="button" onClick={toggleAuthType}>Sign Up</button></p>
                ) : (
                  <p>Already have an account? <button type="button" onClick={toggleAuthType}>Login</button></p>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AppWrapper() {
  return (
    <GoogleOAuthProvider clientId="632141724461-jjp4cvhlhj3elfsu68evc4be4sfp89e7.apps.googleusercontent.com">
      <App />
    </GoogleOAuthProvider>
  );
}
