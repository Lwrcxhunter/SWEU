# Staff workspace

The staff navigation follows the work done at the guidance office:

- **Appointments:** all student bookings and walk-ins, including completed and cancelled records. Filter by confirmation stage, student name/ID and appointment date. Check in a walk-in using an existing student's ID.
- **Counselor schedules:** a day timeline for comparing counselors at the same time, and a week overview with expandable time blocks. Filter by college, counselor name or an available 30-minute starting time.
- **Testing requests:** faculty, internship-coordinator and student request forms, with requester information, cohort size, requested schedule, details and approval/completion actions.
- **Student referrals:** requester and student information, referral reasons and review progress.
- **Office reports:** existing reporting workspace.

Appointment rows show the student, requested date/time, mode, current stage and counselor. Expanding a row opens assignment or appointment details. Available counselors appear first, with college designates identified. Unavailable counselors have a separate expandable list explaining class, leave, booking or schedule conflicts. For AM/PM requests, staff select one of the counselor's available times before sending an assignment. The server rechecks availability and the record version when saving.

The progress indicator distinguishes assignment, counselor acceptance and student confirmation. Completed and cancelled appointments remain searchable. Operational appointment lists omit questionnaire answers and signatures; existing authorized PDF access remains available.

The visual design uses SWEU's powder-blue identity with Segoe UI for clear, familiar text. The staff theme is scoped to `.staff-workspace`, keeping other roles' appearance independent. Page headings use a mist-blue panel, selected navigation has a blue outline and inset marker, and actions use powder-blue fills with dark text. Rounded controls and quiet borders distinguish interactive elements without adding visual clutter. Information order and navigation remain unchanged.

| Token | Color | Purpose |
|---|---|---|
| Canvas | `#f3f7fb` | Main workspace background |
| Surface | `#ffffff` | Appointment rows, filters and request forms |
| Mist | `#e7f0f8` | Sidebar and page heading |
| Powder blue | `#d3e5f3` | Selected controls |
| Border | `#d6e3ee` | Surface boundaries |
| Ink | `#294b68` | Headings and emphasis |

Muted green, blue, rose and amber continue to distinguish availability, classes, leave and bookings alongside text labels. Controls retain visible keyboard focus, and nonessential transitions stop when reduced motion is requested.

The calendar displays the current scheduling service's 8 AM–5 PM window, excluding the noon break. On-duty status describes the current moment; dated schedule blocks determine advance-booking availability. Private leave reasons and clinical notes are not displayed.

“Form requests” use the existing testing and referral workflows. This change does not introduce a separate document-issuance workflow or an additional coordinator role.

Verification: PHP integration tests in `StaffAvailabilityTest.php` cover stage/history filters, student searches, operational-data projection, request inbox filters and availability rules. `staff-availability.spec.js` exercises assignments, AM/PM slot selection, history, schedule navigation/filtering, request processing and responsive layouts using the isolated browser-test database.
