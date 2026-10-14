# Security Specification & Threat Model
## Campus Event Management System

### 1. Data Invariants
1. **User Identity Boundary**: A student can only create, update, or read their own document in `/students/{studentUid}` where `{studentUid} == request.auth.uid`. No user passwords can ever be written to Firestore.
2. **PII Isolation**: Contact info, department, and student ID are strictly private to the student owner and system admins.
3. **Event Integrity**: Only published events (`isPublished == true`) are readable by guests/students. Registration count cannot exceed `maxCapacity`.
4. **Registration Uniqueness & Ownership**: A registration doc in `/registrations/{registrationId}` requires `{registrationId}` or `resource.data.studentUid == request.auth.uid`.
5. **No Spoofing**: When creating a registration, `incoming().studentUid` must strictly equal `request.auth.uid`.
6. **Cancellation Lock**: Once cancelled, a registration status cannot be toggled back without legitimate re-registration if seats exist.

### 2. The "Dirty Dozen" Payloads (Must Return PERMISSION_DENIED)
1. **Ghost Field Injection**: Adding `isAdmin: true` or `verifiedRole: true` during student profile creation.
2. **Student Identity Spoofing**: Creating `/students/other_student_uid` with `auth.uid = student_123`.
3. **Cross-User Registration Reading**: Student A running a query to read Student B's registrations.
4. **Registration on Behalf of Another**: Submitting `studentUid: "victim_uid"` with caller's auth token.
5. **Direct Event Seat Tampering**: An unauthenticated or standard student directly updating `registeredCount` on `/events/{eventId}` without admin rights.
6. **Unpublished Event Scraping**: Non-admins fetching draft or unpublished events.
7. **Giant Payload Denial-of-Wallet**: Writing a 2MB string into `fullName` or `studentId`.
8. **Invalid Format ID Poisoning**: Specifying an ID path with malicious regex injection or symbols.
9. **Bypassing Registration Deadline**: Writing a registration for an event whose deadline timestamp has passed.
10. **Over-Capacity Write**: Attempting to register when `registeredCount >= maxCapacity`.
11. **Tampering with Other Student's Status**: Updating cancellation on another student's registration doc.
12. **Immutable Field Mutating**: Modifying `createdAt`, `studentUid`, or `eventId` on existing registration records.
