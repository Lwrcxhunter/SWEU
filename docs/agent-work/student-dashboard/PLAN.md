# Student dashboard and personal information

Implement directly with Astra under the user's standing request to let Astra code. Preserve the existing Laravel 12 / React / Inertia / MongoDB stack and original prototype. No dependency changes, deployment, or historical data rewrite.

## Contract

- `/dashboard` routes students to a dedicated, role-protected student dashboard; other role destinations stay intact.
- Pending appointments are future pending/assigned requests; scheduled appointments are future accepted sessions. Use Asia/Manila date and time, including today's upcoming appointments. Active referrals count open records concerning this student or submitted by this student, without returning faculty reasons or identities. Testing counts are grouped by type and status.
- Dashboard and intake editing explicitly project only the authenticated student's information. New sensitive medical/address fields are hidden from generic model serialization and never added to shared operational student projections.
- Expand the existing intake form and nested MongoDB document with all requested fields. Preserve existing living situation, concerns, agreement metadata, and unrelated stored keys on update. New optional fields tolerate legacy records; date/phone/type/length validation and conditional medication/surgery/other-condition detail rules apply. Dates are BSON dates. Server-generated agreement timestamps cannot be supplied by clients.
- Require fresh affirmative sworn truthfulness and counseling agreement on every save. Save only the current student's document, redirect to the new dashboard with a success message. Never precheck the declarations.
- Sidebar uses a full-height flex container, scrolling navigation and bottom-pinned sign out. Header has an accurate total unread badge (not the five-alert preview length) and keyboard-accessible profile dropdown with the requested entries and user header. Preserve mobile navigation and urgent alerts.
- Settings & Preferences uses the account page with password settings and an explicit stored preference for automatic notification refresh; Edit Profile opens intake for students and editable account name for other roles.
- Testing state changes create a notification for the owning student, atomically with the status change. Existing appointment notifications remain intact.

## Execution and acceptance

1. Add validation/projection, dashboard queries/routes, notification total/testing event, and account settings endpoints.
2. Build the dashboard, expanded intake sections, shared sidebar/header, profile menu and settings forms.
3. Verify MongoDB date types, ownership, validation, legacy record preservation, future/status boundaries and unread totals with integration tests. Exercise real student edit/save flow and shared navigation on desktop/mobile, alongside existing five-role workflows.
4. Review specification compliance and quality/security with the code-review-and-quality skill; build and format checks; record results.

Medical history is student-reported intake data, not a diagnosis. Existing clinical note authorization remains unchanged. No real data is used in tests; only the already guarded loopback test databases.
