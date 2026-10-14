import React from 'react';

interface HeroProps {
  onExploreEvents: () => void;
  onOpenRegister: () => void;
  isAuthenticated: boolean;
  onGoToDashboard: () => void;
}

export const Hero: React.FC<HeroProps> = ({
  onExploreEvents,
  onOpenRegister,
  isAuthenticated,
  onGoToDashboard,
}) => {
  return (
    <section className="position-relative overflow-hidden bg-gradient text-white py-5" style={{ background: 'linear-gradient(135deg, #0d3b66 0%, #1d4e89 50%, #001f54 100%)' }}>
      {/* Subtle background pattern */}
      <div
        className="position-absolute top-0 start-0 w-100 h-100 opacity-10 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      ></div>

      <div className="container position-relative py-lg-4">
        <div className="row align-items-center g-4">
          <div className="col-lg-7 text-center text-lg-start">
            <div className="d-inline-flex align-items-center gap-2 bg-white bg-opacity-10 border border-white border-opacity-25 rounded-pill px-3 py-1 mb-3">
              <span className="badge bg-warning text-dark fw-bold">Fall 2026</span>
              <span className="small text-white-50">Official University Events Gateway</span>
            </div>

            <h1 className="display-4 fw-extrabold mb-3 lh-sm tracking-tight">
              Discover Campus Events
            </h1>

            <p className="lead text-white-75 mb-4 pe-lg-4" style={{ fontSize: '1.15rem', color: '#e0e7ff' }}>
              Explore hackathons, cultural fests, academic symposiums, and sports championships.
              Reserve your seat instantly with your verified student credentials.
            </p>

            <div className="d-flex flex-wrap align-items-center justify-content-center justify-content-lg-start gap-3 mb-4">
              <button
                className="btn btn-warning btn-lg fw-bold text-dark rounded-pill px-4 py-2 shadow d-flex align-items-center gap-2"
                onClick={onExploreEvents}
              >
                <i className="bi bi-compass"></i> Explore Events
              </button>

              {isAuthenticated ? (
                <button
                  className="btn btn-outline-light btn-lg rounded-pill px-4 py-2 d-flex align-items-center gap-2"
                  onClick={onGoToDashboard}
                >
                  <i className="bi bi-speedometer2"></i> My Dashboard
                </button>
              ) : (
                <button
                  className="btn btn-outline-light btn-lg rounded-pill px-4 py-2 d-flex align-items-center gap-2"
                  onClick={onOpenRegister}
                >
                  <i className="bi bi-person-plus"></i> Student Registration
                </button>
              )}
            </div>

            {/* Quick Metrics */}
            <div className="row g-3 pt-3 border-top border-white border-opacity-20 text-start">
              <div className="col-4">
                <h4 className="fw-bold mb-0 text-warning">50+</h4>
                <small className="text-white-50" style={{ fontSize: '0.8rem' }}>Annual Events</small>
              </div>
              <div className="col-4">
                <h4 className="fw-bold mb-0 text-white">12,500+</h4>
                <small className="text-white-50" style={{ fontSize: '0.8rem' }}>Active Students</small>
              </div>
              <div className="col-4">
                <h4 className="fw-bold mb-0 text-info">100%</h4>
                <small className="text-white-50" style={{ fontSize: '0.8rem' }}>Free Admission</small>
              </div>
            </div>
          </div>

          <div className="col-lg-5 d-none d-lg-block">
            <div className="position-relative">
              <div className="rounded-4 overflow-hidden shadow-lg border border-white border-opacity-25 bg-dark">
                <img
                  src="https://images.unsplash.com/photo-1523580494863-6f3031224c94?auto=format&fit=crop&w=800&q=80"
                  alt="Campus auditorium event"
                  className="img-fluid w-100 object-fit-cover"
                  style={{ height: '360px' }}
                />
              </div>

              {/* Floating Highlight Card */}
              <div
                className="position-absolute bg-white text-dark rounded-3 shadow p-3 border border-light"
                style={{ bottom: '-20px', left: '-20px', maxWidth: '240px' }}
              >
                <div className="d-flex align-items-center gap-2 mb-1">
                  <span className="badge bg-success-subtle text-success border border-success-subtle">
                    Live Booking
                  </span>
                  <small className="text-muted fw-semibold">Instant RSVP</small>
                </div>
                <p className="small mb-0 text-secondary">
                  Real-time seat tracking with Zero-Trust student authentication.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
