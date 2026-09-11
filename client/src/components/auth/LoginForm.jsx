import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import nsiLogo from '../../assets/NSI_LOGO.png';
import { Eye, EyeOff, Lock, User, AlertCircle, Loader2, ArrowLeft } from 'lucide-react';

export default function LoginForm({ onBack }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [validationErrors, setValidationErrors] = useState({});

  const { login, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const validate = () => {
    const errors = {};
    if (!username.trim()) {
      errors.username = 'Username is required';
    }
    if (!password) {
      errors.password = 'Password is required';
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!validate()) {
      return;
    }

    try {
      const user = await login(username, password);
      const role = user?.role?.toUpperCase();
      if (role === 'ADMIN') {
        navigate('/admin', { replace: true });
      } else if (role === 'INSTRUCTOR') {
        navigate('/instructor', { replace: true });
      } else if (role === 'STUDENT') {
        navigate('/student', { replace: true });
      } else {
        navigate('/login', { replace: true });
      }
    } catch (err) {
      setErrorMessage(err.message || 'Invalid username or password.');
    }
  };

  return (
    <div className="auth-card auth-login-card">
      <div className="brand-header">
        <div className="brand-logo-wrapper">
          <img src={nsiLogo} alt="NSI Logo" className="brand-logo" />
        </div>
        <h1 className="brand-title">NSI IT LMS</h1>
        <p className="brand-company">A product of Nityashree Infosystems</p>
      </div>

      <div className="form-heading-wrapper">
        <h2 className="form-heading">Welcome Back</h2>
        <p className="form-subheading">Please sign in to access your portal</p>
      </div>

      {errorMessage && (
        <div className="auth-error-banner" role="alert">
          <AlertCircle size={18} className="error-icon" />
          <div className="error-text-content">
            <span className="error-title">Authentication Error</span>
            <span className="error-message">{errorMessage}</span>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="auth-form" noValidate>
        {/* Username field */}
        <div className="form-group">
          <label htmlFor="username-input" className="form-label">
            Username
          </label>
          <div className={`input-wrapper ${validationErrors.username ? 'input-error' : ''}`}>
            <User size={18} className="input-icon" />
            <input
              id="username-input"
              type="text"
              name="username"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                if (validationErrors.username) {
                  setValidationErrors((prev) => ({ ...prev, username: '' }));
                }
                if (errorMessage) setErrorMessage('');
              }}
              disabled={isLoading}
              placeholder="Enter your username"
              className="form-input"
              autoComplete="username"
              autoFocus
              required
            />
          </div>
          {validationErrors.username && (
            <span className="field-error-text">{validationErrors.username}</span>
          )}
        </div>

        {/* Password field */}
        <div className="form-group">
          <label htmlFor="password-input" className="form-label">
            Password
          </label>
          <div className={`input-wrapper ${validationErrors.password ? 'input-error' : ''}`}>
            <Lock size={18} className="input-icon" />
            <input
              id="password-input"
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (validationErrors.password) {
                  setValidationErrors((prev) => ({ ...prev, password: '' }));
                }
                if (errorMessage) setErrorMessage('');
              }}
              disabled={isLoading}
              placeholder="Enter your password"
              className="form-input form-input-password"
              autoComplete="current-password"
              required
            />
            <button
              type="button"
              className="password-toggle-btn"
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={0}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              disabled={isLoading}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {validationErrors.password && (
            <span className="field-error-text">{validationErrors.password}</span>
          )}
        </div>

        {/* Submit button */}
        <button
          type="submit"
          className="btn-primary btn-submit-login"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 size={18} className="spinner" />
              <span>Authenticating...</span>
            </>
          ) : (
            <span>Login</span>
          )}
        </button>

        {/* Back option */}
        {onBack && (
          <button
            type="button"
            className="btn-back-overview"
            onClick={onBack}
            disabled={isLoading}
          >
            <ArrowLeft size={16} />
            <span>Back to Overview</span>
          </button>
        )}
      </form>

      <div className="auth-card-footer">
        <Lock size={13} className="footer-lock-icon" />
        <span>Secure Role-Based Authentication</span>
      </div>
    </div>
  );
}
