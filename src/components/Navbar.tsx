import React from 'react';
import { useAuth } from '../context/AuthContext';

import { NotificationBell } from './NotificationBell';

interface NavbarProps {
  currentView: 'home' | 'events' | 'dashboard' | 'admin' | 'about' | 'contact';
  onNavigate: (view: 'home' | 'events' | 'dashboard' | 'admin' | 'about' | 'contact') => void;
  onOpenAuth: (initialTab?: 'login' | 'register' | 'admin') => void;
  onOpenTestSuite: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  onOpenAuth,
  onOpenTestSuite,
}) => {
  const { user, profile, logout } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin' || user?.email === 'admin@campus.edu' || user?.email === 'asikaasika847@gmail.com';

  const handleLogout = async () => {
    try {
      await logout();
      onNavigate('home');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-primary sticky-top shadow-sm py-2">
      <div className="container">
        {/* Brand Logo & Name */}
        <button
          className="navbar-brand d-flex align-items-center gap-2 border-0 bg-transparent text-white p-0"
          onClick={() => onNavigate('home')}
          style={{ textDecoration: 'none' }}
        >
          <div
            className="d-flex align-items-center justify-content-center bg-white text-primary rounded-3 shadow-sm"
            style={{ width: '40px', height: '40px', fontWeight: 800, fontSize: '1.2rem' }}
          >
            <i className="bi bi-mortarboard-fill"></i>
          </div>
          <div className="text-start">
            <span className="fw-bold fs-5 tracking-tight d-block leading-tight">CampusEvent</span>
            <small className="text-white-50 d-block" style={{ fontSize: '0.72rem', letterSpacing: '0.5px' }}>
              UNIVERSITY PORTAL
            </small>
          </div>
        </button>

        {/* Mobile Toggler */}
        <button
          className="navbar-toggler border-0 shadow-none text-white"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarMainContent"
          aria-controls="navbarMainContent"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        {/* Collapsible Content */}
        <div className="collapse navbar-collapse" id="navbarMainContent">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0 ms-lg-3 gap-lg-1">
            <li className="nav-item">
              <button
                className={`nav-link border-0 bg-transparent text-start ${currentView === 'home' ? 'active fw-semibold' : ''}`}
                onClick={() => onNavigate('home')}
              >
                <i className="bi bi-house-door me-1"></i> Home
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link border-0 bg-transparent text-start ${currentView === 'events' ? 'active fw-semibold' : ''}`}
                onClick={() => onNavigate('events')}
              >
                <i className="bi bi-calendar-event me-1"></i> Discover Events
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link border-0 bg-transparent text-start ${currentView === 'about' ? 'active fw-semibold' : ''}`}
                onClick={() => onNavigate('about')}
              >
                <i className="bi bi-info-circle me-1"></i> About
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link border-0 bg-transparent text-start ${currentView === 'contact' ? 'active fw-semibold' : ''}`}
                onClick={() => onNavigate('contact')}
              >
                <i className="bi bi-envelope me-1"></i> Contact
              </button>
            </li>
            {user && (
              <li className="nav-item">
                <button
                  className={`nav-link border-0 bg-transparent text-start ${currentView === 'dashboard' ? 'active fw-semibold text-warning' : 'text-warning-emphasis'}`}
                  onClick={() => onNavigate('dashboard')}
                >
                  <i className="bi bi-person-badge me-1"></i> Student Dashboard
                </button>
              </li>
            )}
            {/* Admin Console Nav Item */}
            <li className="nav-item">
              <button
                className={`nav-link border-0 bg-transparent text-start ${currentView === 'admin' ? 'active fw-semibold text-danger-emphasis bg-white bg-opacity-10 rounded-pill' : 'text-white-50'}`}
                onClick={() => onNavigate('admin')}
              >
                <i className="bi bi-shield-lock-fill me-1 text-danger"></i> Admin Console
              </button>
            </li>
          </ul>

          {/* Right Actions: Test Suite & Auth State */}
          <div className="d-flex align-items-center gap-2 flex-wrap">
            {/* Automated Test Suite Button */}
            <button
              className="btn btn-outline-light btn-sm d-flex align-items-center gap-1 rounded-pill px-3"
              onClick={onOpenTestSuite}
              title="Run Automated Verification Test Suite"
            >
              <i className="bi bi-shield-check text-warning"></i>
              <span className="d-none d-sm-inline">Run Tests</span>
            </button>

            {user && (
              <NotificationBell onGoToDashboardTab={() => onNavigate('dashboard')} />
            )}

            {user ? (
              <div className="dropdown">
                <button
                  className="btn btn-light btn-sm dropdown-toggle d-flex align-items-center gap-2 rounded-pill px-3 py-1 shadow-sm"
                  type="button"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  <div
                    className={`rounded-circle text-white d-flex align-items-center justify-content-center ${isAdmin ? 'bg-danger' : 'bg-primary'}`}
                    style={{ width: '26px', height: '26px', fontSize: '0.8rem', fontWeight: 600 }}
                  >
                    {isAdmin ? <i className="bi bi-shield-fill"></i> : profile?.fullName ? profile.fullName.charAt(0).toUpperCase() : 'S'}
                  </div>
                  <span className="text-truncate fw-medium" style={{ maxWidth: '140px' }}>
                    {isAdmin ? 'Admin' : profile?.fullName || user.displayName || 'Student'}
                  </span>
                </button>
                <ul className="dropdown-menu dropdown-menu-end shadow border-0 mt-2">
                  <li className="px-3 py-2 border-bottom">
                    <p className="mb-0 fw-bold small text-dark">{profile?.fullName || user.email}</p>
                    <p className="mb-0 text-muted" style={{ fontSize: '0.75rem' }}>
                      {isAdmin ? 'System Administrator' : `ID: ${profile?.studentId || 'Verified'}`}
                    </p>
                    <small className={`badge ${isAdmin ? 'bg-danger-subtle text-danger border border-danger-subtle' : 'bg-primary-subtle text-primary border border-primary-subtle'} mt-1`}>
                      {isAdmin ? 'Verified Admin Role' : profile?.department || 'Student'}
                    </small>
                  </li>
                  <li>
                    <button
                      className="dropdown-item py-2 d-flex align-items-center gap-2"
                      onClick={() => onNavigate('dashboard')}
                    >
                      <i className="bi bi-speedometer2 text-primary"></i> My Student Dashboard
                    </button>
                  </li>
                  <li>
                    <button
                      className="dropdown-item py-2 d-flex align-items-center gap-2 text-danger"
                      onClick={() => onNavigate('admin')}
                    >
                      <i className="bi bi-shield-lock-fill"></i> Admin Console
                    </button>
                  </li>
                  <li>
                    <hr className="dropdown-divider my-1" />
                  </li>
                  <li>
                    <button
                      className="dropdown-item py-2 d-flex align-items-center gap-2 text-danger"
                      onClick={handleLogout}
                    >
                      <i className="bi bi-box-arrow-right"></i> Log Out
                    </button>
                  </li>
                </ul>
              </div>
            ) : (
              <div className="d-flex align-items-center gap-2">
                <button
                  className="btn btn-outline-light btn-sm rounded-pill px-3"
                  onClick={() => onOpenAuth('login')}
                >
                  <i className="bi bi-box-arrow-in-right me-1"></i> Sign In
                </button>
                <button
                  className="btn btn-warning btn-sm text-dark fw-semibold rounded-pill px-3 shadow-sm"
                  onClick={() => onOpenAuth('register')}
                >
                  <i className="bi bi-person-plus me-1"></i> Student Register
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
