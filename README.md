# BukSU Guidance and Counseling System

The new Laravel 12 + React 18/Inertia + MongoDB application is in [`laravel/`](laravel/README.md).

From this project root on Windows:

```powershell
.\scripts\start-local.ps1
```

Open http://127.0.0.1:8000. Create the first administrator in a separate terminal with:

```powershell
.\scripts\php.ps1 artisan guidance:admin
```

See the [application guide](laravel/README.md) for installation, workflows, security boundaries, institution-specific settings, and tests. The original Node prototype and its JSON data remain unchanged below; they are not used by the Laravel application.

---

# University Counseling Integrated Prototype

This version connects the existing student intake page to a Node.js backend with a persistent JSON data store and a protected counseling-office dashboard.

## 1. Install Node.js
Use Node.js 20+.

## 2. Open this folder in VS Code

`university-counseling-integrated`

## 3. Start the backend

No npm package installation is required for this prototype.

```bash
node server.js
```

## 4. Open the pages

Student intake:

http://localhost:3000/

Staff login:

http://localhost:3000/staff-login

Staff dashboard:

http://localhost:3000/office

## Demo staff account

Email: `counselor@university.edu`

Password: `Counselor123!`

Change this before any real deployment.

## What is connected

Student submission -> Node.js API -> persistent JSON data -> Counseling Office dashboard.

Counselor actions included in this prototype:

- Review an intake record
- Assign counselor/date/time and mark the intake `Scheduled`
- Save a confidential staff note
- Record that a notification was sent
- Print the client record
- Search intake submissions
- Refresh the queue and dashboard metrics
- Staff login/logout using a session cookie

Actual email/SMS delivery is not configured. The notification action records a notification status in the persistent data store. A mail/SMS provider can be added later.

## Persistent data

The backend automatically creates:

`data/intakes.json`
`data/staff.json`

These files persist the student submissions and staff account for the prototype. Do not commit real counseling data or secrets to a public repository.

## Important for real use

The form contains sensitive counseling information. The prototype uses basic session authentication for demonstration only. A real deployment should use HTTPS, stronger credential management, secure session configuration, role-based authorization, audit logs, backups, access controls, and the university's approved data/privacy practices.
