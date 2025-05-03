import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

function Login({ setToken }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const apiUrl = process.env.REACT_APP_API_URL || 'https://recipehub-h224.onrender.com';

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    try {
      console.log('Sending login request:', { username }); // Debug log
      const res = await axios.post(`${apiUrl}/login`, {
        username,
        password,
      });
      console.log('Login response:', res.data); // Debug log
      const { token, username: returnedUsername } = res.data;
      if (!token) {
        throw new Error('No token received from server');
      }
      localStorage.setItem('token', token);
      localStorage.setItem('username', returnedUsername); // Store username
      setToken(token);
      console.log('Navigating to /recipes'); // Debug log
      navigate('/recipes', { replace: true });
    } catch (err) {
      console.error('Login error:', err.response || err.message || err); // Debug log
      setError(err.response?.data?.message || err.message || 'Login failed');
    }
  };

  const toggleShowPassword = () => {
    setShowPassword((prev) => !prev);
  };

  return (
    <div className="login-page">
      <h1>Login to RecipeHub</h1>
      {error && <p style={{ color: 'red', fontWeight: 'bold', margin: '10px 0' }}>{error}</p>}
      <form onSubmit={handleLogin}>
        <label>Username:</label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Enter your username"
          required
        />
        <label>Password:</label>
        <div className="password-wrapper">
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            required
          />
          <span
            className="eye-icon"
            onClick={toggleShowPassword}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                toggleShowPassword();
              }
            }}
          >
            <i className={showPassword ? 'fas fa-eye-slash' : 'fas fa-eye'}></i>
          </span>
        </div>
        <button type="submit">Login</button>
      </form>
      <p>
        Don't have an account? <Link to="/register">Register</Link>
      </p>
    </div>
  );
}

export default Login;