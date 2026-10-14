/**
 * Campus Event Management System - Main Application Entry
 * Built with HTML, CSS, JavaScript, Bootstrap 5 and Firebase Authentication.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { FeaturedCarousel } from './components/FeaturedCarousel';
import { EventsSection } from './components/EventsSection';
import { EventDetailsModal } from './components/EventDetailsModal';
import { AuthModal } from './components/AuthModal';
import { StudentDashboard } from './components/StudentDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { AboutAndContact } from './components/AboutAndContact';
import { Footer } from './components/Footer';
import { TestSuiteModal } from './components/TestSuiteModal';
import { CampusEvent } from './types';
import { firebaseService } from './services/firebaseService';

function MainLayout() {
  const { user } = useAuth();
  const [currentView, setCurrentView] = useState<'home' | 'events' | 'dashboard' | 'admin' | 'about' | 'contact'>('home');
  const [events, setEvents] = useState<CampusEvent[]>([]);
  const [loadingEvents, setLoadingEvents] = useState<boolean>(true);

  // Selected event for detail modal
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  // Auth modal state
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authTab, setAuthTab] = useState<'login' | 'register'>('login');

  // Test suite modal
  const [isTestSuiteOpen, setIsTestSuiteOpen] = useState(false);

  // Load events
  const loadEvents = useCallback(async () => {
    setLoadingEvents(true);
    try {
      const data = await firebaseService.getEvents();
      setEvents(data);
    } catch (err) {
      console.error('Failed to load events from Firestore:', err);
    } finally {
      setLoadingEvents(false);
    }
  }, []);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const handleOpenAuth = (tab: 'login' | 'register' | 'admin' = 'login') => {
    setAuthTab(tab === 'admin' ? 'login' : tab);
    setIsAuthOpen(true);
  };

  const handleAuthSuccess = () => {
    setIsAuthOpen(false);
    const currentUser = firebaseService.getCurrentUser();
    const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'superadmin' || currentUser?.email === 'admin@campus.edu' || currentUser?.email === 'asikaasika847@gmail.com';
    if (isAdmin) {
      setCurrentView('admin');
    } else {
      setCurrentView('dashboard');
    }
  };

  const handleSelectEvent = (event: CampusEvent) => {
    setSelectedEventId(event.id);
  };

  const handleSelectEventId = (eventId: string) => {
    setSelectedEventId(eventId);
  };

  return (
    <div className="d-flex flex-column min-vh-100 bg-light text-dark font-sans">
      {/* Top University Announcement Bar */}
      <div className="bg-dark text-white-50 py-1 small border-bottom border-secondary border-opacity-25">
        <div className="container d-flex flex-wrap justify-content-between align-items-center gap-2" style={{ fontSize: '0.78rem' }}>
          <div>
            <i className="bi bi-megaphone-fill text-warning me-1"></i>
            <span className="text-white fw-medium">Spring Registration Active:</span> Fall & Spring 2026 Campus Events now open for student RSVP.
          </div>
          <div className="d-flex gap-3">
            <span className="text-white-50">
              <i className="bi bi-shield-lock-fill text-success me-1"></i> Firebase Auth Protected
            </span>
            <span className="d-none d-md-inline text-white-50">
              <i className="bi bi-mortarboard me-1"></i> Office of Student Affairs
            </span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <Navbar
        currentView={currentView}
        onNavigate={view => {
          setCurrentView(view);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenAuth={handleOpenAuth}
        onOpenTestSuite={() => setIsTestSuiteOpen(true)}
      />

      {/* Main View Router */}
      <main className="flex-grow-1">
        {currentView === 'home' && (
          <>
            <Hero
              onExploreEvents={() => {
                const el = document.getElementById('events-catalog');
                if (el) {
                  el.scrollIntoView({ behavior: 'smooth' });
                } else {
                  setCurrentView('events');
                }
              }}
              onOpenRegister={() => handleOpenAuth('register')}
              isAuthenticated={!!user}
              onGoToDashboard={() => setCurrentView('dashboard')}
            />

            <FeaturedCarousel
              events={events}
              onSelectEvent={handleSelectEvent}
            />

            <EventsSection
              events={events}
              loading={loadingEvents}
              onSelectEvent={handleSelectEvent}
            />

            <AboutAndContact />
          </>
        )}

        {currentView === 'events' && (
          <div className="py-3">
            <EventsSection
              events={events}
              loading={loadingEvents}
              onSelectEvent={handleSelectEvent}
            />
          </div>
        )}

        {currentView === 'dashboard' && (
          <StudentDashboard
            onSelectEventId={handleSelectEventId}
            onExploreEvents={() => setCurrentView('events')}
          />
        )}

        {currentView === 'admin' && (
          <AdminDashboard
            onOpenAuth={handleOpenAuth}
            onExplorePublicEvents={() => setCurrentView('events')}
          />
        )}

        {currentView === 'about' && (
          <div className="py-4">
            <AboutAndContact />
          </div>
        )}

        {currentView === 'contact' && (
          <div className="py-4">
            <AboutAndContact />
          </div>
        )}
      </main>

      {/* Event Details & RSVP Modal */}
      <EventDetailsModal
        eventId={selectedEventId}
        onClose={() => setSelectedEventId(null)}
        onOpenAuth={handleOpenAuth}
        onGoToDashboard={() => {
          setSelectedEventId(null);
          setCurrentView('dashboard');
        }}
        onEventUpdated={loadEvents}
      />

      {/* Login / Registration Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        initialTab={authTab}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={handleAuthSuccess}
      />

      {/* Automated Verification Test Suite */}
      <TestSuiteModal
        isOpen={isTestSuiteOpen}
        onClose={() => setIsTestSuiteOpen(false)}
        onRefreshAppState={() => {
          loadEvents();
        }}
      />

      {/* Footer */}
      <Footer
        onNavigate={view => {
          setCurrentView(view);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenAuth={handleOpenAuth}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  );
}
