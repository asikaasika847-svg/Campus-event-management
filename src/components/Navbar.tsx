import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { NotificationBell } from './NotificationBell';

interface NavbarProps {
  currentView: 'home' | 'events' | 'dashboard' | 'admin' | 'about' | 'contact';
  onNavigate: (view: 'home' | 'events' | 'dashboard' | 'admin' | 'about' | 'contact') => void;
  onOpenAuth: (initialTab?: 'login' | 'register' | 'admin') => void;
  onOpenTestSuite?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  onOpenAuth,
  onOpenTestSuite,
}) => {
  const { user, profile, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const userDropdownRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);

  const isAdmin =
    user?.role === 'admin' ||
    user?.role === 'superadmin' ||
    user?.email === 'admin@campus.edu' ||
    user?.email === 'asikaasika847@gmail.com';

  // Navigate to Home and close menus
  const handleGoHome = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    setIsMobileMenuOpen(false);
    setIsUserDropdownOpen(false);
    onNavigate('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Generic navigation handler that always closes menus
  const handleNavClick = (view: 'home' | 'events' | 'dashboard' | 'admin' | 'about' | 'contact') => {
    setIsMobileMenuOpen(false);
    setIsUserDropdownOpen(false);
    onNavigate(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Logout handler
  const handleLogout = async () => {
    try {
      setIsMobileMenuOpen(false);
      setIsUserDropdownOpen(false);
      await logout();
      onNavigate('home');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        userDropdownRef.current &&
        !userDropdownRef.current.contains(event.target as Node)
      ) {
        setIsUserDropdownOpen(false);
      }

      if (
        isMobileMenuOpen &&
        navRef.current &&
        !navRef.current.contains(event.target as Node)
      ) {
        setIsMobileMenuOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMobileMenuOpen(false);
        setIsUserDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMobileMenuOpen]);

  return (
    <>
      <nav
        ref={navRef}
        className="navbar navbar-expand-lg navbar-dark bg-primary sticky-top shadow-sm py-2 position-relative"
        style={{ zIndex: 1030 }}
        aria-label="Main Campus Navigation"
      >
        <div className="container">
          {/* Brand Logo & Name - Always navigates directly to Home page */}
          <button
            type="button"
            className="navbar-brand navbar-brand-btn d-flex align-items-center gap-2 border-0 bg-transparent text-white p-0 text-decoration-none"
            onClick={handleGoHome}
            title="CampusEvent Portal - Click to go to Home Page"
            aria-label="CampusEvent University Portal - Go to Home Page"
          >
            <div
              className="d-flex align-items-center justify-content-center bg-white text-primary rounded-3 shadow-sm transition-transform"
              style={{ width: '42px', height: '42px', fontWeight: 800, fontSize: '1.25rem' }}
            >
              <i className="bi bi-mortarboard-fill"></i>
            </div>
            <div className="text-start">
              <div className="d-flex align-items-center gap-1">
                <span className="fw-bold fs-5 tracking-tight d-block leading-tight">CampusEvent</span>
                <span
                  className="badge bg-white text-primary bg-opacity-25 text-white border border-white border-opacity-25 d-none d-sm-inline-block px-1 py-0"
                  style={{ fontSize: '0.65rem' }}
                >
                  HOME
                </span>
              </div>
              <small className="text-white-50 d-block" style={{ fontSize: '0.72rem', letterSpacing: '0.5px' }}>
                UNIVERSITY PORTAL
              </small>
            </div>
          </button>

          {/* Right Mobile Actions: Notifications & Toggler */}
          <div className="d-flex align-items-center gap-2 d-lg-none">
            {user && (
              <NotificationBell onGoToDashboardTab={() => handleNavClick('dashboard')} />
            )}

            {/* Mobile Menu Toggler Button - Robust, doesn't hide fastly */}
            <button
              className="navbar-toggler border-0 shadow-none text-white d-flex align-items-center justify-content-center p-2 rounded-3 bg-white bg-opacity-10"
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-controls="navbarMainContent"
              aria-expanded={isMobileMenuOpen}
              aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              title={isMobileMenuOpen ? 'Close Menu' : 'Open Menu'}
            >
              {isMobileMenuOpen ? (
                <i className="bi bi-x-lg fs-5"></i>
              ) : (
                <i className="bi bi-list fs-4"></i>
              )}
            </button>
          </div>

          {/* Collapsible Content - Controlled by React State so it stays open reliably */}
          <div
            className={`collapse navbar-collapse ${isMobileMenuOpen ? 'show' : ''}`}
            id="navbarMainContent"
          >
            <ul className="navbar-nav me-auto mb-2 mb-lg-0 ms-lg-3 gap-lg-1">
              {/* Home Navigation Item */}
              <li className="nav-item">
                <button
                  type="button"
                  className={`nav-link border-0 bg-transparent text-start w-100 ${
                    currentView === 'home' ? 'active fw-bold text-white' : 'text-white-50'
                  }`}
                  onClick={handleGoHome}
                  title="Return to Home Page"
                >
                  <i className="bi bi-house-door-fill me-1 text-warning"></i> Home
                </button>
              </li>

              {/* Discover Events Navigation Item */}
              <li className="nav-item">
                <button
                  type="button"
                  className={`nav-link border-0 bg-transparent text-start w-100 ${
                    currentView === 'events' ? 'active fw-bold text-white' : 'text-white-50'
                  }`}
                  onClick={() => handleNavClick('events')}
                >
                  <i className="bi bi-calendar-event me-1"></i> Discover Events
                </button>
              </li>

              {/* About Navigation Item */}
              <li className="nav-item">
                <button
                  type="button"
                  className={`nav-link border-0 bg-transparent text-start w-100 ${
                    currentView === 'about' ? 'active fw-bold text-white' : 'text-white-50'
                  }`}
                  onClick={() => handleNavClick('about')}
                >
                  <i className="bi bi-info-circle me-1"></i> About
                </button>
              </li>

              {/* Contact Navigation Item */}
              <li className="nav-item">
                <button
                  type="button"
                  className={`nav-link border-0 bg-transparent text-start w-100 ${
                    currentView === 'contact' ? 'active fw-bold text-white' : 'text-white-50'
                  }`}
                  onClick={() => handleNavClick('contact')}
                >
                  <i className="bi bi-envelope me-1"></i> Contact
                </button>
              </li>

              {/* Student Dashboard Navigation Item (if logged in) */}
              {user && (
                <li className="nav-item">
                  <button
                    type="button"
                    className={`nav-link border-0 bg-transparent text-start w-100 ${
                      currentView === 'dashboard'
                        ? 'active fw-bold text-warning'
                        : 'text-warning-emphasis'
                    }`}
                    onClick={() => handleNavClick('dashboard')}
                  >
                    <i className="bi bi-person-badge me-1"></i> Student Dashboard
                  </button>
                </li>
              )}

              {/* Admin Console Nav Item */}
              <li className="nav-item">
                <button
                  type="button"
                  className={`nav-link border-0 bg-transparent text-start w-100 ${
                    currentView === 'admin'
                      ? 'active fw-bold text-danger-emphasis bg-white bg-opacity-15 rounded-pill'
                      : 'text-white-50'
                  }`}
                  onClick={() => handleNavClick('admin')}
                >
                  <i className="bi bi-shield-lock-fill me-1 text-danger"></i> Admin Console
                </button>
              </li>
            </ul>

            {/* Right Actions: Auth State & Notifications */}
            <div className="d-flex align-items-center gap-2 flex-wrap pt-2 pt-lg-0 border-top border-white border-opacity-10 border-lg-0">
              {/* Notification Bell (desktop view) */}
              {user && (
                <div className="d-none d-lg-block">
                  <NotificationBell onGoToDashboardTab={() => handleNavClick('dashboard')} />
                </div>
              )}

              {/* User Profile or Sign-in / Register buttons */}
              {user ? (
                <div className="dropdown position-relative" ref={userDropdownRef}>
                  <button
                    className="btn btn-light btn-sm dropdown-toggle d-flex align-items-center gap-2 rounded-pill px-3 py-1 shadow-sm"
                    type="button"
                    onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                    aria-expanded={isUserDropdownOpen}
                  >
                    <div
                      className={`rounded-circle text-white d-flex align-items-center justify-content-center ${
                        isAdmin ? 'bg-danger' : 'bg-primary'
                      }`}
                      style={{ width: '26px', height: '26px', fontSize: '0.8rem', fontWeight: 600 }}
                    >
                      {isAdmin ? (
                        <i className="bi bi-shield-fill"></i>
                      ) : profile?.fullName ? (
                        profile.fullName.charAt(0).toUpperCase()
                      ) : (
                        'S'
                      )}
                    </div>
                    <span className="text-truncate fw-medium" style={{ maxWidth: '140px' }}>
                      {isAdmin ? 'Admin' : profile?.fullName || user.displayName || 'Student'}
                    </span>
                  </button>

                  <ul
                    className={`dropdown-menu dropdown-menu-end shadow border-0 mt-2 ${
                      isUserDropdownOpen ? 'show' : ''
                    }`}
                    style={{ position: 'absolute', right: 0 }}
                  >
                    <li className="px-3 py-2 border-bottom">
                      <p className="mb-0 fw-bold small text-dark">{profile?.fullName || user.email}</p>
                      <p className="mb-0 text-muted" style={{ fontSize: '0.75rem' }}>
                        {isAdmin ? 'System Administrator' : `ID: ${profile?.studentId || 'Verified'}`}
                      </p>
                      <small
                        className={`badge ${
                          isAdmin
                            ? 'bg-danger-subtle text-danger border border-danger-subtle'
                            : 'bg-primary-subtle text-primary border border-primary-subtle'
                        } mt-1`}
                      >
                        {isAdmin ? 'Verified Admin Role' : profile?.department || 'Student'}
                      </small>
                    </li>
                    <li>
                      <button
                        type="button"
                        className="dropdown-item py-2 d-flex align-items-center gap-2"
                        onClick={() => handleNavClick('dashboard')}
                      >
                        <i className="bi bi-speedometer2 text-primary"></i> My Student Dashboard
                      </button>
                    </li>
                    <li>
                      <button
                        type="button"
                        className="dropdown-item py-2 d-flex align-items-center gap-2 text-danger"
                        onClick={() => handleNavClick('admin')}
                      >
                        <i className="bi bi-shield-lock-fill"></i> Admin Console
                      </button>
                    </li>
                    <li>
                      <hr className="dropdown-divider my-1" />
                    </li>
                    <li>
                      <button
                        type="button"
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
                    type="button"
                    className="btn btn-outline-light btn-sm rounded-pill px-3"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onOpenAuth('login');
                    }}
                  >
                    <i className="bi bi-box-arrow-in-right me-1"></i> Sign In
                  </button>
                  <button
                    type="button"
                    className="btn btn-warning btn-sm text-dark fw-semibold rounded-pill px-3 shadow-sm"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onOpenAuth('register');
                    }}
                  >
                    <i className="bi bi-person-plus me-1"></i> Student Register
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Backdrop when open for easy dismissal */}
      {isMobileMenuOpen && (
        <div
          className="d-lg-none position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50"
          style={{ zIndex: 1025 }}
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}
    </>
  );
};
