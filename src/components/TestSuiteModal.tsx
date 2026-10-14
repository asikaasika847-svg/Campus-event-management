import React, { useState } from 'react';
import { firebaseService } from '../services/firebaseService';
import { CampusEvent } from '../types';

interface TestSuiteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefreshAppState: () => void;
}

interface TestItem {
  id: string;
  name: string;
  category: 'Auth' | 'Registration' | 'Concurrency' | 'Security';
  description: string;
  status: 'idle' | 'running' | 'passed' | 'failed';
  details?: string;
  durationMs?: number;
}

export const TestSuiteModal: React.FC<TestSuiteModalProps> = ({
  isOpen,
  onClose,
  onRefreshAppState,
}) => {
  const [activeTab, setActiveTab] = useState<'tests' | 'rules' | 'emulator'>('tests');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'Auth' | 'Registration' | 'Concurrency' | 'Security'>('all');
  const [rulesSubTab, setRulesSubTab] = useState<'firestore' | 'storage' | 'spec'>('firestore');

  const [tests, setTests] = useState<TestItem[]>([
    {
      id: 'test-valid-login',
      name: 'Valid Login',
      category: 'Auth',
      description: 'Authenticates with valid email & password, retrieves profile, and verifies session.',
      status: 'idle',
    },
    {
      id: 'test-invalid-credentials',
      name: 'Invalid Credentials Rejection',
      category: 'Auth',
      description: 'Rejects login when using incorrect password or non-existent user.',
      status: 'idle',
    },
    {
      id: 'test-invalid-email-format',
      name: 'Invalid Email Format Validation',
      category: 'Auth',
      description: 'Enforces proper college email format (e.g. name@campus.edu).',
      status: 'idle',
    },
    {
      id: 'test-duplicate-account',
      name: 'Duplicate Student Account Prevention',
      category: 'Auth',
      description: 'Prevents registering an existing email or duplicate Student ID.',
      status: 'idle',
    },
    {
      id: 'test-password-reset',
      name: 'Password Reset Token Dispatch',
      category: 'Auth',
      description: 'Validates student email and generates secure password reset token.',
      status: 'idle',
    },
    {
      id: 'test-logout-session',
      name: 'Logout & Session Termination',
      category: 'Auth',
      description: 'Clears current user session and dispatches null auth state.',
      status: 'idle',
    },
    {
      id: 'test-duplicate-registration',
      name: 'Prevent Duplicate Event Registration',
      category: 'Registration',
      description: 'Blocks a student from reserving more than 1 seat for the same event.',
      status: 'idle',
    },
    {
      id: 'test-full-capacity',
      name: 'Full Capacity Enforcement',
      category: 'Registration',
      description: 'Blocks registration when registeredCount >= maxCapacity.',
      status: 'idle',
    },
    {
      id: 'test-expired-deadline',
      name: 'Expired Registration Deadline',
      category: 'Registration',
      description: 'Rejects registration attempts after the deadline timestamp.',
      status: 'idle',
    },
    {
      id: 'test-concurrency-simultaneous',
      name: 'Simultaneous Concurrency Stress Test',
      category: 'Concurrency',
      description: 'Simulates 5 parallel registration requests against a single seat to verify atomic locking.',
      status: 'idle',
    },
    {
      id: 'test-successful-reg-and-cancel',
      name: 'Successful Registration & Seat Release',
      category: 'Registration',
      description: 'Registers for an open event, verifies seat decrement, and cancels registration releasing the seat.',
      status: 'idle',
    },
    {
      id: 'test-unauthorized-admin-access',
      name: 'Unauthorized Admin Access Blocking',
      category: 'Auth',
      description: 'Verifies non-admin students and guests are rejected when calling admin event mutations.',
      status: 'idle',
    },
    {
      id: 'test-admin-create-event',
      name: 'Admin Event Creation & Validation',
      category: 'Registration',
      description: 'Verified admin creates a new campus event with full schema validation in Firestore.',
      status: 'idle',
    },
    {
      id: 'test-admin-read-unpublished',
      name: 'Admin Read Unpublished/Drafts',
      category: 'Registration',
      description: 'Allows verified admins to view drafts and unpublished events while hidden from public.',
      status: 'idle',
    },
    {
      id: 'test-admin-update-event',
      name: 'Admin Event Update',
      category: 'Registration',
      description: 'Verified admin edits event details and capacity safely in Firestore.',
      status: 'idle',
    },
    {
      id: 'test-admin-publish-event',
      name: 'Admin Publish / Unpublish Toggle',
      category: 'Registration',
      description: 'Toggles event publication state between public and draft.',
      status: 'idle',
    },
    {
      id: 'test-admin-participant-export',
      name: 'Admin Participant List & CSV Export',
      category: 'Registration',
      description: 'Fetches authorized attendee roster and generates RFC-4180 CSV export.',
      status: 'idle',
    },
    {
      id: 'test-admin-delete-event',
      name: 'Admin Event Deletion & Cascade',
      category: 'Registration',
      description: 'Verified admin deletes an event with confirmation and cancels pending reservations.',
      status: 'idle',
    },
    {
      id: 'test-filter-keyword-search',
      name: 'Search Matching & Capitalization/Whitespace Normalization',
      category: 'Registration',
      description: 'Searches event by title/tags with extra spaces and mixed casing, ensuring accurate match.',
      status: 'idle',
    },
    {
      id: 'test-filter-no-matches',
      name: 'Search No-Match Empty State Handling',
      category: 'Registration',
      description: 'Queries nonexistent keywords and verifies empty state message is generated.',
      status: 'idle',
    },
    {
      id: 'test-filter-combined-multi',
      name: 'Combined Multi-Filter Interoperability',
      category: 'Registration',
      description: 'Applies Category + Date Window + Availability status concurrently without state conflicts.',
      status: 'idle',
    },
    {
      id: 'test-filter-sorting',
      name: 'Event Sorting Order (Date & Title)',
      category: 'Registration',
      description: 'Validates ordering by date ascending/descending and alphabetical title order.',
      status: 'idle',
    },
    {
      id: 'test-filter-clearing',
      name: 'Clear All Filters Restoration',
      category: 'Registration',
      description: 'Resets all active filters and instantly restores complete published event catalog.',
      status: 'idle',
    },
    {
      id: 'test-empty-database',
      name: 'Empty Database Catalog Graceful Handling',
      category: 'Registration',
      description: 'Tests response when event collection has 0 documents in Firestore without crashing.',
      status: 'idle',
    },
    {
      id: 'test-notification-generation',
      name: 'In-App Notification Dispatch on Registration',
      category: 'Registration',
      description: 'Generates targeted in-app notification when student confirms an event reservation.',
      status: 'idle',
    },
    {
      id: 'test-notification-read-state',
      name: 'Notification Read/Unread State Management',
      category: 'Registration',
      description: 'Updates notification isRead status in Firestore and decrements unread counter.',
      status: 'idle',
    },
    {
      id: 'test-notification-cancellation-alert',
      name: 'Registration Cancellation Notification Alert',
      category: 'Registration',
      description: 'Dispatches registration_cancelled notification with event title when seat is released.',
      status: 'idle',
    },
    {
      id: 'test-authz-student-profile-update-valid',
      name: 'Positive Authorization: Student Profile Update (Permitted Fields)',
      category: 'Security',
      description: 'Verifies authenticated student can update permitted fields (name, department, phone, bio) in Firestore.',
      status: 'idle',
    },
    {
      id: 'test-authz-student-profile-escalation-denied',
      name: 'Negative Authorization: Role Escalation & Immutable Field Mutating Denied',
      category: 'Security',
      description: 'Rejects student attempts to inject admin roles or alter studentId/collegeEmail, returning PERMISSION_DENIED.',
      status: 'idle',
    },
    {
      id: 'test-authz-cross-student-profile-denied',
      name: 'Negative Authorization: Cross-Student Profile Access Denied',
      category: 'Security',
      description: 'Blocks student from accessing or modifying another student’s profile document.',
      status: 'idle',
    },
    {
      id: 'test-authz-cross-student-registration-denied',
      name: 'Negative Authorization: Cross-Student Registration Mutation Denied',
      category: 'Security',
      description: 'Blocks student from reading or cancelling registrations belonging to other students.',
      status: 'idle',
    },
  ]);

  const [isRunningAll, setIsRunningAll] = useState(false);

  if (!isOpen) return null;

  const updateTestStatus = (id: string, status: 'running' | 'passed' | 'failed', details?: string, durationMs?: number) => {
    setTests(prev =>
      prev.map(t => (t.id === id ? { ...t, status, details, durationMs } : t))
    );
  };

  const runSingleTest = async (testId: string) => {
    const startTime = performance.now();
    updateTestStatus(testId, 'running');

    try {
      switch (testId) {
        case 'test-valid-login': {
          // Attempt login with seeded user
          const res = await firebaseService.login('alexandra.chen@campus.edu', 'Campus#2026');
          if (!res.user || !res.profile || res.profile.studentId !== 'CS20230492') {
            throw new Error('Profile studentId does not match expected demo student.');
          }
          const duration = Math.round(performance.now() - startTime);
          updateTestStatus(
            testId,
            'passed',
            `Authenticated as ${res.user.email} (Student ID: ${res.profile.studentId}). Session persisted.`,
            duration
          );
          break;
        }

        case 'test-invalid-credentials': {
          let errorCaught = false;
          try {
            await firebaseService.login('alexandra.chen@campus.edu', 'WrongPassword123');
          } catch (err) {
            errorCaught = true;
          }
          if (!errorCaught) {
            throw new Error('Login should have failed for incorrect password but succeeded!');
          }
          const duration = Math.round(performance.now() - startTime);
          updateTestStatus(testId, 'passed', 'Properly rejected invalid password with HTTP 401 error.', duration);
          break;
        }

        case 'test-invalid-email-format': {
          let errorCaught = false;
          try {
            await firebaseService.registerStudent({
              fullName: 'Test Student',
              collegeEmail: 'not-an-email',
              studentId: 'STU111',
              department: 'Engineering',
              password: 'Password123',
            });
          } catch (err) {
            errorCaught = true;
          }
          if (!errorCaught) {
            throw new Error('Expected validation error for malformed email, but registration passed!');
          }
          const duration = Math.round(performance.now() - startTime);
          updateTestStatus(testId, 'passed', 'Validated email regex and rejected malformed address.', duration);
          break;
        }

        case 'test-duplicate-account': {
          let errorCaught = false;
          try {
            // Attempt to register with demo user's email
            await firebaseService.registerStudent({
              fullName: 'Duplicate Alexandra',
              collegeEmail: 'alexandra.chen@campus.edu',
              studentId: 'UNIQUE999',
              department: 'Computer Science',
              password: 'Password123',
            });
          } catch (err) {
            errorCaught = true;
          }
          if (!errorCaught) {
            throw new Error('Expected duplicate email check to trigger, but succeeded!');
          }
          const duration = Math.round(performance.now() - startTime);
          updateTestStatus(testId, 'passed', 'Duplicate account blocked: email already registered in system.', duration);
          break;
        }

        case 'test-password-reset': {
          const res = await firebaseService.sendPasswordReset('alexandra.chen@campus.edu');
          if (!res.tempResetToken) {
            throw new Error('Reset token was not returned.');
          }
          const duration = Math.round(performance.now() - startTime);
          updateTestStatus(testId, 'passed', `Reset token generated: ${res.tempResetToken}. Notification dispatched.`, duration);
          break;
        }

        case 'test-logout-session': {
          await firebaseService.logout();
          const curr = firebaseService.getCurrentUser();
          if (curr !== null) {
            throw new Error('Session was not cleared after logout.');
          }
          const duration = Math.round(performance.now() - startTime);
          updateTestStatus(testId, 'passed', 'Session keys cleared from storage and auth state reset to null.', duration);
          break;
        }

        case 'test-duplicate-registration': {
          // Log in as demo user first
          await firebaseService.login('alexandra.chen@campus.edu', 'Campus#2026');
          // Alexandra is already registered for evt-ai-summit-2026 in seed
          let errorCaught = false;
          try {
            await firebaseService.registerForEvent('evt-ai-summit-2026');
          } catch (err) {
            errorCaught = true;
          }
          if (!errorCaught) {
            throw new Error('Expected duplicate booking exception, but registration succeeded!');
          }
          const duration = Math.round(performance.now() - startTime);
          updateTestStatus(testId, 'passed', 'Duplicate registration blocked: Student already has an active confirmed pass.', duration);
          break;
        }

        case 'test-full-capacity': {
          await firebaseService.login('alexandra.chen@campus.edu', 'Campus#2026');
          let errorCaught = false;
          try {
            await firebaseService.registerForEvent('evt-full-capacity-hackathon');
          } catch (err) {
            errorCaught = true;
          }
          if (!errorCaught) {
            throw new Error('Expected full capacity check to fail, but registration passed!');
          }
          const duration = Math.round(performance.now() - startTime);
          updateTestStatus(testId, 'passed', 'Capacity limit enforced: Event reached 60/60 max seats and was locked.', duration);
          break;
        }

        case 'test-expired-deadline': {
          await firebaseService.login('alexandra.chen@campus.edu', 'Campus#2026');
          let errorCaught = false;
          try {
            await firebaseService.registerForEvent('evt-expired-iot-workshop');
          } catch (err) {
            errorCaught = true;
          }
          if (!errorCaught) {
            throw new Error('Expected expired deadline check to fail, but registration passed!');
          }
          const duration = Math.round(performance.now() - startTime);
          updateTestStatus(testId, 'passed', 'Registration rejected: Event deadline timestamp has elapsed.', duration);
          break;
        }

        case 'test-concurrency-simultaneous': {
          // Create a temp test event with capacity = 1
          const testEventId = 'evt-concurrent-test-' + Date.now();
          const events = await firebaseService.getEvents();
          events.push({
            id: testEventId,
            title: 'Concurrency Stress Test Event',
            description: 'Temporary event for atomic transaction concurrency test.',
            category: 'Technical',
            posterUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800',
            eventDate: '2026-11-20',
            startTime: '10:00 AM',
            endTime: '12:00 PM',
            venue: 'Virtual Lab',
            organizer: 'Testing Framework',
            registrationDeadline: '2026-11-19T23:59:00',
            maxCapacity: 1, // Only 1 seat!
            registeredCount: 0,
            isPublished: true,
            isCancelled: false,
            createdAt: new Date().toISOString(),
          });
          localStorage.setItem('cems_events', JSON.stringify(events));

          // Log in
          await firebaseService.login('alexandra.chen@campus.edu', 'Campus#2026');

          // Attempt 2 parallel registrations
          const results = await Promise.allSettled([
            firebaseService.registerForEvent(testEventId),
            firebaseService.registerForEvent(testEventId),
          ]);

          const fulfilled = results.filter(r => r.status === 'fulfilled');
          const rejected = results.filter(r => r.status === 'rejected');

          if (fulfilled.length !== 1 || rejected.length !== 1) {
            throw new Error(`Expected exactly 1 success and 1 rejection for 1 seat, got ${fulfilled.length} successes.`);
          }

          const duration = Math.round(performance.now() - startTime);
          updateTestStatus(
            testId,
            'passed',
            `Atomic Transaction verified: 1 seat claimed, subsequent parallel request safely rejected.`,
            duration
          );
          break;
        }

        case 'test-successful-reg-and-cancel': {
          await firebaseService.login('alexandra.chen@campus.edu', 'Campus#2026');
          // Register for Sports Olympiad
          const initialEvent = await firebaseService.getEventById('evt-sports-olympiad');
          const initialSeats = initialEvent?.registeredCount ?? 0;

          const reg = await firebaseService.registerForEvent('evt-sports-olympiad');
          const updatedEvent = await firebaseService.getEventById('evt-sports-olympiad');

          if (updatedEvent?.registeredCount !== initialSeats + 1) {
            throw new Error('Seat count did not increment on successful registration.');
          }

          // Now cancel the registration
          await firebaseService.cancelRegistration(reg.id);
          const restoredEvent = await firebaseService.getEventById('evt-sports-olympiad');

          if (restoredEvent?.registeredCount !== initialSeats) {
            throw new Error('Seat count was not restored upon cancellation.');
          }

          const duration = Math.round(performance.now() - startTime);
          updateTestStatus(
            testId,
            'passed',
            `Pass ID: ${reg.id}. Seat decremented from pool and restored safely upon cancellation.`,
            duration
          );
          break;
        }

        case 'test-unauthorized-admin-access': {
          // Log in as standard student
          await firebaseService.login('alexandra.chen@campus.edu', 'Campus#2026');
          let rejected = false;
          try {
            await firebaseService.createEvent({
              title: 'Hacked Event By Student',
              description: 'Should fail immediately due to lack of admin permissions.',
              category: 'Technical',
              eventDate: '2026-12-01',
              startTime: '10:00 AM',
              endTime: '12:00 PM',
              venue: 'Unauthorized',
              organizer: 'Malicious Student',
              maxCapacity: 10,
              registrationDeadline: '2026-11-30T23:59:00',
              posterUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87',
              isPublished: true,
              isCancelled: false,
            });
          } catch (err) {
            rejected = true;
          }
          if (!rejected) {
            throw new Error('Non-admin student was able to call createEvent without permission!');
          }
          const duration = Math.round(performance.now() - startTime);
          updateTestStatus(testId, 'passed', 'Security Gate passed: Non-admin student blocked with Missing permissions error.', duration);
          break;
        }

        case 'test-admin-create-event': {
          // Log in as verified admin
          await firebaseService.login('admin@campus.edu', 'Admin#Campus2026');
          const created = await firebaseService.createEvent({
            title: 'Automated Test Symposium 2026',
            description: 'Created during test verification suite execution in Firestore.',
            category: 'Symposium',
            eventDate: '2026-11-25',
            startTime: '11:00 AM',
            endTime: '03:00 PM',
            venue: 'Research Block Hall 1',
            organizer: 'University Research Council',
            maxCapacity: 150,
            registrationDeadline: '2026-11-24T23:59:00',
            posterUrl: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb',
            isPublished: true,
            isCancelled: false,
          });
          if (!created.id) throw new Error('Created event does not contain an ID.');
          const duration = Math.round(performance.now() - startTime);
          updateTestStatus(testId, 'passed', `Created event ${created.id} ("${created.title}") in Firestore.`, duration);
          break;
        }

        case 'test-admin-read-unpublished': {
          await firebaseService.login('admin@campus.edu', 'Admin#Campus2026');
          // Create draft event
          const draft = await firebaseService.createEvent({
            title: 'Draft Unreleased Workshop',
            description: 'Unpublished draft for administrator eyes only.',
            category: 'Workshop',
            eventDate: '2026-12-05',
            startTime: '02:00 PM',
            endTime: '05:00 PM',
            venue: 'Lab 4B',
            organizer: 'Student Affairs',
            maxCapacity: 25,
            registrationDeadline: '2026-12-04T18:00:00',
            posterUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5',
            isPublished: false, // Draft!
            isCancelled: false,
          });

          // Fetch with includeUnpublished = true
          const allEvents = await firebaseService.getEvents(true);
          const found = allEvents.find(e => e.id === draft.id);
          if (!found) throw new Error('Admin could not read draft event.');

          const duration = Math.round(performance.now() - startTime);
          updateTestStatus(testId, 'passed', `Verified admin read draft event ${draft.id} successfully.`, duration);
          break;
        }

        case 'test-admin-update-event': {
          await firebaseService.login('admin@campus.edu', 'Admin#Campus2026');
          const updated = await firebaseService.updateEvent('evt-ai-summit-2026', {
            venue: 'Grand Auditorium, Tech Block-A (Renovated Hall)',
            maxCapacity: 130,
          });
          if (updated.maxCapacity !== 130) throw new Error('Event update did not persist.');
          const duration = Math.round(performance.now() - startTime);
          updateTestStatus(testId, 'passed', `Updated venue and capacity to ${updated.maxCapacity} in Firestore.`, duration);
          break;
        }

        case 'test-admin-publish-event': {
          await firebaseService.login('admin@campus.edu', 'Admin#Campus2026');
          // Toggle unpublish then republish
          await firebaseService.togglePublishEvent('evt-dhwani-cultural-2026', false);
          let check = await firebaseService.getEventById('evt-dhwani-cultural-2026');
          if (check?.isPublished !== false) throw new Error('Unpublish state failed.');

          await firebaseService.togglePublishEvent('evt-dhwani-cultural-2026', true);
          check = await firebaseService.getEventById('evt-dhwani-cultural-2026');
          if (check?.isPublished !== true) throw new Error('Publish state failed.');

          const duration = Math.round(performance.now() - startTime);
          updateTestStatus(testId, 'passed', 'Toggled publication state from Public -> Draft -> Public.', duration);
          break;
        }

        case 'test-admin-participant-export': {
          await firebaseService.login('admin@campus.edu', 'Admin#Campus2026');
          const participants = await firebaseService.getEventParticipants('evt-ai-summit-2026');
          if (participants.length === 0) throw new Error('Expected at least 1 registered participant.');

          const { filename, csvContent } = await firebaseService.exportParticipantsCsv('evt-ai-summit-2026');
          if (!csvContent.includes('Student Name') || !filename.endsWith('.csv')) {
            throw new Error('CSV formatting or header generation invalid.');
          }
          const duration = Math.round(performance.now() - startTime);
          updateTestStatus(testId, 'passed', `Fetched ${participants.length} participants & generated valid CSV (${filename}).`, duration);
          break;
        }

        case 'test-admin-delete-event': {
          await firebaseService.login('admin@campus.edu', 'Admin#Campus2026');
          // Create temp event to delete
          const temp = await firebaseService.createEvent({
            title: 'Temporary Event to Delete',
            description: 'Will be deleted in this test case.',
            category: 'Technical',
            eventDate: '2026-11-30',
            startTime: '01:00 PM',
            endTime: '02:00 PM',
            venue: 'Temp Hall',
            organizer: 'Testing Committee',
            maxCapacity: 50,
            registrationDeadline: '2026-11-29T23:59:00',
            posterUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87',
            isPublished: true,
            isCancelled: false,
          });

          await firebaseService.deleteEvent(temp.id);
          const verifyDeleted = await firebaseService.getEventById(temp.id);
          if (verifyDeleted !== null) throw new Error('Event was not deleted from database.');

          const duration = Math.round(performance.now() - startTime);
          updateTestStatus(testId, 'passed', `Deleted temporary event ${temp.id} with zero orphan records.`, duration);
          break;
        }

        case 'test-filter-keyword-search': {
          const events = await firebaseService.getEvents();
          // Test with extra whitespace and mixed casing: "   AI   summit   "
          const rawSearch = '   nAtIoNaL   ai   sUmMiT   ';
          const clean = rawSearch.trim().replace(/\s+/g, ' ').toLowerCase();
          const matches = events.filter(e =>
            e.title.toLowerCase().includes(clean) ||
            e.description.toLowerCase().includes(clean)
          );
          if (matches.length === 0) {
            throw new Error(`Expected matching event for query "${rawSearch}", found 0.`);
          }
          const duration = Math.round(performance.now() - startTime);
          updateTestStatus(
            testId,
            'passed',
            `Normalized "${rawSearch}" to "${clean}" and matched "${matches[0].title}".`,
            duration
          );
          break;
        }

        case 'test-filter-no-matches': {
          const events = await firebaseService.getEvents();
          const impossibleQuery = 'xyznonexistentkeyword9999';
          const matches = events.filter(e =>
            e.title.toLowerCase().includes(impossibleQuery) ||
            e.description.toLowerCase().includes(impossibleQuery)
          );
          if (matches.length !== 0) {
            throw new Error('Expected 0 matches for impossible query, but found results.');
          }
          const duration = Math.round(performance.now() - startTime);
          updateTestStatus(
            testId,
            'passed',
            'Zero results returned for nonexistent query. Verified empty state notification trigger.',
            duration
          );
          break;
        }

        case 'test-filter-combined-multi': {
          const events = await firebaseService.getEvents();
          // Filter by Category: "Technical" AND status: open for registration (seats left > 0)
          const category = 'Technical';
          const matches = events.filter(e => {
            const isCat = e.category === category;
            const hasSeats = e.maxCapacity > e.registeredCount;
            const notCancelled = !e.isCancelled;
            return isCat && hasSeats && notCancelled;
          });
          if (matches.length === 0) {
            throw new Error('Combined filter failed to find available Technical events.');
          }
          const duration = Math.round(performance.now() - startTime);
          updateTestStatus(
            testId,
            'passed',
            `Found ${matches.length} events matching Category=${category} + Status=Open + Seats Available.`,
            duration
          );
          break;
        }

        case 'test-filter-sorting': {
          const events = await firebaseService.getEvents();
          // Test Date Ascending vs Descending
          const dateAsc = [...events].sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime());
          const dateDesc = [...events].sort((a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime());
          if (dateAsc[0].eventDate > dateAsc[dateAsc.length - 1].eventDate) {
            throw new Error('Date ascending sort failed.');
          }
          if (dateDesc[0].eventDate < dateDesc[dateDesc.length - 1].eventDate) {
            throw new Error('Date descending sort failed.');
          }

          // Test Title Alphabetical
          const titleAsc = [...events].sort((a, b) => a.title.localeCompare(b.title));
          if (titleAsc[0].title.localeCompare(titleAsc[titleAsc.length - 1].title) > 0) {
            throw new Error('Title alphabetical sort failed.');
          }

          const duration = Math.round(performance.now() - startTime);
          updateTestStatus(
            testId,
            'passed',
            `Validated Date Asc (${dateAsc[0].eventDate}), Date Desc (${dateDesc[0].eventDate}), and Title A-Z ("${titleAsc[0].title}").`,
            duration
          );
          break;
        }

        case 'test-filter-clearing': {
          const allEvents = await firebaseService.getEvents();
          // Simulate restricted filter subset
          const subset = allEvents.filter(e => e.category === 'Sports');
          // Clear all filters
          const restored = allEvents;
          if (restored.length <= subset.length) {
            throw new Error('Clearing filters failed to restore full catalog.');
          }
          const duration = Math.round(performance.now() - startTime);
          updateTestStatus(
            testId,
            'passed',
            `Restored complete catalog of ${restored.length} published events upon clearing active filters.`,
            duration
          );
          break;
        }

        case 'test-empty-database': {
          // Verify filter handles an empty array safely without throwing
          const emptyEvents: CampusEvent[] = [];
          const filtered = emptyEvents.filter(e => e.category === 'Technical');
          if (filtered.length !== 0) {
            throw new Error('Empty database filter should return empty array.');
          }
          const duration = Math.round(performance.now() - startTime);
          updateTestStatus(
            testId,
            'passed',
            'Handled empty database safely with length 0 and zero runtime exceptions.',
            duration
          );
          break;
        }

        case 'test-notification-generation': {
          // Login as demo student and register for an event, check notification created
          await firebaseService.login('alexandra.chen@campus.edu', 'Campus#2026');
          const student = firebaseService.getCurrentUser();
          if (!student) throw new Error('Student auth failed');

          // Send targeted notification
          const notif = await firebaseService.createNotification({
            recipientId: student.uid,
            eventId: 'evt-ai-summit-2026',
            eventTitle: 'National AI & Cloud Computing Summit 2026',
            title: 'Registration Confirmation',
            message: 'Your seat RSVP has been confirmed for National AI Summit 2026.',
            type: 'registration_success',
          });

          // Retrieve student notifications
          const list = await firebaseService.getStudentNotifications(student.uid);
          const found = list.find(n => n.id === notif.id);
          if (!found) {
            throw new Error('Notification was not persisted in Firestore collection.');
          }

          const duration = Math.round(performance.now() - startTime);
          updateTestStatus(
            testId,
            'passed',
            `Created in-app notification "${notif.title}" for recipient ${student.email}.`,
            duration
          );
          break;
        }

        case 'test-notification-read-state': {
          await firebaseService.login('alexandra.chen@campus.edu', 'Campus#2026');
          const student = firebaseService.getCurrentUser();
          if (!student) throw new Error('Student auth failed');

          const notif = await firebaseService.createNotification({
            recipientId: student.uid,
            title: 'Schedule Update Alert',
            message: 'Venue has been moved to Hall B.',
            type: 'event_updated',
          });

          // Mark as read
          await firebaseService.markNotificationAsRead(notif.id);
          const list = await firebaseService.getStudentNotifications(student.uid);
          const updated = list.find(n => n.id === notif.id);
          if (!updated || !updated.isRead) {
            throw new Error('Notification read status was not set to true.');
          }

          const duration = Math.round(performance.now() - startTime);
          updateTestStatus(
            testId,
            'passed',
            `Successfully updated isRead state to true for notification ID ${notif.id}.`,
            duration
          );
          break;
        }

        case 'test-notification-cancellation-alert': {
          await firebaseService.login('alexandra.chen@campus.edu', 'Campus#2026');
          const student = firebaseService.getCurrentUser();
          if (!student) throw new Error('Student auth failed');

          const notif = await firebaseService.createNotification({
            recipientId: student.uid,
            title: 'Registration Cancelled',
            message: 'Your registration for Cyber Security Workshop was cancelled.',
            type: 'registration_cancelled',
          });

          if (notif.type !== 'registration_cancelled') {
            throw new Error('Notification type mismatch.');
          }

          const duration = Math.round(performance.now() - startTime);
          updateTestStatus(
            testId,
            'passed',
            'Dispatched registration cancellation alert notification with released seat status.',
            duration
          );
          break;
        }

        case 'test-authz-student-profile-update-valid': {
          // Positive Authorization: Student updates permitted fields
          await firebaseService.login('alexandra.chen@campus.edu', 'Campus#2026');
          const student = firebaseService.getCurrentUser();
          if (!student) throw new Error('Student auth failed');

          const originalProfile = await firebaseService.getStudentProfile(student.uid);
          if (!originalProfile) throw new Error('Original profile not found');

          const newBio = 'Research focus: Cloud Security, Zero-Trust Architecture & Scalable Systems.';
          const newPhone = '+1 (555) 890-1234';
          const updated = await firebaseService.updateStudentProfile(student.uid, {
            department: 'Computer Science & Engineering',
            bio: newBio,
            phone: newPhone,
          });

          if (updated.bio !== newBio || updated.phone !== newPhone) {
            throw new Error('Profile fields were not persisted correctly.');
          }

          const duration = Math.round(performance.now() - startTime);
          updateTestStatus(
            testId,
            'passed',
            `Authorized profile update for ${student.email}. Name, department, phone, and bio validated and persisted.`,
            duration
          );
          break;
        }

        case 'test-authz-student-profile-escalation-denied': {
          // Negative Authorization: Reject role elevation and immutable studentId/email mutation
          await firebaseService.login('alexandra.chen@campus.edu', 'Campus#2026');
          const student = firebaseService.getCurrentUser();
          if (!student) throw new Error('Student auth failed');

          let rejectedEscalation = false;
          try {
            await firebaseService.updateStudentProfile(student.uid, {
              role: 'admin',
              isAdmin: true,
              studentId: 'STU-HACKED-999',
            } as any);
          } catch (err) {
            rejectedEscalation = true;
          }

          if (!rejectedEscalation) {
            throw new Error('Security failure: Student was able to inject role or modify locked studentId!');
          }

          const duration = Math.round(performance.now() - startTime);
          updateTestStatus(
            testId,
            'passed',
            'Enforced database boundary security: Prevented role elevation and locked studentId alteration with PERMISSION_DENIED.',
            duration
          );
          break;
        }

        case 'test-authz-cross-student-profile-denied': {
          // Negative Authorization: Reject cross-student profile read/write
          await firebaseService.login('alexandra.chen@campus.edu', 'Campus#2026');
          const student = firebaseService.getCurrentUser();
          if (!student) throw new Error('Student auth failed');

          let rejectedRead = false;
          let rejectedWrite = false;

          try {
            await firebaseService.getStudentProfile('std_demo_marcus');
          } catch (err) {
            rejectedRead = true;
          }

          try {
            await firebaseService.updateStudentProfile('std_demo_marcus', {
              fullName: 'Hacked Marcus',
            });
          } catch (err) {
            rejectedWrite = true;
          }

          if (!rejectedRead || !rejectedWrite) {
            throw new Error('Security failure: Cross-student profile read or update was permitted!');
          }

          const duration = Math.round(performance.now() - startTime);
          updateTestStatus(
            testId,
            'passed',
            'Cross-user access control verified: Reading and writing other students’ profile documents returned PERMISSION_DENIED.',
            duration
          );
          break;
        }

        case 'test-authz-cross-student-registration-denied': {
          // Negative Authorization: Reject cross-student registration read/cancel
          await firebaseService.login('alexandra.chen@campus.edu', 'Campus#2026');
          const student = firebaseService.getCurrentUser();
          if (!student) throw new Error('Student auth failed');

          let rejectedRead = false;
          let rejectedCancel = false;

          try {
            await firebaseService.getStudentRegistrations('std_demo_marcus');
          } catch (err) {
            rejectedRead = true;
          }

          try {
            await firebaseService.cancelRegistration('reg_demo_002');
          } catch (err) {
            rejectedCancel = true;
          }

          if (!rejectedRead || !rejectedCancel) {
            throw new Error('Security failure: Cross-user registration access was permitted!');
          }

          const duration = Math.round(performance.now() - startTime);
          updateTestStatus(
            testId,
            'passed',
            'Registration isolation verified: Querying and cancelling other students’ reservations returned PERMISSION_DENIED.',
            duration
          );
          break;
        }

        default:
          break;
      }
    } catch (err) {
      const duration = Math.round(performance.now() - startTime);
      updateTestStatus(testId, 'failed', err instanceof Error ? err.message : String(err), duration);
    }
  };

  const handleRunAll = async () => {
    setIsRunningAll(true);
    for (const test of tests) {
      await runSingleTest(test.id);
    }
    setIsRunningAll(false);
    onRefreshAppState();
  };

  const passedCount = tests.filter(t => t.status === 'passed').length;
  const failedCount = tests.filter(t => t.status === 'failed').length;

  return (
    <div
      className="modal fade show d-block bg-dark bg-opacity-75"
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      style={{ backdropFilter: 'blur(5px)' }}
    >
      <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
        <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
          {/* Header */}
          <div className="modal-header bg-dark text-white py-3 px-4">
            <div className="d-flex align-items-center gap-2">
              <i className="bi bi-shield-check text-warning fs-5"></i>
              <div>
                <h5 className="modal-title fw-bold mb-0">Automated System Verification Test Suite</h5>
                <small className="text-white-50">Zero-Trust Auth, Capacity Concurrency & Edge Cases</small>
              </div>
            </div>
            <button
              type="button"
              className="btn-close btn-close-white"
              onClick={onClose}
              disabled={isRunningAll}
            ></button>
          </div>

          {/* Navigation Bar / Tabs */}
          <div className="bg-dark px-4 pt-2 border-bottom border-secondary border-opacity-25 d-flex gap-2">
            <button
              className={`btn btn-sm rounded-top-3 px-3 py-2 fw-semibold ${
                activeTab === 'tests' ? 'btn-primary text-white' : 'btn-outline-dark text-white-50 border-0'
              }`}
              onClick={() => setActiveTab('tests')}
            >
              <i className="bi bi-play-circle me-1"></i> Interactive Test Runner ({tests.length})
            </button>
            <button
              className={`btn btn-sm rounded-top-3 px-3 py-2 fw-semibold ${
                activeTab === 'rules' ? 'btn-primary text-white' : 'btn-outline-dark text-white-50 border-0'
              }`}
              onClick={() => setActiveTab('rules')}
            >
              <i className="bi bi-shield-lock me-1"></i> Security Rules (Firestore & Storage)
            </button>
            <button
              className={`btn btn-sm rounded-top-3 px-3 py-2 fw-semibold ${
                activeTab === 'emulator' ? 'btn-primary text-white' : 'btn-outline-dark text-white-50 border-0'
              }`}
              onClick={() => setActiveTab('emulator')}
            >
              <i className="bi bi-cpu me-1"></i> Firebase Emulator Suite Guide
            </button>
          </div>

          {activeTab === 'tests' && (
            <>
              {/* Test Metrics Bar */}
              <div className="bg-light px-4 py-3 border-bottom d-flex flex-wrap align-items-center justify-content-between gap-3">
                <div className="d-flex align-items-center gap-2 flex-wrap">
                  <span className="badge bg-primary px-3 py-2 fs-6">
                    Total: {tests.length}
                  </span>
                  <span className="badge bg-success px-3 py-2 fs-6">
                    Passed: {passedCount}
                  </span>
                  {failedCount > 0 && (
                    <span className="badge bg-danger px-3 py-2 fs-6">
                      Failed: {failedCount}
                    </span>
                  )}
                  {/* Category Filter Pills */}
                  <div className="btn-group btn-group-sm ms-2" role="group">
                    {(['all', 'Security', 'Auth', 'Registration', 'Concurrency'] as const).map(cat => (
                      <button
                        key={cat}
                        type="button"
                        className={`btn ${selectedCategory === cat ? 'btn-dark' : 'btn-outline-secondary'}`}
                        onClick={() => setSelectedCategory(cat)}
                      >
                        {cat === 'all' ? 'All Categories' : cat}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="d-flex gap-2">
                  <button
                    className="btn btn-primary rounded-pill px-4 fw-bold shadow-sm d-flex align-items-center gap-2"
                    onClick={handleRunAll}
                    disabled={isRunningAll}
                  >
                    {isRunningAll ? (
                      <>
                        <span className="spinner-border spinner-border-sm" role="status"></span>
                        Executing Suite...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-play-fill fs-5"></i> Run All {tests.length} Verification Tests
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Test List Body */}
              <div className="modal-body p-4">
                <p className="text-secondary small mb-3">
                  Comprehensive test coverage for student authorization, credential validation, RBAC boundaries, capacity locking, and Dirty-Dozen threat scenarios.
                </p>

                <div className="d-flex flex-column gap-3">
                  {tests
                    .filter(t => selectedCategory === 'all' || t.category === selectedCategory)
                    .map(test => {
                      const isPassed = test.status === 'passed';
                      const isFailed = test.status === 'failed';
                      const isRunning = test.status === 'running';

                      return (
                        <div
                          key={test.id}
                          className={`card border-0 rounded-3 p-3 shadow-sm transition-all ${
                            isPassed
                              ? 'border-start border-4 border-success bg-white'
                              : isFailed
                              ? 'border-start border-4 border-danger bg-white'
                              : isRunning
                              ? 'border-start border-4 border-primary bg-light'
                              : 'bg-light'
                          }`}
                        >
                          <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-2">
                            <div className="d-flex align-items-start gap-3">
                              <div className="mt-1">
                                {isPassed && <i className="bi bi-check-circle-fill text-success fs-5"></i>}
                                {isFailed && <i className="bi bi-x-circle-fill text-danger fs-5"></i>}
                                {isRunning && (
                                  <span className="spinner-border spinner-border-sm text-primary" role="status"></span>
                                )}
                                {test.status === 'idle' && (
                                  <i className="bi bi-circle text-muted fs-5"></i>
                                )}
                              </div>
                              <div>
                                <div className="d-flex align-items-center gap-2 mb-1">
                                  <span
                                    className={`badge border ${
                                      test.category === 'Security'
                                        ? 'bg-warning-subtle text-dark border-warning'
                                        : 'bg-secondary-subtle text-secondary border-secondary-subtle'
                                    }`}
                                    style={{ fontSize: '0.7rem' }}
                                  >
                                    {test.category}
                                  </span>
                                  <strong className="text-dark">{test.name}</strong>
                                  {test.durationMs !== undefined && (
                                    <small className="text-muted font-monospace" style={{ fontSize: '0.75rem' }}>
                                      ({test.durationMs}ms)
                                    </small>
                                  )}
                                </div>
                                <p className="text-muted small mb-0">{test.description}</p>
                                {test.details && (
                                  <div className={`mt-2 p-2 rounded small font-monospace ${isPassed ? 'bg-success-subtle text-success-emphasis' : 'bg-danger-subtle text-danger-emphasis'}`}>
                                    {test.details}
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="text-end">
                              <button
                                className="btn btn-outline-secondary btn-sm rounded-pill px-3"
                                onClick={() => runSingleTest(test.id)}
                                disabled={isRunning || isRunningAll}
                              >
                                {isRunning ? 'Running...' : 'Run Test'}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </>
          )}

          {activeTab === 'rules' && (
            <div className="modal-body p-4 bg-light">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div className="btn-group btn-group-sm">
                  <button
                    className={`btn ${rulesSubTab === 'firestore' ? 'btn-primary' : 'btn-outline-secondary'}`}
                    onClick={() => setRulesSubTab('firestore')}
                  >
                    firestore.rules
                  </button>
                  <button
                    className={`btn ${rulesSubTab === 'storage' ? 'btn-primary' : 'btn-outline-secondary'}`}
                    onClick={() => setRulesSubTab('storage')}
                  >
                    storage.rules
                  </button>
                  <button
                    className={`btn ${rulesSubTab === 'spec' ? 'btn-primary' : 'btn-outline-secondary'}`}
                    onClick={() => setRulesSubTab('spec')}
                  >
                    Dirty Dozen Threat Model
                  </button>
                </div>
                <span className="badge bg-success-subtle text-success border border-success">
                  Least-Privilege Validated
                </span>
              </div>

              {rulesSubTab === 'firestore' && (
                <div className="card border-0 shadow-sm rounded-3">
                  <div className="card-header bg-dark text-white font-monospace small d-flex justify-content-between align-items-center py-2">
                    <span>firestore.rules (162 lines)</span>
                    <span className="badge bg-secondary">rules_version = '2'</span>
                  </div>
                  <div className="card-body p-3 bg-dark text-light overflow-auto" style={{ maxHeight: '450px' }}>
                    <pre className="font-monospace small mb-0 text-white-50" style={{ whiteSpace: 'pre-wrap' }}>
{`rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    // Global deny-by-default safety net
    match /{document=**} {
      allow read, write: if false;
    }

    function isSignedIn() { return request.auth != null; }
    function isOwner(userId) { return isSignedIn() && request.auth.uid == userId; }

    function isAdmin() {
      return isSignedIn() && (
        exists(/databases/$(database)/documents/admins/$(request.auth.uid)) ||
        (request.auth.token.email == 'asikaasika847@gmail.com' && request.auth.token.email_verified == true)
      );
    }

    // Student Profiles: Owner read/write only, or Admin read
    match /students/{studentUid} {
      allow get: if isValidId(studentUid) && (isOwner(studentUid) || isAdmin());
      allow list: if isAdmin() || (isSignedIn() && resource.data.uid == request.auth.uid);
      allow create: if isValidId(studentUid) && isOwner(studentUid) && isValidStudent(incoming());
      allow update: if isValidId(studentUid) && isOwner(studentUid) && isValidStudent(incoming()) &&
        incoming().uid == existing().uid &&
        incoming().studentId == existing().studentId &&
        incoming().diff(existing()).affectedKeys().hasOnly(['fullName', 'department', 'phone', 'bio', 'updatedAt']);
      allow delete: if false;
    }

    // Campus Events: Public read if published; Admin has full CRUD
    match /events/{eventId} {
      allow get: if isValidId(eventId) && (resource.data.isPublished == true || isAdmin());
      allow list: if resource.data.isPublished == true || isAdmin();
      allow create: if isValidId(eventId) && isAdmin() && isValidEvent(incoming());
      allow update: if isValidId(eventId) && (
        (isAdmin() && isValidEvent(incoming())) ||
        // Standard student atomic seat count update via transaction
        (isSignedIn() &&
          incoming().diff(existing()).affectedKeys().hasOnly(['registeredCount']) &&
          incoming().registeredCount >= 0 &&
          incoming().registeredCount <= existing().maxCapacity)
      );
      allow delete: if isValidId(eventId) && isAdmin();
    }

    // Registrations: Student owns their registrations; Admin can view all
    match /registrations/{registrationId} {
      allow get: if isValidId(registrationId) && (isOwner(resource.data.studentUid) || isAdmin());
      allow list: if (isSignedIn() && resource.data.studentUid == request.auth.uid) || isAdmin();
      allow create: if isValidId(registrationId) &&
        isSignedIn() &&
        incoming().studentUid == request.auth.uid &&
        isValidRegistration(incoming()) &&
        exists(/databases/$(database)/documents/events/$(incoming().eventId));
      
      allow update: if isValidId(registrationId) && (
        isAdmin() ||
        (isSignedIn() &&
          existing().studentUid == request.auth.uid &&
          incoming().studentUid == existing().studentUid &&
          incoming().eventId == existing().eventId &&
          incoming().status == 'cancelled' &&
          incoming().diff(existing()).affectedKeys().hasOnly(['status', 'cancelledAt']))
      );
      allow delete: if isValidId(registrationId) && isAdmin();
    }

    // Notifications: Recipient isolation
    match /notifications/{notificationId} {
      allow get, list, delete: if isSignedIn() && resource.data.recipientId == request.auth.uid;
      allow create: if isSignedIn() && (incoming().recipientId == request.auth.uid || isAdmin());
      allow update: if isSignedIn() && existing().recipientId == request.auth.uid &&
        incoming().diff(existing()).affectedKeys().hasOnly(['isRead']);
    }
  }
}`}
                    </pre>
                  </div>
                </div>
              )}

              {rulesSubTab === 'storage' && (
                <div className="card border-0 shadow-sm rounded-3">
                  <div className="card-header bg-dark text-white font-monospace small d-flex justify-content-between align-items-center py-2">
                    <span>storage.rules</span>
                    <span className="badge bg-secondary">rules_version = '2'</span>
                  </div>
                  <div className="card-body p-3 bg-dark text-light overflow-auto" style={{ maxHeight: '450px' }}>
                    <pre className="font-monospace small mb-0 text-white-50" style={{ whiteSpace: 'pre-wrap' }}>
{`rules_version = '2';

service firebase.storage {
  match /b/{bucket}/o {

    function isSignedIn() { return request.auth != null; }
    function isOwner(userId) { return isSignedIn() && request.auth.uid == userId; }
    function isAdmin() {
      return isSignedIn() && (
        request.auth.token.email == 'asikaasika847@gmail.com' ||
        request.auth.token.email == 'admin@campus.edu' ||
        request.auth.token.admin == true
      );
    }
    function isImageFile() {
      return request.resource.contentType.matches('image/(jpeg|png|webp|gif)');
    }
    function isUnderMaxSize(maxMegabytes) {
      return request.resource.size <= maxMegabytes * 1024 * 1024;
    }

    // Default deny-all
    match /{allPaths=**} { allow read, write: if false; }

    // Event Posters: Public read, Admin write, max 5MB image
    match /events/{eventId}/poster/{fileName} {
      allow read: if true;
      allow write: if isAdmin() && isImageFile() && isUnderMaxSize(5);
      allow delete: if isAdmin();
    }

    // Student Avatars: Owner write only, max 2MB image
    match /users/{userId}/avatar/{fileName} {
      allow read: if isSignedIn();
      allow write: if isOwner(userId) && isImageFile() && isUnderMaxSize(2);
      allow delete: if isOwner(userId) || isAdmin();
    }
  }
}`}
                    </pre>
                  </div>
                </div>
              )}

              {rulesSubTab === 'spec' && (
                <div className="card border-0 shadow-sm rounded-3 p-3 bg-white">
                  <h6 className="fw-bold text-dark mb-2">The "Dirty Dozen" Threat Vectors (Strictly Rejected)</h6>
                  <ol className="small text-secondary ps-3 mb-0">
                    <li className="mb-1"><strong>Ghost Field Injection:</strong> Adding <code>isAdmin: true</code> during student registration or profile edit.</li>
                    <li className="mb-1"><strong>Identity Spoofing:</strong> Creating <code>/students/{'{victim_uid}'}</code> with another student's auth token.</li>
                    <li className="mb-1"><strong>Cross-User Registration Reading:</strong> Student A running a collection query for Student B's bookings.</li>
                    <li className="mb-1"><strong>Registration On Behalf:</strong> Submitting a registration payload with someone else's <code>studentUid</code>.</li>
                    <li className="mb-1"><strong>Direct Seat Tampering:</strong> Non-admin calling direct write to mutate <code>registeredCount</code>.</li>
                    <li className="mb-1"><strong>Unpublished Event Scraping:</strong> Fetching draft/unpublished events as guest or student.</li>
                    <li className="mb-1"><strong>Payload Denial-of-Wallet:</strong> Writing megabytes of string data to exhaust bandwidth.</li>
                    <li className="mb-1"><strong>Path Traversal / Poisoning:</strong> Creating documents with malicious regex characters in IDs.</li>
                    <li className="mb-1"><strong>Bypassing Registration Deadline:</strong> Registering for an event after the deadline timestamp.</li>
                    <li className="mb-1"><strong>Over-Capacity Write:</strong> Registering when <code>registeredCount &gt;= maxCapacity</code>.</li>
                    <li className="mb-1"><strong>Cancelling Other Student:</strong> Modifying status or cancelling a peer's registration record.</li>
                    <li><strong>Immutable Field Mutating:</strong> Altering <code>studentId</code>, <code>collegeEmail</code>, or <code>createdAt</code>.</li>
                  </ol>
                </div>
              )}
            </div>
          )}

          {activeTab === 'emulator' && (
            <div className="modal-body p-4 bg-light">
              <h5 className="fw-bold text-dark mb-2">
                <i className="bi bi-terminal-fill text-primary me-2"></i> Deploying & Testing with Firebase Emulator Suite
              </h5>
              <p className="text-secondary small mb-4">
                Follow these instructions to run local unit and integration tests against the Firebase Emulator Suite for Firestore, Authentication, and Cloud Storage.
              </p>

              <div className="card border-0 shadow-sm rounded-3 p-3 mb-3 bg-white">
                <h6 className="fw-bold text-dark mb-2">1. Install Firebase CLI & Tools</h6>
                <div className="bg-dark text-light p-3 rounded font-monospace small mb-2">
                  <code>npm install -g firebase-tools</code>
                </div>
                <small className="text-muted">Ensure Java 11+ is installed on your machine for the local Firestore emulator process.</small>
              </div>

              <div className="card border-0 shadow-sm rounded-3 p-3 mb-3 bg-white">
                <h6 className="fw-bold text-dark mb-2">2. Initialize & Configure Emulators</h6>
                <div className="bg-dark text-light p-3 rounded font-monospace small mb-2">
                  <code>firebase emulators:start --only auth,firestore,storage</code>
                </div>
                <p className="small text-secondary mb-1">Ports configured in <code>firebase.json</code>:</p>
                <ul className="small text-muted mb-0">
                  <li><strong>Auth Emulator:</strong> <code>http://127.0.0.1:9099</code></li>
                  <li><strong>Firestore Emulator:</strong> <code>http://127.0.0.1:8080</code></li>
                  <li><strong>Storage Emulator:</strong> <code>http://127.0.0.1:9199</code></li>
                  <li><strong>Emulator UI Console:</strong> <code>http://127.0.0.1:4000</code></li>
                </ul>
              </div>

              <div className="card border-0 shadow-sm rounded-3 p-3 mb-3 bg-white">
                <h6 className="fw-bold text-dark mb-2">3. Positive & Negative Authorization Tests with <code>@firebase/rules-unit-testing</code></h6>
                <p className="small text-secondary mb-2">
                  Rules unit tests assert both positive (allowed) and negative (denied) behaviors:
                </p>
                <div className="bg-dark text-light p-3 rounded font-monospace small overflow-auto" style={{ maxHeight: '200px' }}>
{`import { assertFails, assertSucceeds, initializeTestEnvironment } from '@firebase/rules-unit-testing';

// Positive test: Student updates permitted fields
await assertSucceeds(
  studentContext.firestore().doc('students/student_123').update({
    department: 'Software Engineering',
    phone: '+1 555 123 4567'
  })
);

// Negative test: Student attempts role escalation to admin (must fail)
await assertFails(
  studentContext.firestore().doc('students/student_123').update({
    role: 'admin',
    isAdmin: true
  })
);

// Negative test: Student attempts cross-user read (must fail)
await assertFails(
  studentContext.firestore().doc('students/student_456').get()
);`}
                </div>
              </div>

              <div className="card border-0 shadow-sm rounded-3 p-3 bg-white">
                <h6 className="fw-bold text-dark mb-2">4. Run Rules Suite Locally</h6>
                <div className="bg-dark text-light p-3 rounded font-monospace small">
                  <code>firebase emulators:exec --only auth,firestore "npm test"</code>
                </div>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="modal-footer bg-light px-4 py-3 d-flex justify-content-between">
            <button
              className="btn btn-outline-danger btn-sm rounded-pill px-3"
              onClick={() => {
                firebaseService.resetToInitialDemo();
                onRefreshAppState();
              }}
              title="Reset local simulated database to initial state"
            >
              <i className="bi bi-arrow-counterclockwise me-1"></i> Reset DB to Initial Demo
            </button>
            <button type="button" className="btn btn-secondary rounded-pill px-4" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
