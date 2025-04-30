import React, { useState, useEffect } from 'react';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import axios from 'axios';
import './MainPage.css';

// List of Healthcare Survey questions
const surveyQuestions = [
  "Have you visited a clinic in the last month?",
  "Do you have a nearby clinic or health facility?",
  "Have you visited a doctor in the past three months?",
  "Are you able to afford the medicines you’re prescribed?",
  "Do you or your family have any ongoing medical conditions?",
  "Have you received any vaccinations in the last year?",
  "Do you feel confident in the skills of local healthcare providers?",
  "Have you experienced any delays in receiving medical treatment?",
  "Do you have access to emergency medical services?",
  "Are you satisfied with the cleanliness of local clinics?",
  "Do you have to travel far to get medical care?",
  "Do women in your household receive proper maternal care?",
  "How do you usually pay for medical expenses?",
  "Are medical staff respectful when treating you?",
  "Do you have access to mental health support?",
  "Have you ever used a mobile health app or online doctor service?",
  "Do you have access to dental care?",
  "Have you ever missed a medical appointment due to transport issues?",
  "Do you feel your health concerns are taken seriously?",
  "Is there enough medicine available at the local clinic?"
];

const MainPage = () => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userResponse, setUserResponse] = useState('');
  const [responses, setResponses] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { transcript, resetTranscript, listening } = useSpeechRecognition();

  // Use effect to start asking questions when the page loads
  useEffect(() => {
    if (surveyQuestions.length > 0) {
      askQuestion();
    }
  }, []);

  const askQuestion = () => {
    const question = surveyQuestions[currentQuestionIndex];
    if (question) {
      setUserResponse('');
      SpeechRecognition.startListening({ continuous: true });
    }
  };

  const handleSubmitResponse = async () => {
    if (userResponse.trim() === '') return;

    setIsSubmitting(true);

    // Store response in the database
    try {
      await axios.post('/api/survey/submit', {
        question: surveyQuestions[currentQuestionIndex],
        response: userResponse
      });
      setResponses(prev => [...prev, { question: surveyQuestions[currentQuestionIndex], response: userResponse }]);
      moveToNextQuestion();
    } catch (error) {
      console.error('Error submitting response:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const moveToNextQuestion = () => {
    if (currentQuestionIndex < surveyQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      askQuestion();
    } else {
      alert('Thank you for completing the survey!');
    }
  };

  // Speech-to-text response handler
  useEffect(() => {
    if (transcript && !listening) {
      setUserResponse(transcript);
    }
  }, [transcript, listening]);

  return (
    <div className="main-page">
      <div className="avatar-container">
        <img
          src="avatar-image-url.jpg" // Replace with the actual avatar image URL
          alt="Avatar"
          className="avatar"
        />
        <div className="avatar-speech-bubble">
          <p>{surveyQuestions[currentQuestionIndex]}</p>
        </div>
      </div>

      <div className="response-box">
        <h3>Question:</h3>
        <p className="question-text">{surveyQuestions[currentQuestionIndex]}</p>
        <div className="response-area">
          <textarea
            value={userResponse}
            onChange={e => setUserResponse(e.target.value)}
            placeholder="Your response will appear here..."
            rows="4"
          />
          <button
            onClick={handleSubmitResponse}
            disabled={isSubmitting}
            className="submit-response-btn"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Answer'}
          </button>
        </div>
      </div>

      {/* Subtitle Box displaying user response */}
      <div className="subtitle-box">
        <h4>Your Response:</h4>
        <p>{userResponse}</p>
      </div>
    </div>
  );
};

export default MainPage;
