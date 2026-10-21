# MASTER SYSTEM SPECIFICATION & IMPLEMENTATION PROMPT

## 1. BACKGROUND & INTERVIEW CONTEXT
You are building a web-based Guidance and Counseling System for the Student Welfare and Engagement Unit (SWEU) / University Guidance Office at Bukidnon State University (BukSU).

### Key Insights from Client Interview:
- **Office Services:** Handles counseling (face-to-face, walk-ins, online, telecounseling), consultations, internal referrals (faculty/teachers/peer facilitators), external referrals (clinical psychologists, psychiatrists, medical doctors), group/career guidance, and psychological testing requests (e.g., GAMA).
- **Core Operational Problems:**
  1. Multitasking & Workload: Heavy workload serving thousands of students across the main campus and 16 satellite campuses with overlapping staff roles (faculty, directors, counselors).
  2. Manual Data Entry & Errors: Inaccurate, untruthful, or incomplete contact details provided on physical forms hinder student contact tracing and follow-ups.
  3. Student Stigma & Confidentiality Fears: Students hesitate to seek help due to fear of judgment or privacy leaks. Online booking options discreettly accommodate hesitant students, while walk-in terminal access eliminates paper forms.
  4. Follow-Up Tracking: Difficulty tracking at-risk students due to heavy workloads and student reluctance to return.

---

## 2. TECH STACK & ARCHITECTURE
- **Backend Framework:** Laravel 11 (PHP 8.2+)
- **Frontend Framework:** React 18 + Inertia.js (Tailwind CSS for UI)
- **Database Engine:** MongoDB (via official `mongodb/laravel-mongodb` driver)
- **Authentication & Security:** Laravel Breeze / Spatie Laravel-Permission (Role-Based Access Control) with encrypted counseling notes at rest.

---

## 3. USER ROLES & PERMISSIONS MATRIX

1. **Student:**
   - Complete digital Intake & Counseling Agreement Forms.
   - Book online or face-to-face appointments (choosing preferred date, time, and channel).
   - Submit student/peer referrals.
   - Submit psychological testing form requests (e.g., GAMA).

2. **Faculty / Instructor:**
   - Submit student referrals directly into the system.
   - Track high-level referral status (Pending, Under Review, Action Taken, Closed) without access to private counseling notes.

3. **SWEU Front-Desk Staff / Psychometrician:**
   - Manage the Walk-In Queue Manager on office terminals.
   - Process walk-in students, assess case urgency, and immediately call/assign available counselors.
   - Monitor active cases and export aggregated, non-confidential summary/accomplishment reports for ISO compliance.

4. **College Guidance Counselor / Designate:**
   - Receive notifications for appointments assigned by SWEU staff or directly booked by students in their assigned college(s) (handling multi-college mappings if assigned to more than one).
   - Accept, reschedule, or complete pending appointment requests.
   - Record private, encrypted post-session notes and flag at-risk students for follow-up tracking.

5. **System Administrator:**
   - Manage user accounts, role permissions, and college-to-counselor mappings.

---

## 4. DATABASE SCHEMA (MongoDB Collections)

All Eloquent models must extend `MongoDB\Laravel\Eloquent\Model`.

### Collections:

1. **`users`**
   - `_id`: ObjectId
   - `email`: String (Unique)
   - `password`: String (Hashed)
   - `full_name`: String
   - `role`: String (`student`, `faculty`, `staff`, `counselor`, `admin`)
   - `created_at`: DateTime

2. **`students`**
   - `_id`: ObjectId
   - `user_id`: ObjectId (Ref: `users`)
   - `school_id_number`: String
   - `college`: Embedded Object (`code`: String, `name`: String)
   - `year_level`: String
   - `phone_number`: String (Regex validated)
   - `emergency_contact`: Embedded Object (`name`: String, `phone`: String)
   - `intake_record`: Embedded Object (`is_sworn_truthful`: Boolean, `signed_agreement`: Boolean, `living_condition`: String, `personal_concerns`: Array, `submitted_at`: DateTime)

3. **`appointments`**
   - `_id`: ObjectId
   - `student_id`: ObjectId (Ref: `students`)
   - `counselor_id`: ObjectId (Ref: `users`, Nullable)
   - `channel`: String (`face_to_face`, `online`, `telecounseling`)
   - `type`: String (`online_booking`, `walk_in`)
   - `urgency_level`: String (`normal`, `urgent`)
   - `scheduled_date`: String (YYYY-MM-DD)
   - `scheduled_time`: String
   - `status`: String (`pending`, `assigned`, `accepted`, `completed`, `cancelled`)
   - `created_at`: DateTime

4. **`counseling_sessions`**
   - `_id`: ObjectId
   - `appointment_id`: ObjectId (Ref: `appointments`)
   - `student_id`: ObjectId (Ref: `students`)
   - `counselor_id`: ObjectId (Ref: `users`)
   - `encrypted_session_notes`: String (Encrypted at rest)
   - `is_flagged_for_followup`: Boolean
   - `next_followup_date`: String (YYYY-MM-DD, Nullable)
   - `created_at`: DateTime

5. **`referrals`**
   - `_id`: ObjectId
   - `referrer_id`: ObjectId (Ref: `users`)
   - `student_id`: ObjectId (Ref: `students`)
   - `reason`: String
   - `status`: String (`submitted`, `under_review`, `action_taken`, `closed`)
   - `created_at`: DateTime

6. **`testing_requests`**
   - `_id`: ObjectId
   - `student_id`: ObjectId (Ref: `students`)
   - `test_type`: String (`GAMA`, `Other`)
   - `status`: String (`pending`, `approved`, `completed`)
   - `requested_at`: DateTime

---

## 5. CORE WORKFLOWS & CONTROLLER ACTIONS TO BUILD

### A. Digital Intake Form & Truthfulness Checkbox
- **Controller:** `app/Http/Controllers/IntakeFormController.php`
- **React Page:** `resources/js/Pages/Student/IntakeForm.jsx`
- **Logic:**
  - Enforce input validation for phone numbers (`09...` or `+639...`) and student ID format.
  - Require two mandatory checkboxes:
    1. Counseling Agreement Form acknowledgment.
    2. Sworn declaration: *"I hereby swear that all information provided in this form is true, correct, and complete to the best of my knowledge."*

### B. College-Counselor Auto-Routing & Online Appointment Booking
- **Controller:** `app/Http/Controllers/AppointmentController.php`
- **React Page:** `resources/js/Pages/Student/BookAppointment.jsx`
- **Logic:**
  - When a student books online, auto-assign or route the appointment to the counselor mapped to their college.
  - Support multi-college counselor mappings (e.g., if 1 counselor covers 2 colleges).

### C. SWEU Front-Desk Walk-In Queue & Urgent Case Assessment
- **Controller:** `app/Http/Controllers/WalkInQueueController.php`
- **React Page:** `resources/js/Pages/Staff/WalkInQueue.jsx`
- **Logic:**
  - Walk-in students fill intake details digitally on physical office terminals.
  - SWEU front-desk staff assess case urgency.
  - **Urgent Toggle:** If flagged as urgent, bypass standard scheduling to immediately alert on-duty available counselors.

### D. Private Counselor Notes & At-Risk Student Monitoring
- **Controller:** `app/Http/Controllers/SessionNoteController.php`
- **React Pages:** `resources/js/Pages/Counselor/Dashboard.jsx`, `resources/js/Pages/Counselor/SessionNotes.jsx`
- **Logic:**
  - Encrypt post-session notes in MongoDB so only assigned counselors and the director can read them.
  - Provide a **"Flag for Follow-Up"** toggle to auto-add high-risk cases to the active case tracking list.

### E. Faculty Referrals & Psychological Testing Queue
- **Controllers:** `ReferralController.php`, `TestingRequestController.php`
- **React Pages:** `resources/js/Pages/Faculty/SubmitReferral.jsx`, `resources/js/Pages/Student/RequestTesting.jsx`
- **Logic:**
  - Faculty submission portal for student referrals with high-level status updates.
  - Student queue for requesting testing forms (e.g., GAMA) managed by psychometricians.

---

## 6. INSTRUCTIONS FOR CODEX

1. Analyze the existing codebase structure.
2. Build/update the Laravel Controllers, MongoDB Models, and Inertia/React components as detailed above.
3. Ensure all frontend components are styled cleanly with Tailwind CSS.
4. Protect all routes using Laravel auth and role middleware (`auth`, `role:student`, `role:staff`, `role:counselor`, `role:faculty`, `role:admin`).