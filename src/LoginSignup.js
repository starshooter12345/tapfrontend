import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const LoginSignup = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    dob: ''
  });
  const [authType, setAuthType] = useState('login'); // 'login' or 'signup'

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const endpoint = authType === 'login' ? '/api/auth/login' : '/api/auth/signup';
    try {
      const response = await axios.post(endpoint, formData);

      // Save token and user data in localStorage
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));

      toast.success(`${authType === 'login' ? 'Logged in' : 'Signed up'} successfully!`);

      // Redirect user to profile or home page
      navigate('/profile'); // Redirect to profile page or main page

    } catch (error) {
      console.error('Error during authentication', error);
      toast.error(error.response?.data?.error || 'Authentication failed. Please try again.');
    }
  };

  return (
    <div className="auth-form-container">
      <h2>{authType === 'login' ? 'Login' : 'Sign Up'}</h2>
      <form onSubmit={handleSubmit}>
        {authType === 'signup' && (
          <div>
            <label>Username</label>
            <input type="text" name="username" value={formData.username} onChange={handleChange} required />
          </div>
        )}
        <div>
          <label>Email</label>
          <input type="email" name="email" value={formData.email} onChange={handleChange} required />
        </div>
        <div>
          <label>Password</label>
          <input type="password" name="password" value={formData.password} onChange={handleChange} required />
        </div>
        {authType === 'signup' && (
          <div>
            <label>Confirm Password</label>
            <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required />
          </div>
        )}
        {authType === 'signup' && (
          <div>
            <label>Date of Birth</label>
            <input type="date" name="dob" value={formData.dob} onChange={handleChange} required />
          </div>
        )}
        <button type="submit">{authType === 'login' ? 'Login' : 'Sign Up'}</button>
      </form>
      <p>
        {authType === 'login' ? 'Don\'t have an account?' : 'Already have an account?'}
        <span onClick={() => setAuthType(authType === 'login' ? 'signup' : 'login')}>
          {authType === 'login' ? 'Sign up' : 'Login'}
        </span>
      </p>
    </div>
  );
};

export default LoginSignup;
