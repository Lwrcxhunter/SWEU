<?php

namespace App\Services;

use App\Models\Appointment;
use App\Models\CounselingCase;
use App\Models\CounselingSession;
use App\Models\OfficeAlert;
use App\Models\Student;
use App\Models\TestingRequest;
use App\Models\User;
use App\Support\Ids;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use MongoDB\BSON\UTCDateTime;

class DemoDataSeeder
{
    public function __construct(
        private readonly CounselingCases $counselingCasesService
    ) {}

    public function run(?callable $logger = null): void
    {
        $log = $logger ?? fn (string $msg) => null;
        $log('Initializing realistic BukSU demo data generation...');

        // 1. Fetch Key Staff & Counselor Users
        $staffUser = User::where('email', 'staff@buksu.edu.ph')->first();
        $facultyUser = User::where('email', 'faculty@buksu.edu.ph')->first();
        $demoStudentUser = User::where('email', 'student@student.buksu.edu.ph')->first();

        $counselors = [
            'hananeel' => User::where('email', 'hananeel.cabiling@buksu.edu.ph')->first(),
            'helena' => User::where('email', 'helena.praile@buksu.edu.ph')->first(),
            'artemis' => User::where('email', 'artemis.labrador@buksu.edu.ph')->first(),
            'evangeline' => User::where('email', 'evangeline@buksu.edu.ph')->first(),
            'lora' => User::where('email', 'lora.anar@buksu.edu.ph')->first(),
            'jennylyn' => User::where('email', 'jennylyn.casino@buksu.edu.ph')->first(),
            'ebbeth' => User::where('email', 'ebbeth.barcero@buksu.edu.ph')->first(),
            'general' => User::where('email', 'counselor@buksu.edu.ph')->first(),
        ];

        // 2. Define Realistic BukSU Students
        $studentsData = [
            [
                'email' => 'student@student.buksu.edu.ph',
                'full_name' => 'Mark Lester D. Alcantara',
                'school_id' => '2023-01429',
                'college_code' => 'COT',
                'college_name' => 'College of Technologies',
                'program' => 'Bachelor of Science in Information Technology (BSIT)',
                'year_level' => 3,
                'phone' => '09175421982',
                'dob' => '2004-03-15',
                'emergency_name' => 'Lourdes Alcantara',
                'emergency_rel' => 'Mother',
                'emergency_phone' => '09183349011',
                'address' => ['city_municipality' => 'Malaybalay City', 'province' => 'Bukidnon', 'barangay' => 'Barangay 1', 'street_subdivision' => 'Fortich St.', 'zip_code' => '8700'],
                'concerns' => ['Academic difficulty', 'Balancing coursework with capstone project'],
            ],
            [
                'email' => 'christian.delrosario@student.buksu.edu.ph',
                'full_name' => 'Christian Paul B. Del Rosario',
                'school_id' => '2024-03190',
                'college_code' => 'COT',
                'college_name' => 'College of Technologies',
                'program' => 'Bachelor of Science in Electronics Technology (BSET)',
                'year_level' => 2,
                'phone' => '09168923401',
                'dob' => '2005-08-20',
                'emergency_name' => 'Elena Del Rosario',
                'emergency_rel' => 'Mother',
                'emergency_phone' => '09194448821',
                'address' => ['city_municipality' => 'Malaybalay City', 'province' => 'Bukidnon', 'barangay' => 'Barangay 9', 'street_subdivision' => 'Sayre Highway', 'zip_code' => '8700'],
                'concerns' => ['High test anxiety', 'Panic symptoms before examinations'],
            ],
            [
                'email' => 'kyle.gomez@student.buksu.edu.ph',
                'full_name' => 'Kyle Nicole P. Gomez',
                'school_id' => '2024-00215',
                'college_code' => 'COT',
                'college_name' => 'College of Technologies',
                'program' => 'Bachelor of Entertainment and Multimedia Computing (BEMC)',
                'year_level' => 1,
                'phone' => '09274118930',
                'dob' => '2006-01-11',
                'emergency_name' => 'Nestor Gomez',
                'emergency_rel' => 'Father',
                'emergency_phone' => '09205551234',
                'address' => ['city_municipality' => 'Valencia City', 'province' => 'Bukidnon', 'barangay' => 'Poblacion', 'street_subdivision' => 'Purok 4', 'zip_code' => '8709'],
                'concerns' => ['Adjustment to university life', 'Dormitory transition'],
            ],
            [
                'email' => 'princess.villaluz@student.buksu.edu.ph',
                'full_name' => 'Princess Mae G. Villaluz',
                'school_id' => '2023-02188',
                'college_code' => 'CON',
                'college_name' => 'College of Nursing',
                'program' => 'Bachelor of Science in Nursing (BSN)',
                'year_level' => 3,
                'phone' => '09053329012',
                'dob' => '2004-11-28',
                'emergency_name' => 'Gloria Villaluz',
                'emergency_rel' => 'Mother',
                'emergency_phone' => '09081124433',
                'address' => ['city_municipality' => 'Malaybalay City', 'province' => 'Bukidnon', 'barangay' => 'Casisang', 'street_subdivision' => 'Purok 2', 'zip_code' => '8700'],
                'concerns' => ['Clinical rotation fatigue', 'Considering shifting course'],
            ],
            [
                'email' => 'rhea.salcedo@student.buksu.edu.ph',
                'full_name' => 'Rhea Jane M. Salcedo',
                'school_id' => '2022-01994',
                'college_code' => 'CON',
                'college_name' => 'College of Nursing',
                'program' => 'Bachelor of Science in Nursing (BSN)',
                'year_level' => 4,
                'phone' => '09392217788',
                'dob' => '2003-09-04',
                'emergency_name' => 'Rolando Salcedo',
                'emergency_rel' => 'Father',
                'emergency_phone' => '09178890012',
                'address' => ['city_municipality' => 'Maramag', 'province' => 'Bukidnon', 'barangay' => 'Base Camp', 'street_subdivision' => 'Zone 3', 'zip_code' => '8714'],
                'concerns' => ['Board exam preparation anxiety', 'Post-graduate career planning'],
            ],
            [
                'email' => 'johncarlo.mendoza@student.buksu.edu.ph',
                'full_name' => 'John Carlo E. Mendoza',
                'school_id' => '2025-00112',
                'college_code' => 'CAS',
                'college_name' => 'College of Arts and Sciences',
                'program' => 'Bachelor of Arts in English Language (BAEL)',
                'year_level' => 1,
                'phone' => '09216654321',
                'dob' => '2006-04-18',
                'emergency_name' => 'Marites Mendoza',
                'emergency_rel' => 'Mother',
                'emergency_phone' => '09223345566',
                'address' => ['city_municipality' => 'Malaybalay City', 'province' => 'Bukidnon', 'barangay' => 'Sumpong', 'street_subdivision' => 'Magsaysay St.', 'zip_code' => '8700'],
                'concerns' => ['Time management', 'Public speaking confidence'],
            ],
            [
                'email' => 'angelica.tan@student.buksu.edu.ph',
                'full_name' => 'Angelica Rose S. Tan',
                'school_id' => '2024-01552',
                'college_code' => 'CAS',
                'college_name' => 'College of Arts and Sciences',
                'program' => 'Bachelor of Science in Development Communication (BSDevCom)',
                'year_level' => 2,
                'phone' => '09157789900',
                'dob' => '2005-06-25',
                'emergency_name' => 'Arthur Tan',
                'emergency_rel' => 'Father',
                'emergency_phone' => '09182234455',
                'address' => ['city_municipality' => 'Malaybalay City', 'province' => 'Bukidnon', 'barangay' => 'Kalasungay', 'street_subdivision' => 'Purok 1', 'zip_code' => '8700'],
                'concerns' => ['Group project communication conflicts', 'Academic motivation'],
            ],
            [
                'email' => 'stephanie.miranda@student.buksu.edu.ph',
                'full_name' => 'Stephanie Joy R. Miranda',
                'school_id' => '2022-00481',
                'college_code' => 'CAS',
                'college_name' => 'College of Arts and Sciences',
                'program' => 'Bachelor of Science in Environmental Science (BSES)',
                'year_level' => 4,
                'phone' => '09981239988',
                'dob' => '2003-12-09',
                'emergency_name' => 'Judith Miranda',
                'emergency_rel' => 'Mother',
                'emergency_phone' => '09294456677',
                'address' => ['city_municipality' => 'Impasugong', 'province' => 'Bukidnon', 'barangay' => 'Poblacion', 'street_subdivision' => 'Highway', 'zip_code' => '8702'],
                'concerns' => ['Thesis defense preparedness', 'Financial budgeting'],
            ],
            [
                'email' => 'joshua.ramos@student.buksu.edu.ph',
                'full_name' => 'Joshua Miguel T. Ramos',
                'school_id' => '2023-04102',
                'college_code' => 'COE',
                'college_name' => 'College of Education',
                'program' => 'Bachelor of Secondary Education - Major in English (BSEd-English)',
                'year_level' => 3,
                'phone' => '09478891122',
                'dob' => '2004-07-14',
                'emergency_name' => 'Corazon Ramos',
                'emergency_rel' => 'Mother',
                'emergency_phone' => '09167783344',
                'address' => ['city_municipality' => 'Malaybalay City', 'province' => 'Bukidnon', 'barangay' => 'Aglayan', 'street_subdivision' => 'Purok 6', 'zip_code' => '8700'],
                'concerns' => ['Teaching demonstration anxiety', 'Classroom management readiness'],
            ],
            [
                'email' => 'marygrace.bautista@student.buksu.edu.ph',
                'full_name' => 'Mary Grace L. Bautista',
                'school_id' => '2024-00833',
                'college_code' => 'COE',
                'college_name' => 'College of Education',
                'program' => 'Bachelor of Elementary Education (BEEd)',
                'year_level' => 2,
                'phone' => '09354432211',
                'dob' => '2005-02-19',
                'emergency_name' => 'Vicente Bautista',
                'emergency_rel' => 'Father',
                'emergency_phone' => '09271129900',
                'address' => ['city_municipality' => 'Valencia City', 'province' => 'Bukidnon', 'barangay' => 'Lumbo', 'street_subdivision' => 'Purok 5', 'zip_code' => '8709'],
                'concerns' => ['Homesickness', 'Family expectations and financial stress'],
            ],
            [
                'email' => 'kimberly.santos@student.buksu.edu.ph',
                'full_name' => 'Kimberly Ann F. Santos',
                'school_id' => '2022-03120',
                'college_code' => 'COBA',
                'college_name' => 'College of Business Administration',
                'program' => 'Bachelor of Science in Business Administration - Financial Management (BSBA-FM)',
                'year_level' => 4,
                'phone' => '09178823344',
                'dob' => '2003-10-30',
                'emergency_name' => 'Eduardo Santos',
                'emergency_rel' => 'Father',
                'emergency_phone' => '09179902211',
                'address' => ['city_municipality' => 'Malaybalay City', 'province' => 'Bukidnon', 'barangay' => 'Barangay 7', 'street_subdivision' => 'Carbajal St.', 'zip_code' => '8700'],
                'concerns' => ['Internship placement interview confidence', 'Work-life balance'],
            ],
            [
                'email' => 'daryl.ocampo@student.buksu.edu.ph',
                'full_name' => 'Daryl Jay C. Ocampo',
                'school_id' => '2023-01874',
                'college_code' => 'COBA',
                'college_name' => 'College of Business Administration',
                'program' => 'Bachelor of Science in Accountancy (BSA)',
                'year_level' => 3,
                'phone' => '09203345567',
                'dob' => '2004-05-08',
                'emergency_name' => 'Remedios Ocampo',
                'emergency_rel' => 'Mother',
                'emergency_phone' => '09156678899',
                'address' => ['city_municipality' => 'Malaybalay City', 'province' => 'Bukidnon', 'barangay' => 'San Jose', 'street_subdivision' => 'Purok 3', 'zip_code' => '8700'],
                'concerns' => ['Retention grade pressure', 'Study schedule optimization'],
            ],
            [
                'email' => 'jerome.manalo@student.buksu.edu.ph',
                'full_name' => 'Jerome Neil V. Manalo',
                'school_id' => '2024-02209',
                'college_code' => 'CPAG',
                'college_name' => 'College of Public Administration and Governance',
                'program' => 'Bachelor of Public Administration (BPA)',
                'year_level' => 2,
                'phone' => '09285543321',
                'dob' => '2005-03-22',
                'emergency_name' => 'Antonio Manalo',
                'emergency_rel' => 'Father',
                'emergency_phone' => '09217789900',
                'address' => ['city_municipality' => 'Malaybalay City', 'province' => 'Bukidnon', 'barangay' => 'Canayan', 'street_subdivision' => 'Sitio Sto. Nino', 'zip_code' => '8700'],
                'concerns' => ['Civic engagement workload', 'Leadership burnout'],
            ],
            [
                'email' => 'bea.navarro@student.buksu.edu.ph',
                'full_name' => 'Bea Patricia A. Navarro',
                'school_id' => '2023-00991',
                'college_code' => 'CPAG',
                'college_name' => 'College of Public Administration and Governance',
                'program' => 'Bachelor of Public Administration (BPA)',
                'year_level' => 3,
                'phone' => '09173321144',
                'dob' => '2004-08-12',
                'emergency_name' => 'Patricia Navarro',
                'emergency_rel' => 'Mother',
                'emergency_phone' => '09192231100',
                'address' => ['city_municipality' => 'Manolo Fortich', 'province' => 'Bukidnon', 'barangay' => 'Tankulan', 'street_subdivision' => 'Zone 1', 'zip_code' => '8703'],
                'concerns' => ['Public policy research difficulty', 'Career pathways in government'],
            ],
        ];

        $studentModels = [];
        foreach ($studentsData as $item) {
            $user = User::firstOrCreate(
                ['email' => $item['email']],
                [
                    'full_name' => $item['full_name'],
                    'password' => 'Password123!',
                    'role' => 'student',
                    'active' => true,
                ]
            );

            $dobDate = new UTCDateTime(new \DateTimeImmutable($item['dob']));
            $student = Student::firstOrNew(['school_id_number' => $item['school_id']]);
            $student->fill([
                'user_id' => Ids::object($user->id),
                'school_id_number' => $item['school_id'],
                'college' => [
                    'code' => $item['college_code'],
                    'name' => $item['college_name'],
                ],
                'year_level' => (int) $item['year_level'],
                'phone_number' => $item['phone'],
                'dob' => $dobDate,
                'marital_status' => 'Single',
                'personal_details' => [
                    'first_name' => explode(' ', $item['full_name'])[0],
                    'middle_name' => explode(' ', $item['full_name'])[1] ?? '',
                    'last_name' => explode(' ', $item['full_name'])[2] ?? '',
                    'school_id_number' => $item['school_id'],
                    'college' => $item['college_name'],
                    'program' => $item['program'],
                    'year_level' => (int) $item['year_level'],
                    'dob' => $dobDate,
                    'marital_status' => 'Single',
                    'phone_number' => $item['phone'],
                ],
                'address' => array_merge($item['address'], [
                    'state_province' => $item['address']['province'],
                    'city' => $item['address']['city_municipality'],
                    'street' => $item['address']['street_subdivision'],
                    'postal_zip' => $item['address']['zip_code'],
                ]),
                'emergency_contact' => [
                    'name' => $item['emergency_name'],
                    'relationship_to_client' => $item['emergency_rel'],
                    'phone' => $item['emergency_phone'],
                ],
                'intake_record' => [
                    'signed_agreement' => true,
                    'is_sworn_truthful' => true,
                    'submitted_at' => new UTCDateTime(now()),
                    'agreement_version' => '2026-01',
                    'living_condition' => 'Living with family / parents',
                    'personal_concerns' => $item['concerns'],
                ],
            ]);
            $student->save();
            $studentModels[$item['school_id']] = $student;
            $log("Created student profile: {$item['full_name']} ({$item['college_code']})");
        }

        // Clean out previous non-essential sample records to avoid duplicating on re-run
        Appointment::truncate();
        CounselingCase::truncate();
        CounselingSession::truncate();
        TestingRequest::truncate();
        OfficeAlert::truncate();
        DB::connection('mongodb')->getCollection('counseling_case_sequences')->drop();
        $log('Cleared existing appointment, case, and testing collections for fresh realistic seeding.');

        // 3. Seed Realistic Appointments
        $now = Carbon::parse('2026-10-25 10:00:00');

        $appointmentsConfig = [
            // --- ACTIVE / UPCOMING QUEUE ---
            [
                'student_key' => '2024-03190', // Christian Paul (COT)
                'counselor_key' => null,
                'channel' => 'face_to_face',
                'type' => 'walk_in',
                'urgency' => 'urgent',
                'date' => '2026-10-25',
                'time' => '10:15',
                'status' => 'pending_assignment',
                'created_at' => '2026-10-25 10:12:00',
                'reason' => 'Student arrived at front desk showing high acute anxiety and shortness of breath prior to major engineering exam. Needs immediate counselor dispatch.',
                'expectations' => 'Grounding and crisis stabilization support',
            ],
            [
                'student_key' => '2023-02188', // Princess Mae (CON)
                'counselor_key' => null,
                'channel' => 'face_to_face',
                'type' => 'walk_in',
                'urgency' => 'normal',
                'date' => '2026-10-25',
                'time' => '14:00',
                'status' => 'pending_assignment',
                'created_at' => '2026-10-25 09:40:00',
                'reason' => 'Inquiring about shift-of-program requirements and stress management related to clinical duties.',
                'expectations' => 'Clarification on shifting procedures and academic options',
            ],
            [
                'student_key' => '2023-04102', // Joshua Miguel Ramos (COE)
                'counselor_key' => null,
                'channel' => 'face_to_face',
                'type' => 'online_booking',
                'urgency' => 'normal',
                'date' => '2026-10-26',
                'time' => '09:30',
                'status' => 'pending_assignment',
                'created_at' => '2026-10-24 16:30:00',
                'reason' => 'Seeking guidance regarding teaching practicum readiness and presentation anxiety.',
                'expectations' => 'Actionable coaching on classroom confidence',
            ],
            [
                'student_key' => '2025-00112', // John Carlo Mendoza (CAS)
                'counselor_key' => 'helena',
                'channel' => 'face_to_face',
                'type' => 'online_booking',
                'urgency' => 'normal',
                'date' => '2026-10-26',
                'time' => '11:00',
                'status' => 'reassignment_requested',
                'created_at' => '2026-10-24 11:20:00',
                'reason' => 'Adjustment issues as a 1st year student living away from hometown.',
                'expectations' => 'Coping strategies for homesickness',
                'reassignment_note' => 'Student is an immediate family neighbor; requesting reassignment to another designated counselor per SWEU conflict of interest protocol.',
            ],
            [
                'student_key' => '2023-01874', // Daryl Jay Ocampo (COBA)
                'counselor_key' => 'hananeel',
                'channel' => 'face_to_face',
                'type' => 'online_booking',
                'urgency' => 'normal',
                'date' => '2026-10-26',
                'time' => '14:00',
                'status' => 'assigned_pending_counselor',
                'created_at' => '2026-10-24 14:10:00',
                'reason' => 'Consultation on retention grade requirements and study stress in Accountancy.',
                'expectations' => 'Study schedule planning and emotional reassurance',
            ],
            [
                'student_key' => '2022-01994', // Rhea Jane Salcedo (CON)
                'counselor_key' => 'artemis',
                'channel' => 'face_to_face',
                'type' => 'online_booking',
                'urgency' => 'normal',
                'date' => '2026-10-27',
                'time' => '13:30',
                'status' => 'assigned_pending_counselor',
                'created_at' => '2026-10-24 15:45:00',
                'reason' => 'Review of emotional preparedness for intensive hospital clinical shifts.',
                'expectations' => 'Coping techniques for clinical shift pressure',
            ],
            [
                'student_key' => '2023-01429', // Mark Lester Alcantara (COT) - Demo Student Account
                'counselor_key' => 'hananeel',
                'channel' => 'face_to_face',
                'type' => 'online_booking',
                'urgency' => 'normal',
                'date' => '2026-10-26',
                'time' => '10:30',
                'status' => 'counselor_accepted_pending_student',
                'created_at' => '2026-10-24 10:00:00',
                'counselor_accepted_at' => '2026-10-25 08:30:00',
                'reason' => 'Follow-up on academic time management and capstone stress reduction plan.',
                'expectations' => 'Review progress since previous session',
            ],
            [
                'student_key' => '2024-01552', // Angelica Rose Tan (CAS)
                'counselor_key' => 'jennylyn',
                'channel' => 'face_to_face',
                'type' => 'online_booking',
                'urgency' => 'normal',
                'date' => '2026-10-25',
                'time' => '14:00',
                'status' => 'confirmed',
                'created_at' => '2026-10-23 09:15:00',
                'counselor_accepted_at' => '2026-10-23 11:00:00',
                'student_accepted_at' => '2026-10-23 13:00:00',
                'reason' => 'Interpersonal conflict and communication challenges in group productions.',
                'expectations' => 'Constructive conflict resolution tools',
            ],
            [
                'student_key' => '2024-02209', // Jerome Neil Manalo (CPAG)
                'counselor_key' => 'helena',
                'channel' => 'face_to_face',
                'type' => 'online_booking',
                'urgency' => 'normal',
                'date' => '2026-10-28',
                'time' => '09:30',
                'status' => 'confirmed',
                'created_at' => '2026-10-24 08:30:00',
                'counselor_accepted_at' => '2026-10-24 09:30:00',
                'student_accepted_at' => '2026-10-24 10:15:00',
                'reason' => 'Leadership fatigue balancing student government duties with academic requirements.',
                'expectations' => 'Time allocation and workload delegation strategies',
            ],

            // --- HISTORICAL COMPLETED / CANCELLED ACCOMPLISHMENTS (OCTOBER 2026) ---
            [
                'student_key' => '2023-01429', // Mark Lester (COT)
                'counselor_key' => 'hananeel',
                'channel' => 'face_to_face',
                'type' => 'online_booking',
                'urgency' => 'normal',
                'date' => '2026-10-22',
                'time' => '09:30',
                'status' => 'completed',
                'created_at' => '2026-10-20 09:00:00',
                'reason' => 'Initial consultation on IT capstone workload balancing.',
                'expectations' => 'Guidance on project prioritization',
                'has_case' => true,
                'case_category' => 'academic',
                'session_note' => 'Student presented feeling overloaded by concurrent programming assignments and capstone documentation. Discussed Pomodoro time management and establishing clear study boundaries. Student developed a weekly timetable and reported reduced anxiety.',
            ],
            [
                'student_key' => '2022-03120', // Kimberly Ann Santos (COBA)
                'counselor_key' => 'hananeel',
                'channel' => 'face_to_face',
                'type' => 'online_booking',
                'urgency' => 'normal',
                'date' => '2026-10-20',
                'time' => '14:00',
                'status' => 'completed',
                'created_at' => '2026-10-17 11:30:00',
                'reason' => 'Career readiness and mock interview debriefing.',
                'expectations' => 'Confidence building for banking internship interviews',
                'has_case' => true,
                'case_category' => 'career',
                'session_note' => 'Reviewed student career aspirations in corporate financial management. Conducted behavioral interview practice and discussed strategies for addressing performance nervousness. Client demonstrated noticeable improvement in poise.',
            ],
            [
                'student_key' => '2022-00481', // Stephanie Joy Miranda (CAS)
                'counselor_key' => 'jennylyn',
                'channel' => 'face_to_face',
                'type' => 'online_booking',
                'urgency' => 'normal',
                'date' => '2026-10-18',
                'time' => '10:30',
                'status' => 'completed',
                'created_at' => '2026-10-15 14:00:00',
                'reason' => 'Senior thesis stress and field sampling exhaustion.',
                'expectations' => 'Stress mitigation plan',
            ],
            [
                'student_key' => '2024-00833', // Mary Grace Bautista (COE)
                'counselor_key' => 'evangeline',
                'channel' => 'face_to_face',
                'type' => 'online_booking',
                'urgency' => 'normal',
                'date' => '2026-10-15',
                'time' => '13:30',
                'status' => 'completed',
                'created_at' => '2026-10-12 10:15:00',
                'reason' => 'Homesickness and living in a boarding house away from family.',
                'expectations' => 'Adjustment support and emotional venting',
                'has_case' => true,
                'case_category' => 'personal_social',
                'session_note' => 'Client expressed feelings of isolation living alone in Malaybalay for the first time. Explored healthy coping mechanisms, scheduling routine video calls with family, and participating in college student interest groups.',
            ],
            [
                'student_key' => '2023-00991', // Bea Patricia Navarro (CPAG)
                'counselor_key' => 'helena',
                'channel' => 'face_to_face',
                'type' => 'online_booking',
                'urgency' => 'normal',
                'date' => '2026-10-12',
                'time' => '11:00',
                'status' => 'completed',
                'created_at' => '2026-10-09 13:00:00',
                'reason' => 'Public policy research difficulty and exam preparation.',
                'expectations' => 'Guidance on structured study techniques',
            ],
            [
                'student_key' => '2024-03190', // Christian Paul Del Rosario (COT)
                'counselor_key' => 'hananeel',
                'channel' => 'face_to_face',
                'type' => 'walk_in',
                'urgency' => 'normal',
                'date' => '2026-10-10',
                'time' => '15:00',
                'status' => 'completed',
                'created_at' => '2026-10-10 14:45:00',
                'reason' => 'Walk-in consultation regarding academic motivation in engineering subjects.',
                'expectations' => 'Clarification on academic tutoring resources',
            ],
            [
                'student_key' => '2024-00215', // Kyle Nicole Gomez (COT)
                'counselor_key' => 'lora',
                'channel' => 'face_to_face',
                'type' => 'online_booking',
                'urgency' => 'normal',
                'date' => '2026-10-08',
                'time' => '09:00',
                'status' => 'completed',
                'created_at' => '2026-10-05 08:30:00',
                'reason' => 'Freshman transition and multimedia software learning curve.',
                'expectations' => 'Encouragement and guidance resources',
            ],
            [
                'student_key' => '2023-02188', // Princess Mae Villaluz (CON)
                'counselor_key' => 'artemis',
                'channel' => 'face_to_face',
                'type' => 'online_booking',
                'urgency' => 'normal',
                'date' => '2026-10-05',
                'time' => '14:00',
                'status' => 'cancelled',
                'created_at' => '2026-10-02 16:00:00',
                'reason' => 'Clinical hospital shift conflict.',
                'expectations' => 'Rescheduling consultation',
            ],

            // --- SEPTEMBER 2026 (LAST MONTH) ---
            [
                'student_key' => '2022-01994', // Rhea Jane Salcedo (CON)
                'counselor_key' => 'artemis',
                'channel' => 'face_to_face',
                'type' => 'online_booking',
                'urgency' => 'normal',
                'date' => '2026-09-26',
                'time' => '10:00',
                'status' => 'completed',
                'created_at' => '2026-09-23 11:00:00',
                'reason' => 'Coping with intense pre-board review and fatigue.',
                'expectations' => 'Mental resilience and stress management tools',
            ],
            [
                'student_key' => '2025-00112', // John Carlo Mendoza (CAS)
                'counselor_key' => 'jennylyn',
                'channel' => 'face_to_face',
                'type' => 'online_booking',
                'urgency' => 'normal',
                'date' => '2026-09-22',
                'time' => '14:30',
                'status' => 'completed',
                'created_at' => '2026-09-19 14:00:00',
                'reason' => 'Freshman adaptation and study techniques in literature courses.',
                'expectations' => 'Guidance on reading comprehension pace',
            ],
            [
                'student_key' => '2023-04102', // Joshua Miguel Ramos (COE)
                'counselor_key' => 'lora',
                'channel' => 'face_to_face',
                'type' => 'online_booking',
                'urgency' => 'normal',
                'date' => '2026-09-18',
                'time' => '09:30',
                'status' => 'completed',
                'created_at' => '2026-09-15 10:30:00',
                'reason' => 'Public speaking jitters during class reporting.',
                'expectations' => 'Confidence coaching and breathing techniques',
            ],
            [
                'student_key' => '2023-01874', // Daryl Jay Ocampo (COBA)
                'counselor_key' => 'hananeel',
                'channel' => 'face_to_face',
                'type' => 'walk_in',
                'urgency' => 'normal',
                'date' => '2026-09-15',
                'time' => '13:30',
                'status' => 'completed',
                'created_at' => '2026-09-15 13:15:00',
                'reason' => 'Walk-in inquiry on academic peer tutor matching.',
                'expectations' => 'Information on college study assistance circles',
            ],
            [
                'student_key' => '2024-02209', // Jerome Neil Manalo (CPAG)
                'counselor_key' => 'helena',
                'channel' => 'face_to_face',
                'type' => 'online_booking',
                'urgency' => 'normal',
                'date' => '2026-09-10',
                'time' => '11:00',
                'status' => 'completed',
                'created_at' => '2026-09-07 09:00:00',
                'reason' => 'Balancing student organization initiatives with academic workload.',
                'expectations' => 'Organizational time management',
            ],
            [
                'student_key' => '2024-01552', // Angelica Rose Tan (CAS)
                'counselor_key' => 'jennylyn',
                'channel' => 'face_to_face',
                'type' => 'online_booking',
                'urgency' => 'normal',
                'date' => '2026-09-04',
                'time' => '15:00',
                'status' => 'completed',
                'created_at' => '2026-09-01 10:00:00',
                'reason' => 'Exploring career directions in community development broadcasting.',
                'expectations' => 'Career alignment guidance',
            ],

            // --- AUGUST 2026 (START OF 1ST SEMESTER 2026-2027) ---
            [
                'student_key' => '2022-03120', // Kimberly Ann Santos (COBA)
                'counselor_key' => 'hananeel',
                'channel' => 'face_to_face',
                'type' => 'online_booking',
                'urgency' => 'normal',
                'date' => '2026-08-28',
                'time' => '10:30',
                'status' => 'completed',
                'created_at' => '2026-08-25 09:30:00',
                'reason' => 'Semester kickoff planning and course load review.',
                'expectations' => 'Academic roadmap verification',
            ],
            [
                'student_key' => '2023-01429', // Mark Lester (COT)
                'counselor_key' => 'hananeel',
                'channel' => 'face_to_face',
                'type' => 'online_booking',
                'urgency' => 'normal',
                'date' => '2026-08-24',
                'time' => '09:00',
                'status' => 'completed',
                'created_at' => '2026-08-21 11:00:00',
                'reason' => 'Setting academic goals for junior year.',
                'expectations' => 'Goal setting and accountability strategy',
            ],
            [
                'student_key' => '2024-00833', // Mary Grace Bautista (COE)
                'counselor_key' => 'evangeline',
                'channel' => 'face_to_face',
                'type' => 'online_booking',
                'urgency' => 'normal',
                'date' => '2026-08-19',
                'time' => '14:00',
                'status' => 'completed',
                'created_at' => '2026-08-16 13:00:00',
                'reason' => 'Transitioning back to school after summer vacation.',
                'expectations' => 'Routine re-establishment',
            ],
            [
                'student_key' => '2022-00481', // Stephanie Joy Miranda (CAS)
                'counselor_key' => 'jennylyn',
                'channel' => 'face_to_face',
                'type' => 'online_booking',
                'urgency' => 'normal',
                'date' => '2026-08-12',
                'time' => '13:30',
                'status' => 'completed',
                'created_at' => '2026-08-09 10:00:00',
                'reason' => 'Initial inquiry on graduation clearance requirements.',
                'expectations' => 'Guidance office checklist clarification',
            ],

            // --- JUNE - JULY 2026 (MIDYEAR / SUMMER TERM) ---
            [
                'student_key' => '2023-00991', // Bea Patricia Navarro (CPAG)
                'counselor_key' => 'helena',
                'channel' => 'face_to_face',
                'type' => 'online_booking',
                'urgency' => 'normal',
                'date' => '2026-07-16',
                'time' => '10:00',
                'status' => 'completed',
                'created_at' => '2026-07-13 14:00:00',
                'reason' => 'Summer term internship inquiries.',
                'expectations' => 'Practicum guidance',
            ],
            [
                'student_key' => '2024-00215', // Kyle Nicole Gomez (COT)
                'counselor_key' => 'lora',
                'channel' => 'face_to_face',
                'type' => 'online_booking',
                'urgency' => 'normal',
                'date' => '2026-07-08',
                'time' => '14:30',
                'status' => 'completed',
                'created_at' => '2026-07-05 11:00:00',
                'reason' => 'Exploring graphic animation specializations.',
                'expectations' => 'Career elective counseling',
            ],
            [
                'student_key' => '2024-03190', // Christian Paul Del Rosario (COT)
                'counselor_key' => 'hananeel',
                'channel' => 'face_to_face',
                'type' => 'online_booking',
                'urgency' => 'normal',
                'date' => '2026-06-24',
                'time' => '09:30',
                'status' => 'completed',
                'created_at' => '2026-06-21 09:00:00',
                'reason' => 'Review of sophomore technical electives.',
                'expectations' => 'Curriculum advice',
            ],
            [
                'student_key' => '2022-01994', // Rhea Jane Salcedo (CON)
                'counselor_key' => 'artemis',
                'channel' => 'face_to_face',
                'type' => 'online_booking',
                'urgency' => 'normal',
                'date' => '2026-06-11',
                'time' => '11:00',
                'status' => 'completed',
                'created_at' => '2026-06-08 10:30:00',
                'reason' => 'Midyear hospital exposure reflection.',
                'expectations' => 'Debriefing on first hospital duty',
            ],
        ];

        foreach ($appointmentsConfig as $cfg) {
            $student = $studentModels[$cfg['student_key']];
            $counselor = $cfg['counselor_key'] ? $counselors[$cfg['counselor_key']] : null;
            $slotKey = null;

            if ($counselor && in_array($cfg['status'], ['assigned_pending_counselor', 'counselor_accepted_pending_student', 'confirmed'])) {
                $slotKey = "{$counselor->id}:{$cfg['date']}:{$cfg['time']}";
            }

            $createdAt = Carbon::parse($cfg['created_at']);
            $appointment = new Appointment([
                'student_id' => Ids::object($student->id),
                'counselor_id' => $counselor ? Ids::object($counselor->id) : null,
                'channel' => $cfg['channel'],
                'type' => $cfg['type'],
                'urgency_level' => $cfg['urgency'],
                'scheduled_date' => $cfg['date'],
                'scheduled_time' => $cfg['time'],
                'status' => $cfg['status'],
                'version' => 1,
                'slot_key' => $slotKey,
                'onboarding_note' => $counselor ? "Assigned to {$counselor->full_name}." : null,
                'reassignment_note' => $cfg['reassignment_note'] ?? null,
                'counselor_accepted_at' => $cfg['counselor_accepted_at'] ?? null,
                'student_accepted_at' => $cfg['student_accepted_at'] ?? null,
                'initial_visit_questionnaire' => [
                    'reason' => $cfg['reason'],
                    'expectations' => $cfg['expectations'],
                    'average_sleep' => '6-7 hours',
                    'prior_consultation' => false,
                    'prior_consultation_details' => null,
                    'additional_comments' => null,
                ],
                'signature' => [
                    'type' => 'typed',
                    'data' => $student->personal_details['first_name'] . ' ' . $student->personal_details['last_name'],
                ],
                'signed_at' => new UTCDateTime($createdAt->copy()->subMinutes(5)),
            ]);
            $appointment->created_at = new UTCDateTime($createdAt);
            $appointment->updated_at = new UTCDateTime($createdAt);
            $appointment->save();

            // Create Case & Session if specified
            if (! empty($cfg['has_case']) && $counselor) {
                $case = $this->counselingCasesService->createCaseFromAppointment($appointment);
                $case->update([
                    'category' => $cfg['case_category'] ?? 'academic',
                    'status' => $cfg['status'] === 'completed' ? 'closed' : 'open',
                    'opened_at' => $cfg['created_at'],
                    'closed_at' => $cfg['status'] === 'completed' ? "{$cfg['date']} {$cfg['time']}:00" : null,
                    'closed_reason' => $cfg['status'] === 'completed' ? 'completed/stable' : null,
                    'outcome' => $cfg['status'] === 'completed' ? 'Student achieved goal, established actionable study/coping strategy, and reported high confidence.' : null,
                ]);

                $session = CounselingSession::where('appointment_id', Ids::object($appointment->id))->first();
                if ($session) {
                    $session->update([
                        'status' => $cfg['status'],
                        'completed_at' => $cfg['status'] === 'completed' ? "{$cfg['date']} {$cfg['time']}:00" : null,
                        'encrypted_session_notes' => $cfg['session_note'] ?? 'Session completed successfully. Explored client challenges, collaboratively designed solutions, and affirmed strengths.',
                    ]);
                }
            }
        }
        $log('Seeded 28 realistic appointments, counseling cases, and sessions across 5 colleges.');

        // 4. Seed Standardized Testing Requests (5 Requests: 2 pending, 2 approved, 1 completed)
        $testingData = [
            [
                'requester_user' => $facultyUser,
                'requester_name' => 'Prof. Jonathan M. Morales',
                'requester_position' => 'College Internship Coordinator',
                'requester_email' => $facultyUser->email,
                'college' => 'CON',
                'program' => 'Bachelor of Science in Nursing (BSN)',
                'year_level' => '4th Year',
                'student_count' => 48,
                'purpose' => 'Pre-Clinical Practicum & Hospital Duty Psychological Readiness Battery',
                'test_type' => '16PF (Sixteen Personality Factor Questionnaire)',
                'details' => 'Mandatory psychological screening for Level IV student nurses prior to hospital deployment at Bukidnon Provincial Hospital.',
                'status' => 'pending',
                'preferred_date' => '2026-11-10',
                'preferred_session' => 'AM',
                'requested_at' => '2026-10-23 14:00:00',
            ],
            [
                'requester_user' => User::where('email', 'rhea.salcedo@student.buksu.edu.ph')->first(),
                'requester_name' => 'Rhea Jane M. Salcedo',
                'requester_position' => 'Undergraduate Student',
                'requester_email' => 'rhea.salcedo@student.buksu.edu.ph',
                'college' => 'CON',
                'program' => 'Bachelor of Science in Nursing (BSN)',
                'year_level' => '4th Year',
                'student_count' => 1,
                'purpose' => 'Provincial Scholarship Application Psychological Clearance',
                'test_type' => "Raven's Standard Progressive Matrices (SPM)",
                'details' => 'Requirement for Bukidnon Provincial Government Higher Education Grant clearance certificate.',
                'status' => 'pending',
                'preferred_date' => '2026-11-04',
                'preferred_session' => 'PM',
                'requested_at' => '2026-10-24 09:15:00',
            ],
            [
                'requester_user' => $facultyUser,
                'requester_name' => 'Dr. Carmela S. Beltran',
                'requester_position' => 'Department Chair',
                'requester_email' => 'faculty@buksu.edu.ph',
                'college' => 'COE',
                'program' => 'Bachelor of Elementary Education (BEEd)',
                'year_level' => '3rd Year',
                'student_count' => 35,
                'purpose' => 'Pre-Service Practice Teaching Readiness Assessment',
                'test_type' => 'OLSAT (Otis-Lennon School Ability Test)',
                'details' => 'Evaluation of 3rd year teaching candidates before off-campus practice teaching assignments in Malaybalay school districts.',
                'status' => 'approved',
                'preferred_date' => '2026-11-05',
                'preferred_session' => 'AM',
                'requested_at' => '2026-10-18 10:30:00',
            ],
            [
                'requester_user' => $facultyUser,
                'requester_name' => 'Prof. Arnold T. Vega',
                'requester_position' => 'Academic Program Head',
                'requester_email' => 'faculty@buksu.edu.ph',
                'college' => 'CAS',
                'program' => 'Bachelor of Science in Development Communication (BSDevCom)',
                'year_level' => '2nd Year',
                'student_count' => 28,
                'purpose' => 'Career Track & Media Specialization Alignment',
                'test_type' => 'MBTI Career Alignment',
                'details' => 'Profiling sophomore students for upcoming specialization track selection (Broadcast, Print, or Community Dev).',
                'status' => 'approved',
                'preferred_date' => '2026-11-12',
                'preferred_session' => 'Whole Day',
                'requested_at' => '2026-10-15 15:45:00',
            ],
            [
                'requester_user' => $facultyUser,
                'requester_name' => 'Engr. Rogelio F. Dizon',
                'requester_position' => 'COT Guidance Liaison',
                'requester_email' => 'faculty@buksu.edu.ph',
                'college' => 'COT',
                'program' => 'Bachelor of Science in Information Technology (BSIT)',
                'year_level' => '1st Year',
                'student_count' => 60,
                'purpose' => 'Freshmen Cognitive Profiling and Academic Aptitude',
                'test_type' => 'OLSAT (Otis-Lennon School Ability Test)',
                'details' => 'Institutional profiling for incoming IT freshmen cohort batch 2026.',
                'status' => 'completed',
                'preferred_date' => '2026-09-15',
                'preferred_session' => 'AM',
                'requested_at' => '2026-09-02 08:30:00',
            ],
        ];

        foreach ($testingData as $item) {
            $reqDate = Carbon::parse($item['requested_at']);
            $testing = new TestingRequest([
                'requester_user_id' => Ids::object($item['requester_user']->id),
                'requester_name' => $item['requester_name'],
                'requester_position' => $item['requester_position'],
                'requester_email' => $item['requester_email'],
                'college' => $item['college'],
                'program' => $item['program'],
                'year_level' => $item['year_level'],
                'student_count' => (int) $item['student_count'],
                'purpose' => $item['purpose'],
                'preferred_date' => $item['preferred_date'],
                'preferred_session' => $item['preferred_session'],
                'test_type' => $item['test_type'],
                'details' => $item['details'],
                'status' => $item['status'],
                'requested_at' => new UTCDateTime($reqDate),
            ]);
            $testing->created_at = new UTCDateTime($reqDate);
            $testing->updated_at = new UTCDateTime($reqDate);
            $testing->save();
        }
        $log('Seeded 5 realistic standardized psychological testing requests.');

        // 5. Seed Realistic Front-Desk & Counselor Alerts
        $urgentAppointment = Appointment::where('urgency_level', 'urgent')->first();
        $reassignAppointment = Appointment::where('status', 'reassignment_requested')->first();
        $newOnlineAppointment = Appointment::where('status', 'pending_assignment')->where('type', 'online_booking')->first();
        $studentAppointment = Appointment::where('status', 'counselor_accepted_pending_student')->first();

        if ($staffUser && $urgentAppointment) {
            OfficeAlert::create([
                'user_id' => Ids::object($staffUser->id),
                'appointment_id' => Ids::object($urgentAppointment->id),
                'kind' => 'urgent',
                'message' => 'CRISIS DISPATCH: Christian Paul B. Del Rosario (COT) is at the triage desk with high urgency status.',
                'read_at' => null,
            ]);
        }

        if ($staffUser && $reassignAppointment) {
            OfficeAlert::create([
                'user_id' => Ids::object($staffUser->id),
                'appointment_id' => Ids::object($reassignAppointment->id),
                'kind' => 'appointment',
                'message' => 'Maam Helena Praile requested reassignment: "Student is an immediate family neighbor; requesting reassignment..."',
                'read_at' => null,
            ]);
        }

        if ($staffUser && $newOnlineAppointment) {
            OfficeAlert::create([
                'user_id' => Ids::object($staffUser->id),
                'appointment_id' => Ids::object($newOnlineAppointment->id),
                'kind' => 'appointment',
                'message' => 'New online appointment request submitted by Joshua Miguel T. Ramos (COE) pending triage.',
                'read_at' => null,
            ]);
        }

        if ($counselors['hananeel']) {
            $assignedAppt = Appointment::where('counselor_id', Ids::object($counselors['hananeel']->id))
                ->where('status', 'assigned_pending_counselor')
                ->first();
            if ($assignedAppt) {
                OfficeAlert::create([
                    'user_id' => Ids::object($counselors['hananeel']->id),
                    'appointment_id' => Ids::object($assignedAppt->id),
                    'kind' => 'appointment',
                    'message' => 'New appointment assigned to you for Daryl Jay C. Ocampo on Oct 26 at 14:00.',
                    'read_at' => null,
                ]);
            }
        }

        if ($demoStudentUser && $studentAppointment) {
            OfficeAlert::create([
                'user_id' => Ids::object($demoStudentUser->id),
                'appointment_id' => Ids::object($studentAppointment->id),
                'kind' => 'appointment',
                'message' => 'Your counselor Sir Hananeel Cabiling accepted your appointment for Oct 26 at 10:30 AM. Please confirm your session.',
                'read_at' => null,
            ]);
        }
        $log('Seeded realistic operational notifications and alerts.');

        $log('All realistic BukSU demo data successfully seeded!');
    }
}
