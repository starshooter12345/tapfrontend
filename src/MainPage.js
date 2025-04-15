import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './MainPage.css';
import './microphone.css';

const MainPage = () => {
  const navigate = useNavigate();

  const [showSettings, setShowSettings] = useState(false);
  const [question, setQuestion] = useState('');
  const [inputMode, setInputMode] = useState('text');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);

  const questions = [
    "Question 1", "Question 2", "Question 3", "Question 4", "Question 5",
    "Question 6", "Question 7", "Question 8", "Question 9", "Question 10"
  ];

  useEffect(() => {
    let timer;
    if (isRecording) {
      timer = setInterval(() => {
        setRecordingTime(prevTime => prevTime + 1);
      }, 1000);
    } else {
      clearInterval(timer);
      setRecordingTime(0);
    }
    return () => clearInterval(timer);
  }, [isRecording]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  const handleSendQuestion = () => {
    console.log("Question sent:", question);
    setQuestion('');
  };

  const handleQuestionClick = (selectedQuestion) => {
    setQuestion(selectedQuestion);
  };

  const toggleInputMode = () => {
    setInputMode(inputMode === 'text' ? 'speech' : 'text');
    setIsRecording(false);
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
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
            <div 
              key={idx} 
              className="question-item" 
              onClick={() => handleQuestionClick(q)}
            >
              {q}
            </div>
          ))}
        </aside>

        <section className="avatar-chat-area">
          <img 
            className="avatar-image" 
            src="/images/avatar.png" 
            alt="User Avatar"
          />
          <div className="subtitle">Subtitle of the answer...</div>

          <div className="chat-input-area">
            <div className="toggle-switch">
              <span 
                className={`toggle-option ${inputMode === 'text' ? 'active' : ''}`} 
                onClick={() => setInputMode('text')}
              >Text</span>
              <span 
                className={`toggle-option ${inputMode === 'speech' ? 'active' : ''}`} 
                onClick={() => setInputMode('speech')}
              >Speech</span>
            </div>

            {inputMode === 'speech' && (
              <button 
                className={`microphone-icon ${isRecording ? 'recording' : ''}`} 
                onClick={toggleRecording}
              >
                🎤
              </button>
            )}

            <input
              type="text"
              placeholder="Ask me anything..."
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
            />

            <button className="send-btn" onClick={handleSendQuestion}>Send</button>
          </div>

          {isRecording && (
            <div className="recording-animation">
              <div className="waves">
                <div className="wave"></div>
                <div className="wave"></div>
                <div className="wave"></div>
              </div>
              <div className="timer">{formatTime(recordingTime)}</div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default MainPage;
