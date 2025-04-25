import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

function Register() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const validateInputs = () => {
    let isValid = true;
    setUsernameError('');
    setPasswordError('');

    if (username.length < 6 || username.length > 15) {
      setUsernameError('Username must be between 6 and 15 characters.');
      isValid = false;
    }

    if (password.length < 8 || password.length > 20) {
      setPasswordError('Password must be between 8 and 20 characters.');
      isValid = false;
    }

    return isValid;
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateInputs()) {
      return;
    }

    try {
      const res = await axios.post('http://localhost:5000/register', {
        username,
        password,
      });
      setSuccess(res.data.message);
      setError('');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
      setSuccess('');
    }
  };

  const toggleShowPassword = () => {
    setShowPassword((prev) => !prev);
  };

  return (
    <div className="login-page">
      <h1>Register for RecipeHub</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {success && <p style={{ color: 'green' }}>{success}</p>}
      <form onSubmit={handleRegister}>
        <label>Username:</label>
        <input
          type="text"
          value={username}
          onChange={(e) => {
            setUsername(e.target.value);
            setUsernameError('');
          }}
          placeholder="Choose a username"
          required
        />
        {usernameError && <p className="username-error">{usernameError}</p>}
        <label>Password:</label>
        <div className="password-wrapper">
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setPasswordError('');
            }}
            placeholder="Choose a password"
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
        {passwordError && <p className="password-error">{passwordError}</p>}
        <button type="submit">Register</button>
      </form>
      <p>
        Already have an account? <Link to="/login">Login here</Link>
      </p>
    </div>
  );
}

export default Register;