# BukSU guidance system implementation

User specification: SPECIFICATION.md. Existing app is a seven-file Node/static HTML prototype, with no Git metadata. Source-only baseline is in baseline/; existing data must not be read, imported, copied, or modified by the implementation worker.

## Architecture and boundaries

- Build the replacement in `laravel/` so the working prototype and data remain intact. Root README may later link the new app; do not leave the legacy Node server as a production entrypoint for the new app.
- Laravel 12 (user approved supported-version upgrade), PHP 8.2+, official mongodb/laravel-mongodb driver, React 18, Inertia, Tailwind, Breeze authentication and Spatie permission integration. Pin compatible dependencies with generated lockfiles. The user explicitly approved patched Laravel 12 during implementation.
- All application models descend from MongoDB Eloquent Model. User may use the official MongoDB Auth User subclass or implement Authenticatable on MongoDB Model. Store ObjectId references consistently; serialize IDs as strings in deliberate page DTOs.
- Five roles exactly as specified pending director clarification. No blanket admin authorization bypass. Only the counselor assigned to an appointment may read/write its notes; front desk, faculty, student, admin and other counselors must never receive decrypted notes in page props, reports, logs, notification payloads, or generic model JSON. Director access remains disabled pending clarification.
- Native Laravel encryption using APP_KEY, hidden note attribute, explicit authorized decryption only. Notes remain attached to their original session counselor; reassignment must not silently transfer historical note access. Preserve APP_KEY; provide backup/rotation guidance without exposing keys.
- Login uses CSRF/session regeneration, password hashing, throttling, secure production cookies, and generic errors. Registration always creates a student; privileged roles only via authenticated admin tooling or explicit local bootstrap command. No default public password. Kiosk intake uses a student-authenticated flow and logout/reset; staff sessions must never be exposed to student terminals.
- Server-enforced truth/agreement booleans plus recorded timestamp/version. Philippine phone regex supports 09xxxxxxxxx and +639xxxxxxxxx. Student-ID pattern configurable; initial documented assumption 4-20 alphanumeric/hyphen characters pending institution format.
- College mapping belongs to admin configuration, supports multiple college codes per counselor, and explicit on-duty/available state. Booking chooses mapped available counselor deterministically and enforces slot conflicts; unstaffed colleges create pending/unassigned appointments with an honest message, never silent cross-college assignment. Asia/Manila scheduling dates and validated future slots.
- Urgent walk-ins bypass ordinary booking slots, preserve urgent status, and create persistent in-app alerts to on-duty available counselors. No claim of actual SMS/email delivery without provider configuration.
- Counselors see only assigned cases, may accept/reschedule/complete appointments using legal state transitions, and flag follow-up with required future date. Staff see operational queues/statuses, not clinical narratives; referral author sees only own referrals and high-level status. Students see only own records and submit self/peer referrals without student-directory disclosure. Reports contain aggregate counts only.
- Database unique indexes/conditional writes prevent duplicate identities/slots and stale state transitions. Avoid whole-collection read/write patterns. Use explicit per-role response projections, pagination, and invalid ObjectId handling.
- Admin manages accounts, role permissions and mappings; no permission management can grant clinical-note access outside the explicit note policy. Protect last admin and current user's destructive role changes. Preserve note authorship when counselor role/mapping changes.

## Phases

1. Foundation and security vertical slice: Laravel app, dependencies, local runtime, MongoDB model/index contracts, Breeze React login/registration, Spatie Mongo-compatible roles/permissions, role dashboards and authorization/encryption tests. Prove package compatibility against a disposable local MongoDB if feasible. Stop for root decision if Spatie needs a different database or substitute package. No security-check bypass to install dependencies.
2. Operational workflows: implement all specified controller/page paths, intake, booking/routing, walk-in urgent queue and in-app alerts, notes/follow-up, referrals/testing, admin mappings/accounts/permissions, aggregate reports. Connect actual forms/actions, no placeholder navigation. One Flash worker owns end-to-end implementation, tests, debugging and UI QA.
3. Astra batched acceptance: inspect actual additions, requirement coverage, authorization/data exposure, concurrency evidence. One consolidated correction cycle by default. Record validation limits and runnable setup.

## Environment and ownership

Root owns this plan and CHECKPOINT.md. Worker owns `laravel/**`, its report files in this directory, and later the root README setup link. Worker is not alone in the workspace and must preserve others' work. No commits, pushes, deployment, global config changes, paid service setup, production connections, or recursive delegation.

PHP 8.4.25 is available but without enabled mbstring/openssl/mongodb. Composer must be invoked as `php C:/bin/composer` because the extensionless wrapper is not executable in PowerShell. Use `py` for Python (`python` resolves to a nonfunctional stub). Project-local PHP configuration and downloaded official runtime tools are allowed; no machine-global service or php.ini changes. MongoDB and Docker were not on PATH. Bind disposable test servers to loopback with synthetic records only; never run destructive tests against a non-test DB.

## Acceptance evidence

- Composer install/check-platform-reqs and npm build; PHP syntax and route boot.
- Real Mongo integration tests for registration/login, role/record isolation, denied privilege escalation, encrypted raw BSON and redacted serialization, routing/mapping, conflicts/transitions, validation/consent, urgent alert recipient selection, reports and follow-up.
- Browser checks where available: each role's real workflow, errors/loading/empty states, responsive forms and keyboard labels. Clearly distinguish static/build evidence from browser evidence.
- Record commands, outcomes, files changed, assumptions and environment blockers. Do not claim completeness for unexecuted tests.

Routing static doctor: gpt-6-astra root, astra_flash_builder pinned deepseek/deepseek-v4.1-flash through DeepSeek API, static-ready; runtime provider metadata not yet verified. No paid probe was run.

## Execution amendment

The Flash provider returned HTTP 402 before coding. The user explicitly authorized Astra to implement directly. All implementation and verification after that point is root Astra work; no fallback worker was used. The user subsequently approved Laravel 12.
