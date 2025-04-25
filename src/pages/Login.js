import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

function Login({ setToken }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false); // State for toggling password visibility
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      console.log('Sending login request:', { username });
      const res = await axios.post('https://recipehub-h224.onrender.com/login', {
        username,
        password,
      });
      console.log('Login response:', res.data);
      const token = res.data.token;
      if (!token) {
        throw new Error('No token received from server');
      }
      localStorage.setItem('token', token);
      setToken(token); // Update App.js state
      console.log('Navigating to /');
      navigate('/', { replace: true });
    } catch (err) {
      console.error('Login error:', err.response || err.message || err);
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
        Don't have an account? <Link to="/register">Sign Up here</Link>
      </p>
    </div>
  );
}

export default Login;