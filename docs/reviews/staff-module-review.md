# Staff module review — 24 October 2026

Scope: review and improve TASK-STF-01, TASK-STF-02 and TASK-STF-03 in the existing Laravel application. Existing testing-request, authentication and student-page edits were preserved.

## Findings addressed

| Severity | Original issue | Change |
| --- | --- | --- |
| Critical | The assignment dropdown checked `counselor.active`, which was absent from the server response. Every counselor was disabled. | The dropdown now consumes server-evaluated availability for each request. |
| High | Calendar and dropdown applied separate, inconsistent rules. The calendar required a `period` on classes, while assignment checked only the appointment's start time. | One availability service checks the entire 30-minute reservation against teaching intervals, including classes with times but no period. |
| High | Counseling hours were never enforced. An explicitly empty schedule reverted to full weekday availability. | Assignment requires a counseling interval that contains the reservation; an empty schedule stays unavailable. |
| High | Pending/rejected leave blocked bookings, and raw leave reasons were shared in general user projections. | Only approved leave blocks bookings; legacy statusless leave remains official leave. The roster receives generic approved-leave blocks, without personal leave reasons. |
| High | The dropdown recommended already-booked counselors. | Pending assignments and accepted appointments reserve time in both the roster and assignment choices. Backend checks use BSON ObjectIds and detect existing bookings even when legacy records have no `slot_key`. |
| High | The dropdown had lost the on-duty restriction for urgent walk-ins. | Both UI and server require on-duty counselors for urgent work, and check approved leave, teaching and existing bookings. |
| Medium | The calendar was a weekday template tied to the current week, with no displayed dates or date navigation. | Dated day/week views, previous/next/today controls, weekend coverage, college filter and counselor search. |
| Medium | AM/PM was referenced by validation but not supported consistently. | The booking API can retain an AM/PM-only preference. Staff see free times in that period and must select one; the server rechecks the selection. Existing exact-time requests retain their requested time. |
| Medium | Virtual requests displayed as face-to-face. | Queue cards render the stored channel. |
| Medium | Referral counts were still queried after their card was removed. | Removed the unused referral query. Testing status and navigation remain. |
| Medium | Staff had a long undifferentiated queue and repeated duty-board content. | Added server-side stage filters, global counts and pagination, expandable assignment forms, and a separate availability view. Reassignment clears previous acceptance timestamps. |

## Staff organization

The queue emphasizes requests needing assignment, awaiting a response, accepted requests and urgent walk-ins. Filtering happens before pagination, so requests on later pages are not silently missed. The page keeps the existing portal typography and blue palette; green, blue, rose and amber distinguish counseling availability, classes, leave and bookings, with text labels alongside color.

The calendar shows scheduling information only. Existing student access, counselor-only clinical notes and testing workflows remain governed by their existing policies. Automatic queue refresh pauses while a form has focus and when the page is hidden.

## Remaining gaps in the larger six-step workflow

These are existing cross-module requirements, not completed by the staff module changes:

1. **High: counselor-first acceptance is not enforced.** `Appointments::change()` still lets either the student or counselor change an assigned request to `accepted`. It needs separate counselor-accepted and student-confirmed transitions, corresponding notifications, and updates to both dashboards. The current test named `test_dual_acceptance_flow_and_onboarding_notes` also accepts as the student first, so it does not verify the requested sequence.
2. **High: no Case aggregate or persistent Case ID.** Notes belong to individual appointments; follow-ups are separate appointments linked from a session. Introduce a case owned by one counselor and attach all of its sessions before implementing case closure.
3. **High: follow-up rejection does not require a reason.** Existing cancellation cannot substitute for the requested rejection form and audit trail.
4. **Required: schedule maintenance and approval source.** The inspected application has no interface for maintaining the new teaching schedule and leave arrays. When no counselor-specific schedule exists, the original implementation's weekday office hours remain the compatibility default (08:00–12:00, 13:00–17:00); the roster labels these as “Default office hours.” An explicit empty schedule means no counseling hours. Connect these records to the institution's schedule and leave approval process before treating them as authoritative.
5. **Required: student preference screen.** The staff flow and booking API now handle period-only requests, but the existing student wizard still collects an exact time. Update that screen when implementing the full student workflow.

## Scheduling assumptions and limits

- Reservations use the existing 30-minute model. The roster presents 08:00–12:00 and 13:00–17:00 in Philippine time; overlapping class blocks conservatively occupy a full reservation slot.
- Legacy leave entries without a status are treated as approved, matching their existing meaning as official leave. Explicit pending or rejected entries do not block assignments.
- Urgent walk-ins retain the existing immediate-assignment policy and bypass ordinary counseling hours and the normal unique slot reservation. Conflicts present when assigning are checked, but simultaneous urgent assignments still need a dedicated concurrency policy.
- Normal assignments retain the database's unique slot index. Availability displayed on screen is advisory until the server validates the assignment.
- Rescheduling and counselor-created follow-ups still have their existing validation paths. Applying the new availability rules to those paths belongs with the remaining workflow work.

## Verification

- PHP integration suite: 46 tests passed, including seven new staff availability tests.
- New tests cover teaching overlaps, counseling boundaries, explicit empty schedules, approved/legacy leave, AM/PM selection, existing bookings without slot keys, stale availability, urgent duty checks, dated calendar output, private leave data, filtering before pagination and retained testing counts.
- Dedicated Playwright staff test covers available/disabled counselor choices, assignment, AM/PM slot selection, virtual labels, testing navigation, date navigation, day/week views, college/name filters, empty states and mobile layout.
- Production Vite build and formatting checks run for the changed files.
- The older all-role browser workflow was not used as the verification gate: it still expects a staff “Referral queue” navigation link that TASK-STF-03 removes.

No deployment, commit or merge was performed.
