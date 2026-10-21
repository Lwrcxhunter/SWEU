const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { URL } = require('url');

const PORT = Number(process.env.PORT || 3000);
const ROOT = __dirname;
const PUBLIC_DIR = path.join(ROOT, 'public');
const DATA_DIR = path.join(ROOT, 'data');
const INTAKES_FILE = path.join(DATA_DIR, 'intakes.json');
const STAFF_FILE = path.join(DATA_DIR, 'staff.json');

fs.mkdirSync(DATA_DIR, { recursive: true });

const sessions = new Map();
const SESSION_TTL_MS = 8 * 60 * 60 * 1000;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.ico': 'image/x-icon',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp'
};

function nowIso() {
  return new Date().toISOString();
}

function readJson(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return fallback;
  }
}

function writeJson(file, value) {
  const temp = `${file}.tmp`;
  fs.writeFileSync(temp, JSON.stringify(value, null, 2), 'utf8');
  fs.renameSync(temp, file);
}

function cleanText(value) {
  if (value === undefined || value === null) return '';
  return String(value).trim();
}

function required(value, label) {
  const cleaned = cleanText(value);
  if (!cleaned) throw new Error(`${label} is required.`);
  return cleaned;
}

function randomId(bytes = 18) {
  return crypto.randomBytes(bytes).toString('hex');
}

function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  const [salt, storedHash] = String(stored).split(':');
  if (!salt || !storedHash) return false;
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  const a = Buffer.from(derived, 'hex');
  const b = Buffer.from(storedHash, 'hex');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function generateReferenceNumber() {
  return `COUNS-${Date.now().toString().slice(-8)}-${Math.floor(100 + Math.random() * 900)}`;
}

function seedData() {
  let staff = readJson(STAFF_FILE, []);
  if (!Array.isArray(staff) || staff.length === 0) {
    staff = [{
      id: 1,
      email: 'counselor@university.edu',
      name: 'Counselor Rivera',
      role: 'Counseling Staff',
      passwordHash: hashPassword('Counselor123!'),
      createdAt: nowIso()
    }];
    writeJson(STAFF_FILE, staff);
  }

  let intakes = readJson(INTAKES_FILE, []);
  if (!Array.isArray(intakes) || intakes.length === 0) {
    const base = nowIso();
    intakes = [
      {
        id: 1,
        referenceNumber: 'COUNS-DEMO01',
        submittedAt: base,
        updatedAt: base,
        firstName: 'Juan',
        lastName: 'Dela Cruz',
        course: 'BS Information Technology',
        yearLevel: '3rd Year',
        visitType: 'Walk-In',
        referredBy: '',
        address: { street: '', city: 'Cagayan de Oro City', province: 'Misamis Oriental', postalCode: '' },
        dob: '2005-02-18',
        maritalStatus: 'Single',
        email: 'juan.delacruz@example.com',
        phone: '0917-123-4567',
        religion: '',
        messenger: '',
        emergency: { name: 'Maria Dela Cruz', relationship: 'Mother', phone: '0918-555-1234' },
        medicalHistory: ['Anxiety', 'Asthma'],
        familyHistory: 'No significant family history reported.',
        substanceUse: { tobacco: 'No', alcohol: 'Less', caffeine: 'Daily', drugUse: 'No' },
        prescriptionMedication: 'No',
        medicationDetails: '',
        surgery: 'No',
        surgeryDetails: '',
        visitReason: 'Student reports feeling overwhelmed with academic workload and would like support managing stress.',
        expectations: 'Student hopes to learn healthy coping strategies and discuss ways to manage academic pressure.',
        sleepHours: 6,
        previousCounseling: 'No',
        counselingReason: '',
        additionalComments: '',
        schedulePreference: 'Today / As soon as possible',
        todayTime: 'Afternoon',
        preferredDate: '',
        preferredTime: '',
        status: 'Pending Review',
        assignedCounselor: '',
        appointmentDate: '',
        appointmentTime: '',
        notificationStatus: 'Not Sent',
        notifiedAt: '',
        confidentialNote: '',
        reviewedAt: '',
        reviewedBy: ''
      },
      {
        id: 2,
        referenceNumber: 'COUNS-DEMO02',
        submittedAt: base,
        updatedAt: base,
        firstName: 'Angela',
        lastName: 'Santos',
        course: 'BS Psychology',
        yearLevel: '2nd Year',
        visitType: 'Referred',
        referredBy: 'Faculty Adviser',
        address: { street: '', city: 'Opol', province: 'Misamis Oriental', postalCode: '' },
        dob: '2006-06-15',
        maritalStatus: 'Single',
        email: 'angela.santos@example.com',
        phone: '0919-222-3344',
        religion: '',
        messenger: '',
        emergency: { name: 'Roberto Santos', relationship: 'Father', phone: '0920-333-4455' },
        medicalHistory: ['Migraine Headaches'],
        familyHistory: 'Mother has a history of migraine headaches.',
        substanceUse: { tobacco: 'No', alcohol: 'No', caffeine: 'Daily', drugUse: 'No' },
        prescriptionMedication: 'Yes',
        medicationDetails: 'Prescribed migraine medication',
        surgery: 'No',
        surgeryDetails: '',
        visitReason: 'Student was referred to the counseling office and would like a private space to discuss personal concerns.',
        expectations: 'Student would like to understand coping strategies and have someone to talk to.',
        sleepHours: 7,
        previousCounseling: 'Yes',
        counselingReason: 'Previously attended counseling during senior high school.',
        additionalComments: '',
        schedulePreference: 'Within the next few days',
        todayTime: '',
        preferredDate: '',
        preferredTime: 'Any available time',
        status: 'Pending Review',
        assignedCounselor: '',
        appointmentDate: '',
        appointmentTime: '',
        notificationStatus: 'Not Sent',
        notifiedAt: '',
        confidentialNote: '',
        reviewedAt: '',
        reviewedBy: ''
      }
    ];
    writeJson(INTAKES_FILE, intakes);
  }
}

seedData();

function json(res, statusCode, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'Content-Length': Buffer.byteLength(body)
  });
  res.end(body);
}

function text(res, statusCode, body, type = 'text/plain; charset=utf-8') {
  res.writeHead(statusCode, { 'Content-Type': type });
  res.end(body);
}

function redirect(res, location) {
  res.writeHead(302, { Location: location });
  res.end();
}

function parseCookies(req) {
  const result = {};
  const header = req.headers.cookie || '';
  header.split(';').forEach(pair => {
    const index = pair.indexOf('=');
    if (index === -1) return;
    const key = pair.slice(0, index).trim();
    const value = pair.slice(index + 1).trim();
    result[key] = decodeURIComponent(value);
  });
  return result;
}

function getSession(req) {
  const sid = parseCookies(req).sid;
  if (!sid) return null;
  const session = sessions.get(sid);
  if (!session) return null;
  if (Date.now() > session.expiresAt) {
    sessions.delete(sid);
    return null;
  }
  return { sid, session };
}

function requireStaff(req, res) {
  const current = getSession(req);
  if (!current || !current.session.staff) {
    json(res, 401, { error: 'Staff authentication required.' });
    return null;
  }
  return current;
}

function readRequestBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', chunk => {
      raw += chunk;
      if (raw.length > 1_500_000) {
        req.destroy();
        reject(new Error('Request body is too large.'));
      }
    });
    req.on('end', () => {
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch {
        reject(new Error('Invalid JSON body.'));
      }
    });
    req.on('error', reject);
  });
}

function readIntakes() {
  const value = readJson(INTAKES_FILE, []);
  return Array.isArray(value) ? value : [];
}

function writeIntakes(intakes) {
  writeJson(INTAKES_FILE, intakes);
}

function findIntake(id) {
  const intakes = readIntakes();
  const numericId = Number(id);
  return { intakes, index: intakes.findIndex(item => item.id === numericId) };
}

function makeIntakeFromBody(body) {
  const firstName = required(body.firstName, 'First name');
  const lastName = required(body.lastName, 'Last name');
  const course = required(body.course, 'Course');
  const yearLevel = required(body.yearLevel, 'Year level');
  const visitType = required(body.visitType, 'Visit type');
  const email = required(body.email, 'Email');
  const phone = required(body.phone, 'Phone');
  const now = nowIso();
  const intakes = readIntakes();
  const id = intakes.reduce((max, x) => Math.max(max, Number(x.id) || 0), 0) + 1;

  return {
    id,
    referenceNumber: generateReferenceNumber(),
    submittedAt: now,
    updatedAt: now,
    firstName,
    lastName,
    course,
    yearLevel,
    visitType,
    referredBy: cleanText(body.referredBy),
    address: {
      street: cleanText(body.streetAddress),
      city: cleanText(body.city),
      province: cleanText(body.province),
      postalCode: cleanText(body.postalCode)
    },
    dob: cleanText(body.dob),
    maritalStatus: cleanText(body.maritalStatus),
    email,
    phone,
    religion: cleanText(body.religion),
    messenger: cleanText(body.messenger),
    emergency: {
      name: cleanText(body.emergencyName),
      relationship: cleanText(body.emergencyRelationship),
      phone: cleanText(body.emergencyPhone)
    },
    medicalHistory: Array.isArray(body.medicalHistory) ? body.medicalHistory.map(cleanText).filter(Boolean) : [],
    familyHistory: cleanText(body.familyHistory),
    substanceUse: body.substanceUse && typeof body.substanceUse === 'object' ? body.substanceUse : {},
    prescriptionMedication: cleanText(body.prescriptionMedication),
    medicationDetails: cleanText(body.medicationDetails),
    surgery: cleanText(body.surgery),
    surgeryDetails: cleanText(body.surgeryDetails),
    visitReason: cleanText(body.visitReason),
    expectations: cleanText(body.expectations),
    sleepHours: body.sleepHours === '' || body.sleepHours === undefined ? null : Number(body.sleepHours),
    previousCounseling: cleanText(body.previousCounseling),
    counselingReason: cleanText(body.counselingReason),
    additionalComments: cleanText(body.additionalComments),
    schedulePreference: cleanText(body.schedulePreference),
    todayTime: cleanText(body.todayTime),
    preferredDate: cleanText(body.preferredDate),
    preferredTime: cleanText(body.preferredTime),
    status: 'Pending Review',
    assignedCounselor: '',
    appointmentDate: '',
    appointmentTime: '',
    notificationStatus: 'Not Sent',
    notifiedAt: '',
    confidentialNote: '',
    reviewedAt: '',
    reviewedBy: ''
  };
}

async function handleApi(req, res, url) {
  const pathname = url.pathname;

  if (req.method === 'POST' && pathname === '/api/auth/login') {
    try {
      const body = await readRequestBody(req);
      const email = cleanText(body.email).toLowerCase();
      const password = cleanText(body.password);
      const staff = readJson(STAFF_FILE, []);
      const user = staff.find(item => item.email.toLowerCase() === email);

      if (!user || !verifyPassword(password, user.passwordHash)) {
        return json(res, 401, { error: 'Invalid email or password.' });
      }

      const sid = randomId();
      sessions.set(sid, {
        staff: { id: user.id, email: user.email, name: user.name, role: user.role },
        expiresAt: Date.now() + SESSION_TTL_MS
      });

      res.writeHead(200, {
        'Content-Type': 'application/json; charset=utf-8',
        'Set-Cookie': `sid=${sid}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${SESSION_TTL_MS / 1000}`
      });
      return res.end(JSON.stringify({ user: { id: user.id, email: user.email, name: user.name, role: user.role } }));
    } catch (error) {
      return json(res, 400, { error: error.message });
    }
  }

  if (req.method === 'POST' && pathname === '/api/auth/logout') {
    const current = getSession(req);
    if (current) sessions.delete(current.sid);
    res.writeHead(200, {
      'Content-Type': 'application/json; charset=utf-8',
      'Set-Cookie': 'sid=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0'
    });
    return res.end(JSON.stringify({ success: true }));
  }

  if (req.method === 'GET' && pathname === '/api/auth/me') {
    const current = getSession(req);
    if (!current) return json(res, 401, { error: 'Not authenticated.' });
    return json(res, 200, { user: current.session.staff });
  }

  if (req.method === 'POST' && pathname === '/api/intakes') {
    try {
      const body = await readRequestBody(req);
      const intake = makeIntakeFromBody(body);
      const intakes = readIntakes();
      intakes.push(intake);
      writeIntakes(intakes);
      return json(res, 201, { success: true, referenceNumber: intake.referenceNumber, intake });
    } catch (error) {
      return json(res, 400, { error: error.message || 'Unable to submit intake.' });
    }
  }

  if (pathname.startsWith('/api/intakes') || pathname === '/api/dashboard/metrics') {
    const current = requireStaff(req, res);
    if (!current) return;

    if (req.method === 'GET' && pathname === '/api/intakes') {
      const intakes = readIntakes().sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
      return json(res, 200, { intakes });
    }

    if (req.method === 'GET' && pathname === '/api/dashboard/metrics') {
      const intakes = readIntakes();
      const today = new Date().toISOString().slice(0, 10);
      return json(res, 200, {
        pending: intakes.filter(x => x.status === 'Pending Review').length,
        appointmentsToday: intakes.filter(x => x.status === 'Scheduled' && x.appointmentDate === today).length,
        activeClients: intakes.filter(x => x.status === 'Scheduled' || x.status === 'Reviewed').length
      });
    }

    const match = pathname.match(/^\/api\/intakes\/(\d+)(?:\/(schedule|notes|notification))?$/);
    if (!match) return json(res, 404, { error: 'API route not found.' });

    const id = Number(match[1]);
    const action = match[2];
    const found = findIntake(id);

    if (found.index < 0) return json(res, 404, { error: 'Intake not found.' });

    if (req.method === 'GET' && !action) {
      return json(res, 200, { intake: found.intakes[found.index] });
    }

    if (req.method === 'POST' && action === 'schedule') {
      try {
        const body = await readRequestBody(req);
        const appointmentDate = required(body.appointmentDate, 'Appointment date');
        const appointmentTime = required(body.appointmentTime, 'Appointment time');
        const assignedCounselor = cleanText(body.assignedCounselor) || current.session.staff.name;
        const intake = found.intakes[found.index];
        intake.status = 'Scheduled';
        intake.assignedCounselor = assignedCounselor;
        intake.appointmentDate = appointmentDate;
        intake.appointmentTime = appointmentTime;
        intake.reviewedAt = nowIso();
        intake.reviewedBy = current.session.staff.name;
        intake.updatedAt = intake.reviewedAt;
        writeIntakes(found.intakes);
        return json(res, 200, { success: true, intake });
      } catch (error) {
        return json(res, 400, { error: error.message });
      }
    }

    if (req.method === 'POST' && action === 'notes') {
      try {
        const body = await readRequestBody(req);
        const note = required(body.note, 'Confidential note');
        const intake = found.intakes[found.index];
        intake.confidentialNote = note;
        intake.updatedAt = nowIso();
        writeIntakes(found.intakes);
        return json(res, 200, { success: true, intake });
      } catch (error) {
        return json(res, 400, { error: error.message });
      }
    }

    if (req.method === 'POST' && action === 'notification') {
      const intake = found.intakes[found.index];
      intake.notificationStatus = 'Recorded';
      intake.notifiedAt = nowIso();
      intake.updatedAt = intake.notifiedAt;
      writeIntakes(found.intakes);
      return json(res, 200, {
        success: true,
        message: 'Notification status recorded. Actual email/SMS delivery is not connected in this prototype.',
        intake
      });
    }

    return json(res, 405, { error: 'Method not allowed.' });
  }

  return json(res, 404, { error: 'API route not found.' });
}

function safePublicPath(requestPath) {
  let decoded;
  try {
    decoded = decodeURIComponent(requestPath);
  } catch {
    return null;
  }
  const relative = decoded === '/' ? 'counseling.html' : decoded.replace(/^\//, '');
  const full = path.normalize(path.join(PUBLIC_DIR, relative));
  if (!full.startsWith(PUBLIC_DIR)) return null;
  return full;
}

function serveStatic(req, res) {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  let requestPath = url.pathname;

  if (requestPath === '/office') requestPath = '/counseling-office.html';
  if (requestPath === '/staff-login') requestPath = '/staff-login.html';

  const filePath = safePublicPath(requestPath);
  if (!filePath) return text(res, 400, 'Bad request.');

  fs.stat(filePath, (error, stats) => {
    if (error || !stats.isFile()) return text(res, 404, 'Not found.');
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      'Content-Type': MIME_TYPES[ext] || 'application/octet-stream',
      'Cache-Control': 'no-cache'
    });
    fs.createReadStream(filePath).pipe(res);
  });
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

    if (url.pathname.startsWith('/api/')) {
      return await handleApi(req, res, url);
    }

    if (req.method === 'GET' && url.pathname === '/office') {
      const current = getSession(req);
      if (!current) return redirect(res, '/staff-login');
    }

    if (req.method === 'GET' || req.method === 'HEAD') {
      return serveStatic(req, res);
    }

    return text(res, 405, 'Method not allowed.');
  } catch (error) {
    console.error(error);
    if (!res.headersSent) json(res, 500, { error: 'Internal server error.' });
    else res.end();
  }
});

server.listen(PORT, () => {
  console.log('University Counseling backend is running.');
  console.log(`Student intake: http://localhost:${PORT}/`);
  console.log(`Staff login:    http://localhost:${PORT}/staff-login`);
  console.log(`Staff office:   http://localhost:${PORT}/office`);
  console.log('Demo staff: counselor@university.edu / Counselor123!');
  console.log(`Data files: ${DATA_DIR}`);
});
