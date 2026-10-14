import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { firebaseService } from '../services/firebaseService';

interface AuthModalProps {
  isOpen: boolean;
  initialTab?: 'login' | 'register' | 'forgot';
  onClose: () => void;
  onSuccess: () => void;
}

const DEPARTMENTS = [
  'Computer Science & Engineering',
  'Electronics & Communication',
  'Information Technology',
  'Electrical & Electronics',
  'Mechanical Engineering',
  'Civil Engineering',
  'Biotechnology & Bioinformatics',
  'Business Administration (MBA/BBA)',
  'Physics & Quantum Sciences',
  'Design & Architecture',
];

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  initialTab = 'login',
  onClose,
  onSuccess,
}) => {
  const { login, registerStudent } = useAuth();
  const [activeTab, setActiveTab] = useState<'login' | 'register' | 'forgot'>(initialTab);

  // Form states
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Registration state
  const [fullName, setFullName] = useState('');
  const [collegeEmail, setCollegeEmail] = useState('');
  const [studentId, setStudentId] = useState('');
  const [department, setDepartment] = useState(DEPARTMENTS[0]);
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);

  // Forgot password state
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState<string | null>(null);

  // Status & error states
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  // Validation helpers
  const validateEmail = (email: string) => {
    return /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(email.trim());
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!loginEmail.trim()) {
      setErrorMessage('Please enter your college email.');
      return;
    }
    if (!validateEmail(loginEmail)) {
      setErrorMessage('Please enter a valid email format (e.g. student@campus.edu).');
      return;
    }
    if (!loginPassword) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setSubmitting(true);
    try {
      await login(loginEmail, loginPassword);
      onSuccess();
      onClose();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Invalid credentials. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validation
    if (!fullName.trim() || fullName.trim().length < 2) {
      setErrorMessage('Full Name must be at least 2 characters.');
      return;
    }
    if (!validateEmail(collegeEmail)) {
      setErrorMessage('Please enter a valid college email format (e.g. name@campus.edu).');
      return;
    }
    if (!studentId.trim() || studentId.trim().length < 3) {
      setErrorMessage('Student ID must be at least 3 alphanumeric characters (e.g. CS20230492).');
      return;
    }
    if (!department) {
      setErrorMessage('Please select your academic department.');
      return;
    }
    if (!regPassword || regPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setErrorMessage('Passwords do not match. Please re-enter.');
      return;
    }

    setSubmitting(true);
    try {
      await registerStudent({
        fullName: fullName.trim(),
        collegeEmail: collegeEmail.trim(),
        studentId: studentId.trim(),
        department,
        password: regPassword,
      });
      onSuccess();
      onClose();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Registration failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setForgotSuccess(null);

    if (!validateEmail(forgotEmail)) {
      setErrorMessage('Please enter a valid registered college email address.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await firebaseService.sendPasswordReset(forgotEmail);
      setForgotSuccess(res.message);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Password reset failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="modal fade show d-block bg-dark bg-opacity-75"
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      style={{ backdropFilter: 'blur(5px)' }}
    >
      <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '480px' }}>
        <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
          {/* Header */}
          <div className="modal-header border-0 bg-primary text-white p-4 pb-3">
            <div className="d-flex align-items-center gap-2">
              <div
                className="bg-white text-primary rounded-3 d-flex align-items-center justify-content-center shadow-sm"
                style={{ width: '36px', height: '36px', fontSize: '1.2rem' }}
              >
                <i className="bi bi-mortarboard-fill"></i>
              </div>
              <div>
                <h5 className="modal-title fw-bold mb-0">Student Portal</h5>
                <small className="text-white-50">Campus Event Management System</small>
              </div>
            </div>
            <button
              type="button"
              className="btn-close btn-close-white"
              onClick={onClose}
              aria-label="Close"
            ></button>
          </div>

          {/* Navigation Tabs */}
          <div className="d-flex border-bottom bg-light px-3 pt-2">
            <button
              className={`btn flex-grow-1 border-0 rounded-top-3 py-2 fw-semibold small ${
                activeTab === 'login' ? 'bg-white text-primary border-bottom border-2 border-primary' : 'text-muted'
              }`}
              onClick={() => {
                setActiveTab('login');
                setErrorMessage(null);
              }}
            >
              <i className="bi bi-box-arrow-in-right me-1"></i> Sign In
            </button>
            <button
              className={`btn flex-grow-1 border-0 rounded-top-3 py-2 fw-semibold small ${
                activeTab === 'register' ? 'bg-white text-primary border-bottom border-2 border-primary' : 'text-muted'
              }`}
              onClick={() => {
                setActiveTab('register');
                setErrorMessage(null);
              }}
            >
              <i className="bi bi-person-plus me-1"></i> Register Student
            </button>
            {activeTab === 'forgot' && (
              <button className="btn flex-grow-1 border-0 rounded-top-3 py-2 fw-semibold small bg-white text-primary border-bottom border-2 border-primary">
                <i className="bi bi-key me-1"></i> Reset Password
              </button>
            )}
          </div>

          {/* Body */}
          <div className="modal-body p-4">
            {/* Error Message */}
            {errorMessage && (
              <div className="alert alert-danger d-flex align-items-center gap-2 alert-dismissible fade show small py-2 px-3 mb-3" role="alert">
                <i className="bi bi-exclamation-triangle-fill text-danger"></i>
                <div className="flex-grow-1">{errorMessage}</div>
                <button type="button" className="btn-close p-2" onClick={() => setErrorMessage(null)}></button>
              </div>
            )}

            {/* TAB 1: LOGIN */}
            {activeTab === 'login' && (
              <form onSubmit={handleLoginSubmit} noValidate>
                <div className="mb-3">
                  <label htmlFor="loginEmailInput" className="form-label small fw-semibold text-dark">
                    College Email Address <span className="text-danger">*</span>
                  </label>
                  <div className="input-group">
                    <span className="input-group-text bg-light text-muted border-end-0">
                      <i className="bi bi-envelope"></i>
                    </span>
                    <input
                      id="loginEmailInput"
                      type="email"
                      className="form-control border-start-0 ps-1"
                      placeholder="e.g. student@campus.edu"
                      value={loginEmail}
                      onChange={e => setLoginEmail(e.target.value)}
                      required
                      autoComplete="username"
                    />
                  </div>
                  <div className="d-flex flex-wrap gap-2 mt-2">
                    <button
                      type="button"
                      className="btn btn-outline-primary btn-sm py-0 px-2 rounded-pill"
                      style={{ fontSize: '0.75rem' }}
                      onClick={() => {
                        setLoginEmail('alexandra.chen@campus.edu');
                        setLoginPassword('Campus#2026');
                      }}
                    >
                      Fill Demo Student
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline-danger btn-sm py-0 px-2 rounded-pill"
                      style={{ fontSize: '0.75rem' }}
                      onClick={() => {
                        setLoginEmail('admin@campus.edu');
                        setLoginPassword('Admin#Campus2026');
                      }}
                    >
                      <i className="bi bi-shield-lock-fill me-1"></i> Fill Admin Login
                    </button>
                  </div>
                </div>

                <div className="mb-3">
                  <div className="d-flex justify-content-between align-items-center">
                    <label htmlFor="loginPasswordInput" className="form-label small fw-semibold text-dark mb-1">
                      Password <span className="text-danger">*</span>
                    </label>
                    <button
                      type="button"
                      className="btn btn-link p-0 text-decoration-none small"
                      style={{ fontSize: '0.78rem' }}
                      onClick={() => {
                        setActiveTab('forgot');
                        setForgotEmail(loginEmail);
                        setErrorMessage(null);
                      }}
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="input-group">
                    <span className="input-group-text bg-light text-muted border-end-0">
                      <i className="bi bi-lock"></i>
                    </span>
                    <input
                      id="loginPasswordInput"
                      type={showLoginPassword ? 'text' : 'password'}
                      className="form-control border-start-0 border-end-0 ps-1"
                      placeholder="Enter your account password"
                      value={loginPassword}
                      onChange={e => setLoginPassword(e.target.value)}
                      required
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      className="btn btn-outline-secondary border-start-0"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      aria-label={showLoginPassword ? 'Hide password' : 'Show password'}
                    >
                      <i className={`bi ${showLoginPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                    </button>
                  </div>
                </div>

                <div className="d-flex justify-content-between align-items-center mb-4">
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="rememberMeCheckbox"
                      checked={rememberMe}
                      onChange={e => setRememberMe(e.target.checked)}
                    />
                    <label className="form-check-label small text-muted user-select-none" htmlFor="rememberMeCheckbox">
                      Keep me signed in
                    </label>
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary w-100 rounded-pill py-2 fw-semibold shadow-sm d-flex align-items-center justify-content-center gap-2"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                      Authenticating...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-box-arrow-in-right"></i> Sign In to Dashboard
                    </>
                  )}
                </button>

                <div className="text-center mt-3">
                  <span className="small text-muted">Don't have an account yet? </span>
                  <button
                    type="button"
                    className="btn btn-link p-0 text-decoration-none small fw-semibold"
                    onClick={() => {
                      setActiveTab('register');
                      setErrorMessage(null);
                    }}
                  >
                    Register here
                  </button>
                </div>
              </form>
            )}

            {/* TAB 2: REGISTER */}
            {activeTab === 'register' && (
              <form onSubmit={handleRegisterSubmit} noValidate>
                <div className="mb-3">
                  <label htmlFor="regFullNameInput" className="form-label small fw-semibold text-dark">
                    Full Name <span className="text-danger">*</span>
                  </label>
                  <div className="input-group">
                    <span className="input-group-text bg-light text-muted border-end-0">
                      <i className="bi bi-person"></i>
                    </span>
                    <input
                      id="regFullNameInput"
                      type="text"
                      className="form-control border-start-0 ps-1"
                      placeholder="e.g. Alexandra Chen"
                      value={fullName}
                      onChange={e => setFullName(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="row g-2 mb-3">
                  <div className="col-sm-7">
                    <label htmlFor="regEmailInput" className="form-label small fw-semibold text-dark">
                      College Email <span className="text-danger">*</span>
                    </label>
                    <input
                      id="regEmailInput"
                      type="email"
                      className="form-control"
                      placeholder="name@campus.edu"
                      value={collegeEmail}
                      onChange={e => setCollegeEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="col-sm-5">
                    <label htmlFor="regStudentIdInput" className="form-label small fw-semibold text-dark">
                      Student ID <span className="text-danger">*</span>
                    </label>
                    <input
                      id="regStudentIdInput"
                      type="text"
                      className="form-control text-uppercase"
                      placeholder="CS20230492"
                      value={studentId}
                      onChange={e => setStudentId(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="mb-3">
                  <label htmlFor="regDepartmentSelect" className="form-label small fw-semibold text-dark">
                    Academic Department <span className="text-danger">*</span>
                  </label>
                  <select
                    id="regDepartmentSelect"
                    className="form-select"
                    value={department}
                    onChange={e => setDepartment(e.target.value)}
                    required
                  >
                    {DEPARTMENTS.map(d => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="row g-2 mb-3">
                  <div className="col-sm-6">
                    <label htmlFor="regPasswordInput" className="form-label small fw-semibold text-dark">
                      Password <span className="text-danger">*</span>
                    </label>
                    <div className="input-group">
                      <input
                        id="regPasswordInput"
                        type={showRegPassword ? 'text' : 'password'}
                        className="form-control border-end-0"
                        placeholder="Min 6 characters"
                        value={regPassword}
                        onChange={e => setRegPassword(e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        className="btn btn-outline-secondary border-start-0"
                        onClick={() => setShowRegPassword(!showRegPassword)}
                        aria-label={showRegPassword ? 'Hide password' : 'Show password'}
                      >
                        <i className={`bi ${showRegPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                      </button>
                    </div>
                  </div>
                  <div className="col-sm-6">
                    <label htmlFor="regConfirmPasswordInput" className="form-label small fw-semibold text-dark">
                      Confirm Password <span className="text-danger">*</span>
                    </label>
                    <input
                      id="regConfirmPasswordInput"
                      type={showRegPassword ? 'text' : 'password'}
                      className="form-control"
                      placeholder="Repeat password"
                      value={regConfirmPassword}
                      onChange={e => setRegConfirmPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="bg-light p-2 rounded-2 border mb-3 small text-muted">
                  <i className="bi bi-shield-check text-success me-1"></i>
                  Zero-Trust Security: Passwords are encrypted in Firebase Authentication and never stored in Firestore database records.
                </div>

                <button
                  type="submit"
                  className="btn btn-primary w-100 rounded-pill py-2 fw-semibold shadow-sm d-flex align-items-center justify-content-center gap-2"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                      Registering Account...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-person-check"></i> Complete Student Registration
                    </>
                  )}
                </button>

                <div className="text-center mt-3">
                  <span className="small text-muted">Already registered? </span>
                  <button
                    type="button"
                    className="btn btn-link p-0 text-decoration-none small fw-semibold"
                    onClick={() => {
                      setActiveTab('login');
                      setErrorMessage(null);
                    }}
                  >
                    Sign In
                  </button>
                </div>
              </form>
            )}

            {/* TAB 3: FORGOT PASSWORD */}
            {activeTab === 'forgot' && (
              <form onSubmit={handleForgotSubmit} noValidate>
                <div className="text-center mb-3">
                  <div
                    className="rounded-circle bg-warning bg-opacity-25 text-warning-emphasis d-inline-flex align-items-center justify-content-center mb-2"
                    style={{ width: '48px', height: '48px', fontSize: '1.4rem' }}
                  >
                    <i className="bi bi-shield-lock"></i>
                  </div>
                  <h6 className="fw-bold text-dark">Reset Student Password</h6>
                  <p className="text-muted small mb-0">
                    Enter your registered college email and we will issue a secure reset link.
                  </p>
                </div>

                {forgotSuccess ? (
                  <div className="alert alert-success small py-3 px-3 mb-3" role="alert">
                    <i className="bi bi-check-circle-fill me-2 text-success"></i>
                    {forgotSuccess}
                    <div className="mt-2 pt-2 border-top">
                      <button
                        type="button"
                        className="btn btn-primary btn-sm rounded-pill w-100"
                        onClick={() => {
                          setActiveTab('login');
                          setForgotSuccess(null);
                        }}
                      >
                        Return to Sign In
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="mb-3">
                      <label htmlFor="forgotEmailInput" className="form-label small fw-semibold text-dark">
                        College Email Address <span className="text-danger">*</span>
                      </label>
                      <input
                        id="forgotEmailInput"
                        type="email"
                        className="form-control"
                        placeholder="student@campus.edu"
                        value={forgotEmail}
                        onChange={e => setForgotEmail(e.target.value)}
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      className="btn btn-primary w-100 rounded-pill py-2 fw-semibold shadow-sm d-flex align-items-center justify-content-center gap-2 mb-3"
                      disabled={submitting}
                    >
                      {submitting ? (
                        <>
                          <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                          Sending Reset Link...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-send"></i> Send Reset Link
                        </>
                      )}
                    </button>

                    <div className="text-center">
                      <button
                        type="button"
                        className="btn btn-link p-0 text-decoration-none small"
                        onClick={() => {
                          setActiveTab('login');
                          setErrorMessage(null);
                        }}
                      >
                        <i className="bi bi-arrow-left me-1"></i> Back to Sign In
                      </button>
                    </div>
                  </>
                )}
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
