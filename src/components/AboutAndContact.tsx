import React, { useState } from 'react';

export const AboutAndContact: React.FC = () => {
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName || !contactEmail || !contactMessage) return;
    setSubmitted(true);
    setTimeout(() => {
      setContactName('');
      setContactEmail('');
      setContactMessage('');
    }, 2000);
  };

  return (
    <>
      {/* About & Benefits Section */}
      <section id="about" className="py-5 bg-white border-top">
        <div className="container">
          <div className="row align-items-center g-5">
            <div className="col-lg-6">
              <span className="badge bg-primary-subtle text-primary border border-primary-subtle px-3 py-1 rounded-pill fw-semibold mb-2">
                About the Platform
              </span>
              <h2 className="fw-bold text-dark mb-3">Empowering Campus Student Life</h2>
              <p className="text-secondary mb-4" style={{ lineHeight: 1.7 }}>
                The Campus Event Management System (CEMS) is the centralized digital hub connecting students,
                faculty, and student clubs. Built on modern cloud architecture, it eliminates physical paperwork,
                prevents double-booking, and ensures fair, transparent seat reservations across all university colleges.
              </p>

              {/* Key Benefits */}
              <div className="row g-3">
                <div className="col-sm-6">
                  <div className="d-flex align-items-start gap-3 p-3 bg-light rounded-3 h-100">
                    <div className="rounded-circle bg-primary text-white p-2 d-flex align-items-center justify-content-center" style={{ width: '38px', height: '38px' }}>
                      <i className="bi bi-qr-code-scan"></i>
                    </div>
                    <div>
                      <h6 className="fw-bold mb-1 text-dark">Instant Digital Passes</h6>
                      <small className="text-muted">QR-code verified admission tickets issued upon reservation.</small>
                    </div>
                  </div>
                </div>

                <div className="col-sm-6">
                  <div className="d-flex align-items-start gap-3 p-3 bg-light rounded-3 h-100">
                    <div className="rounded-circle bg-success text-white p-2 d-flex align-items-center justify-content-center" style={{ width: '38px', height: '38px' }}>
                      <i className="bi bi-shield-check"></i>
                    </div>
                    <div>
                      <h6 className="fw-bold mb-1 text-dark">Zero-Trust Security</h6>
                      <small className="text-muted">ABAC rules protect student PII. Passwords are never stored in DB.</small>
                    </div>
                  </div>
                </div>

                <div className="col-sm-6">
                  <div className="d-flex align-items-start gap-3 p-3 bg-light rounded-3 h-100">
                    <div className="rounded-circle bg-warning text-dark p-2 d-flex align-items-center justify-content-center" style={{ width: '38px', height: '38px' }}>
                      <i className="bi bi-lightning-charge-fill"></i>
                    </div>
                    <div>
                      <h6 className="fw-bold mb-1 text-dark">Live Seat Tracking</h6>
                      <small className="text-muted">Transactional concurrency ensures zero seat overselling.</small>
                    </div>
                  </div>
                </div>

                <div className="col-sm-6">
                  <div className="d-flex align-items-start gap-3 p-3 bg-light rounded-3 h-100">
                    <div className="rounded-circle bg-info text-white p-2 d-flex align-items-center justify-content-center" style={{ width: '38px', height: '38px' }}>
                      <i className="bi bi-people-fill"></i>
                    </div>
                    <div>
                      <h6 className="fw-bold mb-1 text-dark">Cross-Disciplinary</h6>
                      <small className="text-muted">Discover events from engineering, arts, medicine, and business.</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-lg-6">
              <div className="position-relative">
                <img
                  src="https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=800&q=80"
                  alt="Students attending seminar"
                  className="img-fluid rounded-4 shadow-lg w-100 object-fit-cover"
                  style={{ height: '420px' }}
                />
                <div
                  className="position-absolute bottom-0 start-0 m-3 p-3 bg-white text-dark rounded-3 shadow border"
                  style={{ maxWidth: '280px' }}
                >
                  <div className="d-flex align-items-center gap-2 mb-1">
                    <i className="bi bi-star-fill text-warning"></i>
                    <strong className="small">Dean's Award for Innovation</strong>
                  </div>
                  <p className="small text-muted mb-0">
                    Voted #1 university digital platform by the Student Representative Council.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-5 bg-light border-top">
        <div className="container">
          <div className="row g-5">
            <div className="col-lg-5">
              <span className="badge bg-secondary-subtle text-secondary border border-secondary-subtle px-3 py-1 rounded-pill fw-semibold mb-2">
                Get in Touch
              </span>
              <h2 className="fw-bold text-dark mb-3">Event Desk & Support</h2>
              <p className="text-secondary mb-4">
                Have an event to list or facing an issue with your student account credentials?
                Our campus coordinator team is available during regular university office hours.
              </p>

              <div className="d-flex flex-column gap-3 mb-4">
                <div className="d-flex align-items-center gap-3">
                  <div className="rounded-circle bg-primary bg-opacity-10 text-primary p-3">
                    <i className="bi bi-geo-alt-fill fs-5"></i>
                  </div>
                  <div>
                    <strong className="d-block text-dark">Office Location</strong>
                    <span className="text-muted small">Dean of Student Affairs, Administrative Block-B, Floor 2</span>
                  </div>
                </div>

                <div className="d-flex align-items-center gap-3">
                  <div className="rounded-circle bg-primary bg-opacity-10 text-primary p-3">
                    <i className="bi bi-telephone-fill fs-5"></i>
                  </div>
                  <div>
                    <strong className="d-block text-dark">Helpline</strong>
                    <span className="text-muted small">+1 (555) 019-2834 / Ext. 402</span>
                  </div>
                </div>

                <div className="d-flex align-items-center gap-3">
                  <div className="rounded-circle bg-primary bg-opacity-10 text-primary p-3">
                    <i className="bi bi-envelope-fill fs-5"></i>
                  </div>
                  <div>
                    <strong className="d-block text-dark">Official Email</strong>
                    <span className="text-muted small">events-desk@campus.edu</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-lg-7">
              <div className="card border-0 shadow-sm rounded-4 p-4 p-lg-5 bg-white">
                <h4 className="fw-bold text-dark mb-3">Send an Inquiry</h4>

                {submitted && (
                  <div className="alert alert-success d-flex align-items-center gap-2 mb-3" role="alert">
                    <i className="bi bi-check-circle-fill"></i>
                    <div>Thank you! Your message has been sent to the student affairs desk.</div>
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  <div className="row g-3 mb-3">
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold text-dark">Your Name</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. Marcus Vance"
                        value={contactName}
                        onChange={e => setContactName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold text-dark">College Email</label>
                      <input
                        type="email"
                        className="form-control"
                        placeholder="student@campus.edu"
                        value={contactEmail}
                        onChange={e => setContactEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-dark">Subject / Event Category</label>
                    <select className="form-select">
                      <option>Registration / Ticket Inquiry</option>
                      <option>Event Organizer Partnership</option>
                      <option>Technical / Account Support</option>
                      <option>Venue & Accessibility Question</option>
                    </select>
                  </div>

                  <div className="mb-4">
                    <label className="form-label small fw-semibold text-dark">Message</label>
                    <textarea
                      className="form-control"
                      rows={4}
                      placeholder="Write your message here..."
                      value={contactMessage}
                      onChange={e => setContactMessage(e.target.value)}
                      required
                    ></textarea>
                  </div>

                  <button type="submit" className="btn btn-primary rounded-pill px-4 py-2 fw-semibold shadow-sm">
                    <i className="bi bi-send me-1"></i> Submit Message
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};
