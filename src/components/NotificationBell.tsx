import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { AppNotification } from '../types';
import { firebaseService } from '../services/firebaseService';

interface NotificationBellProps {
  onGoToDashboardTab?: (tab: string) => void;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({ onGoToDashboardTab }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const loadNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const list = await firebaseService.getStudentNotifications(user.uid);
      setNotifications(list);
    } catch (err) {
      console.warn('Failed to fetch notifications:', err);
    }
  }, [user]);

  // Click outside listener for notification dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      return;
    }
    loadNotifications();

    // Listen to real-time notification events
    const unsubscribe = firebaseService.onNotificationsChanged(() => {
      loadNotifications();
    });

    return () => {
      unsubscribe();
    };
  }, [user, loadNotifications]);

  if (!user) return null;

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleMarkAsRead = async (notifId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await firebaseService.markNotificationAsRead(notifId);
      await loadNotifications();
    } catch (err) {
      console.error('Mark read error:', err);
    }
  };

  const handleMarkAllRead = async () => {
    if (!user) return;
    try {
      await firebaseService.markAllNotificationsAsRead(user.uid);
      await loadNotifications();
    } catch (err) {
      console.error('Mark all read error:', err);
    }
  };

  const getTypeIcon = (type: AppNotification['type']) => {
    switch (type) {
      case 'registration_success':
        return <i className="bi bi-ticket-perforated-fill text-success fs-5"></i>;
      case 'registration_cancelled':
        return <i className="bi bi-x-circle-fill text-danger fs-5"></i>;
      case 'event_updated':
        return <i className="bi bi-calendar2-range-fill text-warning fs-5"></i>;
      case 'event_cancelled':
        return <i className="bi bi-exclamation-triangle-fill text-danger fs-5"></i>;
      case 'announcement':
      default:
        return <i className="bi bi-megaphone-fill text-primary fs-5"></i>;
    }
  };

  return (
    <div className="dropdown position-relative" ref={dropdownRef}>
      <button
        className="btn btn-outline-light btn-sm rounded-circle position-relative p-0 d-flex align-items-center justify-content-center"
        style={{ width: '34px', height: '34px' }}
        type="button"
        id="notificationDropdownButton"
        aria-expanded={isOpen}
        onClick={() => setIsOpen(!isOpen)}
        aria-label={`Notifications, ${unreadCount} unread`}
      >
        <i className="bi bi-bell-fill fs-6"></i>
        {unreadCount > 0 && (
          <span
            className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger shadow-sm border border-2 border-primary"
            style={{ fontSize: '0.65rem', padding: '0.25em 0.45em' }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
            <span className="visually-hidden">unread notifications</span>
          </span>
        )}
      </button>

      <div
        className={`dropdown-menu dropdown-menu-end shadow-lg border-0 p-0 rounded-4 overflow-hidden mt-2 ${isOpen ? 'show' : ''}`}
        style={{ width: '340px', maxWidth: '90vw', position: 'absolute', right: 0 }}
        aria-labelledby="notificationDropdownButton"
      >
        {/* Dropdown Header */}
        <div className="bg-primary text-white p-3 d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center gap-2">
            <i className="bi bi-bell-fill"></i>
            <span className="fw-bold small">Notification Center</span>
            {unreadCount > 0 && (
              <span className="badge bg-warning text-dark font-monospace" style={{ fontSize: '0.7rem' }}>
                {unreadCount} new
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              className="btn btn-link btn-sm text-white-50 text-decoration-none p-0"
              style={{ fontSize: '0.75rem' }}
              onClick={handleMarkAllRead}
            >
              Mark all read
            </button>
          )}
        </div>

        {/* Notification List */}
        <div style={{ maxHeight: '340px', overflowY: 'auto' }}>
          {notifications.length === 0 ? (
            <div className="text-center py-4 px-3 text-muted">
              <i className="bi bi-bell-slash fs-3 d-block mb-1 text-secondary opacity-50"></i>
              <p className="small mb-0">No notifications at this time.</p>
              <small className="text-muted" style={{ fontSize: '0.72rem' }}>
                You will be notified here when you RSVP or if schedules change.
              </small>
            </div>
          ) : (
            notifications.slice(0, 6).map(n => (
              <div
                key={n.id}
                className={`p-3 border-bottom transition-all ${!n.isRead ? 'bg-primary-subtle bg-opacity-25' : 'bg-white'}`}
                style={{ cursor: 'pointer' }}
                onClick={() => {
                  setIsOpen(false);
                  if (!n.isRead) {
                    firebaseService.markNotificationAsRead(n.id).then(() => loadNotifications());
                  }
                  if (onGoToDashboardTab) onGoToDashboardTab('notifications');
                }}
              >
                <div className="d-flex align-items-start gap-2">
                  <div className="mt-1">{getTypeIcon(n.type)}</div>
                  <div className="flex-grow-1">
                    <div className="d-flex align-items-center justify-content-between gap-1 mb-1">
                      <strong className={`small ${!n.isRead ? 'text-dark fw-bold' : 'text-secondary fw-semibold'}`}>
                        {n.title}
                      </strong>
                      {!n.isRead && (
                        <span
                          className="rounded-circle bg-primary d-inline-block"
                          style={{ width: '8px', height: '8px' }}
                          title="Unread"
                        ></span>
                      )}
                    </div>
                    <p className="small text-secondary mb-1 line-clamp-2" style={{ fontSize: '0.8rem', lineHeight: 1.4 }}>
                      {n.message}
                    </p>
                    <div className="d-flex align-items-center justify-content-between">
                      <small className="text-muted" style={{ fontSize: '0.7rem' }}>
                        {new Date(n.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} at{' '}
                        {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </small>
                      {!n.isRead && (
                        <button
                          type="button"
                          className="btn btn-link p-0 text-decoration-none text-primary"
                          style={{ fontSize: '0.72rem' }}
                          onClick={e => handleMarkAsRead(n.id, e)}
                        >
                          Mark read
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && onGoToDashboardTab && (
          <div className="p-2 text-center bg-light border-top">
            <button
              type="button"
              className="btn btn-link btn-sm text-decoration-none text-primary fw-semibold p-0"
              style={{ fontSize: '0.8rem' }}
              onClick={() => {
                setIsOpen(false);
                onGoToDashboardTab('notifications');
              }}
            >
              View all {notifications.length} in Dashboard <i className="bi bi-arrow-right"></i>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
