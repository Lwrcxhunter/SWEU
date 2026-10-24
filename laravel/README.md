# BukSU Guidance and Counseling

Laravel 12, React 18, Inertia 2, Tailwind 4, and the official MongoDB Laravel integration. The user approved Laravel 12 after the requested Laravel 11 was found to be unsupported and affected by security advisories. The original Node prototype and its JSON records remain in the parent directory and are not imported or used by this application.

## Run in this workspace (Windows)

From the project root:

```powershell
.\scripts\start-local.ps1
```

Open **http://127.0.0.1:8000**. The launcher uses the project-local PHP configuration and MongoDB installation in `.runtime/`. It does not install a Windows service or edit machine-wide PHP settings. Keep that terminal open while using the application. MongoDB runs on loopback port 27028; the Laravel development server runs on loopback port 8000.

In another terminal, create the first administrator:

```powershell
.\scripts\php.ps1 artisan guidance:admin
```

The command prompts privately for a password. There are **no default application credentials**. Students can register themselves; staff, faculty, counselors, and other administrators are created from the administrator's People & permissions screen.

To stop the web server, press Ctrl+C in its terminal. The local MongoDB process remains available for subsequent runs. Its PID is recorded in `.runtime/mongo.pid`; stop only that process if you need to shut down this application's database.

## Install on another machine

1. Install PHP 8.2 or newer with MongoDB, OpenSSL, mbstring, fileinfo, XML, DOM, and the standard Laravel extensions. The generated Composer lockfile targets PHP 8.2 compatibility; this build was executed with PHP 8.4.
2. Install Composer and a current Node.js LTS version.
3. Provide a MongoDB replica set. Transactions are required for appointment/alert consistency and versioned note changes; a standalone MongoDB server is insufficient. For local development a single-member replica set is enough.
4. In this directory:

```sh
composer install
cp .env.example .env
php artisan key:generate
npm ci
npm run build
```

5. Set `MONGODB_URI` and `MONGODB_DATABASE` in `.env`. The example points to the local `guidance` replica set at `127.0.0.1:27028`.
6. Run `php artisan guidance:setup` to create collections, unique indexes, and initial role grants. The command preserves existing grants and records. It does not delete data. There are no SQL migrations to run.
7. Run `php artisan guidance:admin`, then `php artisan serve` for local development.

On this Windows machine Composer is an extensionless PHP archive. Use `php C:/bin/composer` with the local PHP configuration, rather than invoking `composer` directly.

Official runtime documentation: [MongoDB PHP installation](https://www.mongodb.com/docs/drivers/php/laravel-mongodb/current/get-started/), [MongoDB Windows installation](https://www.mongodb.com/docs/v8.0/tutorial/install-mongodb-on-windows-zip/).

## Implemented workflows

| Role | Workspace and actions |
|---|---|
| Student | Register/login; complete intake and both declarations; request face-to-face, online, or telecounseling sessions; join the walk-in queue; submit self/peer referrals; request GAMA or other testing; view own status and notifications. |
| Faculty | Submit referrals by student ID and track only their own referral statuses. No intake narratives or counseling notes are returned. |
| Staff / psychometrician | Check in students with completed intake; view the active queue; assess urgency; alert and assign counselors; process referral and testing queues; export aggregate CSV reports. |
| Counselor | View assigned appointments and intake; accept/reschedule/complete sessions; record encrypted notes; manage case closure and follow-up sessions; flag and resolve follow-ups; plan weekly availability, class blocks, and leave; export their own case/session summaries; receive in-app alerts. |
| Head counselor | Read case notes in the audit workspace after each access is recorded; cannot edit notes or view intake narratives. |
| Administrator | Create/disable accounts, change roles, map multiple colleges per counselor, and restrict role permissions. Administrators have no clinical note access. |

Online appointments use 30-minute start times and Philippine calendar dates. Mapped available counselors are selected deterministically. If mapped counselors are all booked for that slot, the request is rejected; if no mapped available counselor exists, it remains pending for front-desk coordination. MongoDB's unique partial slot index resolves races at the database level.

Urgent walk-ins bypass ordinary slot reservation and alert all active, on-duty, available counselors. The front desk makes the assignment. In-app notifications refresh every 15 seconds while an authenticated workspace is open. They are not an emergency dispatch service and are not email/SMS delivery.

Referrals progress through `submitted → under_review → action_taken → closed`. Testing progresses through `pending → approved → completed`. Appointment updates enforce valid state transitions and an optimistic version to reject stale actions.

Appointment confirmation is a two-step process: staff assignment moves a request to `assigned_pending_counselor`; counselor acceptance moves it to `counselor_accepted_pending_student`; and only the owning student can confirm it as `confirmed`. Counselors can request reassignment with a required note while an assignment is awaiting their response. The note is shown to staff in the front-desk queue and is not included in the student's appointment view.

Accepting an assigned appointment opens a counselor-owned case with an atomic `CASE-YYYY-NNNN` number and its first scheduled session. The counselor can review the case session history, close the active session with a `completed/stable` outcome, or schedule an AM/PM face-to-face or virtual follow-up under the same case. Follow-up appointments reserve the counselor's slot and remain pending student confirmation. Case numbering and per-case session numbers have database uniqueness constraints.

Counselors manage weekly counseling availability, recurring class blocks, and dated planned or official leave from their schedule workspace. Schedule overlaps and conflicts are rejected; regular assignments and follow-up bookings must fit availability and avoid class/leave periods. Urgent assignments can occur outside regular availability but cannot overlap leave. Staff can view availability and leave type for assignment decisions, but not private leave reasons. Existing counselors without a saved schedule retain the previous assignment behavior until they configure one.

The `head_counselor` role is read-only for clinical notes. Each note/case-history read writes an `audit_logs` record with the actor, case/session IDs, action, IP, and timestamp before returning content; the audit record never contains note text. Operational staff session lists exclude notes. Counselors can export only their own case/session summaries as JSON or UTF-8 CSV, or open a print-friendly HTML report and use the browser's print-to-PDF option. Exports contain case number, session date/time, mode, status, and category, never intake narratives or clinical notes.

## Data and authorization design

- Every application model inherits `MongoDB\Laravel\Eloquent\Model` through `App\Models\Document`. `User` adds Laravel's authentication and authorization contracts/traits to that MongoDB model.
- Required domain collections: `users`, `students`, `appointments`, `counseling_cases`, `counseling_case_sequences`, `counseling_sessions`, `referrals`, `testing_requests`. Supporting collections: `role_grants`, `office_alerts`, `audit_logs`, `counselor_schedules`.
- ObjectId references are stored as BSON ObjectIds. Page projections deliberately serialize IDs to strings and omit clinical content from operational lists.
- Spatie's real `RoleMiddleware`, `PermissionMiddleware`, and Gate registration are used with a small Mongo-native adapter on `User` (`hasAnyRole`, `hasAnyPermission`, `checkPermissionTo`). `role_grants` stores permission arrays, avoiding Spatie's SQL pivot schema. Use the application's administrator screen for permission changes; stock Spatie role/pivot mutation commands are not part of this adapter.
- The single `users.role` value is authoritative. Role permissions may narrow its configured capabilities, but cannot grant access outside the fixed role/policy boundaries. There is no administrator superuser bypass.
- Clinical notes use Laravel's encrypted cast and are hidden from ordinary model serialization. Only the assigned session counselor can edit them; the head counselor can read them only after an audit record is written. Notes are versioned to reject stale saves. Administrators, faculty, students, staff, and other counselors are denied even with a known record ID.
- Session cookies are HttpOnly; requests use CSRF protection, login throttling, session regeneration, encrypted file sessions, password-hash session checks, and no-store responses. Inertia history encryption is enabled and logout clears its history key.
- Sworn truthfulness, agreement acknowledgment, timestamp, and agreement version are persisted. Phone validation accepts `09xxxxxxxxx` or `+639xxxxxxxxx`.
- `guidance:setup` creates uniqueness constraints for email, student ID, user/student linkage, active appointment slots, appointment/session linkage, case numbers, and per-case session numbers. Application updates never rewrite an entire dataset.

## Institution-specific decisions still needed

- **Director access:** The original specification mentions a director but lists only five roles. Director access remains disabled until a role/permission decision is supplied; it is never inferred from the administrator role.
- **Student ID format:** The initial configurable `STUDENT_ID_PATTERN` allows 4–20 alphanumeric/hyphen characters. Replace it with BukSU's confirmed format.
- **College names and agreement wording:** Review `config/guidance.php` and the intake page with the office. The college list and counseling agreement text are initial implementation content, not a claim of institution-approved wording. College-to-counselor mappings are managed in the administrator screen.
- **Notifications and channels:** Notifications are in-app. No mail/SMS provider, video conferencing, or telephone service is configured. Online/telecounseling are booking preferences for office coordination.
- **Historical data:** No JSON records or staff passwords are automatically migrated. Importing real records requires a separate, reviewed mapping and migration.

The background interview also mentions external clinical referrals, group/career guidance, and test administration. The supplied core implementation specification covers intake, appointments, internal referrals, testing requests, and office reporting; external-provider integration and test scoring are not implemented.

## Verification

PHP integration tests use only the explicitly named loopback database `buksu_guidance_test`. They refuse to clear any other database or connect to a different host/port.

```powershell
# From the project root, with the local MongoDB replica set running:
.\scripts\php.ps1 vendor/bin/phpunit
.\scripts\php.ps1 vendor/bin/pint --test
```

```sh
# From laravel/:
npm run build
npm run format:check
composer audit
npm audit
```

Browser tests use a separate synthetic database, `buksu_guidance_browser_test`, and port 8001. Their known test password is accepted only by deliberately seeded synthetic accounts in that database; it is never seeded into the application database.

```powershell
# Terminal 1, from the project root:
$env:MONGODB_DATABASE = 'buksu_guidance_browser_test'
.\scripts\php.ps1 tests/browser/seed.php
.\scripts\php.ps1 artisan serve --host=127.0.0.1 --port=8001 --no-reload

# Terminal 2:
cd laravel
npx playwright install chromium
npm run test:browser
```

Re-seed the browser-test database before rerunning its stateful end-to-end workflow. Screenshots are written to `laravel/test-results/` and ignored by Git. Clear the temporary `MONGODB_DATABASE` environment override before starting the normal application.

## Deployment boundary

No deployment was performed. For an institution-managed deployment, serve only `laravel/public` over HTTPS, set `APP_ENV=production`, `APP_DEBUG=false`, `SESSION_SECURE_COOKIE=true`, and configure an authenticated, access-controlled MongoDB replica set. Do not expose the local unauthenticated MongoDB port or use `artisan serve` as a production server.

Back up the database and `APP_KEY` separately and securely. Losing the key loses the ability to decrypt existing notes. Do not rerun `key:generate` on a populated deployment. Use Laravel's previous-key configuration and a reviewed re-encryption procedure when rotating keys. Retention, backup recovery, access auditing, college configuration, and the final counseling agreement need the university's operational decisions before real use.
