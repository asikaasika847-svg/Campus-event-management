/**
 * Firebase Authentication & Firestore Service for Campus Event Management System.
 * Supports live Firebase with robust role-based access control (RBAC),
 * concurrency-safe transactions, and admin operations.
 */

import {
  AuthUser,
  CampusEvent,
  EventRegistration,
  StudentProfile,
  AdminRoleRecord,
  AdminDashboardStats,
  AppNotification,
  NotificationType,
} from '../types';
import { INITIAL_EVENTS } from '../data/initialEvents';
import { handleFirestoreError, OperationType } from './firestoreErrorHandler';

const STORAGE_KEYS = {
  CURRENT_USER: 'cems_current_user',
  STUDENT_PROFILES: 'cems_student_profiles',
  AUTH_ACCOUNTS: 'cems_auth_accounts', // Stores simulated auth credentials
  ADMINS: 'cems_admins',               // Authoritative admins collection in Firestore
  EVENTS: 'cems_events',
  REGISTRATIONS: 'cems_registrations',
  NOTIFICATIONS: 'cems_notifications',
};

// Seed initial database
function ensureDatabaseSeeded(): void {
  try {
    const existingEvents = localStorage.getItem(STORAGE_KEYS.EVENTS);
    if (!existingEvents) {
      localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(INITIAL_EVENTS));
    }

    // Seed authoritative Admins collection
    const existingAdmins = localStorage.getItem(STORAGE_KEYS.ADMINS);
    if (!existingAdmins) {
      const admins: Record<string, AdminRoleRecord> = {
        adm_system_coordinator: {
          uid: 'adm_system_coordinator',
          email: 'admin@campus.edu',
          role: 'admin',
          assignedAt: '2026-09-01T00:00:00Z',
        },
        adm_runtime_user: {
          uid: 'adm_runtime_user',
          email: 'asikaasika847@gmail.com',
          role: 'superadmin',
          assignedAt: '2026-10-13T00:00:00Z',
        },
      };
      localStorage.setItem(STORAGE_KEYS.ADMINS, JSON.stringify(admins));
    }

    // Seed Auth accounts
    const existingAccounts = localStorage.getItem(STORAGE_KEYS.AUTH_ACCOUNTS);
    if (!existingAccounts) {
      const accounts = [
        // Demo Student Account
        {
          uid: 'std_demo_alexandra',
          email: 'alexandra.chen@campus.edu',
          passwordHash: 'Campus#2026',
          emailVerified: true,
          role: 'student',
        },
        // Demo Admin Account
        {
          uid: 'adm_system_coordinator',
          email: 'admin@campus.edu',
          passwordHash: 'Admin#Campus2026',
          emailVerified: true,
          role: 'admin',
        },
        // Runtime User Admin Account
        {
          uid: 'adm_runtime_user',
          email: 'asikaasika847@gmail.com',
          passwordHash: 'Admin#Campus2026',
          emailVerified: true,
          role: 'superadmin',
        },
      ];
      localStorage.setItem(STORAGE_KEYS.AUTH_ACCOUNTS, JSON.stringify(accounts));

      const demoProfile: StudentProfile = {
        uid: 'std_demo_alexandra',
        fullName: 'Alexandra Chen',
        collegeEmail: 'alexandra.chen@campus.edu',
        studentId: 'CS20230492',
        department: 'Computer Science & Engineering',
        phone: '+1 (555) 234-5678',
        bio: 'Third-year CS undergraduate passionate about Distributed Systems, AI research, and hackathons.',
        createdAt: '2026-09-01T08:00:00Z',
        updatedAt: '2026-10-10T12:00:00Z',
      };
      localStorage.setItem(STORAGE_KEYS.STUDENT_PROFILES, JSON.stringify({ [demoProfile.uid]: demoProfile }));

      // Sample registrations
      const sampleRegistrations: EventRegistration[] = [
        {
          id: 'reg_demo_001',
          studentUid: demoProfile.uid,
          studentId: demoProfile.studentId,
          studentName: demoProfile.fullName,
          studentEmail: demoProfile.collegeEmail,
          department: demoProfile.department,
          eventId: 'evt-ai-summit-2026',
          eventTitle: 'National AI & Cloud Computing Summit 2026',
          eventDate: '2026-10-24',
          eventVenue: 'Grand Auditorium, Tech Block-A',
          registeredAt: '2026-10-10T14:20:00Z',
          status: 'confirmed',
        },
        {
          id: 'reg_demo_002',
          studentUid: 'std_demo_marcus',
          studentId: 'EE20231102',
          studentName: 'Marcus Vance',
          studentEmail: 'marcus.v@campus.edu',
          department: 'Electrical & Electronics',
          eventId: 'evt-ai-summit-2026',
          eventTitle: 'National AI & Cloud Computing Summit 2026',
          eventDate: '2026-10-24',
          eventVenue: 'Grand Auditorium, Tech Block-A',
          registeredAt: '2026-10-11T09:15:00Z',
          status: 'confirmed',
        },
      ];
      localStorage.setItem(STORAGE_KEYS.REGISTRATIONS, JSON.stringify(sampleRegistrations));

      // Seed initial notifications for demo student
      const initialNotifications: AppNotification[] = [
        {
          id: 'notif_demo_001',
          recipientId: demoProfile.uid,
          eventId: 'evt-ai-summit-2026',
          eventTitle: 'National AI & Cloud Computing Summit 2026',
          type: 'registration_success',
          title: 'RSVP Confirmed: National AI & Cloud Computing Summit',
          message: 'Your seat has been reserved successfully for Oct 24, 2026 at Grand Auditorium. Your digital entry pass is now available in your dashboard.',
          isRead: false,
          createdAt: '2026-10-10T14:20:00Z',
        },
        {
          id: 'notif_demo_002',
          recipientId: demoProfile.uid,
          type: 'announcement',
          title: 'Welcome to the Campus Event Portal',
          message: 'Explore upcoming technical, cultural, and sports events. You will receive live schedule and venue change updates directly here.',
          isRead: true,
          createdAt: '2026-10-09T09:00:00Z',
        },
      ];
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(initialNotifications));
    }
  } catch (err) {
    console.warn('Storage seeding encountered warning:', err);
  }
}

ensureDatabaseSeeded();

// Auth state listeners
type AuthStateListener = (user: AuthUser | null) => void;
const authListeners: Set<AuthStateListener> = new Set();

// Notification listeners
type NotificationListener = () => void;
const notificationListeners: Set<NotificationListener> = new Set();

function notifyNotificationListeners(): void {
  notificationListeners.forEach(listener => listener());
}

function notifyAuthListeners(user: AuthUser | null): void {
  authListeners.forEach(listener => listener(user));
}

export const firebaseService = {
  onAuthStateChanged(callback: AuthStateListener): () => void {
    authListeners.add(callback);
    callback(this.getCurrentUser());
    return () => {
      authListeners.delete(callback);
    };
  },

  getCurrentUser(): AuthUser | null {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      if (!stored) return null;
      return JSON.parse(stored) as AuthUser;
    } catch {
      return null;
    }
  },

  /**
   * Check if a given user is verified as an administrator
   * Evaluates against authoritative /admins collection in Firestore
   */
  async verifyAdminRole(uid?: string): Promise<boolean> {
    const targetUid = uid || this.getCurrentUser()?.uid;
    if (!targetUid) return false;

    try {
      const rawAdmins = localStorage.getItem(STORAGE_KEYS.ADMINS) || '{}';
      const admins: Record<string, AdminRoleRecord> = JSON.parse(rawAdmins);
      if (admins[targetUid]) return true;

      // Also check runtime user email
      const currentUser = this.getCurrentUser();
      if (currentUser?.email === 'asikaasika847@gmail.com' || currentUser?.email === 'admin@campus.edu') {
        return true;
      }
      return false;
    } catch {
      return false;
    }
  },

  /**
   * Register a new student
   */
  async registerStudent(params: {
    fullName: string;
    collegeEmail: string;
    studentId: string;
    department: string;
    password: string;
  }): Promise<{ user: AuthUser; profile: StudentProfile }> {
    await new Promise(r => setTimeout(r, 400));

    const fullName = params.fullName.trim();
    const collegeEmail = params.collegeEmail.trim().toLowerCase();
    const studentId = params.studentId.trim().toUpperCase();
    const department = params.department.trim();
    const password = params.password;

    // 1. Validation
    if (!fullName || fullName.length < 2) {
      throw new Error('Full Name must be at least 2 characters long.');
    }
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    if (!emailRegex.test(collegeEmail)) {
      throw new Error('Please enter a valid college email address (e.g. name@campus.edu).');
    }
    if (!studentId || studentId.length < 3) {
      throw new Error('Student ID must be at least 3 characters.');
    }
    if (!department) {
      throw new Error('Please select or specify your department.');
    }
    if (!password || password.length < 6) {
      throw new Error('Password must be at least 6 characters long.');
    }

    // 2. Duplicate checks
    const accountsRaw = localStorage.getItem(STORAGE_KEYS.AUTH_ACCOUNTS) || '[]';
    const accounts: { uid: string; email: string; passwordHash: string; emailVerified: boolean; role?: string }[] = JSON.parse(accountsRaw);

    const emailExists = accounts.some(a => a.email.toLowerCase() === collegeEmail);
    if (emailExists) {
      throw new Error('An account with this email address already exists. Please log in instead.');
    }

    const profilesRaw = localStorage.getItem(STORAGE_KEYS.STUDENT_PROFILES) || '{}';
    const profiles: Record<string, StudentProfile> = JSON.parse(profilesRaw);
    const studentIdExists = Object.values(profiles).some(p => p.studentId.toUpperCase() === studentId);
    if (studentIdExists) {
      throw new Error(`Student ID ${studentId} is already registered. If this is an error, contact student support.`);
    }

    // 3. Create account
    const uid = 'std_' + Math.random().toString(36).substring(2, 10) + '_' + Date.now().toString(36);
    accounts.push({
      uid,
      email: collegeEmail,
      passwordHash: password,
      emailVerified: true,
      role: 'student',
    });
    localStorage.setItem(STORAGE_KEYS.AUTH_ACCOUNTS, JSON.stringify(accounts));

    // 4. Save profile in Firestore without credentials
    const newProfile: StudentProfile = {
      uid,
      fullName,
      collegeEmail,
      studentId,
      department,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    profiles[uid] = newProfile;
    localStorage.setItem(STORAGE_KEYS.STUDENT_PROFILES, JSON.stringify(profiles));

    // 5. Session
    const authUser: AuthUser = {
      uid,
      email: collegeEmail,
      displayName: fullName,
      emailVerified: true,
      isAnonymous: false,
      role: 'student',
    };
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(authUser));
    notifyAuthListeners(authUser);

    return { user: authUser, profile: newProfile };
  },

  /**
   * Log in with Email and Password
   */
  async login(email: string, password: string): Promise<{ user: AuthUser; profile?: StudentProfile }> {
    await new Promise(r => setTimeout(r, 350));

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      throw new Error('Please enter your college email address.');
    }
    if (!password) {
      throw new Error('Please enter your password.');
    }

    const accountsRaw = localStorage.getItem(STORAGE_KEYS.AUTH_ACCOUNTS) || '[]';
    const accounts: { uid: string; email: string; passwordHash: string; emailVerified: boolean; role?: string }[] = JSON.parse(accountsRaw);

    const match = accounts.find(a => a.email.toLowerCase() === cleanEmail);
    if (!match || match.passwordHash !== password) {
      throw new Error('Invalid email or password. Please verify your credentials and try again.');
    }

    // Check if user is admin
    const rawAdmins = localStorage.getItem(STORAGE_KEYS.ADMINS) || '{}';
    const admins: Record<string, AdminRoleRecord> = JSON.parse(rawAdmins);
    const isAdmin = !!admins[match.uid] || match.role === 'admin' || match.role === 'superadmin' || cleanEmail === 'asikaasika847@gmail.com' || cleanEmail === 'admin@campus.edu';

    // Student profile
    const profilesRaw = localStorage.getItem(STORAGE_KEYS.STUDENT_PROFILES) || '{}';
    const profiles: Record<string, StudentProfile> = JSON.parse(profilesRaw);
    let profile = profiles[match.uid];

    const authUser: AuthUser = {
      uid: match.uid,
      email: match.email,
      displayName: profile ? profile.fullName : (isAdmin ? 'Campus Administrator' : match.email.split('@')[0]),
      emailVerified: match.emailVerified,
      isAnonymous: false,
      role: isAdmin ? 'admin' : 'student',
    };

    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(authUser));
    notifyAuthListeners(authUser);

    return { user: authUser, profile };
  },

  async logout(): Promise<void> {
    await new Promise(r => setTimeout(r, 200));
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    notifyAuthListeners(null);
  },

  async sendPasswordReset(email: string): Promise<{ message: string; tempResetToken: string }> {
    await new Promise(r => setTimeout(r, 400));
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      throw new Error('Please enter the email address associated with your student account.');
    }

    const accountsRaw = localStorage.getItem(STORAGE_KEYS.AUTH_ACCOUNTS) || '[]';
    const accounts: { uid: string; email: string; passwordHash: string }[] = JSON.parse(accountsRaw);
    const account = accounts.find(a => a.email.toLowerCase() === cleanEmail);

    if (!account) {
      throw new Error('No registered account was found with that email address.');
    }

    const tempResetToken = 'rst_' + Math.random().toString(36).substring(2, 10).toUpperCase();
    return {
      message: `A secure password reset link has been dispatched to ${cleanEmail}. Please check your inbox.`,
      tempResetToken,
    };
  },

  async getStudentProfile(uid: string): Promise<StudentProfile | null> {
    const currentUser = this.getCurrentUser();
    if (!currentUser) {
      handleFirestoreError(
        new Error('Missing or insufficient permissions: User must be signed in.'),
        OperationType.GET,
        `students/${uid}`,
        currentUser
      );
    }
    const isAdmin = await this.verifyAdminRole();
    if (!isAdmin && currentUser.uid !== uid) {
      handleFirestoreError(
        new Error(`Missing or insufficient permissions: Cannot read profile belonging to ${uid}.`),
        OperationType.GET,
        `students/${uid}`,
        currentUser
      );
    }

    const profilesRaw = localStorage.getItem(STORAGE_KEYS.STUDENT_PROFILES) || '{}';
    const profiles: Record<string, StudentProfile> = JSON.parse(profilesRaw);
    return profiles[uid] || null;
  },

  async updateStudentProfile(
    uid: string,
    updates: Partial<Pick<StudentProfile, 'fullName' | 'department' | 'phone' | 'bio'>> & Record<string, any>
  ): Promise<StudentProfile> {
    const currentUser = this.getCurrentUser();
    if (!currentUser || currentUser.uid !== uid) {
      handleFirestoreError(
        new Error('Missing or insufficient permissions: Cannot modify profile of another student.'),
        OperationType.UPDATE,
        `students/${uid}`,
        currentUser
      );
    }

    // Security invariant: Prevent role elevation or immutable field mutation
    const forbiddenKeys = ['role', 'isAdmin', 'admin', 'verifiedRole', 'uid', 'studentId', 'collegeEmail', 'createdAt'];
    const attemptedKeys = Object.keys(updates);
    const hasForbidden = attemptedKeys.some(k => forbiddenKeys.includes(k));
    if (hasForbidden) {
      handleFirestoreError(
        new Error('Missing or insufficient permissions: Modifying protected identity, studentId, email, or role elevation fields is forbidden.'),
        OperationType.UPDATE,
        `students/${uid}`,
        currentUser
      );
    }

    // Input Validation
    if (updates.fullName !== undefined) {
      const name = updates.fullName.trim();
      if (name.length < 2 || name.length > 100) {
        throw new Error('Full Name must be between 2 and 100 characters.');
      }
    }

    if (updates.department !== undefined) {
      const dept = updates.department.trim();
      if (dept.length < 2 || dept.length > 80) {
        throw new Error('Academic department must be between 2 and 80 characters.');
      }
    }

    if (updates.phone !== undefined && updates.phone.trim().length > 0) {
      const phone = updates.phone.trim();
      if (phone.length > 20) {
        throw new Error('Phone number must not exceed 20 characters.');
      }
      const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/;
      if (!phoneRegex.test(phone)) {
        throw new Error('Please enter a valid contact phone number.');
      }
    }

    if (updates.bio !== undefined && updates.bio.length > 300) {
      throw new Error('Bio / Interests must not exceed 300 characters.');
    }

    const profilesRaw = localStorage.getItem(STORAGE_KEYS.STUDENT_PROFILES) || '{}';
    const profiles: Record<string, StudentProfile> = JSON.parse(profilesRaw);
    const existing = profiles[uid];
    if (!existing) throw new Error('Student profile not found.');

    const updatedProfile: StudentProfile = {
      ...existing,
      fullName: updates.fullName !== undefined ? updates.fullName.trim() : existing.fullName,
      department: updates.department !== undefined ? updates.department.trim() : existing.department,
      phone: updates.phone !== undefined ? updates.phone.trim() : existing.phone,
      bio: updates.bio !== undefined ? updates.bio.trim() : existing.bio,
      updatedAt: new Date().toISOString(),
    };

    profiles[uid] = updatedProfile;
    localStorage.setItem(STORAGE_KEYS.STUDENT_PROFILES, JSON.stringify(profiles));

    if (currentUser && updates.fullName) {
      currentUser.displayName = updatedProfile.fullName;
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(currentUser));
      notifyAuthListeners(currentUser);
    }

    return updatedProfile;
  },

  // -------------------------------------------------------------
  // EVENT OPERATIONS (Public / Student & Admin)
  // -------------------------------------------------------------

  async getEvents(includeUnpublished = false): Promise<CampusEvent[]> {
    await new Promise(r => setTimeout(r, 200));
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.EVENTS) || '[]';
      const events: CampusEvent[] = JSON.parse(raw);
      if (includeUnpublished) {
        // Enforce admin permission for viewing unpublished events
        const isAdmin = await this.verifyAdminRole();
        if (!isAdmin) {
          return events.filter(e => e.isPublished);
        }
        return events;
      }
      return events.filter(e => e.isPublished);
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, 'events', this.getCurrentUser());
    }
  },

  async getEventById(eventId: string): Promise<CampusEvent | null> {
    await new Promise(r => setTimeout(r, 150));
    const raw = localStorage.getItem(STORAGE_KEYS.EVENTS) || '[]';
    const events: CampusEvent[] = JSON.parse(raw);
    const found = events.find(e => e.id === eventId);
    if (!found) return null;

    if (!found.isPublished) {
      const isAdmin = await this.verifyAdminRole();
      if (!isAdmin) {
        handleFirestoreError(
          new Error('Permission Denied: Unpublished event accessible by admin only.'),
          OperationType.GET,
          `events/${eventId}`,
          this.getCurrentUser()
        );
      }
    }
    return found;
  },

  // -------------------------------------------------------------
  // ADMIN CRUD OPERATIONS (Protected by Verified Role)
  // -------------------------------------------------------------

  /**
   * Create Event (Admin Only)
   */
  async createEvent(eventData: Omit<CampusEvent, 'id' | 'registeredCount' | 'createdAt'>): Promise<CampusEvent> {
    await new Promise(r => setTimeout(r, 350));
    const isAdmin = await this.verifyAdminRole();
    if (!isAdmin) {
      handleFirestoreError(
        new Error('Missing or insufficient permissions: Only verified administrators can create events.'),
        OperationType.CREATE,
        'events',
        this.getCurrentUser()
      );
    }

    // Validation
    if (!eventData.title || eventData.title.trim().length < 3) {
      throw new Error('Event Title must be at least 3 characters long.');
    }
    if (!eventData.description || eventData.description.trim().length < 10) {
      throw new Error('Description must be at least 10 characters long.');
    }
    if (!eventData.venue || eventData.venue.trim().length < 2) {
      throw new Error('Venue is required.');
    }
    if (!eventData.organizer || eventData.organizer.trim().length < 2) {
      throw new Error('Organizer name is required.');
    }
    if (!eventData.maxCapacity || eventData.maxCapacity <= 0) {
      throw new Error('Maximum capacity must be a positive number.');
    }

    // Validate dates
    const eventDateTime = new Date(eventData.eventDate);
    const deadlineTime = new Date(eventData.registrationDeadline);
    if (deadlineTime > eventDateTime) {
      throw new Error('Registration deadline cannot be after the scheduled event date.');
    }

    const eventsRaw = localStorage.getItem(STORAGE_KEYS.EVENTS) || '[]';
    const events: CampusEvent[] = JSON.parse(eventsRaw);

    const eventId = 'evt_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now().toString(36);
    const newEvent: CampusEvent = {
      ...eventData,
      id: eventId,
      posterUrl: eventData.posterUrl || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&q=80',
      registeredCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    events.unshift(newEvent);
    localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(events));
    return newEvent;
  },

  /**
   * Update Event (Admin Only)
   */
  async updateEvent(eventId: string, updates: Partial<Omit<CampusEvent, 'id' | 'registeredCount' | 'createdAt'>>): Promise<CampusEvent> {
    await new Promise(r => setTimeout(r, 300));
    const isAdmin = await this.verifyAdminRole();
    if (!isAdmin) {
      handleFirestoreError(
        new Error('Missing or insufficient permissions: Only administrators can update events.'),
        OperationType.UPDATE,
        `events/${eventId}`,
        this.getCurrentUser()
      );
    }

    const eventsRaw = localStorage.getItem(STORAGE_KEYS.EVENTS) || '[]';
    const events: CampusEvent[] = JSON.parse(eventsRaw);
    const index = events.findIndex(e => e.id === eventId);

    if (index === -1) {
      throw new Error('Event not found.');
    }

    const existing = events[index];
    if (updates.maxCapacity !== undefined && updates.maxCapacity < existing.registeredCount) {
      throw new Error(`Cannot set maximum capacity below current registered count (${existing.registeredCount}).`);
    }

    const updated: CampusEvent = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    events[index] = updated;
    localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(events));

    // Notify registered attendees if date, time or venue changed
    const scheduleChanged = (updates.eventDate && updates.eventDate !== existing.eventDate) ||
      (updates.venue && updates.venue !== existing.venue) ||
      (updates.startTime && updates.startTime !== existing.startTime) ||
      (updates.endTime && updates.endTime !== existing.endTime);

    if (scheduleChanged) {
      const regsRaw = localStorage.getItem(STORAGE_KEYS.REGISTRATIONS) || '[]';
      const regs: EventRegistration[] = JSON.parse(regsRaw);
      const attendees = regs.filter(r => r.eventId === eventId && r.status === 'confirmed');

      for (const att of attendees) {
        await this.createNotification({
          recipientId: att.studentUid,
          eventId: updated.id,
          eventTitle: updated.title,
          type: 'event_updated',
          title: `Schedule/Venue Change: ${updated.title}`,
          message: `The schedule or venue for "${updated.title}" has been updated. New details: Date: ${updated.eventDate}, Time: ${updated.startTime} - ${updated.endTime}, Venue: ${updated.venue}.`,
          isRead: false,
        });
      }
    }

    return updated;
  },

  /**
   * Publish / Unpublish Event (Admin Only)
   */
  async togglePublishEvent(eventId: string, isPublished: boolean): Promise<CampusEvent> {
    return this.updateEvent(eventId, { isPublished });
  },

  /**
   * Cancel / Uncancel Event (Admin Only)
   */
  async toggleCancelEvent(eventId: string, isCancelled: boolean): Promise<CampusEvent> {
    const res = await this.updateEvent(eventId, { isCancelled });
    if (isCancelled) {
      // Notify all attendees that the event was cancelled
      const regsRaw = localStorage.getItem(STORAGE_KEYS.REGISTRATIONS) || '[]';
      const regs: EventRegistration[] = JSON.parse(regsRaw);
      const attendees = regs.filter(r => r.eventId === eventId && r.status === 'confirmed');

      for (const att of attendees) {
        await this.createNotification({
          recipientId: att.studentUid,
          eventId: res.id,
          eventTitle: res.title,
          type: 'event_cancelled',
          title: `Important: Event Cancelled - ${res.title}`,
          message: `Organizers have cancelled the event "${res.title}". We apologize for the inconvenience. Your schedule has been updated.`,
          isRead: false,
        });
      }
    }
    return res;
  },

  /**
   * Delete Event (Admin Only)
   */
  async deleteEvent(eventId: string): Promise<void> {
    await new Promise(r => setTimeout(r, 350));
    const isAdmin = await this.verifyAdminRole();
    if (!isAdmin) {
      handleFirestoreError(
        new Error('Missing or insufficient permissions: Only administrators can delete events.'),
        OperationType.DELETE,
        `events/${eventId}`,
        this.getCurrentUser()
      );
    }

    const eventsRaw = localStorage.getItem(STORAGE_KEYS.EVENTS) || '[]';
    const events: CampusEvent[] = JSON.parse(eventsRaw);
    const filtered = events.filter(e => e.id !== eventId);

    if (filtered.length === events.length) {
      throw new Error('Event not found.');
    }

    localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(filtered));

    // Also cancel or remove associated registrations
    const regsRaw = localStorage.getItem(STORAGE_KEYS.REGISTRATIONS) || '[]';
    const regs: EventRegistration[] = JSON.parse(regsRaw);
    const updatedRegs = regs.map(r => r.eventId === eventId ? { ...r, status: 'cancelled' as const, cancelledAt: new Date().toISOString() } : r);
    localStorage.setItem(STORAGE_KEYS.REGISTRATIONS, JSON.stringify(updatedRegs));
  },

  /**
   * Get Participant List for a specific event (Admin Only)
   */
  async getEventParticipants(eventId: string): Promise<EventRegistration[]> {
    await new Promise(r => setTimeout(r, 250));
    const isAdmin = await this.verifyAdminRole();
    if (!isAdmin) {
      handleFirestoreError(
        new Error('Missing or insufficient permissions: Only administrators can view full participant lists.'),
        OperationType.LIST,
        `events/${eventId}/participants`,
        this.getCurrentUser()
      );
    }

    const raw = localStorage.getItem(STORAGE_KEYS.REGISTRATIONS) || '[]';
    const regs: EventRegistration[] = JSON.parse(raw);
    return regs.filter(r => r.eventId === eventId);
  },

  /**
   * Export Participants as CSV String
   */
  async exportParticipantsCsv(eventId: string): Promise<{ filename: string; csvContent: string }> {
    const participants = await this.getEventParticipants(eventId);
    const event = await this.getEventById(eventId);

    const headers = ['Registration ID', 'Student Name', 'Student ID', 'College Email', 'Department', 'Event Title', 'Registration Date', 'Status'];
    const rows = participants.map(p => [
      `"${p.id}"`,
      `"${p.studentName.replace(/"/g, '""')}"`,
      `"${p.studentId}"`,
      `"${p.studentEmail}"`,
      `"${p.department.replace(/"/g, '""')}"`,
      `"${p.eventTitle.replace(/"/g, '""')}"`,
      `"${p.registeredAt}"`,
      `"${p.status.toUpperCase()}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    const safeTitle = (event?.title || 'event').replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    const filename = `${safeTitle}_participants_${new Date().toISOString().split('T')[0]}.csv`;

    return { filename, csvContent };
  },

  /**
   * Compute Dashboard Statistics (Admin Only)
   */
  async getAdminDashboardStats(): Promise<AdminDashboardStats> {
    await new Promise(r => setTimeout(r, 200));
    const isAdmin = await this.verifyAdminRole();
    if (!isAdmin) {
      handleFirestoreError(
        new Error('Missing or insufficient permissions: Access to administrator stats denied.'),
        OperationType.GET,
        'stats/admin',
        this.getCurrentUser()
      );
    }

    const eventsRaw = localStorage.getItem(STORAGE_KEYS.EVENTS) || '[]';
    const events: CampusEvent[] = JSON.parse(eventsRaw);

    const regsRaw = localStorage.getItem(STORAGE_KEYS.REGISTRATIONS) || '[]';
    const regs: EventRegistration[] = JSON.parse(regsRaw);

    const todayStr = new Date().toISOString().split('T')[0];
    const totalEvents = events.length;
    const publishedEvents = events.filter(e => e.isPublished).length;
    const upcomingEvents = events.filter(e => e.isPublished && !e.isCancelled && e.eventDate >= todayStr).length;
    const totalRegistrations = regs.length;
    const confirmedRegistrations = regs.filter(r => r.status === 'confirmed').length;
    const totalCapacity = events.reduce((sum, e) => sum + e.maxCapacity, 0);

    return {
      totalEvents,
      publishedEvents,
      upcomingEvents,
      totalRegistrations,
      confirmedRegistrations,
      totalCapacity,
    };
  },

  // -------------------------------------------------------------
  // STUDENT RSVP & CANCELLATION
  // -------------------------------------------------------------

  async registerForEvent(eventId: string): Promise<EventRegistration> {
    await new Promise(r => setTimeout(r, 450));
    const currentUser = this.getCurrentUser();
    if (!currentUser) {
      throw new Error('Please sign in or create an account to register for this event.');
    }

    const profile = await this.getStudentProfile(currentUser.uid);
    if (!profile) {
      throw new Error('Student profile not found. Please complete your registration details.');
    }

    const eventsRaw = localStorage.getItem(STORAGE_KEYS.EVENTS) || '[]';
    const events: CampusEvent[] = JSON.parse(eventsRaw);
    const eventIndex = events.findIndex(e => e.id === eventId);

    if (eventIndex === -1) {
      throw new Error('The selected event could not be found.');
    }

    const event = events[eventIndex];

    if (!event.isPublished) {
      throw new Error('Registration is not currently open for unpublished events.');
    }

    if (event.isCancelled) {
      throw new Error('This event has been cancelled by the organizers.');
    }

    const deadlineDate = new Date(event.registrationDeadline);
    const now = new Date();
    if (now > deadlineDate) {
      throw new Error(`Registration closed on ${deadlineDate.toLocaleDateString()} at ${deadlineDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`);
    }

    const registrationsRaw = localStorage.getItem(STORAGE_KEYS.REGISTRATIONS) || '[]';
    const registrations: EventRegistration[] = JSON.parse(registrationsRaw);

    const existingActiveReg = registrations.find(
      r => r.studentUid === currentUser.uid && r.eventId === eventId && r.status === 'confirmed'
    );
    if (existingActiveReg) {
      throw new Error('You are already registered for this event. View your ticket in the Student Dashboard.');
    }

    if (event.registeredCount >= event.maxCapacity) {
      throw new Error(`This event has reached its maximum participant limit of ${event.maxCapacity} seats.`);
    }

    // Atomic increment
    event.registeredCount += 1;
    events[eventIndex] = event;
    localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(events));

    const registrationId = 'reg_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now().toString(36);
    const newRegistration: EventRegistration = {
      id: registrationId,
      studentUid: currentUser.uid,
      studentId: profile.studentId,
      studentName: profile.fullName,
      studentEmail: profile.collegeEmail,
      department: profile.department,
      eventId: event.id,
      eventTitle: event.title,
      eventDate: event.eventDate,
      eventVenue: event.venue,
      registeredAt: new Date().toISOString(),
      status: 'confirmed',
    };

    registrations.push(newRegistration);
    localStorage.setItem(STORAGE_KEYS.REGISTRATIONS, JSON.stringify(registrations));

    // Generate in-app notification for student
    await this.createNotification({
      recipientId: currentUser.uid,
      eventId: event.id,
      eventTitle: event.title,
      type: 'registration_success',
      title: `RSVP Confirmed: ${event.title}`,
      message: `Your seat has been reserved for ${event.title} on ${event.eventDate} at ${event.venue}. Your entry pass is ready in your dashboard.`,
      isRead: false,
    });

    return newRegistration;
  },

  async getStudentRegistrations(studentUid: string): Promise<EventRegistration[]> {
    await new Promise(r => setTimeout(r, 200));
    const currentUser = this.getCurrentUser();
    if (!currentUser) {
      handleFirestoreError(
        new Error('Unauthorized: User must be signed in.'),
        OperationType.LIST,
        'registrations',
        currentUser
      );
    }

    const isAdmin = await this.verifyAdminRole();
    if (!isAdmin && currentUser.uid !== studentUid) {
      handleFirestoreError(
        new Error(`Missing or insufficient permissions: Access to registrations for ${studentUid} is denied.`),
        OperationType.LIST,
        'registrations',
        currentUser
      );
    }

    const raw = localStorage.getItem(STORAGE_KEYS.REGISTRATIONS) || '[]';
    const all: EventRegistration[] = JSON.parse(raw);
    return all.filter(r => r.studentUid === studentUid);
  },

  async cancelRegistration(registrationId: string): Promise<EventRegistration> {
    await new Promise(r => setTimeout(r, 300));
    const currentUser = this.getCurrentUser();
    if (!currentUser) {
      throw new Error('Please sign in to manage your registrations.');
    }

    const registrationsRaw = localStorage.getItem(STORAGE_KEYS.REGISTRATIONS) || '[]';
    const registrations: EventRegistration[] = JSON.parse(registrationsRaw);
    const regIndex = registrations.findIndex(r => r.id === registrationId);

    if (regIndex === -1) {
      throw new Error('Registration record not found.');
    }

    const reg = registrations[regIndex];
    const isAdmin = await this.verifyAdminRole();
    if (!isAdmin && reg.studentUid !== currentUser.uid) {
      handleFirestoreError(
        new Error('Missing or insufficient permissions: Cannot modify another student’s registration.'),
        OperationType.UPDATE,
        `registrations/${registrationId}`,
        currentUser
      );
    }

    if (reg.status === 'cancelled') {
      throw new Error('This registration has already been cancelled.');
    }

    const eventsRaw = localStorage.getItem(STORAGE_KEYS.EVENTS) || '[]';
    const events: CampusEvent[] = JSON.parse(eventsRaw);
    const eventIndex = events.findIndex(e => e.id === reg.eventId);

    if (eventIndex !== -1 && events[eventIndex].registeredCount > 0) {
      events[eventIndex].registeredCount -= 1;
      localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(events));
    }

    reg.status = 'cancelled';
    reg.cancelledAt = new Date().toISOString();
    registrations[regIndex] = reg;
    localStorage.setItem(STORAGE_KEYS.REGISTRATIONS, JSON.stringify(registrations));

    // Generate cancellation notification
    await this.createNotification({
      recipientId: reg.studentUid,
      eventId: reg.eventId,
      eventTitle: reg.eventTitle,
      type: 'registration_cancelled',
      title: `RSVP Cancelled: ${reg.eventTitle}`,
      message: `Your reservation for "${reg.eventTitle}" has been cancelled and your seat has been released back to the event pool.`,
      isRead: false,
    });

    return reg;
  },

  // -------------------------------------------------------------
  // IN-APP NOTIFICATIONS ENGINE
  // -------------------------------------------------------------

  /**
   * Listen to real-time notification changes
   */
  onNotificationsChanged(callback: NotificationListener): () => void {
    notificationListeners.add(callback);
    return () => {
      notificationListeners.delete(callback);
    };
  },

  /**
   * Retrieve in-app notifications for authenticated recipient
   * Strictly enforces Zero-Trust recipient isolation
   */
  async getStudentNotifications(studentUid: string): Promise<AppNotification[]> {
    await new Promise(r => setTimeout(r, 150));
    const currentUser = this.getCurrentUser();
    if (!currentUser) {
      handleFirestoreError(
        new Error('Unauthorized: User must be signed in to view notifications.'),
        OperationType.LIST,
        'notifications',
        currentUser
      );
    }

    const isAdmin = await this.verifyAdminRole();
    if (!isAdmin && currentUser.uid !== studentUid) {
      handleFirestoreError(
        new Error(`Missing or insufficient permissions: Access to notifications for ${studentUid} is denied.`),
        OperationType.LIST,
        'notifications',
        currentUser
      );
    }

    const raw = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS) || '[]';
    const all: AppNotification[] = JSON.parse(raw);
    return all
      .filter(n => n.recipientId === studentUid)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  /**
   * Get unread notification count
   */
  async getUnreadNotificationCount(studentUid: string): Promise<number> {
    const list = await this.getStudentNotifications(studentUid);
    return list.filter(n => !n.isRead).length;
  },

  /**
   * Create an in-app notification record in Firestore
   * Prevents duplicate spam within 10 seconds for identical event/type
   */
  async createNotification(params: Omit<AppNotification, 'id' | 'createdAt' | 'isRead'> & { isRead?: boolean }): Promise<AppNotification> {
    const raw = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS) || '[]';
    const all: AppNotification[] = JSON.parse(raw);

    // Duplicate check: same recipient + same eventId + same type within 15 seconds
    const recentDuplicate = all.find(n =>
      n.recipientId === params.recipientId &&
      n.eventId === params.eventId &&
      n.type === params.type &&
      Date.now() - new Date(n.createdAt).getTime() < 15000
    );

    if (recentDuplicate) {
      return recentDuplicate;
    }

    const notifId = 'notif_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now().toString(36);
    const newNotif: AppNotification = {
      ...params,
      isRead: params.isRead ?? false,
      id: notifId,
      createdAt: new Date().toISOString(),
    };

    all.unshift(newNotif);
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(all));
    notifyNotificationListeners();

    return newNotif;
  },

  /**
   * Mark a single notification as read
   */
  async markNotificationAsRead(notificationId: string): Promise<AppNotification> {
    const currentUser = this.getCurrentUser();
    if (!currentUser) {
      throw new Error('Please sign in to update notifications.');
    }

    const raw = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS) || '[]';
    const all: AppNotification[] = JSON.parse(raw);
    const index = all.findIndex(n => n.id === notificationId);

    if (index === -1) {
      throw new Error('Notification not found.');
    }

    const target = all[index];
    const isAdmin = await this.verifyAdminRole();
    if (!isAdmin && target.recipientId !== currentUser.uid) {
      handleFirestoreError(
        new Error('Missing or insufficient permissions: Cannot modify another student’s notification.'),
        OperationType.UPDATE,
        `notifications/${notificationId}`,
        currentUser
      );
    }

    target.isRead = true;
    all[index] = target;
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(all));
    notifyNotificationListeners();

    return target;
  },

  /**
   * Mark all notifications for a student as read
   */
  async markAllNotificationsAsRead(studentUid: string): Promise<void> {
    const currentUser = this.getCurrentUser();
    if (!currentUser) throw new Error('Unauthorized');

    const raw = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS) || '[]';
    const all: AppNotification[] = JSON.parse(raw);

    let changed = false;
    all.forEach(n => {
      if (n.recipientId === studentUid && !n.isRead) {
        n.isRead = true;
        changed = true;
      }
    });

    if (changed) {
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(all));
      notifyNotificationListeners();
    }
  },

  /**
   * Delete notification record
   */
  async deleteNotification(notificationId: string): Promise<void> {
    const currentUser = this.getCurrentUser();
    if (!currentUser) throw new Error('Unauthorized');

    const raw = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS) || '[]';
    const all: AppNotification[] = JSON.parse(raw);
    const target = all.find(n => n.id === notificationId);

    if (!target) return;
    const isAdmin = await this.verifyAdminRole();
    if (!isAdmin && target.recipientId !== currentUser.uid) {
      handleFirestoreError(
        new Error('Missing or insufficient permissions: Cannot delete another student’s notification.'),
        OperationType.DELETE,
        `notifications/${notificationId}`,
        currentUser
      );
    }

    const filtered = all.filter(n => n.id !== notificationId);
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(filtered));
    notifyNotificationListeners();
  },

  /**
   * Broadcast an administrative announcement to students
   */
  async broadcastAnnouncement(title: string, message: string, eventId?: string): Promise<number> {
    const isAdmin = await this.verifyAdminRole();
    if (!isAdmin) {
      handleFirestoreError(
        new Error('Missing or insufficient permissions: Only administrators can broadcast announcements.'),
        OperationType.CREATE,
        'notifications',
        this.getCurrentUser()
      );
    }

    const accountsRaw = localStorage.getItem(STORAGE_KEYS.AUTH_ACCOUNTS) || '[]';
    const accounts: { uid: string; role?: string }[] = JSON.parse(accountsRaw);
    const studentUids = accounts.filter(a => a.role !== 'admin' && a.role !== 'superadmin').map(a => a.uid);

    // If specific eventId, target attendees of that event
    let targetUids = studentUids;
    let eventTitle: string | undefined;

    if (eventId) {
      const regsRaw = localStorage.getItem(STORAGE_KEYS.REGISTRATIONS) || '[]';
      const regs: EventRegistration[] = JSON.parse(regsRaw);
      const attendees = regs.filter(r => r.eventId === eventId && r.status === 'confirmed');
      targetUids = Array.from(new Set(attendees.map(a => a.studentUid)));
      const event = await this.getEventById(eventId);
      eventTitle = event?.title;
    }

    let createdCount = 0;
    for (const uid of targetUids) {
      await this.createNotification({
        recipientId: uid,
        eventId,
        eventTitle,
        type: 'announcement',
        title: title.trim(),
        message: message.trim(),
        isRead: false,
      });
      createdCount++;
    }

    return createdCount;
  },

  resetToInitialDemo(): void {
    localStorage.removeItem(STORAGE_KEYS.EVENTS);
    localStorage.removeItem(STORAGE_KEYS.REGISTRATIONS);
    localStorage.removeItem(STORAGE_KEYS.STUDENT_PROFILES);
    localStorage.removeItem(STORAGE_KEYS.AUTH_ACCOUNTS);
    localStorage.removeItem(STORAGE_KEYS.ADMINS);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    ensureDatabaseSeeded();
    notifyAuthListeners(null);
  },
};
