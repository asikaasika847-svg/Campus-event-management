import React, { useState, useEffect } from 'react';
import { CampusEvent, EventRegistration } from '../types';
import { useAuth } from '../context/AuthContext';
import { firebaseService } from '../services/firebaseService';

interface EventDetailsModalProps {
  eventId: string | null;
  onClose: () => void;
  onOpenAuth: (initialTab?: 'login' | 'register') => void;
  onGoToDashboard: () => void;
  onEventUpdated: () => void;
}

export const EventDetailsModal: React.FC<EventDetailsModalProps> = ({
  eventId,
  onClose,
  onOpenAuth,
  onGoToDashboard,
  onEventUpdated,
}) => {
  const { user, profile } = useAuth();
  const [event, setEvent] = useState<CampusEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successRegistration, setSuccessRegistration] = useState<EventRegistration | null>(null);
  const [isAlreadyRegistered, setIsAlreadyRegistered] = useState(false);

  useEffect(() => {
    if (!eventId) return;

    let isMounted = true;
    setLoading(true);
    setErrorMsg(null);
    setSuccessRegistration(null);

    const loadData = async () => {
      try {
        const fetched = await firebaseService.getEventById(eventId);
        if (!isMounted) return;
        setEvent(fetched);

        // Check if user is already registered
        if (user && fetched) {
          try {
            const userRegs = await firebaseService.getStudentRegistrations(user.uid);
            const found = userRegs.find(r => r.eventId === eventId && r.status === 'confirmed');
            if (isMounted) {
              setIsAlreadyRegistered(!!found);
              if (found) {
                setSuccessRegistration(found);
              }
            }
          } catch (e) {
            console.warn('Check registration error:', e);
          }
        }
      } catch (err) {
        if (isMounted) {
          setErrorMsg(err instanceof Error ? err.message : 'Failed to load event details.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [eventId, user]);

  if (!eventId) return null;

  const handleRegister = async () => {
    if (!user) {
      onOpenAuth('login');
      return;
    }
    if (!event) return;

    setRegistering(true);
    setErrorMsg(null);

    try {
      const reg = await firebaseService.registerForEvent(event.id);
      setSuccessRegistration(reg);
      setIsAlreadyRegistered(true);
      // Refresh local event details
      const updated = await firebaseService.getEventById(event.id);
      if (updated) setEvent(updated);
      onEventUpdated();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Registration failed.');
    } finally {
      setRegistering(false);
    }
  };

  const seatsLeft = event ? Math.max(0, event.maxCapacity - event.registeredCount) : 0;
  const isFull = seatsLeft === 0;
  const isDeadlinePassed = event ? new Date() > new Date(event.registrationDeadline) : false;
  const isCancelled = event?.isCancelled ?? false;

  return (
    <div
      className="modal fade show d-block bg-dark bg-opacity-75"
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      style={{ backdropFilter: 'blur(4px)' }}
    >
      <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
        <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
          {/* Header */}
          <div className="modal-header bg-primary text-white py-3 px-4">
            <div className="d-flex align-items-center gap-2">
              <i className="bi bi-calendar2-event-fill fs-5"></i>
              <h5 className="modal-title fw-bold">Event Details & Student RSVP</h5>
            </div>
            <button
              type="button"
              className="btn-close btn-close-white"
              onClick={onClose}
              aria-label="Close"
            ></button>
          </div>

          {/* Body */}
          <div className="modal-body p-0">
            {loading ? (
              <div className="p-5 text-center">
                <div className="spinner-border text-primary mb-3" role="status">
                  <span className="visually-hidden">Loading event...</span>
                </div>
                <p className="text-muted fw-medium">Loading event information from Firestore...</p>
              </div>
            ) : !event ? (
              <div className="p-5 text-center">
                <div className="text-danger fs-1 mb-2">
                  <i className="bi bi-exclamation-octagon"></i>
                </div>
                <h5 className="fw-bold">Event Not Found</h5>
                <p className="text-muted">The requested event could not be found or has been removed.</p>
                <button className="btn btn-primary btn-sm rounded-pill px-4" onClick={onClose}>
                  Back to Catalog
                </button>
              </div>
            ) : (
              <div>
                {/* Event Poster Banner */}
                <div className="position-relative" style={{ height: '260px' }}>
                  <img
                    src={event.posterUrl}
                    alt={event.title}
                    className="w-100 h-100 object-fit-cover"
                  />
                  <div
                    className="position-absolute top-0 start-0 w-100 h-100"
                    style={{
                      background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 60%)',
                    }}
                  ></div>
                  <div className="position-absolute bottom-0 start-0 p-4 text-white w-100">
                    <div className="d-flex flex-wrap gap-2 mb-2">
                      <span className="badge bg-primary shadow-sm">{event.category}</span>
                      {isCancelled ? (
                        <span className="badge bg-danger shadow-sm">Cancelled</span>
                      ) : isFull ? (
                        <span className="badge bg-danger shadow-sm">Full Capacity</span>
                      ) : isDeadlinePassed ? (
                        <span className="badge bg-secondary shadow-sm">Registration Closed</span>
                      ) : (
                        <span className="badge bg-success shadow-sm">{seatsLeft} Seats Available</span>
                      )}
                    </div>
                    <h3 className="fw-bold mb-0 text-white shadow-sm">{event.title}</h3>
                  </div>
                </div>

                {/* Content Details */}
                <div className="p-4">
                  {/* Alerts */}
                  {errorMsg && (
                    <div className="alert alert-danger d-flex align-items-center gap-2 alert-dismissible fade show" role="alert">
                      <i className="bi bi-exclamation-triangle-fill fs-5"></i>
                      <div className="small flex-grow-1">{errorMsg}</div>
                      <button type="button" className="btn-close" onClick={() => setErrorMsg(null)}></button>
                    </div>
                  )}

                  {successRegistration && (
                    <div className="alert alert-success d-flex align-items-center gap-3 rounded-3 shadow-sm mb-4" role="alert">
                      <i className="bi bi-check-circle-fill fs-3 text-success"></i>
                      <div className="flex-grow-1">
                        <strong className="d-block">Registration Confirmed!</strong>
                        <span className="small text-muted">
                          Confirmation ID: <code>{successRegistration.id}</code>. Your student pass is verified and active.
                        </span>
                      </div>
                      <button
                        className="btn btn-outline-success btn-sm rounded-pill fw-semibold"
                        onClick={onGoToDashboard}
                      >
                        View in Dashboard
                      </button>
                    </div>
                  )}

                  {/* Metadata Grid */}
                  <div className="row g-3 mb-4">
                    <div className="col-sm-6 col-lg-3">
                      <div className="p-3 bg-light rounded-3 border h-100">
                        <small className="text-muted d-block mb-1">
                          <i className="bi bi-calendar-check text-primary me-1"></i> Event Date
                        </small>
                        <span className="fw-bold text-dark d-block">
                          {new Date(event.eventDate).toLocaleDateString(undefined, {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                    </div>

                    <div className="col-sm-6 col-lg-3">
                      <div className="p-3 bg-light rounded-3 border h-100">
                        <small className="text-muted d-block mb-1">
                          <i className="bi bi-clock-fill text-primary me-1"></i> Timings
                        </small>
                        <span className="fw-bold text-dark d-block">
                          {event.startTime} - {event.endTime}
                        </span>
                      </div>
                    </div>

                    <div className="col-sm-6 col-lg-3">
                      <div className="p-3 bg-light rounded-3 border h-100">
                        <small className="text-muted d-block mb-1">
                          <i className="bi bi-geo-alt-fill text-danger me-1"></i> Venue
                        </small>
                        <span className="fw-bold text-dark d-block text-truncate" title={event.venue}>
                          {event.venue}
                        </span>
                      </div>
                    </div>

                    <div className="col-sm-6 col-lg-3">
                      <div className="p-3 bg-light rounded-3 border h-100">
                        <small className="text-muted d-block mb-1">
                          <i className="bi bi-people-fill text-info me-1"></i> Capacity
                        </small>
                        <span className="fw-bold text-dark d-block">
                          {event.registeredCount} / {event.maxCapacity} ({seatsLeft} left)
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="mb-4">
                    <h6 className="fw-bold text-dark mb-2">About This Event</h6>
                    <p className="text-secondary" style={{ lineHeight: 1.7, whiteSpace: 'pre-line' }}>
                      {event.description}
                    </p>
                  </div>

                  {/* Organizer & Deadline Details */}
                  <div className="row g-3 p-3 bg-light rounded-3 border mb-3">
                    <div className="col-md-6">
                      <small className="text-muted d-block">Organized By:</small>
                      <strong className="text-dark">{event.organizer}</strong>
                    </div>
                    <div className="col-md-6">
                      <small className="text-muted d-block">Registration Deadline:</small>
                      <span className={isDeadlinePassed ? 'text-danger fw-bold' : 'text-dark fw-semibold'}>
                        {new Date(event.registrationDeadline).toLocaleDateString(undefined, {
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric',
                        })}{' '}
                        at{' '}
                        {new Date(event.registrationDeadline).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Guest Login Banner */}
                  {!user && (
                    <div className="alert alert-primary bg-primary-subtle border-primary-subtle d-flex flex-wrap align-items-center justify-content-between gap-2 p-3 rounded-3 mb-0">
                      <div className="d-flex align-items-center gap-2">
                        <i className="bi bi-shield-lock text-primary fs-4"></i>
                        <div>
                          <strong className="text-dark d-block">Student Authentication Required</strong>
                          <span className="small text-muted">
                            Only enrolled students with valid college credentials can register for campus events.
                          </span>
                        </div>
                      </div>
                      <div className="d-flex gap-2">
                        <button
                          className="btn btn-primary btn-sm rounded-pill px-3"
                          onClick={() => onOpenAuth('login')}
                        >
                          Sign In
                        </button>
                        <button
                          className="btn btn-outline-primary btn-sm rounded-pill px-3"
                          onClick={() => onOpenAuth('register')}
                        >
                          Register
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Logged in Student Info Preview */}
                  {user && profile && (
                    <div className="bg-light p-3 rounded-3 border small mb-0">
                      <span className="text-muted d-block mb-1">
                        Registering as: <strong>{profile.fullName}</strong> ({profile.studentId})
                      </span>
                      <span className="text-muted">
                        Department: <strong>{profile.department}</strong> | Email: <strong>{profile.collegeEmail}</strong>
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer Controls */}
          {event && (
            <div className="modal-footer bg-light px-4 py-3 d-flex justify-content-between">
              <button type="button" className="btn btn-outline-secondary rounded-pill px-4" onClick={onClose}>
                Close
              </button>

              <div>
                {isAlreadyRegistered ? (
                  <button
                    className="btn btn-success rounded-pill px-4 fw-semibold d-flex align-items-center gap-2"
                    onClick={onGoToDashboard}
                  >
                    <i className="bi bi-check-circle-fill"></i> View In My Dashboard
                  </button>
                ) : isCancelled ? (
                  <button className="btn btn-secondary rounded-pill px-4" disabled>
                    <i className="bi bi-slash-circle me-1"></i> Event Cancelled
                  </button>
                ) : isDeadlinePassed ? (
                  <button className="btn btn-secondary rounded-pill px-4" disabled>
                    <i className="bi bi-clock-history me-1"></i> Deadline Expired
                  </button>
                ) : isFull ? (
                  <button className="btn btn-danger rounded-pill px-4" disabled>
                    <i className="bi bi-exclamation-circle me-1"></i> Full Capacity (0 Seats)
                  </button>
                ) : !user ? (
                  <button
                    className="btn btn-primary rounded-pill px-4 fw-bold shadow-sm d-flex align-items-center gap-2"
                    onClick={() => onOpenAuth('login')}
                  >
                    <i className="bi bi-box-arrow-in-right"></i> Sign In to Register
                  </button>
                ) : (
                  <button
                    className="btn btn-primary rounded-pill px-4 fw-bold shadow-sm d-flex align-items-center gap-2"
                    onClick={handleRegister}
                    disabled={registering}
                  >
                    {registering ? (
                      <>
                        <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                        Reserving Seat...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-ticket-perforated-fill"></i> Register Now (Free)
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
