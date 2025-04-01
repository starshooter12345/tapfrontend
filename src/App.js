import React, { useState } from 'react';
import './App.css';

function App() {
  // State for showing the auth modal and choosing between login/signup
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('choose'); // 'choose' | 'login' | 'signup'
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    dob: ''
  });
  const [error, setError] = useState('');

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Submit handler for login/signup
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const endpoint = authMode === 'login' ? '/api/auth/login' : '/api/auth/signup';
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || 'An error occurred');
      } else {
        alert(data.message);
        setShowAuthModal(false);
        setAuthMode('choose');
        setFormData({ email: '', password: '', dob: '' });
      }
    } catch (err) {
      setError('Server error');
    }
  };

  // Render different parts of the modal based on authMode
  const renderModalContent = () => {
    if (authMode === 'choose') {
      return (
        <div className="auth-choose">
          <h2>Welcome</h2>
          <p>Please choose an option:</p>
          <div className="auth-options">
            <button onClick={() => setAuthMode('login')}>Login</button>
            <button onClick={() => setAuthMode('signup')}>Sign Up</button>
          </div>
        </div>
      );
    } else if (authMode === 'login') {
      return (
        <div className="auth-form">
          <h2>Login</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Email:</label>
              <input 
                type="email" 
                name="email" 
                value={formData.email}
                onChange={handleInputChange}
                required 
              />
            </div>
            <div className="form-group">
              <label>Password:</label>
              <input 
                type="password" 
                name="password" 
                value={formData.password}
                onChange={handleInputChange}
                required 
              />
            </div>
            {error && <p className="error">{error}</p>}
            <button type="submit">Login</button>
          </form>
          <p onClick={() => setAuthMode('choose')} className="switch-auth">← Back</p>
        </div>
      );
    } else if (authMode === 'signup') {
      return (
        <div className="auth-form">
          <h2>Sign Up</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Email:</label>
              <input 
                type="email" 
                name="email" 
                value={formData.email}
                onChange={handleInputChange}
                required 
              />
            </div>
            <div className="form-group">
              <label>Password:</label>
              <input 
                type="password" 
                name="password" 
                value={formData.password}
                onChange={handleInputChange}
                required 
              />
            </div>
            <div className="form-group">
              <label>Date of Birth:</label>
              <input 
                type="date" 
                name="dob" 
                value={formData.dob}
                onChange={handleInputChange}
                required 
              />
            </div>
            {error && <p className="error">{error}</p>}
            <button type="submit">Sign Up</button>
          </form>
          <button 
            onClick={() => window.location.href = '/api/auth/google'}
            className="google-btn"
          >
            Sign Up with Gmail
          </button>
          <p onClick={() => setAuthMode('choose')} className="switch-auth">← Back</p>
        </div>
      );
    }
  };

  return (
    <div className="app">
      {/* Header with single Login/Signup button */}
      <header className="header">
        <div className="logo">Talk Toon Me!</div>
        <nav>
          <button 
            className="auth-btn"
            onClick={() => {
              setShowAuthModal(true);
              setAuthMode('choose');
            }}
          >
            Login / Signup
          </button>
        </nav>
      </header>

      {/* Other content sections remain as before */}
      <main className="main-content">
        {/* ... project intro, video section, team slideshow, etc. ... */}
        <section className="intro-section">
          <h1>Welcome to Talk Toon Me!</h1>
          <p className="intro-text">
            Talk Toon Me! is a revolutionary AI companion that brings conversations to life through animated avatars.
          </p>
        </section>
      </main>

      {/* Authentication Modal */}
      {showAuthModal && (
        <div className="modal-overlay" onClick={() => setShowAuthModal(false)}>
          <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setShowAuthModal(false)}>×</button>
            {renderModalContent()}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
