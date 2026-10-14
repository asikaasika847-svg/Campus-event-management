export type EventCategory = 'Technical' | 'Cultural' | 'Sports' | 'Workshop' | 'Symposium';

export type UserRole = 'student' | 'admin' | 'superadmin';

export interface AdminRoleRecord {
  uid: string;
  email: string;
  role: 'admin' | 'superadmin';
  assignedAt: string;
}

export interface StudentProfile {
  uid: string;
  fullName: string;
  collegeEmail: string;
  studentId: string;
  department: string;
  phone?: string;
  bio?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CampusEvent {
  id: string;
  title: string;
  description: string;
  category: EventCategory;
  posterUrl: string;
  eventDate: string; // ISO date string e.g. 2026-10-25
  startTime: string; // e.g. 10:00 AM
  endTime: string;   // e.g. 04:30 PM
  venue: string;
  organizer: string;
  registrationDeadline: string; // ISO string e.g. 2026-10-24T23:59:00
  maxCapacity: number;
  registeredCount: number;
  isPublished: boolean;
  isCancelled: boolean;
  isFeatured?: boolean;
  tags?: string[];
  createdAt: string;
  updatedAt?: string;
}

export type RegistrationStatus = 'confirmed' | 'cancelled' | 'attended';

export interface EventRegistration {
  id: string;
  studentUid: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  department: string;
  eventId: string;
  eventTitle: string;
  eventDate: string;
  eventVenue: string;
  registeredAt: string;
  status: RegistrationStatus;
  cancelledAt?: string;
}

export type NotificationType =
  | 'registration_success'
  | 'registration_cancelled'
  | 'event_updated'
  | 'event_cancelled'
  | 'announcement';

export interface AppNotification {
  id: string;
  recipientId: string; // Student UID
  eventId?: string;
  eventTitle?: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL?: string | null;
  emailVerified: boolean;
  isAnonymous?: boolean;
  role?: UserRole;
}

export interface AdminDashboardStats {
  totalEvents: number;
  publishedEvents: number;
  upcomingEvents: number;
  totalRegistrations: number;
  confirmedRegistrations: number;
  totalCapacity: number;
}
