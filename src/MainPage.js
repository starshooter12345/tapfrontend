import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './MainPage.css';

const MainPage = () => {
  const navigate = useNavigate();

  const [showSettings, setShowSettings] = useState(false);
  const [question, setQuestion] = useState('');
  const questions = [
    "Question 1", "Question 2", "Question 3", "Question 4", "Question 5",
    "Question 6", "Question 7", "Question 8", "Question 9", "Question 10"
  ];

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  const handleSendQuestion = () => {
    console.log("Question sent:", question);
    setQuestion('');
  };

  return (
    <div className="main-page">
      <header className="top-bar">
        <div className="logo">Logo</div>
        <nav className="nav-controls">
          <div className="settings-dropdown">
            <button 
              className="settings-btn" 
              onClick={() => setShowSettings(prev => !prev)}
            >
              Settings ▼
            </button>
            {showSettings && (
              <ul className="settings-menu">
                <li>Update Profile</li>
                <li>Update Avatar</li>
                <li>Update Answer Preferences</li>
                <li>Update Mode</li>
              </ul>
            )}
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            Log Out
          </button>
        </nav>
      </header>

      <div className="content-area">
        <aside className="question-history">
          {questions.map((q, idx) => (
            <div key={idx} className="question-item">{q}</div>
          ))}
        </aside>

        <section className="avatar-chat-area">
        <img className="avatar-image" src="/images/avatar.png" alt="User Avatar" />

          <div className="subtitle">Subtitle of the answer...</div>
          <div className="chat-input-area">
            <input
              type="text"
              placeholder="Ask me anything..."
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
            />
            <button className="send-btn" onClick={handleSendQuestion}>Send</button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default MainPage;

