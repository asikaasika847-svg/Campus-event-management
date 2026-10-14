import React from 'react';

interface FooterProps {
  onNavigate: (view: 'home' | 'events' | 'about' | 'contact') => void;
  onOpenAuth: (tab: 'login' | 'register') => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate, onOpenAuth }) => {
  return (
    <footer className="bg-dark text-white pt-5 pb-4 border-top border-secondary border-opacity-25">
      <div className="container">
        <div className="row g-4 mb-4">
          {/* Col 1: Brand & Description */}
          <div className="col-lg-4">
            <div className="d-flex align-items-center gap-2 mb-3">
              <div
                className="d-flex align-items-center justify-content-center bg-primary text-white rounded-3 shadow-sm"
                style={{ width: '38px', height: '38px', fontWeight: 800, fontSize: '1.2rem' }}
              >
                <i className="bi bi-mortarboard-fill"></i>
              </div>
              <div>
                <h5 className="fw-bold mb-0 text-white">CampusEvent</h5>
                <small className="text-white-50" style={{ fontSize: '0.72rem', letterSpacing: '0.5px' }}>
                  CENTRAL MANAGEMENT SYSTEM
                </small>
              </div>
            </div>
            <p className="text-secondary small mb-3 pe-lg-3" style={{ lineHeight: 1.6 }}>
              The official centralized platform for university student registrations, ticket verification, and event logistics. Built with Firebase Authentication & Cloud Firestore.
            </p>
            <div className="d-flex gap-2">
              <span className="badge bg-secondary bg-opacity-25 text-white-50 border border-secondary border-opacity-25">
                Version 2.4.0
              </span>
              <span className="badge bg-success bg-opacity-25 text-success border border-success border-opacity-25">
                All Systems Operational
              </span>
            </div>
          </div>

          {/* Col 2: Navigation Links */}
          <div className="col-6 col-lg-2">
            <h6 className="fw-bold text-uppercase text-white-50 small mb-3 tracking-wider">Navigation</h6>
            <ul className="list-unstyled d-flex flex-column gap-2 small">
              <li>
                <button
                  className="btn btn-link p-0 text-secondary text-decoration-none hover-white"
                  onClick={() => onNavigate('home')}
                >
                  Home Portal
                </button>
              </li>
              <li>
                <button
                  className="btn btn-link p-0 text-secondary text-decoration-none hover-white"
                  onClick={() => onNavigate('events')}
                >
                  Discover Events
                </button>
              </li>
              <li>
                <button
                  className="btn btn-link p-0 text-secondary text-decoration-none hover-white"
                  onClick={() => onNavigate('about')}
                >
                  About Platform
                </button>
              </li>
              <li>
                <button
                  className="btn btn-link p-0 text-secondary text-decoration-none hover-white"
                  onClick={() => onNavigate('contact')}
                >
                  Helpdesk & Support
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Student Services */}
          <div className="col-6 col-lg-3">
            <h6 className="fw-bold text-uppercase text-white-50 small mb-3 tracking-wider">Student Access</h6>
            <ul className="list-unstyled d-flex flex-column gap-2 small">
              <li>
                <button
                  className="btn btn-link p-0 text-secondary text-decoration-none hover-white"
                  onClick={() => onOpenAuth('login')}
                >
                  Student Sign In
                </button>
              </li>
              <li>
                <button
                  className="btn btn-link p-0 text-secondary text-decoration-none hover-white"
                  onClick={() => onOpenAuth('register')}
                >
                  Register New Student Account
                </button>
              </li>
              <li>
                <a href="#events-catalog" className="text-secondary text-decoration-none">
                  Available Workshops
                </a>
              </li>
              <li>
                <a href="#events-catalog" className="text-secondary text-decoration-none">
                  Symposium Schedule
                </a>
              </li>
            </ul>
          </div>

          {/* Col 4: Campus Security Guarantee */}
          <div className="col-lg-3">
            <h6 className="fw-bold text-uppercase text-white-50 small mb-3 tracking-wider">Security & Privacy</h6>
            <div className="p-3 bg-secondary bg-opacity-10 rounded-3 border border-secondary border-opacity-25 small text-secondary">
              <div className="d-flex align-items-center gap-2 mb-1 text-white">
                <i className="bi bi-shield-lock-fill text-warning"></i>
                <strong>Zero-Trust ABAC</strong>
              </div>
              <p className="mb-0" style={{ fontSize: '0.8rem' }}>
                Student IDs and profile PII are strictly isolated. Registrations are guarded by transactional locks to prevent seat duplication.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-4 border-top border-secondary border-opacity-25 d-flex flex-column flex-md-row align-items-center justify-content-between gap-3 text-secondary small">
          <div>
            &copy; {new Date().getFullYear()} Campus Event Management System. All rights reserved.
          </div>
          <div className="d-flex gap-3">
            <span>Dean of Student Affairs</span>
            <span>&bull;</span>
            <span>University IT Directorate</span>
            <span>&bull;</span>
            <span>Zero-Trust Architecture</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
