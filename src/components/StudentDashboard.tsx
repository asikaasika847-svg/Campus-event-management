import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { EventRegistration, CampusEvent, AppNotification } from '../types';
import { firebaseService } from '../services/firebaseService';

interface StudentDashboardProps {
  onSelectEventId: (eventId: string) => void;
  onExploreEvents: () => void;
  initialSection?: 'registrations' | 'notifications';
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  onSelectEventId,
  onExploreEvents,
  initialSection = 'registrations',
}) => {
  const { user, profile, logout, updateProfile, refreshProfile } = useAuth();
  const [dashboardView, setDashboardView] = useState<'registrations' | 'notifications'>(initialSection);
  const [registrations, setRegistrations] = useState<EventRegistration[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [notificationFilter, setNotificationFilter] = useState<'all' | 'unread'>('all');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'upcoming' | 'completed' | 'cancelled'>('upcoming');

  // Cancel action states
  const [cancellingReg, setCancellingReg] = useState<EventRegistration | null>(null);
  const [cancellingProgress, setCancellingProgress] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);
  const [actionErrorMsg, setActionErrorMsg] = useState<string | null>(null);

  // Profile Edit modal states
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [editFullName, setEditFullName] = useState(profile?.fullName || '');
  const [editDepartment, setEditDepartment] = useState(profile?.department || '');
  const [editPhone, setEditPhone] = useState(profile?.phone || '');
  const [editBio, setEditBio] = useState(profile?.bio || '');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileModalError, setProfileModalError] = useState<string | null>(null);

  // Digital Ticket view modal
  const [ticketModalReg, setTicketModalReg] = useState<EventRegistration | null>(null);

  const loadRegistrations = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setActionErrorMsg(null);
    try {
      const data = await firebaseService.getStudentRegistrations(user.uid);
      setRegistrations(data);
    } catch (err) {
      setActionErrorMsg(err instanceof Error ? err.message : 'Failed to retrieve registrations.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  const loadNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const data = await firebaseService.getStudentNotifications(user.uid);
      setNotifications(data);
    } catch (err) {
      console.warn('Failed to retrieve notifications:', err);
    }
  }, [user]);

  useEffect(() => {
    loadRegistrations();
    loadNotifications();

    const unsubscribe = firebaseService.onNotificationsChanged(() => {
      loadNotifications();
    });

    return () => {
      unsubscribe();
    };
  }, [loadRegistrations, loadNotifications]);

  // Sync edit profile form when profile changes
  useEffect(() => {
    if (profile) {
      setEditFullName(profile.fullName);
      setEditDepartment(profile.department);
      setEditPhone(profile.phone || '');
      setEditBio(profile.bio || '');
    }
  }, [profile]);

  // Tab Filtering
  const filteredRegistrations = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    return registrations.filter(reg => {
      if (activeTab === 'all') return true;
      if (activeTab === 'cancelled') return reg.status === 'cancelled';
      if (activeTab === 'completed') {
        return reg.status === 'attended' || (reg.status === 'confirmed' && reg.eventDate < todayStr);
      }
      if (activeTab === 'upcoming') {
        return reg.status === 'confirmed' && reg.eventDate >= todayStr;
      }
      return true;
    });
  }, [registrations, activeTab]);

  // Metrics
  const todayStr = new Date().toISOString().split('T')[0];
  const upcomingCount = registrations.filter(r => r.status === 'confirmed' && r.eventDate >= todayStr).length;
  const completedCount = registrations.filter(r => r.status === 'attended' || (r.status === 'confirmed' && r.eventDate < todayStr)).length;
  const cancelledCount = registrations.filter(r => r.status === 'cancelled').length;

  // Cancellation Execution
  const handleConfirmCancel = async () => {
    if (!cancellingReg) return;
    setCancellingProgress(true);
    setActionErrorMsg(null);
    try {
      await firebaseService.cancelRegistration(cancellingReg.id);
      setActionSuccessMsg(`Your registration for "${cancellingReg.eventTitle}" has been cancelled and seat released.`);
      setCancellingReg(null);
      await loadRegistrations();
    } catch (err) {
      setActionErrorMsg(err instanceof Error ? err.message : 'Failed to cancel registration.');
    } finally {
      setCancellingProgress(false);
    }
  };

  // Notification Action Handlers
  const unreadNotifCount = notifications.filter(n => !n.isRead).length;

  const filteredNotifications = useMemo(() => {
    if (notificationFilter === 'unread') {
      return notifications.filter(n => !n.isRead);
    }
    return notifications;
  }, [notifications, notificationFilter]);

  const handleMarkNotifRead = async (id: string) => {
    try {
      await firebaseService.markNotificationAsRead(id);
      await loadNotifications();
    } catch (err) {
      setActionErrorMsg(err instanceof Error ? err.message : 'Failed to update notification');
    }
  };

  const handleMarkAllNotifsRead = async () => {
    if (!user) return;
    try {
      await firebaseService.markAllNotificationsAsRead(user.uid);
      await loadNotifications();
      setActionSuccessMsg('All notifications have been marked as read.');
    } catch (err) {
      setActionErrorMsg(err instanceof Error ? err.message : 'Failed to update notifications');
    }
  };

  const handleDeleteNotif = async (id: string) => {
    try {
      await firebaseService.deleteNotification(id);
      await loadNotifications();
      setActionSuccessMsg('Notification removed.');
    } catch (err) {
      setActionErrorMsg(err instanceof Error ? err.message : 'Failed to delete notification');
    }
  };

  const getNotificationIcon = (type: AppNotification['type']) => {
    switch (type) {
      case 'registration_success':
        return <i className="bi bi-ticket-perforated-fill text-success fs-4"></i>;
      case 'registration_cancelled':
        return <i className="bi bi-x-circle-fill text-danger fs-4"></i>;
      case 'event_updated':
        return <i className="bi bi-calendar2-range-fill text-warning fs-4"></i>;
      case 'event_cancelled':
        return <i className="bi bi-exclamation-triangle-fill text-danger fs-4"></i>;
      case 'announcement':
      default:
        return <i className="bi bi-megaphone-fill text-primary fs-4"></i>;
    }
  };

  // Profile Save Execution with client-side & boundary validations
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileModalError(null);

    const name = editFullName.trim();
    if (!name || name.length < 2 || name.length > 100) {
      setProfileModalError('Full Legal Name must be between 2 and 100 characters.');
      return;
    }

    const dept = editDepartment.trim();
    if (!dept || dept.length < 2 || dept.length > 80) {
      setProfileModalError('Academic Department must be between 2 and 80 characters.');
      return;
    }

    const phone = editPhone.trim();
    if (phone) {
      if (phone.length > 20) {
        setProfileModalError('Phone number must not exceed 20 characters.');
        return;
      }
      const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/;
      if (!phoneRegex.test(phone)) {
        setProfileModalError('Please enter a valid contact phone number format (e.g. +1 (555) 234-5678).');
        return;
      }
    }

    const bio = editBio.trim();
    if (bio.length > 300) {
      setProfileModalError('Student Bio must not exceed 300 characters.');
      return;
    }

    setSavingProfile(true);
    try {
      await updateProfile({
        fullName: name,
        department: dept,
        phone: phone,
        bio: bio,
      });
      setIsEditProfileOpen(false);
      setActionSuccessMsg('Your student profile was updated successfully in Firestore.');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to update profile.';
      setProfileModalError(msg);
      setActionErrorMsg(msg);
    } finally {
      setSavingProfile(false);
    }
  };

  if (!user) {
    return (
      <div className="container py-5 text-center">
        <div className="card p-5 border-0 shadow-sm rounded-4 mx-auto" style={{ maxWidth: '480px' }}>
          <div className="text-warning fs-1 mb-3">
            <i className="bi bi-shield-lock"></i>
          </div>
          <h4 className="fw-bold">Unauthorized Access</h4>
          <p className="text-muted">You must sign in with your verified student account to access the student dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4 py-lg-5">
      {/* Top Banner & Welcome */}
      <div className="bg-primary text-white rounded-4 p-4 p-lg-5 mb-4 shadow position-relative overflow-hidden">
        <div
          className="position-absolute end-0 top-0 h-100 opacity-10 d-none d-md-block pe-5 pt-3 pointer-events-none"
          style={{ fontSize: '10rem' }}
        >
          <i className="bi bi-mortarboard"></i>
        </div>

        <div className="row align-items-center g-3 position-relative">
          <div className="col-lg-8">
            <div className="d-flex align-items-center gap-3 mb-2">
              <div
                className="bg-white text-primary rounded-circle d-flex align-items-center justify-content-center shadow"
                style={{ width: '56px', height: '56px', fontSize: '1.5rem', fontWeight: 700 }}
              >
                {profile?.fullName ? profile.fullName.charAt(0).toUpperCase() : 'S'}
              </div>
              <div>
                <span className="badge bg-warning text-dark fw-bold mb-1">Student Portal</span>
                <h2 className="fw-extrabold mb-0">Welcome back, {profile?.fullName || user.displayName}!</h2>
              </div>
            </div>
            <p className="text-white-75 mb-0" style={{ fontSize: '1.05rem', color: '#e0e7ff' }}>
              Student ID: <span className="fw-bold text-white">{profile?.studentId || 'STU-REGISTERED'}</span> &bull;{' '}
              Department: <span className="fw-semibold text-white">{profile?.department || 'General'}</span>
            </p>
          </div>

          <div className="col-lg-4 text-lg-end d-flex flex-wrap gap-2 justify-content-lg-end">
            <button
              className="btn btn-light rounded-pill px-3 py-2 fw-semibold shadow-sm d-flex align-items-center gap-2"
              onClick={() => setIsEditProfileOpen(true)}
            >
              <i className="bi bi-pencil-square text-primary"></i> Edit Profile
            </button>
            <button
              className="btn btn-outline-light rounded-pill px-3 py-2 d-flex align-items-center gap-2"
              onClick={() => logout()}
            >
              <i className="bi bi-box-arrow-right"></i> Log Out
            </button>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {actionSuccessMsg && (
        <div className="alert alert-success alert-dismissible fade show d-flex align-items-center gap-2 rounded-3 shadow-sm mb-4" role="alert">
          <i className="bi bi-check-circle-fill text-success fs-5"></i>
          <div className="flex-grow-1">{actionSuccessMsg}</div>
          <button type="button" className="btn-close" onClick={() => setActionSuccessMsg(null)}></button>
        </div>
      )}

      {actionErrorMsg && (
        <div className="alert alert-danger alert-dismissible fade show d-flex align-items-center gap-2 rounded-3 shadow-sm mb-4" role="alert">
          <i className="bi bi-exclamation-octagon-fill text-danger fs-5"></i>
          <div className="flex-grow-1">{actionErrorMsg}</div>
          <button type="button" className="btn-close" onClick={() => setActionErrorMsg(null)}></button>
        </div>
      )}

      {/* Metric Cards Grid */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-md-3">
          <div className="card border-0 shadow-sm rounded-4 p-3 bg-white h-100 border-start border-4 border-primary">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="small text-muted fw-semibold">Total Registered</span>
              <div className="rounded-circle bg-primary bg-opacity-10 text-primary p-2">
                <i className="bi bi-card-checklist"></i>
              </div>
            </div>
            <h3 className="fw-extrabold text-dark mb-0">{registrations.length}</h3>
            <small className="text-muted" style={{ fontSize: '0.75rem' }}>All-time bookings</small>
          </div>
        </div>

        <div className="col-6 col-md-3">
          <div className="card border-0 shadow-sm rounded-4 p-3 bg-white h-100 border-start border-4 border-success">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="small text-muted fw-semibold">Upcoming</span>
              <div className="rounded-circle bg-success bg-opacity-10 text-success p-2">
                <i className="bi bi-calendar-check"></i>
              </div>
            </div>
            <h3 className="fw-extrabold text-dark mb-0">{upcomingCount}</h3>
            <small className="text-muted" style={{ fontSize: '0.75rem' }}>Active reservations</small>
          </div>
        </div>

        <div className="col-6 col-md-3">
          <div className="card border-0 shadow-sm rounded-4 p-3 bg-white h-100 border-start border-4 border-info">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="small text-muted fw-semibold">Completed</span>
              <div className="rounded-circle bg-info bg-opacity-10 text-info p-2">
                <i className="bi bi-patch-check"></i>
              </div>
            </div>
            <h3 className="fw-extrabold text-dark mb-0">{completedCount}</h3>
            <small className="text-muted" style={{ fontSize: '0.75rem' }}>Past events attended</small>
          </div>
        </div>

        <div className="col-6 col-md-3">
          <div className="card border-0 shadow-sm rounded-4 p-3 bg-white h-100 border-start border-4 border-secondary">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="small text-muted fw-semibold">Cancelled</span>
              <div className="rounded-circle bg-secondary bg-opacity-10 text-secondary p-2">
                <i className="bi bi-x-circle"></i>
              </div>
            </div>
            <h3 className="fw-extrabold text-dark mb-0">{cancelledCount}</h3>
            <small className="text-muted" style={{ fontSize: '0.75rem' }}>Released tickets</small>
          </div>
        </div>
      </div>

      <div className="row g-4">
        {/* Left Column: Student Profile Card */}
        <div className="col-lg-4">
          <div className="card border-0 shadow-sm rounded-4 bg-white p-4 mb-4">
            <h5 className="fw-bold text-dark border-bottom pb-3 mb-3 d-flex align-items-center gap-2">
              <i className="bi bi-person-lines-fill text-primary"></i> Student Profile
            </h5>

            <div className="mb-3">
              <small className="text-muted d-block">Full Legal Name</small>
              <strong className="text-dark fs-6">{profile?.fullName}</strong>
            </div>

            <div className="mb-3">
              <small className="text-muted d-block">College Email</small>
              <span className="text-dark font-monospace small">{profile?.collegeEmail}</span>
            </div>

            <div className="mb-3">
              <small className="text-muted d-block">University Student ID</small>
              <span className="badge bg-light text-dark border px-2 py-1 fs-6 font-monospace">
                {profile?.studentId}
              </span>
            </div>

            <div className="mb-3">
              <small className="text-muted d-block">Academic Department</small>
              <span className="text-dark">{profile?.department}</span>
            </div>

            <div className="mb-3">
              <small className="text-muted d-block">Contact Phone</small>
              <span className="text-dark">{profile?.phone || 'Not specified'}</span>
            </div>

            <div className="mb-3">
              <small className="text-muted d-block">Student Bio</small>
              <p className="text-secondary small mb-0 fst-italic">
                {profile?.bio || 'No bio provided. Click Edit Profile to add your interests.'}
              </p>
            </div>

            <div className="pt-3 border-top">
              <button
                className="btn btn-outline-primary btn-sm rounded-pill w-100"
                onClick={() => setIsEditProfileOpen(true)}
              >
                <i className="bi bi-pencil me-1"></i> Update Profile Information
              </button>
            </div>
          </div>

          {/* Quick Help Card */}
          <div className="card border-0 shadow-sm rounded-4 bg-light p-4 mb-4">
            <h6 className="fw-bold text-dark mb-2">
              <i className="bi bi-info-circle text-primary me-1"></i> Need Assistance?
            </h6>
            <p className="text-secondary small mb-3">
              Have questions regarding event entry passes or schedule modifications? Contact the Dean of Student Affairs office.
            </p>
            <div className="small text-muted">
              <div><i className="bi bi-telephone me-1"></i> +1 (555) 019-2834</div>
              <div><i className="bi bi-envelope me-1"></i> events@campus.edu</div>
            </div>
          </div>

          {/* Security & Access Control Summary Card */}
          <div className="card border-0 shadow-sm rounded-4 bg-white p-4 border-top border-4 border-success">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <h6 className="fw-bold text-dark mb-0 d-flex align-items-center gap-2">
                <i className="bi bi-shield-check text-success"></i> Security & Role Status
              </h6>
              <span className="badge bg-success-subtle text-success border border-success-subtle">
                Verified
              </span>
            </div>
            <p className="text-muted small mb-3">
              Enforced by Firebase Authentication & Cloud Firestore Security Rules.
            </p>
            <div className="small text-secondary mb-3">
              <div className="d-flex justify-content-between py-1 border-bottom">
                <span className="text-muted">Account Role:</span>
                <span className="badge bg-light text-dark border">Student (Least-Privilege)</span>
              </div>
              <div className="d-flex justify-content-between py-1 border-bottom">
                <span className="text-muted">Document Path:</span>
                <span className="font-monospace text-primary" style={{ fontSize: '0.75rem' }}>/students/{user.uid.slice(0, 8)}...</span>
              </div>
              <div className="d-flex justify-content-between py-1 border-bottom">
                <span className="text-muted">Identity Lock:</span>
                <span className="text-success"><i className="bi bi-lock-fill me-1"></i>Email & Student ID Locked</span>
              </div>
              <div className="d-flex justify-content-between py-1">
                <span className="text-muted">Role Escalation:</span>
                <span className="text-danger"><i className="bi bi-shield-slash me-1"></i>Forbidden by Rules</span>
              </div>
            </div>
            <div className="bg-light p-2 rounded-3 text-muted" style={{ fontSize: '0.75rem' }}>
              <i className="bi bi-info-circle me-1 text-primary"></i>
              Students are strictly isolated to their own registrations and permitted profile attributes. Administrative operations require verified admin tokens.
            </div>
          </div>
        </div>

        {/* Right Column: Registrations List with Tabs */}
        <div className="col-lg-8">
          <div className="card border-0 shadow-sm rounded-4 bg-white p-4">
            {/* Header & Tabs */}
            <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4 pb-2 border-bottom">
              <div>
                <h5 className="fw-bold text-dark mb-1">My Registrations</h5>
                <small className="text-muted">Live records synced with Firestore security rules</small>
              </div>

              {/* Status Filter Tabs */}
              <div className="nav nav-pills gap-1">
                <button
                  className={`nav-link btn-sm py-1 px-3 rounded-pill ${activeTab === 'upcoming' ? 'active bg-primary' : 'bg-light text-dark'}`}
                  onClick={() => setActiveTab('upcoming')}
                >
                  Upcoming ({upcomingCount})
                </button>
                <button
                  className={`nav-link btn-sm py-1 px-3 rounded-pill ${activeTab === 'completed' ? 'active bg-primary' : 'bg-light text-dark'}`}
                  onClick={() => setActiveTab('completed')}
                >
                  Completed ({completedCount})
                </button>
                <button
                  className={`nav-link btn-sm py-1 px-3 rounded-pill ${activeTab === 'cancelled' ? 'active bg-primary' : 'bg-light text-dark'}`}
                  onClick={() => setActiveTab('cancelled')}
                >
                  Cancelled ({cancelledCount})
                </button>
                <button
                  className={`nav-link btn-sm py-1 px-3 rounded-pill ${activeTab === 'all' ? 'active bg-primary' : 'bg-light text-dark'}`}
                  onClick={() => setActiveTab('all')}
                >
                  All ({registrations.length})
                </button>
              </div>
            </div>

            {/* Loading */}
            {loading && (
              <div className="text-center py-5">
                <div className="spinner-border text-primary mb-2" role="status">
                  <span className="visually-hidden">Loading registrations...</span>
                </div>
                <p className="text-muted small">Loading your authenticated reservations...</p>
              </div>
            )}

            {/* Empty State */}
            {!loading && filteredRegistrations.length === 0 && (
              <div className="text-center py-5">
                <div
                  className="rounded-circle bg-light text-muted d-inline-flex align-items-center justify-content-center mb-3"
                  style={{ width: '64px', height: '64px', fontSize: '1.8rem' }}
                >
                  <i className="bi bi-calendar-plus"></i>
                </div>
                <h5 className="fw-bold text-dark mb-1">No {activeTab} registrations</h5>
                <p className="text-muted small mb-3">
                  {activeTab === 'upcoming'
                    ? "You don't have any upcoming registered events scheduled."
                    : `No registrations found under ${activeTab}.`}
                </p>
                <button
                  className="btn btn-primary rounded-pill btn-sm px-4 shadow-sm"
                  onClick={onExploreEvents}
                >
                  Explore Upcoming Events
                </button>
              </div>
            )}

            {/* Registrations List */}
            {!loading && filteredRegistrations.length > 0 && (
              <div className="d-flex flex-column gap-3">
                {filteredRegistrations.map(reg => {
                  const isUpcoming = reg.status === 'confirmed' && reg.eventDate >= todayStr;
                  const isPast = reg.status === 'confirmed' && reg.eventDate < todayStr;
                  const isCancelled = reg.status === 'cancelled';

                  return (
                    <div
                      key={reg.id}
                      className="border rounded-4 p-3 p-md-4 transition-all hover-shadow bg-light d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3"
                    >
                      <div>
                        <div className="d-flex align-items-center gap-2 mb-1 flex-wrap">
                          {isUpcoming && (
                            <span className="badge bg-success-subtle text-success border border-success-subtle">
                              <i className="bi bi-check-circle-fill me-1"></i> Confirmed
                            </span>
                          )}
                          {isPast && (
                            <span className="badge bg-secondary-subtle text-secondary border border-secondary-subtle">
                              <i className="bi bi-clock-history me-1"></i> Completed
                            </span>
                          )}
                          {isCancelled && (
                            <span className="badge bg-danger-subtle text-danger border border-danger-subtle">
                              <i className="bi bi-x-circle-fill me-1"></i> Cancelled
                            </span>
                          )}
                          <small className="text-muted font-monospace" style={{ fontSize: '0.72rem' }}>
                            Ref: {reg.id}
                          </small>
                        </div>

                        <h5 className="fw-bold text-dark mb-2">{reg.eventTitle}</h5>

                        <div className="d-flex flex-wrap align-items-center gap-3 text-muted small">
                          <span>
                            <i className="bi bi-calendar3 text-primary me-1"></i>
                            {new Date(reg.eventDate).toLocaleDateString(undefined, {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </span>
                          <span>
                            <i className="bi bi-geo-alt-fill text-danger me-1"></i>
                            {reg.eventVenue}
                          </span>
                          <span>
                            <i className="bi bi-clock text-info me-1"></i>
                            Booked on {new Date(reg.registeredAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="d-flex align-items-center gap-2 flex-wrap">
                        <button
                          className="btn btn-outline-primary btn-sm rounded-pill px-3"
                          onClick={() => onSelectEventId(reg.eventId)}
                        >
                          <i className="bi bi-eye me-1"></i> Details
                        </button>

                        {isUpcoming && (
                          <>
                            <button
                              className="btn btn-light btn-sm rounded-pill px-3 border shadow-sm"
                              onClick={() => setTicketModalReg(reg)}
                            >
                              <i className="bi bi-qr-code me-1"></i> Entry Pass
                            </button>

                            <button
                              className="btn btn-outline-danger btn-sm rounded-pill px-3"
                              onClick={() => setCancellingReg(reg)}
                            >
                              <i className="bi bi-x-lg me-1"></i> Cancel RSVP
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL 1: Confirm Cancellation Modal */}
      {cancellingReg && (
        <div
          className="modal fade show d-block bg-dark bg-opacity-75"
          tabIndex={-1}
          role="dialog"
          aria-modal="true"
        >
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '440px' }}>
            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
              <div className="modal-header bg-danger text-white py-3 px-4">
                <h5 className="modal-title fw-bold">
                  <i className="bi bi-exclamation-triangle-fill me-2"></i> Cancel Event Registration
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setCancellingReg(null)}
                  disabled={cancellingProgress}
                ></button>
              </div>
              <div className="modal-body p-4">
                <p className="text-dark mb-2">
                  Are you sure you want to cancel your seat for:
                </p>
                <div className="p-3 bg-light rounded-3 border mb-3">
                  <strong className="text-dark d-block">{cancellingReg.eventTitle}</strong>
                  <small className="text-muted">
                    {new Date(cancellingReg.eventDate).toLocaleDateString()} at {cancellingReg.eventVenue}
                  </small>
                </div>
                <p className="small text-muted mb-0">
                  This will release your reserved seat immediately so other students on the waitlist can register. You can re-register later if seats remain open.
                </p>
              </div>
              <div className="modal-footer bg-light px-4 py-3 d-flex justify-content-between">
                <button
                  type="button"
                  className="btn btn-outline-secondary rounded-pill px-3"
                  onClick={() => setCancellingReg(null)}
                  disabled={cancellingProgress}
                >
                  Keep Registration
                </button>
                <button
                  type="button"
                  className="btn btn-danger rounded-pill px-4 fw-semibold"
                  onClick={handleConfirmCancel}
                  disabled={cancellingProgress}
                >
                  {cancellingProgress ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-1" role="status"></span>
                      Cancelling...
                    </>
                  ) : (
                    'Confirm Cancellation'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Edit Profile Modal */}
      {isEditProfileOpen && (
        <div
          className="modal fade show d-block bg-dark bg-opacity-75"
          tabIndex={-1}
          role="dialog"
          aria-modal="true"
        >
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '500px' }}>
            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
              <div className="modal-header bg-primary text-white py-3 px-4">
                <h5 className="modal-title fw-bold">
                  <i className="bi bi-person-gear me-2"></i> Edit Student Profile
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setIsEditProfileOpen(false)}
                  disabled={savingProfile}
                ></button>
              </div>
              <form onSubmit={handleSaveProfile}>
                <div className="modal-body p-4">
                  {profileModalError && (
                    <div className="alert alert-danger d-flex align-items-center gap-2 rounded-3 small py-2 mb-3" role="alert">
                      <i className="bi bi-exclamation-triangle-fill text-danger"></i>
                      <div>{profileModalError}</div>
                    </div>
                  )}

                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-dark">
                      Full Legal Name <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      value={editFullName}
                      onChange={e => setEditFullName(e.target.value)}
                      maxLength={100}
                      required
                    />
                    <small className="text-muted" style={{ fontSize: '0.75rem' }}>Between 2 and 100 characters</small>
                  </div>

                  <div className="row g-2 mb-2">
                    <div className="col-6">
                      <label className="form-label small fw-semibold text-muted">
                        <i className="bi bi-lock-fill text-secondary me-1"></i> College Email
                      </label>
                      <input
                        type="text"
                        className="form-control bg-light font-monospace small"
                        value={profile?.collegeEmail || ''}
                        disabled
                      />
                    </div>
                    <div className="col-6">
                      <label className="form-label small fw-semibold text-muted">
                        <i className="bi bi-lock-fill text-secondary me-1"></i> Student ID
                      </label>
                      <input
                        type="text"
                        className="form-control bg-light font-monospace small"
                        value={profile?.studentId || ''}
                        disabled
                      />
                    </div>
                  </div>
                  <div className="mb-3">
                    <small className="text-muted d-block" style={{ fontSize: '0.75rem' }}>
                      <i className="bi bi-shield-check text-success me-1"></i>
                      College Email and Student ID are cryptographically linked to your Firebase Authentication identity and cannot be edited.
                    </small>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-dark">
                      Academic Department <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      value={editDepartment}
                      onChange={e => setEditDepartment(e.target.value)}
                      maxLength={80}
                      required
                    />
                    <small className="text-muted" style={{ fontSize: '0.75rem' }}>Official degree or faculty department</small>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-dark">Contact Phone Number</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="+1 (555) 000-0000"
                      value={editPhone}
                      onChange={e => setEditPhone(e.target.value)}
                      maxLength={20}
                    />
                    <small className="text-muted" style={{ fontSize: '0.75rem' }}>Used for urgent event schedule notifications</small>
                  </div>

                  <div className="mb-3">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <label className="form-label small fw-semibold text-dark mb-0">Bio / Academic Interests</label>
                      <span className={`small ${editBio.length > 280 ? 'text-danger' : 'text-muted'}`} style={{ fontSize: '0.75rem' }}>
                        {editBio.length}/300
                      </span>
                    </div>
                    <textarea
                      className="form-control"
                      rows={3}
                      placeholder="Share your academic interests, club affiliations, or research focus..."
                      value={editBio}
                      onChange={e => setEditBio(e.target.value)}
                      maxLength={300}
                    ></textarea>
                  </div>

                  <div className="bg-light p-2 rounded-3 border small text-muted" style={{ fontSize: '0.75rem' }}>
                    <i className="bi bi-shield-lock text-primary me-1"></i>
                    <strong>Zero-Trust Authorization:</strong> Student profile updates are bounded to permitted fields only. Privileged roles and admin elevations are rejected by Firestore Security Rules.
                  </div>
                </div>

                <div className="modal-footer bg-light px-4 py-3 d-flex justify-content-between">
                  <button
                    type="button"
                    className="btn btn-outline-secondary rounded-pill px-3"
                    onClick={() => setIsEditProfileOpen(false)}
                    disabled={savingProfile}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary rounded-pill px-4 fw-semibold"
                    disabled={savingProfile}
                  >
                    {savingProfile ? 'Saving Changes...' : 'Save Profile'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Digital Ticket / Entry Pass Modal */}
      {ticketModalReg && (
        <div
          className="modal fade show d-block bg-dark bg-opacity-75"
          tabIndex={-1}
          role="dialog"
          aria-modal="true"
        >
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '420px' }}>
            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden text-center">
              <div className="bg-primary text-white p-4 position-relative">
                <button
                  type="button"
                  className="btn-close btn-close-white position-absolute top-0 end-0 m-3"
                  onClick={() => setTicketModalReg(null)}
                ></button>
                <div
                  className="bg-white text-primary rounded-circle d-inline-flex align-items-center justify-content-center p-3 mb-2 shadow"
                  style={{ width: '60px', height: '60px', fontSize: '1.6rem' }}
                >
                  <i className="bi bi-mortarboard-fill"></i>
                </div>
                <h5 className="fw-bold mb-0">Official Student Entry Pass</h5>
                <small className="text-white-50">Campus Event Management System</small>
              </div>

              <div className="p-4 bg-white">
                <span className="badge bg-success-subtle text-success border border-success-subtle px-3 py-1 mb-2">
                  VERIFIED ADMISSION
                </span>
                <h5 className="fw-bold text-dark mb-2">{ticketModalReg.eventTitle}</h5>
                <p className="text-muted small mb-3">
                  <i className="bi bi-calendar3 me-1"></i> {new Date(ticketModalReg.eventDate).toLocaleDateString()} &bull;{' '}
                  <i className="bi bi-geo-alt me-1"></i> {ticketModalReg.eventVenue}
                </p>

                {/* Simulated QR Code */}
                <div className="bg-light p-3 rounded-3 d-inline-block border mb-3">
                  <div
                    style={{
                      width: '140px',
                      height: '140px',
                      background: 'repeating-linear-gradient(0deg, #111 0, #111 4px, transparent 4px, transparent 8px), repeating-linear-gradient(90deg, #111 0, #111 4px, #fff 4px, #fff 8px)',
                      margin: '0 auto',
                    }}
                  ></div>
                  <small className="font-monospace text-muted d-block mt-2" style={{ fontSize: '0.7rem' }}>
                    PASS: {ticketModalReg.id}
                  </small>
                </div>

                <div className="bg-light p-3 rounded-3 text-start small border">
                  <div><strong>Student:</strong> {ticketModalReg.studentName}</div>
                  <div><strong>Student ID:</strong> {ticketModalReg.studentId}</div>
                  <div><strong>Department:</strong> {ticketModalReg.department}</div>
                </div>
              </div>

              <div className="modal-footer bg-light p-3 justify-content-center">
                <button
                  type="button"
                  className="btn btn-primary rounded-pill px-4 fw-semibold"
                  onClick={() => {
                    window.print();
                  }}
                >
                  <i className="bi bi-printer me-1"></i> Print / Save Pass
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
