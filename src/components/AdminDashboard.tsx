import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { CampusEvent, EventCategory, EventRegistration, AdminDashboardStats } from '../types';
import { firebaseService } from '../services/firebaseService';

interface AdminDashboardProps {
  onOpenAuth: (tab: 'login' | 'register') => void;
  onExplorePublicEvents: () => void;
  onOpenTestSuite?: () => void;
}

const CATEGORIES: EventCategory[] = ['Technical', 'Cultural', 'Sports', 'Workshop', 'Symposium'];

const SAMPLE_POSTERS = [
  { label: 'Tech / AI Summit', url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80' },
  { label: 'Cultural / Concert', url: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=80' },
  { label: 'Cybersecurity Workshop', url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80' },
  { label: 'Sports / Athletics', url: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=1200&q=80' },
  { label: 'Academic Symposium', url: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=1200&q=80' },
  { label: 'Hackathon Sprint', url: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1200&q=80' },
];

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onOpenAuth,
  onExplorePublicEvents,
  onOpenTestSuite,
}) => {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [checkingRole, setCheckingRole] = useState(true);

  // Stats and events
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [events, setEvents] = useState<CampusEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedbackSuccess, setFeedbackSuccess] = useState<string | null>(null);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'All' | EventCategory>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Published' | 'Draft' | 'Cancelled'>('All');
  const [sortBy, setSortBy] = useState<'date' | 'title' | 'capacity' | 'registered'>('date');

  // Create / Edit Event Form Modal
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Technical' as EventCategory,
    eventDate: '',
    startTime: '10:00 AM',
    endTime: '04:00 PM',
    venue: '',
    organizer: '',
    maxCapacity: 100,
    registrationDeadline: '',
    posterUrl: SAMPLE_POSTERS[0].url,
    isPublished: true,
    isCancelled: false,
    isFeatured: false,
  });
  const [submittingForm, setSubmittingForm] = useState(false);

  // Delete Confirmation Modal
  const [deletingEvent, setDeletingEvent] = useState<CampusEvent | null>(null);
  const [deletingProgress, setDeletingProgress] = useState(false);

  // Participants View Modal
  const [participantEvent, setParticipantEvent] = useState<CampusEvent | null>(null);
  const [participants, setParticipants] = useState<EventRegistration[]>([]);
  const [loadingParticipants, setLoadingParticipants] = useState(false);
  const [exportingCsv, setExportingCsv] = useState(false);

  // Role Verification Check
  useEffect(() => {
    let isMounted = true;
    setCheckingRole(true);
    firebaseService.verifyAdminRole(user?.uid).then(verified => {
      if (isMounted) {
        setIsAdmin(verified);
        setCheckingRole(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [user]);

  // Load Data
  const loadAdminData = useCallback(async () => {
    setLoading(true);
    setFeedbackError(null);
    try {
      const [fetchedStats, fetchedEvents] = await Promise.all([
        firebaseService.getAdminDashboardStats(),
        firebaseService.getEvents(true), // include unpublished
      ]);
      setStats(fetchedStats);
      setEvents(fetchedEvents);
    } catch (err) {
      setFeedbackError(err instanceof Error ? err.message : 'Failed to load administrator data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) {
      loadAdminData();
    }
  }, [isAdmin, loadAdminData]);

  // Filter & Sort
  const filteredEvents = useMemo(() => {
    return events
      .filter(event => {
        if (categoryFilter !== 'All' && event.category !== categoryFilter) return false;
        if (statusFilter === 'Published' && !event.isPublished) return false;
        if (statusFilter === 'Draft' && event.isPublished) return false;
        if (statusFilter === 'Cancelled' && !event.isCancelled) return false;

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = event.title.toLowerCase().includes(q);
          const matchVenue = event.venue.toLowerCase().includes(q);
          const matchOrganizer = event.organizer.toLowerCase().includes(q);
          return matchTitle || matchVenue || matchOrganizer;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'date') return new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime();
        if (sortBy === 'title') return a.title.localeCompare(b.title);
        if (sortBy === 'capacity') return b.maxCapacity - a.maxCapacity;
        if (sortBy === 'registered') return b.registeredCount - a.registeredCount;
        return 0;
      });
  }, [events, categoryFilter, statusFilter, searchQuery, sortBy]);

  // Open Create Form
  const handleOpenCreate = () => {
    setEditingEventId(null);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 7);
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + 6);

    setFormData({
      title: '',
      description: '',
      category: 'Technical',
      eventDate: tomorrow.toISOString().split('T')[0],
      startTime: '09:30 AM',
      endTime: '04:30 PM',
      venue: '',
      organizer: 'Faculty / Student Committee',
      maxCapacity: 100,
      registrationDeadline: deadline.toISOString().split('T')[0] + 'T23:59:00',
      posterUrl: SAMPLE_POSTERS[0].url,
      isPublished: true,
      isCancelled: false,
      isFeatured: false,
    });
    setIsFormModalOpen(true);
  };

  // Open Edit Form
  const handleOpenEdit = (event: CampusEvent) => {
    setEditingEventId(event.id);
    setFormData({
      title: event.title,
      description: event.description,
      category: event.category,
      eventDate: event.eventDate,
      startTime: event.startTime,
      endTime: event.endTime,
      venue: event.venue,
      organizer: event.organizer,
      maxCapacity: event.maxCapacity,
      registrationDeadline: event.registrationDeadline,
      posterUrl: event.posterUrl,
      isPublished: event.isPublished,
      isCancelled: event.isCancelled,
      isFeatured: !!event.isFeatured,
    });
    setIsFormModalOpen(true);
  };

  // Save Event (Create or Update)
  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingForm(true);
    setFeedbackError(null);

    try {
      if (editingEventId) {
        await firebaseService.updateEvent(editingEventId, formData);
        setFeedbackSuccess(`Event "${formData.title}" was updated successfully.`);
      } else {
        await firebaseService.createEvent(formData);
        setFeedbackSuccess(`Event "${formData.title}" was created and saved to Firestore.`);
      }
      setIsFormModalOpen(false);
      await loadAdminData();
    } catch (err) {
      setFeedbackError(err instanceof Error ? err.message : 'Failed to save event.');
    } finally {
      setSubmittingForm(false);
    }
  };

  // Toggle Publish
  const handleTogglePublish = async (event: CampusEvent) => {
    try {
      const nextState = !event.isPublished;
      await firebaseService.togglePublishEvent(event.id, nextState);
      setFeedbackSuccess(`Event "${event.title}" is now ${nextState ? 'Published' : 'Unpublished (Draft)'}.`);
      await loadAdminData();
    } catch (err) {
      setFeedbackError(err instanceof Error ? err.message : 'Failed to update publication status.');
    }
  };

  // Toggle Cancel
  const handleToggleCancel = async (event: CampusEvent) => {
    try {
      const nextState = !event.isCancelled;
      await firebaseService.toggleCancelEvent(event.id, nextState);
      setFeedbackSuccess(`Event "${event.title}" status changed to ${nextState ? 'Cancelled' : 'Active'}.`);
      await loadAdminData();
    } catch (err) {
      setFeedbackError(err instanceof Error ? err.message : 'Failed to update cancellation state.');
    }
  };

  // Confirm Delete
  const handleConfirmDelete = async () => {
    if (!deletingEvent) return;
    setDeletingProgress(true);
    try {
      await firebaseService.deleteEvent(deletingEvent.id);
      setFeedbackSuccess(`Event "${deletingEvent.title}" was permanently removed.`);
      setDeletingEvent(null);
      await loadAdminData();
    } catch (err) {
      setFeedbackError(err instanceof Error ? err.message : 'Failed to delete event.');
    } finally {
      setDeletingProgress(false);
    }
  };

  // Open Participants Modal
  const handleViewParticipants = async (event: CampusEvent) => {
    setParticipantEvent(event);
    setLoadingParticipants(true);
    try {
      const list = await firebaseService.getEventParticipants(event.id);
      setParticipants(list);
    } catch (err) {
      setFeedbackError(err instanceof Error ? err.message : 'Failed to fetch participant list.');
    } finally {
      setLoadingParticipants(false);
    }
  };

  // Export CSV
  const handleExportCsv = async () => {
    if (!participantEvent) return;
    setExportingCsv(true);
    try {
      const { filename, csvContent } = await firebaseService.exportParticipantsCsv(participantEvent.id);
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setFeedbackSuccess(`Exported ${participants.length} participant records to ${filename}`);
    } catch (err) {
      setFeedbackError(err instanceof Error ? err.message : 'Failed to export CSV.');
    } finally {
      setExportingCsv(false);
    }
  };

  // Quick Admin Login action for testing
  const handleLoginAsDemoAdmin = async () => {
    try {
      await firebaseService.login('admin@campus.edu', 'Admin#Campus2026');
      setIsAdmin(true);
      await loadAdminData();
    } catch (err) {
      setFeedbackError(err instanceof Error ? err.message : 'Failed to authenticate as administrator.');
    }
  };

  // Check role loading
  if (checkingRole) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-primary mb-3" role="status">
          <span className="visually-hidden">Verifying admin credentials...</span>
        </div>
        <p className="text-muted fw-semibold">Verifying administrative role permissions against Firestore...</p>
      </div>
    );
  }

  // Unauthorized screen
  if (!isAdmin) {
    return (
      <div className="container py-5">
        <div className="card border-0 shadow rounded-4 p-5 text-center mx-auto bg-white" style={{ maxWidth: '560px' }}>
          <div
            className="rounded-circle bg-danger bg-opacity-10 text-danger d-inline-flex align-items-center justify-content-center mx-auto mb-3"
            style={{ width: '70px', height: '70px', fontSize: '2rem' }}
          >
            <i className="bi bi-shield-x"></i>
          </div>
          <h3 className="fw-extrabold text-dark mb-2">Restricted Administrator Area</h3>
          <p className="text-secondary mb-4">
            Access to this console requires verified administrator privileges. Student accounts cannot view, publish, or modify campus events.
          </p>

          <div className="p-3 bg-light rounded-3 border mb-4 text-start small">
            <strong className="d-block mb-1 text-dark">
              <i className="bi bi-key-fill text-primary me-1"></i> Demo Administrator Credentials:
            </strong>
            <div>Email: <code>admin@campus.edu</code> (or runtime <code>asikaasika847@gmail.com</code>)</div>
            <div>Password: <code>Admin#Campus2026</code></div>
          </div>

          <div className="d-flex flex-column gap-2">
            <button
              className="btn btn-primary rounded-pill py-2 fw-semibold shadow-sm d-flex align-items-center justify-content-center gap-2"
              onClick={handleLoginAsDemoAdmin}
            >
              <i className="bi bi-shield-lock-fill"></i> Log In as Verified Admin
            </button>
            <button
              className="btn btn-outline-secondary rounded-pill py-2"
              onClick={onExplorePublicEvents}
            >
              Return to Public Portal
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4 py-lg-5">
      {/* Top Banner & Header */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <div className="d-flex align-items-center gap-2">
            <span className="badge bg-danger text-uppercase px-2 py-1">Admin Console</span>
            <span className="badge bg-success-subtle text-success border border-success-subtle">
              <i className="bi bi-check-circle-fill me-1"></i> Verified Administrator
            </span>
          </div>
          <h2 className="fw-extrabold text-dark mt-2 mb-0">Campus Event Operations</h2>
          <p className="text-muted small mb-0">
            Publish, schedule, edit, monitor capacity, and manage student participant records.
          </p>
        </div>

        <div className="d-flex align-items-center gap-2">
          {onOpenTestSuite && (
            <button
              className="btn btn-outline-danger rounded-pill px-3 d-flex align-items-center gap-1 shadow-sm"
              onClick={onOpenTestSuite}
              title="Run Automated Security Verification Suite"
            >
              <i className="bi bi-shield-check"></i>
              <span className="d-none d-sm-inline">Run Security Tests</span>
            </button>
          )}
          <button
            className="btn btn-primary rounded-pill px-4 fw-semibold shadow-sm d-flex align-items-center gap-2"
            onClick={handleOpenCreate}
          >
            <i className="bi bi-plus-circle-fill"></i> Create New Event
          </button>
          <button
            className="btn btn-outline-secondary rounded-pill px-3"
            onClick={loadAdminData}
            title="Refresh database records"
          >
            <i className="bi bi-arrow-clockwise"></i>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {feedbackSuccess && (
        <div className="alert alert-success alert-dismissible fade show d-flex align-items-center gap-2 rounded-3 shadow-sm mb-4" role="alert">
          <i className="bi bi-check-circle-fill text-success fs-5"></i>
          <div className="flex-grow-1">{feedbackSuccess}</div>
          <button type="button" className="btn-close" onClick={() => setFeedbackSuccess(null)}></button>
        </div>
      )}

      {feedbackError && (
        <div className="alert alert-danger alert-dismissible fade show d-flex align-items-center gap-2 rounded-3 shadow-sm mb-4" role="alert">
          <i className="bi bi-exclamation-octagon-fill text-danger fs-5"></i>
          <div className="flex-grow-1">{feedbackError}</div>
          <button type="button" className="btn-close" onClick={() => setFeedbackError(null)}></button>
        </div>
      )}

      {/* Metric Cards Grid */}
      {stats && (
        <div className="row g-3 mb-4">
          <div className="col-6 col-lg-3">
            <div className="card border-0 shadow-sm rounded-4 p-3 bg-white h-100 border-start border-4 border-primary">
              <div className="d-flex align-items-center justify-content-between mb-1">
                <span className="small text-muted fw-semibold">Total Events</span>
                <i className="bi bi-calendar-event text-primary fs-5"></i>
              </div>
              <h3 className="fw-extrabold text-dark mb-0">{stats.totalEvents}</h3>
              <small className="text-muted" style={{ fontSize: '0.75rem' }}>Active & Draft Catalog</small>
            </div>
          </div>

          <div className="col-6 col-lg-3">
            <div className="card border-0 shadow-sm rounded-4 p-3 bg-white h-100 border-start border-4 border-success">
              <div className="d-flex align-items-center justify-content-between mb-1">
                <span className="small text-muted fw-semibold">Published Events</span>
                <i className="bi bi-broadcast text-success fs-5"></i>
              </div>
              <h3 className="fw-extrabold text-dark mb-0">{stats.publishedEvents}</h3>
              <small className="text-muted" style={{ fontSize: '0.75rem' }}>Live on public student portal</small>
            </div>
          </div>

          <div className="col-6 col-lg-3">
            <div className="card border-0 shadow-sm rounded-4 p-3 bg-white h-100 border-start border-4 border-info">
              <div className="d-flex align-items-center justify-content-between mb-1">
                <span className="small text-muted fw-semibold">Total RSVPs</span>
                <i className="bi bi-people-fill text-info fs-5"></i>
              </div>
              <h3 className="fw-extrabold text-dark mb-0">{stats.totalRegistrations}</h3>
              <small className="text-muted" style={{ fontSize: '0.75rem' }}>
                {stats.confirmedRegistrations} active bookings
              </small>
            </div>
          </div>

          <div className="col-6 col-lg-3">
            <div className="card border-0 shadow-sm rounded-4 p-3 bg-white h-100 border-start border-4 border-warning">
              <div className="d-flex align-items-center justify-content-between mb-1">
                <span className="small text-muted fw-semibold">Upcoming Programs</span>
                <i className="bi bi-calendar-check text-warning fs-5"></i>
              </div>
              <h3 className="fw-extrabold text-dark mb-0">{stats.upcomingEvents}</h3>
              <small className="text-muted" style={{ fontSize: '0.75rem' }}>Scheduled future sessions</small>
            </div>
          </div>
        </div>
      )}

      {/* Event Catalog Manager */}
      <div className="card border-0 shadow-sm rounded-4 bg-white p-4">
        {/* Controls Bar */}
        <div className="row g-3 align-items-center mb-4">
          <div className="col-md-4">
            <div className="input-group">
              <span className="input-group-text bg-light border-end-0">
                <i className="bi bi-search text-muted"></i>
              </span>
              <input
                type="text"
                className="form-control border-start-0 ps-1"
                placeholder="Search event title, venue, organizer..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="col-sm-6 col-md-3">
            <select
              className="form-select"
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value as 'All' | EventCategory)}
            >
              <option value="All">All Categories</option>
              {CATEGORIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="col-sm-6 col-md-3">
            <select
              className="form-select"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as 'All' | 'Published' | 'Draft' | 'Cancelled')}
            >
              <option value="All">All Statuses</option>
              <option value="Published">Published Only</option>
              <option value="Draft">Drafts / Unpublished Only</option>
              <option value="Cancelled">Cancelled Only</option>
            </select>
          </div>

          <div className="col-md-2">
            <select
              className="form-select"
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
            >
              <option value="date">Sort by Date</option>
              <option value="title">Sort by Title</option>
              <option value="capacity">Sort by Capacity</option>
              <option value="registered">Sort by RSVPs</option>
            </select>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="text-center py-5">
            <div className="spinner-border text-primary mb-2" role="status"></div>
            <p className="text-muted small">Loading event catalog from Firestore...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredEvents.length === 0 && (
          <div className="text-center py-5">
            <i className="bi bi-inbox fs-1 text-muted d-block mb-2"></i>
            <h5 className="fw-bold text-dark">No Events Match Criteria</h5>
            <p className="text-muted small mb-3">Adjust your search or category filters to view events.</p>
            <button className="btn btn-outline-primary btn-sm rounded-pill px-3" onClick={handleOpenCreate}>
              Create First Event
            </button>
          </div>
        )}

        {/* Events Table */}
        {!loading && filteredEvents.length > 0 && (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light text-muted small text-uppercase">
                <tr>
                  <th scope="col" style={{ width: '30%' }}>Event Details</th>
                  <th scope="col">Category</th>
                  <th scope="col">Date & Time</th>
                  <th scope="col">Capacity</th>
                  <th scope="col">Status</th>
                  <th scope="col" className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEvents.map(event => {
                  const seatsLeft = Math.max(0, event.maxCapacity - event.registeredCount);
                  const isFull = seatsLeft === 0;

                  return (
                    <tr key={event.id}>
                      {/* Event Details */}
                      <td>
                        <div className="d-flex align-items-center gap-3">
                          <img
                            src={event.posterUrl}
                            alt={event.title}
                            className="rounded-3 object-fit-cover shadow-sm"
                            style={{ width: '56px', height: '56px' }}
                          />
                          <div>
                            <strong className="text-dark d-block text-truncate" style={{ maxWidth: '240px' }} title={event.title}>
                              {event.title}
                            </strong>
                            <small className="text-muted d-block text-truncate" style={{ maxWidth: '240px' }}>
                              <i className="bi bi-geo-alt me-1 text-danger"></i>
                              {event.venue}
                            </small>
                            <small className="text-muted d-block">
                              Organizer: {event.organizer}
                            </small>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td>
                        <span className="badge bg-secondary-subtle text-secondary border border-secondary-subtle">
                          {event.category}
                        </span>
                      </td>

                      {/* Date & Time */}
                      <td className="small">
                        <div className="fw-medium text-dark">
                          {new Date(event.eventDate).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </div>
                        <div className="text-muted">{event.startTime} - {event.endTime}</div>
                      </td>

                      {/* Capacity */}
                      <td>
                        <div className="small mb-1">
                          <strong>{event.registeredCount}</strong> / {event.maxCapacity}
                          {isFull && <span className="badge bg-danger ms-1">Full</span>}
                        </div>
                        <div className="progress" style={{ height: '5px', width: '100px' }}>
                          <div
                            className={`progress-bar ${isFull ? 'bg-danger' : 'bg-primary'}`}
                            role="progressbar"
                            style={{ width: `${Math.min(100, (event.registeredCount / event.maxCapacity) * 100)}%` }}
                          ></div>
                        </div>
                      </td>

                      {/* Status */}
                      <td>
                        <div className="d-flex flex-column gap-1">
                          {event.isPublished ? (
                            <span className="badge bg-success-subtle text-success border border-success-subtle">
                              <i className="bi bi-check-circle-fill me-1"></i> Published
                            </span>
                          ) : (
                            <span className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle">
                              <i className="bi bi-pause-circle me-1"></i> Draft
                            </span>
                          )}
                          {event.isCancelled && (
                            <span className="badge bg-danger-subtle text-danger border border-danger-subtle">
                              Cancelled
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="text-end">
                        <div className="btn-group btn-group-sm">
                          {/* Participants */}
                          <button
                            className="btn btn-outline-primary"
                            onClick={() => handleViewParticipants(event)}
                            title="View Participants & Export CSV"
                          >
                            <i className="bi bi-people-fill me-1"></i> Participants ({event.registeredCount})
                          </button>

                          {/* Edit */}
                          <button
                            className="btn btn-outline-secondary"
                            onClick={() => handleOpenEdit(event)}
                            title="Edit Event Details"
                          >
                            <i className="bi bi-pencil"></i>
                          </button>

                          {/* Publish/Unpublish toggle */}
                          <button
                            className={`btn ${event.isPublished ? 'btn-outline-warning' : 'btn-outline-success'}`}
                            onClick={() => handleTogglePublish(event)}
                            title={event.isPublished ? 'Unpublish Event (Hide from Portal)' : 'Publish Event (Make Live)'}
                          >
                            <i className={`bi ${event.isPublished ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                          </button>

                          {/* Cancel toggle */}
                          <button
                            className={`btn ${event.isCancelled ? 'btn-outline-info' : 'btn-outline-secondary'}`}
                            onClick={() => handleToggleCancel(event)}
                            title={event.isCancelled ? 'Unmark Cancelled' : 'Mark Event Cancelled'}
                          >
                            <i className={`bi ${event.isCancelled ? 'bi-arrow-repeat' : 'bi-slash-circle'}`}></i>
                          </button>

                          {/* Delete */}
                          <button
                            className="btn btn-outline-danger"
                            onClick={() => setDeletingEvent(event)}
                            title="Delete Event"
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL 1: Create / Edit Event Modal */}
      {isFormModalOpen && (
        <div
          className="modal fade show d-block bg-dark bg-opacity-75"
          tabIndex={-1}
          role="dialog"
          aria-modal="true"
        >
          <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
              <div className="modal-header bg-primary text-white py-3 px-4">
                <h5 className="modal-title fw-bold">
                  <i className={`bi ${editingEventId ? 'bi-pencil-square' : 'bi-plus-circle-fill'} me-2`}></i>
                  {editingEventId ? 'Edit Campus Event' : 'Create New Campus Event'}
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setIsFormModalOpen(false)}
                  disabled={submittingForm}
                ></button>
              </div>

              <form onSubmit={handleSaveEvent}>
                <div className="modal-body p-4">
                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-dark">
                      Event Title <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Annual AI & Robotics Symposium 2026"
                      value={formData.title}
                      onChange={e => setFormData({ ...formData, title: e.target.value })}
                      required
                    />
                  </div>

                  <div className="row g-3 mb-3">
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold text-dark">
                        Category <span className="text-danger">*</span>
                      </label>
                      <select
                        className="form-select"
                        value={formData.category}
                        onChange={e => setFormData({ ...formData, category: e.target.value as EventCategory })}
                        required
                      >
                        {CATEGORIES.map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label small fw-semibold text-dark">
                        Organizer Committee / Dept <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. Dept. of Computer Science & Engineering"
                        value={formData.organizer}
                        onChange={e => setFormData({ ...formData, organizer: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="row g-3 mb-3">
                    <div className="col-md-4">
                      <label className="form-label small fw-semibold text-dark">
                        Event Date <span className="text-danger">*</span>
                      </label>
                      <input
                        type="date"
                        className="form-control"
                        value={formData.eventDate}
                        onChange={e => setFormData({ ...formData, eventDate: e.target.value })}
                        required
                      />
                    </div>

                    <div className="col-md-4">
                      <label className="form-label small fw-semibold text-dark">
                        Start Time <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="09:30 AM"
                        value={formData.startTime}
                        onChange={e => setFormData({ ...formData, startTime: e.target.value })}
                        required
                      />
                    </div>

                    <div className="col-md-4">
                      <label className="form-label small fw-semibold text-dark">
                        End Time <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="04:30 PM"
                        value={formData.endTime}
                        onChange={e => setFormData({ ...formData, endTime: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="row g-3 mb-3">
                    <div className="col-md-7">
                      <label className="form-label small fw-semibold text-dark">
                        Campus Venue <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. Main Auditorium, Tech Block-B"
                        value={formData.venue}
                        onChange={e => setFormData({ ...formData, venue: e.target.value })}
                        required
                      />
                    </div>

                    <div className="col-md-5">
                      <label className="form-label small fw-semibold text-dark">
                        Max Participant Capacity <span className="text-danger">*</span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="10000"
                        className="form-control"
                        value={formData.maxCapacity}
                        onChange={e => setFormData({ ...formData, maxCapacity: parseInt(e.target.value) || 1 })}
                        required
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-dark">
                      Registration Deadline <span className="text-danger">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      className="form-control"
                      value={formData.registrationDeadline.substring(0, 16)}
                      onChange={e => setFormData({ ...formData, registrationDeadline: e.target.value + ':00' })}
                      required
                    />
                    <small className="form-text text-muted">
                      Students will not be able to RSVP once this deadline expires.
                    </small>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-dark">
                      Event Description & Schedule <span className="text-danger">*</span>
                    </label>
                    <textarea
                      className="form-control"
                      rows={4}
                      placeholder="Outline event topics, keynote speakers, eligibility, prerequisites..."
                      value={formData.description}
                      onChange={e => setFormData({ ...formData, description: e.target.value })}
                      required
                    ></textarea>
                  </div>

                  {/* Poster Selection */}
                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-dark d-block">
                      Event Poster Image
                    </label>
                    <div className="input-group mb-2">
                      <span className="input-group-text bg-light text-muted">
                        <i className="bi bi-image"></i>
                      </span>
                      <input
                        type="url"
                        className="form-control"
                        placeholder="Paste image URL (Firebase Storage / CDN)..."
                        value={formData.posterUrl}
                        onChange={e => setFormData({ ...formData, posterUrl: e.target.value })}
                        required
                      />
                    </div>

                    {/* Preset Picker */}
                    <div className="d-flex flex-wrap gap-2 align-items-center">
                      <small className="text-muted">Presets:</small>
                      {SAMPLE_POSTERS.map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          className={`btn btn-sm py-0 px-2 rounded-pill ${formData.posterUrl === preset.url ? 'btn-primary' : 'btn-outline-secondary'}`}
                          style={{ fontSize: '0.75rem' }}
                          onClick={() => setFormData({ ...formData, posterUrl: preset.url })}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Poster Preview */}
                  {formData.posterUrl && (
                    <div className="mb-3 rounded-3 overflow-hidden border" style={{ height: '140px' }}>
                      <img
                        src={formData.posterUrl}
                        alt="Preview"
                        className="w-100 h-100 object-fit-cover"
                      />
                    </div>
                  )}

                  {/* Checkbox Options */}
                  <div className="d-flex flex-wrap gap-4 pt-2 border-top">
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="isPublishedCheck"
                        checked={formData.isPublished}
                        onChange={e => setFormData({ ...formData, isPublished: e.target.checked })}
                      />
                      <label className="form-check-label small user-select-none" htmlFor="isPublishedCheck">
                        Publish immediately to public portal
                      </label>
                    </div>

                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="isFeaturedCheck"
                        checked={formData.isFeatured}
                        onChange={e => setFormData({ ...formData, isFeatured: e.target.checked })}
                      />
                      <label className="form-check-label small user-select-none" htmlFor="isFeaturedCheck">
                        Feature in homepage highlight banner
                      </label>
                    </div>
                  </div>
                </div>

                <div className="modal-footer bg-light px-4 py-3 d-flex justify-content-between">
                  <button
                    type="button"
                    className="btn btn-outline-secondary rounded-pill px-4"
                    onClick={() => setIsFormModalOpen(false)}
                    disabled={submittingForm}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary rounded-pill px-4 fw-semibold"
                    disabled={submittingForm}
                  >
                    {submittingForm ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-1" role="status"></span>
                        Saving to Firestore...
                      </>
                    ) : (
                      editingEventId ? 'Update Event' : 'Create & Save Event'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Delete Confirmation Modal */}
      {deletingEvent && (
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
                  <i className="bi bi-exclamation-triangle-fill me-2"></i> Confirm Event Deletion
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setDeletingEvent(null)}
                  disabled={deletingProgress}
                ></button>
              </div>
              <div className="modal-body p-4">
                <p className="text-dark mb-2">
                  Are you sure you want to permanently delete:
                </p>
                <div className="p-3 bg-light rounded-3 border mb-3">
                  <strong className="text-dark d-block">{deletingEvent.title}</strong>
                  <small className="text-danger d-block">
                    Current registered students: {deletingEvent.registeredCount}
                  </small>
                </div>
                <p className="small text-muted mb-0">
                  This action cannot be undone. All associated student RSVPs will be marked cancelled.
                </p>
              </div>
              <div className="modal-footer bg-light px-4 py-3 d-flex justify-content-between">
                <button
                  type="button"
                  className="btn btn-outline-secondary rounded-pill px-3"
                  onClick={() => setDeletingEvent(null)}
                  disabled={deletingProgress}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-danger rounded-pill px-4 fw-semibold"
                  onClick={handleConfirmDelete}
                  disabled={deletingProgress}
                >
                  {deletingProgress ? 'Deleting...' : 'Delete Permanently'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: View Participants & CSV Export Modal */}
      {participantEvent && (
        <div
          className="modal fade show d-block bg-dark bg-opacity-75"
          tabIndex={-1}
          role="dialog"
          aria-modal="true"
        >
          <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
              <div className="modal-header bg-dark text-white py-3 px-4 d-flex justify-content-between align-items-center">
                <div>
                  <h5 className="modal-title fw-bold mb-0">
                    <i className="bi bi-people-fill text-primary me-2"></i> Event Participant Roster
                  </h5>
                  <small className="text-white-50">{participantEvent.title}</small>
                </div>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setParticipantEvent(null)}
                ></button>
              </div>

              {/* Action Toolbar */}
              <div className="bg-light px-4 py-2 border-bottom d-flex align-items-center justify-content-between">
                <span className="small text-muted">
                  Total Registrants: <strong>{participants.length}</strong> / Max Capacity: <strong>{participantEvent.maxCapacity}</strong>
                </span>

                <button
                  className="btn btn-success btn-sm rounded-pill px-3 fw-semibold shadow-sm d-flex align-items-center gap-1"
                  onClick={handleExportCsv}
                  disabled={participants.length === 0 || exportingCsv}
                >
                  {exportingCsv ? (
                    'Exporting...'
                  ) : (
                    <>
                      <i className="bi bi-file-earmark-spreadsheet-fill"></i> Export as CSV
                    </>
                  )}
                </button>
              </div>

              <div className="modal-body p-0">
                {loadingParticipants ? (
                  <div className="p-5 text-center">
                    <div className="spinner-border text-primary mb-2" role="status"></div>
                    <p className="text-muted small">Loading registrations from Firestore...</p>
                  </div>
                ) : participants.length === 0 ? (
                  <div className="p-5 text-center">
                    <i className="bi bi-people text-muted fs-1 mb-2 d-block"></i>
                    <h6 className="fw-bold">No Students Registered Yet</h6>
                    <p className="text-muted small">Once students RSVP for this event, their records will appear here.</p>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0 small">
                      <thead className="table-light text-uppercase">
                        <tr>
                          <th>Student Name</th>
                          <th>Student ID</th>
                          <th>Email</th>
                          <th>Department</th>
                          <th>Booked At</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {participants.map(p => (
                          <tr key={p.id}>
                            <td><strong>{p.studentName}</strong></td>
                            <td><code>{p.studentId}</code></td>
                            <td>{p.studentEmail}</td>
                            <td>{p.department}</td>
                            <td>{new Date(p.registeredAt).toLocaleDateString()}</td>
                            <td>
                              <span className={`badge ${p.status === 'confirmed' ? 'bg-success' : 'bg-danger'}`}>
                                {p.status.toUpperCase()}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="modal-footer bg-light px-4 py-3">
                <button
                  type="button"
                  className="btn btn-secondary rounded-pill px-4"
                  onClick={() => setParticipantEvent(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
